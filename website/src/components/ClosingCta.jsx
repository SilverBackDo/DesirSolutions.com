import { Button } from './Button'

const focusAreas = ['Infrastructure', 'AI Automation', 'Managed IT', 'IT Staffing']

export function ClosingCta({
  eyebrow = 'Next step',
  title = 'Bring the right infrastructure, automation, managed IT, or staffing challenge to the table.',
  copy = 'Desir Solutions helps enterprise buyers and hiring managers move into the right lane quickly, with structured intake and a clear operating path behind every engagement.',
}) {
  return (
    <section className="py-14">
      <div className="panel-dark flex flex-col gap-6 p-8 lg:flex-row lg:items-center lg:justify-between lg:p-10">
        <div className="max-w-2xl space-y-4">
          <span className="eyebrow eyebrow-dark">{eyebrow}</span>
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
            {title}
          </h2>
          <p className="text-base leading-7 text-white/80">{copy}</p>
          <div className="flex flex-wrap gap-2 pt-1">
            {focusAreas.map((item) => (
              <span key={item} className="capability-badge capability-badge-dark">
                {item}
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button className="bg-white text-brand-950 hover:bg-sand-100" to="/contact">
            Talk to our team
          </Button>
          <Button
            className="border-white/20 bg-white/10 text-white hover:border-white/40 hover:bg-white/15"
            to="/services"
            variant="secondary"
          >
            Explore service towers
          </Button>
        </div>
      </div>
    </section>
  )
}
