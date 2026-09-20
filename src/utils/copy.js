// Build HTML suitable for WeChat posting by reading actual theme CSS variables
// from styles/themes.css. We compute colors/typography via a hidden probe element
// with classes: `editor-theme <theme>`, then generate minimal content CSS.

import juice from 'juice'
import { replaceImageSrcWithDataUrls } from './imageStore.js'

// Utility function for converting camelCase to kebab-case (currently unused but kept for future use)
// function camelToKebab(s){return s.replace(/[A-Z]/g, m=>'-'+m.toLowerCase())}

// 合并 CSS 到内联样式
function mergeCss(html) {
  return juice(html, {
    inlinePseudoElements: true,
    preserveImportant: true,
    removeStyleTags: true,
    preserveFontFaces: true,
    preserveMediaQueries: false,
    preserveKeyFrames: false,
    applyStyleTags: true,
    applyLinkTags: true,
    applyWidthAttributes: true,
    applyHeightAttributes: true,
    applyAttributesTableElements: true,
    // 确保表格样式被正确内联
    webResources: {
      images: false,
      svgs: false,
      scripts: false,
      relativeTo: false
    }
  })
}

// ============================================================
// 微信安全降级工具
// 微信图文仅支持：系统字体、纯色（rgba 可）、实线边框、少量盒属性。
// color-mix / linear-gradient / box-shadow / border-radius / transform /
// 绝对定位伪元素装饰等全部失效。这里把 juice 内联后的结果统一清洗，
// 保证「复制出去的 = 预览里看到的」的结构与配色一致。
// ============================================================

const NAMED_COLORS = {
  transparent: [0, 0, 0, 0],
  white: [255, 255, 255, 1],
  black: [0, 0, 0, 1],
  red: [255, 0, 0, 1],
  currentcolor: null, // 不处理，保留原值
  inherit: null
}

function parseColorToken(token) {
  const t = token.trim().toLowerCase()
  if (t in NAMED_COLORS) {
    const v = NAMED_COLORS[t]
    return v ? { r: v[0], g: v[1], b: v[2], a: v[3] } : null
  }
  let m = t.match(/^#([0-9a-f]{3,8})$/)
  if (m) {
    const h = m[1]
    if (h.length === 3) {
      return { r: parseInt(h[0] + h[0], 16), g: parseInt(h[1] + h[1], 16), b: parseInt(h[2] + h[2], 16), a: 1 }
    }
    if (h.length === 6) {
      return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16), a: 1 }
    }
    if (h.length === 8) {
      return {
        r: parseInt(h.slice(0, 2), 16),
        g: parseInt(h.slice(2, 4), 16),
        b: parseInt(h.slice(4, 6), 16),
        a: parseInt(h.slice(6, 8), 16) / 255
      }
    }
    return null
  }
  m = t.match(/^rgba?\(([^)]+)\)$/)
  if (m) {
    const parts = m[1].split(/[\/,\s]+/).filter(Boolean)
    if (parts.length >= 3) {
      const rgb = parts.slice(0, 3).map(parseFloat)
      const a = parts.length > 3 ? parseFloat(parts[3]) : 1
      if (rgb.every((n) => !Number.isNaN(n)) && !Number.isNaN(a)) {
        return { r: rgb[0], g: rgb[1], b: rgb[2], a }
      }
    }
  }
  return null
}

function formatColor(c) {
  const clamp = (v) => Math.max(0, Math.min(255, Math.round(v)))
  if (c.a >= 0.995) {
    return '#' + [c.r, c.g, c.b].map((v) => clamp(v).toString(16).padStart(2, '0')).join('')
  }
  return `rgba(${clamp(c.r)}, ${clamp(c.g)}, ${clamp(c.b)}, ${Math.round(c.a * 100) / 100})`
}

