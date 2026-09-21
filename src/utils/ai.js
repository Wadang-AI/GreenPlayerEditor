const REQUEST_TIMEOUT_MS = 45000
const STREAM_IDLE_TIMEOUT_MS = 60000

// 两阶段排版流程 · 阶段一：AI 只做排版决策，输出结构化方案（不改写任何文字）
// 阶段二的机械执行在 applyLayoutPlan —— 配额、分段豁免、对偶保护由代码硬保证
export async function planLayoutWithAI(text, config, options = {}) {
  const source = normalizeInputText(text)
  if (!source) {
    throw new Error('Content is empty, nothing to format')
  }

  const normalizedConfig = normalizeAIConfig(config)
  if (!normalizedConfig.apiKey) {
    throw new Error('API Key is not configured')
  }

  const { apiKey, model, endpointCandidates, stylePreset } = normalizedConfig
  const onDelta = typeof options.onDelta === 'function' ? options.onDelta : null
  const planPrompt = createPlanPrompt(stylePreset)
  let lastError = null

  for (let attempt = 0; attempt < 3; attempt++) {
    for (const endpoint of endpointCandidates) {
      try {
        const requestPayload = {
          model,
          // 方案输出远短于全文，但仍按输入规模给足余量
          max_tokens: Math.max(1024, Math.min(8000, Math.ceil(source.length / 2))),
          messages: [
            { role: 'system', content: attempt === 0 ? planPrompt : `${planPrompt}\n【再次强调】只输出一个 JSON 对象，所有摘录必须与原文逐字一致，禁止改写。` },
            { role: 'user', content: source }
          ],
          temperature: 0.2
        }

        let cleaned
        if (onDelta) {
          try {
            const streamed = await requestCompletionStream({ endpoint, apiKey, requestPayload, onDelta })
            cleaned = streamed
          } catch (streamError) {
            console.debug('Stream request failed, falling back to non-stream:', streamError?.message)
            cleaned = await requestCompletion({ endpoint, apiKey, requestPayload }).then(cleanResponseText)
          }
        } else {
          cleaned = await requestCompletion({ endpoint, apiKey, requestPayload }).then(cleanResponseText)
        }

        const parsed = parseLayoutPlan(cleaned)
        if (parsed) {
          return parsed
        }
        lastError = new Error('Unable to parse the AI formatting plan as JSON')
      } catch (error) {
        lastError = enrichDiagnosticError(error, {
          endpoint,
          model,
          requestType: 'plan'
        })
      }
    }
  }

  if (lastError) {
    throw lastError
  }
  throw new Error('Failed to generate the AI formatting plan, please retry')
}

export async function testAIConnection(config) {
  const normalizedConfig = normalizeAIConfig(config)
  if (!normalizedConfig.apiKey) {
    throw new Error('API Key is not configured')
  }

  const { apiKey, model, endpointCandidates } = normalizedConfig
  let lastError = null

  for (const endpoint of endpointCandidates) {
    try {
      const requestPayload = {
        model,
        messages: [
          { role: 'system', content: '你是一个 API 连通性检测助手。请仅返回字符串 OK。' },
          { role: 'user', content: '请返回 OK' }
        ],
        temperature: 0
      }

      const response = await requestCompletion({
        endpoint,
        apiKey,
        requestPayload
      })

      const content = cleanResponseText(response)
      return {
        ok: true,
        endpoint,
        model,
        preview: content.slice(0, 120)
      }
    } catch (error) {
      lastError = enrichDiagnosticError(error, {
        endpoint,
        model,
        requestType: 'test'
      })
    }
  }

  throw lastError || new Error('AI connection test failed')
}

function normalizeInputText(text) {
  return String(text || '').replace(/\r\n/g, '\n').trim()
}

