import { useState } from 'react'
import { company } from '../data/siteContent'

const initialState = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  targetRole: '',
  location: '',
  workAuthorization: '',
  yearsExperience: '',
  availabilityDate: '',
  compensationExpectation: '',
  compensationType: '',
  remotePreference: '',
  onsitePreference: '',
  relocationPreference: '',
  linkedinUrl: '',
  portfolioUrl: '',
  summary: '',
  workHistorySummary: '',
  website: '',
}

const initialSkill = { skillName: '', proficiencyLevel: '', yearsExperience: '' }
const initialCertification = { certificationName: '' }

function validate(values, skills, certifications) {
  const errors = {}

  if (values.firstName.trim().length < 2) {
    errors.firstName = 'Enter your first name.'
  }
  if (values.lastName.trim().length < 2) {
    errors.lastName = 'Enter your last name.'
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = 'Enter a valid email address.'
  }
  if (values.targetRole.trim().length < 2) {
    errors.targetRole = 'Enter the target role you want to be considered for.'
  }
  if (values.summary.trim().length < 30) {
    errors.summary = 'Write a short professional summary of at least 30 characters.'
  }
  if (values.workHistorySummary.trim().length < 40) {
    errors.workHistorySummary = 'Provide a work history summary of at least 40 characters.'
  }
  if (skills.filter((item) => item.skillName.trim()).length === 0) {
    errors.skills = 'Add at least one skill.'
  }
  if (certifications.filter((item) => item.certificationName.trim()).length === 0) {
    errors.certifications = 'Add at least one certification or relevant credential.'
  }

  return errors
}