// sRGB premultiplied 加权混合
function mixPremultiplied(colors, weights) {
  let total = 0
  for (const w of weights) total += w
  if (total <= 0) return null
  let a = 0
  for (let i = 0; i < colors.length; i++) a += colors[i].a * (weights[i] / total)
  if (a <= 0) return { r: 0, g: 0, b: 0, a: 0 }
  let r = 0, g = 0, b = 0
  for (let i = 0; i < colors.length; i++) {
    const wa = colors[i].a * (weights[i] / total)
    r += colors[i].r * wa
    g += colors[i].g * wa
    b += colors[i].b * wa
  }
  return { r: r / a, g: g / a, b: b / a, a }
}

// 括号感知的顶层分割（rgb() 内部的逗号不会被切开）
function splitTopLevel(str, sep) {
  const parts = []
  let depth = 0
  let cur = ''
  for (const ch of str) {
    if (ch === '(') depth++
    else if (ch === ')') depth--
    if (ch === sep && depth === 0) {
      parts.push(cur)
      cur = ''
    } else {
      cur += ch
    }
  }
  parts.push(cur)
  return parts
}

function parseColorSpec(spec) {
  const m = spec.trim().match(/^(.*?)(?:\s+([\d.]+)%)?$/)
  if (!m) return null
  const color = parseColorToken(m[1])
  const percent = m[2] != null ? parseFloat(m[2]) : null
  if (!color) return null
  return { color, percent }
}

// 把 CSS 值里的所有 color-mix(in srgb, C1 P1, C2 P2) 解析为纯色
function resolveColorMix(value) {
  let out = value
  let guard = 0
  while (guard++ < 24) {
    const idx = out.toLowerCase().indexOf('color-mix(')
    if (idx === -1) break
    let depth = 0
    let end = -1
    for (let i = idx + 'color-mix'.length + 1; i < out.length; i++) {
      if (out[i] === '(') depth++
      else if (out[i] === ')') {
        if (depth === 0) { end = i; break }
        depth--
      }
    }
    if (end === -1) break
    const inner = out.slice(idx + 'color-mix'.length + 1, end)
    const parts = splitTopLevel(inner, ',').map((s) => s.trim())
    let replacement = null
    if (parts.length === 3 && /^in\s+srgb$/i.test(parts[0])) {
      const spec1 = parseColorSpec(parts[1])
      const spec2 = parseColorSpec(parts[2])
      if (spec1 && spec2) {
        let p1 = spec1.percent
        let p2 = spec2.percent
        if (p1 == null && p2 == null) { p1 = 50; p2 = 50 }
        else if (p1 == null) p1 = 100 - p2
        else if (p2 == null) p2 = 100 - p1
        replacement = formatColor(mixPremultiplied([spec1.color, spec2.color], [p1, p2]))
      }
    }
    // 解析失败时退回第二色（fallback 位），再不行用透明
    if (replacement == null) {
      const fb = parts.length >= 3 ? parseColorSpec(parts[2]) : null
      replacement = fb ? formatColor(fb.color) : 'rgba(0, 0, 0, 0)'
    }
    out = out.slice(0, idx) + replacement + out.slice(end + 1)
  }
  return out
}

// 渐变 → 平均纯色（忽略 stop 位置，premultiplied 平均）
function gradientToSolid(value) {
  // stop 里可能嵌套 color-mix，先解析成纯色
  const resolved = resolveColorMix(value)
  const idx = resolved.indexOf('gradient(')
  if (idx === -1) return null
  let depth = 0
  let end = -1
  for (let i = idx + 'gradient'.length + 1; i < resolved.length; i++) {
    if (resolved[i] === '(') depth++
    else if (resolved[i] === ')') {
      if (depth === 0) { end = i; break }
      depth--
    }
  }
  if (end === -1) return null
  // gradient( 后的第一个顶层逗号之前是方向（to right / 45deg），跳过
  const inner = resolved.slice(idx + 'gradient'.length + 1, end)
  let stops = splitTopLevel(inner, ',')
  if (stops.length > 1 && !parseColorSpec(stops[0])) stops = stops.slice(1)
  const colors = []
  const weights = []
  for (const s of stops) {
    const spec = parseColorSpec(s)
    if (!spec) continue
    colors.push(spec.color)
    weights.push(spec.percent != null && stops.length === 2 ? spec.percent : 1)
  }
  if (!colors.length) return null
  return mixPremultiplied(colors, weights)
}

