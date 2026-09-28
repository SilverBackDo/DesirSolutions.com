import { Button } from '../components/Button'
import { ClosingCta } from '../components/ClosingCta'
import { SectionIntro } from '../components/SectionIntro'
import { Seo } from '../components/Seo'
import { ServiceIcon } from '../components/ServiceIcon'
import {
  coreMetrics,
  enterpriseProof,
  faqs,
  flagshipOffer,
  industrySectors,
  pains,
  practiceAreas,
  proofAssets,
  services,
  staffingSpecialties,
} from '../data/siteContent'

const heroSignals = [
  'Consent-first contractor placement',
  'Linux/RHEL + VMware',
  'Terraform + Ansible',
  'CI/CD + hybrid cloud',
  'AI continuity readiness',
  'Compliance evidence',
]

const futureReadyCards = [
  {
    title: 'Automation readiness',
    copy: 'Find where runbooks, scripts, pipelines, and approvals can be safely automated.',
  },
  {
    title: 'AI continuity planning',
    copy: 'Identify fallback paths, approval gates, and governance needs before AI-assisted operations become business-critical.',
  },
  {
    title: 'Operator-controlled implementation',
    copy: 'Move from assessment to implementation only after the risk, proof, and owner decision are clear.',
  },
]

export function HomePage() {
  return (
    <>
      <Seo
        title="IT Contractor Placement & Infrastructure Consulting"
        description="Senior IT contractor placement, backed by infrastructure stability and automation assessments for teams carrying Linux, VMware, hybrid-cloud, Terraform, Ansible, CI/CD, and operational delivery risk."
        path="/"
      />

      <main id="main-content">
        <section className="hero-stage">
          <div className="shell relative grid gap-10 py-16 lg:grid-cols-[1.06fr_0.94fr] lg:items-center lg:py-24">
            <div className="space-y-5">
              <span className="eyebrow">Desir Solutions LLC</span>
              <div className="space-y-5">
                <h1 className="max-w-4xl font-display text-5xl font-semibold leading-tight tracking-tight text-brand-950 sm:text-6xl">
                  Senior infrastructure contractors for mid-market teams that need{' '}
                  <span className="bg-[linear-gradient(135deg,#1f6f95_0%,#19a974_100%)] bg-clip-text text-transparent">
                    real technical depth.
                  </span>
                </h1>
                <p className="max-w-3xl text-lg leading-8 text-slate-600">
                  Desir Solutions places DevOps, Linux, VMware, Kubernetes, Terraform, Ansible,
                  and cloud infrastructure engineers who can own your environment — not just work
                  in it. When your infrastructure needs clarity first, our fixed-fee assessment maps
                  the risk before we send a single profile.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button to="/talent">Place infrastructure contractors</Button>
                <Button to="/assessment" variant="secondary">
                  See the assessment first
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
                    Infrastructure-lane entry offer
                  </p>
                  <h2 className="font-display text-3xl font-semibold tracking-tight">
                    {flagshipOffer.name}
                  </h2>
                  <p className="text-sm leading-7 text-white/76">{flagshipOffer.summary}</p>
                </div>
                <img
                  alt="Assessment proof workflow from intake to decision package"
                  className="mt-6 rounded-[28px] border border-white/10"
                  src="/assessment-proof-workflow.svg?v=2"
                />
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <div className="rounded-[24px] border border-white/10 bg-white/10 p-4">
                    <p className="text-sm text-white/60">Starting point</p>
                    <p className="mt-2 text-xl font-semibold text-white">{flagshipOffer.price}</p>
                  </div>
                  <div className="rounded-[24px] border border-white/10 bg-white/10 p-4">
                    <p className="text-sm text-white/60">Cadence</p>
                    <p className="mt-2 text-xl font-semibold text-white">{flagshipOffer.timeline}</p>
                  </div>
                </div>
                <ul className="mt-5 space-y-3 text-sm leading-6 text-white/78">
                  {flagshipOffer.deliverables.slice(0, 3).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="signal-card interactive-card metric-card reveal delay-2">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
                    Buyer route
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-brand-950">
                    Contractor placement first, assessment when needed
                  </p>
                </div>
                <div className="signal-card interactive-card metric-card reveal delay-3">
                  <p className="text-sm uppercase tracking-[0.2em] text-slate-500">
                    Follow-on lanes
                  </p>
                  <p className="mt-3 text-2xl font-semibold text-brand-950">
                    Infrastructure, automation, support, or advisory
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="shell py-12">
          <SectionIntro
            eyebrow="AI-forward, operator-controlled"
            title="Future-ready operations without production guesswork"
            copy="Desir Solutions helps teams prepare infrastructure, automation, governance, and operating models for AI-enabled operations — without blind automation or uncontrolled AI action paths."
          />
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {futureReadyCards.map((card) => (
              <div className="panel h-full space-y-2 p-6" key={card.title}>
                <p className="text-base font-semibold text-brand-950">{card.title}</p>
                <p className="text-sm leading-7 text-slate-600">{card.copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="shell py-12">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {coreMetrics.map((metric) => (
              <div key={metric.label} className="signal-card interactive-card metric-card reveal">
                <p className="font-display text-3xl font-semibold text-brand-950">{metric.value}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{metric.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="shell py-12">
          <SectionIntro
            eyebrow="Buyer proof"
            title="Credibility starts with artifacts buyers can inspect."
            copy="The public site now shows the operating proof behind the first engagement instead of asking buyers to trust broad consulting claims on faith."
          />

          <div className="mt-8 grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
            {proofAssets.map((item) => (
              <article key={item.title} className="panel interactive-card p-6 reveal">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
                  {item.signal}
                </p>
                <h2 className="mt-3 font-display text-2xl font-semibold text-brand-950">
                  {item.title}
                </h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.detail}</p>
              </article>
            ))}
            <article className="panel interactive-card p-6 reveal">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-700">
                Placement with infrastructure depth
              </p>
              <h2 className="mt-3 font-display text-2xl font-semibold text-brand-950">
                We diagnose before we send profiles
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Every contractor placement starts from a real understanding of your environment —
                what is running, what is fragile, what is missing. The people we send can hit the
                ground running instead of spending their first weeks figuring out your stack.
              </p>
            </article>
          </div>
        </section>

        <section className="shell py-12">
          <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr]">
            <SectionIntro
              eyebrow="Why organizations engage"
              title="The first problem is usually clarity."
              copy="The most valuable first move is a ranked view of risk, quick wins, ownership, and sequencing before the buyer commits to a larger modernization or staffing path."
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
            title="Contractor placement leads, with infrastructure lanes when the work calls for it."
            copy="Placement is the fastest path when the delivery need is already clear. The infrastructure assessment is the entry offer for the infrastructure lane — automation and managed support extend from there once the decision package proves the need."
          />

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {services.map((service) => (
              <article key={service.name} className="panel interactive-card tower-card flex h-full flex-col p-6 reveal">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <span className="eyebrow">{service.eyebrow}</span>
                    <ServiceIcon name={service.icon} type="button" />
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
              title="A founder-led infrastructure firm with room to scale into broader delivery."
              copy="Desir Solutions can support leadership conversations, technical execution, operational continuity, and specialized staffing requests, but the public path now starts with one buyer-friendly entry point."
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
              title="Specialized staffing after the delivery need is clear."
              copy="The staffing lane is strongest when an approved employer request, active project, or assessment has defined the role, environment, timeline, and delivery risk."
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
            title="Built for teams operating infrastructure that cannot drift forever."
            copy="The target buyer is carrying real systems, real operational pressure, and a backlog that needs a practical decision package before the next investment."
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
                Trust comes from operating discipline, not unsupported scale language.
              </h2>
              <p className="max-w-xl text-base leading-7 text-white/80">
                The website now shows the workflow controls behind buyer intake, assessment
                delivery, commercial decisions, staffing movement, and public proof claims.
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
            title="Clear enough for buyers, hiring managers, and technical leaders to move quickly."
            copy="The public experience is designed to support fast decision-making without sounding generic, sales-heavy, or bigger than the current proof base."
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
