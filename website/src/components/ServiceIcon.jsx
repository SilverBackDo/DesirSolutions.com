const icons = {
  infrastructure: (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <rect height="5" rx="1.5" width="16" x="4" y="4" />
      <rect height="5" rx="1.5" width="16" x="4" y="15" />
      <path d="M8 9.5v5M12 9.5v5M16 9.5v5" strokeLinecap="round" />
    </svg>
  ),
  automation: (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <circle cx="6.5" cy="6.5" r="2.5" />
      <circle cx="17.5" cy="6.5" r="2.5" />
      <circle cx="12" cy="17.5" r="2.5" />
      <path d="M8.7 7.6 15.2 7.6M8 8.5l2.6 6.3M16 8.5l-2.6 6.3" strokeLinecap="round" />
    </svg>
  ),
  managed: (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="M12 3.5 18.5 6v5.7c0 4-2.3 6.8-6.5 8.8-4.2-2-6.5-4.8-6.5-8.8V6L12 3.5Z" />
      <path d="m9.2 12.2 1.9 1.9 3.8-4.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  staffing: (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <circle cx="8" cy="8" r="2.5" />
      <circle cx="16.5" cy="7.5" r="2" />
      <path d="M4.5 18c.4-2.7 2.2-4.4 4.9-4.4 2.8 0 4.6 1.7 5 4.4" strokeLinecap="round" />
      <path d="M14.2 17.6c.3-1.9 1.6-3 3.4-3 1.8 0 3 1.1 3.3 3" strokeLinecap="round" />
    </svg>
  ),
}

export function ServiceIcon({ name, theme = 'light' }) {
  const classes = theme === 'dark' ? 'service-icon service-icon-dark' : 'service-icon'

  return <div className={classes}>{icons[name] ?? icons.infrastructure}</div>
}
