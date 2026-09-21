export default {
  // 头部导航
  header: {
    logo: '绿玩编辑器',
    github: 'GitHub',
    feedback: '意见反馈',
    features: '已支持功能',
    todo: '待完善功能',
    appearance: '外观',
    appearanceLight: '浅色',
    appearanceDark: '深色',
    language: '语言',
    // 兼容性：保持旧命名
    theme: '外观',
    themeLight: '浅色',
    themeDark: '深色'
  },

  // 主要功能区域
  main: {
    editor: '编辑器',
    preview: '内容预览',
    articleMode: '长文模式',
    cardMode: '卡片模式',
    copyAll: '全部复制',
    saveCards: '保存卡片',
    saveArticle: '保存长文',
    colorTheme: '色彩主题',
    theme: '色彩主题', // 兼容性
    stylePreset: '排版风格',
    styleDock: '样式设置',
    spacing: '间距',
    scale: '缩放',
    exportMarkdown: '导出MD',
    importMarkdown: '导入MD',
    exportProject: '导出项目包'
  },

  // 文档信息（报头元数据）
  docMeta: {
    title: '文档信息',
    masthead: '刊物名',
    issue: '期号',
    date: '日期',
    kicker: '栏目',
    author: '署名',
    mastheadPlaceholder: '如：瓦当的AI笔记',
    issuePlaceholder: '如：Vol.03',
    datePlaceholder: '如：2026.08.04',
    kickerPlaceholder: '如：AI观察',
    authorPlaceholder: '如：瓦当'
  },

  // 关于
  about: {
    title: '关于绿玩编辑器',
    description: '绿玩编辑器是一个现代化的 Markdown 编辑器，专注于公众号长文排版与小红书卡片制作。',
    logoTitle: '绿玩编辑器独立维护，早期基于开源项目 uni-editor',
    basedOnPrefix: '基于开源项目 ',
    basedOnMid: ' 二次开发，配色灵感来自 ',
    basedOnSuffix: '。',
    gotIt: '知道了'
  },

  // 卡片预览相关
  cardsPreview: {
    cover: '封面',
    cards: '卡片',
    coverImage: '封面图',
    title: '标题',
    titlePlaceholder: '请输入标题',
    summary: '摘要',
    summaryPlaceholder: '请输入摘要',
    clickToUpload: '点击上传图片',
    clickToReplace: '点击替换',
    imageFormats: '支持 JPG、PNG 格式，大小不超过 5MB',
    fillMode: '填充方式',
    fillCover: '覆盖（等比裁剪）',
    fillContain: '适应（等比留边）',
    alignPosition: '对齐位置',
    alignCenter: '居中',
    alignTop: '上',
    alignBottom: '下',
    alignLeft: '左',
    alignRight: '右',
    alignTopLeft: '左上',
    alignTopRight: '右上',
    alignBottomLeft: '左下',
    alignBottomRight: '右下',
    showMeta: '显示信息条',
    showDocInfo: '显示文档信息',
    show: '显示',
    hide: '隐藏',
    wordCount: '全文 {count} 字',
    readingTime: '阅读需 {minutes} 分钟',
    syncTitle: '从编辑器同步标题',
    syncSummary: '从编辑器同步摘要',
    syncCoverImage: '从编辑器同步封面图',
    syncTitleSuccess: '标题同步成功',
    syncSummarySuccess: '摘要同步成功',
    syncCoverImageSuccess: '封面图同步成功',
    syncNoContent: '编辑器中未找到相应内容',
    generating: '正在生成卡片...',
    currentImage: '当前图片',
    coverFileSuffix: '封面',
    editCover: '编辑封面',
    closeEditor: '收起设置'
  },

  // 封面布局
  coverLayouts: {
    minimal: '极简',
    minimalDesc: '仅显示标题，居中显示',
    center: '居中',
    centerDesc: '标题和摘要居中显示',
    imageTop: '图上',
    imageTopDesc: '图片上方，文字下方',
    imageBottom: '图下',
    imageBottomDesc: '文字上方，图片下方',
    magazine: '杂志',
    magazineDesc: '标题上方居中，摘要左侧',
    bold: '大字报',
    boldDesc: '超大标题撑满封面',
    film: '胶片',
    filmDesc: '相框风格，标题底部叠加'
  },

  // 编辑器相关
  editor: {
    welcome: '欢迎使用绿玩编辑器',
    features: [
      '所见即所得 + Markdown 源码',
      '主题切换（编辑器与卡片）',
      '一键复制为公众号格式',
      '预览长文卡片并导出高清图片'
    ],
    saveSuccess: '内容已保存到本地',
    loadError: '加载内容失败',
    pageBreak: '插入分页符',
    pageBreakLabel: '分页符',
    emptyLine: '插入空行'
  },

  // 功能列表（已完成）
  completedFeatures: {
    title: '已支持功能',
    list: [
      '所见即所得编辑器集成',
      'Markdown源码模式切换',
      '多主题编辑器支持',
      '公众号格式复制功能',
      '卡片预览与导出',
      '多种卡片主题切换',
      '暗色/浅色页面主题',
      '内容本地缓存',
      '长文自动分页',
      '高清PNG图片导出'
    ]
  },

  // 待办列表
  todoFeatures: {
    title: '待完善功能',
    list: [
      '完善图片上传功能',
      '添加导出PDF功能',
      '更多丰富和不同样式的主题'
    ]
  },

  // 消息提示
  messages: {
    copySuccess: '已复制为公众号格式（{theme} 主题）。',
    copyDegraded: '微信安全模式：已自动降级 {count} 处公众号不支持的样式（渐变/阴影/圆角等）。',
    copyFailed: '复制失败：已尝试回退纯文本。',
    emptyContent: '编辑器内容为空',
    exportSuccess: '卡片导出成功',
    exportFailed: '导出失败，请重试',
    exportMarkdownSuccess: 'Markdown文件导出成功',
    exportMarkdownFailed: 'Markdown导出失败，请重试',
    importMarkdownSuccess: 'Markdown文件导入成功',
    importMarkdownFailed: 'Markdown导入失败，请重试',
    projectExportSuccess: '项目包导出成功',
    projectExportFailed: '项目包导出失败，请重试',
    invalidMarkdownFile: '请选择有效的Markdown文件（.md）',
    imageUploadSuccess: '图片上传成功',
    imageUploadFailed: '图片上传失败',
    imageSizeExceeded: '图片大小不能超过5MB',
    invalidImageFormat: '请选择JPG或PNG格式的图片'
  },

  // Loading 文本
  loading: {
    // 长文导出
    articlePreparing: '正在准备导出...',
    articleAdjusting: '正在调整导出样式...',
    articleGenerating: '正在生成图片...',
    articleSaving: '正在保存文件...',
    articleSuccess: '长文保存成功',

    // 卡片导出
    cardsPreparing: '正在准备导出卡片...',
    cardsTotal: '准备导出 {count} 张卡片...',
    cardsExporting: '正在导出第 {current} 张卡片 ({current}/{total})...',
    cardsComplete: '导出完成！'
  },

  // 底部版权
  footer: {
    about: '关于',
    copyright: '© 2025 绿玩编辑器 · 独立维护，早期基于 uni-editor',
    exportCredit: '使用绿玩编辑器制造',
    ribbonCredit: '绿玩编辑器',
    exportLink: 'https://github.com/rockdna/greenplay-editor',
    wxLayoutCredit: '配色灵感 WXLayoutSkill'
  },

  // 色彩主题名称
  colorThemes: {
    classic: '经典',
    minimal: '简约',
    paper: '纸质',
    ocean: '海洋',
    forest: '森林',
    sunset: '夕阳',
    grape: '葡萄',
    slate: '石板',
    sand: '沙漠',
    parchment: '羊皮纸',
    rose: '尘粉',
    sage: '鼠尾草',
    lavender: '薰衣草',
    warmNeutral: '暖灰'
  },

  // 排版风格预设
  stylePresets: {
    auto: '跟随主题',
    classic: '经典书卷',
    elegant: '杂志画报',
    playful: '社交轻快',
    minimalist: '极简留白',
    journal: '手账日志',
    report: '商务报告',
    classicDesc: '宋体正文 · 首行缩进 · 居中章节标题，纸质出版感',
    elegantDesc: '无衬线大字 · 导语引路 · 发丝线收束，现代社论感',
    playfulDesc: '圆角色块 · 箭头列表 · 反色强调，平台轻快分享感',
    minimalistDesc: '细字重大行距 · 留白呼吸 · 克制灰阶，安静简洁',
    journalDesc: '楷体手写 · 荧光笔强调 · 便签贴纸，随手记录感',
    reportDesc: '无衬线干练 · 双线表头 · 编号要项，理性数据报告感',
    autoDesc: '由当前主题色彩匹配一套默认排版，省心省力',
    stylePresetHint: '改变标题层级、正文节奏、引文与列表的整体版式，不只是加粗'
  },

  // 间距预设
  spacingPresets: {
    compact: '紧凑',
    standard: '标准',
    loose: '宽松'
  },

  // 兼容性：保持旧命名
  themes: {
    classic: '经典',
    minimal: '简约',
    paper: '纸张',
    ocean: '海洋',
    forest: '森林',
    sunset: '夕阳',
    grape: '葡萄',
    slate: '石板',
    sand: '沙漠',
    parchment: '羊皮纸',
    rose: '尘粉',
    sage: '鼠尾草',
    lavender: '薰衣草',
    warmNeutral: '暖灰'
  },

  // 文档管理
  documents: {
    newDocument: '新建文档',
    untitled: '无标题文档',
    welcome: '欢迎文档',
    copy: '副本',
    rename: '重命名',
    duplicate: '复制',
    close: '关闭',
    renameTitle: '重命名文档',
    renamePlaceholder: '请输入文档名称',
    exportAll: '导出所有文档',
    importDocuments: '导入文档',
    confirmClose: '确认关闭文档？',
    unsavedChanges: '文档有未保存的更改',
    // 多标签页管理
    library: '文档库',
    importApproved: '导入审核稿',
    charactersCount: '{count} 字符',
    closeTabTitle: '关闭标签',
    // 文档操作
    openDocument: '打开文档',
    locateTab: '定位标签',
    duplicateDocument: '复制文档',
    deleteDocument: '删除文档',
    importMD: '导入MD文件',
    exportMD: '导出MD文件',
    // 确认对话框
    confirmDelete: '确认删除',
    confirmDeleteMessage: '确定要删除文档 "{title}" 吗？',
    confirmImport: '确认导入',
    confirmImportMessage: '文档 "{title}" 已有内容。',
    confirmImportSubMessage: '确定要用导入的内容覆盖当前文档吗？',
    warningNotRecoverable: '此操作不可恢复。',
    confirmImportAction: '确认导入',
    importFailed: '审核稿导入失败',
    importSuccess: '已导入「{name}」，共 {count} 张卡片',
    // 时间格式
    timeJustNow: '刚刚',
    timeMinutesAgo: '{minutes}分钟前',
    timeHoursAgo: '{hours}小时前',
    timeDaysAgo: '{days}天前'
  },

  // 通用
  common: {
    expand: '展开',
    collapse: '收起',
    close: '关闭',
    confirm: '确认',
    cancel: '取消',
    loading: '加载中...',
    error: '错误',
    success: '成功',
    search: '搜索文档...',
    clearSearch: '清除搜索',
    loadMore: '加载更多',
    previous: '上一页',
    next: '下一页'
  },

  // 图片缩放菜单
  imageResize: {
    title: '缩放图片',
    customWidthAria: '自定义图片宽度百分比',
    apply: '应用',
    align: '对齐',
    left: '左',
    center: '中',
    right: '右',
    leftTip: '左对齐',
    centerTip: '居中',
    rightTip: '右对齐'
  },

  // 「更多」工具栏浮层
  moreMenu: {
    insert: '插入',
    tools: '工具',
    quote: '引用',
    code: '代码块',
    table: '表格',
    link: '链接',
    emoji: '表情',
    aiSettings: 'AI 排版设置',
    selectedText: '选中文本',
    atCursor: '光标处'
  },

  // AI 设置对话框
  aiSettings: {
    title: 'AI 自动排版设置',
    providerPreset: '服务商预设',
    customPreset: '自定义（手动填写）',
    presetSiliconflow: '硅基流动 SiliconFlow',
    baseUrl: '接口地址 (Base URL)',
    model: '模型名称 (Model)',
    stylePreset: '排版风格倾向',
    styleAuto: '自动（由 AI 判断）',
    styleAcademic: '学术严谨（克制加粗，多用标题分层）',
    styleLively: '轻松活泼（多用引用和列表，加粗密度高）',
    styleConcise: '极简克制（仅必要的分段和加粗）',
    styleXiaohongshu: '小红书风（短段落，emoji 提示，高密度加粗）',
    compatHint: '支持 OpenAI 格式的兼容接口（如 DeepSeek, 阿里通义, Kimi 等）。您的配置仅保存在本地浏览器中。',
    diagTitle: '最近一次请求诊断',
    testing: '测试中...',
    testConnection: '测试连接',
    saveOnly: '仅保存',
    saveAndFormat: '保存并排版',
    warnApiKey: '请先填写 API Key',
    warnBaseUrl: '请先填写接口地址',
    warnModel: '请先填写模型名称',
    savedHint: '配置已保存，建议先测试连接再排版。',
    saved: 'AI 配置已保存',
    saveFailed: '保存配置失败',
    emptyDocument: '当前文档内容为空'
  },

  // AI 排版结果预览
  aiResult: {
    title: '排版结果确认',
    description: '左侧为原文，右侧为 AI 排版结果。确认前不会改动你的文档；放弃则一切照旧。',
    original: '原文',
    formatted: '排版后',
    discard: '放弃',
    apply: '应用排版'
  },

  // 工具栏提示
  toolbar: {
    aiFormat: 'AI 一键排版',
    pageBreak: '插入分页符（用于卡片模式分页）',
    emptyLine: '插入空行（增加段落间距）',
    more: '更多功能（引用 / 代码 / 表格 / 链接 / 表情 / AI 设置）',
    aiSettings: 'AI 排版设置'
  },

  // AI 排版流程提示
  ai: {
    loadingDefault: 'AI 正在排版中，请稍候...',
    requesting: '正在请求 AI 排版接口...',
    planUnavailable: 'AI 方案不可用，已切换到本地安全排版',
    localFallbackDone: '本地安全排版完成，请在预览中确认。',
    done: 'AI 排版完成，请在预览中对比确认。',
    failedHint: 'AI 排版失败，请先查看下面的诊断信息。',
    formatFailed: 'AI 排版失败',
    applied: 'AI 排版已应用。',
    applySuccess: 'AI 自动排版完成',
    applyFailed: '应用排版结果失败',
    discarded: '已放弃本次 AI 排版结果，原文未改动。',
    stagePreparing: '正在整理编辑器内容并准备排版请求...',
    stageRequesting: '正在请求 {preset} 的 {model}，长文通常需要一些时间...',
    stageStreaming: 'AI 正在流式排版，已接收 {count} 字...',
    stageSwitching: '正在切换到更适合检查排版结果的编辑模式...',
    stageRendering: 'AI 已返回结果，正在把标题、加粗、列表等效果写回编辑器...',
    stageSaving: '正在保存排版后的内容到本地文档...',
    waitedSeconds: '\n已等待 {seconds} 秒',
    currentEndpoint: '当前接口',
    testingConnection: '正在测试连接...',
    testSuccess: '连接测试成功：模型 {model} 已返回内容。',
    testPreview: '返回预览',
    testSuccessToast: 'AI 连接测试成功',
    testFailedHint: '连接测试失败，请检查下面的诊断信息。',
    testFailedToast: '连接测试失败',
    diagErrorInfo: '错误信息：{msg}',
    diagEndpoint: '请求地址：{endpoint}',
    diagModel: '模型：{model}',
    diagStatus: '状态码：{status}',
    diagRequestMethod: '请求方式：{method}',
    diagViaProxy: '通过本地代理 /cors-proxy',
    diagDirect: '浏览器直连目标接口',
    diagResponseText: '错误正文：{text}',
    diagCause: '底层报错：{cause}',
    diagUnknownError: '未知错误'
  },

  // 长文预览 / 导出
  article: {
    byline: '文 / {author}',
    exportPrefix: '长文_'
  },

  // 默认模板内容
  defaultTemplate: `# 欢迎使用绿玩编辑器

绿玩编辑器是一个现代化的 Markdown 编辑器，专为**公众号排版**和**图片类平台发布**设计。

绿玩编辑器独立维护，早期版本参考并基于开源项目 [uni-editor](https://github.com/flzyup/uni-editor) 二次开发。

## 核心特性

### 强大的编辑功能
- **所见即所得** + Markdown 源码模式一键切换
- 支持多种文本样式和格式
- 实时预览，即写即看

### 多样化主题系统
- **编辑器主题**：深色/浅色模式
- **卡片主题**：9种精美主题可选
- 实时切换，立即生效

### AI 智能排版
- 一键 AI 排版，自动优化格式
- 多种排版风格可选
- 支持自定义 AI 排版设置

### 智能分页导出
1. **长文模式**：一键复制为公众号格式
2. **卡片模式**：自动分页为4:3比例卡片
3. **高清导出**：PNG格式，适合各大平台

## 技术特性

> 绿玩编辑器基于现代Web技术构建，提供流畅的编辑体验

- [x] **本地存储**：内容自动缓存，防止意外丢失
- [x] **多语言支持**：中英文界面切换
- [x] **响应式设计**：适配各种屏幕尺寸
- [ ] 图片上传优化（开发中）
- [ ] PDF导出功能（计划中）

## 常用链接

- **开源地址**：[GitHub仓库](https://github.com/rockdna/greenplay-editor)
- **原项目**：[uni-editor](https://github.com/flzyup/uni-editor)

## 使用技巧

\`\`\`markdown
# 一级标题
## 二级标题
### 三级标题

**粗体文本** 和 *斜体文本*

> 这是一个引用块
> 可以包含多行内容

- 无序列表项1
- 无序列表项2
  - 嵌套列表项

1. 有序列表项1
2. 有序列表项2

[链接文本](https://example.com)

\`内联代码\`
\`\`\`

---

现在就开始你的创作之旅吧！删除这些示例内容，写下属于你的精彩文章。`
}