// 从 juice 内联后的 inline style 中清洗微信不支持的声明，返回降级次数
function sanitizeForWechat(container) {
  let degraded = 0

  const STRIP_PROPERTIES = [
    'box-shadow', 'text-shadow', 'backdrop-filter', 'transition', 'animation',
    'transform', 'filter', 'outline', 'user-select', 'pointer-events',
    'appearance', '-webkit-appearance', 'cursor', 'z-index', 'overflow',
    'overflow-x', 'overflow-y', 'perspective', 'mix-blend-mode'
  ]

  const SAFE_FONT_FAMILIES = /(-apple-system|blinkmacsystemfont|system-ui|segoe ui|pingfang|hiragino|microsoft yahei|wenquanyi|noto sans|sans-serif|^serif$|serif,|monospace|georgia|times|arial|helvetica|verdana|tahoma|simsun|simhei|kaiti|songti|fangsong|STSong|STKaiti)/i

  container.querySelectorAll('*').forEach((el) => {
    const style = el.style
    if (!style) return

    // 1) 解析所有 color-mix 为纯色
    for (let i = 0; i < style.length; i++) {
      const prop = style[i]
      const val = style.getPropertyValue(prop)
      if (val && val.indexOf('color-mix(') !== -1) {
        style.setProperty(prop, resolveColorMix(val))
        degraded++
      }
    }

    // 2) 渐变背景 → 纯色；渐变文字（background-clip:text）恢复实色文字
    const bgImage = style.getPropertyValue('background-image') || ''
    const bgShorthand = style.getPropertyValue('background') || ''
    const hasGradient = bgImage.indexOf('gradient(') !== -1 || bgShorthand.indexOf('gradient(') !== -1
    if (hasGradient) {
      const source = bgImage.indexOf('gradient(') !== -1 ? bgImage : bgShorthand
      const solid = gradientToSolid(source)
      const isGradientText =
        (style.getPropertyValue('-webkit-text-fill-color') || '') === 'transparent' ||
        (style.getPropertyValue('color') || '') === 'transparent'
      // 隐形动画底座（background-size 以 0 开头，如链接 hover 下划线）：整组删除且不加底色
      const size = (style.getPropertyValue('background-size') || '').trim()
      const isHiddenBase = /^0(\.0+)?(px|%|em|rem)?$/i.test(size)
      ;['background', 'background-image', 'background-size', 'background-position', 'background-repeat',
        '-webkit-background-clip', 'background-clip', '-webkit-text-fill-color'
      ].forEach((p) => style.removeProperty(p))
      if (isGradientText) {
        // 渐变标题：恢复为实色文字，否则微信里整段隐形
        style.setProperty('color', solid && solid.a > 0.05 ? formatColor(solid) : '#333333')
      } else if (!isHiddenBase && solid && solid.a > 0.02) {
        style.setProperty('background-color', formatColor(solid))
      }
      degraded++
    }

    // 3) 背景规范化：微信对 background 简写兼容性差，纯色背景统一改写为 background-color
    const bgPlain = (style.getPropertyValue('background') || '').trim()
    if (bgPlain && bgPlain.indexOf('gradient(') === -1 && bgPlain.indexOf('url(') === -1
      && bgPlain.toLowerCase() !== 'none') {
      style.removeProperty('background')
      style.setProperty('background-color', bgPlain)
    }

    // 4) 剥离微信不支持的属性
    STRIP_PROPERTIES.forEach((p) => {
      if (style.getPropertyValue(p)) {
        style.removeProperty(p)
        degraded++
      }
    })
    if (style.getPropertyValue('border-radius')) {
      style.removeProperty('border-radius')
      style.removeProperty('-webkit-border-radius')
      degraded++
    }

    // 5) 字体白名单化（自定义字体微信必丢，只留系统栈）
    const ff = style.getPropertyValue('font-family')
    if (ff) {
      const kept = ff.split(',').map((s) => s.trim()).filter((f) => f && SAFE_FONT_FAMILIES.test(f))
      if (kept.length === 0) {
        style.removeProperty('font-family')
        degraded++
      } else if (kept.join(', ') !== ff.trim()) {
        style.setProperty('font-family', kept.join(', '))
        degraded++
      }
    }

    // 6) inline 元素上的绝对定位（伪元素装饰转换产物）→ 内联化，否则微信里乱飘
    const tag = el.tagName.toLowerCase()
    const pos = (style.getPropertyValue('position') || '').toLowerCase()
    if (pos === 'absolute' || pos === 'fixed' || pos === 'sticky') {
      if (['span', 'i', 'b', 'em', 'strong', 'small', 'u', 's', 'label'].includes(tag)) {
        style.setProperty('position', 'static')
        style.setProperty('display', 'inline')
        ;['top', 'right', 'bottom', 'left', 'inset', 'width', 'height', 'flex'].forEach((p) => style.removeProperty(p))
        degraded++
      } else {
        style.removeProperty('position')
        ;['top', 'right', 'bottom', 'left', 'inset'].forEach((p) => style.removeProperty(p))
      }
    }

    // 7) 空装饰 span（伪元素 content:'' 产物：圆点/竖线/对勾）→ 删除
    if (tag === 'span' && !el.textContent.trim() && el.children.length === 0 && !el.querySelector('img')) {
      el.remove()
      degraded++
    }
  })

  // 8) 装饰性列表符号已删，恢复微信原生列表符号
  container.querySelectorAll('ul, ol').forEach((list) => {
    if ((list.style.getPropertyValue('list-style') || '').trim() === 'none') {
      list.style.removeProperty('list-style')
      list.style.removeProperty('counter-reset')
      degraded++
    }
  })

  // 微信粘贴有时会丢失主题 CSS 或只保留标签的默认样式。
  // 把编辑器的语义强调显式写成内联样式，保证粗体和斜体跨粘贴链路稳定。
  container.querySelectorAll('strong, b').forEach((el) => {
    el.style.setProperty('font-weight', '700')
  })
  container.querySelectorAll('em, i').forEach((el) => {
    el.style.setProperty('font-style', 'italic')
  })

  return degraded
}

