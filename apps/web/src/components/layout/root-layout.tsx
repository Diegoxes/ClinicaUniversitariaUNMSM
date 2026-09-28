import { Outlet } from 'react-router-dom';
import { AppFooter } from './app-footer';

export function RootLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-pearl">
      <div className="flex flex-1 flex-col">
        <Outlet />
      </div>
      <AppFooter />
    </div>
  );
}
