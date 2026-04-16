import { ClosingCta } from '../components/ClosingCta'
import { SectionIntro } from '../components/SectionIntro'
import { Seo } from '../components/Seo'
import { ServiceIcon } from '../components/ServiceIcon'
import { industrySectors, serviceComparisons, services, staffingSpecialties } from '../data/siteContent'

export function ServicesPage() {
  return (
    <>
      <Seo
        title="Enterprise Services"
        description="Enterprise infrastructure solutions, AI automation, managed IT expert support, and IT staff placement services."
        path="/services"
      />

      <main id="main-content" className="shell py-14 lg:py-20">
        <section className="panel-dark reveal p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.94fr_1.06fr] lg:items-center">
            <SectionIntro
              eyebrow="Enterprise services"
              title="Four service towers built for enterprise infrastructure, automation, managed IT, and staffing needs."
              copy="The service architecture is designed to help enterprise buyers move into the right lane quickly without mixing strategy, execution, support, and staffing into a single vague offer."
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
            eyebrow="How to engage"
            title="Choose the delivery lane that matches the pressure in front of you."
            copy="Some buyers need strategic clarity, some need execution help, some need operational continuity, and some need talent coverage immediately. The service structure is built to support all four without confusion."
          />

          <div className="mt-8 grid gap-4 lg:grid-cols-2">
            {serviceComparisons.map((item) => (
              <article key={item.label} className="panel interactive-card p-6">
                <h3 className="font-display text-xl font-semibold text-brand-950">{item.label}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="py-6">
          <div className="panel grid gap-8 p-8 lg:grid-cols-[0.88fr_1.12fr] lg:p-10">
            <SectionIntro
              eyebrow="Staff placement coverage"
              title="Technical staffing is a primary service tower, not an afterthought."
              copy="Desir Solutions supports enterprise staffing requests across contract engineering, specialist delivery augmentation, and contract-to-hire support."
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
            title="Enterprise sectors with infrastructure, operations, and staffing complexity."
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
