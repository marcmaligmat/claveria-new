import Image from 'next/image'
import { mediaAlt, mediaSize, mediaUrl, type MediaRef, type MediaSize } from '@/lib/media'

type Props = {
  media: MediaRef
  size?: MediaSize
  className?: string
  sizes?: string
  priority?: boolean
  fill?: boolean
}

export function MediaImage({ media, size, className = '', sizes = '100vw', priority = false, fill = false }: Props) {
  const src = mediaUrl(media, size)
  if (!src) return <div className={`bg-mist ${className}`} aria-hidden="true" />
  const dims = mediaSize(media, size)
  if (fill || !dims) {
    return <Image src={src} alt={mediaAlt(media)} fill sizes={sizes} priority={priority} className={`object-cover ${className}`} />
  }
  return (
    <Image src={src} alt={mediaAlt(media)} width={dims.width} height={dims.height} sizes={sizes} priority={priority} className={className} />
  )
}
