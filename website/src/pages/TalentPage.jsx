import { Button } from '../components/Button'
import { ClosingCta } from '../components/ClosingCta'
import { SectionIntro } from '../components/SectionIntro'
import { Seo } from '../components/Seo'
import { faqs, staffingSpecialties } from '../data/siteContent'

const placementSteps = [
  {
    step: '01',
    title: 'Intake and scope',
    copy: 'Tell us about the role, the environment, the timeline, and what happens if the role stays open. The more context you give, the better the shortlist.',
  },
  {
    step: '02',
    title: 'Environment-informed shortlist',
    copy: 'We build a shortlist based on your actual stack, not a keyword match. Candidates are screened for the specific tools, patterns, and scale you run.',
  },
  {
    step: '03',
    title: 'Screening and reference check',
    copy: 'Every candidate in the shortlist is screened for skills, availability, rate fit, work authorization, and delivery readiness before it reaches you.',
  },
  {
    step: '04',
    title: 'Submission and interview',
    copy: 'We send 1–3 qualified profiles with a submission packet that explains why each candidate fits your environment. We support the interview process end to end.',
  },
  {
    step: '05',
    title: 'Placement and follow-through',
    copy: 'When the candidate is selected, we handle the placement paperwork and check in at 30, 60, and 90 days. If the role needs to extend, convert, or redeploy, we manage that too.',
  },
]

const goodFit = [
  'Mid-market teams (roughly 50–5,000 employees) with live infrastructure, automation, or modernization needs.',
  'Organizations that need 1–10 senior contractors and want a partner who understands their stack.',
  'Teams that have outgrown startup/network hiring but do not want enterprise MSP overhead.',
  'Hiring managers who need DevOps, Linux, VMware, Kubernetes, Terraform, Ansible, or cloud infrastructure talent fast.',
  'Companies that want a placement partner who will assess the environment before sending profiles.',
]

const notGoodFit = [
  'Programs that need 50+ contractors across multiple cities on a fast timeline — a large enterprise firm is the better call.',
  'Generic IT support or help desk volume hiring — we focus on senior infrastructure roles, not commodity fills.',
  'Buyers who need a single vendor for every function from finance to creative to IT — a generalist agency is a better fit.',
  'Roles where the stack does not matter and any qualified IT professional will do.',
]

