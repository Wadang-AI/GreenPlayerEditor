<template>
  <div class="container" :class="[appThemeClass, globalColorThemeClass]">
    <header class="banner">
      <a href="https://github.com/Wadang-AI/GreenPlayerEditor" target="_blank" class="logo" :title="$t('about.logoTitle')">
        <div class="logo-mark">
          <svg viewBox="0 0 32 32" width="26" height="26" fill="none" aria-hidden="true">
            <path d="M 16 5.6 C 22.5 5 26.7 9.4 26.2 15.8 C 25.7 22.1 21 26.8 15.3 26.4 C 9.7 26 5.5 21.3 6.1 15.6 C 6.6 10.4 10.9 6.3 16 5.6" fill="none" stroke="var(--logo-stroke)" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M 10.6 18.2 C 11.8 20 13.6 19.6 15 15.9 C 16.3 18.6 18 21.4 20.8 22.2" fill="none" stroke="var(--logo-stroke)" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>
            <circle cx="22.1" cy="22.55" r="1.55" fill="var(--logo-stroke)"/>
          </svg>
        </div>
        <div class="logo-text">{{ $t('header.logo') }}</div>
      </a>
      <div class="spacer" />
    </header>

    <main class="main" ref="mainRef" :style="{ gridTemplateColumns: leftPanelWidth + 'px auto ' + rightPanelWidth + 'px' }">
      <section class="panel editor-scope">
        <UniEditor
          ref="uniEditorRef"
          :page-theme="appThemeClass"
          :initial-markdown="renderUrlParams?.text || ''"
          @update:html="onHtml"
          @editor-scroll="onEditorScroll"
          @social-package-imported="onSocialPackageImported"
        />
      </section>

      <!-- Draggable Splitter -->
      <div
        class="panel-splitter"
        @mousedown="startResize"
        :class="{ resizing: isResizing }"
      >
        <div class="splitter-handle">
          <div class="splitter-dots">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
          </div>
        </div>
      </div>

      <section class="panel">
        <div class="panel-header preview-header">
          <!-- 模式切换 -->
          <div class="mode-tabs">
            <button
              class="mode-tab"
              :class="{ active: previewMode === 'article' }"
              @click="setPreviewMode('article')"
            >
              {{ $t('main.articleMode') }}
            </button>
            <button
              class="mode-tab"
              :class="{ active: previewMode === 'cards' }"
              @click="setPreviewMode('cards')"
            >
              {{ $t('main.cardMode') }}
            </button>
          </div>

          <!-- 右侧操作区：样式设置在预览这条功能组里（与复制/保存同排） -->
          <div class="preview-actions">
            <button
              class="btn btn-sm dock-trigger"
              :class="{ active: showDockPanel }"
              @click="showDockPanel = !showDockPanel"
              :title="$t('main.styleDock')"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              <span class="small-text">{{ $t('main.styleDock') }}</span>
            </button>
            <button class="btn btn-sm" @click="exportProjectPackage">
              {{ $t('main.exportProject') }}
            </button>
            <div v-if="previewMode === 'cards'" class="scale-control-inline">
              <label class="muted small-text">{{ $t('main.scale') }}</label>
              <input
                type="range"
                class="scale-slider"
                v-model.number="cardScale"
                @input="persistCardScale"
                min="0.5"
                max="1.0"
                step="0.05"
              />
              <span class="scale-value small-text">{{ Math.round(cardScale * 100) }}%</span>
            </div>
            <template v-if="previewMode === 'article'">
              <button class="btn btn-primary btn-lg" @click="copyForWeChat">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                <span>{{ $t('main.copyAll') }}</span>
              </button>
              <button class="btn btn-sm" @click="saveArticle">{{ $t('main.saveArticle') }}</button>
            </template>
            <button v-if="previewMode === 'cards'" class="btn btn-primary btn-lg" @click="saveCards">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>
              <span>{{ $t('main.saveCards') }}</span>
            </button>
          </div>
        </div>

        <!-- 长文模式 -->
        <ArticlePreview
          ref="articlePreviewRef"
          v-if="previewMode === 'article'"
          :html="html"
          :doc-meta="docMeta"
          :theme="globalColorTheme"
          :page-theme="appThemeClass"
          :style-preset="resolvedStylePreset"
          :spacing-preset="spacingPreset"
        />

        <!-- 卡片模式 -->
        <div v-if="previewMode === 'cards'" class="cards-container">
          <CardsPreview
            ref="cardsPreviewRef"
            :html="html"
            :doc-meta="docMeta"
            :card-theme="globalColorTheme"
            :page-theme="appThemeClass"
            :scale="cardScale"
            :show-loading="isImportingMarkdown"
            :style-preset="resolvedStylePreset"
            :spacing-preset="spacingPreset"
            @generated="handleCardsGenerated"
          />
        </div>
      </section>
    </main>

    <!-- 设置抽屉：色彩主题（带名称）/ 排版风格 / 间距 / 文档信息 -->
    <transition name="dock-fade">
      <div
        v-if="showDockPanel"
        class="dock-overlay"
        @click="showDockPanel = false"
        @keydown.esc="showDockPanel = false"
      ></div>
    </transition>
    <transition name="dock-slide">
      <aside v-if="showDockPanel" class="dock-panel" role="dialog" :aria-label="$t('main.styleDock')">
        <div class="dock-header">
          <span class="dock-title">{{ $t('main.styleDock') }}</span>
          <button class="dock-close" @click="showDockPanel = false" :aria-label="$t('common.close')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
          </button>
        </div>
        <div class="dock-body">
          <!-- 外观：明暗切换（与色彩主题同屏归并） -->
          <section class="dock-section">
            <h4 class="dock-section-title">{{ $t('header.appearance') }}</h4>
            <div class="appearance-seg" role="group" :aria-label="$t('header.appearance')">
              <button
                class="appearance-btn"
                :class="{ active: appTheme === 'light' }"
                @click="setAppTheme('light')"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32l1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>
                <span>{{ $t('header.appearanceLight') }}</span>
              </button>
              <button
                class="appearance-btn"
                :class="{ active: appTheme === 'dark' }"
                @click="setAppTheme('dark')"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                <span>{{ $t('header.appearanceDark') }}</span>
              </button>
            </div>
          </section>

          <section class="dock-section">
            <h4 class="dock-section-title">{{ $t('main.colorTheme') }}</h4>
            <div class="color-grid" role="group" :aria-label="$t('main.colorTheme')">
              <button
                v-for="t in colorThemes"
                :key="t"
                class="color-cell"
                :class="{ active: globalColorTheme === t }"
                :style="{ '--swatch': themeSwatches[t] }"
                :title="$t(`colorThemes.${t}`)"
                :aria-label="$t(`colorThemes.${t}`)"
                @click="selectColorTheme(t)"
              >
                <span class="color-cell-dot"></span>
                <span class="color-cell-name">{{ $t(`colorThemes.${t}`) }}</span>
              </button>
            </div>
          </section>

          <section class="dock-section">
            <h4 class="dock-section-title">{{ $t('main.stylePreset') }}</h4>
            <p class="dock-hint">{{ $t('stylePresets.stylePresetHint') }}</p>
            <div class="style-card-grid" role="radiogroup" :aria-label="$t('main.stylePreset')">
              <button
                v-for="p in stylePresetOptions"
                :key="p.value"
                class="style-card"
                :class="{ active: stylePreset === p.value }"
                role="radio"
                :aria-checked="stylePreset === p.value"
                @click="selectStylePreset(p.value)"
              >
                <span class="style-card-preview"
                  :class="[appThemeClass, 'card-theme', globalColorTheme, `typography-${p.value}`]">
                  <span class="style-pv-h">标题</span>
                  <span class="style-pv-p">正文段落与<strong>强调</strong>示例文字</span>
                  <span class="style-pv-bq">引文示例</span>
                </span>
                <span class="style-card-label">{{ $t(`stylePresets.${p.value}`) }}</span>
                <span class="style-card-desc">{{ $t(`stylePresets.${p.value}Desc`) }}</span>
              </button>
            </div>
          </section>

          <section class="dock-section">
            <h4 class="dock-section-title">{{ $t('main.spacing') }}</h4>
            <select class="select select-block" v-model="spacingPreset" @change="persistSpacingPreset">
              <option value="compact">{{ $t('spacingPresets.compact') }}</option>
              <option value="standard">{{ $t('spacingPresets.standard') }}</option>
              <option value="loose">{{ $t('spacingPresets.loose') }}</option>
            </select>
          </section>

          <section class="dock-section">
            <h4 class="dock-section-title">{{ $t('docMeta.title') }}</h4>
            <div class="dock-field">
              <label class="muted small-text">{{ $t('docMeta.masthead') }}</label>
              <input class="input input-compact" v-model="docMeta.masthead" @input="persistDocMeta" :placeholder="$t('docMeta.mastheadPlaceholder')" />
            </div>
            <div class="dock-field">
              <label class="muted small-text">{{ $t('docMeta.issue') }}</label>
              <input class="input input-compact" v-model="docMeta.issue" @input="persistDocMeta" :placeholder="$t('docMeta.issuePlaceholder')" />
            </div>
            <div class="dock-field">
              <label class="muted small-text">{{ $t('docMeta.date') }}</label>
              <input class="input input-compact" v-model="docMeta.date" @input="persistDocMeta" :placeholder="$t('docMeta.datePlaceholder')" />
            </div>
            <div class="dock-field">
              <label class="muted small-text">{{ $t('docMeta.kicker') }}</label>
              <input class="input input-compact" v-model="docMeta.kicker" @input="persistDocMeta" :placeholder="$t('docMeta.kickerPlaceholder')" />
            </div>
            <div class="dock-field">
              <label class="muted small-text">{{ $t('docMeta.author') }}</label>
              <input class="input input-compact" v-model="docMeta.author" @input="persistDocMeta" :placeholder="$t('docMeta.authorPlaceholder')" />
            </div>
          </section>
        </div>
      </aside>
    </transition>

    <footer class="footer">
      <div class="footer-inner">
        <span class="footer-brand">{{ $t('header.logo') }}</span>
        <span class="footer-sep">·</span>
        <button class="about-trigger" @click="showAbout = true">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/></svg>
          <span>{{ $t('footer.about') }}</span>
        </button>
        <span class="footer-divider" aria-hidden="true"></span>
        <LanguageSwitch />
      </div>
      <div class="footer-meta">
        <span>{{ $t('footer.repository') }}：</span>
        <a href="https://github.com/Wadang-AI/GreenPlayerEditor" target="_blank" rel="noopener" class="footer-link">Wadang-AI/GreenPlayerEditor</a>
        <span class="footer-meta-sep" aria-hidden="true">·</span>
        <span>{{ $t('footer.deployment') }}</span>
      </div>
    </footer>

    <!-- 关于弹窗 -->
    <transition name="dock-fade">
      <div v-if="showAbout" class="modal-overlay" @click="showAbout = false">
        <div class="modal-dialog" role="dialog" :aria-label="$t('footer.about')" @click.stop>
          <div class="modal-header">
            <h3>{{ $t('about.title') }}</h3>
          </div>
          <div class="modal-body">
            <p>{{ $t('about.description') }}</p>
            <p class="warning-text">{{ $t('about.basedOnPrefix') }}
              <a href="https://github.com/Wadang-AI/GreenPlayerEditor" target="_blank" class="footer-link">绿玩编辑器</a>{{ $t('about.basedOnMid') }}
              <a href="https://github.com/TanShilongMario/WXLayoutSkill" target="_blank" class="footer-link">WXLayoutSkill</a>{{ $t('about.basedOnSuffix') }}
            </p>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" @click="showAbout = false">{{ $t('about.gotIt') }}</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import UniEditor from './components/UniEditor.vue'
