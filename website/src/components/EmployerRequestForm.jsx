import { useState } from 'react'
import { company } from '../data/siteContent'

const initialState = {
  company: '',
  contactName: '',
  email: '',
  phone: '',
  employerRole: '',
  requestType: '',
  requestedRoles: '',
  headcount: '',
  deliveryModel: '',
  workModel: '',
  location: '',
  timeline: '',
  budgetBand: '',
  complianceRequirements: '',
  notes: '',
  website: '',
}

function validate(values) {
  const errors = {}

  if (values.company.trim().length < 2) {
    errors.company = 'Enter the company requesting support.'
  }
  if (values.contactName.trim().length < 2) {
    errors.contactName = 'Enter the primary business contact name.'
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = 'Enter a valid business email address.'
  }
  if (values.requestType.trim().length < 2) {
    errors.requestType = 'Select the request type that best matches this need.'
  }
  if (values.requestedRoles.trim().length < 10) {
    errors.requestedRoles = 'Describe the requested roles or capability need.'
  }
  if (!values.headcount || Number(values.headcount) < 1) {
    errors.headcount = 'Enter the expected headcount for this request.'
  }

  return errors
}

export function EmployerRequestForm() {
  const [formData, setFormData] = useState(initialState)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState({ tone: 'idle', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const endpoint = (import.meta.env.VITE_EMPLOYER_REQUEST_ENDPOINT || '/api/employer-requests').trim()

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
        message: 'Correct the highlighted fields before submitting the employer request.',
      })
      return
    }

    setSubmitting(true)
    setErrors({})
    setStatus({ tone: 'idle', message: 'Submitting your employer request...' })

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          company_name: formData.company.trim(),
          contact_name: formData.contactName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || null,
          employer_role: formData.employerRole.trim() || null,
          request_type: formData.requestType,
          requested_roles: formData.requestedRoles.trim(),
          headcount: Number(formData.headcount),
          delivery_model: formData.deliveryModel || null,
          work_model: formData.workModel || null,
          location: formData.location.trim() || null,
          timeline: formData.timeline.trim() || null,
          budget_band: formData.budgetBand || null,
          compliance_requirements: formData.complianceRequirements.trim() || null,
          notes: formData.notes.trim() || null,
          website: formData.website,
        }),
      })

      if (!response.ok) {
        throw new Error('Submission failed')
      }

      setFormData(initialState)
      setStatus({
        tone: 'success',
        message:
          'Employer request received. Desir Solutions will review the need and respond within one business day.',
      })
    } catch {
      setStatus({
        tone: 'error',
        message: `The employer intake endpoint is unavailable right now. Email ${company.email} to continue immediately.`,
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
    <form
      className="panel space-y-5 p-6 sm:p-8"
      id="employer-request-form"
      noValidate
      onSubmit={handleSubmit}
    >
      <fieldset className="space-y-5" disabled={submitting}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-slate-700" htmlFor="company">
            Company
            <input
              aria-describedby={errors.company ? 'employer-company-error' : undefined}
              aria-invalid={Boolean(errors.company)}
              autoComplete="organization"
              className="field"
              id="company"
              name="company"
              onBlur={handleBlur}
              onChange={handleChange}
              required
              value={formData.company}
            />
            {errors.company ? (
              <span className="field-error" id="employer-company-error">
                {errors.company}
              </span>
            ) : null}
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700" htmlFor="contactName">
            Contact name
            <input
              aria-describedby={errors.contactName ? 'employer-contact-error' : undefined}
              aria-invalid={Boolean(errors.contactName)}
              autoComplete="name"
              className="field"
              id="contactName"
              name="contactName"
              onBlur={handleBlur}
              onChange={handleChange}
              required
              value={formData.contactName}
            />
            {errors.contactName ? (
              <span className="field-error" id="employer-contact-error">
                {errors.contactName}
              </span>
            ) : null}
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700" htmlFor="email">
            Email
            <input
              aria-describedby={errors.email ? 'employer-email-error' : undefined}
              aria-invalid={Boolean(errors.email)}
              autoComplete="email"
              className="field"
              id="email"
              name="email"
              onBlur={handleBlur}
              onChange={handleChange}
              required
              type="email"
              value={formData.email}
            />
            {errors.email ? (
              <span className="field-error" id="employer-email-error">
                {errors.email}
              </span>
            ) : null}
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700" htmlFor="phone">
            Phone
            <input
              autoComplete="tel"
              className="field"
              id="phone"
              name="phone"
              onChange={handleChange}
              value={formData.phone}
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700" htmlFor="employerRole">
            Your role
            <input
              className="field"
              id="employerRole"
              name="employerRole"
              onChange={handleChange}
              value={formData.employerRole}
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700" htmlFor="requestType">
            Request type
            <select
              aria-describedby={errors.requestType ? 'request-type-error' : undefined}
              aria-invalid={Boolean(errors.requestType)}
              className="field"
              id="requestType"
              name="requestType"
              onBlur={handleBlur}
              onChange={handleChange}
              required
              value={formData.requestType}
            >
              <option value="">Select one</option>
              <option value="request_talent">Request talent</option>
              <option value="request_contractor">Request contractor</option>
              <option value="request_consulting_team">Request solutions team</option>
              <option value="workforce_augmentation">Workforce augmentation</option>
              <option value="project_staffing">Project staffing</option>
            </select>
            {errors.requestType ? (
              <span className="field-error" id="request-type-error">
                {errors.requestType}
              </span>
            ) : null}
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700" htmlFor="headcount">
            Headcount
            <input
              aria-describedby={errors.headcount ? 'headcount-error' : undefined}
              aria-invalid={Boolean(errors.headcount)}
              className="field"
              id="headcount"
              min="1"
              name="headcount"
              onBlur={handleBlur}
              onChange={handleChange}
              required
              type="number"
              value={formData.headcount}
            />
            {errors.headcount ? (
              <span className="field-error" id="headcount-error">
                {errors.headcount}
              </span>
            ) : null}
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700" htmlFor="deliveryModel">
            Delivery model
            <select
              className="field"
              id="deliveryModel"
              name="deliveryModel"
              onChange={handleChange}
              value={formData.deliveryModel}
            >
              <option value="">Select one</option>
              <option value="consulting_sprint">Project delivery sprint</option>
              <option value="fractional_leadership">Fractional leadership</option>
              <option value="contract_delivery">Contract delivery support</option>
              <option value="blended_team">Blended delivery + staffing</option>
            </select>
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700" htmlFor="workModel">
            Work model
            <select
              className="field"
              id="workModel"
              name="workModel"
              onChange={handleChange}
              value={formData.workModel}
            >
              <option value="">Select one</option>
              <option value="remote">Remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="onsite">On-site</option>
            </select>
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700" htmlFor="location">
            Location preference
            <input
              className="field"
              id="location"
              name="location"
              onChange={handleChange}
              value={formData.location}
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700" htmlFor="timeline">
            Timeline
            <input
              className="field"
              id="timeline"
              name="timeline"
              onChange={handleChange}
              value={formData.timeline}
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-slate-700" htmlFor="budgetBand">
            Budget band
            <select
              className="field"
              id="budgetBand"
              name="budgetBand"
              onChange={handleChange}
              value={formData.budgetBand}
            >
              <option value="">Select one</option>
              <option value="under_10k">Under $10k</option>
              <option value="10k_to_25k">$10k to $25k</option>
              <option value="25k_to_50k">$25k to $50k</option>
              <option value="50k_plus">$50k+</option>
            </select>
          </label>
        </div>

        <label className="space-y-2 text-sm font-medium text-slate-700" htmlFor="requestedRoles">
          Requested roles or capability need
          <textarea
            aria-describedby={errors.requestedRoles ? 'requested-roles-error' : undefined}
            aria-invalid={Boolean(errors.requestedRoles)}
            className="field min-h-32"
            id="requestedRoles"
            name="requestedRoles"
            onBlur={handleBlur}
            onChange={handleChange}
            required
            value={formData.requestedRoles}
          />
          {errors.requestedRoles ? (
            <span className="field-error" id="requested-roles-error">
              {errors.requestedRoles}
            </span>
          ) : null}
        </label>

        <label className="space-y-2 text-sm font-medium text-slate-700" htmlFor="complianceRequirements">
          Compliance or security requirements
          <textarea
            className="field min-h-24"
            id="complianceRequirements"
            name="complianceRequirements"
            onChange={handleChange}
            value={formData.complianceRequirements}
          />
        </label>

        <label className="space-y-2 text-sm font-medium text-slate-700" htmlFor="notes">
          Notes
          <textarea
            className="field min-h-28"
            id="notes"
            name="notes"
            onChange={handleChange}
            value={formData.notes}
          />
        </label>

        <label className="hidden" htmlFor="website">
          Website
          <input
            autoComplete="off"
            id="website"
            name="website"
            onChange={handleChange}
            tabIndex="-1"
            value={formData.website}
          />
        </label>
      </fieldset>

      <div className="space-y-3">
        <button
          className="inline-flex w-full items-center justify-center rounded-full bg-brand-950 px-5 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(16,37,47,0.22)] transition hover:bg-brand-900 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={submitting}
          type="submit"
        >
          {submitting ? 'Submitting request...' : 'Submit employer request'}
        </button>
        {status.message ? (
          <p className={`text-sm ${statusClasses[status.tone]}`}>{status.message}</p>
        ) : null}
      </div>
    </form>
  )
}
