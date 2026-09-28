export const company = {
  name: 'Desir Solutions LLC',
  tagline: 'Focused IT Talent Placement, Infrastructure Stability, Automation, and Security Readiness',
  headerTagline: 'Infrastructure Stability & Automation',
  phone: '407-450-0008',
  email: 'contact@desirsolutions.com',
  legalEmail: 'legal@desirsolutions.com',
  billingEmail: 'invoices@desirsolutions.com',
  privacyEmail: 'privacy@desirsolutions.com',
  location: 'Maple Valley, Washington',
  websiteUrl: 'https://desirsolutions.com',
}

// Flat list retained for the footer sitemap and prerender crawling.
export const navItems = [
  { label: 'Home', to: '/' },
  { label: 'AI Continuity', to: '/ai-continuity' },
  { label: 'Modernization', to: '/modernization' },
  { label: 'DevOps', to: '/devops' },
  { label: 'Cloud', to: '/cloud' },
  { label: 'Compliance', to: '/compliance' },
  { label: 'Talent', to: '/talent' },
  { label: 'Assessment', to: '/assessment' },
  { label: 'Proof', to: '/proof' },
  { label: 'Services', to: '/services' },
  { label: 'Employers', to: '/employers' },
  { label: 'Candidates', to: '/candidates' },
  { label: 'Careers', to: '/careers' },
  { label: 'Engagement', to: '/engagement' },
  { label: 'About', to: '/about' },
  { label: 'Trust', to: '/trust' },
  { label: 'Contact', to: '/contact' },
]

// Grouped dropdown/mega-menu model for the primary header.
// Home is a direct link; each group renders a compact mega-menu panel.
export const navGroups = [
  {
    label: 'Solutions',
    microcopy:
      'Plan resilient infrastructure, automation, and AI-enabled operations without losing control of production systems.',
    items: [
      { label: 'AI Continuity', to: '/ai-continuity', description: 'Continuity planning, fallback workflows, AI governance readiness, local-first automation, and operational control for teams adopting AI.' },
      { label: 'Modernization', to: '/modernization', description: 'Linux, VMware, hybrid-cloud, legacy platform, and modernization backlog assessment.' },
      { label: 'DevOps', to: '/devops', description: 'CI/CD, Terraform, Ansible, GitOps, release hygiene, runbook automation, and deployment reliability.' },
      { label: 'Cloud', to: '/cloud', description: 'Hybrid-cloud readiness, migration planning, DNS/TLS/network validation, cost-risk review, and operating-model clarity.' },
      { label: 'Compliance', to: '/compliance', description: 'Audit evidence, access review, backup/DR posture, operational controls, and risk-ranked remediation.' },
      { label: 'Services', to: '/services', description: 'The complete Desir Solutions service model: assessment, proof, implementation, support, and talent coverage.' },
    ],
  },
  {
    label: 'Assessment',
    microcopy: 'Turn backlog, drift, and automation pressure into a ranked decision package.',
    items: [
      { label: 'Assessment', to: '/assessment', description: 'The flagship Infrastructure Stability & Automation Assessment: fixed-scope entry engagement, 10 business days, evidence-first delivery.' },
      { label: 'Proof', to: '/proof', description: 'How findings, screenshots, configs, risk notes, and recommendations become a decision package.' },
      { label: 'Engagement', to: '/engagement', description: 'How the client journey moves from intake to assessment, proof review, implementation, support, or talent coverage.' },
    ],
  },
  {
    label: 'Talent',
    microcopy: 'Contractor placement leads the conversation — infrastructure, automation, and support follow when the work calls for it.',
    items: [
      { label: 'Talent', to: '/talent', description: 'How Desir Solutions leads contractor coverage when the delivery need is clear — with assessment findings feeding the shortlist when it is not.' },
      { label: 'Employers', to: '/employers', description: 'For companies needing infrastructure help, modernization support, DevOps coverage, or delivery-aligned contractors.' },
      { label: 'Candidates', to: '/candidates', description: 'Structured candidate intake for infrastructure, DevOps, automation, Linux, VMware, cloud, compliance, and delivery roles.' },
      { label: 'Careers', to: '/careers', description: 'Future hiring, collaboration, and contractor interest path.' },
    ],
  },
  {
    label: 'Company',
    microcopy: 'Evidence-first delivery with clear access boundaries and practical operator discipline.',
    items: [
      { label: 'About', to: '/about', description: 'Desir Solutions as a practical infrastructure, automation, modernization, compliance-readiness, and talent-support services company.' },
      { label: 'Trust', to: '/trust', description: 'Security posture, privacy, production access discipline, assessment controls, evidence handling, and client trust practices.' },
      { label: 'Contact', to: '/contact', description: 'Public inquiry path connected to the backend CRM intake flow.' },
    ],
  },
]

