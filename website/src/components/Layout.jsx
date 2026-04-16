import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Button } from './Button'
import { company, navItems } from '../data/siteContent'

function navClasses({ isActive }) {
  const base =
    'rounded-full px-3 py-2 text-sm font-medium transition hover:bg-white hover:text-brand-900'

  return isActive ? `${base} bg-white text-brand-950 shadow-sm` : `${base} text-slate-600`
}

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="relative">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-white/70 bg-sand-50/80 shadow-[0_14px_40px_rgba(12,32,51,0.06)] backdrop-blur-xl">
        <div className="shell flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="float-soft flex h-11 w-11 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#123c5a_0%,#19a974_140%)] text-sm font-display font-semibold text-white shadow-[0_16px_36px_rgba(12,32,51,0.2)]">
              DS
            </div>
            <div>
              <NavLink
                className="font-display text-lg font-semibold text-brand-950"
                onClick={() => setMenuOpen(false)}
                to="/"
              >
                {company.name}
              </NavLink>
              <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
                {company.headerTagline}
              </p>
            </div>
          </div>

          <button
            aria-controls="mobile-primary-navigation"
            aria-expanded={menuOpen}
            aria-label="Toggle navigation"
            className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 xl:hidden"
            onClick={() => setMenuOpen((current) => !current)}
            type="button"
          >
            Menu
          </button>

          <div className="hidden items-center gap-2 xl:flex">
            <nav
              aria-label="Primary"
              className="flex items-center gap-1 rounded-full border border-white/80 bg-white/68 p-1 shadow-[0_14px_34px_rgba(12,32,51,0.08)]"
            >
              {navItems.map((item) => (
                <NavLink key={item.to} className={navClasses} to={item.to}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <Button to="/contact">Talk to Our Team</Button>
          </div>
        </div>

        {menuOpen ? (
          <div className="shell pb-4 xl:hidden">
            <div className="panel space-y-3 p-4">
              <nav
                aria-label="Mobile primary"
                className="flex flex-col gap-2"
                id="mobile-primary-navigation"
              >
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    className={({ isActive }) => `${navClasses({ isActive })} text-left`}
                    onClick={() => setMenuOpen(false)}
                    to={item.to}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
              <Button className="w-full" onClick={() => setMenuOpen(false)} to="/contact">
                Talk to Our Team
              </Button>
            </div>
          </div>
        ) : null}
      </header>

      <Outlet />

      <footer className="footer-surface mt-20 border-t border-white/10 text-white">
        <div className="shell grid gap-10 py-10 xl:grid-cols-[1.2fr_1fr_1fr]">
          <div className="space-y-4">
            <p className="font-display text-2xl font-semibold text-white">{company.name}</p>
            <p className="max-w-md text-sm leading-7 text-white/72">
              Enterprise infrastructure, AI automation, managed IT expert solutions, and IT staff
              placement support for organizations that need execution with accountability.
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="capability-badge capability-badge-dark">Infrastructure</span>
              <span className="capability-badge capability-badge-dark">AI Automation</span>
              <span className="capability-badge capability-badge-dark">Managed IT</span>
              <span className="capability-badge capability-badge-dark">IT Staffing</span>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/45">
              Navigate
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm text-white/72">
              {navItems.map((item) => (
                <NavLink key={item.to} className="hover:text-white" to={item.to}>
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/45">
              Contact
            </p>
            <div className="space-y-2 text-sm text-white/72">
              <p>{company.location}</p>
              <p>
                <a className="hover:text-white" href={`mailto:${company.email}`}>
                  {company.email}
                </a>
              </p>
              <p>
                <a className="hover:text-white" href={`tel:${company.phone}`}>
                  {company.phone}
                </a>
              </p>
              <p>
                <NavLink className="hover:text-white" to="/terms-privacy">
                  Terms & privacy
                </NavLink>
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
