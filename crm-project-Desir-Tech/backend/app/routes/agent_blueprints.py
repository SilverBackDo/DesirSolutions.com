"""
AI multi-agent operating blueprint endpoints.
"""

from fastapi import APIRouter, Depends, Query

from app.auth import require_internal_roles
from app.schemas import AgentBlueprintResponse

router = APIRouter(
    dependencies=[Depends(require_internal_roles("admin", "sales", "finance", "approver", "viewer", allow_api_key=True))]
)


@router.get('/consulting-firm', response_model=AgentBlueprintResponse)
async def consulting_firm_blueprint(
    framework: str = Query('crewai', pattern='^(crewai|autogen)$')
):
    framework_label = 'CrewAI' if framework == 'crewai' else 'AutoGen'
    return AgentBlueprintResponse(
        framework=framework,
        framework_label=framework_label,
        name='IT consulting + contractor placement launch crew',
        objective='Create a repeatable operating system that finds clients, qualifies demand, matches contractors, drafts proposals, and keeps delivery healthy without losing context between teams.',
        agents=[
            {
                'name': 'Market Intel Agent',
                'role': 'Research',
                'mission': 'Track hiring demand, target accounts, and new consulting opportunities across cloud, cybersecurity, data, and app modernization.',
                'inputs': ['ICP definition', 'regional target list', 'job boards and firmographic data'],
                'outputs': ['priority account list', 'hiring signal summary', 'service-line demand report'],
            },
            {
                'name': 'BD Outreach Agent',
                'role': 'Pipeline',
                'mission': 'Draft personalized outbound sequences and inbound follow-up for buyers needing project teams or contract talent.',
                'inputs': ['priority account list', 'lead enrichment', 'offer catalog'],
                'outputs': ['email sequence drafts', 'discovery briefs', 'meeting-ready notes'],
            },
            {
                'name': 'Talent Matching Agent',
                'role': 'Recruiting',
                'mission': 'Match contractor profiles to client requirements, identify gaps, and recommend shortlist rankings.',
                'inputs': ['job requisition', 'consultant bench', 'skills matrix'],
                'outputs': ['ranked candidate shortlist', 'fit-gap analysis', 'rate guidance'],
            },
            {
                'name': 'Proposal Agent',
                'role': 'Sales Ops',
                'mission': 'Turn discovery notes into statements of work, staffing plans, and pricing options.',
                'inputs': ['discovery brief', 'shortlist', 'delivery constraints'],
                'outputs': ['SOW outline', 'pricing options', 'implementation timeline'],
            },
            {
                'name': 'Client Success Agent',
                'role': 'Delivery',
                'mission': 'Monitor active engagements, renewal risks, redeployment opportunities, and consultant satisfaction.',
                'inputs': ['project status', 'timesheets', 'CSAT notes'],
                'outputs': ['risk alerts', 'renewal recommendations', 'upsell opportunities'],
            },
        ],
        workflow=[
            {
                'order': 1,
                'name': 'Detect demand',
                'description': 'Research target accounts and capture active hiring or transformation signals tied to your service catalog.',
                'owner': 'Market Intel Agent',
                'handoff_to': 'BD Outreach Agent',
            },
            {
                'order': 2,
                'name': 'Qualify buyer intent',
                'description': 'Create outreach sequences, summarize likely pain points, and prepare discovery questions for account executives.',
                'owner': 'BD Outreach Agent',
                'handoff_to': 'Talent Matching Agent',
            },
            {
                'order': 3,
                'name': 'Assemble talent options',
                'description': 'Compare open demand against available contractors and generate a shortlist with strengths, constraints, and bill rates.',
                'owner': 'Talent Matching Agent',
                'handoff_to': 'Proposal Agent',
            },
            {
                'order': 4,
                'name': 'Draft offer package',
                'description': 'Package the recommended team, timeline, and pricing into proposal assets that a human seller can review.',
                'owner': 'Proposal Agent',
                'handoff_to': 'Client Success Agent',
            },
            {
                'order': 5,
                'name': 'Protect delivery margin',
                'description': 'Watch project health, consultant fit, and extension opportunities so the firm compounds revenue after placement.',
                'owner': 'Client Success Agent',
                'handoff_to': 'Market Intel Agent',
            },
        ],
        automation_targets=[
            'Sync inbound leads, meeting notes, and proposal stages into the CRM automatically.',
            'Score new client requests by urgency, deal size, service line, and closability.',
            'Generate candidate shortlists from a structured consultant bench and skills inventory.',
            'Draft SOWs, interview kits, and follow-up emails from discovery notes.',
            'Trigger delivery risk alerts when placements are nearing end dates or show low satisfaction signals.',
        ],
        weekly_kpis=[
            'Qualified discovery calls booked',
            'Average days from lead to submitted shortlist',
            'Proposal win rate for consulting vs. staff augmentation',
            'Gross margin by contractor placement',
            'Renewal / extension rate for deployed consultants',
        ],
        starter_prompts=[
            {
                'title': f'{framework_label} orchestration brief',
                'text': f'Build a {framework_label} workflow that shares a normalized client_request object across research, outreach, matching, proposal, and client-success agents with human approval before any external email is sent.',
            },
            {
                'title': 'Discovery-to-proposal prompt',
                'text': 'Given discovery notes, create a concise buyer summary, staffing recommendation, timeline, pricing assumptions, and next-step checklist tailored for an IT consulting engagement.',
            },
            {
                'title': 'Contractor shortlist prompt',
                'text': 'Rank the best-fit consultants for this role, explain each match score, call out missing skills, and recommend interview sequencing plus target bill/pay ranges.',
            },
        ],
    )