import CardsPreview from './components/CardsPreview.vue'
import ArticlePreview from './components/ArticlePreview.vue'
import LanguageSwitch from './components/LanguageSwitch.vue'
import { copyToWechat } from './utils/copy.js'
import { createZipBlob, downloadBlob } from './utils/projectPackage.js'
import { useI18n } from 'vue-i18n'
import { useToast } from './composables/useToast'

// 引入Less样式
import './styles/index.less'

const { t: $t } = useI18n()
const { success, error, warning } = useToast()

const uniEditorRef = ref(null)
const cardsPreviewRef = ref(null)
const articlePreviewRef = ref(null)
const mainRef = ref(null)

const html = ref('')
const isImportingMarkdown = ref(false)
const lastEditorScrollRatio = ref(0)
let articleScrollFrame = null
let cardSyncFrame = null

// Splitter state
const isResizing = ref(false)
const leftPanelWidth = ref(0)
const rightPanelWidth = ref(0)
const initialMouseX = ref(0)
const initialLeftWidth = ref(0)

// 预览模式
const previewMode = ref('article') // 'article' | 'cards'
const colorThemes = ['classic','minimal','paper','ocean','forest','sunset','grape','slate','sand','parchment','rose','sage','lavender','warmNeutral']
// 色卡圆点颜色（与 cards.less 浅色模式 --card-accent 一致）
const themeSwatches = {
  classic: '#2f6b45',
  minimal: '#7a9e7e',
  paper: '#0f766e',
  ocean: '#6b8fa6',
  forest: '#6b8a6b',
  sunset: '#c47e6c',
  grape: '#9585a5',
  slate: '#5a7080',
  sand: '#b87d4b',
  parchment: '#D4C4A8',
  rose: '#C4A0A0',
  sage: '#8A9470',
  lavender: '#9890AD',
  warmNeutral: '#5C5348'
}