// AI Continuity & Failover Engineering — assessment-led practice (not a shipped product).
export const aiContinuity = {
  eyebrow: 'AI Continuity & Failover Engineering',
  headline: "Keep AI running when the vendor — or the cloud — doesn't.",
  summary:
    'DesirSolutions delivers AI continuity as a managed engineering practice: multi-vendor failover with on-prem fallback for regulated workloads. Start with the AI Resilience Assessment, scoped after proof.',
  outages: [
    { vendor: 'OpenAI', detail: '~15-hour global outage (Jun 10, 2025)' },
    { vendor: 'AWS us-east-1', detail: '~15 hours, cascaded across services (Oct 19–20, 2025)' },
    { vendor: 'Azure / Copilot', detail: '~7 hours (Oct 29, 2025)' },
    { vendor: 'Cloudflare', detail: 'took ChatGPT and Claude offline at once (Nov 18, 2025)' },
  ],
  approach: [
    'Map your AI dependencies and single points of failure.',
    'Design failover: primary cloud → secondary cloud → on-prem fallback.',
    'Keep regulated data in-environment (HIPAA today; CJIS/DEA on our roadmap).',
    'Prove it with a live failover demonstration.',
  ],
  why:
    'Vendor-neutral, senior, US-governed. The combination of multi-vendor failover and on-prem regulated fallback that no single vendor packages together.',
  architecture: [
    {
      tier: 'Layer 1 — Primary cloud',
      detail: 'Your current provider (Claude, GPT, Gemini, Copilot). Used for normal operations.',
    },
    {
      tier: 'Layer 2 — Secondary cloud',
      detail: 'Vendor-independent open-weight models that take over when the primary degrades.',
    },
    {
      tier: 'Layer 3 — On-prem fallback',
      detail: 'Air-gap-capable inference designed for regulated data, implemented per engagement to survive shared cloud outages.',
    },
  ],
  offer: {
    name: 'AI Resilience Assessment',
    scoping:
      'AI Continuity planning is scoped after the initial assessment or approved discovery path. Scope depends on the systems involved, automation surface area, fallback requirements, approval checkpoints, governance needs, and operational risk.',
    goal:
      'The goal is not to automate blindly. The goal is to identify where AI-assisted workflows can safely support operations, where human approval remains required, and where infrastructure drift or access risk must be corrected first.',
    deliverables: [
      'AI dependency and single-point-of-failure map',
      'Compliance-exposure review (where regulated data touches external AI)',
      'Failover architecture recommendation (cloud + on-prem)',
      'Prioritized continuity roadmap and a live failover demonstration',
    ],
  },
  faqs: [
    {
      q: 'Is this a product I buy and install?',
      a: 'No. AI continuity is delivered as an assessment-led engineering practice. We assess your exposure and design and implement a failover architecture per engagement.',
    },
    {
      q: 'What does the AI Resilience Assessment cover?',
      a: 'A dependency and single-point-of-failure map, a compliance-exposure review, a failover architecture recommendation across cloud and on-prem, and a prioritized roadmap with a live failover demonstration.',
    },
    {
      q: 'Can regulated data stay in our environment?',
      a: 'Yes — that is the design goal. The on-prem fallback tier is implemented per engagement to keep regulated inference in-environment, drawing on HIPAA-scoped delivery experience; CJIS and DEA audit layers are on our roadmap and offered as advisory until built.',
    },
    {
      q: 'How is this different from a cloud provider or an LLM gateway?',
      a: 'Hyperscalers are single-vendor by design; gateways route across vendors but do not deliver managed, compliance-grade on-prem fallback. We combine multi-vendor failover, on-prem regulated fallback, and managed continuity.',
    },
  ],
  roadmapNote:
    'AI continuity is delivered as an engineering practice and assessment. GPU serving, proactive routing, multi-region high availability, and CJIS/DEA audit are on our delivery roadmap, not shipped product features.',
}

export const coreMetrics = [
  { value: 'Placement first', label: 'IT contractor placement is the primary offer — senior infrastructure contractors for mid-market teams.' },
  { value: 'Infrastructure depth', label: 'Linux/RHEL, VMware, Terraform, Ansible, CI/CD, Kubernetes, and hybrid cloud — real technical depth, not generic IT resumes.' },
  { value: 'Assessment gateway', label: 'The Infrastructure Stability & Automation Assessment is the entry point when the environment needs clarity before commitment.' },
  { value: '$9,000 fixed fee', label: 'The flagship assessment has a clear price, 10-business-day cadence, and concrete deliverables — no vague discovery engagements.' },
  { value: 'Mid-market focused', label: 'We own the mid-market infrastructure niche — too complex for startup hiring, too smart for enterprise MSP agreements.' },
  { value: 'Boutique service', label: 'One primary partner, no MSP overhead, technical recruiters who understand your stack.' },
]

export const pains = [
  'Mid-market IT teams are carrying Linux, VMware, hybrid-cloud, and automation backlog without enough senior infrastructure bandwidth — and the large staffing firms treat every role like a commodity fill.',
  'Modernization plans stall because leaders do not have a ranked risk picture, a practical next-step plan, or clear execution ownership before committing to a larger move.',
  'Hiring managers need specialist coverage fast, but generic IT resumes from volume staffing firms do not match the stack, and MSP fees eat the margin on programs of 10–30 contractors.',
  'Operational teams need automation and reliability improvements that can be reviewed, documented, and handed off cleanly — not black-box tooling or unsupported scale claims.',
  'Buyers comparing TEKsystems, Insight Global, Robert Half, and boutique specialists need a clear reason to choose a smaller firm — and most sites do not give them one.',
]

