import { useEffect, useState } from 'react';
import { UserPlus } from 'lucide-react';
import axios from '../api/axios';

const emptyForm = { name: '', email: '', phone: '' };

export default function Members() {
  const [members, setMembers] = useState([]);
  const [status, setStatus] = useState('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState(null);

  function loadMembers() {
    setStatus('loading');
    axios
      .get('/api/members')
      .then((res) => {
        const data = res.data;
        setMembers(Array.isArray(data) ? data : data?.members ?? []);
        setStatus('ready');
      })
      .catch((err) => {
        setErrorMsg(err.response?.data?.message || err.message);
        setStatus('error');
      });
  }

  useEffect(loadMembers, []);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setFormMsg(null);
    try {
      await axios.post('/api/members', form);
      setFormMsg({ type: 'success', text: `${form.name} added as a member.` });
      setForm(emptyForm);
      loadMembers();
    } catch (err) {
      setFormMsg({ type: 'error', text: err.response?.data?.message || err.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-enter">
      <header className="page-head">
        <div className="eyebrow">Borrowers</div>
        <h1>Members</h1>
        <p className="desc">Everyone registered to borrow from the library.</p>
      </header>

      <div className="catalog-card">
        <div className="card-title">Add a member</div>
        <div className="card-sub">New members appear in the table below once saved.</div>

        {formMsg && <div className={`inline-msg ${formMsg.type}`}>{formMsg.text}</div>}

        <form onSubmit={handleSubmit} className="form-grid">
          <div className="field">
            <label htmlFor="name">Full name</label>
            <input id="name" name="name" value={form.name} onChange={handleChange} placeholder="Asha Verma" required />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="asha@college.edu" required />
          </div>
          <div className="field">
            <label htmlFor="phone">Phone</label>
            <input id="phone" name="phone" value={form.phone} onChange={handleChange} placeholder="98765 43210" required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? <span className="spinner" /> : <UserPlus size={15} strokeWidth={2} />}
            {submitting ? 'Saving…' : 'Add member'}
          </button>
        </form>
      </div>

      <div className="catalog-card" style={{ marginTop: 20 }}>
        <div className="card-title">All members</div>
        <div className="card-sub">{status === 'ready' ? `${members.length} registered` : ' '}</div>

        {status === 'loading' && (
          <div className="state-block"><span className="spinner" /> &nbsp;Loading members&hellip;</div>
        )}

        {status === 'error' && <div className="state-block error">Couldn't load members — {errorMsg}.</div>}

        {status === 'ready' && members.length === 0 && (
          <div className="state-block">No members yet — add the first one above.</div>
        )}

        {status === 'ready' && members.length > 0 && (
          <div className="table-wrap">
            <table className="ledger">
              <thead>
                <tr><th>Name</th><th>Email</th><th>Phone</th><th>Member since</th></tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m._id || m.id}>
                    <td className="strong">{m.name}</td>
                    <td>{m.email}</td>
                    <td>{m.phone}</td>
                    <td>{m.createdAt ? new Date(m.createdAt).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}