function selectColorTheme(theme) {
  globalColorTheme.value = theme
  persistColorTheme()
}
const cardScale = ref(0.75) // 卡片模式缩放比例，范围 0.5-1.0

// 设置抽屉（收纳色彩主题/排版/间距/文档信息）
const showDockPanel = ref(false)

// 关于弹窗
const showAbout = ref(false)

// App light/dark theme (default light)
const appTheme = ref('light')
const appThemeClass = computed(() => appTheme.value === 'dark' ? 'theme-dark' : 'theme-light')

// 同步主题 class 到 body：Teleport 到 body 的浮层（如「更多」菜单）需要继承浅/深色变量
watch(appThemeClass, (cls) => {
  document.body.classList.remove('theme-light', 'theme-dark')
  document.body.classList.add(cls)
}, { immediate: true })

// 全局色彩主题（唯一的色彩主题系统）
const globalColorTheme = ref('classic')
const globalColorThemeClass = computed(() => `global-theme-${globalColorTheme.value}`)

// 排版风格预设（与色彩主题解耦）
const stylePreset = ref('auto') // 'auto' = 跟随主题默认
// 风格卡片选项（value 与 .typography-* 类名对应）
const stylePresetOptions = [
  { value: 'auto' },
  { value: 'classic' },
  { value: 'elegant' },
  { value: 'playful' },
  { value: 'minimalist' },
  { value: 'journal' },
  { value: 'report' }
]
function selectStylePreset(value) {
  stylePreset.value = value
  persistStylePreset()
}
// 每个色彩主题的默认排版预设
const themeDefaultPreset = {
  classic: 'classic',
  minimal: 'minimalist',
  paper: 'elegant',
  ocean: 'minimalist',
  forest: 'minimalist',
  sunset: 'playful',
  grape: 'playful',
  slate: 'report',
  sand: 'minimalist',
  // 微信安全色主题默认排版预设
  parchment: 'journal',
  rose: 'elegant',
  sage: 'minimalist',
  lavender: 'journal',
  warmNeutral: 'report'
}
// 实际生效的排版预设（auto 时取主题默认）
const resolvedStylePreset = computed(() => {
  if (stylePreset.value === 'auto') {
    return themeDefaultPreset[globalColorTheme.value] || 'classic'
  }
  return stylePreset.value
})

