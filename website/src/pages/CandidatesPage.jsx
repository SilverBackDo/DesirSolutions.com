import { CandidateProfileForm } from '../components/CandidateProfileForm'
import { SectionIntro } from '../components/SectionIntro'
import { Seo } from '../components/Seo'
import { candidateIntakeHighlights, candidateProcess } from '../data/siteContent'

export function CandidatesPage() {
  return (
    <>
      <Seo
        title="Candidates"
        description="Structured candidate intake for contract and delivery-aligned opportunities with Desir Solutions LLC."
        path="/candidates"
      />

      <main id="main-content" className="shell py-14 lg:py-20">
        <section className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="space-y-6">
            <SectionIntro
              eyebrow="Candidate intake"
              title="Submit a structured profile for contract and delivery-aligned opportunities."
              copy="This intake path is designed for real demand review. It collects the context needed to assess fit before any shortlist, interview, or employer introduction happens."
            />

            <div className="panel p-6">
              <h2 className="font-display text-2xl font-semibold text-brand-950">What to expect</h2>
              <ul className="prose-list mt-5">
                {candidateIntakeHighlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="grid gap-4">
              {candidateProcess.map((item) => (
                <article key={item.title} className="panel p-6">
                  <h2 className="font-display text-2xl font-semibold text-brand-950">
                    {item.title}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.detail}</p>
                </article>
              ))}
            </div>
          </div>

          <CandidateProfileForm />
        </section>
      </main>
    </>
  )
}
