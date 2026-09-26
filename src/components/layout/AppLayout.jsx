import React from 'react';
import { Outlet } from 'react-router-dom';
import AppHeader from './AppHeader';

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background font-inter">
      <AppHeader />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}