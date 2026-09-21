import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  BookPlus,
  AlarmClock,
  ClipboardList,
} from 'lucide-react';

const links = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/books', label: 'Books', icon: BookOpen },
  { to: '/members', label: 'Members', icon: Users },
  { to: '/issue', label: 'Issue a book', icon: BookPlus },
  { to: '/active-issues', label: 'Active issues', icon: ClipboardList },
  { to: '/overdue', label: 'Overdue', icon: AlarmClock },
];

export default function Navbar() {
  return (
    <nav className="catalog-nav">
      <div className="catalog-brand">
        <div className="mark">
          Librif<span>y</span>
        </div>
        <div className="sub">Library management</div>
      </div>

      <div className="catalog-drawers">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `drawer-tab${isActive ? ' active' : ''}`}
          >
            <Icon className="icon" strokeWidth={1.8} />
            {label}
          </NavLink>
        ))}
      </div>

      <div className="catalog-foot">Librify &middot; DBMS project</div>
    </nav>
  );
}