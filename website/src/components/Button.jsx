import { Link } from 'react-router-dom'

const variants = {
  primary:
    'bg-brand-950 text-white shadow-[0_18px_40px_rgba(16,37,47,0.22)] hover:bg-brand-900',
  secondary:
    'border border-brand-900/15 bg-white text-brand-950 hover:border-brand-700 hover:text-brand-700',
  subtle:
    'border border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-300 hover:bg-white',
}

const sharedClasses =
  'inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition duration-200'

export function Button({ to, href, children, variant = 'primary', className = '' }) {
  const classes = `${sharedClasses} ${variants[variant]} ${className}`.trim()

  if (href) {
    return (
      <a className={classes} href={href}>
        {children}
      </a>
    )
  }

  return (
    <Link className={classes} to={to}>
      {children}
    </Link>
  )
}
