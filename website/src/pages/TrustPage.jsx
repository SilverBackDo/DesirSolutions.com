import { Button } from '../components/Button'
import { ClosingCta } from '../components/ClosingCta'
import { SectionIntro } from '../components/SectionIntro'
import { Seo } from '../components/Seo'
import {
  company,
  procurementPacket,
  securityReadinessSignals,
  trustControls,
  trustSignals,
} from '../data/siteContent'

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

        <section className="py-14">
          <article className="panel p-7">
            <h2 className="font-display text-3xl font-semibold text-brand-950">
              AI &amp; automation governance posture
            </h2>
            <ul className="prose-list mt-5">
              {[
                'No unnecessary production access.',
                'No blind automation.',
                'No uncontrolled AI action paths.',
                'Human approval before operational changes.',
                'Evidence retained for decisions.',
                'Credentials and sensitive data handled outside the repository.',
              ].map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </section>

        <section className="grid gap-6 py-14 lg:grid-cols-[1fr_1fr]">
          <article className="panel p-7">
            <h2 className="font-display text-3xl font-semibold text-brand-950">
              Procurement packet
            </h2>
            <ul className="prose-list mt-5">
              {procurementPacket.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>

          <article className="panel p-7">
            <h2 className="font-display text-3xl font-semibold text-brand-950">
              Security readiness signals
            </h2>
            <ul className="prose-list mt-5">
              {securityReadinessSignals.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </section>

        <section className="panel-dark grid gap-8 p-8 lg:grid-cols-[0.9fr_1.1fr] lg:p-10">
          <div className="space-y-4">
            <span className="eyebrow eyebrow-dark">Public trust boundary</span>
            <h2 className="font-display text-4xl font-semibold tracking-tight">
              Strong claims should be backed by visible controls or client-approved proof.
            </h2>
            <p className="max-w-xl text-base leading-7 text-white/78">
              Desir Solutions can describe readiness, policies, operating discipline, and aligned
              controls. Third-party certifications, client outcomes, and named partnerships should
              be published only when the company has evidence available to support them.
            </p>
          </div>
          <div className="grid gap-4">
            {trustSignals.map((item) => (
              <div
                key={item}
                className="interactive-card rounded-[24px] border border-white/10 bg-white/10 p-5"
              >
                <p className="text-sm leading-7 text-white/85">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="panel mt-14 flex flex-col gap-5 p-7 lg:flex-row lg:items-center lg:justify-between">
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