function normalizeAIConfig(config = {}) {
  const apiKey = String(config.apiKey || '').trim()
  const model = String(config.model || 'gpt-4o-mini').trim()
  const rawBaseURL = String(config.baseURL || 'https://api.openai.com/v1').trim()
  const endpointCandidates = buildEndpointCandidates(rawBaseURL)
  const stylePreset = String(config.stylePreset || 'auto').trim()

  return {
    apiKey,
    model,
    endpointCandidates,
    stylePreset
  }
}

function buildEndpointCandidates(baseURL) {
  const cleaned = baseURL.replace(/\/$/, '')
  const candidates = []

  if (/\/(chat\/completions|responses)$/.test(cleaned)) {
    candidates.push(cleaned)
  } else {
    candidates.push(`${cleaned}/chat/completions`)
    candidates.push(cleaned)
  }

  return Array.from(new Set(candidates))
}

// 风格倾向 → 方案配额（配额由代码硬校验，不依赖 AI 自觉）
export function resolveStyleLimits(stylePreset = 'auto') {
  const limits = {
    auto:       { maxQuotes: 6, maxBolds: 10 },
    academic:   { maxQuotes: 2, maxBolds: 8  },
    lively:     { maxQuotes: 8, maxBolds: 14 },
    concise:    { maxQuotes: 3, maxBolds: 6  },
    xiaohongshu: { maxQuotes: 8, maxBolds: 14 }
  }
  return limits[stylePreset] || limits.auto
}

function createPlanPrompt(stylePreset = 'auto') {
  const limits = resolveStyleLimits(stylePreset)
  const styleNotes = {
    academic: '本篇走学术严谨调性：引用块克制，加粗只标核心结论。',
    lively: '本篇走轻松活泼调性：引用块可以多一些，加粗可以密一些。',
    concise: '本篇走极简调性：引用块极少，加粗只标必要处。',
    xiaohongshu: '本篇走小红书调性：引用块可以密，加粗突出数字和痛点。',
    auto: ''
  }[stylePreset] || ''

  return '你是排版编辑。任务：为文章制定排版方案。你只做决策，绝对不改动、不复述、不改写任何原文文字。\n\n' +
    '只输出一个 JSON 对象，禁止输出任何解释、前后缀、代码块标记。格式：\n' +
    '{"title": "全文主标题，20字内；若原文首行已是标题则为 null", "headings": [{"text": "原文中已存在的行，逐字摘录", "level": 2}], "quotes": ["要放进引用块的段落，从原文逐字摘录"], "bolds": ["要加粗的短语或句子，从原文逐字摘录"]}\n\n' +
    '【headings 规则】\n' +
    '1. 只给结构性分区命名做标题：级别词（第一级：接单者）、章节词、主题词——像目录里一行的才配做标题。\n' +
    '2. 叙述句、对话句（含"说："）、金句、转折句一律不做标题——金句的位置是 quotes。\n' +
    '3. 层级统一：同族分级行（第一级/第二级…）必须全部入选，一个不漏，全部 level 2。\n\n' +
    '【quotes 规则（上限 ' + limits.maxQuotes + ' 个，硬配额）】\n' +
    '1. 只选"定律级"单句洞察——删掉后文章明显变弱的句子才配进 quotes。\n' +
    '2. 对偶句、排比句、对话句绝不进 quotes（它们的力量在正文节奏里）。\n' +
    '3. 每个章节最多 1 个。全文宁缺毋滥，取舍即编辑。\n' +
    (styleNotes ? '4. ' + styleNotes + '\n\n' : '\n') +
    '【bolds 规则（上限 ' + limits.maxBolds + ' 个）】\n' +
    '选：关键数据短语、转折后的分句、行动指令、需要读者留意的核心短语。不选：连接词、日常叙述、已入选 quotes 的句子。\n\n' +
    '【硬性约束】\n' +
    '1. 所有摘录必须与原文逐字一致（含标点），这是校验红线。\n' +
    '2. 不输出 JSON 以外的任何内容。\n' +
    '3. 作者的段落划分神圣不可侵犯——你的方案里没有任何改动段落的权力。'
}

