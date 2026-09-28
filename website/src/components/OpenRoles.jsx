import { Button } from './Button'
import { openRoles } from '../data/siteContent'

const ROLE_MAX_AGE_DAYS = 45
const MONTHS = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
]

// Best-effort parse of a "target start <Month> <Year>" mention inside a free-text
// duration string (e.g. "target start mid-August 2026"). Returns null when no
// confident match is found rather than guessing.
function parseDurationStartMonth(duration) {
  if (!duration) return null
  const match = duration.match(/start\s+(?:(?:early|mid|late)[\s-]+)?([a-z]+)\s+(\d{4})/i)
  if (!match) return null
  const monthIndex = MONTHS.indexOf(match[1].toLowerCase())
  if (monthIndex === -1) return null
  return { year: Number(match[2]), month: monthIndex }
}

// Age-guard: hide roles posted more than 45 days ago, or whose duration names a
// target-start month that has fully elapsed. Never fabricates dates — reads the
// role's own `posted`/`duration` fields as written.
function isRoleOpen(role, now = new Date()) {
  if (role.posted) {
    const postedDate = new Date(role.posted)
    if (!Number.isNaN(postedDate.getTime())) {
      const ageDays = (now - postedDate) / (1000 * 60 * 60 * 24)
      if (ageDays > ROLE_MAX_AGE_DAYS) return false
    }
  }

  const start = parseDurationStartMonth(role.duration)
  if (start) {
    const startMonthIndex = start.year * 12 + start.month
    const nowMonthIndex = now.getFullYear() * 12 + now.getMonth()
    if (nowMonthIndex > startMonthIndex) return false
  }

  return true
}

export function OpenRoles() {
  const activeRoles = openRoles.filter((role) => isRoleOpen(role))

  if (!activeRoles.length) {
    return (
      <section className="mt-10" aria-labelledby="open-roles-heading">
        <h2 id="open-roles-heading" className="font-display text-3xl font-semibold text-brand-950">
          Open contract roles
        </h2>
        <div className="panel mt-6 p-7">
          <p className="text-base leading-7 text-slate-600">
            No open roles right now — join the bench so Desir Solutions can reach you when a fit
            opens up.
          </p>
          <div className="mt-5">
            <Button to="/candidates">Join the bench</Button>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="mt-10" aria-labelledby="open-roles-heading">
      <h2 id="open-roles-heading" className="font-display text-3xl font-semibold text-brand-950">
        Open contract roles
      </h2>
      <p className="mt-2 text-sm leading-7 text-slate-600">
        Active demand under review right now. Submit your profile through the candidate intake and
        name the role you are applying for.
      </p>

      <div className="mt-6 grid gap-5">
        {activeRoles.map((role) => (
          <article key={role.code} className="panel p-7">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-display text-2xl font-semibold text-brand-950">{role.title}</h3>
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Desir Solutions · posted {role.posted}
              </span>
            </div>
            <p className="mt-2 text-sm font-medium text-slate-700">
              {role.engagement} · {role.location} · {role.rate}
            </p>
            <p className="mt-1 text-sm text-slate-600">{role.duration}</p>

            <div className="mt-5 grid gap-6 lg:grid-cols-2">
              <div>
                <h4 className="text-sm font-semibold text-brand-950">Must-have</h4>
                <ul className="prose-list mt-3">
                  {role.mustHaves.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-brand-950">Nice-to-have</h4>
                <ul className="prose-list mt-3">
                  {role.niceToHaves.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6">
              <Button to="/candidates">Submit your profile for this role</Button>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
