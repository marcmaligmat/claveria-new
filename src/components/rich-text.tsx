import {
  LinkJSXConverter,
  RichText as LexicalRichText,
  type JSXConverter,
  type JSXConvertersFunction,
} from '@payloadcms/richtext-lexical/react'
import type { DefaultNodeTypes, DefaultTypedEditorState, SerializedUploadNode } from '@payloadcms/richtext-lexical'
import { mediaSize, mediaUrl } from '@/lib/media'
import { internalDocToHref } from '@/lib/rich-text-links'
import type { Media } from '@/payload-types'
import { MediaImage } from './media-image'

type Props = { data: DefaultTypedEditorState | null | undefined; className?: string }

// Renders the original upload (never a centre-cropped size); non-images become a file link.
const uploadConverter: JSXConverter<SerializedUploadNode> = ({ node }) => {
  if (node.relationTo !== 'media' || !node.value || typeof node.value !== 'object') return null
  const doc = node.value as Media
  const url = mediaUrl(doc)
  if (!url) return null
  const isImage = doc.mimeType?.startsWith('image/') ?? false
  if (!isImage || !mediaSize(doc)) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer">
        {doc.filename ?? doc.alt ?? 'Download file'}
      </a>
    )
  }
  return <MediaImage media={doc} className="h-auto w-full" sizes="(min-width: 768px) 768px, 100vw" />
}

const converters: JSXConvertersFunction<DefaultNodeTypes> = ({ defaultConverters }) => ({
  ...defaultConverters,
  ...LinkJSXConverter({ internalDocToHref: ({ linkNode }) => internalDocToHref(linkNode.fields.doc) }),
  upload: uploadConverter,
})

export function RichText({ data, className = '' }: Props) {
  if (!data) return null
  return <LexicalRichText data={data} converters={converters} className={`rich-text ${className}`} />
}