export function CandidateProfileForm() {
  const [formData, setFormData] = useState(initialState)
  const [skills, setSkills] = useState([{ ...initialSkill }])
  const [certifications, setCertifications] = useState([{ ...initialCertification }])
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState({ tone: 'idle', message: '' })
  const [submitting, setSubmitting] = useState(false)
  const endpoint = (import.meta.env.VITE_CANDIDATE_PROFILE_ENDPOINT || '/api/candidate-profiles').trim()

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

  function handleSkillChange(index, field, value) {
    setSkills((current) =>
      current.map((item, itemIndex) => (itemIndex === index ? { ...item, [field]: value } : item))
    )
    setErrors((current) => {
      if (!current.skills) {
        return current
      }
      const next = { ...current }
      delete next.skills
      return next
    })
  }

  function handleCertificationChange(index, value) {
    setCertifications((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, certificationName: value } : item
      )
    )
    setErrors((current) => {
      if (!current.certifications) {
        return current
      }
      const next = { ...current }
      delete next.certifications
      return next
    })
  }

  function addSkill() {
    setSkills((current) => [...current, { ...initialSkill }])
  }

  function removeSkill(index) {
    setSkills((current) => (current.length === 1 ? current : current.filter((_, i) => i !== index)))
  }

  function addCertification() {
    setCertifications((current) => [...current, { ...initialCertification }])
  }

  function removeCertification(index) {
    setCertifications((current) =>
      current.length === 1 ? current : current.filter((_, i) => i !== index)
    )
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting) {
      return
    }

    const nextErrors = validate(formData, skills, certifications)
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      setStatus({
        tone: 'error',
        message: 'Correct the highlighted fields before submitting your profile.',
      })
      return
    }

    setSubmitting(true)
    setErrors({})
    setStatus({ tone: 'idle', message: 'Submitting your profile...' })

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          first_name: formData.firstName.trim(),
          last_name: formData.lastName.trim(),
          email: formData.email.trim(),
          phone: formData.phone.trim() || null,
          target_role: formData.targetRole.trim(),
          location: formData.location.trim() || null,
          work_authorization: formData.workAuthorization.trim() || null,
          years_experience: formData.yearsExperience ? Number(formData.yearsExperience) : null,
          availability_date: formData.availabilityDate || null,
          compensation_expectation: formData.compensationExpectation
            ? Number(formData.compensationExpectation)
            : null,
          compensation_type: formData.compensationType || null,
          remote_preference: formData.remotePreference || null,
          onsite_preference: formData.onsitePreference || null,
          relocation_preference: formData.relocationPreference || null,
          linkedin_url: formData.linkedinUrl.trim() || null,
          portfolio_url: formData.portfolioUrl.trim() || null,
          summary: formData.summary.trim(),
          work_history_summary: formData.workHistorySummary.trim(),
          website: formData.website,
          skills: skills
            .filter((item) => item.skillName.trim())
            .map((item) => ({
              skill_name: item.skillName.trim(),
              proficiency_level: item.proficiencyLevel || null,
              years_experience: item.yearsExperience ? Number(item.yearsExperience) : null,
            })),
          certifications: certifications
            .filter((item) => item.certificationName.trim())
            .map((item) => ({
              certification_name: item.certificationName.trim(),
            })),
        }),
      })

      if (!response.ok) {
        throw new Error('Submission failed')
      }

      setFormData(initialState)
      setSkills([{ ...initialSkill }])
      setCertifications([{ ...initialCertification }])
      setStatus({
        tone: 'success',
        message:
          'Profile received. Desir Solutions will review it against active demand and follow up when there is a fit.',
      })
    } catch {
      setStatus({
        tone: 'error',
        message: `The candidate intake endpoint is unavailable right now. Email ${company.email} if you need to follow up manually.`,
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
      className="panel space-y-6 p-6 sm:p-8"
      id="candidate-profile-form"
      noValidate
      onSubmit={handleSubmit}
    >
      <fieldset className="space-y-5" disabled={submitting}>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-medium text-slate-700" htmlFor="firstName">
            First name
            <input
              className="field"
              id="firstName"
              name="firstName"
              onChange={handleChange}
              value={formData.firstName}
            />
            {errors.firstName ? <span className="field-error">{errors.firstName}</span> : null}
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700" htmlFor="lastName">
            Last name
            <input
              className="field"
              id="lastName"
              name="lastName"
              onChange={handleChange}
              value={formData.lastName}
            />
            {errors.lastName ? <span className="field-error">{errors.lastName}</span> : null}
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700" htmlFor="candidateEmail">
            Email
            <input
              className="field"
              id="candidateEmail"
              name="email"
              onChange={handleChange}
              type="email"
              value={formData.email}
            />
            {errors.email ? <span className="field-error">{errors.email}</span> : null}
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700" htmlFor="candidatePhone">
            Phone
            <input
              className="field"
              id="candidatePhone"
              name="phone"
              onChange={handleChange}
              value={formData.phone}
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700" htmlFor="targetRole">
            Target role
            <input
              className="field"
              id="targetRole"
              name="targetRole"
              onChange={handleChange}
              value={formData.targetRole}
            />
            {errors.targetRole ? <span className="field-error">{errors.targetRole}</span> : null}
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700" htmlFor="location">
            Location
            <input
              className="field"
              id="location"
              name="location"
              onChange={handleChange}
              value={formData.location}
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700" htmlFor="workAuthorization">
            Work authorization
            <input
              className="field"
              id="workAuthorization"
              name="workAuthorization"
              onChange={handleChange}
              value={formData.workAuthorization}
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700" htmlFor="yearsExperience">
            Years experience
            <input
              className="field"
              id="yearsExperience"
              min="0"
              name="yearsExperience"
              onChange={handleChange}
              step="0.5"
              type="number"
              value={formData.yearsExperience}
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700" htmlFor="availabilityDate">
            Availability date
            <input
              className="field"
              id="availabilityDate"
              name="availabilityDate"
              onChange={handleChange}
              type="date"
              value={formData.availabilityDate}
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700" htmlFor="compensationExpectation">
            Compensation expectation
            <input
              className="field"
              id="compensationExpectation"
              min="0"
              name="compensationExpectation"
              onChange={handleChange}
              step="0.01"
              type="number"
              value={formData.compensationExpectation}
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700" htmlFor="compensationType">
            Compensation type
            <select
              className="field"
              id="compensationType"
              name="compensationType"
              onChange={handleChange}
              value={formData.compensationType}
            >
              <option value="">Select one</option>
              <option value="hourly">Hourly</option>
              <option value="salary">Salary</option>
              <option value="project">Project / fixed fee</option>
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700" htmlFor="remotePreference">
            Remote preference
            <select
              className="field"
              id="remotePreference"
              name="remotePreference"
              onChange={handleChange}
              value={formData.remotePreference}
            >
              <option value="">Select one</option>
              <option value="remote_only">Remote only</option>
              <option value="remote_preferred">Remote preferred</option>
              <option value="flexible">Flexible</option>
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700" htmlFor="onsitePreference">
            On-site preference
            <select
              className="field"
              id="onsitePreference"
              name="onsitePreference"
              onChange={handleChange}
              value={formData.onsitePreference}
            >
              <option value="">Select one</option>
              <option value="not_available">Not available</option>
              <option value="limited">Limited travel / on-site</option>
              <option value="available">Available for on-site work</option>
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700" htmlFor="relocationPreference">
            Relocation preference
            <select
              className="field"
              id="relocationPreference"
              name="relocationPreference"
              onChange={handleChange}
              value={formData.relocationPreference}
            >
              <option value="">Select one</option>
              <option value="no">No relocation</option>
              <option value="maybe">Open to discussion</option>
              <option value="yes">Willing to relocate</option>
            </select>
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700" htmlFor="linkedinUrl">
            LinkedIn URL
            <input
              className="field"
              id="linkedinUrl"
              name="linkedinUrl"
              onChange={handleChange}
              value={formData.linkedinUrl}
            />
          </label>
          <label className="space-y-2 text-sm font-medium text-slate-700" htmlFor="portfolioUrl">
            Portfolio URL
            <input
              className="field"
              id="portfolioUrl"
              name="portfolioUrl"
              onChange={handleChange}
              value={formData.portfolioUrl}
            />
          </label>
        </div>

        <label className="space-y-2 text-sm font-medium text-slate-700" htmlFor="summary">
          Professional summary
          <textarea
            className="field min-h-28"
            id="summary"
            name="summary"
            onChange={handleChange}
            value={formData.summary}
          />
          {errors.summary ? <span className="field-error">{errors.summary}</span> : null}
        </label>

        <label className="space-y-2 text-sm font-medium text-slate-700" htmlFor="workHistorySummary">
          Work history summary
          <textarea
            className="field min-h-32"
            id="workHistorySummary"
            name="workHistorySummary"
            onChange={handleChange}
            value={formData.workHistorySummary}
          />
          {errors.workHistorySummary ? (
            <span className="field-error">{errors.workHistorySummary}</span>
          ) : null}
        </label>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-display text-2xl font-semibold text-brand-950">Skills</h3>
            <button
              className="rounded-full border border-brand-900/15 bg-white px-4 py-2 text-sm font-semibold text-brand-950 transition hover:border-brand-700 hover:text-brand-700"
              onClick={addSkill}
              type="button"
            >
              Add skill
            </button>
          </div>
          <div className="space-y-4">
            {skills.map((skill, index) => (
              <div key={`skill-${index}`} className="grid gap-4 rounded-[24px] bg-sand-50 p-4 lg:grid-cols-[1.2fr_0.8fr_0.8fr_auto]">
                <input
                  className="field"
                  placeholder="Skill name"
                  value={skill.skillName}
                  onChange={(event) => handleSkillChange(index, 'skillName', event.target.value)}
                />
                <select
                  className="field"
                  value={skill.proficiencyLevel}
                  onChange={(event) =>
                    handleSkillChange(index, 'proficiencyLevel', event.target.value)
                  }
                >
                  <option value="">Proficiency</option>
                  <option value="foundational">Foundational</option>
                  <option value="working">Working</option>
                  <option value="advanced">Advanced</option>
                  <option value="expert">Expert</option>
                </select>
                <input
                  className="field"
                  min="0"
                  placeholder="Years"
                  step="0.5"
                  type="number"
                  value={skill.yearsExperience}
                  onChange={(event) =>
                    handleSkillChange(index, 'yearsExperience', event.target.value)
                  }
                />
                <button
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
                  onClick={() => removeSkill(index)}
                  type="button"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          {errors.skills ? <span className="field-error">{errors.skills}</span> : null}
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h3 className="font-display text-2xl font-semibold text-brand-950">Certifications</h3>
            <button
              className="rounded-full border border-brand-900/15 bg-white px-4 py-2 text-sm font-semibold text-brand-950 transition hover:border-brand-700 hover:text-brand-700"
              onClick={addCertification}
              type="button"
            >
              Add certification
            </button>
          </div>
          <div className="space-y-4">
            {certifications.map((certification, index) => (
              <div key={`certification-${index}`} className="grid gap-4 rounded-[24px] bg-sand-50 p-4 lg:grid-cols-[1fr_auto]">
                <input
                  className="field"
                  placeholder="Certification or credential"
                  value={certification.certificationName}
                  onChange={(event) => handleCertificationChange(index, event.target.value)}
                />
                <button
                  className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white"
                  onClick={() => removeCertification(index)}
                  type="button"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          {errors.certifications ? (
            <span className="field-error">{errors.certifications}</span>
          ) : null}
        </div>

        <label className="hidden" htmlFor="candidateWebsite">
          Website
          <input
            id="candidateWebsite"
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
          {submitting ? 'Submitting profile...' : 'Submit candidate profile'}
        </button>
        {status.message ? (
          <p className={`text-sm ${statusClasses[status.tone]}`}>{status.message}</p>
        ) : null}
      </div>
    </form>
  )
}
