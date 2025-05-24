'use client';

import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import SideNav from '@/components/SideNav';
import { FiHome, FiUsers } from 'react-icons/fi';
import LoadingScreen from '@/components/LoadingScreen';

const navItems = [
  { label: 'Dashboard', href: '/admin/dashboard', icon: <FiHome /> },
  { label: 'Users', href: '/admin/users', icon: <FiUsers /> },
];

export default function AdminLayout({
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