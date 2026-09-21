import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import axios from '../api/axios';

const emptyForm = { title: '', author: '', isbn: '', totalCopies: '' };

// Backend replies { success, count, data: [...] }; also accepts a plain array.
function extractList(resData, legacyKey) {
  if (Array.isArray(resData)) return resData;
  if (Array.isArray(resData?.data)) return resData.data;
  if (Array.isArray(resData?.[legacyKey])) return resData[legacyKey];
  return [];
}

export default function Books() {
  const [books, setBooks] = useState([]);
  const [status, setStatus] = useState('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [formMsg, setFormMsg] = useState(null);

  function loadBooks() {
    setStatus('loading');
    axios
      .get('/api/books')
      .then((res) => {
        setBooks(extractList(res.data, 'books'));
        setStatus('ready');
      })
      .catch((err) => {
        setErrorMsg(err.response?.data?.message || err.message);
        setStatus('error');
      });
  }

  useEffect(loadBooks, []);

  function handleChange(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    setFormMsg(null);
    try {
      await axios.post('/api/books', {
        title: form.title,
        author: form.author,
        isbn: form.isbn,
        totalCopies: Number(form.totalCopies) || 1,
      });
      setFormMsg({ type: 'success', text: `"${form.title}" added to the catalog.` });
      setForm(emptyForm);
      loadBooks();
    } catch (err) {
      setFormMsg({ type: 'error', text: err.response?.data?.message || err.message });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-enter">
      <header className="page-head">
        <div className="eyebrow">Catalog</div>
        <h1>Books</h1>
        <p className="desc">Every title on the shelves, with room to add a new one.</p>
      </header>

      <div className="catalog-card">
        <div className="card-title">Add a book</div>
        <div className="card-sub">New titles appear in the table below once saved.</div>

        {formMsg && <div className={`inline-msg ${formMsg.type}`}>{formMsg.text}</div>}

        <form onSubmit={handleSubmit} className="form-grid">
          <div className="field">
            <label htmlFor="title">Title</label>
            <input id="title" name="title" value={form.title} onChange={handleChange} placeholder="The Name of the Wind" required />
          </div>
          <div className="field">
            <label htmlFor="author">Author</label>
            <input id="author" name="author" value={form.author} onChange={handleChange} placeholder="Patrick Rothfuss" required />
          </div>
          <div className="field">
            <label htmlFor="isbn">ISBN</label>
            <input id="isbn" name="isbn" value={form.isbn} onChange={handleChange} placeholder="978-0-7564-0407-9" required />
          </div>
          <div className="field">
            <label htmlFor="totalCopies">Copies</label>
            <input id="totalCopies" name="totalCopies" type="number" min="1" value={form.totalCopies} onChange={handleChange} placeholder="3" required />
          </div>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? <span className="spinner" /> : <Plus size={15} strokeWidth={2} />}
            {submitting ? 'Saving…' : 'Add book'}
          </button>
        </form>
      </div>

      <div className="catalog-card" style={{ marginTop: 20 }}>
        <div className="card-title">All titles</div>
        <div className="card-sub">
          {status === 'ready' ? `${books.length} book${books.length === 1 ? '' : 's'} in the catalog` : ' '}
        </div>

        {status === 'loading' && (
          <div className="state-block"><span className="spinner" /> &nbsp;Loading books&hellip;</div>
        )}

        {status === 'error' && <div className="state-block error">Couldn't load books — {errorMsg}.</div>}

        {status === 'ready' && books.length === 0 && (
          <div className="state-block">No books yet — add the first one above.</div>
        )}

        {status === 'ready' && books.length > 0 && (
          <div className="table-wrap">
            <table className="ledger">
              <thead>
                <tr>
                  <th>Title</th><th>Author</th><th>ISBN</th><th>Copies</th><th>Available</th>
                </tr>
              </thead>
              <tbody>
                {books.map((b) => {
                  const total = b.totalCopies ?? b.copies ?? '—';
                  const available = b.availableCopies ?? b.available ?? '—';
                  return (
                    <tr key={b._id || b.id}>
                      <td className="strong">{b.title}</td>
                      <td>{b.author}</td>
                      <td>{b.isbn}</td>
                      <td>{total}</td>
                      <td>
                        {available !== '—' ? (
                          <span className={`tag ${Number(available) > 0 ? 'ok' : 'danger'}`}>{available}</span>
                        ) : (
                          available
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}