// ===== 两阶段排版 · 阶段二：方案的解析、校验与机械执行 =====
// 设计原则：AI 只产出「决策」，所有对正文的修改都由这里的确定性代码完成。
// 配额（引用块/加粗上限）、分段豁免权（绝不增删移动段落）、对偶保护全部在此硬保证。

// 从 AI 回复中提取排版方案 JSON（容忍代码块包裹与前后杂文字）
function parseLayoutPlan(responseText) {
  if (!responseText) return null
  let raw = String(responseText).trim()
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (fenced) raw = fenced[1].trim()
  const braceStart = raw.indexOf('{')
  const braceEnd = raw.lastIndexOf('}')
  if (braceStart === -1 || braceEnd <= braceStart) return null
  try {
    const obj = JSON.parse(raw.slice(braceStart, braceEnd + 1))
    if (!obj || typeof obj !== 'object') return null
    return {
      title: typeof obj.title === 'string' ? obj.title.trim() : null,
      headings: Array.isArray(obj.headings) ? obj.headings : [],
      quotes: Array.isArray(obj.quotes) ? obj.quotes : [],
      bolds: Array.isArray(obj.bolds) ? obj.bolds : []
    }
  } catch {
    return null
  }
}

const normKey = (s) => String(s || '').replace(/\s+/g, '')

// 校验并清洗方案：摘录必须逐字存在于原文；超配额截断；无效条目丢弃
// 返回 { ok, plan, issues } —— ok=false 表示方案完全不可用，需要重试或兜底
export function validateLayoutPlan(plan, originalText, limits = {}) {
  const maxQuotes = limits.maxQuotes ?? 6
  const maxBolds = limits.maxBolds ?? 10
  const issues = []
  const cleaned = { title: null, headings: [], quotes: [], bolds: [] }
  if (!plan || typeof plan !== 'object') {
    return { ok: false, plan: cleaned, issues: ['Plan is not a valid object'] }
  }
  const text = String(originalText || '')
  const origLines = text.split('\n').map((l) => l.trim()).filter(Boolean)

  // title：长度红线
  if (plan.title && normKey(plan.title).length <= 40) {
    cleaned.title = String(plan.title).trim()
  }

  // headings：必须是原文中已存在的行（逐字）
  const seenHeadings = new Set()
  for (const h of (plan.headings || [])) {
    const t = String(h?.text ?? h ?? '').trim()
    if (!t) continue
    if (origLines.includes(t)) {
      if (!seenHeadings.has(t)) {
        seenHeadings.add(t)
        cleaned.headings.push({ text: t, level: 2 })
      }
    } else {
      issues.push(`Heading not found in original text, dropped: ${t.slice(0, 20)}`)
    }
  }

  // quotes：逐字存在 + 硬配额
  let qCount = 0
  for (const q of (plan.quotes || [])) {
    const t = String(q || '').trim()
    if (!t) continue
    if (qCount >= maxQuotes) { issues.push('Quote limit exceeded, truncated'); break }
    if (text.includes(t) || normKey(text).includes(normKey(t))) {
      cleaned.quotes.push(t)
      qCount++
    } else {
      issues.push('Quote excerpt not found in original text, dropped')
    }
  }

  // bolds：逐字存在 + 硬配额 + 排除已进引用块的整句
  let bCount = 0
  const quoteKeys = cleaned.quotes.map(normKey)
  for (const b of (plan.bolds || [])) {
    const t = String(b || '').trim()
    if (!t || t.length < 2) continue
    if (bCount >= maxBolds) { issues.push('Bold limit exceeded, truncated'); break }
    if (!text.includes(t)) { issues.push('Bold excerpt not found in original text, dropped'); continue }
    if (quoteKeys.some((k) => k.includes(normKey(t)))) continue // 引用块内不再加粗
    cleaned.bolds.push(t)
    bCount++
  }

  const ok = cleaned.headings.length + cleaned.quotes.length + cleaned.bolds.length > 0
  return { ok, plan: cleaned, issues }
}

