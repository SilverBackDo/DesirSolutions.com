import { useState } from 'react'
import { company } from '../data/siteContent'

const initialState = {
  name: '',
  email: '',
  company: '',
  environmentSize: '',
  problem: '',
  website: '',
}

function validate(values) {
  const errors = {}
  const trimmedName = values.name.trim()
  const trimmedEmail = values.email.trim()
  const trimmedCompany = values.company.trim()
  const trimmedProblem = values.problem.trim()

  if (trimmedName.length < 2) {
    errors.name = 'Enter the contact name you want Desir Solutions to reply to.'
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
    errors.email = 'Enter a valid business email address.'
  }

  if (trimmedCompany.length < 2) {
    errors.company = 'Enter the company name for this request.'
  }

  if (!values.environmentSize) {
    errors.environmentSize = 'Select the environment size closest to your current scope.'
  }

  if (trimmedProblem.length < 30) {
    errors.problem = 'Describe the current problem in at least 30 characters.'
  }

  return errors
}

export function ContactForm() {
  const [formData, setFormData] = useState(initialState)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState({ tone: 'idle', message: '' })
  const [submitting, setSubmitting] = useState(false)

  const endpoint = (import.meta.env.VITE_CONTACT_ENDPOINT || '/api/contact').trim()

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
    setErrors((current) => {
      if (!current[name]) {
        return current
      }

      const next = { ...current }
      delete next[name]
      return next
    })
  }

  function handleBlur(event) {
    const { name } = event.target
    const nextErrors = validate(formData)
    setErrors((current) => {
      if (!nextErrors[name] && !current[name]) {
        return current
      }

      const updated = { ...current }
      if (nextErrors[name]) {
        updated[name] = nextErrors[name]
      } else {
        delete updated[name]
      }
      return updated
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting) {
      return
    }

    const nextErrors = validate(formData)
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setStatus({
        tone: 'error',
        message: 'Correct the highlighted fields before submitting the request.',
      })
      return
    }

    setSubmitting(true)
    setErrors({})
    if (!endpoint) {
      setStatus({
        tone: 'error',
        message: `The web intake endpoint is not configured yet. Email ${company.email} to continue immediately or set VITE_CONTACT_ENDPOINT to a live intake service.`,
      })
      setSubmitting(false)
      return
    }

    setStatus({ tone: 'idle', message: 'Submitting your request...' })

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim(),
          company: formData.company.trim(),
          environment: formData.environmentSize,
          infrastructure_scope: formData.environmentSize,
          message: formData.problem.trim(),
          priority: 'Infrastructure assessment request',
          website: formData.website,
        }),
      })

      if (!response.ok) {
        throw new Error('Submission failed')
      }

      setFormData(initialState)
      setStatus({
        tone: 'success',
        message: 'Request received. Desir Solutions will respond within one business day.',
      })
    } catch {
      setStatus({
        tone: 'error',
        message: `The web intake endpoint is unavailable right now. Email ${company.email} to continue immediately or set VITE_CONTACT_ENDPOINT to a live intake service.`,
      })
    } finally {
      setSubmitting(false)
    }
  }

  const statusClasses = {
    idle: 'text-slate-500',
    success: 'text-emerald-700',
    error: 'text-red-700',
  }

  return (
    <form className="panel space-y-5 p-6 sm:p-8" noValidate onSubmit={handleSubmit}>
      <fieldset className="space-y-5" disabled={submitting}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-slate-700" htmlFor="name">
          Name
          <input
            aria-describedby={errors.name ? 'name-error' : undefined}
            aria-invalid={Boolean(errors.name)}
            autoComplete="name"
            className="field"
            id="name"
            maxLength="255"
            name="name"
            onBlur={handleBlur}
            value={formData.name}
            onChange={handleChange}
            required
          />
          {errors.name ? (
            <span className="field-error" id="name-error">
              {errors.name}
            </span>
          ) : null}
        </label>
          <label className="space-y-2 text-sm font-medium text-slate-700" htmlFor="email">
          Email
          <input
            aria-describedby={errors.email ? 'email-error' : undefined}
            aria-invalid={Boolean(errors.email)}
            autoComplete="email"
            className="field"
            type="email"
            id="email"
            maxLength="255"
            name="email"
            onBlur={handleBlur}
            value={formData.email}
            onChange={handleChange}
            required
          />
          {errors.email ? (
            <span className="field-error" id="email-error">
              {errors.email}
            </span>
          ) : null}
        </label>
          <label className="space-y-2 text-sm font-medium text-slate-700" htmlFor="company">
          Company
          <input
            aria-describedby={errors.company ? 'company-error' : undefined}
            aria-invalid={Boolean(errors.company)}
            autoComplete="organization"
            className="field"
            id="company"
            maxLength="255"
            name="company"
            onBlur={handleBlur}
            value={formData.company}
            onChange={handleChange}
            required
          />
          {errors.company ? (
            <span className="field-error" id="company-error">
              {errors.company}
            </span>
          ) : null}
        </label>
          <label
            className="space-y-2 text-sm font-medium text-slate-700"
            htmlFor="environmentSize"
          >
          Environment size
          <select
            aria-describedby={errors.environmentSize ? 'environment-error' : undefined}
            aria-invalid={Boolean(errors.environmentSize)}
            className="field"
            id="environmentSize"
            name="environmentSize"
            onBlur={handleBlur}
            value={formData.environmentSize}
            onChange={handleChange}
            required
          >
            <option value="">Select one</option>
            <option value="up-to-25-systems">Up to 25 servers or workloads</option>
            <option value="25-to-100-systems">25 to 100 servers or workloads</option>
            <option value="100-plus-systems">100+ servers or workloads</option>
            <option value="multi-site">Multi-site hybrid environment</option>
          </select>
          {errors.environmentSize ? (
            <span className="field-error" id="environment-error">
              {errors.environmentSize}
            </span>
          ) : null}
        </label>
        </div>

        <label className="space-y-2 text-sm font-medium text-slate-700" htmlFor="problem">
        Problem
        <textarea
          aria-describedby={errors.problem ? 'problem-error' : 'problem-help'}
          aria-invalid={Boolean(errors.problem)}
          className="field min-h-36"
          id="problem"
          maxLength="5000"
          name="problem"
          onBlur={handleBlur}
          value={formData.problem}
          onChange={handleChange}
          required
          placeholder="Describe the infrastructure or delivery issue, the systems involved, and what happens if it stays unresolved."
        />
        <span className="text-xs leading-6 text-slate-500" id="problem-help">
          Include the current blocker, the affected systems, and the urgency.
        </span>
        {errors.problem ? (
          <span className="field-error" id="problem-error">
            {errors.problem}
          </span>
        ) : null}
      </label>

        <div className="hidden" aria-hidden="true">
          <label>
            Website
            <input
              autoComplete="off"
              name="website"
              onChange={handleChange}
              tabIndex="-1"
              value={formData.website}
            />
          </label>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            className="inline-flex items-center justify-center rounded-full bg-brand-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={submitting}
            type="submit"
          >
            {submitting ? 'Submitting...' : 'Request the assessment'}
          </button>
          <p
            aria-live="polite"
            className={`text-sm ${statusClasses[status.tone]}`}
            role={status.tone === 'error' ? 'alert' : 'status'}
          >
            {status.message}
          </p>
        </div>
      </fieldset>
    </form>
  )
}
