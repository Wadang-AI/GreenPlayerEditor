export default {
  // Header navigation
  header: {
    logo: 'GreenPlay Editor',
    github: 'GitHub',
    feedback: 'Feedback',
    features: 'Supported Features',
    todo: 'Pending Features',
    appearance: 'Appearance',
    appearanceLight: 'Light',
    appearanceDark: 'Dark',
    language: 'Language',
    // Compatibility: keep old naming
    theme: 'Appearance',
    themeLight: 'Light',
    themeDark: 'Dark'
  },

  // Main functional areas
  main: {
    editor: 'Editor',
    preview: 'Content Preview',
    articleMode: 'Article Mode',
    cardMode: 'Card Mode',
    copyAll: 'Copy All',
    saveCards: 'Save Cards',
    saveArticle: 'Save Article',
    colorTheme: 'Color Theme',
    theme: 'Color Theme', // Compatibility
    stylePreset: 'Style',
    styleDock: 'Style Settings',
    spacing: 'Spacing',
    scale: 'Scale',
    exportMarkdown: 'Export MD',
    importMarkdown: 'Import MD',
    exportProject: 'Export project'
  },

  // Document info (masthead metadata)
  docMeta: {
    title: 'Document Info',
    masthead: 'Masthead',
    issue: 'Issue',
    date: 'Date',
    kicker: 'Kicker',
    author: 'Byline',
    mastheadPlaceholder: 'e.g. My AI Notes',
    issuePlaceholder: 'e.g. Vol.03',
    datePlaceholder: 'e.g. 2026.08.04',
    kickerPlaceholder: 'e.g. AI Observer',
    authorPlaceholder: 'e.g. Your Name'
  },

  // About
  about: {
    title: 'About GreenPlay Editor',
    description: 'GreenPlay Editor is a modern Markdown editor focused on WeChat article styling and Xiaohongshu card creation.',
    logoTitle: 'Independently maintained by GreenPlay Editor; originally based on uni-editor',
    basedOnPrefix: 'Based on the open-source project ',
    basedOnMid: ', with color inspiration from ',
    basedOnSuffix: '.',
    gotIt: 'Got it'
  },

  // Cards preview related
  cardsPreview: {
    cover: 'Cover',
    cards: 'Cards',
    coverImage: 'Cover Image',
    title: 'Title',
    titlePlaceholder: 'Please enter title',
    summary: 'Summary',
    summaryPlaceholder: 'Please enter summary',
    clickToUpload: 'Click to upload image',
    clickToReplace: 'Click to replace',
    imageFormats: 'Support JPG, PNG formats, size no more than 5MB',
    fillMode: 'Fill Mode',
    fillCover: 'Cover (Scale to fit)',
    fillContain: 'Contain (Scale with margin)',
    alignPosition: 'Align Position',
    alignCenter: 'Center',
    alignTop: 'Top',
    alignBottom: 'Bottom',
    alignLeft: 'Left',
    alignRight: 'Right',
    alignTopLeft: 'Top Left',
    alignTopRight: 'Top Right',
    alignBottomLeft: 'Bottom Left',
    alignBottomRight: 'Bottom Right',
    showMeta: 'Show Info Bar',
    showDocInfo: 'Show Document Info',
    show: 'Show',
    hide: 'Hide',
    wordCount: 'Full text {count} words',
    readingTime: 'Reading time {minutes} min',
    syncTitle: 'Sync title from editor',
    syncSummary: 'Sync summary from editor',
    syncCoverImage: 'Sync cover image from editor',
    syncTitleSuccess: 'Title synced successfully',
    syncSummarySuccess: 'Summary synced successfully',
    syncCoverImageSuccess: 'Cover image synced successfully',
    syncNoContent: 'No corresponding content found in editor',
    generating: 'Generating cards...',
    currentImage: 'Current image',
    coverFileSuffix: 'Cover',
    editCover: 'Edit cover',
    closeEditor: 'Hide settings'
  },

  // Cover layouts
  coverLayouts: {
    minimal: 'Minimal',
    minimalDesc: 'Show title only, centered display',
    center: 'Center',
    centerDesc: 'Title and summary centered display',
    imageTop: 'IMG Top',
    imageTopDesc: 'Image on top, text below',
    imageBottom: 'IMG Btm',
    imageBottomDesc: 'Text on top, image below',
    magazine: 'Magazine',
    magazineDesc: 'Title centered on top, summary on left',
    bold: 'Bold',
    boldDesc: 'Oversized title fills the cover',
    film: 'Film',
    filmDesc: 'Photo frame style, title overlay at bottom'
  },

  // Editor related
  editor: {
    welcome: 'Welcome to GreenPlay Editor',
    features: [
      'WYSIWYG + Markdown source code',
      'Theme switching (editor and cards)',
      'One-click copy to WeChat format',
      'Preview long articles as cards and export high-resolution images'
    ],
    saveSuccess: 'Content saved locally',
    loadError: 'Failed to load content',
    pageBreak: 'Insert Page Break',
    pageBreakLabel: 'Page Break',
    emptyLine: 'Insert Empty Line'
  },

  // Feature list (completed)
  completedFeatures: {
    title: 'Supported Features',
    list: [
      'WYSIWYG editor integration',
      'Markdown source mode switching',
      'Multi-theme editor support',
      'WeChat format copy functionality',
      'Card preview and export',
      'Multiple card theme switching',
      'Dark/light page themes',
      'Local content caching',
      'Automatic long article pagination',
      'High-resolution PNG export'
    ]
  },

  // Todo list
  todoFeatures: {
    title: 'Pending Features',
    list: [
      'Improve image upload functionality',
      'Add PDF export feature',
      'More rich and diverse theme styles'
    ]
  },

  // Message prompts
  messages: {
    copySuccess: 'Copied to WeChat format ({theme} theme).',
    copyDegraded: 'WeChat-safe mode: {count} unsupported style declarations were downgraded (gradients, shadows, rounded corners, etc.).',
    copyFailed: 'Copy failed: fallback to plain text.',
    emptyContent: 'Editor content is empty',
    exportSuccess: 'Cards exported successfully',
    exportFailed: 'Export failed, please try again',
    exportMarkdownSuccess: 'Markdown file exported successfully',
    exportMarkdownFailed: 'Markdown export failed, please try again',
    importMarkdownSuccess: 'Markdown file imported successfully',
    importMarkdownFailed: 'Markdown import failed, please try again',
    projectExportSuccess: 'Project package exported',
    projectExportFailed: 'Project package export failed. Please try again.',
    invalidMarkdownFile: 'Please select a valid Markdown file (.md)',
    imageUploadSuccess: 'Image uploaded successfully',
    imageUploadFailed: 'Image upload failed',
    imageSizeExceeded: 'Image size cannot exceed 5MB',
    invalidImageFormat: 'Please select JPG or PNG format image'
  },

  // Loading text
  loading: {
    // Article export
    articlePreparing: 'Preparing to export...',
    articleAdjusting: 'Adjusting export styles...',
    articleGenerating: 'Generating image...',
    articleSaving: 'Saving file...',
    articleSuccess: 'Article saved successfully',

    // Cards export
    cardsPreparing: 'Preparing to export cards...',
    cardsTotal: 'Preparing to export {count} cards...',
    cardsExporting: 'Exporting card {current} of {total} ({current}/{total})...',
    cardsComplete: 'Export completed!'
  },

  // Footer copyright
  footer: {
    about: 'About',
    copyright: '© 2025 GreenPlay Editor · Independently maintained; originally based on uni-editor',
    exportCredit: 'Created with GreenPlay Editor',
    ribbonCredit: 'GreenPlay Editor',
    exportLink: 'https://github.com/Wadang-AI/GreenPlayerEditor',
    wxLayoutCredit: 'Color inspiration WXLayoutSkill'
  },

  // Color theme names
  colorThemes: {
    classic: 'Classic',
    minimal: 'Minimal',
    paper: 'Paper',
    ocean: 'Ocean',
    forest: 'Forest',
    sunset: 'Sunset',
    grape: 'Grape',
    slate: 'Slate',
    sand: 'Sand',
    parchment: 'Parchment',
    rose: 'Dust Rose',
    sage: 'Sage',
    lavender: 'Lavender',
    warmNeutral: 'Warm Gray'
  },

  // Style presets
  stylePresets: {
    auto: 'Auto',
    classic: 'Classic Book',
    elegant: 'Magazine',
    playful: 'Social Light',
    minimalist: 'Minimal',
    journal: 'Journal',
    report: 'Report',
    classicDesc: 'Serif body · indented paragraphs · centered chapter headings, a printed-book feel',
    elegantDesc: 'Sans large type · standfirst lead · hairline closure, a modern editorial feel',
    playfulDesc: 'Rounded chips · arrow lists · inverted emphasis, a light shareable feel',
    minimalistDesc: 'Lighter weight · generous leading · restrained grays, quiet and clean',
    journalDesc: 'Handwritten kai · highlighter emphasis · sticky-note quotes, a casual notebook feel',
    reportDesc: 'Clean sans · double-ruled tables · numbered key points, a rational report feel',
    autoDesc: 'Pick a default style that matches the current theme color',
    stylePresetHint: 'Controls the whole layout — heading hierarchy, body rhythm, quotes and lists, not just bold'
  },

  // Spacing presets
  spacingPresets: {
    compact: 'Compact',
    standard: 'Standard',
    loose: 'Loose'
  },

  // Compatibility: keep old naming
  themes: {
    classic: 'Classic',
    minimal: 'Minimal',
    paper: 'Paper',
    ocean: 'Ocean',
    forest: 'Forest',
    sunset: 'Sunset',
    grape: 'Grape',
    slate: 'Slate',
    sand: 'Sand',
    parchment: 'Parchment',
    rose: 'Dust Rose',
    sage: 'Sage',
    lavender: 'Lavender',
    warmNeutral: 'Warm Gray'
  },

  // Document Management
  documents: {
    newDocument: 'New Document',
    untitled: 'Untitled Document',
    welcome: 'Welcome Document',
    copy: 'Copy',
    rename: 'Rename',
    duplicate: 'Duplicate',
    close: 'Close',
    renameTitle: 'Rename Document',
    renamePlaceholder: 'Enter document name',
    exportAll: 'Export All Documents',
    importDocuments: 'Import Documents',
    confirmClose: 'Confirm close document?',
    unsavedChanges: 'Document has unsaved changes',
    // Multi-tab management
    library: 'Documents',
    importApproved: 'Import Approved',
    charactersCount: '{count} characters',
    closeTabTitle: 'Close tab',
    // Document operations
    openDocument: 'Open document',
    locateTab: 'Locate tab',
    duplicateDocument: 'Duplicate document',
    deleteDocument: 'Delete document',
    importMD: 'Import MD file',
    exportMD: 'Export MD file',
    // Confirmation dialogs
    confirmDelete: 'Confirm Delete',
    confirmDeleteMessage: 'Are you sure you want to delete document "{title}"?',
    confirmImport: 'Confirm Import',
    confirmImportMessage: 'Document "{title}" already has content.',
    confirmImportSubMessage: 'Are you sure you want to overwrite the current document with imported content?',
    warningNotRecoverable: 'This action cannot be undone.',
    confirmImportAction: 'Confirm Import',
    importFailed: 'Failed to import approved draft',
    importSuccess: 'Imported "{name}" as {count} cards',
    // Time format
    timeJustNow: 'just now',
    timeMinutesAgo: '{minutes} minutes ago',
    timeHoursAgo: '{hours} hours ago',
    timeDaysAgo: '{days} days ago'
  },

  // Common
  common: {
    expand: 'Expand',
    collapse: 'Collapse',
    close: 'Close',
    confirm: 'Confirm',
    cancel: 'Cancel',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    search: 'Search documents...',
    clearSearch: 'Clear search',
    loadMore: 'Load More',
    previous: 'Previous',
    next: 'Next'
  },

  // Image resize menu
  imageResize: {
    title: 'Resize Image',
    customWidthAria: 'Custom image width percentage',
    apply: 'Apply',
    align: 'Align',
    left: 'L',
    center: 'C',
    right: 'R',
    leftTip: 'Align left',
    centerTip: 'Center',
    rightTip: 'Align right'
  },

  // More toolbar menu
  moreMenu: {
    insert: 'Insert',
    tools: 'Tools',
    quote: 'Quote',
    code: 'Code Block',
    table: 'Table',
    link: 'Link',
    emoji: 'Emoji',
    aiSettings: 'AI Format Settings',
    selectedText: 'selected text',
    atCursor: 'at cursor'
  },

  // AI settings dialog
  aiSettings: {
    title: 'AI Auto-Format Settings',
    providerPreset: 'Provider Preset',
    customPreset: 'Custom (manual)',
    presetSiliconflow: 'SiliconFlow',
    baseUrl: 'Base URL',
    model: 'Model',
    stylePreset: 'Formatting Style',
    styleAuto: 'Auto (AI decides)',
    styleAcademic: 'Academic (restrained bold, heading-based)',
    styleLively: 'Lively (more quotes and lists, dense bold)',
    styleConcise: 'Minimalist (only necessary paragraphs and bold)',
    styleXiaohongshu: 'Xiaohongshu (short paragraphs, emoji cues, dense bold)',
    compatHint: 'Supports OpenAI-compatible APIs (e.g. DeepSeek, Qwen, Kimi, etc.). Your config is stored locally in the browser only.',
    diagTitle: 'Latest Request Diagnostics',
    testing: 'Testing...',
    testConnection: 'Test Connection',
    saveOnly: 'Save Only',
    saveAndFormat: 'Save & Format',
    warnApiKey: 'Please enter an API Key',
    warnBaseUrl: 'Please enter the Base URL',
    warnModel: 'Please enter the model name',
    savedHint: 'Config saved. It is recommended to test the connection before formatting.',
    saved: 'AI config saved',
    saveFailed: 'Failed to save config',
    emptyDocument: 'The current document is empty'
  },

  // AI formatting result preview
  aiResult: {
    title: 'Confirm Formatting Result',
    description: 'Original on the left, AI-formatted result on the right. Your document is not modified until confirmed; discarding leaves everything as is.',
    original: 'Original',
    formatted: 'Formatted',
    discard: 'Discard',
    apply: 'Apply Formatting'
  },

  // Toolbar tooltips
  toolbar: {
    aiFormat: 'AI One-Click Format',
    pageBreak: 'Insert page break (for card pagination)',
    emptyLine: 'Insert empty line (add paragraph spacing)',
    more: 'More tools (quote / code / table / link / emoji / AI settings)',
    aiSettings: 'AI Format Settings'
  },

  // AI formatting flow prompts
  ai: {
    loadingDefault: 'AI is formatting, please wait...',
    requesting: 'Requesting AI formatting API...',
    planUnavailable: 'AI plan unavailable, switched to safe local formatting',
    localFallbackDone: 'Safe local formatting done. Please confirm in the preview.',
    done: 'AI formatting done. Compare and confirm in the preview.',
    failedHint: 'AI formatting failed. See the diagnostics below.',
    formatFailed: 'AI formatting failed',
    applied: 'AI formatting applied.',
    applySuccess: 'AI formatting complete',
    applyFailed: 'Failed to apply formatting result',
    discarded: 'AI formatting result discarded, the original is unchanged.',
    stagePreparing: 'Preparing editor content and formatting request...',
    stageRequesting: 'Requesting {preset} \u00b7 {model}, long articles may take a while...',
    stageStreaming: 'AI is streaming formatting, received {count} characters...',
    stageSwitching: 'Switching to a better editing mode to review the result...',
    stageRendering: 'Result received. Applying headings, bold, lists back to the editor...',
    stageSaving: 'Saving formatted content to local document...',
    waitedSeconds: '\nWaited {seconds}s',
    currentEndpoint: 'current endpoint',
    testingConnection: 'Testing connection...',
    testSuccess: 'Connection test succeeded: model {model} returned content.',
    testPreview: 'Response preview',
    testSuccessToast: 'AI connection test succeeded',
    testFailedHint: 'Connection test failed. See the diagnostics below.',
    testFailedToast: 'Connection test failed',
    diagErrorInfo: 'Error: {msg}',
    diagEndpoint: 'Endpoint: {endpoint}',
    diagModel: 'Model: {model}',
    diagStatus: 'Status code: {status}',
    diagRequestMethod: 'Request method: {method}',
    diagViaProxy: 'via local proxy /cors-proxy',
    diagDirect: 'direct browser connection',
    diagResponseText: 'Response body: {text}',
    diagCause: 'Underlying error: {cause}',
    diagUnknownError: 'unknown error'
  },

  // Article preview / export
  article: {
    byline: 'by {author}',
    exportPrefix: 'article_'
  },

  // Default template content
  defaultTemplate: `# Welcome to GreenPlay Editor

GreenPlay Editor is a modern Markdown editor designed specifically for **WeChat formatting** and **image platform publishing**.

GreenPlay Editor is independently maintained; its early version was based on the open-source [uni-editor](https://github.com/flzyup/uni-editor).

## Core Features

### Powerful Editing
- **WYSIWYG** + Markdown source mode with one-click switching
- Support for various text styles and formats
- Real-time preview, write and see instantly

### Diverse Theme System
- **Editor Themes**: Dark/Light modes
- **Card Themes**: 9 beautiful themes to choose from
- Real-time switching with immediate effect

### AI Smart Formatting
- One-click AI formatting to improve structure and styling
- Multiple formatting styles available
- Add your own API configuration to enable the feature

### Smart Pagination Export
1. **Article Mode**: One-click copy to WeChat format
2. **Card Mode**: Auto-paginate to 4:3 ratio cards
3. **HD Export**: PNG format, perfect for all platforms

## Technical Features

> GreenPlay Editor is built on modern web technologies, providing a smooth editing experience

- [x] **Local Storage**: Content auto-cached to prevent accidental loss
- [x] **Multi-language**: Chinese/English interface switching
- [x] **Responsive Design**: Adapts to various screen sizes
- [ ] Image upload optimization (In Development)
- [ ] PDF export feature (Planned)

## Useful Links

- **Open Source**: [GitHub Repository](https://github.com/Wadang-AI/GreenPlayerEditor)
- **Original Project**: [uni-editor](https://github.com/flzyup/uni-editor)

## Usage Tips

\`\`\`markdown
# Heading 1
## Heading 2
### Heading 3

**Bold text** and *italic text*

> This is a blockquote
> Can contain multiple lines

- Unordered list item 1
- Unordered list item 2
  - Nested list item

1. Ordered list item 1
2. Ordered list item 2

[Link text](https://example.com)

\`Inline code\`
\`\`\`

---

Now begin your creative journey! Delete these sample contents and write your amazing articles.`
}