// 机械执行方案：对正文只做「加标记」操作，绝不增删、移动或改写任何文字
export function applyLayoutPlan(text, plan) {
  let content = String(text || '').replace(/\r\n/g, '\n')
  if (!content.trim() || !plan) return content

  // 1) bolds：行内精确替换（首个匹配），跳过含 Markdown 语法字符的短语
  for (const b of (plan.bolds || [])) {
    const phrase = String(b || '').trim()
    if (!phrase || phrase.length < 2) continue
    if (/[*#>\n]/.test(phrase)) continue
    if (content.includes(`**${phrase}**`)) continue
    const esc = escapeRegExp(phrase)
    content = content.replace(new RegExp(esc), `**${phrase}**`)
  }

  const lines = content.split('\n')

  // 2) quotes：滑动窗口找包含摘录的最小行区间（兼容空行分段与单换行分段两种文稿），
  //    区间内的正文行加 '> '
  for (const q of (plan.quotes || [])) {
    const qKey = normKey(q)
    if (!qKey || qKey.length < 6) continue
    let best = null
    for (let start = 0; start < lines.length; start++) {
      if (!lines[start].trim()) continue
      let acc = ''
      for (let end = start; end < lines.length && end - start < 8; end++) {
        acc += normKey(lines[end])
        if (acc.includes(qKey)) {
          if (!best || (end - start) < (best.end - best.start)) {
            best = { start, end }
          }
          break
        }
        // 区间文字量已远超摘录，继续扩大只会误伤
        if (acc.length > qKey.length * 3 + 40) break
      }
    }
    if (!best) continue
    for (let i = best.start; i <= best.end; i++) {
      const trimmed = lines[i].trim()
      if (trimmed && !trimmed.startsWith('>') && !/^#{1,6}\s/.test(trimmed)) {
        lines[i] = '> ' + trimmed
      }
    }
  }

  // 3) headings：逐行精确匹配（trim 相等）→ 统一 '## '
  for (const h of (plan.headings || [])) {
    const t = String(h?.text || '').trim()
    if (!t) continue
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim()
      if (trimmed === t) {
        lines[i] = '## ' + t.replace(/^#{1,6}\s+/, '') // 已有标记则统一级别
        break
      }
    }
  }

  // 4) title：原文首个非空行已是标题则忽略，否则在最前插入 H1
  if (plan.title) {
    const firstNonEmpty = lines.find((l) => l.trim())
    if (firstNonEmpty && !/^#\s/.test(firstNonEmpty.trim())) {
      lines.unshift('# ' + plan.title.trim(), '')
    }
  }

  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}


// 流式请求：SSE 增量回调 onDelta(accumulated)；空闲超时（每收到数据重置计时）
async function requestCompletionStream({ endpoint, apiKey, requestPayload, onDelta }) {
  const useProxy = shouldUseProxy(endpoint)
  const payload = JSON.stringify({ targetUrl: endpoint, apiKey, ...requestPayload, stream: true })
  const directPayload = JSON.stringify(requestPayload)

  const controller = new AbortController()
  let idleTimer = setTimeout(() => controller.abort(), STREAM_IDLE_TIMEOUT_MS)
  const resetIdle = () => {
    clearTimeout(idleTimer)
    idleTimer = setTimeout(() => controller.abort(), STREAM_IDLE_TIMEOUT_MS)
  }
  let full = ''

  try {
    const response = await fetch(useProxy ? '/cors-proxy' : endpoint, {
      method: 'POST',
      headers: useProxy
        ? { 'Content-Type': 'application/json' }
        : { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: useProxy ? payload : directPayload,
      signal: controller.signal
    })

    if (!response.ok) {
      const errorPayload = await readResponsePayload(response)
      const message = extractErrorMessage(errorPayload) || `API request failed (${response.status})`
      throw createDiagnosticError(message, { endpoint, useProxy, status: response.status })
    }
    if (!response.body) {
      throw new Error('Streaming is not supported in this environment')
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      resetIdle()
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data:')) continue
        const data = trimmed.slice(5).trim()
        if (!data || data === '[DONE]') continue
        try {
          const json = JSON.parse(data)
          const delta = json.choices?.[0]?.delta?.content
            || json.choices?.[0]?.message?.content
            || ''
          if (delta) {
            full += delta
            onDelta(full)
          }
        } catch {
          // 单行解析失败不影响整体流
        }
      }
    }

    if (!full.trim()) {
      throw new Error('Streaming response content is empty')
    }
    return full
  } catch (error) {
    if (error?.name === 'AbortError') {
      // 已收到部分内容则直接采用（尊重已到手的排版结果）
      if (full.trim()) {
        return full
      }
      throw createDiagnosticError('AI streaming request timed out, please retry later', { endpoint, useProxy, cause: error })
    }
    if (error instanceof TypeError) {
      throw createDiagnosticError('AI streaming request failed, please check the endpoint, network or CORS settings', { endpoint, useProxy, cause: error })
    }
    throw error
  } finally {
    clearTimeout(idleTimer)
  }
}

async function requestCompletion({ endpoint, apiKey, requestPayload }) {
  const useProxy = shouldUseProxy(endpoint)

  try {
    if (useProxy) {
      return await fetchWithTimeout('/cors-proxy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUrl: endpoint, apiKey, ...requestPayload })
      }).then((response) => handleResponse(response, { endpoint, useProxy }))
    }

    return await fetchWithTimeout(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestPayload)
    }).then((response) => handleResponse(response, { endpoint, useProxy }))
  } catch (error) {
    if (useProxy && isLikelyMissingProxy(error)) {
      return await fetchWithTimeout(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestPayload)
      }).then((response) => handleResponse(response, { endpoint, useProxy: false }))
    }

    if (error?.name === 'AbortError') {
      throw createDiagnosticError('AI request timed out, please retry later', {
        endpoint,
        useProxy,
        cause: error
      })
    }

    if (error instanceof TypeError) {
      throw createDiagnosticError('AI request failed, please check the endpoint, network or CORS settings', {
        endpoint,
        useProxy,
        cause: error
      })
    }

    throw error
  }
}

