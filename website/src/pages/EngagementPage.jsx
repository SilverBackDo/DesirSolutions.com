import { ClosingCta } from '../components/ClosingCta'
import { SectionIntro } from '../components/SectionIntro'
import { Seo } from '../components/Seo'
import { engagementLifecycle } from '../data/siteContent'

const supportNotes = [
  'Engagements stay human-owned through scoping, approval, escalation, and handoff.',
  'Project staffing and contractor support are aligned to the documented delivery model, not routed through ad hoc side channels.',
  'Service requests and follow-up work are routed through CRM-backed operational workflows.',
]

export function EngagementPage() {
  return (
    <>
      <Seo
        title="Engagement Model"
        description="How Desir Solutions LLC handles intake, solution design, staffing alignment, delivery governance, and support follow-through."
        path="/engagement"
      />

      <main id="main-content" className="shell py-14 lg:py-20">
        <SectionIntro
          eyebrow="Engagement model"
          title="From intake to delivery, the operating path stays structured and human-owned."
          copy="Desir Solutions uses a practical engagement model so buyers know how project delivery, staffing support, escalation, and service review actually move."
        />

        <section className="mt-8 grid gap-5 lg:grid-cols-3 xl:grid-cols-5">
          {engagementLifecycle.map((item) => (
            <article key={item.title} className="panel p-6">
              <h2 className="font-display text-2xl font-semibold text-brand-950">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.detail}</p>
            </article>
          ))}
        </section>

        <section className="py-14">
          <div className="panel p-7">
            <h2 className="font-display text-3xl font-semibold text-brand-950">
              Delivery and support posture
            </h2>
            <ul className="prose-list mt-5">
              {supportNotes.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <ClosingCta
          eyebrow="Next step"
          title="Start with the assessment when the delivery picture is still unclear."
          copy="If the buyer already knows the staffing or execution gap, use the employer intake route instead so the request lands in the right workflow."
        />
      </main>
    </>
  )
}
