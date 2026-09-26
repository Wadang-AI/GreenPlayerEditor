<template>
  <div ref="containerRef" class="article-preview-container" :class="[pageTheme, 'card-theme', theme]">
    <div ref="articleContentRef" class="article-content content-rich" :class="[`typography-${stylePreset}`, `spacing-${spacingPreset}`]">
      <div v-if="hasMasthead" class="masthead">
        <div class="masthead-main">
          <span class="masthead-name">{{ docMeta.masthead }}</span>
          <span class="masthead-meta" v-if="docMeta.issue || docMeta.date">{{ [docMeta.issue, docMeta.date].filter(Boolean).join(' · ') }}</span>
        </div>
        <div class="masthead-kicker" v-if="docMeta.kicker">{{ docMeta.kicker }}</div>
        <div class="masthead-author" v-if="docMeta.author">{{ t('article.byline', { author: docMeta.author }) }}</div>
      </div>
      <div class="article-inner" v-html="highlightedHtml"></div>
    </div>
    <LoadingOverlay
      :show="isExporting"
      :text="loadingText"
      :theme="theme"
      :pageTheme="pageTheme"
    />
  </div>
</template>

<script setup>
import { computed, ref, onBeforeUnmount } from 'vue'
import * as htmlToImage from 'html-to-image'
import { highlightCodeBlocks } from '../utils/highlight.js'
import { replaceImageSrcWithDataUrls } from '../utils/imageStore.js'
import { useToast } from '../composables/useToast.js'
import { useI18n } from 'vue-i18n'
import LoadingOverlay from './LoadingOverlay.vue'

const props = defineProps({
  html: { type: String, default: '' },
  theme: { type: String, default: 'classic' },
  pageTheme: { type: String, default: 'theme-dark' }, // 'theme-light' | 'theme-dark'
  stylePreset: { type: String, default: 'classic' },
  spacingPreset: { type: String, default: 'standard' },
  docMeta: { type: Object, default: () => ({}) },
})

const hasMasthead = computed(() => {
  const m = props.docMeta || {}
  return !!(m.masthead || m.issue || m.date || m.kicker || m.author)
})

const { t } = useI18n()
const { success, error } = useToast()
const articleContentRef = ref(null)
const containerRef = ref(null)
const isExporting = ref(false)
const loadingText = ref('')
let scrollAnimationFrame = null

// 朋友圈会对过窄的长图再次压缩。按 1080px 左右的物理宽度导出，
// 长文过高时再根据浏览器画布上限自动降低倍率。
function getExportPixelRatio(node) {
  const width = Math.max(node.scrollWidth, node.getBoundingClientRect().width, 496)
  const height = Math.max(node.scrollHeight, node.getBoundingClientRect().height, 1)
  const targetRatio = 1080 / width
  const maxCanvasHeight = 30000
  const maxCanvasPixels = 80_000_000
  const heightRatio = maxCanvasHeight / height
  const areaRatio = Math.sqrt(maxCanvasPixels / (width * height))

  return Math.max(1, Math.min(targetRatio, heightRatio, areaRatio))
}

// Apply syntax highlighting to HTML and hide page breaks in article mode
const highlightedHtml = computed(() => {
  let processedHtml = highlightCodeBlocks(props.html)

  // 在长文模式下隐藏分页符
  // 1. 隐藏HTML注释形式的分页符和其可视化元素
  processedHtml = processedHtml.replace(/<!--\s*PAGE_BREAK\s*-->/g, '')

  // 2. 隐藏段落形式的分页符
  processedHtml = processedHtml.replace(/<p[^>]*class="[^"]*page-break-styled[^"]*"[^>]*>.*?<\/p>/g, '')

  // 3. 隐藏其他可能的分页符格式
  processedHtml = processedHtml.replace(/<p[^>]*>\s*PAGE_BREAK\s*<\/p>/g, '')
  processedHtml = processedHtml.replace(/<p[^>]*>\s*✂️\s*[^<]*分页符[^<]*\s*<\/p>/g, '')
  processedHtml = processedHtml.replace(/<p[^>]*>\s*✂️\s*[^<]*Page Break[^<]*\s*<\/p>/g, '')

  // H2 章节序号装置：01 / 02 / …（渲染层注入真实 DOM，复制到公众号后保留）
  let sectionIndex = 0
  processedHtml = processedHtml.replace(/<h2(\s[^>]*)?>/g, (match, attrs) => {
    sectionIndex += 1
    return `<h2${attrs || ''}><span class="sec-no">${String(sectionIndex).padStart(2, '0')}</span>`
  })

  return processedHtml
})

