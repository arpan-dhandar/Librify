import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Users, ClipboardList, AlarmClock } from 'lucide-react';
import axios from '../api/axios';
import StatCard from '../components/StatCard';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let cancelled = false;

    axios
      .get('/api/dashboard')
      .then((res) => {
        if (cancelled) return;
        setData(res.data);
        setStatus('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        setErrorMsg(err.response?.data?.message || err.message);
        setStatus('error');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const totalBooks = data?.totalBooks ?? data?.books ?? 0;
  const totalMembers = data?.totalMembers ?? data?.members ?? 0;
  const issued = data?.issued ?? data?.issuedBooks ?? data?.activeIssues ?? 0;
  const overdue = data?.overdue ?? data?.overdueBooks ?? 0;

  return (
    <div className="page-enter">
      <header className="page-head">
        <div className="eyebrow">Overview</div>
        <h1>Reading room, at a glance</h1>
        <p className="desc">
          A snapshot of the whole collection — what's on the shelves, who's borrowing,
          and what needs to come back.
        </p>
      </header>

      {status === 'loading' && (
        <div className="state-block">
          <span className="spinner" /> &nbsp;Fetching the ledger&hellip;
        </div>
      )}

      {status === 'error' && (
        <div className="state-block error">
          Couldn't reach the dashboard endpoint — {errorMsg}. Is the backend running on
          port 5000?
        </div>
      )}

      {status === 'ready' && (
        <div className="stat-grid">
          <StatCard label="Total books" value={totalBooks} foot="Titles in the catalog" accent="var(--brass)" delay={0} />
          <StatCard label="Members" value={totalMembers} foot="Registered borrowers" accent="var(--moss)" delay={60} />
          <StatCard label="Issued" value={issued} foot="Copies currently out" accent="var(--spine-bright)" delay={120} />
          <StatCard label="Overdue" value={overdue} foot="Past their due date" accent="var(--rust)" delay={180} />
        </div>
      )}

      <div className="catalog-card" style={{ marginTop: 28 }}>
        <div className="card-title">Quick links</div>
        <div className="card-sub">Jump straight to the desk you need.</div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <QuickLink href="/books" icon={BookOpen} text="Manage books" />
          <QuickLink href="/members" icon={Users} text="Manage members" />
          <QuickLink href="/active-issues" icon={ClipboardList} text="Active issues" />
          <QuickLink href="/overdue" icon={AlarmClock} text="Overdue list" />
        </div>
      </div>
    </div>
  );
}

function QuickLink({ href, icon: Icon, text }) {
  return (
    <Link to={href} className="btn btn-ghost">
      <Icon size={15} strokeWidth={1.8} />
      {text}
    </Link>
  );
}