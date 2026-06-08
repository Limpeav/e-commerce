import { Helmet } from "react-helmet-async"

const SITE_NAME = "Cherish Baby Store"
const SITE_URL = import.meta.env.VITE_SITE_URL || "https://cherishbabykhstore.store"
const DEFAULT_OG_IMAGE = "/logo.png"
const TWITTER_HANDLE = "@cherishbabystore"

export default function SEO({
  title,
  description,
  canonical,
  ogImage,
  ogType = "website",
  noIndex = false,
  jsonLd,
}) {
  const isHomeTitle = String(title || "").trim().toLowerCase() === "home"
  const fullTitle = title && !isHomeTitle ? `${SITE_NAME}: ${title}` : SITE_NAME
  const socialTitle = isHomeTitle ? SITE_NAME : title || SITE_NAME
  const canonicalUrl = canonical ? `${SITE_URL}${canonical}` : SITE_URL

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description || ""} />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:title" content={socialTitle} />
      <meta property="og:description" content={description || ""} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:image" content={ogImage || `${SITE_URL}${DEFAULT_OG_IMAGE}`} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={socialTitle} />
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