// Export article as image
async function exportArticle() {
  if (!articleContentRef.value || !props.html) {
    error(t('messages.emptyContent'))
    return
  }

  isExporting.value = true
  loadingText.value = t('loading.articlePreparing')

  let original = null
  let allElements = []
  let elementStyles = []
  let listItemData = []
  let imageSources = []

  try {
    // 保存原始样式
    original = {
      borderRadius: articleContentRef.value.style.borderRadius,
      boxShadow: articleContentRef.value.style.boxShadow,
      width: articleContentRef.value.style.width,
      maxWidth: articleContentRef.value.style.maxWidth,
      minWidth: articleContentRef.value.style.minWidth,
      transform: articleContentRef.value.style.transform,
      transformOrigin: articleContentRef.value.style.transformOrigin
    }

    loadingText.value = t('loading.articleAdjusting')

    // 临时调整样式用于导出，保持与预览一致的宽度
    articleContentRef.value.style.borderRadius = '0'
    articleContentRef.value.style.boxShadow = 'none'
    articleContentRef.value.style.width = '496px'
    articleContentRef.value.style.maxWidth = '496px'
    articleContentRef.value.style.minWidth = '496px'
    articleContentRef.value.style.transform = 'none'
    articleContentRef.value.style.transformOrigin = 'initial'

    // 清理内容中可能导致错位的样式
    allElements = Array.from(articleContentRef.value.querySelectorAll('*'))
    elementStyles = []

    allElements.forEach((el, index) => {
      // 保存原始样式
      elementStyles[index] = {
        transform: el.style.transform,
        transformOrigin: el.style.transformOrigin,
        position: el.style.position,
        top: el.style.top,
        left: el.style.left,
        right: el.style.right,
        bottom: el.style.bottom
      }

      // 清理可能导致错位的样式
      if (el.style.transform && el.style.transform !== 'none') {
        el.style.transform = 'none'
      }
      if (el.style.position === 'absolute' || el.style.position === 'fixed') {
        el.style.position = 'static'
      }
    })

    // 修复有序列表编号显示问题
    const orderedLists = articleContentRef.value.querySelectorAll('ol')
    listItemData = []

    orderedLists.forEach((ol, olIndex) => {
      const items = ol.querySelectorAll('li')
      listItemData[olIndex] = []

      items.forEach((li, liIndex) => {
        // 保存原始::before内容
        const computedStyle = window.getComputedStyle(li, '::before')
        listItemData[olIndex][liIndex] = {
          element: li,
          originalContent: computedStyle.content,
          actualNumber: liIndex + 1
        }

        // 创建实际的数字元素替换CSS counter
        const numberSpan = document.createElement('span')
        numberSpan.className = 'export-list-number'
        numberSpan.textContent = (liIndex + 1).toString()
        numberSpan.style.cssText = `
          position: absolute;
          top: 50%;
          left: 0;
          width: 16px;
          height: 16px;
          border-radius: 8px;
          background: var(--card-accent);
          color: white;
          font-size: 10px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: translateY(-50%);
          z-index: 2;
          box-shadow:
            0 0 6px color-mix(in srgb, var(--card-accent) 80%, transparent),
            0 0 12px color-mix(in srgb, var(--card-accent) 40%, transparent);
        `

        // 暂时隐藏::before伪元素
        li.style.setProperty('--before-display', 'none')
        li.insertBefore(numberSpan, li.firstChild)
      })
    })

    // 等待样式应用
    await new Promise(resolve => setTimeout(resolve, 300))

    loadingText.value = t('loading.articleGenerating')

    // IndexedDB 图片在编辑器里通常是 blob/uni-image URL，导出 canvas 前必须内联为 data URL。
    // 否则 html-to-image 会因图片无法读取或 canvas 被污染而直接失败。
    const exportImages = Array.from(articleContentRef.value.querySelectorAll('img'))
    imageSources = exportImages.map((img) => ({
      element: img,
      src: img.getAttribute('src') || ''
    }))
    await replaceImageSrcWithDataUrls(articleContentRef.value)

    // 获取当前主题的颜色值
    const computedStyle = window.getComputedStyle(articleContentRef.value)
    const cardBgColor = computedStyle.getPropertyValue('background-color') || '#ffffff'

    const pixelRatio = getExportPixelRatio(articleContentRef.value)

    // 以高清尺寸输出；超长文章会自动降低倍率，避免超过浏览器 Canvas 上限。
    const dataUrl = await htmlToImage.toPng(articleContentRef.value, {
      quality: 1,
      pixelRatio,
      backgroundColor: cardBgColor,
      useCORS: true,
      allowTaint: false,
      skipFonts: true,
      fontEmbedCSS: '',
      cacheBust: true,  // 避免缓存问题
      imagePlaceholder: undefined,
      skipAutoScale: true,
      style: {
        borderRadius: '0',
        boxShadow: 'none',
        width: '496px',
        maxWidth: '496px',
        minWidth: '496px',
        transform: 'none',
        transformOrigin: 'initial',
        position: 'relative',
        display: 'block',
        margin: '0',
        padding: '16px',
        boxSizing: 'border-box'
      }
    })

    console.info('Long image export ready', JSON.stringify({
      width: Math.round(articleContentRef.value.scrollWidth * pixelRatio),
      height: Math.round(articleContentRef.value.scrollHeight * pixelRatio),
      pixelRatio
    }))

    loadingText.value = t('loading.articleSaving')

    // 创建下载链接
    const link = document.createElement('a')
    link.download = `${t('article.exportPrefix')}${new Date().toISOString().slice(0, 10)}.png`
    link.href = dataUrl
    document.body.appendChild(link)
    link.click()
    link.remove()

    success(t('loading.articleSuccess'))
  } catch (err) {
    console.error('Export article failed:', err)
    error(t('messages.exportFailed') || '导出长文失败，请重试')
  } finally {
    // 无论成功还是失败，都要恢复样式
    try {
      if (articleContentRef.value) {
        // 恢复列表项的原始样式
        listItemData.forEach((olData, olIndex) => {
          olData.forEach((itemData, liIndex) => {
            itemData.element.style.removeProperty('--before-display')
          })
        })

        // 恢复所有元素的原始样式
        allElements.forEach((el, index) => {
          if (elementStyles[index]) {
            el.style.transform = elementStyles[index].transform || ''
            el.style.transformOrigin = elementStyles[index].transformOrigin || ''
            el.style.position = elementStyles[index].position || ''
            el.style.top = elementStyles[index].top || ''
            el.style.left = elementStyles[index].left || ''
            el.style.right = elementStyles[index].right || ''
            el.style.bottom = elementStyles[index].bottom || ''
          }
        })

        imageSources.forEach(({ element, src }) => {
          if (element && element.isConnected) {
            element.setAttribute('src', src)
          }
        })

        articleContentRef.value.querySelectorAll('.export-list-number').forEach((span) => span.remove())

        // 恢复原始样式，如果原始样式为空，则移除内联样式让CSS类样式生效
        if (original?.borderRadius) {
          articleContentRef.value.style.borderRadius = original.borderRadius
        } else {
          articleContentRef.value.style.removeProperty('border-radius')
        }

        if (original?.boxShadow) {
          articleContentRef.value.style.boxShadow = original.boxShadow
        } else {
          articleContentRef.value.style.removeProperty('box-shadow')
        }

        if (original?.width) {
          articleContentRef.value.style.width = original.width
        } else {
          articleContentRef.value.style.removeProperty('width')
        }

        if (original?.maxWidth) {
          articleContentRef.value.style.maxWidth = original.maxWidth
        } else {
          articleContentRef.value.style.removeProperty('max-width')
        }

        if (original?.minWidth) {
          articleContentRef.value.style.minWidth = original.minWidth
        } else {
          articleContentRef.value.style.removeProperty('min-width')
        }

        if (original?.transform) {
          articleContentRef.value.style.transform = original.transform
        } else {
          articleContentRef.value.style.removeProperty('transform')
        }

        if (original?.transformOrigin) {
          articleContentRef.value.style.transformOrigin = original.transformOrigin
        } else {
          articleContentRef.value.style.removeProperty('transform-origin')
        }
      }
    } catch (styleError) {
      console.error('Error restoring styles:', styleError)
      // 备用方案：强制重新应用CSS类样式
      if (articleContentRef.value) {
        // 移除所有内联样式，让CSS类样式重新生效
        const stylesToRemove = [
          'border-radius', 'box-shadow', 'width', 'max-width',
          'min-width', 'transform', 'transform-origin'
        ]
        stylesToRemove.forEach(prop => {
          articleContentRef.value.style.removeProperty(prop)
        })
      }
    }

    isExporting.value = false
  }
}

