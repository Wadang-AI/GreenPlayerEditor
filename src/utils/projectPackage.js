const encoder = new TextEncoder()

function crc32(bytes) {
  let crc = 0xffffffff
  for (const byte of bytes) {
    crc ^= byte
    for (let bit = 0; bit < 8; bit += 1) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
  }
  return (crc ^ 0xffffffff) >>> 0
}

function writeU16(view, offset, value) { view.setUint16(offset, value, true) }
function writeU32(view, offset, value) { view.setUint32(offset, value >>> 0, true) }

function concatBytes(chunks) {
  const output = new Uint8Array(chunks.reduce((sum, chunk) => sum + chunk.length, 0))
  let offset = 0
  chunks.forEach((chunk) => { output.set(chunk, offset); offset += chunk.length })
  return output
}

// ZIP Store：图片本身已经压缩，不再引入额外运行时依赖做二次压缩。
export function createZipBlob(files) {
  const localChunks = []
  const centralChunks = []
  let offset = 0

  for (const file of files) {
    const nameBytes = encoder.encode(file.name)
    const data = file.data instanceof Uint8Array ? file.data : encoder.encode(String(file.data || ''))
    const checksum = crc32(data)

    const local = new Uint8Array(30 + nameBytes.length)
    const localView = new DataView(local.buffer)
    writeU32(localView, 0, 0x04034b50)
    writeU16(localView, 4, 20)
    writeU16(localView, 6, 0x0800)
    writeU32(localView, 14, checksum)
    writeU32(localView, 18, data.length)
    writeU32(localView, 22, data.length)
    writeU16(localView, 26, nameBytes.length)
    local.set(nameBytes, 30)
    localChunks.push(local, data)

    const central = new Uint8Array(46 + nameBytes.length)
    const centralView = new DataView(central.buffer)
    writeU32(centralView, 0, 0x02014b50)
    writeU16(centralView, 4, 20)
    writeU16(centralView, 6, 20)
    writeU16(centralView, 8, 0x0800)
    writeU32(centralView, 16, checksum)
    writeU32(centralView, 20, data.length)
    writeU32(centralView, 24, data.length)
    writeU16(centralView, 28, nameBytes.length)
    writeU32(centralView, 42, offset)
    central.set(nameBytes, 46)
    centralChunks.push(central)
    offset += local.length + data.length
  }

  const centralDirectory = concatBytes(centralChunks)
  const end = new Uint8Array(22)
  const endView = new DataView(end.buffer)
  writeU32(endView, 0, 0x06054b50)
  writeU16(endView, 8, files.length)
  writeU16(endView, 10, files.length)
  writeU32(endView, 12, centralDirectory.length)
  writeU32(endView, 16, offset)
  return new Blob([concatBytes([...localChunks, centralDirectory, end])], { type: 'application/zip' })
}

export function projectAssetFromDataUrl(path, dataUrl) {
  const match = /^data:[^;,]+;base64,([\s\S]+)$/.exec(String(dataUrl || ''))
  if (!match) return null
  const binary = atob(match[1])
  const bytes = new Uint8Array(binary.length)
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index)
  return { name: path, data: bytes }
}

export function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
