import { Outlet } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { InstallPrompt } from '../InstallPrompt';

export function AppLayout() {
  return (
    <div className="page">
      <Outlet />
      <BottomNav />
      <InstallPrompt />
    </div>
  );
}
