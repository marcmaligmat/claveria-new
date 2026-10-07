type LexicalNode = { type: string; version: number; [key: string]: unknown }

const text = (t: string) => ({ type: 'text', text: t, format: 0, mode: 'normal', style: '', detail: 0, version: 1 })

const block = (type: string, children: LexicalNode[], extra: Record<string, unknown> = {}) => ({
  type,
  format: '' as const,
  indent: 0,
  version: 1,
  direction: 'ltr' as const,
  children,
  ...extra,
})

const root = (children: LexicalNode[]) => ({
  root: { type: 'root', format: '' as const, indent: 0, version: 1, direction: 'ltr' as const, children },
})

export const lexical = {
  paragraphs(...texts: string[]) {
    return root(texts.map((t) => block('paragraph', [text(t)], { textFormat: 0, textStyle: '' })))
  },
  bullets(items: string[]) {
    return root([
      block(
        'list',
        items.map((item, i) => block('listitem', [text(item)], { value: i + 1 })),
        { listType: 'bullet', start: 1, tag: 'ul' },
      ),
    ])
  },
}

export type LexicalState = ReturnType<typeof lexical.paragraphs>
