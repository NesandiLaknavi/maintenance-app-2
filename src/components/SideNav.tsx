'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { FiHome, FiUsers, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { useAuth } from '@/context/AuthContext';
import Swal from 'sweetalert2';
import Image from 'next/image';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface SideNavProps {
  navItems: NavItem[];
  onLogout: () => void;
}

export default function SideNav({ navItems, onLogout }: SideNavProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleLogout = () => {
    Swal.fire({
      title: 'Logout Confirmation',
      text: 'Are you sure you want to logout?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, logout',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#8B4444',
      cancelButtonColor: '#6B7280',
      background: '#FFFFFF',
      color: '#1F2937',
      customClass: {
        title: 'text-xl font-bold text-primary-dark',
        htmlContainer: 'text-gray-600',
        confirmButton: 'bg-primary-dark hover:bg-primary text-white font-medium py-2 px-4 rounded-md transition-colors',
        cancelButton: 'bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors'
      }
    }).then((result) => {
      if (result.isConfirmed) {
        onLogout();
      }
    });
  };

  return (
    <div
      className={`bg-white text-gray-700 h-screen transition-all duration-300 ease-in-out relative shadow-lg ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Toggle Button */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-4 top-6 bg-white hover:bg-gray-50 text-gray-600 rounded-full p-2 shadow-lg transition-all duration-300 ease-in-out hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? (
          <FiChevronRight className="w-4 h-4" />
        ) : (
          <FiChevronLeft className="w-4 h-4" />
        )}
      </button>

      {/* Logo/Brand */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-center">
        {isCollapsed ? (
          <Image
            src="/logo/logo.jpeg"
            alt="Company Logo"
            width={40}
            height={40}
            className="rounded-lg"
            priority
          />
        ) : (
          <div className="flex items-center space-x-3">
            <Image
              src="/logo/logo.jpeg"
              alt="Company Logo"
              width={40}
              height={40}
              className="rounded-lg"
              priority
            />
            <h1 className="font-bold text-xl text-primary-dark">Maintenance App</h1>
          </div>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="mt-6">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center px-4 py-3 transition-colors duration-200 ${
                isActive
                  ? 'bg-primary-dark text-white'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-primary-dark'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {!isCollapsed && (
                <span className="ml-3 transition-opacity duration-200">{item.label}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Logout Button */}
      <div className="absolute bottom-0 w-full p-4">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-2 text-gray-600 hover:bg-gray-50 hover:text-primary-dark rounded-md transition-colors duration-200"
        >
          <span className="text-xl">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </span>
          {!isCollapsed && (
            <span className="ml-3 transition-opacity duration-200">Logout</span>
          )}
        </button>
      </div>
    </div>
  );
} 