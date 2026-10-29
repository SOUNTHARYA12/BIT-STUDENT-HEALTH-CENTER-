import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';

export const AppLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F5F8FA] flex flex-col text-[#142F49]">
      <Navbar />
      
      <div className="flex-1 flex">
        <Sidebar />
        
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      <footer className="bg-white border-t border-[#DCE5EE] py-3 px-6 text-center text-xs text-[#657D96] no-print">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong className="text-[#142F49]">BIT Student Health Center Management System</strong> • Bannari Amman Institute of Technology, Sathyamangalam
          </div>
          <div className="text-[11px] text-[#657D96]">
            Final Year B.Tech Artificial Intelligence and Data Science Project
          </div>
        </div>
      </footer>
    </div>
  );
};