// Process themed content element for WeChat compatibility
async function processThemedContentForWechat(contentElement, pageTheme, cardTheme, stylePreset = 'classic', spacingPreset = 'standard') {
  // Clone the element to avoid modifying the original
  const clonedElement = contentElement.cloneNode(true)

  // Sanitize the HTML
  // let processedHtml = sanitizeForWeChat(clonedElement.innerHTML)

  // Create a temporary container to process the HTML
  const tempDiv = document.createElement('div')
  tempDiv.innerHTML = clonedElement.innerHTML

  // Replace blob URLs with Data URLs so that pasted content remains visible outside the app
  await replaceImageSrcWithDataUrls(tempDiv)

  // Apply inline styles to preserve formatting in WeChat
  const degraded = enhanceInlineStyles(tempDiv, pageTheme, cardTheme, stylePreset, spacingPreset)

  // Return the processed HTML plus how many declarations had to be downgraded
  return { html: tempDiv.innerHTML, degraded }
}

// Resolve CSS custom properties (variables) to their computed values
function resolveCssVariables(cssText, referenceElement) {
  // Find the themed container for getting computed styles
  const themedElement = document.querySelector('.article-preview-container .article-content') || referenceElement || document.body

  // Get computed styles to resolve CSS variables
  const computedStyle = getComputedStyle(themedElement)

  // Replace CSS variables with their computed values
  return cssText.replace(/var\(([^)]+)\)/g, (match, variableName) => {
    // Clean the variable name (remove spaces, fallbacks)
    const cleanVarName = variableName.split(',')[0].trim()

    try {
      // Get the computed value of the CSS variable
      const value = computedStyle.getPropertyValue(cleanVarName)
      if (value && value.trim()) {
        return value.trim()
      }
    } catch (e) {
      console.debug('Could not resolve CSS variable:', cleanVarName)
    }

    // If we can't resolve the variable, return the original
    return match
  })
}

