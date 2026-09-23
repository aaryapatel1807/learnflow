import { NavLink } from 'react-router-dom';
import './BottomNav.css';

const tabs = [
  { href: '/',                label: 'Home',     icon: '🏠' },
  { href: '/catalogue',       label: 'Catalogue', icon: '📚' },
  { href: '/quizzes',         label: 'Quizzes',   icon: '📝' },
  { href: '/achievements',    label: 'Awards',    icon: '🏆' },
  { href: '/notes',           label: 'Notes',     icon: '📒' },
];

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Mobile navigation">
      <ul className="bottom-nav-list">
        {tabs.map(({ href, label, icon }) => (
          <li key={href} className="bottom-nav-item">
            <NavLink
              to={href}
              end={href === '/'}
              className={({ isActive }) =>
                `bottom-nav-link${isActive ? ' bottom-nav-link-active' : ''}`
              }
            >
              <span className="bottom-nav-icon" aria-hidden="true">{icon}</span>
              <span className="bottom-nav-label">{label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