export const flagshipOffer = {
  name: 'Infrastructure Stability & Automation Assessment',
  price: '$9,000 fixed fee',
  timeline: '10 business days',
  summary:
    'A focused entry engagement for teams dealing with Linux, VMware, hybrid-cloud, CI/CD, Terraform, Ansible, or operational stability pressure.',
  deliverables: [
    'Current-state operating summary',
    'Ranked risk and quick-win register',
    '30-day action plan with ownership guidance',
    'Recommendation for sprint, managed support, staffing, or advisory next step',
  ],
}

// Placement-first ordering (owner ruling 2026-08-15): talent/placement tower leads.
export const services = [
  {
    icon: 'staffing',
    eyebrow: 'Focused Talent Lane',
    name: 'Specialized staffing for enterprise technology delivery',
    summary:
      'Add proven technical capacity through targeted contract, project augmentation, and contract-to-hire support tied to real delivery outcomes.',
    engagement: 'Contract / augmentation / contract-to-hire',
    outcomes: [
      'Contract engineering and specialist shortlist support',
      'DevOps, cloud, Linux, VMware, and architecture talent coverage',
      'Project augmentation aligned to live business demand',
      'Contract-to-hire support for strategic role conversion',
    ],
  },
  {
    icon: 'infrastructure',
    eyebrow: 'Flagship Consulting Lane',
    name: 'Architecture, modernization, and stabilization',
    summary:
      'Assess and remediate Linux, VMware, cloud, and hybrid infrastructure environments with stronger architecture, cleaner operations, and better execution visibility.',
    engagement: 'Assessment / modernization / remediation',
    outcomes: [
      'Infrastructure roadmap and operating-state assessment',
      'Cloud, datacenter, Linux, and VMware improvement planning',
      'Stability, resilience, and migration execution support',
      'Documentation and governance aligned to enterprise teams',
    ],
  },
  {
    icon: 'automation',
    eyebrow: 'Follow-on Automation Lane',
    name: 'Workflow automation and AI-enabled operations',
    summary:
      'Reduce manual operational drag with intelligent automation, workflow orchestration, and AI-assisted processes that stay reviewable and production-safe.',
    engagement: 'Automation / workflow / AI operations',
    outcomes: [
      'Workflow discovery and automation opportunity mapping',
      'n8n, API, and orchestration-driven process implementation',
      'AI-assisted service and delivery workflow design',
      'Human approval, audit, and operational control patterns',
    ],
  },
  {
    icon: 'managed',
    eyebrow: 'Follow-on Support Lane',
    name: 'Operational support, expert guidance, and escalation coverage',
    summary:
      'Extend internal teams with structured expert support for high-impact IT operations, environment maintenance, escalations, and delivery continuity.',
    engagement: 'Managed expertise / escalation / support continuity',
    outcomes: [
      'Environment oversight and expert escalation support',
      'Operational runbooks, patching, and improvement cadence',
      'Platform health review and support coordination',
      'Delivery continuity for constrained internal teams',
    ],
  },
]

export const practiceAreas = [
  {
    title: 'Infrastructure Strategy & Execution',
    detail:
      'Enterprise infrastructure planning, operational stabilization, migration support, and platform modernization for complex environments.',
  },
  {
    title: 'Automation & Workflow Engineering',
    detail:
      'AI-assisted operations, workflow orchestration, integration design, and repeatable automation that improves speed without losing control.',
  },
  {
    title: 'Managed Expert IT Support',
    detail:
      'High-value operational support, expert escalation, and structured environment stewardship for teams under constant delivery pressure.',
  },
  {
    title: 'Talent Delivery & Staff Placement',
    detail:
      'Targeted staffing, contract engineering, project augmentation, and contract-to-hire support for infrastructure and platform teams.',
  },
]

// Operating functions within a founder-led practice, not separately staffed departments.
export const teamModel = [
  {
    name: 'Solutions Leadership',
    summary:
      'Commercial alignment, technical oversight, escalation ownership, and cross-service coordination for enterprise engagements.',
  },
  {
    name: 'Infrastructure & Platform Delivery',
    summary:
      'Architecture, modernization, automation, migration, remediation, and platform operations support.',
  },
  {
    name: 'Managed Operations',
    summary:
      'Expert IT support, service continuity, environment review, operational cadence, and escalation management.',
  },
  {
    name: 'Talent & Placement Operations',
    summary:
      'Employer intake, staffing qualification, shortlist coordination, contract engineering, and contract-to-hire workflow support.',
  },
  {
    name: 'Governance & Trust',
    summary:
      'Documentation, approval controls, security posture, privacy boundaries, and operational accountability across the service model.',
  },
  {
    name: 'Client Success & Support',
    summary:
      'Communication cadence, request routing, service follow-through, and structured next-phase planning.',
  },
]

export const enterpriseProof = [
  'Service delivery, buyer intake, employer requests, and candidate workflows run through structured CRM-backed operating paths.',
  'Assessment, staffing, and delivery decisions stay human-approved and tied to a documented business need.',
  'The public posture now leads with a focused infrastructure wedge, then expands only where the buyer need justifies it.',
]

