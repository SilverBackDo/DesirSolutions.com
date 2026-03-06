import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';
import './App.css';

const API_BASE = process.env.REACT_APP_API_URL || '/api';
const API_KEY = process.env.REACT_APP_API_KEY || '';
const STAGE_OPTIONS = ['new', 'qualified', 'discovery', 'proposal', 'negotiation', 'won', 'lost', 'on_hold'];

const api = axios.create({
  baseURL: API_BASE,
  headers: API_KEY ? { 'X-API-Key': API_KEY } : {},
});

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

// ─── Dashboard Page ───
function Dashboard() {
  const [health, setHealth] = useState(null);
  const [pipeline, setPipeline] = useState([]);
  const [loadingPipeline, setLoadingPipeline] = useState(true);

  useEffect(() => {
    axios.get(`${API_BASE}/../health`)
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

// ─── Clients Page ───
function Clients() {
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
      {loading ? (
        <p>Loading...</p>
      ) : clients.length === 0 ? (
        <p>No clients yet. Add your first client!</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Company</th>
              <th>Phone</th>
            </tr>
          </thead>
          <tbody>
            {clients.map(c => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.email}</td>
                <td>{c.company || '—'}</td>
                <td>{c.phone || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    source: 'website',
    contact_name: '',
    contact_email: '',
    company_name: '',
    estimated_deal_value: '',
    notes: '',
  });

  const loadLeads = () => {
    setLoading(true);
    api.get('/leads')
      .then(res => setLeads(res.data))
      .catch(err => console.error('Failed to load leads:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const onSubmit = (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      estimated_deal_value: form.estimated_deal_value ? Number(form.estimated_deal_value) : null,
    };
    api.post('/leads', payload)
      .then(() => {
        setForm({
          source: 'website',
          contact_name: '',
          contact_email: '',
          company_name: '',
          estimated_deal_value: '',
          notes: '',
        });
        loadLeads();
      })
      .catch(err => console.error('Failed to create lead:', err));
  };

  return (
    <div className="page">
      <h2>Leads</h2>
      <form className="card form-grid" onSubmit={onSubmit}>
        <h3>Create Lead</h3>
        <input
          placeholder="Contact Name"
          value={form.contact_name}
          onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
          required
        />
        <input
          placeholder="Contact Email"
          type="email"
          value={form.contact_email}
          onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
        />
        <input
          placeholder="Company Name"
          value={form.company_name}
          onChange={(e) => setForm({ ...form, company_name: e.target.value })}
        />
        <input
          placeholder="Estimated Deal Value"
          type="number"
          min="0"
          value={form.estimated_deal_value}
          onChange={(e) => setForm({ ...form, estimated_deal_value: e.target.value })}
        />
        <textarea
          placeholder="Notes"
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
        />
        <button type="submit">Create Lead</button>
      </form>

      {loading ? (
        <p>Loading...</p>
      ) : leads.length === 0 ? (
        <div className="card"><p>No leads yet.</p></div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Contact</th>
              <th>Email</th>
              <th>Company</th>
              <th>Source</th>
              <th>Est. Value</th>
            </tr>
          </thead>
          <tbody>
            {leads.map(lead => (
              <tr key={lead.id}>
                <td>{lead.contact_name}</td>
                <td>{lead.contact_email || '—'}</td>
                <td>{lead.company_name || '—'}</td>
                <td>{lead.source}</td>
                <td>{currency(lead.estimated_deal_value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Opportunities() {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    name: '',
    stage: 'new',
    estimated_value: '',
    probability_percent: 10,
  });

  const loadOpportunities = () => {
    setLoading(true);
    api.get('/opportunities')
      .then(res => setOpportunities(res.data))
      .catch(err => console.error('Failed to load opportunities:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOpportunities();
  }, []);

  const onSubmit = (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      estimated_value: Number(form.estimated_value || 0),
      probability_percent: Number(form.probability_percent || 0),
    };
    api.post('/opportunities', payload)
      .then(() => {
        setForm({ name: '', stage: 'new', estimated_value: '', probability_percent: 10 });
        loadOpportunities();
      })
      .catch(err => console.error('Failed to create opportunity:', err));
  };

  return (
    <div className="page">
      <h2>Opportunities</h2>
      <form className="card form-grid" onSubmit={onSubmit}>
        <h3>Create Opportunity</h3>
        <input
          placeholder="Opportunity Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <select
          value={form.stage}
          onChange={(e) => setForm({ ...form, stage: e.target.value })}
        >
          {STAGE_OPTIONS.map(stage => <option value={stage} key={stage}>{stage}</option>)}
        </select>
        <input
          placeholder="Estimated Value"
          type="number"
          min="0"
          value={form.estimated_value}
          onChange={(e) => setForm({ ...form, estimated_value: e.target.value })}
        />
        <input
          placeholder="Probability %"
          type="number"
          min="0"
          max="100"
          value={form.probability_percent}
          onChange={(e) => setForm({ ...form, probability_percent: e.target.value })}
        />
        <button type="submit">Create Opportunity</button>
      </form>

      {loading ? (
        <p>Loading...</p>
      ) : opportunities.length === 0 ? (
        <div className="card"><p>No opportunities yet.</p></div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Stage</th>
              <th>Estimated</th>
              <th>Probability</th>
            </tr>
          </thead>
          <tbody>
            {opportunities.map(opportunity => (
              <tr key={opportunity.id}>
                <td>{opportunity.name}</td>
                <td><StageBadge stage={opportunity.stage} /></td>
                <td>{currency(opportunity.estimated_value)}</td>
                <td>{opportunity.probability_percent}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Invoices() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    client_id: '',
    invoice_number: '',
    invoice_date: '',
    due_date: '',
    status: 'draft',
    subtotal: '',
    tax_amount: '',
    total_amount: '',
  });

  const loadInvoices = () => {
    setLoading(true);
    api.get('/invoices')
      .then(res => setInvoices(res.data))
      .catch(err => console.error('Failed to load invoices:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  const onSubmit = (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      client_id: Number(form.client_id),
      subtotal: Number(form.subtotal || 0),
      tax_amount: Number(form.tax_amount || 0),
      total_amount: Number(form.total_amount || 0),
    };

    api.post('/invoices', payload)
      .then(() => {
        setForm({
          client_id: '',
          invoice_number: '',
          invoice_date: '',
          due_date: '',
          status: 'draft',
          subtotal: '',
          tax_amount: '',
          total_amount: '',
        });
        loadInvoices();
      })
      .catch(err => console.error('Failed to create invoice:', err));
  };

  return (
    <div className="page">
      <h2>Invoices</h2>
      <form className="card form-grid" onSubmit={onSubmit}>
        <h3>Create Invoice</h3>
        <input
          placeholder="Client ID"
          type="number"
          min="1"
          value={form.client_id}
          onChange={(e) => setForm({ ...form, client_id: e.target.value })}
          required
        />
        <input
          placeholder="Invoice Number"
          value={form.invoice_number}
          onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
          required
        />
        <input
          type="date"
          value={form.invoice_date}
          onChange={(e) => setForm({ ...form, invoice_date: e.target.value })}
          required
        />
        <input
          type="date"
          value={form.due_date}
          onChange={(e) => setForm({ ...form, due_date: e.target.value })}
          required
        />
        <select
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        >
          <option value="draft">draft</option>
          <option value="issued">issued</option>
          <option value="partially_paid">partially_paid</option>
          <option value="paid">paid</option>
          <option value="overdue">overdue</option>
          <option value="void">void</option>
        </select>
        <input
          placeholder="Subtotal"
          type="number"
          min="0"
          value={form.subtotal}
          onChange={(e) => setForm({ ...form, subtotal: e.target.value })}
        />
        <input
          placeholder="Tax"
          type="number"
          min="0"
          value={form.tax_amount}
          onChange={(e) => setForm({ ...form, tax_amount: e.target.value })}
        />
        <input
          placeholder="Total"
          type="number"
          min="0"
          value={form.total_amount}
          onChange={(e) => setForm({ ...form, total_amount: e.target.value })}
        />
        <button type="submit">Create Invoice</button>
      </form>

      {loading ? (
        <p>Loading...</p>
      ) : invoices.length === 0 ? (
        <div className="card"><p>No invoices yet.</p></div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Number</th>
              <th>Client ID</th>
              <th>Status</th>
              <th>Invoice Date</th>
              <th>Due Date</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map(invoice => (
              <tr key={invoice.id}>
                <td>{invoice.invoice_number}</td>
                <td>{invoice.client_id}</td>
                <td>{invoice.status}</td>
                <td>{invoice.invoice_date}</td>
                <td>{invoice.due_date}</td>
                <td>{currency(invoice.total_amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function Payments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    invoice_id: '',
    client_id: '',
    payment_date: '',
    amount: '',
    method: 'ach',
    reference_number: '',
    processor: '',
  });

  const loadPayments = () => {
    setLoading(true);
    api.get('/payments')
      .then(res => setPayments(res.data))
      .catch(err => console.error('Failed to load payments:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const onSubmit = (event) => {
    event.preventDefault();
    const payload = {
      ...form,
      invoice_id: form.invoice_id ? Number(form.invoice_id) : null,
      client_id: Number(form.client_id),
      amount: Number(form.amount || 0),
    };

    api.post('/payments', payload)
      .then(() => {
        setForm({
          invoice_id: '',
          client_id: '',
          payment_date: '',
          amount: '',
          method: 'ach',
          reference_number: '',
          processor: '',
        });
        loadPayments();
      })
      .catch(err => console.error('Failed to create payment:', err));
  };

  return (
    <div className="page">
      <h2>Payments</h2>
      <form className="card form-grid" onSubmit={onSubmit}>
        <h3>Record Payment</h3>
        <input
          placeholder="Client ID"
          type="number"
          min="1"
          value={form.client_id}
          onChange={(e) => setForm({ ...form, client_id: e.target.value })}
          required
        />
        <input
          placeholder="Invoice ID (optional)"
          type="number"
          min="1"
          value={form.invoice_id}
          onChange={(e) => setForm({ ...form, invoice_id: e.target.value })}
        />
        <input
          type="date"
          value={form.payment_date}
          onChange={(e) => setForm({ ...form, payment_date: e.target.value })}
          required
        />
        <input
          placeholder="Amount"
          type="number"
          min="0.01"
          step="0.01"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          required
        />
        <select
          value={form.method}
          onChange={(e) => setForm({ ...form, method: e.target.value })}
        >
          <option value="ach">ach</option>
          <option value="wire">wire</option>
          <option value="card">card</option>
          <option value="check">check</option>
          <option value="cash">cash</option>
          <option value="other">other</option>
        </select>
        <input
          placeholder="Reference Number"
          value={form.reference_number}
          onChange={(e) => setForm({ ...form, reference_number: e.target.value })}
        />
        <input
          placeholder="Processor"
          value={form.processor}
          onChange={(e) => setForm({ ...form, processor: e.target.value })}
        />
        <button type="submit">Record Payment</button>
      </form>

      {loading ? (
        <p>Loading...</p>
      ) : payments.length === 0 ? (
        <div className="card"><p>No payments yet.</p></div>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Client ID</th>
              <th>Invoice ID</th>
              <th>Method</th>
              <th>Amount</th>
              <th>Reference</th>
            </tr>
          </thead>
          <tbody>
            {payments.map(payment => (
              <tr key={payment.id}>
                <td>{payment.payment_date}</td>
                <td>{payment.client_id}</td>
                <td>{payment.invoice_id || '—'}</td>
                <td>{payment.method}</td>
                <td>{currency(payment.amount)}</td>
                <td>{payment.reference_number || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

// ─── App ───
function App() {
  return (
    <Router>
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
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
