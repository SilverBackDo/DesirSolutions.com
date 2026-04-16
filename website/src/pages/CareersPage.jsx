import { ClosingCta } from '../components/ClosingCta'
import { SectionIntro } from '../components/SectionIntro'
import { Seo } from '../components/Seo'
import { candidateProcess, careerPrinciples } from '../data/siteContent'

export function CareersPage() {
  return (
    <>
      <Seo
        title="Careers"
        description="Contract opportunities, review expectations, and candidate privacy posture at Desir Solutions LLC."
        path="/careers"
      />

      <main id="main-content" className="shell py-14 lg:py-20">
        <SectionIntro
          eyebrow="Contract opportunities"
          title="A candidate process built around fit, timing, and real delivery demand."
          copy="Desir Solutions is not a resume warehouse. The candidate lane exists to support real employer demand, enterprise delivery needs, and human-reviewed opportunity matching."
        />

        <section className="mt-8 grid gap-5 lg:grid-cols-3">
          {candidateProcess.map((item) => (
            <article key={item.title} className="panel p-6">
              <h2 className="font-display text-2xl font-semibold text-brand-950">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.detail}</p>
            </article>
          ))}
        </section>

        <section className="py-14">
          <div className="panel p-7">
            <h2 className="font-display text-3xl font-semibold text-brand-950">
              Candidate privacy and handling
            </h2>
            <ul className="prose-list mt-5">
              {careerPrinciples.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <ClosingCta
          eyebrow="Ready to submit"
          title="Use the candidate intake when the opportunity lane fits your background."
          copy="Structured profiles help Desir Solutions review timing, skills, and role fit before any shortlist or interview process begins."
        />
      </main>
    </>
  )
}