function fetchWithTimeout(url, options) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)
  return fetch(url, {
    ...options,
    signal: controller.signal
  }).finally(() => {
    clearTimeout(timer)
  })
}

async function handleResponse(response, context = {}) {
  if (!response.ok) {
    const errorPayload = await readResponsePayload(response)
    const message = extractErrorMessage(errorPayload) || `API request failed (${response.status})`
    throw createDiagnosticError(message, {
      ...context,
      status: response.status,
      responsePayload: errorPayload
    })
  }

  return await readResponsePayload(response)
}

async function readResponsePayload(response) {
  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('application/json')) {
    return await response.json()
  }

  const text = await response.text()
  try {
    return JSON.parse(text)
  } catch {
    return { rawText: text }
  }
}

function extractErrorMessage(payload) {
  if (!payload) return ''
  if (typeof payload === 'string') return payload
  if (payload.error?.message) return payload.error.message
  if (payload.message) return payload.message
  if (payload.rawText) return payload.rawText
  return ''
}

function createDiagnosticError(message, details = {}) {
  const error = new Error(message)
  error.aiDetails = sanitizeAIDetails(details)
  return error
}

function enrichDiagnosticError(error, details = {}) {
  if (error?.aiDetails) {
    error.aiDetails = sanitizeAIDetails({
      ...error.aiDetails,
      ...details
    })
    return error
  }

  return createDiagnosticError(error?.message || 'AI request failed', {
    ...details,
    cause: error
  })
}

