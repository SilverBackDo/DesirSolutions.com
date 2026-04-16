import { Button } from '../components/Button'
import { ClosingCta } from '../components/ClosingCta'
import { SectionIntro } from '../components/SectionIntro'
import { Seo } from '../components/Seo'
import { company, trustControls, trustSignals } from '../data/siteContent'

const commercialControls = [
  'Washington-governed MSA and SOW templates for enterprise services engagements.',
  'Written change control before scope, timeline, staffing mix, or cost changes are accepted.',
  'Human-owned review before staffing recommendations, shortlist movement, or external delivery commitments.',
]

export function TrustPage() {
  return (
    <>
      <Seo
        title="Trust & Security"
        description="Operating controls, commercial posture, and intake boundaries for Desir Solutions LLC."
        path="/trust"
      />

      <main id="main-content" className="shell py-14 lg:py-20">
        <SectionIntro
          eyebrow="Trust center"
          title="Practical controls for an enterprise solutions business with real workflow discipline."
          copy="The operating model is designed to support procurement, delivery review, and candidate or employer intake with structured workflows, clear accountability, and realistic operating boundaries."
        />

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {trustControls.map((control) => (
            <article key={control.title} className="panel p-6">
              <h2 className="font-display text-2xl font-semibold text-brand-950">
                {control.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{control.detail}</p>
            </article>
          ))}
        </div>

        <section className="grid gap-6 py-14 lg:grid-cols-[1fr_1fr]">
          <article className="panel p-7">
            <h2 className="font-display text-3xl font-semibold text-brand-950">Commercial controls</h2>
            <ul className="prose-list mt-5">
              {commercialControls.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="panel p-7">
            <h2 className="font-display text-3xl font-semibold text-brand-950">Public trust signals</h2>
            <ul className="prose-list mt-5">
              {trustSignals.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </section>

        <section className="panel flex flex-col gap-5 p-7 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <h2 className="font-display text-3xl font-semibold text-brand-950">
              Terms and privacy notice
            </h2>
            <p className="text-sm leading-7 text-slate-600">
              The public trust page is a summary. Binding website-use language, intake handling,
              and privacy notice details live on the dedicated terms page.
            </p>
            <p className="text-sm leading-7 text-slate-600">
              Privacy requests: <a className="hover:text-brand-900" href={`mailto:${company.privacyEmail}`}>{company.privacyEmail}</a>
            </p>
          </div>
          <Button to="/terms-privacy">Review terms & privacy</Button>
        </section>

        <ClosingCta eyebrow="Ready to engage" />
      </main>
    </>
  )
}