// 间距预设
const spacingPreset = ref('standard')

// 文档信息（报头元数据：刊物名 / 期号 / 日期 / 栏目 / 署名）
const docMeta = ref({
  masthead: '',
  issue: '',
  date: '',
  kicker: '',
  author: ''
})


function onHtml(val) {
  html.value = val
}

function clampRatio(value) {
  if (!Number.isFinite(value)) return 0
  if (value < 0) return 0
  if (value > 1) return 1
  return value
}

function onEditorScroll(payload) {
  if (!payload) return
  const ratioInput =
    typeof payload.scrollRatio === 'number'
      ? payload.scrollRatio
      : typeof payload.ratio === 'number'
        ? payload.ratio
        : 0
  const nextRatio = clampRatio(ratioInput)
  lastEditorScrollRatio.value = nextRatio
  if (previewMode.value === 'article') {
    scheduleArticleScroll(nextRatio)
  } else if (previewMode.value === 'cards') {
    scheduleCardActivation(nextRatio)
  }
}

function scheduleArticleScroll(ratio) {
  const targetRatio = clampRatio(ratio)
  const previewComponent = articlePreviewRef.value
  if (!previewComponent || typeof previewComponent.scrollToRatio !== 'function') {
    return
  }

  if (articleScrollFrame !== null) {
    cancelAnimationFrame(articleScrollFrame)
    articleScrollFrame = null
  }

  articleScrollFrame = requestAnimationFrame(() => {
    articleScrollFrame = null
    previewComponent.scrollToRatio(targetRatio)
  })
}

function scheduleCardActivation(ratio) {
  const targetRatio = clampRatio(ratio)
  const cardsComponent = cardsPreviewRef.value
  if (!cardsComponent || typeof cardsComponent.setActiveCardByRatio !== 'function') {
    return
  }

  if (cardSyncFrame !== null) {
    cancelAnimationFrame(cardSyncFrame)
    cardSyncFrame = null
  }

  cardSyncFrame = requestAnimationFrame(() => {
    cardSyncFrame = null
    cardsComponent.setActiveCardByRatio(targetRatio)
  })
}

watch(previewMode, (mode) => {
  if (mode === 'article') {
    nextTick(() => {
      scheduleArticleScroll(lastEditorScrollRatio.value)
    })
  } else if (mode === 'cards') {
    nextTick(() => {
      scheduleCardActivation(lastEditorScrollRatio.value)
    })
  }
})

watch(html, () => {
  nextTick(() => {
    if (previewMode.value === 'article') {
      scheduleArticleScroll(lastEditorScrollRatio.value)
    } else if (previewMode.value === 'cards') {
      scheduleCardActivation(lastEditorScrollRatio.value)
    }
  })
})

async function copyForWeChat() {
  const htmlRaw = await uniEditorRef.value?.getHTML?.()
  if (!htmlRaw) { warning($t('messages.emptyContent')); return }
  const result = await copyToWechat(globalColorTheme.value, appTheme.value, resolvedStylePreset.value, spacingPreset.value)
  const themeName = $t(`themes.${globalColorTheme.value}`)
  if (result.ok) {
    if (result.degraded > 0) {
      success($t('messages.copySuccess', { theme: themeName }) + ' ' + $t('messages.copyDegraded', { count: result.degraded }))
    } else {
      success($t('messages.copySuccess', { theme: themeName }))
    }
  } else {
    error($t('messages.copyFailed'))
  }
}

async function saveCards() {
  try {
    await cardsPreviewRef.value?.exportAll?.()
    // 导出成功提示可以在CardsPreview组件内部处理
  } catch (err) {
    console.error('Export cards failed:', err)
    error($t('messages.exportFailed'))
  }
}

async function onSocialPackageImported(payload) {
  const pkg = payload?.package
  if (!pkg) return

  if (colorThemes.includes(pkg.layout.theme)) {
    globalColorTheme.value = pkg.layout.theme
    persistColorTheme()
  }
  stylePreset.value = pkg.layout.stylePreset || 'playful'
  spacingPreset.value = pkg.layout.spacingPreset || 'loose'
  persistStylePreset()
  persistSpacingPreset()

  docMeta.value = {
    masthead: '职场人格图鉴',
    issue: pkg.identity.code || '',
    date: '',
    kicker: pkg.identity.name,
    author: ''
  }
  persistDocMeta()
  setPreviewMode('cards')

  await nextTick()
  await cardsPreviewRef.value?.applySocialPackage?.({
    package: pkg,
    coverImage: payload.coverImage
  })
}

async function saveArticle() {
  if (!html.value) {
    warning($t('messages.emptyContent'))
    return
  }
  try {
    await articlePreviewRef.value?.exportArticle?.()
  } catch (err) {
    console.error('Export article failed:', err)
    error($t('messages.exportFailed'))
  }
}

