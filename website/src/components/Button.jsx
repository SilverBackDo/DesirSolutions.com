import { Link } from 'react-router-dom'

const variants = {
  primary:
    'border border-transparent bg-[linear-gradient(135deg,#123c5a_0%,#1f6f95_48%,#19a974_120%)] text-white shadow-[0_18px_40px_rgba(12,32,51,0.22)] hover:-translate-y-0.5 hover:shadow-[0_24px_48px_rgba(12,32,51,0.24)] hover:brightness-105 active:translate-y-0',
  secondary:
    'border border-brand-900/15 bg-white/95 text-brand-950 hover:-translate-y-0.5 hover:border-accent-500/60 hover:bg-accent-100/40 hover:text-brand-900 hover:shadow-[0_16px_34px_rgba(12,32,51,0.08)] active:translate-y-0',
  subtle:
    'border border-slate-200 bg-slate-50 text-slate-700 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white active:translate-y-0',
}

const sharedClasses =
  'inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition duration-300'

export function Button({ to, href, children, variant = 'primary', className = '', ...props }) {
  const classes = `${sharedClasses} ${variants[variant]} ${className}`.trim()

  if (href) {
    return (
      <a className={classes} href={href} {...props}>
        {children}
      </a>
    )
  }

  return (
    <Link className={classes} to={to} {...props}>
      {children}
    </Link>
  )
}
