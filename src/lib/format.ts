export function formatSlug(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

type Node = { type?: string; text?: string; children?: Node[] }

function collectText(node: Node, out: string[]): void {
  if (typeof node.text === 'string') out.push(node.text)
  if (Array.isArray(node.children)) {
    for (const child of node.children) collectText(child, out)
  }
}

export function plainText(richText: unknown): string {
  if (!richText || typeof richText !== 'object') return ''
  const root = (richText as { root?: Node }).root
  if (!root || !Array.isArray(root.children)) return ''
  const blocks: string[] = []
  for (const block of root.children) {
    const parts: string[] = []
    collectText(block, parts)
    const text = parts.join('').trim()
    if (text) blocks.push(text)
  }
  return blocks.join(' ')
}

export function excerpt(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean.length <= max) return clean
  const cut = clean.slice(0, max)
  const lastSpace = cut.lastIndexOf(' ')
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut) + '…'
}

export function formatDate(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    timeZone: 'Asia/Manila',
  }).format(d)
}