// Apply juice CSS-to-inline conversion for WeChat compatibility.
// Returns the number of declarations downgraded for WeChat safety.
function enhanceInlineStyles(container, pageTheme = 'theme-light', cardTheme = 'classic', stylePreset = 'classic', spacingPreset = 'standard') {
  // Use the passed theme parameters instead of querying the DOM
  const currentPageTheme = pageTheme.startsWith('.') ? pageTheme : `.${pageTheme}`
  const currentCardTheme = cardTheme

  // Create a temporary themed wrapper to ensure proper context for CSS variable resolution
  const themedWrapper = document.createElement('div')
  themedWrapper.className = `${currentPageTheme} card-theme ${currentCardTheme}`
  themedWrapper.style.position = 'absolute'
  themedWrapper.style.left = '-9999px'
  themedWrapper.style.pointerEvents = 'none'
  themedWrapper.style.visibility = 'hidden'

  const themedContainer = document.createElement('div')
  themedContainer.className = `article-content content-rich typography-${stylePreset} spacing-${spacingPreset} ${pageTheme} card-theme ${currentCardTheme}`
  themedContainer.innerHTML = container.innerHTML

  themedWrapper.appendChild(themedContainer)
  document.body.appendChild(themedWrapper)

  const relevantSelectors = [
    '.content-rich',
    currentPageTheme,
    `.card-theme.${currentCardTheme}`,
    `.typography-${stylePreset}`,
    `.spacing-${spacingPreset}`,
    // Also include combinations
    `${currentPageTheme} .content-rich`,
    `${currentPageTheme} .card-theme.${currentCardTheme}`,
    `.card-theme.${currentCardTheme} .content-rich`,
    `${currentPageTheme} .card-theme.${currentCardTheme} .content-rich`,
    `.typography-${stylePreset} .content-rich`,
    `.content-rich.typography-${stylePreset}`,
    `.content-rich.spacing-${spacingPreset}`
  ]

  // Extract existing CSS from the page, filtering for relevant rules
  const existingStyles = []

  // Get all stylesheets from the document
  for (const stylesheet of document.styleSheets) {
    try {
      // Check if we can access this stylesheet
      if (stylesheet.href && !stylesheet.href.startsWith(window.location.origin)) {
        // Skip external stylesheets due to CORS
        continue
      }

      // Try to access the CSS rules
      const rules = stylesheet.cssRules
      if (rules) {
        for (const rule of rules) {
          if (rule instanceof CSSStyleRule) {
            const selectorText = rule.selectorText
            // Check if this rule is relevant to our theme context
            const isRelevant = selectorText && (
              selectorText.includes('.content-rich') ||
              selectorText.includes(currentPageTheme) ||
              selectorText.includes(`.card-theme.${currentCardTheme}`) ||
              selectorText.includes(`.typography-${stylePreset}`) ||
              selectorText.includes(`.spacing-${spacingPreset}`) ||
              selectorText.includes('.callout') ||
              relevantSelectors.some(selector => selectorText.includes(selector))
            )

            if (isRelevant) {
              
              // Resolve CSS variables to their computed values
              const resolvedCss = resolveCssVariables(rule.cssText, themedContainer)
              existingStyles.push(resolvedCss)
            }
          }
        }
      }
    } catch (e) {
      // Skip stylesheets we can't access due to CORS or other security restrictions
      console.debug('Skipping stylesheet due to access restrictions:', stylesheet.href || 'inline')
    }
  }

  let css = existingStyles.join('\n')

  // Create a complete HTML document with the existing CSS and themed content
  const fullHtml = `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>${css}</style>
      </head>
      <body>
        <section class="article content-rich typography-${stylePreset} spacing-${spacingPreset} ${pageTheme} card-theme ${currentCardTheme}" style="padding: 18px 16px">${themedContainer.innerHTML}</section>
      </body>
    </html>
  `
  // Use juice to convert CSS to inline styles
  let juicedHtml
  try {
    juicedHtml = mergeCss(fullHtml)
  } catch (error) {
    console.warn('Juice CSS inlining failed in enhanceInlineStyles:', error)
    return 0 // Return without changes if juice fails
  }

  // Parse the result and extract the content
  const parser = new DOMParser()
  const doc = parser.parseFromString(juicedHtml, 'text/html')
  const articleContent = doc.querySelector('.article')

  if (articleContent) {
    // Replace the container's content with the juice-processed content
    // 注意：必须用 outerHTML，否则最外层 section 上 juice 内联的 background-color
    // （公众号背景底色）会被 innerHTML 丢弃
    container.innerHTML = articleContent.outerHTML
  }

  // Only add essential post-processing that juice can't handle
  // 1) Ensure link safety
  container.querySelectorAll('a').forEach((link) => {
    link.setAttribute('target', '_blank')
    const href = link.getAttribute('href') || ''
    if (!href || href.startsWith('javascript:')) link.removeAttribute('href')
  })

  // 2) Add HTML attributes for table compatibility
  container.querySelectorAll('table').forEach((table) => {
    table.setAttribute('cellpadding', '0')
    table.setAttribute('cellspacing', '0')

    table.querySelectorAll('th').forEach((th) => {
      const bgColor = th.style.backgroundColor || '#f8f9fa'
      th.setAttribute('bgcolor', bgColor)
    })

    table.querySelectorAll('td').forEach((td) => {
      const bgColor = td.style.backgroundColor || '#ffffff'
      td.setAttribute('bgcolor', bgColor)
    })
  })

  // 3) WeChat-safe sanitization: strip/resolve styles WeChat cannot render
  const degraded = sanitizeForWechat(container)

  // Clean up the temporary themed element
  document.body.removeChild(themedWrapper)
  return degraded
}