function sanitizeAIDetails(details = {}) {
  const responsePayload = details.responsePayload
  let responseText = ''

  if (typeof responsePayload === 'string') {
    responseText = responsePayload
  } else if (responsePayload?.rawText) {
    responseText = responsePayload.rawText
  } else if (responsePayload?.error?.message) {
    responseText = responsePayload.error.message
  } else if (responsePayload?.message) {
    responseText = responsePayload.message
  }

  return {
    endpoint: details.endpoint || '',
    model: details.model || '',
    requestType: details.requestType || '',
    useProxy: Boolean(details.useProxy),
    status: details.status || 0,
    responseText: String(responseText || '').slice(0, 500),
    causeMessage: details.cause?.message || ''
  }
}

function cleanResponseText(data) {
  const directText = typeof data?.choices?.[0]?.message?.content === 'string'
    ? data.choices[0].message.content
    : ''

  const arrayText = Array.isArray(data?.choices?.[0]?.message?.content)
    ? data.choices[0].message.content
      .map(item => typeof item?.text === 'string' ? item.text : '')
      .join('\n')
    : ''

  const altText = typeof data?.output_text === 'string'
    ? data.output_text
    : Array.isArray(data?.output)
      ? data.output
        .flatMap(item => Array.isArray(item?.content) ? item.content : [])
        .map(item => typeof item?.text === 'string' ? item.text : '')
        .join('\n')
      : ''

  const raw = directText || arrayText || altText || data?.rawText || ''
  if (!raw) throw new Error('Unexpected API response format')

  let cleaned = String(raw).trim()
  if (cleaned.startsWith('```markdown')) cleaned = cleaned.slice(11)
  else if (cleaned.startsWith('```md')) cleaned = cleaned.slice(5)
  else if (cleaned.startsWith('```')) cleaned = cleaned.slice(3)
  if (cleaned.endsWith('```')) cleaned = cleaned.slice(0, -3)
  return cleaned.trim()
}

const forceDirectAI = import.meta.env.VITE_DIRECT_AI === '1'

function shouldUseProxy(url) {
  if (forceDirectAI) return false
  try {
    const urlObj = new URL(url)
    return typeof window !== 'undefined' && urlObj.origin !== window.location.origin
  } catch {
    return false
  }
}

function isLikelyMissingProxy(error) {
  const message = String(error?.message || '')
  return message.includes('404') || message.includes('Failed to fetch')
}