function clampRatio(value) {
  if (!Number.isFinite(value)) return 0
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

function scrollToRatio(ratio = 0) {
  const container = containerRef.value
  if (!container) return

  const targetRatio = clampRatio(ratio)

  if (scrollAnimationFrame !== null) {
    cancelAnimationFrame(scrollAnimationFrame)
    scrollAnimationFrame = null
  }

  scrollAnimationFrame = requestAnimationFrame(() => {
    const maxScroll = container.scrollHeight - container.clientHeight
    container.scrollTop = maxScroll > 0 ? maxScroll * targetRatio : 0
    scrollAnimationFrame = null
  })
}

onBeforeUnmount(() => {
  if (scrollAnimationFrame !== null) {
    cancelAnimationFrame(scrollAnimationFrame)
    scrollAnimationFrame = null
  }
})

// 暴露方法给父组件
defineExpose({
  exportArticle,
  scrollToRatio
})
</script>

<style lang="less" scoped>
@import '../styles/less/variables/colors.less';
@import '../styles/less/variables/layout.less';
@import '../styles/less/variables/typography.less';
@import '../styles/less/mixins/common.less';
.article-preview-container {
  flex: 1;
  overflow: auto;
  padding: 24px;
  background: var(--bg);
}

.article-content {
  // 677px 是公众号正文在桌面端常用的阅读宽度；窄屏由父容器自然收缩。
  // 长图导出会在导出流程中临时使用独立的 496px 渲染宽度，不受这里影响。
  width: min(677px, 100%);
  max-width: 100%;
  margin: 0 auto;
  padding: @panel-padding;
  background: var(--card-bg);
  color: var(--card-text);
  border-radius: @panel-border-radius;
  box-shadow: 0 2px 8px color-mix(in srgb, var(--card-accent) 20%, transparent);
  transition: all 0.2s ease;
}

.masthead {
  border-bottom: 1px solid color-mix(in srgb, var(--card-text) 14%, transparent);
  padding-bottom: 14px;
  margin-bottom: 22px;
}

.masthead-main {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.masthead-name {
  font-family: 'Noto Serif SC', 'Source Han Serif SC', serif;
  font-weight: 700;
  font-size: 15px;
  letter-spacing: 0.14em;
}

.masthead-meta {
  font-size: 11px;
  letter-spacing: 0.08em;
  color: color-mix(in srgb, var(--card-text) 55%, transparent);
  white-space: nowrap;
}

.masthead-kicker {
  margin-top: 8px;
  font-size: 11px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: var(--card-accent-deep, var(--card-accent));
}

.masthead-author {
  margin-top: 4px;
  font-size: 12px;
  letter-spacing: 0.04em;
  color: color-mix(in srgb, var(--card-text) 55%, transparent);
}

// H2 章节序号装置：01 — 标题（杂志感 section 装置，纯文本+纯色，微信安全）
.article-inner :deep(h2 .sec-no) {
  font-family: ui-monospace, 'SF Mono', Menlo, Consolas, monospace;
  font-size: 0.72em;
  font-weight: 600;
  color: var(--card-accent-deep, var(--card-accent));
  letter-spacing: 0.06em;
  margin-right: 4px;

  &::after {
    content: '—';
    margin-left: 8px;
    opacity: 0.4;
  }
}

// The DOM-injected .sec-no is the source of truth in article mode.
// Cards mode keeps its own CSS counter.
.article-inner :deep(h2)::before {
  content: none !important;
}

.article-inner :deep(p:last-child) {
  margin-bottom: 0;
}
</style>