// Copy to clipboard by reading from the existing themed preview element.
// Returns { ok, degraded } — degraded = declarations downgraded for WeChat.
export async function copyToWechat(cardTheme, appTheme = 'light', stylePreset = 'classic', spacingPreset = 'standard') {
  // Find the article preview container with applied theme styles
  const previewContainer = document.querySelector('.article-preview-container')
  if (!previewContainer) {
    console.error('Article preview container not found')
    return { ok: false, degraded: 0 }
  }

  // Find the content element with classes "article-content" and "content-rich"
  const contentElement = previewContainer.querySelector('.article-content.content-rich')
  if (!contentElement) {
    console.error('Article content element not found')
    return { ok: false, degraded: 0 }
  }

  // Get plain text for fallback
  const text = contentElement.textContent || ''

  // Use the passed theme parameters from Vue
  const pageTheme = appTheme === 'dark' ? 'theme-dark' : 'theme-light'

  // Process the themed content for WeChat compatibility
  const processed = await processThemedContentForWechat(contentElement, pageTheme, cardTheme, stylePreset, spacingPreset)
  const html = `<!doctype html><html><head><meta charset="utf-8"></head><body>${processed.html}</body></html>`

  try {
    const item = new window.ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([text], { type: 'text/plain' })
    })
    await navigator.clipboard.write([item])
    return { ok: true, degraded: processed.degraded }
  } catch (e) {
    console.warn('Clipboard write failed:', e)
    try {
      await navigator.clipboard.writeText(text)
      return { ok: true, degraded: processed.degraded }
    } catch (e2) {
      console.error('All clipboard methods failed:', e2)
      return { ok: false, degraded: 0 }
    }
  }
}
