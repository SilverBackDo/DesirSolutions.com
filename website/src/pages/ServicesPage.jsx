import { Button } from '../components/Button'
import { ClosingCta } from '../components/ClosingCta'
import { SectionIntro } from '../components/SectionIntro'
import { Seo } from '../components/Seo'
import { ServiceIcon } from '../components/ServiceIcon'
import { industrySectors, serviceComparisons, services, staffingSpecialties } from '../data/siteContent'

const marketPositioning = [
  {
    title: 'The large IT solutions providers',
    body: [
      'TEKsystems ($3.9B IT staffing revenue, 100+ locations, 80% of Fortune 500), Insight Global ($3.28B, #2 for five consecutive years, expanding into consulting and AI via IG Labs), and Kforce ($1.22B, NYSE-listed, 70% of Fortune 100, KNOWLEDGEforce methodology) are built for scale.',
      'They win when you need 50+ contractors across multiple cities, MSP/VMS program relationships, or an enterprise procurement team that needs a recognized vendor on the approved list.',
      '<strong>Where they are not the best fit:</strong> selective senior placements, infrastructure depth in your specific stack, and mid-market programs where MSP fees (2–5% of bill rate) eat the margin on 10–30 contractor programs.',
    ],
  },
  {
    title: 'The global technology services firms',
    body: [
      'Experis (ManpowerGroup, $1.21B, repositioned in May 2026 as "A Global Leader in Technology Services") and Everforth/Apex Systems ($1.17B) blend IT staffing with managed technology solutions, SOW delivery, and international footprint.',
      'Experis covers 75+ countries; Apex is strong in government and cleared talent. Both bring global infrastructure and broad service menus.',
      '<strong>Where they are not the best fit:</strong> a mid-market team that wants a single point of accountability without the overhead of a large organizational structure, frequent leadership cycling, or offshoring concerns. Experis\'s Glassdoor score (3.3, 53% recommend) is 13% below the staffing industry average.',
    ],
  },
  {
    title: 'The generalist professional services firms',
    body: [
      'Robert Half (NYSE: RHI, $5.46B total revenue) runs technology staffing under a single brand alongside Protiviti consulting. Randstad Digital and Akkodis cover broad IT and engineering roles across many disciplines.',
      'They are useful when your need spans multiple functions — finance, creative, HR, and IT from one relationship — or when procurement requires a nationally recognized vendor.',
      '<strong>Where they are not the best fit:</strong> specialized infrastructure roles where the recruiter needs to understand Terraform state, VMware clusters, or Kubernetes operational patterns — not just "IT" as a category. Their model is breadth, not depth in your stack.',
    ],
  },
  {
    title: 'Desir Solutions — specialized mid-market IT infrastructure',
    body: [
      'We occupy the position the large providers do not: mid-market IT infrastructure placement and assessment with real technical depth. We place senior DevOps, Linux, VMware, Kubernetes, Terraform, Ansible, and cloud infrastructure contractors who understand your environment. We assess before we send profiles. We do not route you through an MSP.',
      '<strong>Best fit:</strong> mid-market teams (roughly 50–5,000 employees) with live infrastructure, automation, or modernization needs who need 1–10 senior contractors and want a partner who understands the stack.',
      '<strong>Why this position exists:</strong> the large providers own enterprise scale. The generalists own breadth. The boutiques own narrow niches. Mid-market infrastructure teams that need senior practitioners fast, with technical recruiters who can talk to their hiring managers, fall between all of those — and that is where Desir fits.',
    ],
    highlight: true,
  },
]

export function ServicesPage() {
  return (
    <>
      <Seo
        title="Infrastructure Services"
        description="Specialized IT staffing and contractor placement, plus infrastructure implementation, automation, and managed expert support."
        path="/services"
      />

      <main id="main-content" className="shell py-14 lg:py-20">
        <section className="panel-dark reveal p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.94fr_1.06fr] lg:items-center">
            <SectionIntro
              eyebrow="Enterprise services"
              title="Contractor placement first, backed by the infrastructure delivery depth to support it."
              copy="The service architecture is designed to help buyers avoid vague transformation programs. Staffing and contractor placement lead; the fixed-fee infrastructure assessment is the entry point when the work needed is execution, automation, or managed support rather than headcount."
              theme="dark"
            />
            <div className="grid gap-3 sm:grid-cols-2">
              {services.map((service) => (
                <div
                  key={service.name}
                  className="interactive-card rounded-[24px] border border-white/10 bg-white/10 p-4"
                >
                  <div className="flex items-start gap-4">
                    <ServiceIcon name={service.icon} theme="dark" />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
                        {service.eyebrow}
                      </p>
                      <p className="mt-2 text-base font-semibold text-white">{service.name}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-8 grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
          {services.map((service) => (
            <article
              key={service.name}
              className="panel interactive-card tower-card flex h-full flex-col p-6 reveal"
            >
              <div className="flex items-start justify-between gap-4">
                <span className="eyebrow">{service.eyebrow}</span>
                <ServiceIcon name={service.icon} />
              </div>
              <h2 className="mt-4 font-display text-2xl font-semibold text-brand-950">{service.name}</h2>
              <p className="mt-3 inline-flex w-fit rounded-full bg-accent-100/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent-600">
                {service.engagement}
              </p>
              <p className="mt-4 text-sm leading-7 text-slate-600">{service.summary}</p>
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
            eyebrow="Where Desir fits in the market"
            title="You have options. Here is why mid-market infrastructure teams choose Desir."
            copy="The staffing market has large enterprise firms, generalist agencies, and specialized boutiques. The right choice depends on what you are actually trying to get done."
          />

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {marketPositioning.map((item) => (
              <article
                key={item.title}
                className={`panel interactive-card p-6 ${item.highlight ? 'border-brand-950 bg-brand-50' : ''}`}
              >
                <h3 className="font-display text-xl font-semibold text-brand-950">{item.title}</h3>
                {item.body.map((paragraph, i) => (
                  <p key={i} className="mt-3 text-sm leading-7 text-slate-600">
                    {paragraph}
                  </p>
                ))}
                {item.highlight && (
                  <Button className="mt-4" to="/contact">Talk to our team</Button>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="py-14">
          <div className="panel grid gap-8 p-8 lg:grid-cols-[0.88fr_1.12fr] lg:p-10">
            <SectionIntro
              eyebrow="Staff placement coverage"
              title="Technical staffing is strongest when tied to a defined delivery need."
              copy="Desir Solutions supports staffing requests across contract engineering, specialist delivery augmentation, and contract-to-hire support when the role, environment, and delivery outcome are clear."
            />

            <div className="grid gap-4 sm:grid-cols-2">
              {staffingSpecialties.map((item) => (
                <article
                  key={item.title}
                  className="interactive-card rounded-[24px] border border-slate-200/80 bg-sand-50/75 p-5"
                >
                  <h3 className="font-display text-xl font-semibold text-brand-950">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-14">
          <SectionIntro
            eyebrow="Where we fit"
            title="Sectors with infrastructure, operations, and staffing complexity."
            copy="The site is designed to speak to leaders running platform reliability, modernization, support continuity, and specialized hiring in live operating environments."
          />

          <div className="mt-8 grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
            {industrySectors.map((sector) => (
              <article key={sector.title} className="panel interactive-card p-6">
                <h3 className="font-display text-2xl font-semibold text-brand-950">{sector.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{sector.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <ClosingCta eyebrow="Solutions conversation" />
      </main>
    </>
  )
}
