import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Swal from 'sweetalert2';
import { CustomUser } from '@/types/user';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

interface AuthFormData {
  email: string;
  password: string;
}

type UserRole = 'admin' | 'technician' |'inventory-employee' | 'supervisor';

interface Technician {
  uid: string;
  username: string;
}

interface MaintenanceTask {
  status: 'pending' | 'completed';
}

const getRoleBasedRoute = (role?: string): string => {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'technician':
      return '/technician/dashboard';
    case 'inventory_employee':
      return '/inventory-employee/dashboard';
    case 'supervisor':
      return '/supervisor/dashboard';
    default:
      return '/';
  }
};

export const useAuthForm = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuth();

  const handleSubmit = async (values: AuthFormData) => {
    setError('');
    setLoading(true);

    try {
      const user = await login(values.email, values.password);
      
      if (!user?.role) {
        throw new Error('User role not found. Please contact support.');
      }

      console.log("Login successful - User UID:", user.uid);
      console.log("Login successful - User Role:", user.role);

      if (user.role) {
        // Store role in localStorage
        localStorage.setItem('userRole', user.role);
        console.log("Role stored in cache:", user.role);

        await Swal.fire({
          title: 'Login Successful!',
          text: 'Welcome back!',
          icon: 'success',
          showConfirmButton: false,
          timer: 1500,
          background: '#FFFFFF',
          color: '#1F2937',
          customClass: {
            title: 'text-xl font-bold text-primary-dark',
            htmlContainer: 'text-gray-600'
          }
        });

        // Use cached role for navigation
        router.push(getRoleBasedRoute(user.role));
      } else {
        console.log('User data not found');
        throw new Error('User data not found');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return {
    error,
    loading,
    handleSubmit
  };
}; 