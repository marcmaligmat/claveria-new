import { describe, expect, it } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'
import { RichText } from '@/components/rich-text'

const media = {
  id: 9,
  alt: 'Falls',
  url: '/api/media/file/falls.jpg',
  filename: 'falls.jpg',
  mimeType: 'image/jpeg',
  width: 2000,
  height: 1500,
  sizes: { thumbnail: { url: '/api/media/file/falls-400x300.jpg', width: 400, height: 300 } },
  updatedAt: '',
  createdAt: '',
}

const state = {
  root: {
    type: 'root',
    format: '',
    indent: 0,
    version: 1,
    direction: 'ltr',
    children: [
      {
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        direction: 'ltr',
        textFormat: 0,
        children: [
          {
            type: 'link',
            version: 3,
            format: '',
            indent: 0,
            direction: 'ltr',
            fields: { linkType: 'internal', newTab: false, doc: { relationTo: 'news', value: { id: 1, slug: 'hello' } } },
            children: [{ type: 'text', text: 'read', format: 0, mode: 'normal', style: '', detail: 0, version: 1 }],
          },
        ],
      },
      { type: 'upload', version: 3, format: '', id: 'u1', fields: null, relationTo: 'media', value: media },
      {
        type: 'upload',
        version: 3,
        format: '',
        id: 'u2',
        fields: null,
        relationTo: 'media',
        value: { ...media, id: 10, url: '/api/media/file/budget.pdf', filename: 'budget.pdf', mimeType: 'application/pdf', width: null, height: null, sizes: {} },
      },
    ],
  },
} as unknown as DefaultTypedEditorState

describe('RichText converters', () => {
  const html = renderToStaticMarkup(RichText({ data: state }))

  it('resolves internal links to public routes', () => {
    expect(html).toContain('href="/news/hello"')
  })

  it('renders uploaded images from the original file, never a cropped size', () => {
    expect(html).toContain('falls.jpg')
    expect(html).not.toContain('falls-400x300.jpg')
    expect(html).not.toContain('<picture')
  })

  it('renders non-image uploads as a file link', () => {
    expect(html).toContain('href="/api/media/file/budget.pdf"')
    expect(html).toContain('budget.pdf</a>')
  })
})