function isTextInvariant(original, formatted) {
  // 校验目标：原文内容按序完整保留。允许的变化只有：
  //   a) Markdown 标记增强（加粗/列表/引用/分段）
  //   b) 标题装置：提炼新标题、把原文短句提升为标题（含去句末标点）
  // 双路判断，任一通过即可：
  //   路 A 块对齐——处理「标题插入打断文字流」：原文块按序出现，未匹配块必须是标题块；
  //   路 B 全文流——处理「拆段/合段/换行重排」：原文文字流是结果文字流的子串。
  // 两路都受标题新增预算约束，防止借标题/空隙夹带内容。
  const orig = String(original || '')
  const cand = String(formatted || '')

  const normLine = (line) => String(line || '')
    .normalize('NFKC')
    .replace(/^#{1,6}\s/, '')
    .replace(/[*_`]/g, '')
    .replace(/^>\s?/, '')
    .replace(/^\d+\.\s?/, '')
    .replace(/^[-*+]\s?/, '')
    .replace(/\s+/g, '')

  const toBlocks = (str) => String(str || '')
    .replace(/```[\s\S]*?```/g, '')
    .split(/\n{2,}/)
    .map((block) => {
      const raw = block.trim()
      const text = block.split('\n').map(normLine).join('')
      // 匹配 key：只保留文字/数字/字母。句读全部剥离——列表化/拆段必然吃掉行尾句读，
      // 标点位置的变化属于排版合法范围，由预览确认环节人工把关。
      const key = text.replace(/[^\p{Script=Han}\p{L}\p{N}]/gu, '')
      return { raw, text, key }
    })
    .filter((b) => b.key.length > 0)

  const headingBudget = Math.max(100, orig.length * 0.15)
  const origBlocks = toBlocks(orig)
  const candBlocks = toBlocks(cand)
  const origKeySet = new Set(origBlocks.map((b) => b.key))

  // 路 A：块级子序列对齐
  let matched = 0
  const matchedCand = new Set()
  for (let j = 0; j < candBlocks.length && matched < origBlocks.length; j++) {
    if (candBlocks[j].key === origBlocks[matched].key) {
      matchedCand.add(j)
      matched++
    }
  }
  if (matched === origBlocks.length) {
    let newHeadingChars = 0
    let pathAOk = true
    for (let j = 0; j < candBlocks.length; j++) {
      if (matchedCand.has(j)) continue
      if (!/^#{1,6}\s/.test(candBlocks[j].raw)) { pathAOk = false; break }
      newHeadingChars += candBlocks[j].key.length
    }
    if (pathAOk && newHeadingChars <= headingBudget) return true
  }

  // 路 B：全文流子串（拆段/合段/换行重排不影响文字流）
  const origFlow = origBlocks.map((b) => b.key).join('')
  const candFlow = candBlocks.map((b) => b.key).join('')
  if (origFlow && candFlow.includes(origFlow)) {
    // 新增标题文字预算：原文块之外的新块必须是标题（原文块可能因拆段 key 变化，按子串已覆盖）
    let extraChars = 0
    for (const b of candBlocks) {
      if (origKeySet.has(b.key)) continue
      if (!/^#{1,6}\s/.test(b.raw)) {
        // 拆段产生的正文子块：其文字已包含在原文流中，不计为新增
        const coveredByOriginal = origFlow.includes(b.key)
        if (!coveredByOriginal) return false
        continue
      }
      extraChars += b.key.length
    }
    if (candFlow.length - origFlow.length <= headingBudget && extraChars <= headingBudget) return true
  }

  return false
}

export function deterministicFormat(text) {
  const blocks = splitIntoBlocks(text)
  const output = []
  let headingCount = 0
  let quoteCount = 0
  const totalBlocks = blocks.filter(b => b.trim()).length
  const maxHeadings = Math.max(1, Math.floor(totalBlocks / 4))
  const maxQuotes = Math.max(1, Math.floor(totalBlocks / 5))

  blocks.forEach((block, index) => {
    if (!block.trim()) return

    if (isSpecialBlock(block)) {
      output.push(block.trimEnd())
      output.push('')
      return
    }

    const listItems = convertParallelSentencesToList(block)
    if (listItems.length >= 2) {
      if (headingCount < maxHeadings && shouldPromoteToHeading(block)) {
        output.push(`## ${extractHeadingText(block)}`)
        output.push('')
        headingCount++
      }
      listItems.forEach(item => output.push(`- ${addInlineEmphasis(item)}`))
      output.push('')
      return
    }

    const sentences = splitParagraphIntoSentences(block)
    if (headingCount < maxHeadings && shouldPromoteToHeading(block)) {
      output.push(`## ${extractHeadingText(block)}`)
      output.push('')
      headingCount++
    }

    if (quoteCount < maxQuotes && shouldUseQuote(block, sentences)) {
      output.push(`> ${addInlineEmphasis(block.trim())}`)
      output.push('')
      quoteCount++
      return
    }

    const paragraphSize = sentences.length >= 5 ? 2 : 1
    for (let i = 0; i < sentences.length; i += paragraphSize) {
      const segment = sentences.slice(i, i + paragraphSize).join('')
      const formattedSegment = formatSentenceSegment(segment, {
        allowHeading: headingCount < maxHeadings,
        allowQuote: quoteCount < maxQuotes
      })
      if (formattedSegment.type === 'heading') {
        output.push(`## ${formattedSegment.content}`)
        output.push('')
        headingCount++
        continue
      }
      if (formattedSegment.type === 'quote') {
        output.push(`> ${formattedSegment.content}`)
        output.push('')
        quoteCount++
        continue
      }
      output.push(formattedSegment.content)
      output.push('')
    }

    if (index === blocks.length - 1 && output[output.length - 1] !== '') {
      output.push('')
    }
  })

  return output.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

