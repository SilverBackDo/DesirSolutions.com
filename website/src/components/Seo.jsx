import { Helmet } from 'react-helmet-async'
import { company } from '../data/siteContent'

export function Seo({ title, description, path = '/', noindex = false }) {
  const fullTitle = `${title} | ${company.name}`
  const canonical = `${company.websiteUrl}${path === '/' ? '' : path}`

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {noindex ? <meta name="robots" content="noindex, nofollow" /> : null}
      <link rel="canonical" href={canonical} />
      <meta property="og:site_name" content={company.name} />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  )
}
