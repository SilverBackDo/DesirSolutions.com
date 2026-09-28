import { ContactForm } from '../components/ContactForm'
import { SectionIntro } from '../components/SectionIntro'
import { Seo } from '../components/Seo'
import { company } from '../data/siteContent'

export function ContactPage() {
  return (
    <>
      <Seo
        title="Contact"
        description="Start a conversation about infrastructure stability, automation, managed expert support, or focused IT talent coverage."
        path="/contact"
      />

      <main id="main-content" className="shell py-14 lg:py-20">
        <section className="grid gap-8 lg:grid-cols-[0.88fr_1.12fr]">
          <div className="space-y-6">
            <SectionIntro
              eyebrow="Start the conversation"
              title="Start with the environment, the operational pressure, and the decision you need to make."
              copy="Use the form to outline the infrastructure challenge, automation gap, delivery pressure, or talent need. The request will be routed into assessment, implementation, support, or staffing review as appropriate."
            />

            <div className="panel p-6">
              <h2 className="font-display text-2xl font-semibold text-brand-950">What happens next</h2>
              <ul className="prose-list mt-4">
                <li>Desir Solutions reviews the request within one business day.</li>
                <li>If the fit is strong, the next step is a focused solutions conversation.</li>
                <li>The request is aligned to the infrastructure assessment first when clarity is needed.</li>
                <li>Project delivery, managed support, or staffing is recommended only when the need is defined.</li>
                <li>The intake can route to the CRM API or fall back to direct email if needed.</li>
              </ul>
            </div>

            <div className="panel p-6">
              <h2 className="font-display text-2xl font-semibold text-brand-950">Direct contact</h2>
              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p>{company.location}</p>
                <p>
                  <a className="hover:text-brand-900" href={`mailto:${company.email}`}>
                    {company.email}
                  </a>
                </p>
                <p>
                  <a className="hover:text-brand-900" href={`mailto:${company.billingEmail}`}>
                    {company.billingEmail}
                  </a>
                </p>
                <p>
                  <a className="hover:text-brand-900" href={`tel:${company.phone}`}>
                    {company.phone}
                  </a>
                </p>
              </div>
            </div>
          </div>

          <ContactForm />
        </section>
      </main>
    </>
  )
}