async function exportProjectPackage() {
  try {
    const payload = await uniEditorRef.value?.getProjectExportData?.()
    if (!payload?.document) throw new Error('No active document')

    const project = {
      schemaVersion: 1,
      kind: 'greenplay-editor-project',
      app: '绿玩编辑器',
      basedOn: 'uni-editor',
      exportedAt: new Date().toISOString(),
      document: {
        title: payload.document.title,
        mode: payload.document.mode,
        contentPath: 'content.md',
        createdAt: payload.document.createdAt,
        updatedAt: payload.document.updatedAt
      },
      layout: {
        colorTheme: globalColorTheme.value,
        stylePreset: resolvedStylePreset.value,
        spacingPreset: spacingPreset.value,
        previewMode: previewMode.value,
        docMeta: docMeta.value
      },
      assets: payload.assets.map(({ id, path }) => ({ id, path }))
    }

    const files = [
      { name: 'project.json', data: new TextEncoder().encode(JSON.stringify(project, null, 2)) },
      { name: 'content.md', data: new TextEncoder().encode(payload.document.content || '') },
      ...payload.assets.map(({ path, data }) => ({ name: path, data }))
    ]
    const safeTitle = String(payload.document.title || 'greenplay-project')
      .replace(/[\\/:*?"<>|]+/g, '-').slice(0, 80)
    downloadBlob(createZipBlob(files), `${safeTitle || 'greenplay-project'}.zip`)
    success($t('messages.projectExportSuccess'))
  } catch (err) {
    console.error('Project package export failed:', err)
    error($t('messages.projectExportFailed'))
  }
}



function setAppTheme(theme) {
  if (theme !== 'light' && theme !== 'dark') return
  appTheme.value = theme
  persistTheme()
}

function persistTheme(){
  try { localStorage.setItem('uni.appTheme', appTheme.value) } catch {}
}

function persistColorTheme(){
  try { localStorage.setItem('uni.globalColorTheme', globalColorTheme.value) } catch {}
}

function persistStylePreset(){
  try { localStorage.setItem('uni.stylePreset', stylePreset.value) } catch {}
}

function persistSpacingPreset(){
  try { localStorage.setItem('uni.spacingPreset', spacingPreset.value) } catch {}
}

function setPreviewMode(mode) {
  previewMode.value = mode
  persistPreviewMode()
}

function persistPreviewMode(){
  try { localStorage.setItem('uni.previewMode', previewMode.value) } catch {}
}

function persistCardScale(){
  try { localStorage.setItem('uni.cardScale', String(cardScale.value)) } catch {}
}

function persistDocMeta(){
  try { localStorage.setItem('uni.docMeta', JSON.stringify(docMeta.value)) } catch {}
}

// Splitter functionality
function startResize(event) {
  isResizing.value = true
  initialMouseX.value = event.clientX
  initialLeftWidth.value = leftPanelWidth.value

  document.addEventListener('mousemove', handleResize)
  document.addEventListener('mouseup', stopResize)
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'

  event.preventDefault()
}

function handleResize(event) {
  if (!isResizing.value || !mainRef.value) return

  const deltaX = event.clientX - initialMouseX.value
  const mainWidth = mainRef.value.clientWidth
  const splitterWidth = 6 // splitter width
  const panelPadding = 32 // 16px * 2 for left and right padding
  const availableWidth = mainWidth - panelPadding
  const minPanelWidth = 300 // minimum panel width

  const newLeftWidth = Math.max(
    minPanelWidth,
    Math.min(
      availableWidth - splitterWidth - minPanelWidth,
      initialLeftWidth.value + deltaX
    )
  )

  leftPanelWidth.value = newLeftWidth
  rightPanelWidth.value = availableWidth - splitterWidth - newLeftWidth

  // Persist the split ratio based on available width
  const splitRatio = newLeftWidth / availableWidth
  try {
    localStorage.setItem('uni.splitRatio', String(splitRatio))
  } catch {}
}

function stopResize() {
  isResizing.value = false
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
}

function initializePanelSizes() {
  if (!mainRef.value) return

  const mainWidth = mainRef.value.clientWidth
  const splitterWidth = 6
  const panelPadding = 32 // 16px * 2 for left and right padding

  // Available width after accounting for padding
  const availableWidth = mainWidth - panelPadding

  // Try to restore saved split ratio
  let splitRatio = 0.5 // default 50/50 split
  try {
    const saved = localStorage.getItem('uni.splitRatio')
    if (saved) {
      const ratio = parseFloat(saved)
      if (!isNaN(ratio) && ratio >= 0.2 && ratio <= 0.8) {
        splitRatio = ratio
      }
    }
  } catch {}

  leftPanelWidth.value = Math.floor(availableWidth * splitRatio)
  rightPanelWidth.value = availableWidth - splitterWidth - leftPanelWidth.value
}

function handleWindowResize() {
  initializePanelSizes()
}

function handleCardsGenerated() {
  if (isImportingMarkdown.value) {
    isImportingMarkdown.value = false
  }
}

// 渲染 URL 通道（P0 只读）：?text=&style=&theme=&spacing=&mode=
// AI 工作台生成该链接，浏览器打开即按指定风格排版预览；URL 参数不持久化（无状态）
const renderUrlParams = (() => {
  if (typeof window === 'undefined') return null
  const params = new URLSearchParams(window.location.search)
  if (!params.get('text')) return null
  return {
    text: params.get('text'),
    style: params.get('style'),
    theme: params.get('theme'),
    spacing: params.get('spacing'),
    mode: params.get('mode')
  }
})()

const RENDER_URL_STYLES = ['auto', 'classic', 'elegant', 'playful', 'minimalist', 'journal', 'report']
const RENDER_URL_SPACINGS = ['compact', 'standard', 'loose']

onMounted(() => {
  try {
    // Restore app theme
    const savedAppTheme = localStorage.getItem('uni.appTheme')
    if (savedAppTheme === 'dark' || savedAppTheme === 'light') {
      appTheme.value = savedAppTheme
    }

    // Restore global color theme
    const savedGlobalColorTheme = localStorage.getItem('uni.globalColorTheme')
    if (savedGlobalColorTheme && colorThemes.includes(savedGlobalColorTheme)) {
      globalColorTheme.value = savedGlobalColorTheme
    } else {
      // 兼容性：如果没有保存的全局色彩主题，尝试从旧的preview theme恢复
      const savedPreviewTheme = localStorage.getItem('uni.previewTheme')
      if (savedPreviewTheme && colorThemes.includes(savedPreviewTheme)) {
        globalColorTheme.value = savedPreviewTheme
        // 迁移到新的存储key
        persistColorTheme()
      }
    }

    // Restore preview mode
    const savedPreviewMode = localStorage.getItem('uni.previewMode')
    if (savedPreviewMode === 'article' || savedPreviewMode === 'cards') {
      previewMode.value = savedPreviewMode
    }

    // Restore card scale
    const savedCardScale = localStorage.getItem('uni.cardScale')
    if (savedCardScale) {
      const scale = parseFloat(savedCardScale)
      if (!isNaN(scale) && scale >= 0.5 && scale <= 1.0) {
        cardScale.value = scale
      }
    }

    // Restore style preset
    const savedStylePreset = localStorage.getItem('uni.stylePreset')
    if (savedStylePreset) {
      stylePreset.value = savedStylePreset
    }

    // Restore spacing preset
    const savedSpacingPreset = localStorage.getItem('uni.spacingPreset')
    if (savedSpacingPreset) {
      spacingPreset.value = savedSpacingPreset
    }

    // Restore doc meta (masthead / issue / date / kicker / author)
    const savedDocMeta = localStorage.getItem('uni.docMeta')
    if (savedDocMeta) {
      try {
        const parsed = JSON.parse(savedDocMeta)
        if (parsed && typeof parsed === 'object') {
          docMeta.value = { masthead: '', issue: '', date: '', kicker: '', author: '', ...parsed }
        }
      } catch {}
    }

    // 渲染 URL 通道：URL 参数优先于本地存储（无状态，不 persist）
    if (renderUrlParams) {
      if (renderUrlParams.style && RENDER_URL_STYLES.includes(renderUrlParams.style)) {
        stylePreset.value = renderUrlParams.style
      }
      if (renderUrlParams.theme && colorThemes.includes(renderUrlParams.theme)) {
        globalColorTheme.value = renderUrlParams.theme
      }
      if (renderUrlParams.spacing && RENDER_URL_SPACINGS.includes(renderUrlParams.spacing)) {
        spacingPreset.value = renderUrlParams.spacing
      }
      if (renderUrlParams.mode === 'article' || renderUrlParams.mode === 'cards') {
        previewMode.value = renderUrlParams.mode
      }
    }
  } catch {}

  // Initialize panel sizes after mount
  setTimeout(() => {
    initializePanelSizes()
  }, 100)

  // Listen for window resize
  window.addEventListener('resize', handleWindowResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleWindowResize)
  document.removeEventListener('mousemove', handleResize)
  document.removeEventListener('mouseup', stopResize)
  if (articleScrollFrame !== null) {
    cancelAnimationFrame(articleScrollFrame)
    articleScrollFrame = null
  }
  if (cardSyncFrame !== null) {
    cancelAnimationFrame(cardSyncFrame)
    cardSyncFrame = null
  }
})
</script>

<style lang="less" scoped>
@import './styles/less/variables/colors.less';
@import './styles/less/variables/layout.less';
@import './styles/less/variables/typography.less';
@import './styles/less/mixins/common.less';
/* 全局色彩主题定义已移至 /src/styles/less/themes/global.less */

.editor-scope {
  min-height: 0;
  display: grid;
  grid-template-rows: 1fr;
  height: 100%;
}

/* 预览区头部：flex 行布局，左模式切换 + 右操作按钮 */
.preview-header {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
  /* 不能加 overflow:hidden：文档信息/排版设置的下拉面板从这里向下展开，会被裁掉 */
}

.preview-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: auto;
  flex-shrink: 0;
  flex-wrap: nowrap;
}

/* 紧凑型操作按钮 */
.btn-sm {
  padding: 4px 10px !important;
  min-height: 26px !important;
  font-size: 11px !important;
}

.mode-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--panel);
  flex-shrink: 0;
}

