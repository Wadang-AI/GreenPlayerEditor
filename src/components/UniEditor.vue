<template>
<div class="uni-editor">
    <!-- 文档库侧栏：常驻历史文章列表（可折叠/搜索/新建/导入） -->
    <aside class="doc-sidebar" :class="{ collapsed: docSidebarCollapsed }">
      <div class="sidebar-header">
        <div class="sidebar-title">
          <span class="sidebar-title-text" v-if="!docSidebarCollapsed">{{ t('documents.library') }}</span>
          <span class="sidebar-count" v-if="!docSidebarCollapsed">
            <template v-if="searchQuery.trim()">
              {{ filteredDocumentsAll.length }}/{{ allDocuments.length }}
            </template>
            <template v-else>
              {{ filteredDocuments.length }}<span v-if="showLoadMore">/{{ allDocuments.length }}</span>
            </template>
          </span>
        </div>
        <div class="sidebar-actions">
          <button class="action-btn" @click="importApprovedSocialPackage" :title="t('documents.importApproved')">
            <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d="M3 2.5h7l3 3v8H3z"/>
              <path d="M10 2.5v3h3M5.2 9l1.7 1.7L10.8 7"/>
            </svg>
          </button>
          <button class="action-btn" @click="createNewDocument" :title="t('documents.newDocument')">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 2a.5.5 0 0 1 .5.5v5h5a.5.5 0 0 1 0 1h-5v5a.5.5 0 0 1-1 0v-5h-5a.5.5 0 0 1 0-1h5v-5A.5.5 0 0 1 8 2Z"/>
            </svg>
          </button>
          <button class="action-btn" @click="toggleDocSidebar" :title="docSidebarCollapsed ? t('common.expand') : t('common.collapse')">
            <svg v-if="docSidebarCollapsed" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M9 3v18"/>
              <path d="m14 9-3 3 3 3"/>
            </svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M9 3v18"/>
              <path d="m10 9 3 3-3 3"/>
            </svg>
          </button>
        </div>
      </div>
      <div class="sidebar-search" v-if="!docSidebarCollapsed">
        <input
          v-model="searchQuery"
          type="text"
          class="search-input"
          :placeholder="$t('common.search') || 'Search documents...'"
          @input="handleSearch"
        >
        <svg v-if="!searchQuery" class="search-icon" width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
          <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
        </svg>
        <button v-else class="search-clear" @click="clearSearch" :title="t('common.clearSearch')">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor">
            <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8 2.146 5.854Z"/>
          </svg>
        </button>
      </div>
      <div class="sidebar-list" v-if="!docSidebarCollapsed">
        <div class="document-list">
          <div
            v-for="doc in filteredDocuments"
            :key="doc.id"
            class="document-item"
            :class="{
              active: doc.id === activeTabId,
              closed: !isTabOpen(doc.id),
              modified: isDocumentModified(doc.id),
              selected: selectedDocumentId === doc.id
            }"
            @click="selectDocument(doc.id)"
            @dblclick="openDocument(doc.id)"
          >
            <div class="document-info">
              <div class="document-title">
                <span class="title-text">{{ doc.title }}</span>
              </div>
              <div class="document-meta">
                <span class="doc-date">{{ formatDate(doc.updatedAt) }}</span>
                <span class="doc-size">{{ t('documents.charactersCount', { count: doc.content?.length || 0 }) }}</span>
              </div>
            </div>
            <div class="document-actions" @click.stop>
              <button
                class="doc-action-btn"
                @click.stop="handleDocumentTabAction(doc.id)"
                :title="getTabActionTitle(doc.id)"
              >
                <!-- 未打开：显示打开图标 -->
                <svg v-if="!isTabOpen(doc.id)" width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  <path d="M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z"/>
                </svg>
                <!-- 已打开但非活跃：显示定位图标 -->
                <svg v-else-if="doc.id !== activeTabId" width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8z"/>
                </svg>
                <!-- 当前活跃：显示关闭图标（与标签栏X一致） -->
                <svg v-else width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M9.5 3.5L8.5 2.5L6 5L3.5 2.5L2.5 3.5L5 6L2.5 8.5L3.5 9.5L6 7L8.5 9.5L9.5 8.5L7 6L9.5 3.5Z"/>
                </svg>
              </button>
              <button
                class="doc-action-btn"
                @click.stop="importMarkdownToDocument(doc.id)"
                :title="t('documents.importMD')"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                  <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 4.854a.5.5 0 1 1-.708-.708l3-3z"/>
                </svg>
              </button>
              <button
                class="doc-action-btn"
                @click.stop="exportMarkdownFromDocument(doc.id)"
                :title="t('documents.exportMD')"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
                  <path d="M7.646 11.854a.5.5 0 0 0 .708 0l3-3a.5.5 0 0 0-.708-.708L8.5 10.293V1.5a.5.5 0 0 0-1 0v8.793L5.354 8.146a.5.5 0 1 0-.708.708l3 3z"/>
                </svg>
              </button>
              <button
                class="doc-action-btn"
                @click.stop="duplicateDocument(doc.id)"
                :title="t('documents.duplicateDocument')"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M4 1.5H3a2 2 0 0 0-2 2V14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V3.5a2 2 0 0 0-2-2h-1v1h1a1 1 0 0 1 1 1V14a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1h1v-1z"/>
                  <path d="M9.5 1a.5.5 0 0 1 .5.5v1a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5v-1a.5.5 0 0 1 .5-.5h3zm-3-1A1.5 1.5 0 0 0 5 1.5v1A1.5 1.5 0 0 0 6.5 4h3A1.5 1.5 0 0 0 11 2.5v-1A1.5 1.5 0 0 0 9.5 0h-3z"/>
                </svg>
              </button>
              <button
                class="doc-action-btn danger"
                @click.stop="confirmDeleteDocument(doc.id)"
                :title="t('documents.deleteDocument')"
                :disabled="allDocuments.length <= 1"
              >
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                  <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- 加载更多按钮 -->
        <div v-if="showLoadMore" class="load-more-container">
          <button class="load-more-btn" @click="loadMoreDocuments">
            <span>{{ $t('common.loadMore') || 'Load more' }}</span>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
              <path d="M7.646 9.646a.5.5 0 0 1 .708 0L12 13.293V2.5a.5.5 0 0 1 1 0v10.793l3.646-3.647a.5.5 0 0 1 .708.708l-4.5 4.5a.5.5 0 0 1-.708 0l-4.5-4.5a.5.5 0 0 1 0-.708z"/>
            </svg>
          </button>
        </div>
      </div>
    </aside>
    <button
      v-if="docSidebarCollapsed"
      class="doc-sidebar-fab"
      type="button"
      @click="toggleDocSidebar"
      :title="t('documents.library')"
      :aria-label="t('documents.library')"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="2"/>
        <path d="M8 4v16M12 8h5M12 12h5M12 16h3"/>
      </svg>
    </button>

    <!-- 编辑器 -->
    <div class="editor-container">
      <div ref="elRef" class="vditor-host"></div>
    </div>

    <!-- 图片缩放菜单 (使用 Teleport 挂载到 body) -->
    <Teleport to="body">
      <div
        v-if="showImageResizeHandle"
        class="image-resize-menu"
        :style="imageResizeHandleStyle"
        @click.stop
      >
        <div class="resize-menu-content">
          <div class="resize-title">{{ t('imageResize.title') }}</div>
          <div class="resize-options">
            <button @click="setImageSize(100)" :class="{ active: currentImageSize === 100 }">100%</button>
            <button @click="setImageSize(75)" :class="{ active: currentImageSize === 75 }">75%</button>
            <button @click="setImageSize(50)" :class="{ active: currentImageSize === 50 }">50%</button>
            <button @click="setImageSize(25)" :class="{ active: currentImageSize === 25 }">25%</button>
          </div>
          <div class="resize-custom">
            <input
              type="number"
              min="10"
              max="100"
              v-model.number="customSize"
              @keyup.enter="applyCustomSize"
              class="resize-input"
              :aria-label="t('imageResize.customWidthAria')"
            />
            <span class="resize-percent">%</span>
            <button @click="applyCustomSize" class="resize-apply">{{ t('imageResize.apply') }}</button>
          </div>
          <div class="resize-title">{{ t('imageResize.align') }}</div>
          <div class="resize-options align">
            <button @click="setImageAlign('left')" :class="{ active: currentImageAlign === 'left' }" :title="t('imageResize.leftTip')">{{ t('imageResize.left') }}</button>
            <button @click="setImageAlign('center')" :class="{ active: currentImageAlign === 'center' }" :title="t('imageResize.centerTip')">{{ t('imageResize.center') }}</button>
            <button @click="setImageAlign('right')" :class="{ active: currentImageAlign === 'right' }" :title="t('imageResize.rightTip')">{{ t('imageResize.right') }}</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 「更多」工具栏浮层（低频 / 需选中文本的功能收纳） -->
    <Teleport to="body">
      <div
        v-if="showMoreMenu"
        class="more-toolbar-menu"
        :style="moreMenuStyle"
        @click.stop
      >
        <div class="more-menu-section">
          <div class="more-menu-title">{{ t('moreMenu.insert') }}</div>
          <div class="more-menu-grid">
            <button class="more-menu-item" @click="triggerToolbarItem('quote')">
              <span class="more-menu-icon" v-html="quoteIconSvg"></span>
              <span class="more-menu-label">{{ t('moreMenu.quote') }} <em>{{ t('moreMenu.selectedText') }}</em></span>
            </button>
            <button class="more-menu-item" @click="triggerToolbarItem('code')">
              <span class="more-menu-icon" v-html="codeIconSvg"></span>
              <span class="more-menu-label">{{ t('moreMenu.code') }} <em>{{ t('moreMenu.selectedText') }}</em></span>
            </button>
            <button class="more-menu-item" @click="triggerToolbarItem('table')">
              <span class="more-menu-icon" v-html="tableIconSvg"></span>
              <span class="more-menu-label">{{ t('moreMenu.table') }} <em>{{ t('moreMenu.atCursor') }}</em></span>
            </button>
            <button class="more-menu-item" @click="triggerToolbarItem('link')">
              <span class="more-menu-icon" v-html="linkIconSvg"></span>
              <span class="more-menu-label">{{ t('moreMenu.link') }} <em>{{ t('moreMenu.selectedText') }}</em></span>
            </button>
          </div>
        </div>
        <div class="more-menu-divider"></div>
        <div class="more-menu-section">
          <div class="more-menu-title">{{ t('moreMenu.tools') }}</div>
          <div class="more-menu-grid">
            <button class="more-menu-item" @click="triggerToolbarItem('emoji')">
              <span class="more-menu-icon" v-html="emojiIconSvg"></span>
              <span class="more-menu-label">{{ t('moreMenu.emoji') }}</span>
            </button>
            <button class="more-menu-item" @click="triggerToolbarItem('ai-settings')">
              <span class="more-menu-icon" v-html="aiSettingsIconSvg"></span>
              <span class="more-menu-label">{{ t('moreMenu.aiSettings') }}</span>
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 删除确认对话框 -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click="cancelDelete">
      <div class="modal-dialog" @click.stop>
        <div class="modal-header">
          <h3>{{ t('documents.confirmDelete') }}</h3>
        </div>
        <div class="modal-body">
          <p>{{ t('documents.confirmDeleteMessage', { title: getDocument(documentToDelete)?.title }) }}</p>
          <p class="warning-text">{{ t('documents.warningNotRecoverable') }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="cancelDelete">{{ t('common.cancel') }}</button>
          <button class="btn btn-danger" @click="deleteDocument">{{ t('common.confirm') }}</button>
        </div>
      </div>
    </div>

    <!-- 导入覆盖确认对话框 -->
    <div v-if="showImportConfirm" class="modal-overlay" @click="cancelImport">
      <div class="modal-dialog" @click.stop>
        <div class="modal-header">
          <h3>{{ t('documents.confirmImport') }}</h3>
        </div>
        <div class="modal-body">
          <p>{{ t('documents.confirmImportMessage', { title: getDocument(importTargetDocId)?.title }) }}</p>
          <p>{{ t('documents.confirmImportSubMessage') }}</p>
          <p class="warning-text">{{ t('documents.warningNotRecoverable') }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="cancelImport">{{ t('common.cancel') }}</button>
          <button class="btn btn-primary" @click="confirmImport">{{ t('documents.confirmImportAction') }}</button>
        </div>
      </div>
    </div>

    <!-- AI 设置对话框 -->
    <div v-if="showAISettings" class="modal-overlay" @click.self="closeAISettings">
      <div class="modal-dialog" @click.stop>
        <div class="modal-header">
          <h3>{{ t('aiSettings.title') }}</h3>
        </div>
        <div class="modal-body">
          <div class="form-group" style="margin-bottom: 12px;">
            <label style="display: block; margin-bottom: 4px; font-weight: 500;">{{ t('aiSettings.providerPreset') }}</label>
            <select class="form-input" v-model="selectedAIPreset" @change="applyAIPreset" style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: 4px; background: var(--bg); color: var(--text);">
              <option v-for="item in aiPresetOptions" :key="item.value" :value="item.value">{{ item.label }}</option>
            </select>
          </div>
          <div class="form-group" style="margin-bottom: 12px;">
            <label style="display: block; margin-bottom: 4px; font-weight: 500;">API Key <span style="color: #ef4444;">*</span></label>
            <input type="password" class="form-input" v-model="aiConfig.apiKey" placeholder="sk-..." style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: 4px; background: var(--bg); color: var(--text);" />
          </div>
          <div class="form-group" style="margin-bottom: 12px;">
            <label style="display: block; margin-bottom: 4px; font-weight: 500;">{{ t('aiSettings.baseUrl') }}</label>
            <input type="text" class="form-input" v-model="aiConfig.baseURL" @input="selectedAIPreset = 'custom'" placeholder="https://api.openai.com/v1" style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: 4px; background: var(--bg); color: var(--text);" />
          </div>
          <div class="form-group" style="margin-bottom: 12px;">
            <label style="display: block; margin-bottom: 4px; font-weight: 500;">{{ t('aiSettings.model') }}</label>
            <input type="text" class="form-input" v-model="aiConfig.model" @input="selectedAIPreset = 'custom'" placeholder="gpt-4o-mini" style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: 4px; background: var(--bg); color: var(--text);" />
          </div>
          <div class="form-group" style="margin-bottom: 12px;">
            <label style="display: block; margin-bottom: 4px; font-weight: 500;">{{ t('aiSettings.stylePreset') }}</label>
            <select class="form-input" v-model="aiConfig.stylePreset" style="width: 100%; padding: 8px; border: 1px solid var(--border); border-radius: 4px; background: var(--bg); color: var(--text);">
              <option value="auto">{{ t('aiSettings.styleAuto') }}</option>
              <option value="academic">{{ t('aiSettings.styleAcademic') }}</option>
              <option value="lively">{{ t('aiSettings.styleLively') }}</option>
              <option value="concise">{{ t('aiSettings.styleConcise') }}</option>
              <option value="xiaohongshu">{{ t('aiSettings.styleXiaohongshu') }}</option>
            </select>
          </div>
          <p class="muted small-text" style="margin-top: 12px; line-height: 1.4; color: var(--muted);">{{ t('aiSettings.compatHint') }}</p>
          <div v-if="aiConnectionStatus || aiDiagnostics.message" class="ai-diagnostics-panel" style="margin-top: 14px; padding: 12px; border: 1px solid var(--border); border-radius: 8px; background: color-mix(in srgb, var(--panel) 86%, transparent);">
            <div v-if="aiConnectionStatus" class="small-text" :style="{ color: aiConnectionStatus.type === 'success' ? '#10b981' : aiConnectionStatus.type === 'error' ? '#ef4444' : 'var(--muted)' }">
              {{ aiConnectionStatus.text }}
            </div>
            <div v-if="aiDiagnostics.message" style="margin-top: 8px;">
              <div style="font-size: 13px; font-weight: 600; margin-bottom: 6px;">{{ t('aiSettings.diagTitle') }}</div>
              <div class="small-text" style="line-height: 1.6; white-space: pre-wrap; color: var(--text);">{{ aiDiagnostics.message }}</div>
            </div>
          </div>
        </div>
        <div class="modal-footer" style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 16px;">
          <button class="btn btn-secondary" @click="closeAISettings">{{ t('common.cancel') }}</button>
          <button class="btn btn-secondary" @click="handleAITest" :disabled="isAITesting">{{ isAITesting ? t('aiSettings.testing') : t('aiSettings.testConnection') }}</button>
          <button class="btn btn-secondary" @click="saveAISettings">{{ t('aiSettings.saveOnly') }}</button>
          <button class="btn btn-primary" @click="saveAndFormat">{{ t('aiSettings.saveAndFormat') }}</button>
        </div>
      </div>
    </div>
    
    <!-- AI 排版结果预览（应用前确认，不直接改动文档） -->
    <div v-if="showAIResultPreview" class="modal-overlay" @click.self="discardAIResult">
      <div class="modal-dialog ai-result-dialog" @click.stop>
        <div class="modal-header">
          <h3>{{ t('aiResult.title') }}</h3>
        </div>
        <div class="modal-body ai-result-body">
          <p class="muted small-text">{{ t('aiResult.description') }}</p>
          <div class="ai-result-compare">
            <div class="ai-result-pane">
              <div class="ai-pane-label">{{ t('aiResult.original') }}</div>
              <div ref="aiPreviewBeforeEl" class="ai-result-render"></div>
            </div>
            <div class="ai-result-pane">
              <div class="ai-pane-label ai-pane-label-accent">{{ t('aiResult.formatted') }}</div>
              <div ref="aiPreviewAfterEl" class="ai-result-render"></div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="discardAIResult">{{ t('aiResult.discard') }}</button>
          <button class="btn btn-primary" @click="applyAIResult">{{ t('aiResult.apply') }}</button>
        </div>
      </div>
    </div>

    <LoadingOverlay
      :show="isAILoading"
      :text="aiLoadingText"
      :theme="'classic'"
      :pageTheme="props.pageTheme"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import Vditor from 'vditor'
import 'vditor/dist/index.css'
import zhMessages from '../locales/zh.js'
import enMessages from '../locales/en.js'
import { useToast } from '../composables/useToast'
import LoadingOverlay from './LoadingOverlay.vue'
import { planLayoutWithAI, validateLayoutPlan, applyLayoutPlan, resolveStyleLimits, deterministicFormat, testAIConnection } from '../utils/ai.js'
import {
  saveImage,
  getImageDataUrl,
  convertContentForEditor,
  convertContentForStorage,
  clearImageCache,
  extractImageIdsFromContent,
  cleanupUnusedImages,
  hasIndexedDBSupport
} from '../utils/imageStore.js'
import {
  normalizeSocialPackage,
  buildSocialMarkdown,
  createSocialDocumentTitle,
  embeddedAssetFile,
  getRequiredAssetNames
} from '../utils/socialPackage.js'
import { projectAssetFromDataUrl } from '../utils/projectPackage.js'

const props = defineProps({
  pageTheme: { type: String, default: 'theme-dark' },
  // 渲染 URL 通道：外部传入的初始 Markdown（AI 工作台生成 ?text=... 打开即预览）
  initialMarkdown: { type: String, default: '' }
})
const emit = defineEmits(['update:html', 'editorScroll', 'socialPackageImported'])

const { locale, t } = useI18n()

const elRef = ref(null)
let vd = null
let isVditorReady = false
const scrollCleanups = []
let cleanupModeListener = null
const showImageResizeHandle = ref(false)
const imageResizeHandleStyle = ref({})
const selectedImageEl = ref(null)
const currentImageSize = ref(100)
const currentImageAlign = ref('left')
const customSize = ref(100)
let imageResizeSyncTimer = null
const imageSizeBySrc = new Map()
const imageAlignBySrc = new Map()

const CACHE_KEY = 'uni-editor-content'
const MODE_CACHE_KEY = 'uni-editor-mode'
const CACHE_VERSION_KEY = 'uni.cacheVersion'
const CURRENT_CACHE_VERSION = 2 // v1: single document, v2: multi-document
const AI_PRESET_KEY = 'uni.aiPreset'

// 文档管理状态
const allDocuments = ref([]) // 所有文档缓存
const openTabs = ref([]) // 当前打开的标签页
const activeTabId = ref('') // 当前活跃的标签
const selectedDocumentId = ref('') // 在文档列表中选中的文档
const docSidebarCollapsed = ref(typeof window !== 'undefined' && window.innerWidth < 1024) // 文档库侧栏是否折叠，小屏默认折叠
const showDeleteConfirm = ref(false) // 删除确认对话框
const documentToDelete = ref('') // 待删除的文档ID
const showImportConfirm = ref(false) // 导入确认对话框
const importTargetDocId = ref('') // 导入目标文档ID
const pendingImportFile = ref(null) // 待导入的文件

const { success, error, warning } = useToast()

// AI 配置状态
const showAISettings = ref(false)
const isAILoading = ref(false)

// 「更多」工具栏浮层
const showMoreMenu = ref(false)
const moreMenuStyle = ref({ top: '0px', left: '0px' })

// 「更多」浮层图标（描边风格，呼应杂志工作室的克制线条）
const quoteIconSvg = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5.5 5h4.2c1.2 0 2 .8 2 2.1v2.6c0 2.4-1.5 4.2-3.9 4.9-.4.1-.8.1-.8.1l-.7-.01c.9-.3 1.5-1 1.7-1.9.1-.4.1-.8.1-.8-.5 0-1.1-.1-1.6-.4-1-.5-1.6-1.4-1.6-2.7V6.5C5.3 5.6 5.9 5 6.9 5zM15.6 5h4.2c1.2 0 2 .8 2 2.1v2.6c0 2.4-1.5 4.2-3.9 4.9-.4.1-.8.1-.8.1l-.8-.01c.9-.3 1.5-1 1.7-1.9.1-.4.1-.8.1-.8-.5 0-1.1-.1-1.6-.4-1-.5-1.6-1.4-1.6-2.7V6.5c0-.9.6-1.5 1.7-1.5z"/></svg>'
const codeIconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M8.5 7L4 12l4.5 5M15.5 7L20 12l-4.5 5M14 4l-4 16"/></svg>'
const tableIconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="4" y="5" width="16" height="14" rx="1.5"/><path d="M4 10h16M4 15h16M10 10v9M15 10v9"/></svg>'
const linkIconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M10.5 14.5l3-3"/><path d="M8.5 13.5l-2.2 2.2a3 3 0 1 0 4.2 4.2l2.3-2.3"/><path d="M15.5 10.5l2.2-2.2a3 3 0 1 0-4.2-4.2l-2.3 2.3"/></svg>'
const emojiIconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="9"/><path d="M8.5 14.5c.9 1.3 2.1 2 3.5 2s2.6-.7 3.5-2"/><circle cx="9" cy="10" r="0.6" fill="currentColor"/><circle cx="15" cy="10" r="0.6" fill="currentColor"/></svg>'
const aiSettingsIconSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 .99-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51.99H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>'

// AI 排版结果预览（应用前确认，不再直接覆盖文档）
const pendingAIResult = ref('')
const aiPreviewBefore = ref('')
const showAIResultPreview = ref(false)
const aiPreviewBeforeEl = ref(null)
const aiPreviewAfterEl = ref(null)
const aiStreamingChars = ref(0)

const isAITesting = ref(false)
const aiLoadingText = ref(t('ai.loadingDefault'))
const selectedAIPreset = ref('custom')
const aiConnectionStatus = ref(null)
const aiDiagnostics = ref({ message: '' })
let aiLoadingTimer = null
let aiLoadingStartedAt = 0
let aiLoadingStage = 'idle'
const aiPresetOptions = computed(() => [
  { value: 'custom', label: t('aiSettings.customPreset'), baseURL: '', model: '' },
  { value: 'openai', label: 'OpenAI', baseURL: 'https://api.openai.com/v1', model: 'gpt-4o-mini' },
  { value: 'deepseek', label: 'DeepSeek', baseURL: 'https://api.deepseek.com/v1', model: 'deepseek-chat' },
  { value: 'siliconflow', label: t('aiSettings.presetSiliconflow'), baseURL: 'https://api.siliconflow.cn/v1', model: 'Qwen/Qwen2.5-7B-Instruct' },
  { value: 'moonshot', label: 'Moonshot Kimi', baseURL: 'https://api.moonshot.cn/v1', model: 'moonshot-v1-8k' }
])
const aiConfig = ref({
  apiKey: '',
  baseURL: 'https://api.openai.com/v1',
  model: 'gpt-4o-mini',
  stylePreset: 'auto' // 'auto' | 'academic' | 'lively' | 'concise' | 'xiaohongshu'
})

// 搜索相关状态
const searchQuery = ref('') // 搜索关键词
const searchDebounceTimer = ref(null) // 防抖定时器

// 分页相关状态
const currentPage = ref(1) // 当前页码
const pageSize = ref(20) // 每页显示数量
const showLoadMore = ref(false) // 是否显示加载更多按钮

// 文档修改状态跟踪
const documentModifications = ref(new Map())

// 滚动条相关
const tabsScrollRef = ref(null)
const showScrollbar = ref(false)
const scrollbarThumbWidth = ref(100)
const scrollbarThumbPosition = ref(0)

// 计算属性：按修改时间倒序排列的文档列表
const sortedDocuments = computed(() => {
  return [...allDocuments.value].sort((a, b) => b.updatedAt - a.updatedAt)
})

// 计算属性：筛选后的文档列表（完整）
const filteredDocumentsAll = computed(() => {
  if (!searchQuery.value.trim()) {
    return sortedDocuments.value
  }

  const query = searchQuery.value.toLowerCase().trim()
  return sortedDocuments.value.filter(doc => {
    return doc.title.toLowerCase().includes(query) ||
           (doc.content && doc.content.toLowerCase().includes(query))
  })
})

// 计算属性：当前页显示的文档列表
const filteredDocuments = computed(() => {
  const allDocs = filteredDocumentsAll.value
  const maxItems = currentPage.value * pageSize.value

  // 更新是否显示加载更多按钮
  showLoadMore.value = allDocs.length > maxItems

  return allDocs.slice(0, maxItems)
})

// 缓存版本管理和迁移
function getCacheVersion() {
  try {
    const version = localStorage.getItem(CACHE_VERSION_KEY)
    return version ? parseInt(version, 10) : 1 // 默认为v1（旧版本）
  } catch (e) {
    return 1
  }
}

function setCacheVersion(version) {
  try {
    localStorage.setItem(CACHE_VERSION_KEY, version.toString())
  } catch (e) {
    console.warn('Failed to save cache version:', e)
  }
}

function migrateCacheFromV1ToV2() {
  try {
    console.log('Migrating cache from v1 to v2...')

    // 读取旧版本的单文档内容
    const oldContent = localStorage.getItem(CACHE_KEY)
    const oldMode = localStorage.getItem(MODE_CACHE_KEY) || 'wysiwyg'

    if (oldContent) {
      // 从内容中提取标题
      const extractedTitle = extractTitleFromContent(oldContent) || t('editor.welcome')

      // 创建新的文档对象
      const migratedDoc = {
        id: generateId(),
        title: extractedTitle,
        content: oldContent,
        mode: oldMode,
        createdAt: Date.now(),
        updatedAt: Date.now()
      }

      // 保存到新的多文档格式
      allDocuments.value = [migratedDoc]
      openTabs.value = [{ id: migratedDoc.id }]
      activeTabId.value = migratedDoc.id

      // 保存到localStorage
      localStorage.setItem('uni.allDocuments', JSON.stringify(allDocuments.value))
      localStorage.setItem('uni.openTabs', JSON.stringify(openTabs.value))
      localStorage.setItem('uni.activeTabId', activeTabId.value)

      // 清理旧缓存
      localStorage.removeItem(CACHE_KEY)
      // 保留 MODE_CACHE_KEY，因为它在新版本中仍然有用

      console.log('Cache migration completed successfully')
    } else {
      // 如果没有旧内容，创建默认文档
      createDefaultDocument()
    }

    // 更新缓存版本
    setCacheVersion(CURRENT_CACHE_VERSION)
  } catch (e) {
    console.warn('Cache migration failed:', e)
    // 迁移失败时，创建默认文档
    createDefaultDocument()
    setCacheVersion(CURRENT_CACHE_VERSION)
  }
}

// 初始化文档管理
function initializeDocuments() {
  try {
    // 检查缓存版本并执行迁移
    const currentVersion = getCacheVersion()
    if (currentVersion < CURRENT_CACHE_VERSION) {
      console.log(`Cache version ${currentVersion} detected, migrating to version ${CURRENT_CACHE_VERSION}`)
      migrateCacheFromV1ToV2()
      return // 迁移后直接返回，不需要继续执行下面的加载逻辑
    }

    // 加载所有文档
    const savedDocs = localStorage.getItem('uni.allDocuments')
    if (savedDocs) {
      const parsed = JSON.parse(savedDocs)
      if (Array.isArray(parsed) && parsed.length > 0) {
        allDocuments.value = parsed
      }
    }

    // 加载打开的标签页
    const savedTabs = localStorage.getItem('uni.openTabs')
    if (savedTabs && allDocuments.value.length > 0) {
      const parsed = JSON.parse(savedTabs)
      if (Array.isArray(parsed) && parsed.length > 0) {
        // 过滤掉不存在的文档标签
        const validTabs = parsed.filter(tab =>
          allDocuments.value.find(doc => doc.id === tab.id)
        )

        if (validTabs.length > 0) {
          openTabs.value = validTabs
          const activeId = localStorage.getItem('uni.activeTabId')
          if (activeId && validTabs.find(tab => tab.id === activeId)) {
            activeTabId.value = activeId
          } else {
            activeTabId.value = validTabs[0].id
          }
        }
      }
    }
  } catch (e) {
    console.warn('Failed to load documents from localStorage:', e)
  }

  // 加载 AI 配置
  try {
    const savedAI = localStorage.getItem('uni.aiConfig')
    if (savedAI) {
      const parsedAI = JSON.parse(savedAI)
      aiConfig.value = { ...aiConfig.value, ...parsedAI }
    }
    const savedPreset = localStorage.getItem(AI_PRESET_KEY)
    if (savedPreset && aiPresetOptions.some(option => option.value === savedPreset)) {
      selectedAIPreset.value = savedPreset
    } else {
      syncAIPresetByConfig()
    }
  } catch (e) {
    console.warn('Failed to load AI config:', e)
  }

  // 如果没有有效数据，创建默认文档
  if (allDocuments.value.length === 0) {
    createDefaultDocument()
  } else {
    // 如果有文档但没有打开的标签，打开第一个文档
    openTabs.value = [{ id: allDocuments.value[0].id }]
    activeTabId.value = allDocuments.value[0].id
  }
}

function createDefaultDocument() {
  const defaultDoc = {
    id: generateId(),
    title: t('editor.welcome'),
    content: getDefaultContent(),
    mode: 'wysiwyg',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }

  allDocuments.value = [defaultDoc]
  openTabs.value = [{ id: defaultDoc.id }]
  activeTabId.value = defaultDoc.id
  saveToLocalStorage()
}

function generateId() {
  return 'doc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

function getDefaultContent() {
  const currentLocale = locale.value
  const messages = {
    'zh': zhMessages.defaultTemplate,
    'en': enMessages.defaultTemplate
  }
  return messages[currentLocale] || messages['zh']
}

function saveToLocalStorage() {
  try {
    // 渲染 URL 通道的 external 文档不持久化，避免污染用户文档库
    const persistDocs = allDocuments.value.filter(doc => !doc.external)
    const persistTabs = openTabs.value.filter(tab => persistDocs.some(doc => doc.id === tab.id))
    const persistActive = persistDocs.some(doc => doc.id === activeTabId.value)
      ? activeTabId.value
      : (persistTabs[0]?.id || '')
    localStorage.setItem('uni.allDocuments', JSON.stringify(persistDocs))
    localStorage.setItem('uni.openTabs', JSON.stringify(persistTabs))
    localStorage.setItem('uni.activeTabId', persistActive)

    // 确保缓存版本始终是最新的
    setCacheVersion(CURRENT_CACHE_VERSION)
  } catch (e) {
    console.warn('Failed to save documents to localStorage:', e)
  }

  scheduleImageCleanup()
}

// 模式缓存相关函数
function saveModeToCache(mode) {
  try {
    localStorage.setItem(MODE_CACHE_KEY, mode)
  } catch (e) {
    console.warn('Failed to save editor mode:', e)
  }
}

function loadCachedMode() {
  try {
    return localStorage.getItem(MODE_CACHE_KEY) || 'wysiwyg'
  } catch (e) {
    console.warn('Failed to load cached editor mode:', e)
    return 'wysiwyg'
  }
}

let lastSavedMode = loadCachedMode()

let imageCleanupTimer = null

function scheduleImageCleanup() {
  if (typeof window === 'undefined' || !hasIndexedDBSupport()) return
  if (imageCleanupTimer) {
    clearTimeout(imageCleanupTimer)
  }

  imageCleanupTimer = window.setTimeout(async () => {
    imageCleanupTimer = null
    await performImageCleanup()
  }, 800)
}

async function performImageCleanup() {
  try {
    const usedIds = new Set()
    allDocuments.value.forEach(doc => {
      if (!doc?.content) return
      const normalized = convertContentForStorage(doc.content)
      const ids = extractImageIdsFromContent(normalized)
      ids.forEach(id => usedIds.add(id))
    })

    // Include current editor content if it differs from stored value
    if (vd && isVditorReady) {
      const editorContent = convertContentForStorage(vd.getValue())
      const ids = extractImageIdsFromContent(editorContent)
      ids.forEach(id => usedIds.add(id))
    }

    await cleanupUnusedImages(usedIds)
  } catch (error) {
    console.warn('Image cleanup failed:', error)
  }
}

function getDocument(docId) {
  return allDocuments.value.find(d => d.id === docId)
}

function getActiveDocument() {
  return getDocument(activeTabId.value)
}

function isTabOpen(docId) {
  return openTabs.value.some(tab => tab.id === docId)
}

function isDocumentModified(docId) {
  return documentModifications.value.has(docId)
}

function markDocumentModified(docId) {
  documentModifications.value.set(docId, true)
}

function markDocumentSaved(docId) {
  documentModifications.value.delete(docId)
}

async function createNewDocument() {
  const newDoc = {
    id: generateId(),
    title: `${t('documents.untitled')} ${allDocuments.value.length + 1}`,
    content: '',
    mode: 'wysiwyg',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }

  allDocuments.value.push(newDoc)
  await openDocument(newDoc.id)
  saveToLocalStorage()
  // 更新滚动条
  nextTick(() => updateScrollbar())
}

// 选中文档（如果已有标签页则切换，否则只选中）
async function selectDocument(docId) {
  selectedDocumentId.value = docId

  // 如果文档已经打开了标签页，则切换到该标签页
  if (isTabOpen(docId)) {
    await selectTab(docId)
  }
}

async function openDocument(docId) {
  // 如果标签页未打开，则打开它
  if (!isTabOpen(docId)) {
    openTabs.value.push({ id: docId })
  }

  await selectTab(docId)
  saveToLocalStorage()
  // 更新滚动条
  nextTick(() => updateScrollbar())
}

async function selectTab(docId) {
  if (docId === activeTabId.value) return

  // 保存当前文档状态
  saveCurrentDocumentState()

  // 切换到新文档
  activeTabId.value = docId
  const newDoc = getActiveDocument()

  if (newDoc && vd && isVditorReady) {
    const displayContent = await convertContentForEditor(newDoc.content || '')

    // 预处理内容中的分页符，避免闪现
    const processedContent = preprocessPageBreaks(displayContent)

    // 更新编辑器内容
    vd.setValue(processedContent, false)

    // 恢复文档的编辑模式 - 暂时简化，只保存模式到缓存
    if (newDoc.mode) {
      saveModeToCache(newDoc.mode)
      lastSavedMode = newDoc.mode
    }

    // 立即应用分页符样式，减少延迟
    nextTick(() => {
      updatePageBreakDisplay()
    })

    // 如果文档有内容但标题是默认的，尝试提取标题
    if (newDoc.content && newDoc.title.startsWith(t('documents.untitled'))) {
      updateDocumentTitle(newDoc.id, newDoc.content)
    }

    // 发送HTML更新
    emitEditorHtmlUpdate()
  }

  saveToLocalStorage()
}

async function closeTab(docId) {
  if (openTabs.value.length <= 1) return

  const index = openTabs.value.findIndex(tab => tab.id === docId)
  if (index === -1) return

  // 如果有未保存的更改，提示用户
  if (isDocumentModified(docId)) {
    if (!confirm(t('documents.unsavedChanges') + '，' + t('documents.confirmClose'))) {
      return
    }
  }

  openTabs.value.splice(index, 1)

  // 如果关闭的是当前活跃标签，切换到其他标签
  if (docId === activeTabId.value) {
    const newIndex = Math.min(index, openTabs.value.length - 1)
    await selectTab(openTabs.value[newIndex].id)
  }

  saveToLocalStorage()
  // 更新滚动条
  nextTick(() => updateScrollbar())
}

async function duplicateDocument(docId) {
  const originalDoc = getDocument(docId)
  if (!originalDoc) return

  const newDoc = {
    id: generateId(),
    title: originalDoc.title + ' - ' + t('documents.copy'),
    content: originalDoc.content,
    mode: originalDoc.mode,
    createdAt: Date.now(),
    updatedAt: Date.now()
  }

  allDocuments.value.push(newDoc)
  await openDocument(newDoc.id)
  saveToLocalStorage()
}

function confirmDeleteDocument(docId) {
  if (allDocuments.value.length <= 1) return

  documentToDelete.value = docId
  showDeleteConfirm.value = true
}

function deleteDocument() {
  const docId = documentToDelete.value

  // 从所有文档中删除
  const docIndex = allDocuments.value.findIndex(d => d.id === docId)
  if (docIndex !== -1) {
    allDocuments.value.splice(docIndex, 1)
  }

  // 从打开的标签中删除
  const tabIndex = openTabs.value.findIndex(tab => tab.id === docId)
  if (tabIndex !== -1) {
    openTabs.value.splice(tabIndex, 1)
  }

  // 清除修改状态
  documentModifications.value.delete(docId)

  // 如果删除的是当前活跃文档，切换到其他文档
  if (docId === activeTabId.value && openTabs.value.length > 0) {
    const newIndex = Math.min(tabIndex, openTabs.value.length - 1)
    selectTab(openTabs.value[newIndex].id)
  } else if (openTabs.value.length === 0 && allDocuments.value.length > 0) {
    // 如果没有打开的标签但还有文档，打开第一个文档
    openDocument(allDocuments.value[0].id)
  }

  showDeleteConfirm.value = false
  documentToDelete.value = ''
  saveToLocalStorage()
}

function cancelDelete() {
  showDeleteConfirm.value = false
  documentToDelete.value = ''
}

function toggleDocSidebar() {
  docSidebarCollapsed.value = !docSidebarCollapsed.value
}

function saveCurrentDocumentState(preparedContent) {
  const activeDoc = getActiveDocument()
  if (activeDoc && vd && isVditorReady) {
    const currentEditorValue = vd.getValue()
    const currentContent = typeof preparedContent === 'string'
      ? preparedContent
      : convertContentForStorage(currentEditorValue)
    const currentMode = vd.getCurrentMode()

    if (activeDoc.content !== currentContent) {
      activeDoc.content = currentContent
      activeDoc.updatedAt = Date.now()
      markDocumentModified(activeDoc.id)

      // 更新文档标题
      updateDocumentTitle(activeDoc.id, currentContent)
    }

    if (activeDoc.mode !== currentMode) {
      activeDoc.mode = currentMode
      // 同时保存到全局缓存
      saveModeToCache(currentMode)
      lastSavedMode = currentMode
    }
  }
}

function formatDate(timestamp) {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  if (diff < 60000) return t('documents.timeJustNow')
  if (diff < 3600000) return t('documents.timeMinutesAgo', { minutes: Math.floor(diff / 60000) })
  if (diff < 86400000) return t('documents.timeHoursAgo', { hours: Math.floor(diff / 3600000) })
  if (diff < 604800000) return t('documents.timeDaysAgo', { days: Math.floor(diff / 86400000) })

  return date.toLocaleDateString()
}

function getEditorTheme(v) {
  return v === 'theme-dark' ? 'dark' : 'classic'
}

function getVditorLang(locale) {
  const langMap = {
    'zh': 'zh_CN',
    'en': 'en_US'
  }
  return langMap[locale] || 'en_US'
}

function createImageUid() {
  return `img_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function getEditorContainerEl() {
  return elRef.value?.parentElement || null
}

function getContentContainerEl() {
  if (!vd?.vditor?.element) return null
  return vd.vditor.element.querySelector('.vditor-wysiwyg, .vditor-ir')
}

function applyImageSizeToHtml(html) {
  if (!html) return ''
  if (!imageSizeBySrc || imageSizeBySrc.size === 0) return html

  const doc = new DOMParser().parseFromString(html, 'text/html')
  const images = doc.querySelectorAll('img')
  images.forEach((img) => {
    const src = img.getAttribute('src') || ''
    if (!src) return
    const sizeValue = imageSizeBySrc.get(src)
    if (!sizeValue || Number.isNaN(sizeValue)) return
    img.style.setProperty('width', `${sizeValue}%`)
    img.style.setProperty('max-width', `${sizeValue}%`)
    img.style.height = 'auto'
    applyAlignToImg(img, imageAlignBySrc.get(src))
  })
  return doc.body.innerHTML
}

function emitHtmlUpdate(rawHtml) {
  emit('update:html', applyImageSizeToHtml(rawHtml || ''))
}

function emitEditorHtmlUpdate() {
  if (!vd) return
  emitHtmlUpdate(vd.getHTML())
}

function updateImageResizeHandlePosition() {
  if (!showImageResizeHandle.value || !selectedImageEl.value) return
  const container = getEditorContainerEl()
  if (!container) return
  const imgRect = selectedImageEl.value.getBoundingClientRect()
  const containerRect = container.getBoundingClientRect()
  const handleSize = 12
  const left = imgRect.right - containerRect.left - handleSize / 2
  const top = imgRect.bottom - containerRect.top - handleSize / 2
  imageResizeHandleStyle.value = {
    left: `${left}px`,
    top: `${top}px`
  }
}

function syncImageResizeToContent() {
  if (!vd) return
  const html = vd.getHTML()
  const normalizedHtml = applyImageSizeToHtml(html)
  emitHtmlUpdate(normalizedHtml)
  const storageContent = convertContentForStorage(normalizedHtml)
  const activeDoc = getActiveDocument()
  if (activeDoc && activeDoc.content !== storageContent) {
    activeDoc.content = storageContent
    activeDoc.updatedAt = Date.now()
    markDocumentModified(activeDoc.id)
    saveToLocalStorage()
  }
}

function scheduleImageResizeSync() {
  if (imageResizeSyncTimer) clearTimeout(imageResizeSyncTimer)
  imageResizeSyncTimer = setTimeout(() => {
    imageResizeSyncTimer = null
    syncImageResizeToContent()
  }, 120)
}

function selectImageForResize(target) {
  if (!target) return
  selectedImageEl.value = target
  if (!target.dataset.uid) {
    target.dataset.uid = createImageUid()
    scheduleImageResizeSync()
  }
  showImageResizeHandle.value = true
  updateImageResizeHandlePosition()
}

function hideImageResizeHandle() {
  showImageResizeHandle.value = false
  selectedImageEl.value = null
}

function setImageSize(size) {
  if (!selectedImageEl.value) return
  
  selectedImageEl.value.style.setProperty('width', `${size}%`, 'important')
  selectedImageEl.value.style.setProperty('max-width', `${size}%`, 'important')
  selectedImageEl.value.style.height = 'auto'
  const src = selectedImageEl.value.getAttribute('src') || ''
  if (src) {
    imageSizeBySrc.set(src, size)
  }
  currentImageSize.value = size
  
  updateImageResizeHandlePosition()
  emitEditorHtmlUpdate()
  scheduleImageResizeSync()
}

// 从 DOM 实际样式推断图片对齐（兼容从存储加载后 Map 为空的情况）
function getAlignFromStyle(el) {
  if (!el) return 'left'
  const ml = el.style.marginLeft
  const mr = el.style.marginRight
  if (ml === 'auto' && mr === 'auto') return 'center'
  if (ml === 'auto') return 'right'
  if (mr === 'auto') return 'left'
  return 'left'
}

// 根据对齐方式设置图片 margin（居中/左/右）
function applyAlignToImg(img, align) {
  if (!img) return
  img.style.display = 'block'
  if (align === 'center') {
    img.style.marginLeft = 'auto'
    img.style.marginRight = 'auto'
  } else if (align === 'right') {
    img.style.marginLeft = 'auto'
    img.style.marginRight = '0'
  } else {
    img.style.marginLeft = '0'
    img.style.marginRight = 'auto'
  }
}

function setImageAlign(align) {
  if (!selectedImageEl.value) return
  applyAlignToImg(selectedImageEl.value, align)
  const src = selectedImageEl.value.getAttribute('src') || ''
  if (src) {
    imageAlignBySrc.set(src, align)
  }
  currentImageAlign.value = align
  emitEditorHtmlUpdate()
  scheduleImageResizeSync()
}

function applyCustomSize() {
  let v = Math.round(Number(customSize.value))
  if (!v || Number.isNaN(v)) v = 100
  v = Math.min(100, Math.max(10, v))
  customSize.value = v
  setImageSize(v)
}

function startImageResize(event) {
  if (!selectedImageEl.value) return
  isResizingImage.value = true
  imageResizeStartX = event.clientX
  imageResizeStartWidth = selectedImageEl.value.clientWidth || 0
  const contentEl = getContentContainerEl()
  imageResizeBaseWidth = contentEl?.clientWidth || selectedImageEl.value.parentElement?.clientWidth || 1
  document.body.style.cursor = 'nwse-resize'
  document.body.style.userSelect = 'none'
  if (event?.target?.setPointerCapture && event.pointerId !== undefined) {
    event.target.setPointerCapture(event.pointerId)
  }
  const handleMove = (moveEvent) => {
    if (!isResizingImage.value || !selectedImageEl.value) return
    const deltaX = moveEvent.clientX - imageResizeStartX
    const newWidthPx = Math.max(40, imageResizeStartWidth + deltaX)
    const percent = Math.min(100, Math.max(10, Math.round((newWidthPx / imageResizeBaseWidth) * 100)))
    selectedImageEl.value.style.setProperty('width', `${percent}%`, 'important')
    selectedImageEl.value.style.setProperty('max-width', `${percent}%`, 'important')
    selectedImageEl.value.style.height = 'auto'
    const src = selectedImageEl.value.getAttribute('src') || ''
    if (src) {
      imageSizeBySrc.set(src, percent)
    }
    updateImageResizeHandlePosition()
    emitEditorHtmlUpdate()
  }
  const handleUp = (upEvent) => {
    isResizingImage.value = false
    document.removeEventListener('mousemove', handleMove)
    document.removeEventListener('mouseup', handleUp)
    document.removeEventListener('pointermove', handleMove)
    document.removeEventListener('pointerup', handleUp)
    document.body.style.cursor = ''
    document.body.style.userSelect = ''
    
    // Release pointer capture
    if (upEvent?.target?.releasePointerCapture && upEvent.pointerId !== undefined) {
      upEvent.target.releasePointerCapture(upEvent.pointerId)
    }

    scheduleImageResizeSync()
  }
  document.addEventListener('mousemove', handleMove)
  document.addEventListener('mouseup', handleUp)
  document.addEventListener('pointermove', handleMove)
  document.addEventListener('pointerup', handleUp)
}

function bindImageResizeEvents() {
  if (!vd?.vditor?.element) return
  const editorEl = vd.vditor.element

  // 使用全局捕获事件监听点击
  const handleGlobalClick = (event) => {
    const target = event.target
    
    // 检查点击目标是否在编辑器内
    const isInsideEditor = editorEl.contains(target)
    
    // 如果点击的是编辑器内的图片
    if (isInsideEditor && target?.tagName === 'IMG') {
      // 阻止默认行为和传播，防止触发Vditor预览
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      
      selectImageForResize(target)
      
      // 更新当前选中尺寸状态
      const styleWidth = target.style.width
      if (styleWidth && styleWidth.includes('%')) {
        currentImageSize.value = parseFloat(styleWidth)
      } else {
        currentImageSize.value = 100
      }
      // 回显对齐状态（以 DOM 实际样式为准，兼容从存储加载的场景）
      currentImageAlign.value = getAlignFromStyle(target)
      customSize.value = currentImageSize.value
      return
    }
    
    // 如果点击的是缩放菜单内部，不做处理
    if (target?.closest?.('.image-resize-menu')) {
      return
    }
    
    // 点击其他区域，隐藏缩放菜单
    hideImageResizeHandle()
  }
  
  const handleEditorScroll = () => updateImageResizeHandlePosition()
  const handleWindowResize = () => updateImageResizeHandlePosition()
  
  // 在 document 上使用捕获阶段绑定事件，确保最先处理
  document.addEventListener('click', handleGlobalClick, true)
  editorEl.addEventListener('scroll', handleEditorScroll, true)
  window.addEventListener('resize', handleWindowResize)

  scrollCleanups.push(() => {
    document.removeEventListener('click', handleGlobalClick, true)
    editorEl.removeEventListener('scroll', handleEditorScroll, true)
    window.removeEventListener('resize', handleWindowResize)
  })
}

// 初始化编辑器
async function initVditor() {
  if (!elRef.value) return

  let initialContent
  let initialMode
  const externalMarkdown = props.initialMarkdown
  if (externalMarkdown) {
    // 渲染 URL 通道：外部文档作为临时文档打开（external 标记，不持久化、不污染文档库）
    const extDoc = {
      id: generateId(),
      title: extractTitleFromContent(externalMarkdown) || t('editor.welcome'),
      content: externalMarkdown,
      mode: 'wysiwyg',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      external: true
    }
    allDocuments.value.push(extDoc)
    openTabs.value.push({ id: extDoc.id })
    activeTabId.value = extDoc.id
    initialContent = externalMarkdown
    initialMode = 'wysiwyg'
  } else {
    const activeDoc = getActiveDocument()
    initialContent = activeDoc?.content || getDefaultContent()
    initialMode = activeDoc?.mode || loadCachedMode()
  }
  let editorReadyContent = await convertContentForEditor(initialContent || '')

  // 预处理分页符，避免初始化时的闪现
  editorReadyContent = preprocessPageBreaks(editorReadyContent)

  vd = new Vditor(elRef.value, {
    value: editorReadyContent,
    cache: { enable: false },
    height: '100%',
    mode: initialMode,
    lang: getVditorLang(locale.value),
    theme: getEditorTheme(props.pageTheme),
    toolbarConfig: { pin: true },
    customWysiwygToolbar: () => '',
    toolbar: [
      // 主格式组（最高频，常驻）
      'headings', 'bold', 'italic', '|',
      // 列表组（常驻）
      'list', 'ordered-list', 'check', '|',
      // 智能排版组（AI，常驻）
      {
        name: 'ai-format',
        icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/><path d="M20 3v4"/><path d="M22 5h-4"/><path d="M4 17v2"/><path d="M5 18H3"/></svg>',
        tip: t('toolbar.aiFormat'),
        tipPosition: 's',
        click() {
          handleAIFormat()
        }
      },
      '|',
      // 排版助手组（分页符 / 空行，常驻：卡片分页与段落留白高频）
      {
        name: 'page-break',
        icon: `<svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor">
          <path d="M2 3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v3.5a.5.5 0 0 1-1 0V3H3v3.5a.5.5 0 0 1-1 0V3z"/>
          <path d="M2 9.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5zm0 2a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5z"/>
          <path d="M10.5 9a.5.5 0 0 0-.5.5v3a.5.5 0 0 0 .5.5h3a.5.5 0 0 0 .5-.5v-3a.5.5 0 0 0-.5-.5h-3z"/>
          <path d="M2 13a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-2.5a.5.5 0 0 0-1 0V13H3v-2.5a.5.5 0 0 0-1 0V13z"/>
          <path d="M5 8a.5.5 0 0 1 .5-.5h5a.5.5 0 0 1 0 1h-5A.5.5 0 0 1 5 8z" fill-rule="evenodd"/>
        </svg>`,
        tip: t('toolbar.pageBreak'),
        tipPosition: 's',
        click: handlePageBreak
      }, {
        name: 'empty-line',
        icon: `<svg width="20" height="20" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5">
          <line x1="2" y1="4" x2="14" y2="4"/>
          <line x1="2" y1="12" x2="14" y2="12"/>
          <line x1="5" y1="8" x2="11" y2="8" stroke-dasharray="2 2"/>
        </svg>`,
        tip: t('toolbar.emptyLine'),
        tipPosition: 's',
        click: handleEmptyLine
      },
      '|',
      // 撤销/重做（编辑刚需，常驻）
      'undo', 'redo',
      '|',
      // 上传图片（高频插入，常驻）
      'upload',
      // 切换模式 + 大纲（视图高频，常驻：大纲可随时开合）
      'edit-mode', 'outline',
      '|',
      // 「更多」折叠按钮（收纳低频 / 需选中文本的功能）
      // 注意：不能命名为 "more"——Vditor genItem 把 "more" 当内置保留项处理，
      // 会走 MenuItem（无 prefix 不绑事件），自定义 click 永不被调用
      {
        name: 'more-menu',
        icon: '<svg width="20" height="20" viewBox="0 0 16 16" fill="currentColor"><circle cx="2.5" cy="8" r="1.7"/><circle cx="8" cy="8" r="1.7"/><circle cx="13.5" cy="8" r="1.7"/></svg>',
        tip: t('toolbar.more'),
        tipPosition: 's',
        click() {
          toggleMoreMenu()
        }
      },
      '|',
      // 以下为「更多」收纳项：默认渲染后由 applyToolbarLayering 隐藏，经更多菜单触发
      // 插入组（需选中文本或光标处插入）
      'quote', 'code', 'table', 'link',
      // 辅助组
      'emoji',
      // AI 排版设置
      {
        name: 'ai-settings',
        icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 .99-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51.99H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
        tip: t('toolbar.aiSettings'),
        tipPosition: 's',
        click() {
          handleAISettingsOpen()
        }
      },
    ],
    counter: { enable: true },
    upload: {
      accept: 'image/*',
      multiple: true,
      handler: handleImageUpload
    },
    preview: {
      theme: {
        current: getEditorTheme(props.pageTheme),
        path: 'https://unpkg.com/vditor/dist/css/content-theme'
      },
      hljs: {
        style: getEditorTheme(props.pageTheme) === 'dark' ? 'github-dark' : 'github'
      },
      // 启用图片点击预览功能
      actions: ['delete', 'download', 'edit-mode', 'both', 'preview'],
      image: {
        isPreview: true,
        preview: (imgElement) => {
          // 接管Vditor图片点击，显示自定义缩放菜单
          selectImageForResize(imgElement)
          
          // 更新当前选中尺寸状态
          const styleWidth = imgElement.style.width
          if (styleWidth && styleWidth.includes('%')) {
            currentImageSize.value = parseFloat(styleWidth)
          } else {
            currentImageSize.value = 100
          }
          // 回显对齐状态（以 DOM 实际样式为准）
          currentImageAlign.value = getAlignFromStyle(imgElement)
          customSize.value = currentImageSize.value
          
          // 返回true阻止默认预览行为（如果Vditor文档如此）
          // 但根据源码分析，只要提供了preview回调，它就会被调用
          // 这里不需要特殊返回值，只需要执行我们逻辑即可
        }
      }
    },
    hint: { delay: 500 },
    typewriterMode: false,
    after: () => {
      isVditorReady = true
      console.log('Vditor ready')

      // 绑定滚动事件
      bindScrollEvents()

      // 添加模式变化监听器
      addModeChangeListener()

      // 图片缩放交互
      bindImageResizeEvents()

      // 立即初始化分页符显示
      nextTick(() => updatePageBreakDisplay())

      // 按频率分层：隐藏收纳到「更多」菜单的低频按钮
      nextTick(() => {
        applyToolbarLayering()
        applyToolbarButtonTitles()
      })

      // 初始化时发送内容
      if (vd) {
        emitEditorHtmlUpdate()
      }
    },
    input: (value) => {
      if (isVditorReady) {
        const storageContent = convertContentForStorage(value)

        // 标记当前文档为已修改
        const activeDoc = getActiveDocument()
        if (activeDoc && activeDoc.content !== storageContent) {
          markDocumentModified(activeDoc.id)
          activeDoc.updatedAt = Date.now()

          // 更新文档标题
          updateDocumentTitle(activeDoc.id, storageContent)
        }

        // 更新分页符显示
        setTimeout(() => updatePageBreakDisplay(), 100)

        emitEditorHtmlUpdate()
      }
    },
    select: () => {
      if (isVditorReady) {
        emitEditorHtmlUpdate()
      }
    },
    blur: () => {
      if (isVditorReady) {
        const storageContent = convertContentForStorage(vd.getValue())
        // 保存当前文档状态
        saveCurrentDocumentState(storageContent)

        // 标记文档为已保存
        const activeDoc = getActiveDocument()
        if (activeDoc) {
          markDocumentSaved(activeDoc.id)
          // 最终确认标题更新
          updateDocumentTitle(activeDoc.id, storageContent)
        }

        saveToLocalStorage()

        // 立即重新应用分页符样式（保存后可能丢失）
        nextTick(() => updatePageBreakDisplay())

        emitEditorHtmlUpdate()
      }
    }
  })
}

async function handleImageUpload(files) {
  if (!files) return
  const fileList = Array.from(files).filter(file => file instanceof File)
  if (fileList.length === 0) return

  const fragments = []

  for (const file of fileList) {
    try {
      const { url, name } = await saveImage(file)
      if (!url) continue

      const rawName = name || file.name || 'image'
      const alt = rawName.replace(/\.[^/.]+$/, '') || 'image'
      const uid = createImageUid()
      // 使用HTML标签代替Markdown语法，以支持图片缩放和内联显示
      fragments.push(`<img src="${url}" alt="${alt}" data-uid="${uid}" />`)
    } catch (error) {
      console.warn('Image upload failed:', error)
    }
  }

  if (fragments.length > 0 && vd) {
    // 使用空格连接，使多张图片默认内联排列（配合CSS的inline-block）
    const content = fragments.join(' ')
    vd.insertValue(content)
    emitEditorHtmlUpdate()
  }
}

// 预处理内容中的分页符，将PAGE_BREAK文本转换为带样式的HTML
function preprocessPageBreaks(content) {
  if (!content) return content

  // 将包含PAGE_BREAK的段落预处理为带样式的分页符
  return content.replace(
    /<p([^>]*)>\s*PAGE_BREAK\s*<\/p>/g,
    `<p$1 class="page-break-styled" contenteditable="false" style="margin: 16px 0 !important; padding: 8px 12px !important; border: 1px dashed var(--accent) !important; border-radius: 6px !important; background: color-mix(in srgb, var(--accent) 5%, var(--bg)) !important; text-align: center !important; font-size: 12px !important; font-weight: 600 !important; color: var(--accent) !important; user-select: none !important; cursor: default !important;">✂️ ${t('editor.pageBreakLabel')}</p>`
  )
}

function handlePageBreak() {
  if (!vd) return

  // 使用特殊的注释语法作为分页符标记
  // 这种方式在所有模式下都能正常工作，并且会被保留在HTML中
  const pageBreakMarkdown = `\n<!-- PAGE_BREAK -->\n`

  // 在当前光标位置插入分页符标记
  vd.insertValue(pageBreakMarkdown)

  // 延迟一点时间后更新分页符显示
  setTimeout(() => {
    updatePageBreakDisplay()
    emitEditorHtmlUpdate()
  }, 100)
}

// 插入空行 —— 使用 &nbsp; 占位，防止 Markdown 折叠空行
function handleEmptyLine() {
  if (!vd) return
  vd.insertValue('\u00A0\n\n')
  setTimeout(() => {
    emitEditorHtmlUpdate()
  }, 100)
}

// 更新编辑器中分页符的显示
function updatePageBreakDisplay() {
  if (!vd || !vd.vditor?.element) return

  const editor = vd.vditor.element

  // 1. 处理HTML注释形式的分页符
  const comments = []
  const walker = document.createTreeWalker(
    editor,
    NodeFilter.SHOW_COMMENT,
    null,
    false
  )

  let node
  while (node = walker.nextNode()) {
    if (node.nodeValue && node.nodeValue.trim() === 'PAGE_BREAK') {
      comments.push(node)
    }
  }

  // 为每个分页符注释添加可视化元素
  comments.forEach(comment => {
    // 检查是否已经有可视化元素
    if (comment.nextSibling && comment.nextSibling.classList?.contains('page-break-visual')) {
      return
    }

    // 创建可视化元素
    const visual = document.createElement('div')
    visual.className = 'page-break-visual'
    visual.contentEditable = 'false'
    visual.style.cssText = `
      margin: 16px 0;
      padding: 8px 12px;
      border: 1px dashed var(--accent);
      border-radius: 6px;
      background: color-mix(in srgb, var(--accent) 5%, var(--bg));
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      user-select: none;
      cursor: pointer;
      transition: all 0.2s ease;
    `

    const line = document.createElement('div')
    line.style.cssText = `
      flex: 1;
      height: 2px;
      background: linear-gradient(to right, transparent, var(--accent) 20%, var(--accent) 50%, var(--accent) 80%, transparent);
      position: relative;
    `

    const text = document.createElement('div')
    text.textContent = t('editor.pageBreakLabel')
    text.style.cssText = `
      position: absolute;
      top: -6px;
      left: 50%;
      transform: translateX(-50%);
      background: var(--bg);
      color: var(--accent);
      font-size: 10px;
      font-weight: 600;
      padding: 2px 6px;
      border: 1px solid var(--accent);
      border-radius: 8px;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      white-space: nowrap;
    `

    visual.appendChild(line)
    visual.appendChild(text)

    // 插入到注释节点后面
    comment.parentNode.insertBefore(visual, comment.nextSibling)
  })

  // 2. 处理段落形式的分页符 (例如: <p data-block="0">PAGE_BREAK</p>)
  const paragraphs = editor.querySelectorAll('p')
  paragraphs.forEach(p => {
    const textContent = p.textContent?.trim()
    const hasPageBreak = textContent === 'PAGE_BREAK' ||
                        textContent.includes('分页符') ||
                        textContent.includes('Page Break')

    if (hasPageBreak) {
      // 重新标记和应用样式（无论是否已处理过）
      p.classList.add('page-break-styled')

      // 应用分页符样式
      p.style.cssText = `
        margin: 16px 0 !important;
        padding: 8px 12px !important;
        border: 1px dashed var(--accent) !important;
        border-radius: 6px !important;
        background: color-mix(in srgb, var(--accent) 5%, var(--bg)) !important;
        text-align: center !important;
        font-size: 12px !important;
        font-weight: 600 !important;
        color: var(--accent) !important;
        user-select: none !important;
        cursor: default !important;
        position: relative !important;
      `

      // 替换文本内容
      p.innerHTML = `✂️ ${t('editor.pageBreakLabel')}`

      // 防止编辑
      p.contentEditable = 'false'
    }
  })
}

// 编辑器模式变化监听
function addModeChangeListener() {
  if (!vd || !vd.vditor) return

  cleanupModeChangeListener()

  const editModeElement = vd.vditor.toolbar?.elements?.['edit-mode']
    || vd.vditor.element?.querySelector?.('.vditor-toolbar__item button[data-type="edit-mode"]')?.parentElement

  if (!(editModeElement instanceof HTMLElement)) {
    return
  }

  const resolveCurrentMode = () => {
    if (typeof vd.getCurrentMode === 'function') {
      const mode = vd.getCurrentMode()
      if (mode) return mode
    }

    const active = editModeElement.querySelector('button.vditor-menu--current')
    return active?.dataset?.mode || lastSavedMode || 'wysiwyg'
  }

  const persistModeIfNeeded = () => {
    const mode = resolveCurrentMode()
    if (!mode || mode === lastSavedMode) {
      return
    }
    lastSavedMode = mode
    saveModeToCache(mode)
    bindScrollEvents() // setupScrollSync equivalent
  }

  const handleModeButtonClick = () => {
    // 等待 Vditor 完成模式切换后再读取状态
    setTimeout(persistModeIfNeeded, 0)
  }

  const modeButtons = Array.from(editModeElement.querySelectorAll('button[data-mode]'))
  modeButtons.forEach(button => {
    button.addEventListener('click', handleModeButtonClick)
  })

  const observer = new MutationObserver(() => {
    persistModeIfNeeded()
  })

  observer.observe(editModeElement, {
    attributes: true,
    attributeFilter: ['class'],
    subtree: true,
  })

  // 初始化时同步一次，处理程序化模式切换
  persistModeIfNeeded()

  cleanupModeListener = () => {
    observer.disconnect()
    modeButtons.forEach(button => {
      button.removeEventListener('click', handleModeButtonClick)
    })
  }
}

function cleanupModeChangeListener() {
  if (typeof cleanupModeListener === 'function') {
    try {
      cleanupModeListener()
    } catch (error) {
      console.warn('Failed to cleanup editor mode listener:', error)
    }
  }
  cleanupModeListener = null
}

// 绑定滚动事件
function bindScrollEvents() {
  if (!vd || !vd.vditor?.element) return

  // 清理之前的事件监听
  scrollCleanups.forEach(cleanup => cleanup())
  scrollCleanups.length = 0

  const containers = new Set()
  const content = vd.vditor?.element?.querySelector?.('.vditor-content')
  if (content) containers.add(content)

  const wysiwyg = vd.vditor?.wysiwyg?.element?.parentElement
  if (wysiwyg) containers.add(wysiwyg)

  const ir = vd.vditor?.ir?.element?.parentElement
  if (ir) containers.add(ir)

  const sv = vd.vditor?.sv?.element?.parentElement
  if (sv) containers.add(sv)

  const preview = vd.vditor?.preview?.element
  if (preview) containers.add(preview)

  const resetNodes = vd.vditor?.element?.querySelectorAll?.('.vditor-reset') || []
  resetNodes.forEach(node => containers.add(node))

  containers.forEach(container => {
    if (!container) return

    const scrollHandler = () => {
      const scrollTop = container.scrollTop
      const maxScroll = container.scrollHeight - container.clientHeight
      const scrollRatio = maxScroll > 0 ? scrollTop / maxScroll : 0
      emit('editorScroll', {
        scrollRatio,
        ratio: scrollRatio,
        scrollTop
      })
    }

    container.addEventListener('scroll', scrollHandler, { passive: true })
    scrollCleanups.push(() => {
      container.removeEventListener('scroll', scrollHandler)
    })
  })
}

// 搜索相关函数
function handleSearch() {
  // 搜索无需防抖，因为computed会自动处理
  // filteredDocuments计算属性会立即反映搜索结果
}

function clearSearch() {
  searchQuery.value = ''
  // 重置分页
  currentPage.value = 1
}

function loadMoreDocuments() {
  currentPage.value += 1
}

// 监听搜索查询变化，重置分页
watch(searchQuery, () => {
  currentPage.value = 1
})

// 监听主题变化
watch(() => props.pageTheme, (newTheme) => {
  if (vd && isVditorReady) {
    vd.setTheme(
      getEditorTheme(newTheme),
      getEditorTheme(newTheme),
      getEditorTheme(newTheme) === 'dark' ? 'github-dark' : 'github'
    )
  }
})

// 监听语言变化
watch(locale, async (newLocale) => {
  if (vd && isVditorReady) {
    // 保存当前内容
    saveCurrentDocumentState()
    const activeDoc = getActiveDocument()
    const storedContent = activeDoc?.content || ''

    // 销毁当前实例
    try {
      scrollCleanups.forEach(cleanup => cleanup())
      scrollCleanups.length = 0
      cleanupModeChangeListener()
      vd.destroy()
    } catch (error) {
      console.warn('Failed to destroy Vditor:', error)
    }

    // 重新初始化
    await nextTick()
    const cachedMode = loadCachedMode()
    lastSavedMode = cachedMode
    await initVditor()

    if (vd && isVditorReady) {
      const displayContent = await convertContentForEditor(storedContent)
      // 预处理分页符，避免闪现
      const processedContent = preprocessPageBreaks(displayContent)
      vd.setValue(processedContent, false)

      // 立即应用分页符样式
      nextTick(() => updatePageBreakDisplay())

      emitEditorHtmlUpdate()
    }
  }
})

// 销毁编辑器
function destroyVditor() {
  if (vd) {
    try {
      scrollCleanups.forEach(cleanup => cleanup())
      scrollCleanups.length = 0
      vd.destroy()
    } catch (error) {
      console.warn('Error destroying Vditor:', error)
    }
    clearImageCache()
    vd = null
    isVditorReady = false
  }
}

// 导出功能
async function exportMarkdown() {
  const activeDoc = getActiveDocument()
  if (!activeDoc || !activeDoc.content) {
    throw new Error('No content to export')
  }

  const blob = new Blob([activeDoc.content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${activeDoc.title || 'document'}.md`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// 导入功能
async function importMarkdown() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.md,.markdown,.txt'

    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) {
        reject('No file selected')
        return
      }

      if (!file.name.match(/\.(md|markdown|txt)$/i)) {
        reject('Invalid file type')
        return
      }

      try {
        const content = await file.text()
        const fileName = file.name.replace(/\.(md|markdown|txt)$/i, '')

        // 创建新文档
        const newDoc = {
          id: generateId(),
          title: fileName,
          content: content,
          mode: 'wysiwyg',
          createdAt: Date.now(),
          updatedAt: Date.now()
        }

        allDocuments.value.push(newDoc)
        openDocument(newDoc.id)
        saveToLocalStorage()

        resolve()
      } catch (error) {
        reject(error)
      }
    }

    input.oncancel = () => {
      reject('Import cancelled')
    }

    input.click()
  })
}

