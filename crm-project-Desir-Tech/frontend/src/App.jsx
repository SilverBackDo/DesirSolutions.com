import React, { useEffect, useMemo, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';
import './App.css';

const API_BASE = import.meta.env.VITE_API_URL || '/api';
const HEALTH_ENDPOINT = import.meta.env.VITE_HEALTH_URL || '/api/health';
const TOKEN_STORAGE_KEY = 'desir_crm_access_token';
const STAGE_OPTIONS = ['new', 'qualified', 'discovery', 'proposal', 'negotiation', 'won', 'lost', 'on_hold'];
const ROUTER_BASENAME = (import.meta.env.BASE_URL || '/').replace(/\/$/, '') || '/';

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((config) => {
  const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

function currency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function StageBadge({ stage }) {
  return <span className={`badge badge-${String(stage || 'new').replace('_', '-')}`}>{stage || 'new'}</span>;
}

function StatusBadge({ status }) {
  const normalized = String(status || 'unknown').replace(/_/g, '-');
  return <span className={`badge badge-${normalized}`}>{String(status || 'unknown').replace(/_/g, ' ')}</span>;
}

function formatDateTime(value) {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleString();
}

function errorMessage(err, fallback) {
  const detail = err?.response?.data?.detail;
  if (typeof detail === 'string') return detail;
  if (detail?.message) return detail.message;
  return fallback;
}

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const response = await axios.post(`${API_BASE}/auth/login`, { username, password });
      const token = response.data?.access_token;
      if (!token) {
        throw new Error('Missing access token');
      }
      window.localStorage.setItem(TOKEN_STORAGE_KEY, token);
      onLogin(token);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      if (typeof detail === 'string') {
        setError(detail);
      } else if (detail?.message) {
        setError(detail.message);
      } else {
        setError('Login failed. Check credentials and auth configuration.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page">
      <div className="card" style={{ maxWidth: 420, margin: '3rem auto' }}>
        <h2 style={{ marginBottom: '1rem' }}>CRM Sign In</h2>
        <form className="form-grid" onSubmit={onSubmit}>
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={submitting}>
            {submitting ? 'Signing In...' : 'Sign In'}
          </button>
          {error ? <p className="status-err" style={{ fontSize: '0.95rem' }}>{error}</p> : null}
        </form>
      </div>
    </div>
  );
}

function Dashboard() {
  const [health, setHealth] = useState(null);
  const [pipeline, setPipeline] = useState([]);
  const [loadingPipeline, setLoadingPipeline] = useState(true);

  useEffect(() => {
    axios.get(HEALTH_ENDPOINT)
      .then(res => setHealth(res.data))
      .catch(() => setHealth({ status: 'unreachable' }));

    api.get('/pipeline/summary')
      .then(res => setPipeline(res.data))
      .catch(() => setPipeline([]))
      .finally(() => setLoadingPipeline(false));
  }, []);

  const totals = pipeline.reduce(
    (acc, row) => {
      acc.opportunities += Number(row.opportunity_count || 0);
      acc.estimated += Number(row.total_estimated_value || 0);
      acc.weighted += Number(row.total_weighted_value || 0);
      return acc;
    },
    { opportunities: 0, estimated: 0, weighted: 0 }
  );

  return (
    <div className="page">
      <h2>Dashboard</h2>
      <div className="kpi-grid">
        <div className="card">
          <h3>API Status</h3>
          <p className={health?.status === 'healthy' ? 'status-ok' : 'status-err'}>
            {health ? health.status : 'Checking...'}
          </p>
        </div>
        <div className="card">
          <h3>Open Opportunities</h3>
          <p className="kpi-value">{totals.opportunities}</p>
        </div>
        <div className="card">
          <h3>Pipeline (Estimated)</h3>
          <p className="kpi-value">{currency(totals.estimated)}</p>
        </div>
        <div className="card">
          <h3>Pipeline (Weighted)</h3>
          <p className="kpi-value">{currency(totals.weighted)}</p>
        </div>
      </div>

      <h2 style={{ marginTop: '2rem' }}>Pipeline by Stage</h2>
      {loadingPipeline ? (
        <p>Loading pipeline...</p>
      ) : pipeline.length === 0 ? (
        <div className="card"><p>No opportunities in pipeline yet.</p></div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Stage</th>
              <th>Count</th>
              <th>Estimated</th>
              <th>Weighted</th>
            </tr>
          </thead>
          <tbody>
            {pipeline.map(row => (
              <tr key={row.stage}>
                <td><StageBadge stage={row.stage} /></td>
                <td>{row.opportunity_count}</td>
                <td>{currency(row.total_estimated_value)}</td>
                <td>{currency(row.total_weighted_value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Clients() { /* unchanged content intentionally compact */
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/clients/')
      .then(res => setClients(res.data))
      .catch(err => console.error('Failed to load clients:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page">
      <h2>Clients</h2>
      {loading ? <p>Loading...</p> : clients.length === 0 ? <p>No clients yet. Add your first client!</p> : (
        <table className="data-table"><thead><tr><th>Name</th><th>Email</th><th>Company</th><th>Phone</th></tr></thead><tbody>{clients.map(c => (
          <tr key={c.id}><td>{c.name}</td><td>{c.email}</td><td>{c.company || '—'}</td><td>{c.phone || '—'}</td></tr>
        ))}</tbody></table>
      )}
    </div>
  );
}

function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ source: 'website', contact_name: '', contact_email: '', company_name: '', estimated_deal_value: '', notes: '' });

  const loadLeads = () => {
    setLoading(true);
    api.get('/leads/').then(res => setLeads(res.data)).catch(err => console.error('Failed to load leads:', err)).finally(() => setLoading(false));
  };
  useEffect(() => { loadLeads(); }, []);

  const onSubmit = (event) => {
    event.preventDefault();
    const payload = { ...form, estimated_deal_value: form.estimated_deal_value ? Number(form.estimated_deal_value) : null };
    api.post('/leads/', payload).then(() => {
      setForm({ source: 'website', contact_name: '', contact_email: '', company_name: '', estimated_deal_value: '', notes: '' });
      loadLeads();
    }).catch(err => console.error('Failed to create lead:', err));
  };

  return (
    <div className="page">
      <h2>Leads</h2>
      <form className="card form-grid" onSubmit={onSubmit}><h3>Create Lead</h3>
        <input placeholder="Contact Name" value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} required />
        <input placeholder="Contact Email" type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
        <input placeholder="Company Name" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
        <input placeholder="Estimated Deal Value" type="number" min="0" value={form.estimated_deal_value} onChange={(e) => setForm({ ...form, estimated_deal_value: e.target.value })} />
        <textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        <button type="submit">Create Lead</button>
      </form>
      {loading ? <p>Loading...</p> : leads.length === 0 ? <div className="card"><p>No leads yet.</p></div> : (
        <table className="data-table"><thead><tr><th>Contact</th><th>Email</th><th>Company</th><th>Source</th><th>Est. Value</th></tr></thead><tbody>{leads.map(lead => (
          <tr key={lead.id}><td>{lead.contact_name}</td><td>{lead.contact_email || '—'}</td><td>{lead.company_name || '—'}</td><td>{lead.source}</td><td>{currency(lead.estimated_deal_value)}</td></tr>
        ))}</tbody></table>
      )}
    </div>
  );
}

function Opportunities() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: '', stage: 'new', estimated_value: '', probability_percent: 10 });
  const loadOpportunities = () => { setLoading(true); api.get('/opportunities/').then(res => setOpportunities(res.data)).catch(err => console.error('Failed to load opportunities:', err)).finally(() => setLoading(false)); };
  useEffect(() => { loadOpportunities(); }, []);
  const onSubmit = (event) => {
    event.preventDefault();
    const payload = { ...form, estimated_value: Number(form.estimated_value || 0), probability_percent: Number(form.probability_percent || 0) };
    api.post('/opportunities/', payload).then(() => { setForm({ name: '', stage: 'new', estimated_value: '', probability_percent: 10 }); loadOpportunities(); }).catch(err => console.error('Failed to create opportunity:', err));
  };

  return (
    <div className="page">
      <h2>Opportunities</h2>
      <form className="card form-grid" onSubmit={onSubmit}><h3>Create Opportunity</h3>
        <input placeholder="Opportunity Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <select value={form.stage} onChange={(e) => setForm({ ...form, stage: e.target.value })}>{STAGE_OPTIONS.map(stage => <option value={stage} key={stage}>{stage}</option>)}</select>
        <input placeholder="Estimated Value" type="number" min="0" value={form.estimated_value} onChange={(e) => setForm({ ...form, estimated_value: e.target.value })} />
        <input placeholder="Probability %" type="number" min="0" max="100" value={form.probability_percent} onChange={(e) => setForm({ ...form, probability_percent: e.target.value })} />
        <button type="submit">Create Opportunity</button>
      </form>
      {loading ? <p>Loading...</p> : opportunities.length === 0 ? <div className="card"><p>No opportunities yet.</p></div> : (
        <table className="data-table"><thead><tr><th>Name</th><th>Stage</th><th>Estimated</th><th>Probability</th></tr></thead><tbody>{opportunities.map(opportunity => (
          <tr key={opportunity.id}><td>{opportunity.name}</td><td><StageBadge stage={opportunity.stage} /></td><td>{currency(opportunity.estimated_value)}</td><td>{opportunity.probability_percent}%</td></tr>
        ))}</tbody></table>
      )}
    </div>
  );
}

function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ client_id: '', invoice_number: '', invoice_date: '', due_date: '', status: 'draft', subtotal: '', tax_amount: '', total_amount: '' });
  const loadInvoices = () => { setLoading(true); api.get('/invoices/').then(res => setInvoices(res.data)).catch(err => console.error('Failed to load invoices:', err)).finally(() => setLoading(false)); };
  useEffect(() => { loadInvoices(); }, []);
  const onSubmit = (event) => {
    event.preventDefault();
    const payload = { ...form, client_id: Number(form.client_id), subtotal: Number(form.subtotal || 0), tax_amount: Number(form.tax_amount || 0), total_amount: Number(form.total_amount || 0) };
    api.post('/invoices/', payload).then(() => { setForm({ client_id: '', invoice_number: '', invoice_date: '', due_date: '', status: 'draft', subtotal: '', tax_amount: '', total_amount: '' }); loadInvoices(); }).catch(err => console.error('Failed to create invoice:', err));
  };
  return (
    <div className="page">
      <h2>Invoices</h2>
      <form className="card form-grid" onSubmit={onSubmit}><h3>Create Invoice</h3>
        <input placeholder="Client ID" type="number" min="1" value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} required />
        <input placeholder="Invoice Number" value={form.invoice_number} onChange={(e) => setForm({ ...form, invoice_number: e.target.value })} required />
        <input type="date" value={form.invoice_date} onChange={(e) => setForm({ ...form, invoice_date: e.target.value })} required />
        <input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} required />
        <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}><option value="draft">draft</option><option value="issued">issued</option><option value="partially_paid">partially_paid</option><option value="paid">paid</option><option value="overdue">overdue</option><option value="void">void</option></select>
        <input placeholder="Subtotal" type="number" min="0" value={form.subtotal} onChange={(e) => setForm({ ...form, subtotal: e.target.value })} />
        <input placeholder="Tax" type="number" min="0" value={form.tax_amount} onChange={(e) => setForm({ ...form, tax_amount: e.target.value })} />
        <input placeholder="Total" type="number" min="0" value={form.total_amount} onChange={(e) => setForm({ ...form, total_amount: e.target.value })} />
        <button type="submit">Create Invoice</button>
      </form>
      {loading ? <p>Loading...</p> : invoices.length === 0 ? <div className="card"><p>No invoices yet.</p></div> : (
        <table className="data-table"><thead><tr><th>Number</th><th>Client ID</th><th>Status</th><th>Invoice Date</th><th>Due Date</th><th>Total</th></tr></thead><tbody>{invoices.map(invoice => (
          <tr key={invoice.id}><td>{invoice.invoice_number}</td><td>{invoice.client_id}</td><td>{invoice.status}</td><td>{invoice.invoice_date}</td><td>{invoice.due_date}</td><td>{currency(invoice.total_amount)}</td></tr>
        ))}</tbody></table>
      )}
    </div>
  );
}