export const proofAssets = [
  {
    title: 'Defined entry offer',
    signal: 'Fixed scope, timeline, and deliverables',
    detail:
      'The flagship assessment has a clear price point, 10-business-day cadence, and concrete outputs that can be reviewed by business and technical stakeholders.',
  },
  {
    title: 'CRM-backed intake',
    signal: 'Lead, employer, and candidate paths',
    detail:
      'Public forms route into protected CRM workflows with receipt-only public responses, rate limiting, honeypot controls, and human review before follow-up.',
  },
  {
    title: 'Procurement-ready operating model',
    signal: 'MSA, SOW, privacy, security, and change control',
    detail:
      'The business asset library includes structured contracting, delivery cadence, billing, trust, and status-reporting templates for enterprise buying review.',
  },
  {
    title: 'Case-study publishing standard',
    signal: 'No unsupported client claims',
    detail:
      'Client proof is published only when an engagement can be approved, anonymized, or supported by measurable outcomes and a documented delivery record.',
  },
]

export const proofRoadmap = [
  {
    stage: 'First 30 days',
    target: 'Publish buyer proof',
    detail:
      'Turn the assessment offer, trust posture, founder credentials, and sample deliverables into public proof assets that buyers can inspect before a call.',
  },
  {
    stage: 'First 3 client wins',
    target: 'Earn reviewable outcomes',
    detail:
      'Capture quantified delivery results, testimonials where allowed, before/after operating snapshots, and follow-on project conversion data.',
  },
  {
    stage: 'First 12 months',
    target: 'Build ranking signals',
    detail:
      'Collect verified reviews, publish case studies, strengthen partner/certification posture, and maintain a public trust center with current operating evidence.',
  },
]

export const industrySectors = [
  {
    title: 'Multi-site enterprise operations',
    detail:
      'Teams balancing datacenter, cloud, networking, and operational consistency across more than one location or business unit.',
  },
  {
    title: 'SaaS, platform, and digital product teams',
    detail:
      'Organizations that need stronger platform reliability, automation, and specialist delivery support while scaling operations.',
  },
  {
    title: 'Healthcare, finance, and regulated operations',
    detail:
      'Environments where uptime, change discipline, documentation, and controlled access matter as much as delivery speed.',
  },
  {
    title: 'Professional services, logistics, and industrial teams',
    detail:
      'Enterprises modernizing legacy infrastructure, operational tooling, and workforce coverage without creating unnecessary disruption.',
  },
]

export const staffingSpecialties = [
  {
    title: 'Contract engineering',
    detail:
      'Embedded engineers for migrations, environment cleanup, platform improvement, and short-term delivery acceleration.',
  },
  {
    title: 'DevOps specialists',
    detail:
      'CI/CD, infrastructure as code, automation, observability, and release workflow support for teams pushing change at speed.',
  },
  {
    title: 'Infrastructure experts',
    detail:
      'Hands-on specialists for datacenter, virtualization, enterprise systems, storage, operations, and resilience work.',
  },
  {
    title: 'Linux / VMware talent',
    detail:
      'Targeted coverage for Linux administration, RHEL operations, virtualization platforms, and environment stabilization.',
  },
  {
    title: 'Cloud engineers',
    detail:
      'Architects and engineers who can help with migration, landing zones, automation, and operational maturity in cloud environments.',
  },
  {
    title: 'Solution architects',
    detail:
      'Senior technical leaders for platform direction, solution design, modernization planning, and executive-facing alignment.',
  },
  {
    title: 'Project augmentation',
    detail:
      'Flexible staffing support for high-pressure delivery windows, operational surges, and specialist execution gaps.',
  },
  {
    title: 'Contract-to-hire support',
    detail:
      'Controlled pathways to evaluate delivery fit first and convert proven talent into long-term roles when needed.',
  },
]

export const assessmentPhases = [
  {
    phase: 'Alignment',
    title: 'Executive kickoff and scope framing',
    detail: 'Align on operating pressure, critical systems, stakeholders, priorities, and the target decision package.',
  },
  {
    phase: 'Environment review',
    title: 'Workflow, support, and platform review',
    detail: 'Assess infrastructure, automation maturity, support posture, staffing constraints, and delivery blockers.',
  },
  {
    phase: 'Recommendation draft',
    title: 'Draft recommendations',
    detail: 'Share the ranked risk picture, quick wins, cross-team dependencies, and the likely execution path.',
  },
  {
    phase: 'Leadership review',
    title: 'Leadership readout',
    detail: 'Deliver the final assessment package and align on implementation, managed support, staffing, or blended next steps.',
  },
]

export const trustControls = [
  {
    title: 'Structured operating model',
    detail:
      'Public intake, employer requests, staffing workflows, and follow-through are organized through documented workflows instead of ad hoc email chains.',
  },
  {
    title: 'Human-approved delivery controls',
    detail:
      'Automation accelerates workflow, but commercial commitments, staffing movement, and delivery decisions remain human-governed.',
  },
  {
    title: 'Enterprise-safe technical posture',
    detail:
      'The public stack, CRM, workflow automation, and operational controls are separated by role and designed to preserve accountability.',
  },
]

