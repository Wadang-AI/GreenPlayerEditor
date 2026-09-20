# Social Package 导入系统

## 概述

Social Package 是绿玩编辑器的社交媒体内容定稿导入系统。它允许将外部 AI 工作台生成或人工整理的内容，以结构化 JSON 格式导入编辑器，自动渲染为 4 张卡片（封面 + 3 张内容卡）。本项目基于开源项目 uni-editor 二次开发。

## 导入入口

编辑器侧栏顶部「导入定稿」按钮（`importApprovedSocialPackage`）触发文件选择，支持：
- **自包含包**：单选一个 JSON 文件（图片已 base64 编码到 JSON）
- **分离文件**：同时选择 JSON + character 图片 + comic 图片

## JSON 格式规范

```json
{
  "schemaVersion": 1,
  "status": "approved",
  "kind": "social-post",
  "identity": {
    "code": "可选标识符",
    "name": "品牌/作者名（必填）"
  },
  "post": {
    "title": "主标题（必填）",
    "subtitle": "副标题/导语（必填）",
    "judge": "一句话评价/核心观点（必填）",
    "introTitle": "引言区块标题",
    "intro": ["段落1", "段落2"],
    "responseTitle": "功能/回应区块标题",
    "response": ["段落1", "段落2"],
    "aiPrompt": "AI 相关说明（可选）",
    "caption": "结尾说明（可选）"
  },
  "assets": {
    "character": "character.png",
    "comic": "comic.png",
    "characterData": "data:image/...（可选，base64 编码）",
    "comicData": "data:image/...（可选，base64 编码）",
    "images": [
      {
        "name": "editor-shot.jpg",
        "alt": "编辑器界面",
        "data": "data:image/...（可选，base64 编码；也可复用 characterData/comicData）"
      }
    ]
  },
  "layout": {
    "theme": "classic",
    "stylePreset": "elegant",
    "spacingPreset": "standard",
    "coverLayout": "minimal",
    "cardLimit": 4
  }
}
```

## 必填字段

| 字段 | 位置 | 说明 |
|------|------|------|
| `status` | 顶层 | 必须为 `"approved"` |
| `identity.name` | identity | 品牌或作者名称 |
| `post.title` | post | 文章主标题 |
| `post.subtitle` | post | 副标题/导语 |
| `post.judge` | post | 核心评价或观点 |
| `assets.character` | assets | character 图片文件名 |
| `assets.comic` | assets | comic 图片文件名 |

## 两种图片提供方式

### 1. 自包含包（推荐）

将图片转为 base64 data URL 写入 `characterData` 和 `comicData` 字段：

```python
import base64
with open('lv-shot-editor.png', 'rb') as f:
    data = base64.b64encode(f.read()).decode()
data_url = f'data:image/png;base64,{data}'
```

**注意**：
- JSON 总大小必须 ≤ 1MB（服务端限制）
- 大图片需先压缩（建议 ≤ 200KB/张，使用 JPEG 压缩）

### 2. 分离文件

JSON 中只写文件名，导入时同时选择图片文件（`input.multiple = true`）。

## 图片大小限制

- 服务端最大 payload：1MB
- 推荐单张图片：≤ 200KB（JPEG 压缩到 1200px 宽以内）
- 两张图合计 base64 后：≤ 500KB（给 JSON 正文留空间）

## 导入流程

1. 用户点击「导入定稿」
2. 选择 JSON 文件（+ 可选图片文件）
3. `normalizeSocialPackage()` 验证 JSON 结构
4. 检查图片：优先使用 `embeddedFiles`（自包含），否则从 `imageFiles`（多选）查找
5. 缺失图片时报错：`Missing images: lv-shot-editor.png, lv-shot-cards.png`
6. 图片写入 IndexedDB，获取 blob URL
7. `buildSocialMarkdown()` 生成 Markdown（含分页符 `<div class="page-break-marker" data-page-break="true"></div>` 和可选的正文配图）
8. 创建新文档并打开，触发卡片预览

## 卡片生成规则

- 封面由 `CardsPreview` 根据 `coverLayout` 生成
- 内容卡固定生成 3 张（含 AI 小抄）
- 总卡数 = `cardLimit`，默认为 4

## 布局参数

| 字段 | 可选值 | 说明 |
|------|--------|------|
| `theme` | `classic`, `minimal`, `paper`, `ocean`, `forest`, `sunset`, `grape`, `slate`, `sand`, `parchment`, `rose`, `sage`, `lavender`, `warmNeutral` | 色彩主题 |
| `stylePreset` | `auto`, `classic`, `elegant`, `playful`, `minimalist`, `journal`, `report` | 排版风格 |
| `spacingPreset` | `compact`, `standard`, `loose` | 段落间距 |
| `coverLayout` | `minimal`, `center`, `image-top`, `image-bottom`, `magazine`, `bold`, `film` | 封面布局 |

## 错误排查

### Missing images

原因：JSON 中的 `assets.character`/`assets.comic` 文件名与提供的图片不匹配。

解决：
1. 确保图片文件名与 JSON 中的 `character`/`comic` 字段完全一致
2. 或使用自包含包（将 base64 写入 `characterData`/`comicData`）

### Payload too large (413)

原因：自包含包 JSON 超过 1MB。

解决：压缩图片后再转 base64（JPEG，质量 70-85，最大边 1200px）。

## AI 生成 Social Package 规范

当其他 AI 需要为用户生成 Social Package 时：

1. **内容转译**：将用户提供的文章/文案转译为 `post` 结构
   - `judge` = 文章核心观点/一句话总结
   - `intro` = 问题/痛点段落（1-3 段）
   - `response` = 解决方案/功能说明（2-4 段）

2. **图片处理**：
   - 如果有用户提供的截图/配图，压缩后转 base64 写入 `characterData`/`comicData`
   - 如果没有，可省略 `characterData`/`comicData`，导入时让用户手动选择图片文件

3. **布局选择**：根据内容调性选择
   - 技术/产品文 → `elegant` + `classic`/`slate`
   - 轻松/社交文 → `playful` + `sunset`/`grape`
   - 极简/商务文 → `minimalist` + `minimal`/`warmNeutral`

4. **大小检查**：生成后检查 JSON 大小，确保 ≤ 1MB

5. **文件命名**：
   - JSON 文件名：`social-package.json` 或 `{项目名}-package.json`
   - 与图片文件放同一目录，或做成自包含单文件

6. **交付说明**：
   - 告诉用户文件路径（完整绝对路径）
   - 说明导入方法：打开编辑器 → 侧栏「导入定稿」→ 选择 JSON（+ 图片）