export function TalentPage() {
  return (
    <>
      <Seo
        title="Infrastructure Contractor Placement"
        description="Desir Solutions places senior DevOps, Linux, VMware, Kubernetes, Terraform, Ansible, and cloud infrastructure contractors for mid-market teams that need real technical depth — not generic IT resumes."
        path="/talent"
      />

      <main id="main-content" className="shell py-14 lg:py-20">
        <section className="panel-dark reveal p-8 lg:p-10">
          <div className="grid gap-8 lg:grid-cols-[0.94fr_1.06fr] lg:items-start lg:justify-items-start">
            <SectionIntro
              eyebrow="Placement-first offer"
              title="Infrastructure contractor placement for teams that need real technical depth."
              copy="Desir Solutions places senior DevOps, Linux, VMware, Kubernetes, Terraform, Ansible, and cloud infrastructure engineers who can own your environment — not just work in it. We assess before we send profiles, and we do not route you through an MSP."
              theme="dark"
            />
            <div className="space-y-4">
              <p className="text-sm leading-7 text-white/76">
                We place the roles that need infrastructure depth: DevOps, Linux/RHEL, VMware,
                Kubernetes, Terraform/Ansible, cloud infrastructure, platform engineering, and SRE.
                Every shortlist is informed by your actual environment, not a generic IT category.
              </p>
              <Button to="/contact">Request contractor coverage</Button>
              <Button to="/assessment" variant="secondary">
                Start with the assessment
              </Button>
            </div>
          </div>
        </section>

        <section className="py-14">
          <SectionIntro
            eyebrow="How placement works"
            title="A five-step process designed to get the right contractor into your environment fast."
            copy="Placement is not a resume blast. It is a scoped, screened, submission-ready shortlist tied to your actual stack and delivery timeline."
          />

          <div className="mt-8 grid gap-6 lg:grid-cols-2 xl:grid-cols-5">
            {placementSteps.map((step) => (
              <article key={step.step} className="panel p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand-700">
                  {step.step}
                </p>
                <h3 className="mt-3 font-display text-xl font-semibold text-brand-950">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{step.copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-8 py-6 lg:grid-cols-[1fr_1fr]">
          <div className="panel p-7">
            <h2 className="font-display text-3xl font-semibold text-brand-950">Good fit</h2>
            <ul className="prose-list mt-5">
              {goodFit.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="panel p-7">
            <h2 className="font-display text-3xl font-semibold text-brand-950">Not the best fit</h2>
            <ul className="prose-list mt-5">
              {notGoodFit.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </section>

        <section className="py-14">
          <SectionIntro
            eyebrow="What we place"
            title="Infrastructure roles that need real technical depth."
            copy="These are the role categories we place most often. If your need is in one of these areas, we can build a shortlist informed by your environment."
          />

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {staffingSpecialties.map((specialty) => (
              <article key={specialty.title} className="panel interactive-card p-6">
                <h3 className="font-display text-xl font-semibold text-brand-950">
                  {specialty.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{specialty.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="py-14">
          <SectionIntro
            eyebrow="Placement vs the alternatives"
            title="Know when to use Desir and when another IT solutions provider is the better call."
            copy="The right partner depends on what you are trying to get done. Here is the honest comparison against the IT solutions and staffing providers you are probably comparing us to."
          />

          <div className="mt-8 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
            <article className="panel interactive-card p-6">
              <h3 className="font-display text-xl font-semibold text-brand-950">Large IT solutions providers</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                TEKsystems ($3.9B IT staffing, 100+ locations, 80% of Fortune 500), Insight Global
                ($3.28B, #2 for five consecutive years, expanding into consulting and AI via IG Labs),
                and Kforce ($1.22B, NYSE-listed, 70% of Fortune 100) are built for scale. They win when
                you need 50+ contractors across multiple cities or an enterprise procurement team needs a
                recognized vendor on the approved list.
              </p>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Not the best fit when you need selective senior placements, infrastructure depth in your
                specific stack, or a mid-market program where MSP fees (2–5% of bill rate) eat the margin
                on 10–30 contractor programs.
              </p>
            </article>

            <article className="panel interactive-card p-6">
              <h3 className="font-display text-xl font-semibold text-brand-950">Global technology services firms</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Experis (ManpowerGroup, $1.21B, repositioned May 2026 as "A Global Leader in Technology
                Services") and Everforth/Apex Systems ($1.17B) blend IT staffing with managed technology
                solutions, SOW delivery, and international footprint across 75+ countries.
              </p>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Not the best fit when you want a single point of accountability without the overhead of a
                large organizational structure, frequent leadership cycling, or offshoring concerns. (Experis
                Glassdoor: 3.3, 53% recommend — 13% below the staffing industry average.)
              </p>
            </article>

            <article className="panel interactive-card p-6">
              <h3 className="font-display text-xl font-semibold text-brand-950">Generalist professional services</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Robert Half (NYSE: RHI, $5.46B total, Protiviti consulting), Randstad Digital, and Akkodis
                cover broad IT and engineering roles across many disciplines. Useful when your need spans
                multiple functions from one relationship.
              </p>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Not the best fit when the recruiter needs to understand Terraform state, VMware clusters, or
                Kubernetes operational patterns — not just "IT" as a category. Their model is breadth, not
                depth in your stack.
              </p>
            </article>

            <article className="panel interactive-card p-6 border-brand-950 bg-brand-50">
              <h3 className="font-display text-xl font-semibold text-brand-950">Desir Solutions</h3>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                We occupy the position the large providers do not: mid-market IT infrastructure placement and
                assessment with real technical depth. We place senior DevOps, Linux, VMware, Kubernetes,
                Terraform, Ansible, and cloud infrastructure contractors who understand your environment. We
                assess before we send profiles. No MSP.
              </p>
              <p className="mt-4 text-sm leading-7 text-slate-600">
                Best fit: mid-market teams with live infrastructure, automation, or modernization needs who
                need 1–10 senior contractors and want a partner who understands the stack.
              </p>
              <Button className="mt-4" to="/contact">Talk to our team</Button>
            </article>
          </div>
        </section>

        <section className="py-14">
          <SectionIntro
            eyebrow="Common questions"
            title="Clear enough for hiring managers to move quickly."
            copy="The answers below are written for buyers comparing options, not for generic FAQ filler."
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

        <ClosingCta eyebrow="Placement conversation" />
      </main>
    </>
  )
}
