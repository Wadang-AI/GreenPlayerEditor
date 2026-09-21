import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { readmeTodosPlugin } from './vite-plugin-readme-todos.js'
import { editorApiPlugin } from './vite-plugin-editor-api.js'

function aiCorsProxyPlugin() {
  return {
    name: 'ai-cors-proxy',
    configureServer(server) {
      server.middlewares.use('/cors-proxy', async (req, res, next) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ error: { message: 'Method Not Allowed' } }))
          return
        }

        try {
          let raw = ''
          req.on('data', chunk => {
            raw += chunk
          })
          await new Promise((resolve, reject) => {
            req.on('end', resolve)
            req.on('error', reject)
          })

          const payload = JSON.parse(raw || '{}')
          const { targetUrl, apiKey, model, messages, temperature, stream, max_tokens } = payload

          if (!targetUrl || !apiKey || !model || !Array.isArray(messages)) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ error: { message: 'Invalid proxy payload' } }))
            return
          }

          const requestPayload = { model, messages, temperature }
          if (stream !== undefined) requestPayload.stream = stream
          if (max_tokens !== undefined) requestPayload.max_tokens = max_tokens

          const upstream = await fetch(targetUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(requestPayload)
          })

          res.statusCode = upstream.status
          res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json; charset=utf-8')

          // 流式透传：SSE / chunked 响应边收边转发，避免中间件缓冲破坏 AI 流式排版
          if (upstream.body) {
            const reader = upstream.body.getReader()
            try {
              while (true) {
                const { done, value } = await reader.read()
                if (done) break
                res.write(Buffer.from(value))
              }
            } finally {
              res.end()
            }
          } else {
            const text = await upstream.text()
            res.end(text)
          }
        } catch (err) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json; charset=utf-8')
          res.end(JSON.stringify({ error: { message: err?.message || 'Proxy Failed' } }))
        }
      })
    }
  }
}

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  server: {
    host: true, // or '0.0.0.0'
    port: 5173
  },
  plugins: [vue(), readmeTodosPlugin(), aiCorsProxyPlugin(), editorApiPlugin()],
  build: {
    // 分包策略
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // 将 Vditor 相关单独打包
          if (id.includes('vditor')) {
            return 'vditor'
          }
          // 将 Vue 核心库单独打包
          if (id.includes('node_modules/vue/') || id.includes('node_modules/@vue/')) {
            return 'vue'
          }
          // 将 Vue-i18n 单独打包
          if (id.includes('vue-i18n')) {
            return 'vue-i18n'
          }
          // 将 highlight.js 单独打包
          if (id.includes('highlight.js')) {
            return 'highlight'
          }
          // 将其他第三方库打包为vendor
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        },
        // 优化chunk名称
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const fileName = assetInfo.name || 'asset'
          const info = fileName.split('.')
          const ext = info[info.length - 1]
          if (/\.(css)$/.test(fileName)) {
            return `css/[name]-[hash].${ext}`
          }
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(fileName)) {
            return `img/[name]-[hash].${ext}`
          }
          return `assets/[name]-[hash].${ext}`
        }
      }
    },
    // 压缩选项
    minify: 'terser',
    terserOptions: {
      compress: {
        // 移除console
        drop_console: true,
        // 移除debugger
        drop_debugger: true,
        // 移除未使用的代码
        unused: true,
        // 内联函数
        inline: true
      },
      mangle: {
        // 混淆变量名
        properties: false
      }
    },
    // 开启CSS代码分割
    cssCodeSplit: true,
    // 文件大小报告
    reportCompressedSize: true,
    // 调整chunk大小警告阈值
    chunkSizeWarningLimit: 1000
  },
  // CSS 优化
  css: {
    // 开启CSS代码分割
    devSourcemap: false,
    preprocessorOptions: {
      less: {
        // 压缩CSS
        compress: true,
        // 移除注释
        sourceMapContents: false,
        // 启用数学运算
        math: 'always'
      }
    },
    // PostCSS将使用外部配置文件
  }
})
