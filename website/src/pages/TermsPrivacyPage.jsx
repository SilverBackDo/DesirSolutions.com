import { SectionIntro } from '../components/SectionIntro'
import { Seo } from '../components/Seo'
import { company } from '../data/siteContent'

const termsSections = [
  {
    title: 'Permitted use',
    body:
      'This site is provided for informational, procurement-review, candidate-intake, and business-inquiry purposes. You may review service information and submit a business request through the public intake flows.',
  },
  {
    title: 'Restrictions',
    body:
      'You may not interfere with site operations, attempt unauthorized access, misrepresent your identity, or use site content for unlawful, deceptive, or abusive purposes.',
  },
  {
    title: 'Intellectual property',
    body:
      'Site content, branding, frameworks, and published materials are owned by Desir Solutions LLC unless otherwise stated.',
  },
  {
    title: 'No warranties',
    body:
      'This site is provided as is without warranties of any kind, including implied warranties of merchantability, fitness for a particular purpose, or uninterrupted availability.',
  },
  {
    title: 'Limitation of liability',
    body:
      'To the fullest extent permitted by law, Desir Solutions LLC is not liable for damages arising from use of, or inability to use, this site.',
  },
  {
    title: 'Governing law',
    body:
      'These terms are governed by the laws of the State of Washington, with venue in King County, Washington, unless applicable law requires otherwise.',
  },
]

const privacySections = [
  {
    title: 'Information collected',
    body: [
      'Business contact details you submit, including name, email, company, role, environment, timing, and message content.',
      'Technical request metadata such as IP address, browser or user-agent information, and submission timing.',
    ],
  },
  {
    title: 'How information is used',
    body: [
      'Review business inquiries and route requests into internal follow-up workflows.',
      'Support sales qualification, delivery review, candidate or employer intake, and operational security.',
    ],
  },
  {
    title: 'Information sharing',
    body: [
      'Desir Solutions may use service providers for hosting, source control, deployment, communications, and related business operations.',
      'Information is not sold for advertising purposes.',
    ],
  },
  {
    title: 'Retention',
    body: [
      'Inquiry data is retained as needed for business operations, security review, recordkeeping, and backup integrity, then deleted or archived according to internal retention practices.',
    ],
  },
  {
    title: 'Your requests',
    body: [
      'Privacy questions or requests may be sent to the privacy contact below. Identity verification may be required before action is taken.',
    ],
  },
  {
    title: 'Updates',
    body: ['This page may be updated as the operating model changes. The current version is effective when posted.'],
  },
]

export function TermsPrivacyPage() {
  return (
    <>
      <Seo
        title="Terms & Privacy"
        description="Website terms of use and privacy notice for Desir Solutions LLC public web and intake surfaces."
        path="/terms-privacy"
      />

      <main id="main-content" className="shell py-14 lg:py-20">
        <SectionIntro
          eyebrow="Legal"
          title="Website terms of use and privacy notice"
          copy="These terms apply to the Desir Solutions public website and intake forms. For the broader operating summary, review the Trust Center."
        />

        <section className="grid gap-6 py-10 lg:grid-cols-[1fr_1fr]">
          <article className="panel p-7">
            <h2 className="font-display text-3xl font-semibold text-brand-950">Terms of use</h2>
            <div className="mt-5 space-y-5">
              {termsSections.map((section) => (
                <div key={section.title} className="space-y-2">
                  <h3 className="text-base font-semibold text-brand-950">{section.title}</h3>
                  <p className="text-sm leading-7 text-slate-600">{section.body}</p>
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm text-slate-600">
              Terms contact:{' '}
              <a className="hover:text-brand-900" href={`mailto:${company.legalEmail}`}>
                {company.legalEmail}
              </a>
            </p>
          </article>

          <article className="panel p-7">
            <h2 className="font-display text-3xl font-semibold text-brand-950">Privacy notice</h2>
            <div className="mt-5 space-y-5">
              {privacySections.map((section) => (
                <div key={section.title} className="space-y-2">
                  <h3 className="text-base font-semibold text-brand-950">{section.title}</h3>
                  <ul className="prose-list">
                    {section.body.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="mt-6 text-sm text-slate-600">
              Privacy requests:{' '}
              <a className="hover:text-brand-900" href={`mailto:${company.privacyEmail}`}>
                {company.privacyEmail}
              </a>
            </p>
          </article>
        </section>
      </main>
    </>
  )
}
