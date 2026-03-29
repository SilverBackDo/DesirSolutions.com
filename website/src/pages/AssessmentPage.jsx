import { Button } from '../components/Button'
import { SectionIntro } from '../components/SectionIntro'
import { Seo } from '../components/Seo'
import { assessmentTimeline } from '../data/siteContent'

const deliverables = [
  'Assessment summary written for technical and business review',
  'Ranked risk register with quick wins and dependencies',
  '30-day action plan with ownership guidance',
  'Recommended phase-two scope with pricing direction',
]

const goodFit = [
  'Hybrid environments with Linux, VMware, or cloud infrastructure pressure',
  'IT teams that are overloaded and need an outside operator to sort priorities fast',
  'Buyers who need a real starting point before funding a larger implementation effort',
]

export function AssessmentPage() {
  return (
    <>
      <Seo
        title="Infrastructure Assessment"
        description="A fixed-fee 10-business-day infrastructure assessment for Linux, VMware, cloud, and automation backlog."
        path="/assessment"
      />

      <main className="shell py-14 lg:py-20">
        <section className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-start">
          <div className="space-y-6">
            <span className="eyebrow">Flagship first offer</span>
            <div className="space-y-4">
              <h1 className="max-w-3xl font-display text-5xl font-semibold tracking-tight text-brand-950 sm:text-6xl">
                Infrastructure Stability &amp; Automation Assessment
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                A short engagement for buyers who need a usable decision package, not another vague
                discovery cycle. The output is a prioritized action plan and a clear recommendation
                for what should happen next.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button to="/contact">Start the assessment</Button>
              <Button to="/services" variant="secondary">
                Compare service paths
              </Button>
            </div>
          </div>

          <div className="panel p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-sand-50 p-5">
                <p className="text-sm text-slate-500">Fixed fee</p>
                <p className="mt-2 text-3xl font-semibold text-brand-950">$4,500</p>
              </div>
              <div className="rounded-3xl bg-sand-50 p-5">
                <p className="text-sm text-slate-500">Timeline</p>
                <p className="mt-2 text-3xl font-semibold text-brand-950">10 business days</p>
              </div>
            </div>
            <ul className="prose-list mt-5">
              {deliverables.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="py-14">
          <SectionIntro
            eyebrow="What happens"
            title="A tight engagement structure that leads to a decision."
            copy="The assessment is designed to reduce buyer hesitation. It creates something worth paying for even if the client decides to execute internally after the review."
          />

          <div className="mt-8 grid gap-5 lg:grid-cols-4">
            {assessmentTimeline.map((step) => (
              <article key={step.day} className="panel p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">
                  {step.day}
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
            <h2 className="font-display text-3xl font-semibold text-brand-950">Good fit</h2>
            <ul className="prose-list mt-5">
              {goodFit.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="panel p-7">
            <h2 className="font-display text-3xl font-semibold text-brand-950">Commercial logic</h2>
            <ul className="prose-list mt-5">
              <li>Low-friction paid entry point instead of unpaid architecture consulting.</li>
              <li>Short enough to fund quickly, structured enough to create real trust.</li>
              <li>Natural conversion path into sprint implementation or fractional advisory support.</li>
            </ul>
          </div>
        </section>
      </main>
    </>
  )
}
