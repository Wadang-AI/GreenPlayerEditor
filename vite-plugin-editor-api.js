// 绿玩编辑器 · AI 工作台接入（P0+P1）：本地排版服务只读通道 + Node 侧排版/导出
// 复用 vite.config.js 中 aiCorsProxyPlugin 的 middleware 模式，无新依赖、无新进程。
// 通道语义：只暴露"排版函数"（styles 枚举 / 渲染 URL 指引 / layout / export），不做远程控制编辑器状态。
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import zhMessages from './src/locales/zh.js'
import enMessages from './src/locales/en.js'
import { renderLayout, renderExport, STYLE_PRESETS, COLOR_THEMES, SPACING_PRESETS, THEME_DEFAULT_PRESET } from './vite-lv-render.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ---- 枚举白名单（与 src/App.vue、vite-lv-render.js 保持同一套值） ----
export const STYLE_PRESETS_PLUGIN = STYLE_PRESETS
export const COLOR_THEMES_PLUGIN = COLOR_THEMES
export const SPACING_PRESETS_PLUGIN = SPACING_PRESETS

export function isWhitelistedStyle(value) {
  return STYLE_PRESETS.includes(value)
}
export function isWhitelistedTheme(value) {
  return COLOR_THEMES.includes(value)
}
export function isWhitelistedSpacing(value) {
  return SPACING_PRESETS.includes(value)
}

const MAX_BODY_BYTES = 1024 * 1024 // 1MB

function isLoopback(address) {
  if (!address) return false
  const host = String(address).replace(/^::ffff:/, '').replace(/\[|\]/g, '')
  return host === '127.0.0.1' || host === '::1' || host === 'localhost'
}

/** 读取请求体，超过 MAX_BODY_BYTES 直接返回 null（P1 POST 端点复用） */
async function readBody(req) {
  let raw = ''
  let exceeded = false
  req.on('data', (chunk) => {
    raw += chunk
    if (raw.length > MAX_BODY_BYTES) exceeded = true
  })
  await new Promise((resolve, reject) => {
    req.on('end', resolve)
    req.on('error', reject)
  })
  return exceeded ? null : raw
}

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(payload))
}

function getVersion() {
  try {
    const pkg = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf8'))
    return pkg.version || '0.0.0'
  } catch {
    return '0.0.0'
  }
}

/** 基于实际监听端口生成本地基址，主机名固定 127.0.0.1（防 Host 头注入） */
function localBaseUrl(req) {
  const port = req.socket.localPort || 5173
  return `http://127.0.0.1:${port}`
}

/** 从 i18n 取风格/主题/间距的展示名与描述（中英双语），与 UI 永不漂移 */
function buildStyleCatalog() {
  const zh = zhMessages.stylePresets || {}
  const en = enMessages.stylePresets || {}
  const zhThemes = zhMessages.colorThemes || {}
  const enThemes = enMessages.colorThemes || {}
  const zhSpacing = zhMessages.spacingPresets || {}
  const enSpacing = enMessages.spacingPresets || {}

  const styles = STYLE_PRESETS.map((value) => ({
    value,
    name: { zh: zh[value] || value, en: en[value] || value },
    desc: { zh: zh[`${value}Desc`] || '', en: en[`${value}Desc`] || '' }
  }))

  const themes = COLOR_THEMES.map((value) => ({
    value,
    name: { zh: zhThemes[value] || value, en: enThemes[value] || value }
  }))

  const spacing = SPACING_PRESETS.map((value) => ({
    value,
    name: { zh: zhSpacing[value] || value, en: enSpacing[value] || value }
  }))

  return { styles, themes, spacing, themeDefaultPreset: THEME_DEFAULT_PRESET }
}

export function editorApiPlugin() {
  const version = getVersion()
  const catalog = buildStyleCatalog()

  return {
    name: 'lv-editor-api',
    configureServer(server) {
      server.middlewares.use('/lv', async (req, res, next) => {
        // 安全最小集 ①：仅允许回环地址（dev 的 --host 0.0.0.0 是 UI 调试用途，API 不随之开放）
        const remote = req.socket.remoteAddress
        if (!isLoopback(remote)) {
          sendJson(res, 403, { error: { message: 'Forbidden: loopback only' } })
          return
        }

        const path = req.url.split('?')[0]
        const method = req.method

        if (path === '/health' && method === 'GET') {
          sendJson(res, 200, {
            ok: true,
            name: 'greenplay-editor-api',
            version,
            capabilities: ['styles', 'render_url', 'layout', 'export'],
            renderUrlHint: `${localBaseUrl(req)}/?text=<url-encoded-markdown>&style=<preset>&theme=<theme>&spacing=<spacing>&mode=<article|cards>`
          })
          return
        }

        if (path === '/styles' && method === 'GET') {
          sendJson(res, 200, {
            ok: true,
            ...catalog,
            // 供外部 AI 工作台快速定位渲染入口（端口跟随请求 Host，防漂移）
            renderUrlTemplate: `${localBaseUrl(req)}/?text={markdown}&style={auto|classic|elegant|playful|minimalist|journal|report}&theme={theme}&spacing={compact|standard|loose}&mode={article|cards}`
          })
          return
        }

        // 其余路径/方法：P1 的 POST /lv/layout、/lv/export 在此追加
        if (path === '/layout' && method === 'POST') {
          const raw = await readBody(req)
          if (raw == null) {
            sendJson(res, 413, { error: { message: 'Payload too large (max 1MB)' } })
            return
          }
          let body
          try {
            body = JSON.parse(raw)
          } catch {
            sendJson(res, 400, { error: { message: 'Invalid JSON body' } })
            return
          }
          const text = typeof body.text === 'string' ? body.text : ''
          if (!text.trim()) {
            sendJson(res, 400, { error: { message: 'Missing required field: text (markdown string)' } })
            return
          }
          const style = isWhitelistedStyle(body.stylePreset) ? body.stylePreset : 'auto'
          const theme = isWhitelistedTheme(body.theme) ? body.theme : 'classic'
          const spacing = isWhitelistedSpacing(body.spacing) ? body.spacing : 'standard'
          try {
            const result = await renderLayout({ text, stylePreset: style, theme, spacing })
            sendJson(res, 200, { ok: true, ...result })
          } catch (err) {
            console.error('[lv/layout] render failed:', err)
            sendJson(res, 500, { error: { message: `Layout render failed: ${err.message}` } })
          }
          return
        }

        if (path === '/export' && method === 'POST') {
          const raw = await readBody(req)
          if (raw == null) {
            sendJson(res, 413, { error: { message: 'Payload too large (max 1MB)' } })
            return
          }
          let body
          try {
            body = JSON.parse(raw)
          } catch {
            sendJson(res, 400, { error: { message: 'Invalid JSON body' } })
            return
          }
          const html = typeof body.html === 'string' ? body.html : ''
          if (!html.trim()) {
            sendJson(res, 400, { error: { message: 'Missing required field: html (rendered HTML)' } })
            return
          }
          const format = body.format === 'card' ? 'card' : 'wechat'
          try {
            const result = await renderExport({ html, format, stylePreset: body.stylePreset })
            sendJson(res, 200, { ok: true, ...result })
          } catch (err) {
            console.error('[lv/export] render failed:', err)
            sendJson(res, 500, { error: { message: `Export failed: ${err.message}` } })
          }
          return
        }

        if (path === '/health' || path === '/styles' || path === '/layout' || path === '/export') {
          sendJson(res, 405, { error: { message: 'Method Not Allowed' } })
          return
        }
        sendJson(res, 404, { error: { message: 'Not Found' } })
      })
    }
  }
}
