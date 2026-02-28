import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import axios from 'axios';
import './App.css';

const API_BASE = process.env.REACT_APP_API_URL || '/api';

// ─── Dashboard Page ───
function Dashboard() {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    axios.get(`${API_BASE}/../health`)
      .then(res => setHealth(res.data))
      .catch(() => setHealth({ status: 'unreachable' }));
  }, []);

  return (
    <div className="page">
      <h2>Dashboard</h2>
      <div className="card">
        <h3>API Status</h3>
        <p className={health?.status === 'healthy' ? 'status-ok' : 'status-err'}>
          {health ? health.status : 'Checking...'}
        </p>
      </div>
    </div>
  );
}

// ─── Clients Page ───
function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API_BASE}/clients/`)
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
        <table className="clients-table">
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
          </div>
        </nav>
        <main>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/clients" element={<Clients />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
