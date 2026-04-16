export function SectionIntro({ eyebrow, title, copy, align = 'left', theme = 'light' }) {
  const alignment = align === 'center' ? 'mx-auto text-center' : ''
  const eyebrowClasses = theme === 'dark' ? 'eyebrow eyebrow-dark' : 'eyebrow'
  const titleClasses =
    theme === 'dark'
      ? 'font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl'
      : 'section-title'
  const copyClasses =
    theme === 'dark'
      ? 'max-w-3xl text-base leading-7 text-white/78 sm:text-lg'
      : 'section-copy'

  return (
    <div className={`space-y-4 ${alignment}`}>
      {eyebrow ? <span className={eyebrowClasses}>{eyebrow}</span> : null}
      <div className="space-y-3">
        <h2 className={titleClasses}>{title}</h2>
        {copy ? <p className={copyClasses}>{copy}</p> : null}
      </div>
    </div>
  )
}
