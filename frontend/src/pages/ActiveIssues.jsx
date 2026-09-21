import { useEffect, useState } from 'react';
import { Undo2 } from 'lucide-react';
import axios from '../api/axios';

export default function ActiveIssues() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('loading');
  const [errorMsg, setErrorMsg] = useState('');
  const [returningId, setReturningId] = useState(null);
  const [rowMsg, setRowMsg] = useState(null);

  function loadIssues() {
    setStatus('loading');
    axios
      .get('/api/issues/active')
      .then((res) => {
        const data = res.data;
        setRows(Array.isArray(data) ? data : data?.issues ?? []);
        setStatus('ready');
      })
      .catch((err) => {
        setErrorMsg(err.response?.data?.message || err.message);
        setStatus('error');
      });
  }

  useEffect(loadIssues, []);

  async function handleReturn(issueId, bookTitle) {
    setReturningId(issueId);
    setRowMsg(null);
    try {
      await axios.put(`/api/return/${issueId}`);
      setRowMsg({ id: issueId, type: 'success', text: `${bookTitle} marked returned.` });
      setRows((prev) => prev.filter((r) => (r._id || r.id) !== issueId));
    } catch (err) {
      setRowMsg({ id: issueId, type: 'error', text: err.response?.data?.message || err.message });
    } finally {
      setReturningId(null);
    }
  }

  return (
    <div className="page-enter">
      <header className="page-head">
        <div className="eyebrow">In circulation</div>
        <h1>Active issues</h1>
        <p className="desc">Copies currently checked out. Mark one returned when it's back.</p>
      </header>

      <div className="catalog-card">
        <div className="card-title">Currently issued</div>
        <div className="card-sub">{status === 'ready' ? `${rows.length} out on loan` : ' '}</div>

        {rowMsg && rowMsg.type === 'error' && <div className="inline-msg error">{rowMsg.text}</div>}

        {status === 'loading' && (
          <div className="state-block"><span className="spinner" /> &nbsp;Loading active issues&hellip;</div>
        )}

        {status === 'error' && <div className="state-block error">Couldn't load active issues — {errorMsg}.</div>}

        {status === 'ready' && rows.length === 0 && (
          <div className="state-block">Nothing checked out right now.</div>
        )}

        {status === 'ready' && rows.length > 0 && (
          <div className="table-wrap">
            <table className="ledger">
              <thead>
                <tr><th>Book</th><th>Member</th><th>Issued</th><th>Due date</th><th></th></tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const id = r._id || r.id;
                  const bookTitle = r.book?.title ?? r.bookTitle ?? r.book ?? '—';
                  const memberName = r.member?.name ?? r.memberName ?? r.member ?? '—';
                  const issued = r.issueDate ?? r.issuedAt;
                  const due = r.dueDate ?? r.due;
                  const overdue = due && new Date(due).getTime() < Date.now();
                  const isReturning = returningId === id;

                  return (
                    <tr key={id}>
                      <td className="strong">{bookTitle}</td>
                      <td>{memberName}</td>
                      <td>{issued ? new Date(issued).toLocaleDateString() : '—'}</td>
                      <td>
                        {due ? (
                          <span className={`tag ${overdue ? 'danger' : 'ok'}`}>{new Date(due).toLocaleDateString()}</span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>
                        <button className="btn btn-ghost btn-small" disabled={isReturning} onClick={() => handleReturn(id, bookTitle)}>
                          {isReturning ? <span className="spinner" /> : <Undo2 size={13} strokeWidth={2} />}
                          {isReturning ? 'Returning…' : 'Mark returned'}
                        </button>
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