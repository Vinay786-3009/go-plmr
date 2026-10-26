import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { TopHeader } from '../components/common/TopHeader';
import { BottomNav } from '../components/common/BottomNav';
import { SideDrawer } from '../components/common/SideDrawer';

export const CustomerLayout = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const location = useLocation();

  // Hide bottom nav on full-screen tracking or specific pages if desired
  const hideBottomNav = location.pathname.startsWith('/rides/') && location.pathname !== '/rides';

  return (
    <div className="mobile-shell">
      <TopHeader onOpenDrawer={() => setIsDrawerOpen(true)} />
      <SideDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
      <main className="flex-1 w-full overflow-y-auto">
        <Outlet />
      </main>
      {!hideBottomNav && <BottomNav />}
    </div>
  );
};