.mode-tab {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 6px 14px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.02em;
  white-space: nowrap;
  cursor: pointer;
  transition: color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
  outline: none;
}

.mode-tab:hover {
  color: var(--text);
}

.mode-tab.active {
  color: var(--text);
  background: color-mix(in srgb, var(--accent) 13%, var(--panel));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 40%, transparent);
}

.mode-tab:focus-visible {
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 32%, transparent);
}

/* 色彩主题网格（设置抽屉内） */
.color-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.color-cell {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
  text-align: left;
}

.color-cell:hover {
  border-color: color-mix(in srgb, var(--accent) 45%, var(--border));
}

.color-cell.active {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 10%, var(--panel));
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 45%, transparent);
}

.color-cell-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--swatch);
  border: 1px solid rgba(0, 0, 0, 0.15);
  flex-shrink: 0;
}

.color-cell-name {
  font-size: 12px;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 排版风格卡片（设置抽屉内，带迷你排版预览） */
.style-card-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.style-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--bg);
  cursor: pointer;
  text-align: left;
  transition: border-color 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
  outline: none;

  &:hover {
    border-color: color-mix(in srgb, var(--accent) 45%, var(--border));
  }

  &.active {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 10%, var(--panel));
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 45%, transparent);
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 32%, transparent);
  }
}

