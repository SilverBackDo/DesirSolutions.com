import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { Button } from './Button'
import { company, navItems } from '../data/siteContent'

function navClasses({ isActive }) {
  const base =
    'rounded-full px-3 py-2 text-sm font-medium transition hover:bg-white/70 hover:text-brand-900'

  return isActive ? `${base} bg-white text-brand-950 shadow-sm` : `${base} text-slate-600`
}

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="relative">
      <header className="sticky top-0 z-40 border-b border-white/60 bg-sand-50/90 backdrop-blur-xl">
        <div className="shell flex items-center justify-between py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-950 text-sm font-display font-semibold text-white">
              DS
            </div>
            <div>
              <NavLink className="font-display text-lg font-semibold text-brand-950" to="/">
                {company.name}
              </NavLink>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500">
                Founder-led infrastructure consulting
              </p>
            </div>
          </div>

          <button
            aria-label="Toggle navigation"
            className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 lg:hidden"
            onClick={() => setMenuOpen((current) => !current)}
            type="button"
          >
            Menu
          </button>

          <div className="hidden items-center gap-2 lg:flex">
            <nav className="flex items-center gap-1 rounded-full border border-white/80 bg-white/60 p-1 shadow-sm">
              {navItems.map((item) => (
                <NavLink key={item.to} className={navClasses} to={item.to}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
            <Button to="/contact">Request the Assessment</Button>
          </div>
        </div>

        {menuOpen ? (
          <div className="shell pb-4 lg:hidden">
            <div className="panel space-y-3 p-4">
              <nav className="flex flex-col gap-2">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    className={navClasses}
                    onClick={() => setMenuOpen(false)}
                    to={item.to}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
              <Button className="w-full" to="/contact">
                Request the Assessment
              </Button>
            </div>
          </div>
        ) : null}
      </header>

      <Outlet />

      <footer className="border-t border-slate-200/80 bg-white/80">
        <div className="shell grid gap-10 py-10 lg:grid-cols-[1.4fr_1fr_1fr]">
          <div className="space-y-4">
            <p className="font-display text-2xl font-semibold text-brand-950">{company.name}</p>
            <p className="max-w-md text-sm leading-7 text-slate-600">
              Infrastructure assessments, automation implementation, and fractional
              infrastructure leadership for understaffed IT teams managing Linux, VMware,
              cloud, and delivery backlog.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Navigate
            </p>
            <div className="flex flex-col gap-2 text-sm text-slate-600">
              {navItems.map((item) => (
                <NavLink key={item.to} className="hover:text-brand-900" to={item.to}>
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
              Contact
            </p>
            <div className="space-y-2 text-sm text-slate-600">
              <p>{company.location}</p>
              <p>
                <a className="hover:text-brand-900" href={`mailto:${company.email}`}>
                  {company.email}
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
      </footer>
    </div>
  )
}
