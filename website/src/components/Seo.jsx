import { Helmet } from 'react-helmet-async'
import { company } from '../data/siteContent'

export function Seo({ title, description, path = '/' }) {
  const fullTitle = `${title} | ${company.name}`
  const canonical = `${company.websiteUrl}${path === '/' ? '' : path}`

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
    </Helmet>
  )
}
