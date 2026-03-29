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

export function ContactForm() {
  const [formData, setFormData] = useState(initialState)
  const [status, setStatus] = useState({ tone: 'idle', message: '' })
  const [submitting, setSubmitting] = useState(false)

  const endpoint = import.meta.env.VITE_CONTACT_ENDPOINT || '/api/contact'

  function handleChange(event) {
    const { name, value } = event.target
    setFormData((current) => ({ ...current, [name]: value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting) {
      return
    }

    setSubmitting(true)
    setStatus({ tone: 'idle', message: 'Submitting your request...' })

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          company: formData.company,
          environment_size: formData.environmentSize,
          problem: formData.problem,
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
        message: `The web intake endpoint is unavailable right now. Email ${company.email} to continue immediately.`,
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
    <form className="panel space-y-5 p-6 sm:p-8" onSubmit={handleSubmit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 text-sm font-medium text-slate-700">
          Name
          <input
            className="field"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          Email
          <input
            className="field"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          Company
          <input
            className="field"
            name="company"
            value={formData.company}
            onChange={handleChange}
            required
          />
        </label>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          Environment size
          <select
            className="field"
            name="environmentSize"
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
        </label>
      </div>

      <label className="space-y-2 text-sm font-medium text-slate-700">
        Problem
        <textarea
          className="field min-h-36"
          name="problem"
          value={formData.problem}
          onChange={handleChange}
          required
          placeholder="Describe the infrastructure or delivery issue, the systems involved, and what happens if it stays unresolved."
        />
      </label>

      <div className="hidden" aria-hidden="true">
        <label>
          Website
          <input
            name="website"
            value={formData.website}
            onChange={handleChange}
            tabIndex="-1"
            autoComplete="off"
          />
        </label>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <button
          className="inline-flex items-center justify-center rounded-full bg-brand-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={submitting}
          type="submit"
        >
          {submitting ? 'Submitting...' : 'Request a conversation'}
        </button>
        <p className={`text-sm ${statusClasses[status.tone]}`}>{status.message}</p>
      </div>
    </form>
  )
}
