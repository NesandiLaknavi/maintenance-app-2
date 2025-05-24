'use client';

import { useState, useEffect } from 'react';
import { getFirestore, collection, getDocs, query, orderBy, doc, deleteDoc, setDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { auth, db } from '@/lib/firebase';
import TableSearch from '@/components/TableSearch';
import TablePagination from '@/components/TablePagination';
import TableFilter, { FilterOption } from '@/components/TableFilter';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  role: 'admin' | 'supervisor' | 'technician' | 'inventory_employee';
  createdAt: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [roleFilter, setRoleFilter] = useState('');
  const itemsPerPage = 10;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});

  const fetchUsers = async () => {
    try {
      setError(null);
      const usersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'));
      const usersSnapshot = await getDocs(usersQuery);
      const usersList = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          email: data.email || '',
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          username: data.username || '',
          password: data.password || '',
          role: data.role || 'technician',
          createdAt: (() => {
            if (!data.createdAt) return new Date().toISOString();
            if (typeof data.createdAt.toDate === 'function') return data.createdAt.toDate().toISOString();
            if (typeof data.createdAt === 'string' || typeof data.createdAt === 'number') return new Date(data.createdAt).toISOString();
            if (data.createdAt instanceof Date) return data.createdAt.toISOString();
            return new Date().toISOString();
          })(),
        };
      }) as User[];
      setUsers(usersList);
      setFilteredUsers(usersList);
    } catch (error: any) {
      console.error('Error fetching users:', error);
      setError(error.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    let filtered = users;

    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user => 
        user.email.toLowerCase().includes(query) ||
        user.firstName.toLowerCase().includes(query) ||
        user.lastName.toLowerCase().includes(query) ||
        user.username.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query)
      );
    }

    // Apply role filter
    if (roleFilter) {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchQuery, roleFilter, users]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
  };

  const handleDeleteCancel = () => {
    setUserToDelete(null);
    setDeleteError('');
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    setDeleteLoading(true);
    setDeleteError('');

    try {
      await deleteDoc(doc(db, 'users', userToDelete.id));
      setUsers(users.filter(u => u.id !== userToDelete.id));
      setFilteredUsers(users.filter(u => u.id !== userToDelete.id));
      setUserToDelete(null);
    } catch (error: any) {
      console.error('Error deleting user:', error);
      setDeleteError(error.message || 'Failed to delete user');
    } finally {
      setDeleteLoading(false);
    }
  };

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const CreateUserModal = ({ isOpen, onClose, onUserCreated }: { isOpen: boolean; onClose: () => void; onUserCreated: () => void }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Validation schema
    const validationSchema = Yup.object().shape({
      email: Yup.string()
        .email('Invalid email address')
        .required('Email is required'),
      firstName: Yup.string()
        .required('First name is required')
        .min(2, 'First name must be at least 2 characters')
        .max(50, 'First name must be less than 50 characters'),
      lastName: Yup.string()
        .required('Last name is required')
        .min(2, 'Last name must be at least 2 characters')
        .max(50, 'Last name must be less than 50 characters'),
      password: Yup.string()
        .required('Password is required')
        .min(6, 'Password must be at least 6 characters')
        .matches(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
          'Password must contain at least one uppercase letter, one lowercase letter, and one number'
        ),
      role: Yup.string()
        .required('Role is required')
        .oneOf(['admin', 'supervisor', 'technician', 'inventory_employee'], 'Invalid role selected')
    });

    const initialValues = {
      email: '',
      firstName: '',
      lastName: '',
      username: '',
      password: '',
      role: 'technician' as const
    };

    const handleSubmit = async (values: typeof initialValues, { resetForm }: { resetForm: () => void }) => {
      setLoading(true);
      setError(null);

      try {
        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, values.email, values.password);
        
        // Create user document in Firestore with all user data including UID
        const userData = {
          uid: userCredential.user.uid,
          email: values.email,
          firstName: values.firstName,
          lastName: values.lastName,
          username: values.username,
          password: values.password,
          role: values.role,
          createdAt: new Date().toISOString()
        };

        // Save to Firestore using the UID as the document ID
        await setDoc(doc(db, 'users', userCredential.user.uid), userData);

        resetForm();
        onUserCreated();
        onClose();
      } catch (err: any) {
        console.error('Error creating user:', err);
        setError(err.message || 'Failed to create user');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center ${isOpen ? '' : 'hidden'}`}>
        <div className="bg-white rounded-lg p-8 w-full max-w-md">
          <h2 className="text-2xl font-bold mb-6">Create New User</h2>
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          <Formik
            initialValues={initialValues}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ values, setFieldValue }) => (
              <Form className="space-y-4" autoComplete="off">
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <Field
                    type="email"
                    name="email"
                    className="w-full border rounded px-3 py-2"
                    autoComplete="off"
                  />
                  <ErrorMessage name="email" component="div" className="text-red-500 text-sm mt-1" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">First Name</label>
                  <Field
                    type="text"
                    name="firstName"
                    className="w-full border rounded px-3 py-2"
                    autoComplete="off"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setFieldValue('firstName', e.target.value);
                      setFieldValue('username', `${e.target.value}${values.lastName}`.toLowerCase().replace(/\s+/g, ''));
                    }}
                  />
                  <ErrorMessage name="firstName" component="div" className="text-red-500 text-sm mt-1" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Last Name</label>
                  <Field
                    type="text"
                    name="lastName"
                    className="w-full border rounded px-3 py-2"
                    autoComplete="off"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      setFieldValue('lastName', e.target.value);
                      setFieldValue('username', `${values.firstName}${e.target.value}`.toLowerCase().replace(/\s+/g, ''));
                    }}
                  />
                  <ErrorMessage name="lastName" component="div" className="text-red-500 text-sm mt-1" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Username (Auto-generated)</label>
                  <Field
                    type="text"
                    name="username"
                    className="w-full border rounded px-3 py-2 bg-gray-50"
                    disabled
                    autoComplete="off"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Initial Password</label>
                  <Field
                    type="password"
                    name="password"
                    className="w-full border rounded px-3 py-2"
                    autoComplete="new-password"
                  />
                  <ErrorMessage name="password" component="div" className="text-red-500 text-sm mt-1" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Role</label>
                  <Field
                    as="select"
                    name="role"
                    className="w-full border rounded px-3 py-2"
                    autoComplete="off"
                  >
                    <option value="admin">Admin</option>
                    <option value="supervisor">Supervisor</option>
                    <option value="technician">Technician</option>
                    <option value="inventory_employee">Inventory Employee</option>
                  </Field>
                  <ErrorMessage name="role" component="div" className="text-red-500 text-sm mt-1" />
                </div>
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded bg-primary-dark text-white hover:bg-primary"
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    );
  };

  // Get unique values for filters
  const roleOptions: FilterOption[] = [
    { label: 'Admin', value: 'admin' },
    { label: 'Supervisor', value: 'supervisor' },
    { label: 'Technician', value: 'technician' },
    { label: 'Inventory Employee', value: 'inventory_employee' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-primary-dark">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold mb-4">Users</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-primary-dark text-white px-4 py-2 rounded-lg shadow hover:bg-primary transition-colors"
        >
          Add New User
        </button>
      </div>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <TableSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by email, name, username, or role..."
        />
        <div className="flex flex-wrap gap-4">
          <TableFilter
            label="Role"
            options={roleOptions}
            value={roleFilter}
            onChange={setRoleFilter}
            onClear={() => setRoleFilter('')}
          />
        </div>
      </div>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-primary-dark">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">First Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Last Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Password</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Created At</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-dark">
            {currentUsers.map((user) => (
              <tr key={user.id} className="hover:bg-secondary-light transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.firstName}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.lastName}</td>
                <td className="px-6 py-4 whitespace-nowrap">{user.username}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono">
                      {showPasswords[user.id] ? user.password : '••••••••'}
                    </span>
                    <button
                      onClick={() => togglePasswordVisibility(user.id)}
                      className="text-gray-500 hover:text-gray-700"
                      title={showPasswords[user.id] ? "Hide password" : "Show password"}
                    >
                      {showPasswords[user.id] ? (
                        <FiEyeOff className="w-4 h-4" />
                      ) : (
                        <FiEye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                    user.role === 'supervisor' ? 'bg-blue-100 text-blue-800' :
                    user.role === 'technician' ? 'bg-green-100 text-green-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {user.role.replace('_', ' ')}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap space-x-2">
                  <button 
                    onClick={() => handleDeleteClick(user)}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onUserCreated={fetchUsers}
        />

      {/* Delete Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-[0_8px_30px_rgb(0,0,0,0.12)] w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-primary-dark">Delete User</h2>
                <button
                  onClick={handleDeleteCancel}
                  className="text-text-secondary hover:text-primary-dark"
                >
                  ✕
                </button>
              </div>

              {deleteError && (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                  {deleteError}
                </div>
              )}

              <p className="text-text-secondary mb-6">
                Are you sure you want to delete the user <span className="font-medium text-primary-dark">{userToDelete.email}</span>? 
                This action cannot be undone.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleDeleteCancel}
                  disabled={deleteLoading}
                  className="px-4 py-2 text-text-secondary hover:text-primary-dark"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  disabled={deleteLoading}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {deleteLoading ? 'Deleting...' : 'Delete User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 