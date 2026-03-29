import { Button } from './Button'

export function ClosingCta({
  eyebrow = 'Next step',
  title = 'Start with the fixed-fee assessment.',
  copy = 'The assessment is the fastest path to a real buyer decision, a scoped implementation sprint, or a monthly advisory plan.',
}) {
  return (
    <section className="py-14">
      <div className="panel flex flex-col gap-6 bg-brand-950 p-8 text-white lg:flex-row lg:items-center lg:justify-between lg:p-10">
        <div className="max-w-2xl space-y-4">
          <span className="eyebrow border-white/15 bg-white/10 text-white">{eyebrow}</span>
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {title}
          </h2>
          <p className="text-base leading-7 text-white/80">{copy}</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button className="bg-white text-brand-950 hover:bg-sand-100" to="/contact">
            Request the assessment
          </Button>
          <Button
            className="border-white/20 bg-white/10 text-white hover:border-white/40 hover:bg-white/15"
            to="/assessment"
            variant="secondary"
          >
            Review the offer
          </Button>
        </div>
      </div>
    </section>
  )
}
