import { Helmet } from "react-helmet-async"

const SITE_NAME = "Applac"
const SITE_URL = import.meta.env.VITE_SITE_URL || "https://applac.com"
const DEFAULT_OG_IMAGE = "/og-image.png"
const TWITTER_HANDLE = "@applac"

export default function SEO({
  title,
  description,
  canonical,
  ogImage,
  ogType = "website",
  noIndex = false,
  jsonLd,
}) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME
  const canonicalUrl = canonical ? `${SITE_URL}${canonical}` : SITE_URL

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description || ""} />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:title" content={title || SITE_NAME} />
      <meta property="og:description" content={description || ""} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:image" content={ogImage || `${SITE_URL}${DEFAULT_OG_IMAGE}`} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title || SITE_NAME} />
      <meta name="twitter:description" content={description || ""} />
      <meta name="twitter:image" content={ogImage || `${SITE_URL}${DEFAULT_OG_IMAGE}`} />
      <meta name="twitter:site" content={TWITTER_HANDLE} />

      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  )
}
