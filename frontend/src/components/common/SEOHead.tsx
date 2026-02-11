/**
 * SEO Head Component
 * Convenience component for adding additional SEO tags
 */

interface SEOHeadProps {
  title?: string;
  description?: string;
  canonical?: string;
  noIndex?: boolean;
  children?: React.ReactNode;
}

export function SEOHead({
  title,
  description,
  canonical,
  noIndex = false,
  children,
}: SEOHeadProps) {
  return (
    <>
      {title && <title>{title}</title>}
      {description && <meta name="description" content={description} />}
      {canonical && <link rel="canonical" href={canonical} />}
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
      {children}
    </>
  );
}