// 针对特定文档的导出功能
async function exportMarkdownFromDocument(docId) {
  try {
    const doc = getDocument(docId)
    if (!doc) {
      console.error('Document not found:', docId)
      return
    }

    const blob = new Blob([doc.content], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${doc.title || t('documents.untitled')}.md`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    console.log('Markdown exported successfully')
  } catch (error) {
    console.error('Export failed:', error)
  }
}

async function getProjectExportData() {
  const doc = getActiveDocument()
  if (!doc) throw new Error('No active document')

  const assets = []
  for (const id of extractImageIdsFromContent(doc.content || '')) {
    const dataUrl = await getImageDataUrl(id)
    if (!dataUrl) continue
    const mime = dataUrl.match(/^data:([^;,]+)/)?.[1] || 'image/png'
    const extension = mime.split('/')[1]?.replace('jpeg', 'jpg') || 'bin'
    const asset = projectAssetFromDataUrl(`assets/${id}.${extension}`, dataUrl)
    if (asset) assets.push({ id, path: asset.name, data: asset.data })
  }

  return {
    document: {
      id: doc.id,
      title: doc.title,
      mode: doc.mode,
      content: doc.content,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt
    },
    assets
  }
}

// 针对特定文档的导入功能
async function importMarkdownToDocument(docId) {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.md,.markdown,.txt'

  input.onchange = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    try {
      const doc = getDocument(docId)
      if (!doc) {
        console.error('Document not found:', docId)
        return
      }

      // 检查文档是否有内容，如果有则显示确认对话框
      if (doc.content && doc.content.trim().length > 0) {
        importTargetDocId.value = docId
        pendingImportFile.value = file
        showImportConfirm.value = true
        return
      }

      // 如果文档为空，直接导入
      await performImport(docId, file)
    } catch (error) {
      console.error('Import failed:', error)
    }
  }

  input.click()
}

// 执行实际的导入操作
async function performImport(docId, file) {
  try {
    const rawContent = await file.text()
    const content = convertContentForStorage(rawContent)
    const fileName = file.name.replace(/\.(md|markdown|txt)$/i, '')

    const doc = getDocument(docId)
    if (!doc) {
      console.error('Document not found:', docId)
      return
    }

    // 更新文档内容
    doc.content = content
    doc.title = fileName || doc.title
    doc.updatedAt = Date.now()

    // 如果是当前活跃文档，更新编辑器内容
    if (docId === activeTabId.value && vd && isVditorReady) {
      const displayContent = await convertContentForEditor(content)
      vd.setValue(displayContent)
      emitEditorHtmlUpdate()
    }

    // 标记文档已修改
    markDocumentModified(docId)
    saveToLocalStorage()

    console.log('Markdown imported successfully')
  } catch (error) {
    console.error('Import failed:', error)
  }
}

// 确认导入
function confirmImport() {
  if (importTargetDocId.value && pendingImportFile.value) {
    performImport(importTargetDocId.value, pendingImportFile.value)
  }
  cancelImport()
}

// 取消导入
function cancelImport() {
  showImportConfirm.value = false
  importTargetDocId.value = ''
  pendingImportFile.value = null
}

// 审核通过后才进入排版：一次选择发布包 JSON、角色图和漫画。
async function importApprovedSocialPackage() {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json,image/png,image/jpeg,image/webp'
  input.multiple = true

  input.onchange = async (event) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    try {
      const jsonFiles = files.filter(file => file.name.toLowerCase().endsWith('.json'))
      if (jsonFiles.length !== 1) {
        throw new Error('Please select exactly 1 package JSON, plus its character and comic images')
      }

      const pkg = normalizeSocialPackage(JSON.parse(await jsonFiles[0].text()))
      const imageFiles = new Map(
        files
          .filter(file => file.type.startsWith('image/'))
          .map(file => [file.name, file])
      )

      const embeddedFiles = new Map([
        [pkg.assets.character, embeddedAssetFile(pkg.assets.characterData, pkg.assets.character)],
        [pkg.assets.comic, embeddedAssetFile(pkg.assets.comicData, pkg.assets.comic)],
        ...pkg.assets.images.map((asset) => [asset.name, embeddedAssetFile(asset.data, asset.name)])
      ].filter(([, file]) => Boolean(file)))

      const missingAssets = getRequiredAssetNames(pkg).filter(name => {
        return !imageFiles.has(name) && !embeddedFiles.has(name)
      })
      if (missingAssets.length > 0) {
        throw new Error(`Missing images: ${missingAssets.join(', ')}. Select them together, or use a self-contained package.`)
      }

      const character = await saveImage(
        imageFiles.get(pkg.assets.character) || embeddedFiles.get(pkg.assets.character)
      )
      const comic = await saveImage(
        imageFiles.get(pkg.assets.comic) || embeddedFiles.get(pkg.assets.comic)
      )
      const inlineImages = {
        [pkg.assets.character]: character.url,
        [pkg.assets.comic]: comic.url
      }
      for (const asset of pkg.assets.images) {
        if (!inlineImages[asset.name]) {
          const image = await saveImage(imageFiles.get(asset.name) || embeddedFiles.get(asset.name))
          inlineImages[asset.name] = image.url
        }
      }
      const editorMarkdown = buildSocialMarkdown(pkg, {
        character: character.url,
        comic: comic.url,
        images: inlineImages
      })
      const storedMarkdown = convertContentForStorage(editorMarkdown)
      const now = Date.now()
      const newDoc = {
        id: generateId(),
        title: createSocialDocumentTitle(pkg),
        content: storedMarkdown,
        mode: 'wysiwyg',
        createdAt: now,
        updatedAt: now,
        socialPackage: pkg
      }

      allDocuments.value.push(newDoc)
      saveToLocalStorage()
      await openDocument(newDoc.id)

      emit('socialPackageImported', {
        package: pkg,
        coverImage: character.url,
        documentId: newDoc.id
      })
      success(t('documents.importSuccess', { name: pkg.identity.name, count: 4 }))
    } catch (importError) {
      console.error('Import approved draft failed:', importError)
      error(importError?.message || t('documents.importFailed'))
    }
  }

  input.click()
}

// 处理文档标签页操作
function handleDocumentTabAction(docId) {
  if (!isTabOpen(docId)) {
    // 文档未打开，打开标签页
    openDocument(docId)
  } else if (docId !== activeTabId.value) {
    // 文档已打开但非活跃，切换到该标签
    selectTab(docId)
  } else {
    // 当前活跃文档，关闭标签页（但不删除文档）
    closeTab(docId)
  }
}

// 获取标签页操作的提示文本
function getTabActionTitle(docId) {
  if (!isTabOpen(docId)) {
    return t('documents.openDocument')
  } else if (docId !== activeTabId.value) {
    return t('documents.locateTab')
  } else {
    return t('documents.closeTabTitle')
  }
}

// AI Settings methods
function closeAISettings() {
  showAISettings.value = false
}

function handleAISettingsOpen() {
  showAISettings.value = true
}

// ===== 「更多」工具栏分层逻辑 =====

// 收进「更多」菜单的低频工具项（保留在 toolbar 数组中保 DOM 与事件，渲染后隐藏）
const HIDDEN_TOOLBAR_ITEMS = ['quote', 'code', 'table', 'link', 'emoji', 'ai-settings']

// 渲染完成后：隐藏低频项及其相邻分隔线，缺省工具栏只显示高频主操作
function applyToolbarLayering() {
  if (!vd || !vd.vditor || !vd.vditor.toolbar || !vd.vditor.toolbar.elements) return
  const hiddenEls = new Set(
    HIDDEN_TOOLBAR_ITEMS.map((name) => vd.vditor.toolbar.elements[name]).filter(Boolean)
  )
  Array.from(vd.vditor.toolbar.element.children).forEach((child) => {
    if (!hiddenEls.has(child)) return
    child.style.display = 'none'
    // 隐藏低频项前后的分隔线，避免出现孤立竖线
    ;[child.previousElementSibling, child.nextElementSibling].forEach((sibling) => {
      let node = sibling
      while (node && node.classList && node.classList.contains('vditor-toolbar__divider')) {
        node.style.display = 'none'
        node = node.nextElementSibling
      }
    })
  })
}

// Vditor 的伪元素提示会被可横向滚动的工具栏裁掉。
// 同步到原生 title，让在线版和本地版都能稳定显示按钮用途。
function applyToolbarButtonTitles() {
  const toolbar = vd?.vditor?.toolbar?.element
  if (!toolbar) return
  toolbar.querySelectorAll('button[aria-label]').forEach((button) => {
    const label = String(button.getAttribute('aria-label') || '').trim()
    if (label) button.setAttribute('title', label)
  })
}

// emoji 面板挂在按钮容器内部：触发时临时显示按钮，面板关闭后自动隐藏
let emojiPanelWatchTimer = null
function watchEmojiPanelHide(el) {
  if (emojiPanelWatchTimer) clearInterval(emojiPanelWatchTimer)
  emojiPanelWatchTimer = setInterval(() => {
    const panel = el && el.lastElementChild
    if (!panel || panel.style.display !== 'block') {
      if (el) el.style.display = 'none'
      clearInterval(emojiPanelWatchTimer)
      emojiPanelWatchTimer = null
    }
  }, 150)
}

// 从「更多」菜单触发隐藏的内置工具项
function triggerToolbarItem(name) {
  closeMoreMenu()
  if (!vd || !vd.vditor || !vd.vditor.toolbar || !vd.vditor.toolbar.elements) return
  if (name === 'ai-settings') {
    handleAISettingsOpen()
    return
  }
  const el = vd.vditor.toolbar.elements[name]
  if (!el) return
  if (name === 'upload') {
    const input = el.querySelector('input[type="file"]')
    if (input) {
      input.click()
      return
    }
  }
  if (name === 'emoji') {
    el.style.display = 'inline-block'
    if (el.children[0]) el.children[0].click()
    watchEmojiPanelHide(el)
    return
  }
  if (el.children[0]) el.children[0].click()
}

function toggleMoreMenu() {
  if (showMoreMenu.value) {
    closeMoreMenu()
    return
  }
  const moreEl = vd && vd.vditor && vd.vditor.toolbar && vd.vditor.toolbar.elements && vd.vditor.toolbar.elements['more-menu']
  if (moreEl) {
    const rect = moreEl.getBoundingClientRect()
    const menuWidth = 252
    moreMenuStyle.value = {
      top: rect.bottom + 6 + 'px',
      left: Math.min(rect.left, window.innerWidth - menuWidth - 12) + 'px'
    }
  }
  showMoreMenu.value = true
  bindMoreMenuListeners()
}

function closeMoreMenu() {
  if (showMoreMenu.value) showMoreMenu.value = false
  cleanupMoreMenuListeners()
}

let moreMenuDocHandler = null
function bindMoreMenuListeners() {
  cleanupMoreMenuListeners()
  moreMenuDocHandler = (e) => {
    const menu = document.querySelector('.more-toolbar-menu')
    const moreEl = vd && vd.vditor && vd.vditor.toolbar && vd.vditor.toolbar.elements && vd.vditor.toolbar.elements['more-menu']
    if (
      menu && !menu.contains(e.target) &&
      !(moreEl && (moreEl === e.target || moreEl.contains(e.target)))
    ) {
      closeMoreMenu()
    }
  }
  document.addEventListener('mousedown', moreMenuDocHandler, true)
}

function cleanupMoreMenuListeners() {
  if (moreMenuDocHandler) {
    document.removeEventListener('mousedown', moreMenuDocHandler, true)
    moreMenuDocHandler = null
  }
}

function resetAIDiagnostics() {
  aiConnectionStatus.value = null
  aiDiagnostics.value = { message: '' }
}

function syncAIPresetByConfig() {
  const currentBase = (aiConfig.value.baseURL || '').replace(/\/$/, '')
  const matched = aiPresetOptions.value.find(option =>
    option.value !== 'custom' && option.baseURL.replace(/\/$/, '') === currentBase
  )
  selectedAIPreset.value = matched ? matched.value : 'custom'
}

function applyAIPreset() {
  const preset = aiPresetOptions.value.find(option => option.value === selectedAIPreset.value)
  if (!preset || preset.value === 'custom') return
  aiConfig.value.baseURL = preset.baseURL
  aiConfig.value.model = preset.model
  resetAIDiagnostics()
}

function saveAISettings() {
  if (!aiConfig.value.apiKey) {
    warning(t('aiSettings.warnApiKey'))
    return false
  }
  if (!String(aiConfig.value.baseURL || '').trim()) {
    warning(t('aiSettings.warnBaseUrl'))
    return false
  }
  if (!String(aiConfig.value.model || '').trim()) {
    warning(t('aiSettings.warnModel'))
    return false
  }
  try {
    aiConfig.value = {
      ...aiConfig.value,
      apiKey: String(aiConfig.value.apiKey || '').trim(),
      baseURL: String(aiConfig.value.baseURL || '').trim().replace(/\/$/, ''),
      model: String(aiConfig.value.model || '').trim()
    }
    const normalizedBase = (aiConfig.value.baseURL || '').replace(/\/$/, '')
    const matchedPreset = aiPresetOptions.value.find(option =>
      option.value !== 'custom' &&
      option.baseURL.replace(/\/$/, '') === normalizedBase &&
      option.model === aiConfig.value.model
    )
    selectedAIPreset.value = matchedPreset ? matchedPreset.value : 'custom'

    localStorage.setItem('uni.aiConfig', JSON.stringify(aiConfig.value))
    localStorage.setItem(AI_PRESET_KEY, selectedAIPreset.value)
    aiConnectionStatus.value = {
      type: 'idle',
      text: t('aiSettings.savedHint')
    }
    success(t('aiSettings.saved'))
    return true
  } catch (e) {
    error(t('aiSettings.saveFailed'))
    return false
  }
}

async function runAIFormat() {
  if (!vd || !isVditorReady) return

  const content = vd.getValue()
  if (!content || !content.trim()) {
    warning(t('aiSettings.emptyDocument'))
    return
  }

  try {
    isAILoading.value = true
    aiStreamingChars.value = 0
    startAILoading('preparing')
    aiConnectionStatus.value = {
      type: 'loading',
      text: t('ai.requesting')
    }
    setAILoadingStage('requesting')

    // 两阶段流程：AI 出排版决策（方案 JSON），代码机械执行（不改字、硬配额）
    const plan = await planLayoutWithAI(content, aiConfig.value, {
      onDelta: (accumulated) => {
        aiStreamingChars.value = accumulated.length
        aiLoadingStage = 'streaming'
        updateAILoadingText()
      }
    })
    const limits = resolveStyleLimits(aiConfig.value.stylePreset)
    const { plan: cleanPlan, issues } = validateLayoutPlan(plan, content, limits)
    if (!cleanPlan || (!cleanPlan.headings.length && !cleanPlan.quotes.length && !cleanPlan.bolds.length && !cleanPlan.title)) {
      // 方案完全不可用 → 本地规则排版兜底（同样会进入预览确认）
      warning(t('ai.planUnavailable'))
      const formattedMarkdown = deterministicFormat(content)
      pendingAIResult.value = formattedMarkdown
      aiPreviewBefore.value = content
      showAIResultPreview.value = true
      aiConnectionStatus.value = { type: 'idle', text: t('ai.localFallbackDone') }
      return
    }
    if (issues.length) {
      console.debug('Formatting plan auto-corrected:', issues)
    }
    const formattedMarkdown = applyLayoutPlan(content, cleanPlan)

    // 不直接覆盖文档：先弹预览，确认后再应用
    pendingAIResult.value = formattedMarkdown
    aiPreviewBefore.value = content
    showAIResultPreview.value = true
    aiConnectionStatus.value = {
      type: 'idle',
      text: t('ai.done')
    }
    await nextTick()
    renderAIResultPreview()
  } catch (err) {
    console.error('AI formatting failed:', err)
    aiConnectionStatus.value = {
      type: 'error',
      text: t('ai.failedHint')
    }
    aiDiagnostics.value = {
      message: buildAIDiagnosticMessage(err)
    }
    if (err.message && /API Key/i.test(err.message)) {
      showAISettings.value = true
    } else {
      error(`${t('ai.formatFailed')}: ${err.message}`)
    }
  } finally {
    isAILoading.value = false
    stopAILoading()
  }
}

// 在预览对话框中静态渲染前后对照
async function renderAIResultPreview() {
  const previewTheme = getEditorTheme(props.pageTheme)
  const options = {
    theme: { current: previewTheme, path: 'https://unpkg.com/vditor/dist/css/content-theme' },
    hljs: { style: previewTheme === 'dark' ? 'github-dark' : 'github' }
  }
  try {
    if (aiPreviewBeforeEl.value) {
      await Vditor.preview(aiPreviewBeforeEl.value, aiPreviewBefore.value, options)
    }
    if (aiPreviewAfterEl.value) {
      await Vditor.preview(aiPreviewAfterEl.value, pendingAIResult.value, options)
    }
  } catch (e) {
    console.debug('AI preview render failed:', e)
  }
}

async function applyAIResult() {
  const formattedMarkdown = pendingAIResult.value
  if (!formattedMarkdown || !vd) return
  showAIResultPreview.value = false

  try {
    isAILoading.value = true
    startAILoading('switching-mode')
    const currentMode = typeof vd.getCurrentMode === 'function' ? vd.getCurrentMode() : 'wysiwyg'
    if (shouldSwitchToWysiwygPreview(formattedMarkdown, currentMode)) {
      await switchEditorMode('wysiwyg')
    }
    setAILoadingStage('rendering')
    vd.setValue(formattedMarkdown, true)
    const storageContent = convertContentForStorage(formattedMarkdown)
    const activeDoc = getActiveDocument()
    if (activeDoc) {
      setAILoadingStage('saving')
      activeDoc.content = storageContent
      activeDoc.updatedAt = Date.now()
      markDocumentModified(activeDoc.id)
      updateDocumentTitle(activeDoc.id, storageContent)
      saveToLocalStorage()
    }
    // setValue 同步写入 Markdown → DOM，但 Lute 渲染管道和浏览器 reflow 可能异步完成
    // 需要等待渲染完成后 getHTML() 才能返回正确的 HTML（否则可能出现原始 ** 星号）
    await nextTick()
    let retryCount = 0
    const maxRetries = 10
    while (retryCount < maxRetries) {
      const html = vd.getHTML()
      // 如果 HTML 中仍包含成对的 ** 星号（未被解析为 <strong>），说明渲染未完成
      if (!/\*\*[^*\n]+\*\*/.test(html)) break
      await new Promise(resolve => setTimeout(resolve, 100))
      retryCount++
    }
    emitEditorHtmlUpdate()
    aiConnectionStatus.value = {
      type: 'success',
      text: t('ai.applied')
    }
    aiDiagnostics.value = { message: '' }
    success(t('ai.applySuccess'))
  } catch (err) {
    console.error('Apply AI formatting failed:', err)
    error(`${t('ai.applyFailed')}: ${err.message}`)
  } finally {
    isAILoading.value = false
    stopAILoading()
    pendingAIResult.value = ''
  }
}

function discardAIResult() {
  showAIResultPreview.value = false
  pendingAIResult.value = ''
  aiConnectionStatus.value = {
    type: 'idle',
    text: t('ai.discarded')
  }
}

function startAILoading(stage) {
  aiLoadingStartedAt = Date.now()
  aiLoadingStage = stage
  updateAILoadingText()
  if (aiLoadingTimer) clearInterval(aiLoadingTimer)
  aiLoadingTimer = setInterval(() => {
    updateAILoadingText()
  }, 1000)
}

function stopAILoading() {
  if (aiLoadingTimer) {
    clearInterval(aiLoadingTimer)
    aiLoadingTimer = null
  }
  aiLoadingStartedAt = 0
  aiLoadingStage = 'idle'
  aiLoadingText.value = t('ai.loadingDefault')
}

function setAILoadingStage(stage) {
  aiLoadingStage = stage
  updateAILoadingText()
}

function updateAILoadingText() {
  const elapsedSeconds = aiLoadingStartedAt ? Math.max(0, Math.floor((Date.now() - aiLoadingStartedAt) / 1000)) : 0
  const elapsedText = elapsedSeconds > 0 ? t('ai.waitedSeconds', { seconds: elapsedSeconds }) : ''
  const presetLabel = aiPresetOptions.value.find(option => option.value === selectedAIPreset.value)?.label || t('ai.currentEndpoint')
  const stageTextMap = {
    preparing: t('ai.stagePreparing'),
    requesting: t('ai.stageRequesting', { preset: presetLabel, model: aiConfig.value.model || 'model' }),
    streaming: t('ai.stageStreaming', { count: aiStreamingChars.value }),
    'switching-mode': t('ai.stageSwitching'),
    rendering: t('ai.stageRendering'),
    saving: t('ai.stageSaving')
  }
  aiLoadingText.value = `${stageTextMap[aiLoadingStage] || t('ai.loadingDefault')}${elapsedText}`
}

function shouldSwitchToWysiwygPreview(markdown, mode) {
  if (mode === 'wysiwyg') return false
  const content = String(markdown || '')
  return /^#{1,6}\s/m.test(content)
    || /^>\s/m.test(content)
    || /^(\d+\.\s|-\s|\*\s)/m.test(content)
    || /\*\*[^*\n]+\*\*/.test(content)
}

async function switchEditorMode(targetMode) {
  if (!vd || typeof vd.getCurrentMode !== 'function') return false
  if (vd.getCurrentMode() === targetMode) return true

  const editModeRoot = vd.vditor?.toolbar?.elements?.['edit-mode']
  const targetButton = editModeRoot?.querySelector?.(`button[data-mode="${targetMode}"]`)
  if (!(targetButton instanceof HTMLElement)) return false

  targetButton.click()
  // 模式切换需要 Vditor 重新渲染编辑器 DOM，给足够时间完成
  await new Promise(resolve => setTimeout(resolve, 200))
  return vd.getCurrentMode() === targetMode
}

async function saveAndFormat() {
  const ok = saveAISettings()
  if (!ok) return
  await runAIFormat()
}

async function handleAIFormat() {
  if (!String(aiConfig.value.apiKey || '').trim()) {
    resetAIDiagnostics()
    showAISettings.value = true
    return
  }
  await runAIFormat()
}

async function handleAITest() {
  const ok = saveAISettings()
  if (!ok) return

  try {
    isAITesting.value = true
    aiConnectionStatus.value = {
      type: 'loading',
      text: t('ai.testingConnection')
    }
    aiDiagnostics.value = { message: '' }
    const result = await testAIConnection(aiConfig.value)
    aiConnectionStatus.value = {
      type: 'success',
      text: t('ai.testSuccess', { model: result.model })
    }
    aiDiagnostics.value = {
      message: `${t('ai.diagEndpoint', { endpoint: result.endpoint })}\n${t('ai.diagModel', { model: result.model })}\n${t('ai.testPreview')}: ${result.preview || 'OK'}`
    }
    success(t('ai.testSuccessToast'))
  } catch (err) {
    console.error('AI connection test failed:', err)
    aiConnectionStatus.value = {
      type: 'error',
      text: t('ai.testFailedHint')
    }
    aiDiagnostics.value = {
      message: buildAIDiagnosticMessage(err)
    }
    error(`${t('ai.testFailedToast')}: ${err.message}`)
  } finally {
    isAITesting.value = false
  }
}

function buildAIDiagnosticMessage(err) {
  const details = err?.aiDetails || {}
  const lines = [
    t('ai.diagErrorInfo', { msg: err?.message || t('ai.diagUnknownError') })
  ]

  if (details.endpoint) lines.push(t('ai.diagEndpoint', { endpoint: details.endpoint }))
  if (details.model) lines.push(t('ai.diagModel', { model: details.model }))
  if (details.status) lines.push(t('ai.diagStatus', { status: details.status }))
  lines.push(t('ai.diagRequestMethod') + ': ' + (details.useProxy ? t('ai.diagViaProxy') : t('ai.diagDirect')))
  if (details.responseText) lines.push(t('ai.diagResponseText', { text: details.responseText }))
  if (details.causeMessage && details.causeMessage !== err?.message) lines.push(t('ai.diagCause', { cause: details.causeMessage }))

  return lines.join('\n')
}


// 提取文档标题
function extractTitleFromContent(content) {
  if (!content) return null

  // 尝试匹配 markdown 标题
  const headingMatch = content.match(/^#+\s*(.+)$/m)
  if (headingMatch) {
    return headingMatch[1].trim()
  }

  // 尝试匹配第一行非空内容
  const lines = content.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      // 移除markdown格式并限制长度
      const cleaned = trimmed.replace(/[*_`~\[\]]/g, '').trim()
      if (cleaned) {
        return cleaned.length > 50 ? cleaned.substring(0, 50) + '...' : cleaned
      }
    }
  }

  return null
}

