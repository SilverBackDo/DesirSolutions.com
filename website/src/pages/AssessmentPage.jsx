import { Button } from '../components/Button'
import { ClosingCta } from '../components/ClosingCta'
import { SectionIntro } from '../components/SectionIntro'
import { Seo } from '../components/Seo'
import { assessmentPhases, flagshipOffer } from '../data/siteContent'

const goodFit = [
  'Enterprise teams managing Linux, VMware, cloud, automation, or hybrid infrastructure pressure',
  'Leaders who need an organized decision package before launching a larger modernization or staffing effort',
  'Operations groups that need technical clarity, delivery sequencing, and practical next-step guidance quickly',
]

export function AssessmentPage() {
  return (
    <>
      <Seo
        title="Infrastructure Assessment"
        description="A structured infrastructure and automation assessment for enterprise teams that need a practical decision package."
        path="/assessment"
      />

      <main id="main-content" className="shell py-14 lg:py-20">
        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div className="space-y-6">
            <span className="eyebrow">Fixed-fee entry engagement</span>
            <div className="space-y-4">
              <h1 className="max-w-3xl font-display text-5xl font-semibold tracking-tight text-brand-950 sm:text-6xl">
                Infrastructure Stability &amp; Automation Assessment
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                This engagement gives buyers a tight, practical review of infrastructure
                conditions, automation opportunities, operational friction, and the most justified
                next move. It is built to create clarity for leadership, not just more discovery
                notes.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button to="/contact">Request the assessment</Button>
              <Button to="/proof" variant="secondary">
                Inspect buyer proof
              </Button>
            </div>
          </div>

          <div className="panel p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-sand-50 p-5">
                <p className="text-sm text-slate-500">Starting point</p>
                <p className="mt-2 text-3xl font-semibold text-brand-950">{flagshipOffer.price}</p>
              </div>
              <div className="rounded-3xl bg-sand-50 p-5">
                <p className="text-sm text-slate-500">Timeline</p>
                <p className="mt-2 text-3xl font-semibold text-brand-950">{flagshipOffer.timeline}</p>
              </div>
            </div>
            <ul className="prose-list mt-5">
              {flagshipOffer.deliverables.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="py-14">
          <SectionIntro
            eyebrow="What happens"
            title="A structured engagement model that leads to a business decision."
            copy="The output is designed to serve leadership review, technical planning, and execution sequencing so the engagement feels substantial even before a larger project begins."
          />

          <div className="mt-8 grid gap-5 lg:grid-cols-4">
            {assessmentPhases.map((step) => (
              <article key={step.phase} className="panel p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">
                  {step.phase}
                </p>
                <h3 className="mt-3 font-display text-xl font-semibold text-brand-950">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{step.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-8 py-6 lg:grid-cols-[1fr_1fr]">
          <div className="panel p-7">
            <h2 className="font-display text-3xl font-semibold text-brand-950">Best fit</h2>
            <ul className="prose-list mt-5">
              {goodFit.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="panel p-7">
            <h2 className="font-display text-3xl font-semibold text-brand-950">Commercial logic</h2>
            <ul className="prose-list mt-5">
              <li>Creates fast clarity for enterprise stakeholders without forcing a large project before the picture is ready.</li>
              <li>Produces a usable leadership package that can feed modernization, managed support, or staffing decisions.</li>
              <li>Offers a clean transition into implementation, managed IT expert coverage, or talent augmentation when appropriate.</li>
            </ul>
          </div>
        </section>

        <ClosingCta eyebrow="Enterprise next step" />
      </main>
    </>
  )
}
