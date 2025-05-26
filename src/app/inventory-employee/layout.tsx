'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import SideNav from '@/components/SideNav';
import { FiHome, FiCheckCircle, FiAlertCircle, FiBox, FiClipboard, FiShoppingCart, FiActivity, FiAlertTriangle } from 'react-icons/fi';
import LoadingScreen from '@/components/LoadingScreen';

const navItems = [
  { key: 'dashboard', label: 'Dashboard', href: '/inventory-employee/dashboard', icon: <FiHome /> },
  { key: 'completed-tasks', label: 'Completed Tasks', href: '/inventory-employee/completed-tasks', icon: <FiCheckCircle /> },
  { key: 'overdue-tasks', label: 'Overdue Tasks', href: '/inventory-employee/overdue-tasks', icon: <FiAlertCircle /> },
  { key: 'material-usage', label: 'Material Usage', href: '/inventory-employee/material-usage', icon: <FiClipboard /> },
  { key: 'requested-materials', label: 'Requested Materials', href: '/inventory-employee/requested-materials', icon: <FiBox /> },
  { key: 'stock', label: 'Stock', href: '/inventory-employee/stock', icon: <FiBox /> },
  { key: 'stock-transactions', label: 'Stock Transactions', href: '/inventory-employee/stock-transactions', icon: <FiActivity /> },
  { key: 'reorder-low-stock', label: 'Reorder Low Stock', href: '/inventory-employee/reorder-low-stock', icon: <FiAlertTriangle /> },
  { key: 'purchase-order', label: 'Purchase Order', href: '/inventory-employee/purchase-order', icon: <FiShoppingCart /> },
];

export default function InventoryEmployeeLayout({
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