// 更新文档标题
function updateDocumentTitle(docId, content) {
  const doc = getDocument(docId)
  if (!doc) return

  const extractedTitle = extractTitleFromContent(content)

  if (extractedTitle) {
    // 情况1：文档标题是默认的"无标题文档"格式，直接更新
    if (doc.title.startsWith(t('documents.untitled'))) {
      doc.title = extractedTitle
      saveToLocalStorage()
      return
    }

    // 情况2：当前标题与提取的标题不同，且提取的是markdown标题，则更新
    const headingMatch = content.match(/^#+\s*(.+)$/m)
    if (headingMatch && doc.title !== extractedTitle) {
      doc.title = extractedTitle
      saveToLocalStorage()
    }
  } else if (!content.trim() && !doc.title.startsWith(t('documents.untitled'))) {
    // 情况3：内容为空但标题不是默认的，保持当前标题不变
    // 这样用户手动设置的标题在清空内容时不会丢失
  }
}

// 更新滚动条
function updateScrollbar() {
  if (!tabsScrollRef.value) return

  const scrollEl = tabsScrollRef.value
  const scrollWidth = scrollEl.scrollWidth
  const clientWidth = scrollEl.clientWidth

  // 判断是否需要显示滚动条
  showScrollbar.value = scrollWidth > clientWidth

  if (showScrollbar.value) {
    // 计算滚动条thumb的宽度（百分比）
    scrollbarThumbWidth.value = (clientWidth / scrollWidth) * 100

    // 计算滚动条thumb的位置
    const scrollPercentage = scrollEl.scrollLeft / (scrollWidth - clientWidth)
    const maxThumbPosition = clientWidth - (clientWidth * scrollbarThumbWidth.value / 100)
    scrollbarThumbPosition.value = scrollPercentage * maxThumbPosition
  }
}

// 绑定滚动条事件
function bindScrollbarEvents() {
  if (!tabsScrollRef.value) return

  const scrollEl = tabsScrollRef.value

  // 监听滚动事件
  const handleScroll = () => {
    updateScrollbar()
  }

  // 监听尺寸变化
  const resizeObserver = new ResizeObserver(() => {
    updateScrollbar()
  })

  scrollEl.addEventListener('scroll', handleScroll)
  resizeObserver.observe(scrollEl)

  // 清理函数
  const cleanup = () => {
    scrollEl.removeEventListener('scroll', handleScroll)
    resizeObserver.disconnect()
  }

  scrollCleanups.push(cleanup)
}

// 获取HTML内容
function getHTML() {
  if (vd && isVditorReady) {
    return vd.getHTML()
  }
  return ''
}

onMounted(() => {
  initializeDocuments()
  nextTick(() => {
    initVditor()
    // 初始化滚动条
    setTimeout(() => {
      bindScrollbarEvents()
      updateScrollbar()
    }, 100)
  })
})

onBeforeUnmount(() => {
  // 保存当前状态
  saveCurrentDocumentState()
  saveToLocalStorage()
  if (imageCleanupTimer) {
    clearTimeout(imageCleanupTimer)
    imageCleanupTimer = null
  }
  if (imageResizeSyncTimer) {
    clearTimeout(imageResizeSyncTimer)
    imageResizeSyncTimer = null
  }
  stopAILoading()
  hideImageResizeHandle()
  cleanupModeChangeListener()
  cleanupMoreMenuListeners()
  closeMoreMenu()
  if (emojiPanelWatchTimer) {
    clearInterval(emojiPanelWatchTimer)
    emojiPanelWatchTimer = null
  }
  destroyVditor()
})

// 暴露方法给父组件
defineExpose({
  getHTML,
  getProjectExportData,
  createNewDocument,
  openDocument,
  closeTab,
  duplicateDocument
})
</script>

<style lang="less" scoped>
@import '../styles/less/variables/colors.less';
@import '../styles/less/variables/layout.less';
@import '../styles/less/variables/typography.less';
@import '../styles/less/mixins/common.less';
// Import the UniEditor component styles
@import '../styles/less/components/uni-editor.less';

// 「更多」工具栏浮层（墨绿·杂志工作室）
.more-toolbar-menu {
  position: fixed;
  z-index: 999;
  width: 252px;
  max-height: 78vh;
  overflow-y: auto;
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow:
    0 12px 32px rgba(30, 40, 34, 0.16),
    0 2px 8px rgba(30, 40, 34, 0.08);
  padding: 8px;
  backdrop-filter: blur(8px);
  user-select: none;

  .more-menu-section + .more-menu-divider {
    margin: 6px 4px;
  }

  .more-menu-divider {
    height: 1px;
    background: var(--border);
    margin: 2px 4px;
    opacity: 0.7;
  }

  .more-menu-title {
    font-size: 11px;
    letter-spacing: 0.12em;
    color: var(--muted);
    padding: 2px 8px 6px;
    font-family: @font-family-serif;
  }

  .more-menu-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 2px;
  }

  .more-menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 8px;
    border: 0;
    border-radius: 7px;
    background: transparent;
    color: var(--text);
    font-size: 13px;
    text-align: left;
    cursor: pointer;
    transition: background 0.15s ease, color 0.15s ease;

    &:hover {
      background: color-mix(in srgb, var(--accent) 9%, transparent);
      color: var(--accent);
    }

    &:active {
      background: color-mix(in srgb, var(--accent) 16%, transparent);
    }

    .more-menu-icon {
      flex: none;
      width: 16px;
      height: 16px;
      display: inline-flex;
      align-items: center;
      justify-content: center;

      :deep(svg) {
        width: 16px;
        height: 16px;
      }
    }

    .more-menu-label {
      display: flex;
      flex-direction: column;
      line-height: 1.25;
      min-width: 0;

      em {
        font-style: normal;
        font-size: 11px;
        color: var(--muted);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }
}

// AI 排版结果预览对话框：前后对照
.ai-result-dialog {
  width: min(1000px, 94vw);
  max-width: none;
  display: flex;
  flex-direction: column;
  max-height: 88vh;
}

.ai-result-body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  > p {
    margin: 0 0 10px 0;
  }
}

.ai-result-compare {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.ai-result-pane {
  display: flex;
  flex-direction: column;
  min-height: 0;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

.ai-pane-label {
  padding: 6px 12px;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
  border-bottom: 1px solid var(--border);
  background: color-mix(in srgb, var(--muted) 6%, var(--panel));
}

.ai-pane-label-accent {
  color: var(--accent);
}

.ai-result-render {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 4px 16px;

  :deep(.vditor-reset) {
    font-size: 13px;
    padding: 12px 0;
  }
}

@media (max-width: 860px) {
  .ai-result-compare {
    grid-template-columns: 1fr;
    overflow-y: auto;
  }

  .ai-result-pane {
    max-height: 40vh;
  }
}
</style>