function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ invoice_id: '', client_id: '', payment_date: '', amount: '', method: 'ach', reference_number: '', processor: '' });
  const loadPayments = () => { setLoading(true); api.get('/payments/').then(res => setPayments(res.data)).catch(err => console.error('Failed to load payments:', err)).finally(() => setLoading(false)); };
  useEffect(() => { loadPayments(); }, []);
  const onSubmit = (event) => {
    event.preventDefault();
    const payload = { ...form, invoice_id: form.invoice_id ? Number(form.invoice_id) : null, client_id: Number(form.client_id), amount: Number(form.amount || 0) };
    api.post('/payments/', payload).then(() => { setForm({ invoice_id: '', client_id: '', payment_date: '', amount: '', method: 'ach', reference_number: '', processor: '' }); loadPayments(); }).catch(err => console.error('Failed to create payment:', err));
  };
  return (
    <div className="page">
      <h2>Payments</h2>
      <form className="card form-grid" onSubmit={onSubmit}><h3>Record Payment</h3>
        <input placeholder="Client ID" type="number" min="1" value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} required />
        <input placeholder="Invoice ID (optional)" type="number" min="1" value={form.invoice_id} onChange={(e) => setForm({ ...form, invoice_id: e.target.value })} />
        <input type="date" value={form.payment_date} onChange={(e) => setForm({ ...form, payment_date: e.target.value })} required />
        <input placeholder="Amount" type="number" min="0.01" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
        <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}><option value="ach">ach</option><option value="wire">wire</option><option value="card">card</option><option value="check">check</option><option value="cash">cash</option><option value="other">other</option></select>
        <input placeholder="Reference Number" value={form.reference_number} onChange={(e) => setForm({ ...form, reference_number: e.target.value })} />
        <input placeholder="Processor" value={form.processor} onChange={(e) => setForm({ ...form, processor: e.target.value })} />
        <button type="submit">Record Payment</button>
      </form>
      {loading ? <p>Loading...</p> : payments.length === 0 ? <div className="card"><p>No payments yet.</p></div> : (
        <table className="data-table"><thead><tr><th>Date</th><th>Client ID</th><th>Invoice ID</th><th>Method</th><th>Amount</th><th>Reference</th></tr></thead><tbody>{payments.map(payment => (
          <tr key={payment.id}><td>{payment.payment_date}</td><td>{payment.client_id}</td><td>{payment.invoice_id || '—'}</td><td>{payment.method}</td><td>{currency(payment.amount)}</td><td>{payment.reference_number || '—'}</td></tr>
        ))}</tbody></table>
      )}
    </div>
  );
}

