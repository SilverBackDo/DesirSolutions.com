import { ClosingCta } from '../components/ClosingCta'
import { SectionIntro } from '../components/SectionIntro'
import { Seo } from '../components/Seo'
import { company, enterpriseProof, founderTrackRecord, practiceAreas, teamModel } from '../data/siteContent'

export function AboutPage() {
  return (
    <>
      <Seo
        title="About"
        description="A founder-led infrastructure stability and automation consulting firm built around structured buyer proof and disciplined delivery workflows."
        path="/about"
      />

      <main id="main-content" className="shell py-14 lg:py-20">
        <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="space-y-5">
            <span className="eyebrow">Enterprise operating model</span>
            <h1 className="font-display text-5xl font-semibold tracking-tight text-brand-950 sm:text-6xl">
              Desir Solutions is a founder-led infrastructure stability and automation consulting
              firm.
            </h1>
            <p className="text-lg leading-8 text-slate-600">
              The company leads with a defined assessment offer for Linux, VMware, hybrid-cloud,
              automation, and operational delivery pressure. Follow-on implementation, support, and
              staffing lanes exist to serve a documented need, not to blur the public message.
            </p>
          </div>

          <div className="panel p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-700">
              Company profile
            </p>
            <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600">
              <p>
                {company.name} is based in {company.location} and serves enterprise buyers who need
                stronger infrastructure execution, automation discipline, operational support, and
                specialized technical coverage.
              </p>
              <p>
                The model is designed to support strategy, delivery, support continuity, and talent
                placement through a proof-first path that feels credible and operationally mature.
              </p>
            </div>
          </div>
        </section>

        <section className="py-10">
          <SectionIntro
            eyebrow="Founder track record"
            title="Senior, hands-on infrastructure delivery behind the firm."
            copy="Desir Solutions is founder-led by a senior infrastructure engineer with enterprise delivery experience across regulated and high-availability environments."
          />
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {founderTrackRecord.map((item) => (
              <article key={item} className="panel p-6">
                <p className="text-sm leading-7 text-slate-600">{item}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="py-14">
          <SectionIntro
            eyebrow="Operating functions"
            title="Organized like an enterprise solutions business, not a generic consulting page."
            copy="Each part of the public site maps to a real operating lane so enterprise visitors can understand how work, support, and staffing requests are handled."
          />
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-500">
            These are operating functions within a founder-led practice, not separately staffed
            departments — the same senior team coordinates work across them.
          </p>

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {teamModel.map((item) => (
              <article key={item.name} className="panel p-6">
                <h3 className="font-display text-2xl font-semibold text-brand-950">{item.name}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.summary}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="py-6">
          <div className="grid gap-5 lg:grid-cols-2">
            {practiceAreas.map((item) => (
              <article key={item.title} className="panel p-6">
                <h2 className="font-display text-3xl font-semibold text-brand-950">{item.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="py-14">
          <SectionIntro
            eyebrow="Why buyers trust the model"
            title="The public experience reflects structured operations, accountable decision-making, and enterprise-grade positioning."
            copy="That combination makes the site easier to trust for enterprise buyers, technical leaders, and hiring managers evaluating whether the business can actually support live work."
          />

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {enterpriseProof.map((item) => (
              <article key={item} className="panel p-6">
                <p className="text-sm leading-7 text-slate-600">{item}</p>
              </article>
            ))}
          </div>
        </section>

        <ClosingCta eyebrow="Engage Desir Solutions" />
      </main>
    </>
  )
}
