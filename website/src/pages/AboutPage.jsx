import { ClosingCta } from '../components/ClosingCta'
import { SectionIntro } from '../components/SectionIntro'
import { Seo } from '../components/Seo'
import { company, founderProof } from '../data/siteContent'

const experienceBlocks = [
  'Infrastructure modernization and implementation delivery across hybrid environments.',
  'Linux, VMware, Oracle Cloud, Terraform, Ansible, and deployment workflow alignment.',
  'Operational documentation, stakeholder communication, and structured handoff for lean teams.',
]

export function AboutPage() {
  return (
    <>
      <Seo
        title="About"
        description="Founder-led infrastructure and DevOps consulting built for understaffed IT teams."
        path="/about"
      />

      <main id="main-content" className="shell py-14 lg:py-20">
        <section className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div className="space-y-5">
            <span className="eyebrow">Founder-led by design</span>
            <h1 className="font-display text-5xl font-semibold tracking-tight text-brand-950 sm:text-6xl">
              Desir Solutions is built to sell senior execution, not consulting theater.
            </h1>
            <p className="text-lg leading-8 text-slate-600">
              The business is structured around a simple principle: the first client should work
              directly with the operator responsible for scope, technical direction, and delivery
              quality.
            </p>
          </div>

          <div className="panel p-7">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-brand-700">
              Operating posture
            </p>
            <div className="mt-4 space-y-4 text-sm leading-7 text-slate-600">
              <p>
                {company.name} is based in {company.location} and focuses on infrastructure
                assessments, automation implementation, and fractional infrastructure leadership.
              </p>
              <p>
                The business is intentionally lean: narrow service lines, short first engagements,
                clear contracts, and a delivery model that can be trusted by a buyer who needs help
                now.
              </p>
            </div>
          </div>
        </section>

        <section className="py-14">
          <SectionIntro
            eyebrow="Why this model works"
            title="Buyers get direct access to delivery judgment from the start."
            copy="That improves sales velocity, reduces misunderstanding during scoping, and makes the first engagement easier to execute cleanly."
          />

          <div className="mt-8 grid gap-5 lg:grid-cols-3">
            {founderProof.map((item) => (
              <article key={item} className="panel p-6">
                <p className="text-sm leading-7 text-slate-600">{item}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="py-6">
          <div className="panel p-7">
            <h2 className="font-display text-3xl font-semibold text-brand-950">Relevant experience</h2>
            <ul className="prose-list mt-5">
              {experienceBlocks.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <ClosingCta eyebrow="Work with the founder" />
      </main>
    </>
  )
}
