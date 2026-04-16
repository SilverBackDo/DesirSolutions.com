import { ContactForm } from '../components/ContactForm'
import { SectionIntro } from '../components/SectionIntro'
import { Seo } from '../components/Seo'
import { company } from '../data/siteContent'

export function ContactPage() {
  return (
    <>
      <Seo
        title="Contact"
        description="Start a conversation about infrastructure transformation, AI automation, managed IT support, or enterprise staffing."
        path="/contact"
      />

      <main id="main-content" className="shell py-14 lg:py-20">
        <section className="grid gap-8 lg:grid-cols-[0.88fr_1.12fr]">
          <div className="space-y-6">
            <SectionIntro
              eyebrow="Start the conversation"
              title="Connect with the solutions team for infrastructure, automation, managed IT, or staffing needs."
              copy="Use the form to outline the environment, delivery challenge, operational pressure, or talent gap. The request will be routed into the right service lane for review."
            />

            <div className="panel p-6">
              <h2 className="font-display text-2xl font-semibold text-brand-950">What happens next</h2>
              <ul className="prose-list mt-4">
                <li>Desir Solutions reviews the request within one business day.</li>
                <li>If the fit is strong, the next step is a focused solutions conversation.</li>
                <li>The request is aligned to assessment, project delivery, managed support, or staffing as appropriate.</li>
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
