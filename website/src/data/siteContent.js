export const company = {
  name: 'Desir Solutions LLC',
  phone: '407-450-0008',
  email: 'contact@desirsolutions.com',
  legalEmail: 'legal@desirsolutions.com',
  billingEmail: 'invoices@desirsolutions.com',
  location: 'Maple Valley, Washington',
  websiteUrl: 'https://desirsolutions.com',
  githubPagesUrl: 'https://silverbackdo.github.io/DesirSolutions.com/',
}

export const navItems = [
  { label: 'Home', to: '/' },
  { label: 'Assessment Offer', to: '/assessment' },
  { label: 'Services', to: '/services' },
  { label: 'About', to: '/about' },
  { label: 'Trust', to: '/trust' },
  { label: 'Contact', to: '/contact' },
]

export const coreMetrics = [
  { value: '10 days', label: 'Flagship assessment timeline' },
  { value: '$4,500', label: 'Fixed-fee first engagement' },
  { value: '600+', label: 'Server-scale environment experience' },
  { value: '24 hours', label: 'Initial response commitment' },
]

export const pains = [
  'Linux and VMware backlog keeps slipping because the internal team is overloaded.',
  'Cloud, on-prem, and deployment tooling decisions are being made without a clear operating model.',
  'Automation exists in pieces, but not in a way that reduces delivery risk or dependency on one person.',
]

export const services = [
  {
    name: 'Infrastructure Assessment',
    summary:
      'A 10-business-day review of infrastructure, operations, and automation bottlenecks with a ranked action plan.',
    price: '$4,500 fixed fee',
    outcomes: [
      'Current-state operating summary',
      'Top-risk and quick-win register',
      '30-day action plan',
      'Recommended sprint or advisory path',
    ],
  },
  {
    name: 'Automation / DevOps Implementation',
    summary:
      'Scoped delivery for Terraform, Ansible, CI/CD, deployment cleanup, and runbook-driven execution.',
    price: '$12,000 to $25,000 typical sprint',
    outcomes: [
      'Infrastructure as code baseline',
      'Deployment workflow cleanup',
      'Repeatable operating procedures',
      'Defined handoff package',
    ],
  },
  {
    name: 'Fractional Infrastructure Leadership',
    summary:
      'Ongoing senior guidance for teams that need architecture ownership, delivery control, and prioritization without a full-time hire.',
    price: '$3,000 to $6,000 monthly',
    outcomes: [
      'Weekly delivery and risk review',
      'Architecture decision support',
      'Vendor and contractor coordination',
      'Executive-facing status reporting',
    ],
  },
]

export const founderProof = [
  'Founder-led consulting model with direct delivery ownership from discovery through handoff.',
  'Strong fit for hybrid infrastructure teams balancing Linux, VMware, cloud hosting, and automation debt.',
  'Experience translating technical backlog into practical business decisions for regulated and change-sensitive environments.',
]

export const assessmentTimeline = [
  {
    day: 'Day 1',
    title: 'Kickoff and scope confirmation',
    detail: 'Confirm the environment in scope, buyer priorities, dependencies, and key technical contacts.',
  },
  {
    day: 'Days 2-6',
    title: 'Environment and workflow review',
    detail: 'Review infrastructure, deployment patterns, operational gaps, and obvious failure points.',
  },
  {
    day: 'Day 8',
    title: 'Draft findings',
    detail: 'Deliver the first ranked risk list, quick wins, and areas that need a phase-two decision.',
  },
  {
    day: 'Day 10',
    title: 'Executive readout',
    detail: 'Finalize the assessment pack and align on whether to proceed to a sprint or advisory engagement.',
  },
]

export const trustControls = [
  {
    title: 'Lean hosting model',
    detail:
      'The public website is designed for an OCI VM and a containerized NGINX runtime. Administrative access is limited to approved operators only.',
  },
  {
    title: 'Documented commercial process',
    detail:
      'Client work is governed through a master agreement, a statement of work, and written change control instead of informal scope creep.',
  },
  {
    title: 'Practical data handling',
    detail:
      'The website collects business inquiry data only. It is not positioned as a customer data platform or a broad application processing environment.',
  },
]

export const faqs = [
  {
    question: 'Who is the best fit for the assessment?',
    answer:
      'IT directors, infrastructure managers, operations leaders, and owners at 20 to 500 employee companies with hybrid environments and not enough senior bandwidth.',
  },
  {
    question: 'What happens after the assessment?',
    answer:
      'Most good-fit buyers either move into a defined implementation sprint or retain Desir Solutions for weekly infrastructure leadership and delivery review.',
  },
  {
    question: 'What is not a fit?',
    answer:
      'Undefined transformation programs, help-desk work, and situations where the buyer wants unpaid architecture consulting before engaging commercially.',
  },
]
