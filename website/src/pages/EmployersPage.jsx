import { EmployerRequestForm } from '../components/EmployerRequestForm'
import { SectionIntro } from '../components/SectionIntro'
import { Seo } from '../components/Seo'
import { employerRequestTypes, engagementLifecycle, staffingSpecialties } from '../data/siteContent'

export function EmployersPage() {
  return (
    <>
      <Seo
        title="Employer Services"
        description="Request contract engineering, project augmentation, managed IT expertise, or contract-to-hire staffing through Desir Solutions LLC."
        path="/employers"
      />

      <main id="main-content" className="shell py-14 lg:py-20">
        <section className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <SectionIntro
              eyebrow="Employer intake"
              title="Request specialist delivery coverage, project augmentation, or contract-to-hire support."
              copy="Use this route when the business need is active and the missing piece is contract engineering, DevOps, infrastructure expertise, cloud support, architecture leadership, or flexible project coverage."
            />

            <div className="grid gap-4">
              {employerRequestTypes.map((item) => (
                <article key={item.title} className="panel p-6">
                  <h2 className="font-display text-2xl font-semibold text-brand-950">
                    {item.title}
                  </h2>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{item.detail}</p>
                </article>
              ))}
            </div>
          </div>

          <EmployerRequestForm />
        </section>

        <section className="py-14">
          <SectionIntro
            eyebrow="Specialty coverage"
            title="Staff placement support is mapped to the roles enterprise teams actually struggle to cover."
            copy="The staffing lane is built for targeted enterprise technology roles and real project pressure, not generic resume collection."
          />

          <div className="mt-8 grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
            {staffingSpecialties.map((item) => (
              <article key={item.title} className="panel p-6">
                <h3 className="font-display text-xl font-semibold text-brand-950">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="py-14">
          <SectionIntro
            eyebrow="How employer requests move"
            title="The request path is tied to a real workflow, not a black-box form."
            copy="Employer requests move into CRM, qualification review, solution mapping, talent operations, and delivery planning with a human-owned approval path."
          />

          <div className="mt-8 grid gap-5 lg:grid-cols-3 xl:grid-cols-5">
            {engagementLifecycle.map((item) => (
              <article key={item.title} className="panel p-6">
                <h3 className="font-display text-xl font-semibold text-brand-950">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.detail}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
    </>
  )
}
