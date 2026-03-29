import { Button } from '../components/Button'
import { SectionIntro } from '../components/SectionIntro'
import { Seo } from '../components/Seo'
import { coreMetrics, faqs, founderProof, pains, services } from '../data/siteContent'

export function HomePage() {
  return (
    <>
      <Seo
        title="Infrastructure & DevOps Consulting"
        description="Founder-led infrastructure modernization consulting for lean IT teams managing Linux, VMware, cloud, and automation backlog."
        path="/"
      />

      <main>
        <section className="shell grid gap-10 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-20">
          <div className="space-y-7">
            <span className="eyebrow">For lean IT teams under delivery pressure</span>
            <div className="space-y-5">
              <h1 className="max-w-3xl font-display text-5xl font-semibold leading-tight tracking-tight text-brand-950 sm:text-6xl">
                Infrastructure modernization for understaffed teams running hybrid environments.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                Desir Solutions helps 20 to 500 employee companies reduce risk across Linux,
                VMware, and cloud-connected infrastructure, turn manual delivery into a defined
                operating model, and move from backlog to a concrete plan quickly.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Button to="/assessment">See the assessment offer</Button>
              <Button to="/services" variant="secondary">
                Review services
              </Button>
            </div>

            <div className="flex flex-wrap gap-3">
              {['Linux / RHEL', 'VMware', 'Terraform', 'Ansible', 'Hybrid Cloud'].map((item) => (
                <span key={item} className="pill">
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="panel overflow-hidden">
            <div className="border-b border-slate-200/70 bg-brand-950 px-6 py-5 text-white">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white/75">
                Flagship first engagement
              </p>
              <p className="mt-3 font-display text-3xl font-semibold">
                Infrastructure Assessment
              </p>
            </div>
            <div className="space-y-6 p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl bg-sand-50 p-4">
                  <p className="text-sm text-slate-500">Timeline</p>
                  <p className="mt-2 text-2xl font-semibold text-brand-950">10 business days</p>
                </div>
                <div className="rounded-3xl bg-sand-50 p-4">
                  <p className="text-sm text-slate-500">Fee</p>
                  <p className="mt-2 text-2xl font-semibold text-brand-950">$4,500 fixed</p>
                </div>
              </div>

              <ul className="prose-list">
                <li>Current-state operating review across infrastructure and delivery flow.</li>
                <li>Ranked risk register with quick wins and phase-two blockers.</li>
                <li>30-day action plan designed for a real buyer decision.</li>
                <li>Clear conversion path into a sprint or monthly advisory engagement.</li>
              </ul>

              <Button className="w-full" to="/contact">
                Request a conversation
              </Button>
            </div>
          </div>
        </section>

        <section className="shell pb-12">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {coreMetrics.map((metric) => (
              <div key={metric.label} className="panel p-6">
                <p className="font-display text-3xl font-semibold text-brand-950">{metric.value}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{metric.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="shell py-12">
          <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
            <SectionIntro
              eyebrow="Why buyers call"
              title="Most teams do not need another abstract transformation deck."
              copy="They need a senior operator to identify what is actually slowing delivery, what is risky, and what should happen first."
            />

            <div className="grid gap-4">
              {pains.map((pain) => (
                <article key={pain} className="panel p-6">
                  <p className="text-base leading-7 text-slate-700">{pain}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="shell py-12">
          <SectionIntro
            eyebrow="Core services"
            title="Built for the fastest path to revenue and delivery confidence."
            copy="Desir Solutions leads with a defined assessment, then expands into sprint delivery or fractional leadership only when the buyer has a justified next step."
          />

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {services.map((service) => (
              <article key={service.name} className="panel flex h-full flex-col p-6">
                <div className="space-y-3">
                  <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
                    {service.price}
                  </p>
                  <h3 className="font-display text-2xl font-semibold text-brand-950">
                    {service.name}
                  </h3>
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
          <div className="panel grid gap-8 overflow-hidden bg-brand-950 p-8 text-white lg:grid-cols-[1fr_1fr] lg:p-10">
            <div className="space-y-4">
              <span className="eyebrow border-white/15 bg-white/10 text-white">Founder-led credibility</span>
              <h2 className="font-display text-4xl font-semibold tracking-tight">
                The buyer works directly with senior technical delivery, not a staffing layer.
              </h2>
              <p className="max-w-xl text-base leading-7 text-white/80">
                Desir Solutions is structured for direct operator access, fast qualification, and
                practical infrastructure work. That keeps the first deal easier to close and the
                delivery model easier to trust.
              </p>
            </div>
            <div className="space-y-4">
              {founderProof.map((item) => (
                <div key={item} className="rounded-[24px] border border-white/10 bg-white/10 p-5">
                  <p className="text-sm leading-7 text-white/85">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="shell py-12">
          <SectionIntro
            eyebrow="Common questions"
            title="Designed to convert without a long sales cycle."
            copy="The site, the offer, and the engagement model are intentionally simple so the first buyer can move from inquiry to paid work without unnecessary friction."
          />

          <div className="mt-8 grid gap-4">
            {faqs.map((faq) => (
              <article key={faq.question} className="panel p-6">
                <h3 className="font-display text-xl font-semibold text-brand-950">{faq.question}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{faq.answer}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}
