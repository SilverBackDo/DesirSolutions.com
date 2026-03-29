import { SectionIntro } from '../components/SectionIntro'
import { Seo } from '../components/Seo'
import { services } from '../data/siteContent'

const serviceComparisons = [
  {
    label: 'When to buy the assessment',
    detail: 'Use it when the buyer knows there is a problem but cannot yet justify a larger project scope.',
  },
  {
    label: 'When to buy a sprint',
    detail: 'Use it when one implementation target is already clear and the team needs delivery help fast.',
  },
  {
    label: 'When to buy fractional leadership',
    detail: 'Use it when the internal team needs recurring senior prioritization, review, and architecture decisions.',
  },
]

export function ServicesPage() {
  return (
    <>
      <Seo
        title="Services"
        description="Infrastructure assessments, automation implementation, and fractional infrastructure leadership."
        path="/services"
      />

      <main className="shell py-14 lg:py-20">
        <SectionIntro
          eyebrow="Three service lines"
          title="Structured for a founder-led consulting business, not a bloated service catalog."
          copy="Each service exists to solve a different stage of the client buying cycle. That keeps scope clean, pricing easier to understand, and delivery easier to manage."
        />

        <div className="mt-8 grid gap-5 lg:grid-cols-3">
          {services.map((service) => (
            <article key={service.name} className="panel p-6">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
                {service.price}
              </p>
              <h2 className="mt-3 font-display text-2xl font-semibold text-brand-950">
                {service.name}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{service.summary}</p>
              <ul className="prose-list mt-5">
                {service.outcomes.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <section className="py-14">
          <SectionIntro
            eyebrow="How to choose"
            title="Buy the smallest engagement that creates a confident next step."
            copy="That principle keeps the first contract easier to sign and prevents overselling work before the buyer has internal alignment."
          />

          <div className="mt-8 grid gap-4">
            {serviceComparisons.map((item) => (
              <article key={item.label} className="panel p-6">
                <h3 className="font-display text-xl font-semibold text-brand-950">{item.label}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.detail}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}
