type ImageVariants = {
  avif?: Record<string, string>;
  webp?: Record<string, string>;
  jpeg?: Record<string, string>;
};

interface PictureProps {
  baseUrl: string;
  variants?: ImageVariants;
  alt: string;
  width?: number;
  height?: number;
  priority?: boolean;
  className?: string;
  sizes?: string;
}

function buildSrcSet(map: Record<string, string> | undefined): string {
  if (!map) return '';
  return Object.entries(map)
    .map(([w, url]) => `${url} ${w}w`)
    .join(', ');
}

export function Picture({
  baseUrl,
  variants,
  alt,
  width,
  height,
  priority = false,
  className,
  sizes = '100vw',
}: PictureProps) {
  const avifSrcset = buildSrcSet(variants?.avif);
  const webpSrcset = buildSrcSet(variants?.webp);
  const jpegSrcset = buildSrcSet(variants?.jpeg);

  return (
    <picture>
      {avifSrcset && (
        <source type="image/avif" srcSet={avifSrcset} sizes={sizes} />
      )}
      {webpSrcset && (
        <source type="image/webp" srcSet={webpSrcset} sizes={sizes} />
      )}
      <img
        src={baseUrl}
        srcSet={jpegSrcset || undefined}
        sizes={jpegSrcset ? sizes : undefined}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchPriority={priority ? 'high' : undefined}
        className={className}
      />
    </picture>
  );
}
