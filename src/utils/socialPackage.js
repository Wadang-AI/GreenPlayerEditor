const REQUIRED_STATUS = 'approved'
const MAX_CARDS = 4

function clean(value) {
  return String(value || '').trim()
}

function cleanParagraphs(value) {
  const items = Array.isArray(value) ? value : [value]
  return items.map(clean).filter(Boolean)
}

function cleanImages(value) {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => {
      if (typeof item === 'string') {
        return { name: clean(item), alt: '', data: '' }
      }
      return {
        name: clean(item?.name),
        alt: clean(item?.alt),
        data: clean(item?.data)
      }
    })
    .filter((item) => item.name)
}

export function normalizeSocialPackage(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('The package is not a valid JSON object')
  }

  if (input.status !== REQUIRED_STATUS) {
    throw new Error('This content is not marked as approved and cannot be formatted')
  }

  const identity = input.identity || {}
  const post = input.post || {}
  const assets = input.assets || {}

  const normalized = {
    schemaVersion: Number(input.schemaVersion || 1),
    status: REQUIRED_STATUS,
    kind: clean(input.kind || 'social-post'),
    identity: {
      code: clean(identity.code),
      name: clean(identity.name)
    },
    post: {
      title: clean(post.title),
      subtitle: clean(post.subtitle),
      judge: clean(post.judge),
      introTitle: clean(post.introTitle),
      intro: cleanParagraphs(post.intro),
      responseTitle: clean(post.responseTitle),
      response: cleanParagraphs(post.response),
      aiPrompt: clean(post.aiPrompt),
      caption: clean(post.caption)
    },
    assets: {
      character: clean(assets.character),
      comic: clean(assets.comic),
      characterData: clean(assets.characterData),
      comicData: clean(assets.comicData),
      images: cleanImages(assets.images)
    },
    layout: {
      theme: clean(input.layout?.theme || 'warmNeutral'),
      stylePreset: clean(input.layout?.stylePreset || 'playful'),
      spacingPreset: clean(input.layout?.spacingPreset || 'loose'),
      coverLayout: clean(input.layout?.coverLayout || 'image-top'),
      cardLimit: Math.min(MAX_CARDS, Number(input.layout?.cardLimit || MAX_CARDS))
    }
  }

  if (!normalized.identity.name) throw new Error('Package is missing the identity name')
  if (!normalized.post.title) throw new Error('Package is missing the post title')
  if (!normalized.post.subtitle) throw new Error('Package is missing the subtitle')
  if (!normalized.post.judge) throw new Error('Package is missing the verdict')
  if (!normalized.assets.character) throw new Error('Package is missing the character image filename')
  if (!normalized.assets.comic) throw new Error('Package is missing the comic image filename')

  return normalized
}

function imageTag(src, alt, className) {
  return `<img src="${src}" alt="${alt}" class="${className}" />`
}

export function buildSocialMarkdown(pkg, assetSources) {
  const characterSrc = assetSources.character
  const comicSrc = assetSources.comic
  if (!characterSrc || !comicSrc) {
    throw new Error('Character or comic image failed to be written to the image store')
  }

  const intro = pkg.post.intro.join('\n\n')
  const response = pkg.post.response.join('\n\n')
  const prompt = pkg.post.aiPrompt
  const inlineImages = (pkg.assets.images || [])
    .map((asset) => {
      const src = assetSources.images?.[asset.name]
      return src ? imageTag(src, asset.alt || asset.name, 'social-inline-image') : ''
    })
    .filter(Boolean)
  const comicAlt = (pkg.assets.images || [])
    .find((asset) => asset.name === pkg.assets.comic)?.alt || `${pkg.identity.name}配图`

  // 封面由 CardsPreview 独立生成，因此正文只构造 3 张内容卡；总数固定为 4 张。
  return [
    imageTag(comicSrc, comicAlt, 'social-comic-image'),
    '<!-- PAGE_BREAK -->',
    `## ${pkg.post.introTitle || `${pkg.identity.name}是怎么工作的`}`,
    `> ${pkg.post.judge}`,
    intro,
    inlineImages[0],
    '<!-- PAGE_BREAK -->',
    `## ${pkg.post.responseTitle || '和他合作，别再问进度'}`,
    response,
    inlineImages[1],
    '### AI 小抄',
    `> ${prompt}`
  ].filter(Boolean).join('\n\n')
}

export function createSocialDocumentTitle(pkg) {
  const code = pkg.identity.code ? `${pkg.identity.code} · ` : ''
  return `[待排版] ${code}${pkg.identity.name}`
}

export function getRequiredAssetNames(pkg) {
  return [...new Set([
    pkg.assets.character,
    pkg.assets.comic,
    ...(pkg.assets.images || []).map((asset) => asset.name)
  ])]
}

export function embeddedAssetFile(dataUrl, fileName) {
  const match = /^data:([^;,]+);base64,([A-Za-z0-9+/=\s]+)$/.exec(clean(dataUrl))
  if (!match) return null

  const bytes = atob(match[2].replace(/\s/g, ''))
  const buffer = new Uint8Array(bytes.length)
  for (let index = 0; index < bytes.length; index += 1) {
    buffer[index] = bytes.charCodeAt(index)
  }
  return new File([buffer], fileName, { type: match[1] })
}