/* 迷你排版预览：复用 .typography-{preset} 真实样式，直观展示整体版式差异 */
.style-card-preview {
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px 12px;
  border-radius: 6px;
  border: 1px solid var(--card-border, var(--border));
  background: var(--card-bg, var(--bg));
  color: var(--card-text, var(--text));
  overflow: hidden;
  min-height: 74px;

  .style-pv-h {
    display: block;
    font-size: 1.15em;
    font-weight: 700;
    line-height: 1.35;
  }

  .style-pv-p {
    display: block;
    font-size: 0.8em;
    line-height: 1.55;
    color: var(--card-text, var(--text));
  }

  .style-pv-bq {
    display: block;
    font-size: 0.72em;
    line-height: 1.5;
    padding: 4px 8px;
    border-radius: 4px;
  }
}

.style-card-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
}

.style-card-desc {
  font-size: 10px;
  line-height: 1.45;
  color: var(--muted);
}

.dock-hint {
  font-size: 11px;
  line-height: 1.5;
  color: var(--muted);
  margin: -4px 0 10px;
}

/* 设置抽屉 */
.dock-trigger.active {
  border-color: color-mix(in srgb, var(--accent) 50%, var(--border));
  background: color-mix(in srgb, var(--accent) 12%, var(--panel));
}

/* 外观明暗切换（设置抽屉内） */
.appearance-seg {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.appearance-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 9px 10px;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--bg);
  color: var(--muted);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease, box-shadow 0.15s ease;

  svg {
    flex-shrink: 0;
  }

  &:hover {
    border-color: color-mix(in srgb, var(--accent) 45%, var(--border));
    color: var(--text);
  }

  &.active {
    border-color: var(--accent);
    background: color-mix(in srgb, var(--accent) 12%, var(--panel));
    color: var(--text);
    box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--accent) 45%, transparent);
  }
}

.dock-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.32);
  z-index: 200;
}

.dock-panel {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: 320px;
  max-width: 88vw;
  background: var(--panel);
  border-left: 1px solid var(--border);
  box-shadow: -12px 0 32px rgba(0, 0, 0, 0.18);
  z-index: 210;
  display: flex;
  flex-direction: column;
}

.dock-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.dock-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  letter-spacing: 0.02em;
}

.dock-close {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}

.dock-close:hover {
  background: color-mix(in srgb, var(--accent) 10%, var(--panel));
  color: var(--text);
}

.dock-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.dock-section-title {
  margin: 0 0 8px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}

.dock-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 8px;
}

.select-block {
  width: 100%;
}

/* 抽屉动画 */
.dock-fade-enter-active,
.dock-fade-leave-active {
  transition: opacity 0.2s ease;
}

.dock-fade-enter-from,
.dock-fade-leave-to {
  opacity: 0;
}

.dock-slide-enter-active,
.dock-slide-leave-active {
  transition: transform 0.24s cubic-bezier(0.32, 0.72, 0.24, 1);
}

.dock-slide-enter-from,
.dock-slide-leave-to {
  transform: translateX(100%);
}

/* Logo链接样式 */
.logo {
  text-decoration: none;
  color: inherit;
  transition: opacity 0.2s ease;
  flex-shrink: 0;
}

.logo:hover {
  opacity: 0.85;
}

.logo-mark {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s ease, filter 0.2s ease;
  filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.15));

  svg {
    display: block;
  }
}

.logo:hover .logo-mark {
  transform: scale(1.06);
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

/* 紧凑型下拉选择器 */
.select-compact {
  min-height: 28px !important;
  padding: 4px 8px !important;
  font-size: 11px !important;
  border-radius: 6px !important;
}

/* 紧凑型输入框（设置抽屉文档信息） */
.input-compact {
  width: 100%;
  min-height: 28px;
  padding: 4px 8px;
  font-size: 12px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--bg);
  color: var(--text);
  box-sizing: border-box;

  &::placeholder {
    color: color-mix(in srgb, var(--text) 40%, transparent);
  }

  &:focus {
    outline: none;
    border-color: var(--accent);
  }
}

/* GitHub链接样式（历史遗留，模板中已无对应元素） */

/* 底部状态栏样式 */
.footer-brand {
  font-weight: 600;
  font-size: 13px;
  color: var(--text);
  letter-spacing: 0.2px;
}

