import { Button } from '../components/Button'
import { Seo } from '../components/Seo'

export function NotFoundPage() {
  return (
    <>
      <Seo
        title="Page Not Found"
        description="The requested page could not be found. Return to the assessment offer or contact Desir Solutions directly."
        path="/404"
        noindex
      />

      <main id="main-content" className="shell py-20 lg:py-28">
        <section className="panel mx-auto max-w-3xl p-8 text-center sm:p-10">
          <span className="eyebrow">404</span>
          <h1 className="mt-5 font-display text-4xl font-semibold tracking-tight text-brand-950 sm:text-5xl">
            This page is not part of the launch site.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
            The fastest route back into the live site is the assessment offer or the contact page.
            Those are the two pages most buyers need first.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Button to="/assessment">Review the assessment</Button>
            <Button to="/contact" variant="secondary">
              Contact Desir Solutions
            </Button>
          </div>
        </section>
      </main>
    </>
  )
}
