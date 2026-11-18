/**
 * A theme photo served as AVIF with a WebP fallback.
 * Files live in `public/images/home/<name>.avif` and `<name>.webp`.
 */
export function Photo({
  name,
  alt,
  width,
  height,
  className,
  priority = false,
}: {
  name: string
  alt: string
  width: number
  height: number
  className?: string
  priority?: boolean
}) {
  return (
    <picture>
      <source srcSet={`/images/home/${name}.avif`} type="image/avif" />
      <img
        src={`/images/home/${name}.webp`}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className={className ?? 'h-full w-full object-cover'}
      />
    </picture>
  )
}
