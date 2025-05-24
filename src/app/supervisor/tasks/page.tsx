'use client';

import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy, where, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import TableSearch from '@/components/TableSearch';
import TablePagination from '@/components/TablePagination';
import TableFilter, { FilterOption } from '@/components/TableFilter';
import { sendTaskAssignmentEmail } from '@/lib/email';
import LoadingScreen from '@/components/LoadingScreen';

interface MaintenanceTask {
  id: string;
  type: string;
  techId: string;
  techName: string;
  scheduledDate: string;
  priorityLevel: 'Low' | 'Medium' | 'High';
  status: 'pending' | 'completed';
}

interface Technician {
  uid: string;
  username: string;
}

export default function MaintenanceTasksPage() {
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [filteredTasks, setFilteredTasks] = useState<MaintenanceTask[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [technicianFilter, setTechnicianFilter] = useState('');
  const itemsPerPage = 10;
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<MaintenanceTask | null>(null);
  const [editTask, setEditTask] = useState<MaintenanceTask | null>(null);
  const [form, setForm] = useState({
    type: '',
    techId: '',
    techName: '',
    scheduledDate: '',
    priorityLevel: 'Medium' as const,
    status: 'pending' as const
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const technicianOptions = technicians.map(tech => ({
    label: tech.username,
    value: tech.uid
  }));

  useEffect(() => {
    fetchTasks();
    fetchTechnicians();
  }, []);

  useEffect(() => {
    let filtered = tasks;

    // Apply search filter
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task => 
        task.type.toLowerCase().includes(query) ||
        task.techName.toLowerCase().includes(query) ||
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

    // Apply technician filter
    if (technicianFilter) {
      filtered = filtered.filter(task => task.techId === technicianFilter);
    }

    setFilteredTasks(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchQuery, statusFilter, priorityFilter, technicianFilter, tasks, technicians]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredTasks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTasks = filteredTasks.slice(startIndex, endIndex);

  const fetchTechnicians = async () => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('role', '==', 'technician'));
      const querySnapshot = await getDocs(q);
      const techsList = querySnapshot.docs.map(doc => ({
        uid: doc.id,
        username: doc.data().username || ''
      }));
      setTechnicians(techsList);
    } catch (err) {
      console.error('Error fetching technicians:', err);
      setError('Failed to fetch technicians');
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const tasksRef = collection(db, 'maintenance-tasks');
      const q = query(tasksRef, orderBy('scheduledDate'));
      const querySnapshot = await getDocs(q);
      const tasksList = querySnapshot.docs.map(doc => ({
          id: doc.id,
        ...doc.data()
      })) as MaintenanceTask[];
      setTasks(tasksList);
    } catch (err) {
      setError('Failed to fetch tasks');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditTask(null);
    setForm({
      type: '',
      techId: '',
      techName: '',
      scheduledDate: '',
      priorityLevel: 'Medium',
      status: 'pending'
    });
    setShowModal(true);
  };

  const openEditModal = (task: MaintenanceTask) => {
    setEditTask(task);
    setForm({
      type: task.type,
      techId: task.techId,
      techName: task.techName,
      scheduledDate: task.scheduledDate,
      priorityLevel: task.priorityLevel,
      status: task.status
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditTask(null);
    setForm({
      type: '',
      techId: '',
      techName: '',
      scheduledDate: '',
      priorityLevel: 'Medium',
      status: 'pending'
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'techId') {
      const selectedTech = technicians.find(tech => tech.uid === value);
      setForm({ 
        ...form, 
        [name]: value,
        techName: selectedTech?.username || ''
      });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editTask) {
        // Update
        const taskRef = doc(db, 'maintenance-tasks', editTask.id);
        await updateDoc(taskRef, {
          type: form.type,
          techId: form.techId,
          techName: form.techName,
          scheduledDate: form.scheduledDate,
          priorityLevel: form.priorityLevel,
          status: form.status
        });
      } else {
        // Create
        const taskRef = await addDoc(collection(db, 'maintenance-tasks'), {
          type: form.type,
          techId: form.techId,
          techName: form.techName,
          scheduledDate: form.scheduledDate,
          priorityLevel: form.priorityLevel,
          status: form.status
        });

        // Get technician's email from users collection
        const techDoc = await getDoc(doc(db, 'users', form.techId));
        if (techDoc.exists()) {
          const techData = techDoc.data();
          const techEmail = techData.email;

          // Send email notification
          await sendTaskAssignmentEmail(
            techEmail,
            form.techName,
            {
              type: form.type,
              scheduledDate: form.scheduledDate,
              priorityLevel: form.priorityLevel
            }
          );
        }
      }
      await fetchTasks();
      closeModal();
    } catch (err) {
      setError('Failed to save task');
      console.error('Error saving task:', err);
    }
  };

  const confirmDelete = (task: MaintenanceTask) => {
    setTaskToDelete(task);
    setShowDeleteConfirm(true);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
    setTaskToDelete(null);
  };

  const handleDelete = async () => {
    if (!taskToDelete) return;
    
    try {
      await deleteDoc(doc(db, 'maintenance-tasks', taskToDelete.id));
      await fetchTasks();
      setShowDeleteConfirm(false);
      setTaskToDelete(null);
    } catch (err) {
      setError('Failed to delete task');
      console.error('Error deleting task:', err);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: 'pending' | 'completed') => {
    try {
      const taskRef = doc(db, 'maintenance-tasks', taskId);
      await updateDoc(taskRef, {
        status: newStatus
      });
      await fetchTasks(); // Refresh the tasks list
    } catch (err) {
      console.error('Error updating task status:', err);
      setError('Failed to update task status');
    }
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold mb-4">Maintenance Tasks</h1>
          <button
          onClick={openAddModal}
          className="bg-primary-dark text-white px-4 py-2 rounded-lg shadow hover:bg-primary transition-colors"
          >
          Add New Task
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
          placeholder="Search by type, technician, priority, status, or date..."
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
          <TableFilter
            label="Technician"
            options={technicianOptions}
            value={technicianFilter}
            onChange={setTechnicianFilter}
            onClear={() => setTechnicianFilter('')}
          />
        </div>
      </div>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-primary-dark">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Technician</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Scheduled Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Priority Level</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-dark">
            {currentTasks.map((task) => (
              <tr key={task.id} className="hover:bg-secondary-light transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">{task.id}</td>
                <td className="px-6 py-4 whitespace-nowrap">{task.type}</td>
                <td className="px-6 py-4 whitespace-nowrap">{task.techName}</td>
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
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    task.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {task.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap space-x-2">
          <select
                    value={task.status}
                    onChange={(e) => handleStatusChange(task.id, e.target.value as 'pending' | 'completed')}
                    className="border rounded px-2 py-1 text-sm"
          >
            <option value="pending">Pending</option>
            <option value="completed">Completed</option>
          </select>
          <button
                    onClick={() => openEditModal(task)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
          >
                    Edit
                  </button>
                  <button
                    onClick={() => confirmDelete(task)}
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

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editTask ? 'Edit Task' : 'Add New Task'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <input
                  type="text"
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Technician</label>
                <select
                  name="techId"
                  value={form.techId}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  <option value="">Select a technician</option>
                  {technicians.map((tech) => (
                    <option key={tech.uid} value={tech.uid}>
                      {tech.username}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Scheduled Date</label>
                <input
                  type="date"
                  name="scheduledDate"
                  value={form.scheduledDate}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Priority Level</label>
                <select
                  name="priorityLevel"
                  value={form.priorityLevel}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-primary-dark text-white hover:bg-primary"
                >
                  {editTask ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
              </div>
            </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && taskToDelete && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
            <p className="mb-4">
              Are you sure you want to delete the task "{taskToDelete.type}" assigned to {taskToDelete.techName}?
              This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={cancelDelete}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
          </div>
        )}
    </div>
  );
} 