function formatSentenceSegment(segment, options = {}) {
  const trimmed = String(segment || '').trim()
  if (!trimmed) {
    return { type: 'paragraph', content: '' }
  }

  if (options.allowHeading && shouldPromoteSentenceToHeading(trimmed)) {
    return { type: 'heading', content: extractHeadingText(trimmed) }
  }

  if (options.allowQuote && shouldUseQuote(trimmed, [trimmed])) {
    return { type: 'quote', content: addInlineEmphasis(trimmed) }
  }

  return { type: 'paragraph', content: addInlineEmphasis(trimmed) }
}

function splitIntoBlocks(text) {
  return String(text || '')
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map(item => item.trim())
    .filter(Boolean)
}

function isSpecialBlock(block) {
  return /^(#{1,6}\s|>\s|[-*]\s|\d+\.\s|```|!\[|<img|<table|<div|<p|<blockquote)/m.test(block)
}

function splitParagraphIntoSentences(block) {
  const flat = block.replace(/\n+/g, '')
  const matched = flat.match(/[^。！？!?；;]+[。！？!?；;]?/g)
  return matched ? matched.map(item => item) : [flat]
}

function convertParallelSentencesToList(block) {
  const sentences = splitParagraphIntoSentences(block)
  // 覆盖「第一」「第一级」「第二步」「一是」「其一」等各类序号词开头
  const markers = /^(首先|其次|再次|最后|另外|此外|同时|其一|其二|其三|第[一二三四五六七八九十\d]+|一是|二是|三是|四是)/
  const filtered = sentences.filter(item => markers.test(item.trim()))
  return filtered.length >= 2 ? filtered.map(item => item.trim()) : []
}

function shouldPromoteToHeading(block) {
  const trimmed = block.trim()
  if (trimmed.includes('\n')) return false
  if (trimmed.length < 8 || trimmed.length > 28) return false
  if (/[。！？!?]$/.test(trimmed)) return false
  if (/^(首先|其次|最后|另外|一是|二是)/.test(trimmed)) return false
  return /[：:]$/.test(trimmed) || !/[，；;]/.test(trimmed)
}

function shouldPromoteSentenceToHeading(sentence) {
  if (sentence.length < 8 || sentence.length > 24) return false
  if (!/[：:]$/.test(sentence) && !/(误区|关键|核心|结论|方法|重点|问题|原因|前提|本质)/.test(sentence)) {
    return false
  }
  return !/[，。！？!?；;]/.test(sentence.slice(0, -1))
}

function extractHeadingText(block) {
  return block.trim().replace(/[：:]$/, '')
}

function shouldUseQuote(block, sentences) {
  const trimmed = block.trim()
  if (trimmed.length < 18 || trimmed.length > 80) return false
  if (sentences.length > 2) return false
  return /[：:]/.test(trimmed) || /(?:本质上|关键是|核心是|说到底|换句话说|结论是)/.test(trimmed)
}

function addInlineEmphasis(text) {
  let result = text
  const candidates = extractHighlightCandidates(text)

  candidates.slice(0, 2).forEach(candidate => {
    const escaped = escapeRegExp(candidate)
    result = result.replace(new RegExp(escaped), `**${candidate}**`)
  })

  return result
}

function escapeRegExp(text) {
  return String(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
