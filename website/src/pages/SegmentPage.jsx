import { Button } from '../components/Button'
import { ClosingCta } from '../components/ClosingCta'
import { SectionIntro } from '../components/SectionIntro'
import { Seo } from '../components/Seo'
import { company, segments } from '../data/siteContent'

// Flagship, data-driven marketing page for a Desir Solutions service segment.
// Same depth as the AI Continuity page: proof, process, offer, why, FAQ, JSON-LD.
export function SegmentPage({ slug }) {
  const s = segments[slug]
  if (!s) return null

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: s.eyebrow,
      serviceType: s.eyebrow,
      provider: { '@type': 'Organization', name: company.name, url: company.websiteUrl },
      areaServed: 'US',
      description: s.summary,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: s.faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ]

  return (
    <>
      <Seo title={s.eyebrow} description={s.summary} path={`/${slug}`} jsonLd={jsonLd} />

      <main id="main-content" className="shell py-14 lg:py-20">
        {/* Hero */}
        <section className="space-y-6">
          <span className="eyebrow">{s.eyebrow}</span>
          <h1 className="max-w-3xl font-display text-5xl font-semibold tracking-tight text-brand-950 sm:text-6xl">
            {s.headline}
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-slate-600">{s.summary}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button to={s.cta?.to ?? '/assessment'}>{s.cta?.label ?? 'Start with an assessment'}</Button>
            <Button to="/contact" variant="secondary">
              Talk to our team
            </Button>
          </div>
        </section>

        {/* Proof / market reality (sourced) */}
        <section className="py-14">
          <SectionIntro
            eyebrow="Why now"
            title="The market reality behind this offering."
            copy="Sourced market context - no invented figures."
          />
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {s.proof.map((item) => (
              <article key={item.label} className="panel interactive-card p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
                  {item.label}
                </p>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="py-6">
          <SectionIntro eyebrow="How it works" title="A clear delivery path." copy="" />
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {s.architecture.map((step) => (
              <article key={step.tier} className="panel p-6">
                <h3 className="font-display text-xl font-semibold text-brand-950">{step.tier}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{step.detail}</p>
              </article>
            ))}
          </div>
        </section>

        {/* The offer */}
        <section className="grid gap-8 py-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="panel-dark p-8 lg:p-10">
            <span className="eyebrow eyebrow-dark">Start here</span>
            <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight">{s.offer.name}</h2>
            {s.offer.scoping ? (
              <>
                <div className="mt-6 rounded-[24px] border border-white/10 bg-white/10 p-5">
                  <p className="text-sm text-white/60">Scoped after proof</p>
                  <p className="mt-2 text-base leading-7 text-white/85">{s.offer.scoping}</p>
                </div>
                {s.offer.goal ? (
                  <p className="mt-4 text-sm leading-7 text-white/70">{s.offer.goal}</p>
                ) : null}
              </>
            ) : (
              <>
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[24px] border border-white/10 bg-white/10 p-5">
                    <p className="text-sm text-white/60">Engagement</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{s.offer.price}</p>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-white/10 p-5">
                    <p className="text-sm text-white/60">Timeline</p>
                    <p className="mt-2 text-2xl font-semibold text-white">{s.offer.timeline}</p>
                  </div>
                </div>
                <p className="mt-4 text-xs text-white/55">{s.offer.priceNote}</p>
              </>
            )}
          </div>
          <div className="panel p-8 lg:p-10">
            <h2 className="font-display text-3xl font-semibold text-brand-950">What you receive</h2>
            <ul className="prose-list mt-5">
              {s.offer.deliverables.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* Why */}
        <section className="panel p-8 lg:p-10">
          <div className="max-w-4xl space-y-4">
            <span className="eyebrow">Why DesirSolutions</span>
            <p className="text-base leading-7 text-slate-700">{s.why}</p>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-14">
          <SectionIntro eyebrow="FAQ" title="Common questions." copy="" />
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {s.faqs.map((f) => (
              <article key={f.q} className="panel p-6">
                <h3 className="font-display text-lg font-semibold text-brand-950">{f.q}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{f.a}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Honest scope */}
        <section className="panel p-6">
          <p className="text-xs leading-6 text-slate-500">{s.scopeNote}</p>
        </section>

        <ClosingCta eyebrow={s.eyebrow} />
      </main>
    </>
  )
}
