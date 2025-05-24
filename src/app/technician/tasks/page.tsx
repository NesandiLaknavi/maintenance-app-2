'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import TableSearch from '@/components/TableSearch';
import TablePagination from '@/components/TablePagination';
import TableFilter, { FilterOption } from '@/components/TableFilter';

interface Task {
  id: string;
  type: string;
  techId: string;
  scheduledDate: string;
  priorityLevel: 'Low' | 'Medium' | 'High';
  status: 'completed' | 'pending';
}

export default function TechnicianTasks() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 10;

  // Get unique values for filters
  const statusOptions: FilterOption[] = [
    { label: 'Pending', value: 'pending' },
    { label: 'Completed', value: 'completed' }
  ];

  const priorityOptions: FilterOption[] = [
    { label: 'Low', value: 'Low' },
    { label: 'Medium', value: 'Medium' },
    { label: 'High', value: 'High' }
  ];

  useEffect(() => {
    const cachedUid = localStorage.getItem('userUid');
    if (cachedUid) {
      fetchTasks(cachedUid);
    }
  }, []);

  useEffect(() => {
    let filtered = tasks;

    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task => 
        task.type.toLowerCase().includes(query) ||
        task.priorityLevel.toLowerCase().includes(query) ||
        task.status.toLowerCase().includes(query) ||
        task.scheduledDate.toLowerCase().includes(query)
      );
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    // Apply priority filter
    if (priorityFilter) {
      filtered = filtered.filter(task => task.priorityLevel === priorityFilter);
    }

    setFilteredTasks(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchQuery, statusFilter, priorityFilter, tasks]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTasks = filteredTasks.slice(startIndex, endIndex);

  const fetchTasks = async (uid: string) => {
    try {
      setIsLoading(true);
      const tasksRef = collection(db, 'maintenance-tasks');
      const q = query(tasksRef, where('techId', '==', uid));
      const querySnapshot = await getDocs(q);
      const tasksList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      setTasks(tasksList);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError('Failed to fetch tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: 'completed' | 'pending') => {
    try {
      const taskRef = doc(db, 'maintenance-tasks', id);
      await updateDoc(taskRef, {
        status: newStatus
      });
      // Update local state
      setTasks(tasks.map(task => task.id === id ? { ...task, status: newStatus } : task));
    } catch (err) {
      console.error('Error updating task status:', err);
      setError('Failed to update task status');
    }
  };

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Maintenance Tasks</h1>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <TableSearch
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by type, priority, status, or date..."
        />
        <div className="flex flex-wrap gap-4">
          <TableFilter
            label="Status"
            options={statusOptions}
            value={statusFilter}
            onChange={setStatusFilter}
            onClear={() => setStatusFilter('')}
          />
          <TableFilter
            label="Priority"
            options={priorityOptions}
            value={priorityFilter}
            onChange={setPriorityFilter}
            onClear={() => setPriorityFilter('')}
          />
        </div>
      </div>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-primary-dark">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Task Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Scheduled Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Priority</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-dark">
            {currentTasks.map((task) => (
              <tr key={task.id} className="hover:bg-secondary-light transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">{task.type}</td>
                <td className="px-6 py-4 whitespace-nowrap">{task.scheduledDate}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    task.priorityLevel === 'High' ? 'bg-red-100 text-red-800' :
                    task.priorityLevel === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-green-100 text-green-800'
                  }`}>
                    {task.priorityLevel}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task.id, e.target.value as 'completed' | 'pending')}
                    className="border rounded px-2 py-1"
                  >
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalPages > 1 && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
} 