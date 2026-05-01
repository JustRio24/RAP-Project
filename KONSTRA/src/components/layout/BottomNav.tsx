import { NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, Calculator, Users } from 'lucide-react';

const NAV = [
  { to: '/',           icon: LayoutDashboard, label: 'Beranda',    end: true },
  { to: '/projects',   icon: FolderKanban,    label: 'Proyek'              },
  { to: '/calculator', icon: Calculator,      label: 'Estimasi'            },
  { to: '/team',       icon: Users,           label: 'Tim'                 },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav">
      {NAV.map(({ to, icon: Icon, label, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        >
          <Icon size={21} strokeWidth={1.8} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
