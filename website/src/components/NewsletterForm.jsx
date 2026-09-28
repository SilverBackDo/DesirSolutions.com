import { useState } from 'react'
import { company } from '../data/siteContent'

const initialState = { email: '', website: '' }

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

// Frontend half of newsletter capture. Backend: POST /api/newsletter/subscribe
// accepting { email, website } (website = honeypot), returning 202.
export function NewsletterForm({ variant = 'light', className = '' }) {
  const [formData, setFormData] = useState(initialState)
  const [status, setStatus] = useState({ tone: 'idle', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const endpoint = (import.meta.env.VITE_NEWSLETTER_ENDPOINT || '/api/newsletter/subscribe').trim()
  const isDark = variant === 'dark'

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting) {
      return
    }

    if (!isValidEmail(formData.email)) {
      setStatus({ tone: 'error', message: 'Enter a valid email address.' })
      return
    }

    setSubmitting(true)
    setStatus({ tone: 'idle', message: 'Submitting...' })

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          website: formData.website,
        }),
      })

      if (!response.ok) {
        throw new Error('Submission failed')
      }

      setFormData(initialState)
      setStatus({
        tone: 'success',
        message: "You're on the list. Watch your inbox for updates from Desir Solutions.",
      })
    } catch {
      setStatus({
        tone: 'error',
        message: `Newsletter signup is unavailable right now. Email ${company.email} to be added manually.`,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const inputClasses = isDark
    ? 'field border-white/15 bg-white/10 text-white placeholder:text-white/45 focus:border-white/40 focus:ring-white/10'
    : 'field'
  const buttonClasses = isDark
    ? 'inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-brand-950 transition hover:bg-sand-100 disabled:cursor-not-allowed disabled:opacity-60'
    : 'inline-flex items-center justify-center rounded-full bg-brand-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-60'
  const consentClasses = isDark ? 'text-white/55' : 'text-slate-500'
  const statusClasses = {
    idle: isDark ? 'text-white/60' : 'text-slate-500',
    success: isDark ? 'text-emerald-300' : 'text-emerald-700',
    error: isDark ? 'text-red-300' : 'text-red-700',
  }

  return (
    <form className={`space-y-3 ${className}`} noValidate onSubmit={handleSubmit}>
      <fieldset className="space-y-3" disabled={submitting}>
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="sr-only" htmlFor="newsletter-email">
            Email
          </label>
          <input
            autoComplete="email"
            className={`${inputClasses} sm:flex-1`}
            id="newsletter-email"
            name="email"
            onChange={handleChange}
            placeholder="you@company.com"
            required
            type="email"
            value={formData.email}
          />
          <button className={buttonClasses} disabled={submitting} type="submit">
            {submitting ? 'Submitting...' : 'Subscribe'}
          </button>
        </div>

        <div className="hidden" aria-hidden="true">
          <label htmlFor="newsletter-website">
            Website
            <input
              autoComplete="off"
              id="newsletter-website"
              name="website"
              onChange={handleChange}
              tabIndex="-1"
              value={formData.website}
            />
          </label>
        </div>
      </fieldset>

      <p className={`text-xs leading-5 ${consentClasses}`}>
        You&apos;re subscribing to the Desir Solutions newsletter; unsubscribe any time.
      </p>
      {status.message ? (
        <p
          aria-live="polite"
          className={`text-xs ${statusClasses[status.tone]}`}
          role={status.tone === 'error' ? 'alert' : 'status'}
        >
          {status.message}
        </p>
      ) : null}
    </form>
  )
}
