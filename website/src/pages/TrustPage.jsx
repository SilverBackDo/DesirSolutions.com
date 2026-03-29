import { ClosingCta } from '../components/ClosingCta'
import { SectionIntro } from '../components/SectionIntro'
import { Seo } from '../components/Seo'
import { trustControls } from '../data/siteContent'

const commercialControls = [
  'Washington-governed MSA and SOW templates for consulting engagements.',
  'Written change control before scope, timeline, or cost changes are accepted.',
  'Net 15 invoicing with work pause rights for overdue undisputed balances.',
]

export function TrustPage() {
  return (
    <>
      <Seo
        title="Trust & Security"
        description="Operating controls, hosting approach, and commercial posture for Desir Solutions LLC."
        path="/trust"
      />

      <main id="main-content" className="shell py-14 lg:py-20">
        <SectionIntro
          eyebrow="Trust center"
          title="Lean controls designed for a consulting firm, not a software platform fantasy."
          copy="This operating model is built to support procurement review without pretending the business is a giant enterprise platform. It stays practical, documented, and human-owned."
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
            <h2 className="font-display text-3xl font-semibold text-brand-950">Data handling</h2>
            <ul className="prose-list mt-5">
              <li>Website intake is limited to business inquiry information.</li>
              <li>Access to infrastructure or client data is controlled within signed engagement scope.</li>
              <li>Client-facing approvals remain human-controlled throughout delivery.</li>
            </ul>
          </article>
        </section>

        <ClosingCta eyebrow="Ready to engage" />
      </main>
    </>
  )
}
