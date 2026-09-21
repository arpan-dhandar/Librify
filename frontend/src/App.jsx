import './App.css';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Books from './pages/Books';
import Members from './pages/Members';
import IssueBook from './pages/IssueBook';
import ActiveIssues from './pages/ActiveIssues';
import Overdue from './pages/Overdue';

export default function App() {
  return (
    <div className="app-shell">
      <Navbar />
      <main className="main-panel">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/books" element={<Books />} />
          <Route path="/members" element={<Members />} />
          <Route path="/issue" element={<IssueBook />} />
          <Route path="/active-issues" element={<ActiveIssues />} />
          <Route path="/overdue" element={<Overdue />} />
        </Routes>
      </main>
    </div>
  );
}