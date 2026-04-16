import { Button } from '../components/Button'
import { ClosingCta } from '../components/ClosingCta'
import { SectionIntro } from '../components/SectionIntro'
import { Seo } from '../components/Seo'
import { ServiceIcon } from '../components/ServiceIcon'
import {
  coreMetrics,
  enterpriseProof,
  faqs,
  industrySectors,
  pains,
  practiceAreas,
  services,
  staffingSpecialties,
} from '../data/siteContent'

const heroSignals = ['Enterprise buyers', 'Hiring managers', 'Operations leaders']

export function HomePage() {
  return (
    <>
      <Seo
        title="Enterprise Infrastructure, Automation, Managed IT & IT Staffing"
        description="Enterprise infrastructure, AI automation, managed IT expert solutions, and IT staff placement services for organizations that need operational momentum."
        path="/"
      />

      <main id="main-content">
        <section className="hero-stage">
          <div className="shell relative grid gap-10 py-16 lg:grid-cols-[1.06fr_0.94fr] lg:items-center lg:py-24">
            <div className="space-y-7 reveal">
              <span className="eyebrow">Desir Solutions LLC</span>
              <div className="space-y-5">
                <h1 className="max-w-4xl font-display text-5xl font-semibold leading-tight tracking-tight text-brand-950 sm:text-6xl">
                  Enterprise infrastructure,{' '}
                  <span className="bg-[linear-gradient(135deg,#1f6f95_0%,#19a974_100%)] bg-clip-text text-transparent">
                    AI automation
                  </span>
                  , managed IT, and expert IT staffing built to move delivery forward.
                </h1>
                <p className="max-w-3xl text-lg leading-8 text-slate-600">
                  Desir Solutions supports enterprise technology teams with structured delivery
                  lanes for infrastructure modernization, intelligent automation, operational
                  support, and specialized staff placement. The public experience is built for
                  serious buyers who need capability, trust, and execution clarity.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button to="/contact">Talk to our team</Button>
                <Button to="/services" variant="secondary">
                  Explore service towers
                </Button>
              </div>

              <div className="flex flex-wrap gap-3">
                {heroSignals.map((item) => (
                  <span key={item} className="capability-badge">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="grid gap-5 reveal delay-2">
              <div className="panel-dark p-7">
                <div className="space-y-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.24em] text-white/70">
                    Enterprise service towers
                  </p>
                  <h2 className="font-display text-3xl font-semibold tracking-tight">
                    One public platform. Four high-value delivery lanes.
                  </h2>
                </div>
                <div className="mt-6 grid gap-4">
                  {services.map((service) => (
                    <div
                      key={service.eyebrow}
                      className="interactive-card rounded-[26px] border border-white/10 bg-white/10 p-4"
                    >
                      <div className="flex items-start gap-4">
                        <ServiceIcon name={service.icon} theme="dark" />
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-100">
                            {service.eyebrow}
                          </p>
                          <p className="text-base font-semibold text-white">{service.name}</p>
                          <p className="text-sm leading-6 text-white/75">{service.engagement}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="signal-card interactive-card metric-card reveal delay-2">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
                    Buying routes
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-brand-950">
                    Assessment, delivery, managed support, staffing
                  </p>
                </div>
                <div className="signal-card interactive-card metric-card reveal delay-3">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
                    Staffing focus
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-brand-950">
                    Contract engineering to contract-to-hire
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="shell pb-12">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {coreMetrics.map((metric) => (
              <div key={metric.label} className="signal-card interactive-card metric-card reveal">
                <p className="font-display text-3xl font-semibold text-brand-950">{metric.value}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{metric.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="shell py-12">
          <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
            <SectionIntro
              eyebrow="Why organizations engage"
              title="Enterprise teams rarely have just one problem to solve."
              copy="The real challenge usually lives at the intersection of infrastructure complexity, automation gaps, operational pressure, and talent constraints."
            />

            <div className="grid gap-4 md:grid-cols-2">
              {pains.map((pain) => (
                <article key={pain} className="panel interactive-card p-6 reveal">
                  <p className="text-base leading-7 text-slate-700">{pain}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="shell py-12">
          <SectionIntro
            align="center"
            eyebrow="Service towers"
            title="Structured to cover infrastructure, automation, managed support, and staffing without overlap or clutter."
            copy="Each service tower is clear enough for enterprise buyers to understand quickly and flexible enough to support blended engagements when operations require it."
          />

          <div className="mt-8 grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
            {services.map((service) => (
              <article key={service.name} className="panel interactive-card tower-card flex h-full flex-col p-6 reveal">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <span className="eyebrow">{service.eyebrow}</span>
                    <ServiceIcon name={service.icon} />
                  </div>
                  <h2 className="font-display text-2xl font-semibold text-brand-950">{service.name}</h2>
                  <p className="rounded-full bg-accent-100/70 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent-600">
                    {service.engagement}
                  </p>
                  <p className="text-sm leading-7 text-slate-600">{service.summary}</p>
                </div>
                <ul className="prose-list mt-5">
                  {service.outcomes.map((outcome) => (
                    <li key={outcome}>{outcome}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="shell py-12">
          <div className="panel grid gap-8 p-8 lg:grid-cols-[0.9fr_1.1fr] lg:p-10">
            <SectionIntro
              eyebrow="Core platform model"
              title="An enterprise solutions company with clear lanes and operational discipline."
              copy="Desir Solutions is positioned to support leadership conversations, technical execution, operational continuity, and specialized staffing requests through a coherent public platform."
            />

            <div className="grid gap-4 sm:grid-cols-2">
              {practiceAreas.map((area) => (
                <article
                  key={area.title}
                  className="interactive-card rounded-[24px] border border-slate-200/80 bg-sand-50/75 p-5"
                >
                  <h3 className="font-display text-2xl font-semibold text-brand-950">{area.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{area.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="shell py-12">
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <SectionIntro
              eyebrow="IT expert placement"
              title="Specialized staffing support for real enterprise delivery pressure."
              copy="The staffing pillar is built for hiring managers who need focused technical coverage now, from contract engineering and project augmentation through contract-to-hire support."
            />

            <div className="grid gap-4 md:grid-cols-2">
              {staffingSpecialties.map((specialty) => (
                <article key={specialty.title} className="panel interactive-card p-6">
                  <h3 className="font-display text-2xl font-semibold text-brand-950">
                    {specialty.title}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{specialty.detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="shell py-12">
          <SectionIntro
            eyebrow="Industry sectors"
            title="Built for enterprise teams operating in high-pressure, high-change environments."
            copy="The public positioning stays broad enough to support different buyer types while still feeling credible for enterprise operations, platform, and delivery leaders."
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

        <section className="shell py-12">
          <div className="panel-dark grid gap-8 p-8 lg:grid-cols-[0.95fr_1.05fr] lg:p-10">
            <div className="space-y-4">
              <span className="eyebrow eyebrow-dark">Trust and credibility</span>
              <h2 className="font-display text-4xl font-semibold tracking-tight">
                Enterprise-ready messaging backed by real workflow discipline.
              </h2>
              <p className="max-w-xl text-base leading-7 text-white/80">
                The website now communicates a full solutions platform with structured intake,
                documented service lanes, and human-governed commercial and staffing decisions.
              </p>
            </div>
            <div className="grid gap-4">
              {enterpriseProof.map((item) => (
                <div
                  key={item}
                  className="interactive-card rounded-[24px] border border-white/10 bg-white/10 p-5"
                >
                  <p className="text-sm leading-7 text-white/85">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="shell py-12">
          <SectionIntro
            eyebrow="Common questions"
            title="Clear enough for enterprise buyers, hiring managers, and technical leaders to move quickly."
            copy="The public experience is designed to support fast decision-making without sounding generic, sales-heavy, or overbuilt."
          />

          <div className="mt-8 grid gap-4">
            {faqs.map((faq) => (
              <article key={faq.question} className="panel interactive-card p-6">
                <h3 className="font-display text-xl font-semibold text-brand-950">{faq.question}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>

        <ClosingCta />
      </main>
    </>
  )
}
