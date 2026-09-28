import { Button } from '../components/Button'
import { ClosingCta } from '../components/ClosingCta'
import { NewsletterForm } from '../components/NewsletterForm'
import { SectionIntro } from '../components/SectionIntro'
import { Seo } from '../components/Seo'
import { aiContinuity, company } from '../data/siteContent'

export function AIContinuityPage() {
  const c = aiContinuity
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'AI Continuity & Failover Engineering',
      serviceType: 'AI continuity, multi-vendor LLM failover, on-prem fallback engineering',
      provider: { '@type': 'Organization', name: company.name, url: company.websiteUrl },
      areaServed: 'US',
      description: c.summary,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: c.faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: { '@type': 'Answer', text: f.a },
      })),
    },
  ]

  return (
    <>
      <Seo
        title="AI Continuity & Failover Engineering"
        description="Managed AI failover across vendors with compliant on-prem fallback. Keep AI-dependent workflows running through vendor and cloud outages. Start with the AI Resilience Assessment, scoped after proof."
        path="/ai-continuity"
        jsonLd={jsonLd}
      />

      <main id="main-content" className="shell py-14 lg:py-20">
        {/* Hero */}
        <section className="space-y-6">
          <span className="eyebrow">{c.eyebrow}</span>
          <h1 className="max-w-3xl font-display text-5xl font-semibold tracking-tight text-brand-950 sm:text-6xl">
            {c.headline}
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-slate-600">{c.summary}</p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button to="/contact">Request the AI Resilience Assessment</Button>
            <Button to="/contact" variant="secondary">
              Talk to our team
            </Button>
          </div>
        </section>

        {/* Proof — sourced 2025 outages */}
        <section className="py-14">
          <SectionIntro
            eyebrow="The risk is real (2025)"
            title="AI vendors — and the clouds beneath them — went down for hours."
            copy="Most enterprises run AI through a single vendor with no fallback. These are documented, sourced incidents."
          />
          <div className="mt-8 grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
            {c.outages.map((item) => (
              <article key={item.vendor} className="panel interactive-card p-6">
                <h3 className="font-display text-2xl font-semibold text-brand-950">{item.vendor}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        {/* How it works — three-layer architecture */}
        <section className="py-6">
          <SectionIntro
            eyebrow="How it works"
            title="A three-layer continuity architecture."
            copy="Traffic fails over cloud to cloud to on-prem. Regulated data is pinned to the on-prem tier and never egresses."
          />
          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {c.architecture.map((layer) => (
              <article key={layer.tier} className="panel p-6">
                <h3 className="font-display text-xl font-semibold text-brand-950">{layer.tier}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{layer.detail}</p>
              </article>
            ))}
          </div>
        </section>

        {/* The offer */}
        <section className="grid gap-8 py-14 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="panel-dark p-8 lg:p-10">
            <span className="eyebrow eyebrow-dark">Start here</span>
            <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight">{c.offer.name}</h2>
            <div className="mt-6 rounded-[24px] border border-white/10 bg-white/10 p-5">
              <p className="text-sm text-white/60">Scoped after proof</p>
              <p className="mt-2 text-base leading-7 text-white/85">{c.offer.scoping}</p>
            </div>
            <p className="mt-4 text-sm leading-7 text-white/70">{c.offer.goal}</p>
          </div>
          <div className="panel p-8 lg:p-10">
            <h2 className="font-display text-3xl font-semibold text-brand-950">What you receive</h2>
            <ul className="prose-list mt-5">
              {c.offer.deliverables.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        {/* Why */}
        <section className="panel p-8 lg:p-10">
          <div className="max-w-4xl space-y-4">
            <span className="eyebrow">Why DesirSolutions</span>
            <p className="text-base leading-7 text-slate-700">{c.why}</p>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-14">
          <SectionIntro eyebrow="FAQ" title="Common questions." copy="" />
          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {c.faqs.map((f) => (
              <article key={f.q} className="panel p-6">
                <h3 className="font-display text-lg font-semibold text-brand-950">{f.q}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{f.a}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Honest scope */}
        <section className="panel p-6">
          <p className="text-xs leading-6 text-slate-500">{c.roadmapNote}</p>
        </section>

        {/* Newsletter capture — highest-intent page */}
        <section className="py-14">
          <div className="panel-dark grid gap-6 p-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:p-10">
            <div className="space-y-3">
              <span className="eyebrow eyebrow-dark">Stay ahead of the next outage</span>
              <h2 className="font-display text-3xl font-semibold tracking-tight">
                Get AI continuity and infrastructure updates from Desir Solutions.
              </h2>
              <p className="text-sm leading-7 text-white/75">
                Occasional notes on AI failover architecture, infrastructure resilience, and
                delivery-aligned talent coverage. No spam.
              </p>
            </div>
            <NewsletterForm variant="dark" />
          </div>
        </section>

        <ClosingCta eyebrow="Keep AI running through the next outage" />
      </main>
    </>
  )
}
