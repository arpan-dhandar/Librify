import { useEffect, useState } from 'react';
import { Send } from 'lucide-react';
import axios from '../api/axios';

function todayPlus(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export default function IssueBook() {
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loadError, setLoadError] = useState('');

  const [bookId, setBookId] = useState('');
  const [memberId, setMemberId] = useState('');
  const [dueDate, setDueDate] = useState(todayPlus(14));

  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState(null);

  useEffect(() => {
    Promise.all([axios.get('/api/books'), axios.get('/api/members')])
      .then(([booksRes, membersRes]) => {
        const b = booksRes.data;
        const m = membersRes.data;
        setBooks(Array.isArray(b) ? b : b?.books ?? []);
        setMembers(Array.isArray(m) ? m : m?.members ?? []);
      })
      .catch((err) => setLoadError(err.response?.data?.message || err.message));
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setFormMsg(null);
    try {
      await axios.post('/api/issue', { bookId, memberId, dueDate });
      const bookTitle = books.find((b) => (b._id || b.id) === bookId)?.title ?? 'Book';
      setFormMsg({ type: 'success', text: `${bookTitle} issued — due ${dueDate}.` });
      setBookId('');
      setMemberId('');
      setDueDate(todayPlus(14));
    } catch (err) {
      setFormMsg({ type: 'error', text: err.response?.data?.message || err.message });
    } finally {
      setSubmitting(false);
    }
  }

  const noData = !loadError && (books.length === 0 || members.length === 0);

  return (
    <div className="page-enter">
      <header className="page-head">
        <div className="eyebrow">Front desk</div>
        <h1>Issue a book</h1>
        <p className="desc">Hand a copy to a member and set when it's due back.</p>
      </header>

      <div className="catalog-card" style={{ maxWidth: 560 }}>
        <div className="card-title">New issue</div>
        <div className="card-sub">Pick a book, a member, and a due date.</div>

        {loadError && <div className="inline-msg error">Couldn't load books/members — {loadError}.</div>}
        {formMsg && <div className={`inline-msg ${formMsg.type}`}>{formMsg.text}</div>}

        <form onSubmit={handleSubmit} className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
          <div className="field">
            <label htmlFor="book">Book</label>
            <select id="book" value={bookId} onChange={(e) => setBookId(e.target.value)} required>
              <option value="" disabled>Select a book&hellip;</option>
              {books.map((b) => (
                <option key={b._id || b.id} value={b._id || b.id}>
                  {b.title} {b.author ? `— ${b.author}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="member">Member</label>
            <select id="member" value={memberId} onChange={(e) => setMemberId(e.target.value)} required>
              <option value="" disabled>Select a member&hellip;</option>
              {members.map((m) => (
                <option key={m._id || m.id} value={m._id || m.id}>
                  {m.name} {m.email ? `— ${m.email}` : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="dueDate">Due date</label>
            <input id="dueDate" type="date" value={dueDate} min={todayPlus(0)} onChange={(e) => setDueDate(e.target.value)} required />
          </div>

          <button type="submit" className="btn btn-primary" disabled={submitting || noData} style={{ justifySelf: 'start' }}>
            {submitting ? <span className="spinner" /> : <Send size={15} strokeWidth={2} />}
            {submitting ? 'Issuing…' : 'Issue book'}
          </button>

          {noData && (
            <p style={{ fontSize: 12.5, color: 'var(--parchment-faint)' }}>
              Add at least one book and one member before issuing.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}