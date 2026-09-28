import { Button } from '../components/Button'
import { ClosingCta } from '../components/ClosingCta'
import { SectionIntro } from '../components/SectionIntro'
import { Seo } from '../components/Seo'
import { flagshipOffer, proofAssets, proofRoadmap } from '../data/siteContent'

export function ProofPage() {
  return (
    <>
      <Seo
        title="Proof & Buyer Readiness"
        description="Buyer-ready proof assets for the Desir Solutions infrastructure stability and automation assessment."
        path="/proof"
      />

      <main id="main-content" className="shell py-14 lg:py-20">
        <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="space-y-6">
            <span className="eyebrow">Proof before scale claims</span>
            <div className="space-y-4">
              <h1 className="max-w-3xl font-display text-5xl font-semibold tracking-tight text-brand-950 sm:text-6xl">
                Buyer proof for a focused infrastructure consulting firm.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                Desir Solutions is building public credibility around visible operating artifacts:
                a defined assessment offer, structured intake, trust controls, and a case-study
                publishing standard that avoids unsupported client claims.
              </p>
              <p className="max-w-2xl text-base leading-7 text-slate-600">
                The proof package should show where automation or AI-assisted workflows are safe,
                where human approval remains required, and where infrastructure drift must be
                corrected first.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button to="/assessment">Review the assessment</Button>
              <Button to="/trust" variant="secondary">
                Review trust posture
              </Button>
            </div>
          </div>

          <div className="panel overflow-hidden p-3">
            <img
              alt="Assessment proof workflow from intake to decision package"
              className="rounded-[28px]"
              src="/assessment-proof-workflow.svg"
            />
          </div>
        </section>

        <section className="py-14">
          <SectionIntro
            eyebrow="Current proof assets"
            title="What a buyer can inspect before trusting the firm with a live environment."
            copy="These proof points are intentionally practical. They show the operating model, the first paid engagement, and the boundaries around client claims."
          />

          <div className="mt-8 grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
            {proofAssets.map((item) => (
              <article key={item.title} className="panel interactive-card p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
                  {item.signal}
                </p>
                <h2 className="mt-3 font-display text-2xl font-semibold text-brand-950">
                  {item.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-8 py-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="panel-dark p-8 lg:p-10">
            <span className="eyebrow eyebrow-dark">Flagship offer</span>
            <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight">
              {flagshipOffer.name}
            </h2>
            <p className="mt-4 text-base leading-7 text-white/78">{flagshipOffer.summary}</p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-white/10 p-5">
                <p className="text-sm text-white/60">Starting point</p>
                <p className="mt-2 text-2xl font-semibold text-white">{flagshipOffer.price}</p>
              </div>
              <div className="rounded-[24px] border border-white/10 bg-white/10 p-5">
                <p className="text-sm text-white/60">Cadence</p>
                <p className="mt-2 text-2xl font-semibold text-white">{flagshipOffer.timeline}</p>
              </div>
            </div>
          </div>

          <div className="panel p-8 lg:p-10">
            <h2 className="font-display text-3xl font-semibold text-brand-950">
              What the buyer receives
            </h2>
            <ul className="prose-list mt-5">
              {flagshipOffer.deliverables.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="py-14">
          <SectionIntro
            eyebrow="Path to ranking credibility"
            title="The public reputation engine has to be earned in stages."
            copy="The site now supports the first stage: visible buyer-readiness proof. The next stages require client outcomes, verified reviews, and published case studies."
          />

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {proofRoadmap.map((item) => (
              <article key={item.stage} className="panel p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">
                  {item.stage}
                </p>
                <h3 className="mt-3 font-display text-2xl font-semibold text-brand-950">
                  {item.target}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="panel p-8 lg:p-10">
          <div className="max-w-4xl space-y-4">
            <span className="eyebrow">Case-study standard</span>
            <h2 className="font-display text-3xl font-semibold text-brand-950">
              Public case studies are published only when there is real support behind them.
            </h2>
            <p className="text-sm leading-7 text-slate-600">
              Desir Solutions should not claim client outcomes before the proof exists. Completed
              engagements can become public case studies only after the company has measurable
              results, client approval or safe anonymization, and a delivery record that can support
              the claim.
            </p>
          </div>
        </section>

        <ClosingCta eyebrow="Ready to inspect the first step" />
      </main>
    </>
  )
}
