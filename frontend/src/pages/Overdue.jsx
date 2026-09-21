import { useEffect, useState } from 'react';
import axios from '../api/axios';

// Backend replies { success, count, data: [...] }; also accepts a plain array.
function extractList(resData, legacyKey) {
  if (Array.isArray(resData)) return resData;
  if (Array.isArray(resData?.data)) return resData.data;
  if (Array.isArray(resData?.[legacyKey])) return resData[legacyKey];
  return [];
}

function daysLate(dueDate) {
  if (!dueDate) return null;
  const diff = Date.now() - new Date(dueDate).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

// Handles both nested (issue -> bookCopy -> book) and flat shapes.
function getBookTitle(r) {
  return r.bookCopy?.book?.title ?? r.book?.title ?? r.bookTitle ?? '—';
}

function getMemberName(r) {
  return r.member?.name ?? r.memberName ?? '—';
}

export default function Overdue() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    axios
      .get('/api/overdue')
      .then((res) => {
        setRows(extractList(res.data, 'overdue'));
        setStatus('ready');
      })
      .catch((err) => {
        setErrorMsg(err.response?.data?.message || err.message);
        setStatus('error');
      });
  }, []);

  return (
    <div className="page-enter">
      <header className="page-head">
        <div className="eyebrow">Follow-up</div>
        <h1>Overdue</h1>
        <p className="desc">Copies that haven't come back by their due date.</p>
      </header>

      <div className="catalog-card">
        <div className="card-title">Past due</div>
        <div className="card-sub">{status === 'ready' ? `${rows.length} overdue` : ' '}</div>

        {status === 'loading' && (
          <div className="state-block"><span className="spinner" /> &nbsp;Checking due dates&hellip;</div>
        )}

        {status === 'error' && <div className="state-block error">Couldn't load overdue list — {errorMsg}.</div>}

        {status === 'ready' && rows.length === 0 && (
          <div className="state-block">Nothing overdue — the shelves are settled.</div>
        )}

        {status === 'ready' && rows.length > 0 && (
          <div className="table-wrap">
            <table className="ledger">
              <thead>
                <tr><th>Book</th><th>Member</th><th>Due date</th><th>Days late</th></tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const due = r.dueDate ?? r.due;
                  const late = r.daysOverdue ?? daysLate(due);
                  return (
                    <tr key={r._id || r.id}>
                      <td className="strong">{getBookTitle(r)}</td>
                      <td>{getMemberName(r)}</td>
                      <td>{due ? new Date(due).toLocaleDateString() : '—'}</td>
                      <td><span className="tag danger">{late ?? '—'} days</span></td>
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