export const trustSignals = [
  'Focused infrastructure and automation wedge before broader service expansion.',
  'CRM-backed record-of-truth workflows for buyer intake, employer requests, candidate review, and service follow-up.',
  'A practical trust posture built around documentation, approval discipline, security boundaries, and measurable delivery evidence.',
]

export const procurementPacket = [
  'Washington-governed MSA and SOW templates for consulting and talent engagements.',
  'Website terms, privacy notice, billing contacts, and documented intake handling.',
  'Change-control discipline before scope, timeline, staffing mix, or cost changes are accepted.',
  'Weekly status reporting, assessment report templates, and delivery handoff artifacts.',
  'Information security policy, access-removal expectations, and client-data handling boundaries.',
]

export const securityReadinessSignals = [
  'Public intake endpoints use receipt-only responses and do not expose internal CRM IDs.',
  'Internal read routes require authenticated roles and protected access boundaries.',
  'Automation and AI-assisted workflows remain human-approved before external commitments or CRM write-back.',
  'Compliance language is presented as readiness and control alignment unless a third-party audit or certification is explicitly available.',
]

export const faqs = [
  {
    question: 'What is the best first step for an enterprise buyer?',
    answer:
      'Start with the Infrastructure Stability & Automation Assessment when the environment needs clarity before a larger commitment. It produces the decision package that can justify implementation, support, staffing, or no-go decisions.',
  },
  {
    question: 'When should a hiring manager use the staff placement lane?',
    answer:
      'Use it when delivery demand is already defined and the missing piece is contract engineering, DevOps, infrastructure, cloud, Linux, VMware, architecture, or contract-to-hire support.',
  },
  {
    question: 'How does AI automation fit into the service model?',
    answer:
      'AI and automation are positioned as practical workflow and operations accelerators, not hype layers. The goal is better throughput, stronger handoffs, and safer repeatability.',
  },
  {
    question: 'What is not a fit?',
    answer:
      'Commodity help desk outsourcing, unsupported top-tier claims, undefined transformation theater, and buyers looking for free strategic consulting without engagement intent are not the target fit.',
  },
]

export const serviceComparisons = [
  {
    label: 'Assessment and roadmap engagement',
    detail:
      'Best when leadership needs technical clarity, a ranked action plan, and an executive-ready decision package before committing to a larger move.',
  },
  {
    label: 'Project delivery and modernization',
    detail:
      'Best when the target state is clear and the organization needs infrastructure, automation, or remediation work executed cleanly.',
  },
  {
    label: 'Managed IT expert support',
    detail:
      'Best when internal teams need experienced technical coverage, escalation help, and operational continuity without overcommitting to broad outsourcing.',
  },
  {
    label: 'Staff augmentation and contract-to-hire',
    detail:
      'Best when delivery demand is live but capacity, specialist coverage, or hiring velocity is the real blocker.',
  },
]

export const employerRequestTypes = [
  {
    title: 'Contract engineering coverage',
    detail:
      'Bring in contract engineers and infrastructure specialists for migrations, stabilization, or project-heavy delivery windows.',
  },
  {
    title: 'DevOps, cloud, and platform talent',
    detail:
      'Source engineers and architects for automation, CI/CD, observability, cloud operations, and platform modernization work.',
  },
  {
    title: 'Project augmentation support',
    detail:
      'Add specialists, pod support, or blended delivery coverage without slowing down an active program.',
  },
  {
    title: 'Contract-to-hire staffing',
    detail:
      'Use structured contract-to-hire support when you want delivery traction now and hiring optionality later.',
  },
]

export const candidateIntakeHighlights = [
  'Structured intake for infrastructure, DevOps, cloud, Linux, VMware, automation, architecture, and project-delivery contract roles.',
  'Human review before shortlist movement or employer presentation.',
  'Availability, location, certifications, and project context captured early to reduce wasted follow-up.',
]

export const candidateProcess = [
  {
    title: 'Profile submission',
    detail:
      'Candidates submit a structured profile with technical focus, certifications, location preferences, delivery history, and engagement type.',
  },
  {
    title: 'Talent operations review',
    detail:
      'The team reviews fit, timing, communication readiness, work authorization, and employer alignment before presentation.',
  },
  {
    title: 'Shortlist and interview coordination',
    detail:
      'Qualified candidates move into a controlled shortlist and interview process tied to approved employer demand.',
  },
]

export const careerPrinciples = [
  'Opportunities are aligned to real client demand, active delivery needs, and structured staffing workflows.',
  'Candidate information is used for professional review only and is not exposed on public surfaces.',
  'Shortlists, interviews, and client introductions remain human-governed throughout the process.',
]

export const engagementLifecycle = [
  {
    title: 'Intake alignment',
    detail:
      'Clarify business priorities, technical pressures, staffing gaps, service expectations, and delivery risks before scoping.',
  },
  {
    title: 'Solution mapping',
    detail:
      'Determine whether the next move is assessment, project execution, managed expert support, staffing, or a blended model.',
  },
  {
    title: 'Coverage assignment',
    detail:
      'Align the right consulting, specialist support, or staffing coverage to the approved engagement model.',
  },
  {
    title: 'Delivery governance',
    detail:
      'Run review cadence, escalation management, documentation, and operational visibility through the CRM and service workflows.',
  },
  {
    title: 'Expansion and follow-through',
    detail:
      'Track open work, outcomes, renewal opportunities, and next-phase recommendations with a structured operating cadence.',
  },
]

