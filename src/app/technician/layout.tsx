'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import SideNav from '@/components/SideNav';
import { FiHome, FiList, FiUser, FiSettings, FiBarChart2, FiBookOpen, FiPackage, FiCheckCircle, FiAlertCircle, FiActivity } from 'react-icons/fi';
import LoadingScreen from '@/components/LoadingScreen';

const navItems = [
  { label: 'Dashboard', href: '/technician/dashboard', icon: <FiHome /> },
  { label: 'Tasks', href: '/technician/tasks', icon: <FiList /> },
  { label: 'Completed Tasks', href: '/technician/completed-tasks', icon: <FiCheckCircle /> },
  { label: 'Overdue Tasks', href: '/technician/overdue-tasks', icon: <FiAlertCircle /> },
  { label: 'Material Usage', href: '/technician/material-usage', icon: <FiBarChart2 /> },
  { label: 'Service Log', href: '/technician/service-log', icon: <FiBookOpen /> },
  { label: 'Request Materials', href: '/technician/request-materials', icon: <FiPackage /> },
  { label: 'Meter Reading', href: '/technician/meter-reading', icon: <FiActivity /> },
  { label: 'Profile', href: '/technician/profile', icon: <FiUser /> },
  { label: 'Settings', href: '/technician/settings', icon: <FiSettings /> },
];

export default function TechnicianLayout({
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