function AIFactory() {
  const [framework, setFramework] = useState('crewai');
  const [blueprint, setBlueprint] = useState(null);
  const [blueprintLoading, setBlueprintLoading] = useState(true);
  const [blueprintError, setBlueprintError] = useState('');
  const [workflows, setWorkflows] = useState([]);
  const [runs, setRuns] = useState([]);
  const [leads, setLeads] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [selectedWorkflowKey, setSelectedWorkflowKey] = useState('lead_qualification');
  const [controlLoading, setControlLoading] = useState(true);
  const [controlError, setControlError] = useState('');
  const [launching, setLaunching] = useState(false);
  const [approvalSubmitting, setApprovalSubmitting] = useState(null);
  const [approvalDrafts, setApprovalDrafts] = useState({});
  const [launchForm, setLaunchForm] = useState({
    lead_id: '',
    opportunity_id: '',
    preferred_provider: 'openai',
    preferred_model: '',
  });

  useEffect(() => {
    const controller = new AbortController();
    setBlueprintLoading(true);
    setBlueprintError('');
    api.get(`/agent-blueprints/consulting-firm?framework=${framework}`, { signal: controller.signal })
      .then((res) => setBlueprint(res.data))
      .catch((err) => {
        if (err?.code === 'ERR_CANCELED') return;
        setBlueprintError('Unable to load the AI operating blueprint right now.');
      })
      .finally(() => setBlueprintLoading(false));

    return () => controller.abort();
  }, [framework]);

  const loadControlPlane = async () => {
    setControlLoading(true);
    setControlError('');
    try {
      const [workflowRes, runRes, leadRes, opportunityRes] = await Promise.all([
        api.get('/ai-factory/workflows'),
        api.get('/ai-factory/runs?limit=12'),
        api.get('/leads/?limit=25'),
        api.get('/opportunities/'),
      ]);
      const workflowData = workflowRes.data || [];
      const runData = runRes.data || [];
      const leadData = leadRes.data || [];
      const opportunityData = opportunityRes.data || [];

      setWorkflows(workflowData);
      setRuns(runData);
      setLeads(leadData);
      setOpportunities(opportunityData);
      setSelectedWorkflowKey((current) => {
        const availableKeys = workflowData.map((workflowItem) => workflowItem.workflow_key);
        if (current && availableKeys.includes(current)) return current;
        return workflowData.find((workflowItem) => workflowItem.workflow_key === 'lead_qualification')?.workflow_key
          || workflowData[0]?.workflow_key
          || '';
      });
      setLaunchForm((current) => ({
        ...current,
        lead_id: current.lead_id || String(leadData[0]?.id || ''),
        opportunity_id: current.opportunity_id || String(opportunityData[0]?.id || ''),
      }));
    } catch (err) {
      setControlError(errorMessage(err, 'Unable to load AI Factory runtime data.'));
    } finally {
      setControlLoading(false);
    }
  };

  useEffect(() => {
    loadControlPlane();
  }, []);

  const metrics = useMemo(() => {
    if (!blueprint) return [];
    return [
      { label: 'Agents', value: blueprint.agents?.length || 0 },
      { label: 'Workflow Steps', value: blueprint.workflow?.length || 0 },
      { label: 'Automations', value: blueprint.automation_targets?.length || 0 },
      { label: 'Weekly KPIs', value: blueprint.weekly_kpis?.length || 0 },
    ];
  }, [blueprint]);

  const workflow = useMemo(
    () => workflows.find((workflowItem) => workflowItem.workflow_key === selectedWorkflowKey) || workflows[0] || null,
    [selectedWorkflowKey, workflows]
  );
  const availableProviders = useMemo(() => Array.from(
    new Set([
      'openai',
      'anthropic',
      ...((workflow?.config && !Array.isArray(workflow.config) && workflow.config.available_providers) || []),
    ])
  ), [workflow]);
  const visibleRuns = useMemo(
    () => (workflow ? runs.filter((run) => run.workflow_id === workflow.id) : runs),
    [runs, workflow]
  );
  const pendingApprovalCount = visibleRuns.reduce(
    (count, run) => count + (run.approvals || []).filter((approval) => approval.status === 'pending').length,
    0
  );
  const isProposalWorkflow = workflow?.workflow_key === 'proposal_draft';
  const launchTargetLabel = isProposalWorkflow ? 'Opportunity Pool' : 'Lead Pool';
  const launchTargetCount = isProposalWorkflow ? opportunities.length : leads.length;

  useEffect(() => {
    if (availableProviders.length === 0) return;
    setLaunchForm((current) => (
      availableProviders.includes(current.preferred_provider)
        ? current
        : { ...current, preferred_provider: availableProviders[0] }
    ));
  }, [availableProviders]);

  const launchRun = async (event) => {
    event.preventDefault();
    if (!workflow) return;
    setLaunching(true);
    setControlError('');
    try {
      if (workflow.workflow_key === 'proposal_draft') {
        if (!launchForm.opportunity_id) return;
        await api.post('/ai-factory/workflows/proposal-draft/runs', {
          opportunity_id: Number(launchForm.opportunity_id),
          preferred_provider: launchForm.preferred_provider,
          preferred_model: launchForm.preferred_model || null,
        });
      } else {
        if (!launchForm.lead_id) return;
        await api.post('/ai-factory/workflows/lead-qualification/runs', {
          lead_id: Number(launchForm.lead_id),
          preferred_provider: launchForm.preferred_provider,
          preferred_model: launchForm.preferred_model || null,
        });
      }
      await loadControlPlane();
    } catch (err) {
      setControlError(errorMessage(err, 'Unable to launch the AI Factory run.'));
    } finally {
      setLaunching(false);
    }
  };

  const decideApproval = async (runId, approvalId, decision) => {
    setApprovalSubmitting(approvalId);
    setControlError('');
    try {
      await api.post(`/ai-factory/runs/${runId}/approvals/${approvalId}`, {
        decision,
        decision_notes: approvalDrafts[approvalId] || '',
      });
      await loadControlPlane();
    } catch (err) {
      setControlError(errorMessage(err, 'Unable to record the approval decision.'));
    } finally {
      setApprovalSubmitting(null);
    }
  };

  return (
    <div className="page">
      <div className="page-header-row">
        <div>
          <h2>AI Factory</h2>
          <p className="section-intro">Run Desir Consultant’s guarded AI control plane across lead qualification and proposal drafting with queue-backed execution, provider routing, audit trails, and supervisor approvals before any CRM write-back.</p>
        </div>
        <div className="framework-toggle">
          <button type="button" className={framework === 'crewai' ? 'toggle-active' : ''} onClick={() => setFramework('crewai')}>CrewAI</button>
          <button type="button" className={framework === 'autogen' ? 'toggle-active' : ''} onClick={() => setFramework('autogen')}>AutoGen</button>
        </div>
      </div>

      <div className="kpi-grid">
        <div className="card">
          <h3>Live Workflows</h3>
          <p className="kpi-value">{workflows.length}</p>
        </div>
        <div className="card">
          <h3>Selected Lane</h3>
          <p className="kpi-value">{workflow?.name || 'Loading...'}</p>
        </div>
        <div className="card">
          <h3>Pending Approvals</h3>
          <p className="kpi-value">{pendingApprovalCount}</p>
        </div>
        <div className="card">
          <h3>{launchTargetLabel}</h3>
          <p className="kpi-value">{launchTargetCount}</p>
        </div>
      </div>

      {controlError ? <p className="status-err" style={{ marginTop: '1rem' }}>{controlError}</p> : null}

      <div className="dual-grid" style={{ marginTop: '1rem' }}>
        <section className="card">
          <h3>Control Plane</h3>
          {controlLoading ? <p>Loading workflow runtime...</p> : workflow ? (
            <>
              <div className="framework-toggle" style={{ marginTop: '1rem' }}>
                {workflows.map((workflowItem) => (
                  <button
                    type="button"
                    key={workflowItem.workflow_key}
                    className={workflowItem.workflow_key === workflow.workflow_key ? 'toggle-active' : ''}
                    onClick={() => setSelectedWorkflowKey(workflowItem.workflow_key)}
                  >
                    {workflowItem.name}
                  </button>
                ))}
              </div>
              <p><strong>{workflow.name}</strong></p>
              <p style={{ marginTop: '0.5rem' }}>{workflow.description}</p>
              {workflow.objective ? <p className="micro-note">{workflow.objective}</p> : null}
              <div className="runtime-meta">
                <div><span className="micro-label">Autonomy</span><p>{workflow.autonomy_level}</p></div>
                <div><span className="micro-label">Primary Provider</span><p>{workflow.primary_provider}</p></div>
                <div><span className="micro-label">Default Model</span><p>{workflow.default_model || '—'}</p></div>
                <div><span className="micro-label">Supervisor Gate</span><p>{workflow.requires_human_approval ? 'Required' : 'Optional'}</p></div>
              </div>
              <ul className="check-list" style={{ marginTop: '1rem' }}>
                {((workflow.config && !Array.isArray(workflow.config) && workflow.config.approval_rules) || []).map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </>
          ) : (
            <p>No AI Factory workflow is initialized yet.</p>
          )}
        </section>

        <section className="card">
          <h3>{isProposalWorkflow ? 'Launch Proposal Draft' : 'Launch Lead Qualification'}</h3>
          <form className="form-grid" onSubmit={launchRun}>
            {isProposalWorkflow ? (
              <select
                value={launchForm.opportunity_id}
                onChange={(e) => setLaunchForm({ ...launchForm, opportunity_id: e.target.value })}
                required
              >
                <option value="">Select an opportunity</option>
                {opportunities.map((opportunity) => (
                  <option key={opportunity.id} value={opportunity.id}>
                    {opportunity.name} · {opportunity.stage} · {currency(opportunity.estimated_value)}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={launchForm.lead_id}
                onChange={(e) => setLaunchForm({ ...launchForm, lead_id: e.target.value })}
                required
              >
                <option value="">Select a lead</option>
                {leads.map((lead) => (
                  <option key={lead.id} value={lead.id}>
                    {lead.company_name || lead.contact_name} · {currency(lead.estimated_deal_value)}
                  </option>
                ))}
              </select>
            )}
            <select
              value={launchForm.preferred_provider}
              onChange={(e) => setLaunchForm({ ...launchForm, preferred_provider: e.target.value })}
            >
              {availableProviders.map((provider) => (
                <option key={provider} value={provider}>{provider}</option>
              ))}
            </select>
            <input
              placeholder="Optional model override"
              value={launchForm.preferred_model}
              onChange={(e) => setLaunchForm({ ...launchForm, preferred_model: e.target.value })}
            />
            <button type="submit" disabled={launching || (isProposalWorkflow ? !launchForm.opportunity_id : !launchForm.lead_id)}>
              {launching ? 'Launching Run...' : 'Launch Run'}
            </button>
          </form>
          <p className="micro-note">
            {isProposalWorkflow
              ? 'Proposal drafts pull current opportunity context, generate a proposal package, and still require human approval before any CRM stage update or activity write-back.'
              : 'If provider credentials are absent, the worker falls back to deterministic scoring and still requires human approval before any CRM write-back.'}
          </p>
        </section>
      </div>

      <section className="card">
        <div className="page-header-row" style={{ marginBottom: '1rem' }}>
          <div>
            <h3>Recent Runs</h3>
            <p className="section-intro">The queue, provider execution, and approval history live here for each guarded workflow lane.</p>
          </div>
          <button type="button" onClick={loadControlPlane}>Refresh Runtime</button>
        </div>
        {controlLoading ? <p>Loading runs...</p> : visibleRuns.length === 0 ? <p>No AI Factory runs for this workflow yet.</p> : (
          <div className="run-list">
            {visibleRuns.map((run) => {
              const qualification = run.output_payload?.qualification || null;
              const proposalPackage = run.output_payload?.proposal_package || null;
              const deliveryScope = Array.isArray(proposalPackage?.delivery_scope) ? proposalPackage.delivery_scope : [];
              const pricingOptions = Array.isArray(proposalPackage?.pricing_options) ? proposalPackage.pricing_options : [];
              const recommendedActions = Array.isArray(run.output_payload?.recommended_actions)
                ? run.output_payload.recommended_actions
                : [];
              const queueState = run.output_payload?.queue || null;
              const runWorkflow = workflows.find((workflowItem) => workflowItem.id === run.workflow_id) || workflow;
              const tasks = Array.isArray(run.tasks) ? run.tasks : [];
              const approvals = Array.isArray(run.approvals) ? run.approvals : [];
              return (
                <article className="run-card" key={run.id}>
                  <div className="run-head">
                    <div>
                      <div className="run-title-row">
                        <strong>Run #{run.id}</strong>
                        <StatusBadge status={run.status} />
                        <StatusBadge status={run.approval_status} />
                      </div>
                      <p className="run-meta">
                        {runWorkflow?.name || 'AI Workflow'} · {run.provider} · {run.model || 'default model'} · {run.execution_mode}
                      </p>
                    </div>
                    <div className="run-meta-block">
                      <span className="micro-label">Created</span>
                      <p>{formatDateTime(run.created_at)}</p>
                    </div>
                  </div>

                  <div className="run-grid">
                    <div>
                      <p className="micro-label">Risk Summary</p>
                      <p>{run.risk_summary || 'Pending execution.'}</p>
                      {queueState ? (
                        <>
                          <p className="micro-label" style={{ marginTop: '0.75rem' }}>Queue</p>
                          <p>{queueState.status}{queueState.job_id ? ` · ${queueState.job_id}` : ''}</p>
                        </>
                      ) : null}
                    </div>
                    <div>
                      <p className="micro-label">{proposalPackage ? 'Proposal Package' : 'Qualification'}</p>
                      {proposalPackage ? (
                        <>
                          <p>{proposalPackage.executive_summary || 'Proposal draft ready for supervisor review.'}</p>
                          {deliveryScope.length > 0 ? (
                            <ul className="check-list">
                              {deliveryScope.map((item) => <li key={item}>{item}</li>)}
                            </ul>
                          ) : null}
                          {pricingOptions.length > 0 ? (
                            <>
                              <p className="micro-label" style={{ marginTop: '0.75rem' }}>Pricing Options</p>
                              <ul className="check-list">
                                {pricingOptions.map((option) => (
                                  <li key={option.name}>{option.name} · {currency(option.estimated_amount_usd)}</li>
                                ))}
                              </ul>
                            </>
                          ) : null}
                        </>
                      ) : qualification ? (
                        <>
                          <p>Score {qualification.score} · {qualification.tier} tier · {qualification.recommended_stage}</p>
                          <ul className="check-list">
                            {(qualification.reasons || []).map((reason) => <li key={reason}>{reason}</li>)}
                          </ul>
                        </>
                      ) : (
                        <p>Waiting for worker execution.</p>
                      )}
                    </div>
                  </div>

                  {recommendedActions.length > 0 ? (
                    <div style={{ marginTop: '1rem' }}>
                      <p className="micro-label">Recommended Actions</p>
                      <ul className="check-list">
                        {recommendedActions.map((action) => <li key={action}>{action}</li>)}
                      </ul>
                    </div>
                  ) : null}

                  <div className="run-grid" style={{ marginTop: '1rem' }}>
                    <div>
                      <p className="micro-label">Task Timeline</p>
                      {tasks.length === 0 ? <p>No task updates recorded yet.</p> : (
                        <ul className="timeline-list">
                          {tasks.map((task) => (
                            <li key={task.id}>
                              <div className="timeline-row">
                                <strong>{task.agent_name}</strong>
                                <StatusBadge status={task.status} />
                              </div>
                              <p>{task.notes || 'No notes recorded.'}</p>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <div>
                      <p className="micro-label">Approvals</p>
                      {approvals.length === 0 ? <p>No approvals recorded yet.</p> : approvals.map((approval) => (
                        <div className="approval-card" key={approval.id}>
                          <div className="timeline-row">
                            <strong>{approval.approval_type}</strong>
                            <StatusBadge status={approval.status} />
                          </div>
                          <p>{approval.requested_reason}</p>
                          {approval.status === 'pending' && run.status === 'awaiting_approval' ? (
                            <>
                              <textarea
                                placeholder="Decision notes"
                                value={approvalDrafts[approval.id] || ''}
                                onChange={(e) => setApprovalDrafts({ ...approvalDrafts, [approval.id]: e.target.value })}
                              />
                              <div className="approval-actions">
                                <button
                                  type="button"
                                  onClick={() => decideApproval(run.id, approval.id, 'approve')}
                                  disabled={approvalSubmitting === approval.id}
                                >
                                  {approvalSubmitting === approval.id ? 'Working...' : 'Approve Write-Back'}
                                </button>
                                <button
                                  type="button"
                                  className="secondary-button"
                                  onClick={() => decideApproval(run.id, approval.id, 'reject')}
                                  disabled={approvalSubmitting === approval.id}
                                >
                                  Reject
                                </button>
                              </div>
                            </>
                          ) : (
                            <p className="run-meta">
                              {approval.decided_by ? `Decided by ${approval.decided_by} on ${formatDateTime(approval.decided_at)}` : 'Pending supervisor review.'}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {blueprintLoading ? <p>Loading blueprint...</p> : blueprintError ? <p className="status-err">{blueprintError}</p> : blueprint ? (
        <>
          <div className="kpi-grid">
            {metrics.map((metric) => (
              <div className="card" key={metric.label}>
                <h3>{metric.label}</h3>
                <p className="kpi-value">{metric.value}</p>
              </div>
            ))}
          </div>

          <div className="card spotlight-card">
            <div>
              <h3>{blueprint.name}</h3>
              <p>{blueprint.objective}</p>
            </div>
            <div>
              <p className="micro-label">Blueprint stack</p>
              <p><strong>{blueprint.framework_label}</strong> + AI Factory control plane + CRM + recruiter board</p>
            </div>
          </div>

          <div className="dual-grid">
            <section className="card">
              <h3>Agent roster</h3>
              <div className="stack-list">
                {blueprint.agents.map((agent) => (
                  <article className="agent-card" key={agent.name}>
                    <div className="agent-card-head">
                      <strong>{agent.name}</strong>
                      <span className="badge badge-qualified">{agent.role}</span>
                    </div>
                    <p>{agent.mission}</p>
                    <ul>
                      {agent.inputs.map((item) => <li key={item}>{item}</li>)}
                    </ul>
                    <p className="micro-label">Outputs</p>
                    <p>{agent.outputs.join(' • ')}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="card">
              <h3>Workflow handoffs</h3>
              <ol className="workflow-list">
                {blueprint.workflow.map((step) => (
                  <li key={step.order}>
                    <strong>{step.name}</strong>
                    <p>{step.description}</p>
                    <p className="workflow-handoff">Owner: {step.owner} → Next: {step.handoff_to}</p>
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <div className="dual-grid">
            <section className="card">
              <h3>Automation targets</h3>
              <ul className="check-list">
                {blueprint.automation_targets.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </section>
            <section className="card">
              <h3>Weekly operating KPIs</h3>
              <ul className="check-list">
                {blueprint.weekly_kpis.map((item) => <li key={item}>{item}</li>)}
              </ul>
            </section>
          </div>

          <section className="card">
            <h3>Implementation starter prompts</h3>
            <div className="prompt-grid">
              {blueprint.starter_prompts.map((prompt) => (
                <article key={prompt.title} className="prompt-card">
                  <p className="micro-label">{prompt.title}</p>
                  <p>{prompt.text}</p>
                </article>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  );
}

function App() {
  const [token, setToken] = useState(() => window.localStorage.getItem(TOKEN_STORAGE_KEY));
  const logout = () => { window.localStorage.removeItem(TOKEN_STORAGE_KEY); setToken(null); };

  if (!token) {
    return <Router basename={ROUTER_BASENAME}><Login onLogin={setToken} /></Router>;
  }

  return (
    <Router basename={ROUTER_BASENAME}>
      <div className="app">
        <nav className="navbar">
          <h1 className="logo">DesirTech CRM</h1>
          <div className="nav-links">
            <Link to="/">Dashboard</Link>
            <Link to="/clients">Clients</Link>
            <Link to="/leads">Leads</Link>
            <Link to="/opportunities">Opportunities</Link>
            <Link to="/invoices">Invoices</Link>
            <Link to="/payments">Payments</Link>
            <Link to="/ai-factory">AI Factory</Link>
            <button type="button" onClick={logout} style={{ background: 'transparent', border: 0, color: '#a4b0be', cursor: 'pointer', fontWeight: 500 }}>Sign Out</button>
          </div>
        </nav>
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/leads" element={<Leads />} />
            <Route path="/opportunities" element={<Opportunities />} />
            <Route path="/invoices" element={<Invoices />} />
            <Route path="/payments" element={<Payments />} />
            <Route path="/ai-factory" element={<AIFactory />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