// Founder track record — sourced from the founder's consulting profile (real, public).
export const founderTrackRecord = [
  '8+ years leading infrastructure and systems implementation work',
  '600+ server modernization program support across healthcare operations',
  'Delivery experience across healthcare, retail, hospitality, and aviation',
  'AI continuity capability: designs multi-vendor failover with an on-prem fallback path (assessment-led practice)',
]

// Segment marketing pages (Phase 4 six-segment GTM). Data-driven; rendered by SegmentPage.
// Honest framing: assessment-led; AI/HA/GPU/CJIS-DEA capabilities are roadmap, not shipped.
// Segment marketing pages (Phase 4 six-segment GTM) — every page renders at flagship depth.
// Rich, sourced, distinct per segment. Honest framing: assessment-led; AI/HA/GPU/CJIS-DEA = roadmap.
export const segments = {
  modernization: {
    eyebrow: 'Infrastructure Modernization',
    headline: 'Modernize legacy and cloud infrastructure without the waste.',
    summary:
      'Assess legacy and lift-and-shift environments, then execute a practical modernization path with clear rollback and handoff. Senior, US-governed delivery at mid-market pricing.',
    proof: [
      { label: 'Market', detail: 'Application and infrastructure modernization is a large, fast-growing market — ~15.7% annual growth in 2026 (Global Growth Insights).' },
      { label: 'The waste', detail: 'Lift-and-shift left many enterprises with high cloud spend and little scalability gain.' },
      { label: 'The lever', detail: 'Modernization pays off when automation removes the manual toil that lift-and-shift left behind.' },
    ],
    architecture: [
      { tier: '1 - Assess', detail: 'Map legacy estate, technical debt, and cloud-cost waste; rank by risk and impact.' },
      { tier: '2 - Modernize', detail: 'Sequence OS/platform/hosting transitions and cloud right-sizing with rollback plans.' },
      { tier: '3 - Operate', detail: 'Documentation, runbooks, and optional managed infrastructure follow-on.' },
    ],
    offer: {
      name: 'Infrastructure Stability & Automation Assessment',
      scoping:
        'Modernization support is scoped after the initial assessment or approved discovery path. Scope depends on the Linux/RHEL estate, VMware dependency, hybrid-cloud readiness, automation maturity, CI/CD posture, compliance evidence, migration pressure, and delivery timeline.',
      goal:
        'The goal is not to force a migration. The goal is to identify what should be stabilized, automated, retired, modernized, or moved — and in what order.',
      deliverables: ['Current-state operating summary', 'Ranked risk and quick-win register',
        'Modernization roadmap (OS, platform, hosting, cloud right-sizing)', 'Recommended next-step engagement'],
    },
    why: 'Mid-market focus: senior engineers, accountable delivery, and a ranked roadmap tied to real operating risk.',
    faqs: [
      { q: 'Where do we start?', a: 'The Infrastructure Stability & Automation Assessment maps your estate, ranks risks and quick wins, and produces a practical modernization roadmap; modernization work is then scoped from that proof.' },
      { q: 'Do you only plan, or also execute?', a: 'Both. Assessment leads into migration and remediation with rollback plans, documentation, and optional managed follow-on.' },
      { q: 'How are you different from a large SI?', a: 'Senior, US-governed delivery focused on mid-market buyers, without Big-4 overhead or offshore hand-offs.' },
    ],
    scopeNote: 'Delivered as senior engineering engagements. Pricing indicative until scoped.',
  },
  devops: {
    eyebrow: 'Automation Engineering (CI/CD, IaC, DevOps)',
    headline: 'Ship faster with fewer incidents - without hiring a platform team.',
    summary:
      'Senior IaC and pipeline engineering that reduces manual steps and configuration drift while staying auditable. Build it, then operate it.',
    proof: [
      { label: 'Market', detail: 'CI/CD tooling adoption is expanding quickly; DevOps growing ~21% CAGR (Mordor Intelligence).' },
      { label: 'Platform shift', detail: 'Platform-engineering adoption is projected to reach ~80% of software orgs by 2026 (Gartner).' },
      { label: 'Automation', detail: '~70% IaC adoption; ~86% of teams plan to upgrade automation in 2026 (Persistence Market Research).' },
    ],
    architecture: [
      { tier: '1 - Audit', detail: 'Pipeline and IaC maturity review: drift, failure points, release discipline.' },
      { tier: '2 - Build', detail: 'Terraform / Ansible / GitHub Actions implementation and internal developer platform.' },
      { tier: '3 - Operate', detail: 'Release automation and DevOps-as-managed-service (optional retainer).' },
    ],
    offer: {
      name: 'Pipeline / IaC Maturity Audit',
      scoping:
        'DevOps modernization is scoped after the initial assessment or approved discovery path. Scope depends on CI/CD maturity, Terraform and Ansible posture, release hygiene, runbook quality, environment drift, approval checkpoints, and deployment risk.',
      goal:
        'The goal is not to add tools for the sake of tools. The goal is to improve release reliability, reduce manual operational load, and create automation that operators can trust.',
      deliverables: ['Pipeline and IaC maturity assessment', 'Drift and reliability findings',
        'Automation roadmap with effort/impact', 'Build or managed-service recommendation'],
    },
    why: 'Platform-engineering capability on demand, sized for mid-market teams - senior engineers, no full platform org required.',
    faqs: [
      { q: 'Do we need a platform team to work with you?', a: 'No - that is the point. We deliver senior IaC and pipeline engineering and can run it as a managed service.' },
      { q: 'Which tools?', a: 'Terraform, Ansible, GitHub Actions and equivalents; we meet your stack rather than impose one.' },
      { q: 'How is DevOps work scoped?', a: 'The maturity audit comes first; build-and-operate work is then scoped from that proof against CI/CD maturity, release risk, and operational ownership under the client approval path.' },
    ],
    scopeNote: 'Senior engineering delivery; pricing indicative until scoped.',
  },
  cloud: {
    eyebrow: 'Cloud Migration & Operations',
    headline: 'Migrate cleanly - then right-size what you already run.',
    summary:
      'Cloud readiness, migration, and post-migration FinOps. Vendor-neutral; we optimize cost and reliability across cloud and hybrid.',
    proof: [
      { label: 'Market', detail: 'Cloud migration effort scales widely with estate size and complexity, from small estates to large mid-market programs.' },
      { label: 'The problem', detail: 'Many firms are on cloud but overspending - lift-and-shift without optimization.' },
      { label: 'Our angle', detail: 'Vendor-neutral migration plus ongoing FinOps, not a one-time move.' },
    ],
    architecture: [
      { tier: '1 - Readiness', detail: 'Assess workloads, dependencies, and cost baseline; define migration approach.' },
      { tier: '2 - Migrate', detail: 'Execute migration (small estate to mid-market) with parallel-run and rollback.' },
      { tier: '3 - Optimize', detail: 'FinOps right-sizing and cloud operations (optional retainer).' },
    ],
    offer: {
      name: 'Cloud Readiness Assessment',
      scoping:
        'Cloud and hybrid-cloud support is scoped after the initial assessment or approved discovery path. Scope depends on workload dependencies, network and DNS posture, TLS exposure, migration readiness, security controls, cost visibility, and operating model maturity.',
      goal:
        'The goal is not to move everything to cloud. The goal is to identify what should stay, what should move, what should be modernized, and what must be stabilized first.',
      deliverables: ['Workload and dependency map', 'Cost baseline and right-sizing opportunities',
        'Migration plan with risk and rollback', 'Cloud operations recommendation'],
    },
    why: 'Vendor-neutral migration plus continuous optimization - we reduce spend, not just move it.',
    faqs: [
      { q: 'We already migrated - can you still help?', a: 'Yes. Post-migration FinOps and right-sizing is often where the savings are; we assess and optimize what you run.' },
      { q: 'Single cloud or multi-cloud?', a: 'Vendor-neutral. We design for your constraints across cloud and hybrid rather than pushing one provider.' },
      { q: 'How is cloud work scoped?', a: 'Readiness comes first; migration and operations work is then scoped from that proof against workload risk, migration pressure, and operating-model readiness under the client approval path.' },
    ],
    scopeNote: 'Vendor-neutral delivery; pricing indicative until scoped.',
  },
  compliance: {
    eyebrow: 'Compliance & Regulated Environments',
    headline: 'Continuous, audit-ready compliance for regulated mid-market firms.',
    summary:
      'Gap assessment, remediation, and continuous monitoring mapped to your frameworks. Accurate scope only - we never claim certifications or authorizations we do not hold.',
    proof: [
      { label: 'Market', detail: 'Compliance-as-a-service is growing steadily at ~10% CAGR (Grand View Research).' },
      { label: 'Urgency', detail: 'CMMC becomes contractually enforceable in 2026; multi-framework deadlines stack up (Kiteworks).' },
      { label: 'The gap', detail: 'Mid-market regulated firms need managed, continuous compliance - not point-in-time audits.' },
    ],
    architecture: [
      { tier: '1 - Gap assessment', detail: 'Map current controls to your frameworks (HIPAA / PCI / SOC2 / CMMC).' },
      { tier: '2 - Remediate', detail: 'Close gaps with evidence and control mapping; build the audit-ready package.' },
      { tier: '3 - Monitor', detail: 'Managed continuous compliance: control health, drift, and reporting (retainer).' },
    ],
    offer: {
      name: 'Compliance Gap Assessment',
      scoping:
        'Compliance-readiness support is scoped after the initial assessment or approved discovery path. Scope depends on access review needs, backup and disaster-recovery posture, evidence gaps, operational controls, data sensitivity, audit timelines, and remediation priority.',
      goal:
        'The goal is not to create paperwork. The goal is to produce evidence, expose control gaps, and rank what must be fixed before risk becomes operational or contractual exposure.',
      deliverables: ['Control mapping to your frameworks', 'Prioritized remediation plan with evidence requirements',
        'Audit-ready package outline', 'Managed continuous-compliance recommendation'],
    },
    why: 'Delivery plus tooling for mid-market regulated buyers - not software alone, not a Big-4 price.',
    faqs: [
      { q: 'Are you FedRAMP or CJIS authorized?', a: 'No. FedRAMP and on-prem CJIS/DEA inference are advisory/roadmap only - we never imply authorizations we do not hold.' },
      { q: 'Which frameworks?', a: 'HIPAA, PCI, and SOC2 today, with CMMC gap-assessment and remediation as 2026 enforcement lands.' },
      { q: 'One-time or ongoing?', a: 'Start with a gap assessment scoped after proof; convert to managed continuous compliance for ongoing control health when the need is defined.' },
    ],
    scopeNote: 'Accurate scope only. CJIS/DEA on-prem inference and FedRAMP are advisory/roadmap, not claimed capabilities.',
  },
  talent: {
    eyebrow: 'Delivery-aligned talent coverage',
    headline: 'Delivery coverage when the work is already clear.',
    summary:
      'Desir Solutions supports contractor and candidate coverage when infrastructure needs, delivery gaps, or project risk have been identified. Talent support is tied to real operating context, not generic resume volume.',
    cta: { to: '/employers', label: 'Request contractor coverage' },
    proof: [
      { label: 'Demand', detail: '~66% of tech hiring managers plan to expand contractors in 2026 (Robert Half).' },
      { label: 'Shortage', detail: 'AI skills are the hardest-to-fill role globally in 2026 (ManpowerGroup).' },
      { label: 'Market', detail: 'Managed IT services is a large market growing ~9.3% CAGR in 2026 (CorsicaTech).' },
    ],
    architecture: [
      { tier: 'Assessment-informed coverage', detail: 'Talent support is connected to infrastructure findings, delivery priorities, and approved workstreams.' },
      { tier: 'Role clarity before shortlist', detail: 'Coverage starts with role outcomes, technical environment, timing, work authorization, location, and delivery expectations.' },
      { tier: 'Controlled presentation', detail: 'Candidates move forward only when there is a clear match between the operating need and the candidate’s delivery profile.' },
      { tier: 'Ongoing delivery context', detail: 'Coverage can support implementation, modernization, runbook automation, DevOps, cloud, Linux/RHEL, VMware, compliance evidence, and project execution needs.' },
    ],
    offer: {
      name: 'Delivery coverage model',
      price: 'Scoped to the engagement',
      priceNote: 'Commercial terms are scoped to the engagement model, role type, duration, delivery risk, and client approval path.',
      timeline: 'Readiness review before shortlist',
      deliverables: [
        'Coverage tied to assessment findings, delivery priorities, or approved employer demand',
        'Role outcomes, technical environment, timing, and work authorization confirmed up front',
        'Controlled shortlist - candidates advance only on clear technical and delivery fit',
        'Support across implementation, modernization, DevOps, cloud, Linux/RHEL, VMware, and compliance evidence',
      ],
    },
    why: 'Coverage engaged against a known operating context - identified needs, delivery gaps, or project risk - with delivery oversight, not volume resume matching.',
    faqs: [
      { q: 'How is this different from a staffing agency?', a: 'Coverage is tied to real operating context - an assessment, active project, or approved employer request that defines the role, environment, timeline, and delivery risk - with delivery oversight rather than generic resume volume.' },
      { q: 'How does coverage begin?', a: 'Coverage begins once role outcomes, the technical environment, timing, work authorization, and delivery expectations are clear - so presentation is based on fit, not volume.' },
      { q: 'Do you support ongoing delivery needs?', a: 'Yes - coverage can support implementation, modernization, runbook automation, DevOps, cloud, Linux/RHEL, VMware, and compliance-evidence workstreams as the engagement requires.' },
    ],
    scopeNote: 'Commercial terms are scoped per engagement to role type, duration, and delivery risk under the client approval path.',
  },
}

export const openRoles = [
  {
    code: 'DS-SRE-2026-001',
    title: 'Senior Site Reliability Engineer (FedRAMP-eligible)',
    engagement: 'W2 contract',
    location: 'Remote - US',
    duration: 'Long-term engagement (~23 months), target start mid-August 2026',
    rate: 'Target $65-70/hr W2',
    posted: '2026-08-04',
    mustHaves: [
      '10+ years in Site Reliability Engineering, DevOps, or infrastructure engineering supporting cloud-based production environments',
      'Infrastructure automation with Ansible',
      'Programming in Ruby with automated testing (RSpec or comparable)',
      'Linux administration across large distributed environments (hundreds to thousands of systems)',
      'CI/CD pipeline design and maintenance, including GitLab CI',
      'Eligible to work on FedRAMP projects',
    ],
    niceToHaves: [
      'AWS or other public cloud and hybrid infrastructure experience',
      'Monitoring, observability, and reliability engineering tooling',
      'Kubernetes and containerized application platforms',
      'AI-assisted development tooling to accelerate automation and operational analysis',
    ],
  },
]