.footer-sep {
  color: var(--border);
  font-size: 13px;
  line-height: 1;
  margin: 0 2px;
}

.footer-divider {
  width: 1px;
  height: 14px;
  background: var(--border);
  margin: 0 2px;
}

.about-trigger {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border: none;
  background: transparent;
  color: var(--muted);
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
  border-radius: 6px;
  transition: color 0.15s ease, background 0.15s ease;

  svg {
    flex-shrink: 0;
  }
}

.about-trigger:hover {
  color: var(--text);
  background: color-mix(in srgb, var(--muted) 10%, var(--panel));
}

.footer-link {
  color: var(--accent);
  text-decoration: none;
  transition: opacity 0.2s ease;
}

.footer-link:hover {
  opacity: 0.8;
  text-decoration: underline;
}

/* 通用字体大小样式 */
.small-text {
  font-size: 12px;
}

/* 卡片容器样式 */
.cards-container {
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
}

/* 主要操作按钮（复制/保存）强调样式 */
.btn-primary {
  background: color-mix(in srgb, var(--accent) 85%, var(--panel)) !important;
  color: white !important;
  border-color: color-mix(in srgb, var(--accent) 70%, var(--border)) !important;

  &:hover {
    background: color-mix(in srgb, var(--accent) 95%, black) !important;
    color: white !important;
    border-color: color-mix(in srgb, var(--accent) 85%, black) !important;
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 40%, transparent);
  }
}

/* 主操作大按钮：常驻预览区，唯一强调视觉 */
.btn-lg {
  min-height: 34px;
  padding: 6px 18px !important;
  font-size: 13px !important;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  box-shadow: 0 2px 8px color-mix(in srgb, var(--accent) 28%, transparent);
  transition: box-shadow 0.15s ease, background 0.15s ease;

  &:hover {
    box-shadow: 0 4px 12px color-mix(in srgb, var(--accent) 36%, transparent);
  }
}

/* 工具栏内的缩放控制布局 */
.scale-control-inline {
  display: flex;
  align-items: center;
  gap: 6px;
}

.scale-slider {
  width: 90px; /* 工具栏内缩短宽度 */
  height: 4px;
  border-radius: 2px;
  background: var(--border);
  outline: none;
  appearance: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.scale-slider:hover {
  background: color-mix(in srgb, var(--accent) 30%, var(--border));
}

.scale-slider::-webkit-slider-thumb {
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--accent);
  cursor: pointer;
  border: 2px solid var(--panel);
  box-shadow: 0 2px 6px color-mix(in srgb, var(--accent) 30%, transparent);
  transition: all 0.2s ease;
}

.scale-slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 3px 8px color-mix(in srgb, var(--accent) 40%, transparent);
}

.scale-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--accent);
  cursor: pointer;
  border: 2px solid var(--panel);
  box-shadow: 0 2px 6px color-mix(in srgb, var(--accent) 30%, transparent);
  transition: all 0.2s ease;
}

.scale-slider::-moz-range-thumb:hover {
  transform: scale(1.1);
  box-shadow: 0 3px 8px color-mix(in srgb, var(--accent) 40%, transparent);
}

.scale-value {
  min-width: 35px;
  text-align: center;
  color: var(--accent);
  font-weight: 500;
}

/* Panel Splitter Styles */
.panel-splitter {
  width: 6px;
  background: transparent;
  cursor: col-resize;
  position: relative;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.splitter-handle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 6px;
  height: 48px;
  border-radius: 3px;
  background: var(--border);
  transition: background 0.15s ease;
}

.panel-splitter:hover .splitter-handle,
.panel-splitter.resizing .splitter-handle {
  background: var(--accent);
}

.splitter-dots {
  display: none;
}

.panel-splitter:hover .splitter-dots .dot,
.panel-splitter.resizing .splitter-dots .dot {
  background: var(--accent);
}

/* Panel layout adjustments for splitter */
.main > .panel {
  overflow: hidden;
}

/*
 * 工具栏下拉菜单属于左侧编辑器面板，但会向下展开到编辑区内容上方。
 * 让左面板形成更高的层叠上下文，并允许浮层越过面板边界；正文自身仍由
 * Vditor 的内容区域滚动，不会因此放开整页滚动。
 */
.main > .panel.editor-scope {
  position: relative;
  z-index: 30;
  overflow: visible;
}

.main > .panel.editor-scope + .panel-splitter,
.main > .panel.editor-scope ~ .panel {
  position: relative;
  z-index: 1;
}

/* 响应式：中等宽度 768px-1080px */
@media (max-width: 1080px) {
  .mode-tab {
    padding: 6px 12px;
    font-size: 11px;
  }

  .btn-sm {
    padding: 3px 8px !important;
    font-size: 10px !important;
  }

  .preview-header {
    flex-wrap: wrap;
    gap: 6px;
  }

  .preview-actions {
    gap: 6px;
  }
}

/* Mobile responsive - hide splitter on small screens */
@media (max-width: 768px) {
  .panel-splitter {
    display: none;
  }

  .main {
    grid-template-columns: 1fr !important;
    grid-template-rows: 1fr 1fr !important;
  }

  .main > .panel {
    width: 100% !important;
    overflow: auto;
  }

  .banner {
    padding: 8px 12px;
  }

  .logo-text {
    font-size: 14px;
  }
}

</style>
