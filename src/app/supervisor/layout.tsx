'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import SideNav from '@/components/SideNav';
import { FiHome, FiList, FiCheckCircle, FiAlertCircle, FiBarChart2, FiShoppingCart, FiTool, FiShoppingBag } from 'react-icons/fi';
import LoadingScreen from '@/components/LoadingScreen';

const navItems = [
  { label: 'Dashboard', href: '/supervisor/dashboard', icon: <FiHome /> },
  { label: 'Tasks', href: '/supervisor/tasks', icon: <FiList /> },
  { label: 'Completed Tasks', href: '/supervisor/completed-tasks', icon: <FiCheckCircle /> },
  { label: 'Overdue Tasks', href: '/supervisor/overdue-tasks', icon: <FiAlertCircle /> },
  { label: 'Material Usage', href: '/supervisor/material-usage', icon: <FiBarChart2 /> },
  { label: 'Machines', href: '/supervisor/machines', icon: <FiTool /> },
  { label: 'Purchase Requests', href: '/supervisor/purchase-requests', icon: <FiShoppingBag /> },
  { label: 'Service Log', href: '/supervisor/service-log', icon: <FiShoppingCart /> },
];

export default function SupervisorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <SideNav
        navItems={navItems}
        onLogout={handleLogout}
      />
      <main className="flex-1 overflow-y-auto p-8">
        {children}
      </main>
    </div>
  );
} 