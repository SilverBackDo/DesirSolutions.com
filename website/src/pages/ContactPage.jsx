import { ContactForm } from '../components/ContactForm'
import { SectionIntro } from '../components/SectionIntro'
import { Seo } from '../components/Seo'
import { company } from '../data/siteContent'

export function ContactPage() {
  return (
    <>
      <Seo
        title="Contact"
        description="Request an infrastructure assessment or discuss an automation sprint or fractional leadership engagement."
        path="/contact"
      />

      <main className="shell py-14 lg:py-20">
        <section className="grid gap-8 lg:grid-cols-[0.88fr_1.12fr]">
          <div className="space-y-6">
            <SectionIntro
              eyebrow="Start the conversation"
              title="Request the assessment or describe the delivery problem that needs attention."
              copy="The fastest way to close the first engagement is a short call followed by the fixed-fee assessment. Use the form to outline the environment and the current bottleneck."
            />

            <div className="panel p-6">
              <h2 className="font-display text-2xl font-semibold text-brand-950">What happens next</h2>
              <ul className="prose-list mt-4">
                <li>Desir Solutions reviews the request within one business day.</li>
                <li>If the fit is strong, the next step is a short discovery call.</li>
                <li>The first commercial step is the assessment, not a vague discovery cycle.</li>
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
