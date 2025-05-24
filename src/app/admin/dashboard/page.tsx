'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'react-hot-toast';
import { FiUsers, FiAlertCircle, FiCheckCircle, FiTool, FiPackage, FiClock } from 'react-icons/fi';
import Link from 'next/link';
import LoadingScreen from '@/components/LoadingScreen';

interface User {
  id: string;
  name: string;
  role: string;
  email: string;
  status: string;
}

interface Task {
  id: string;
  type: string;
  status: string;
  priority: string;
  scheduledDate: string;
  techName: string;
  machineName: string;
}

interface Machine {
  id: string;
  name: string;
  status: string;
  lastMaintenance: string;
  location: string;
}

interface ServiceLog {
  id: string;
  machineId: string;
  machineName: string;
  type: string;
  date: Timestamp;
  technician: string;
  description: string;
}

interface InventoryItem {
  id: string;
  name: string;
  currentStock: number;
  reorderPoint: number;
  status: string;
  category: string;
}

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [serviceLogs, setServiceLogs] = useState<ServiceLog[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch users
      const usersRef = collection(db, 'users');
      const usersQuery = query(usersRef, orderBy('name'));
      const usersSnapshot = await getDocs(usersQuery);
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      setUsers(usersData);

      // Fetch tasks
      const tasksRef = collection(db, 'maintenance-tasks');
      const tasksQuery = query(tasksRef, orderBy('scheduledDate', 'desc'));
      const tasksSnapshot = await getDocs(tasksQuery);
      const tasksData = tasksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      setTasks(tasksData);

      // Fetch machines
      const machinesRef = collection(db, 'machines');
      const machinesQuery = query(machinesRef, orderBy('name'));
      const machinesSnapshot = await getDocs(machinesQuery);
      const machinesData = machinesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Machine[];
      setMachines(machinesData);

      // Fetch service logs
      const logsRef = collection(db, 'service-logs');
      const logsQuery = query(logsRef, orderBy('date', 'desc'));
      const logsSnapshot = await getDocs(logsQuery);
      const logsData = logsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ServiceLog[];
      setServiceLogs(logsData);

      // Fetch inventory
      const inventoryRef = collection(db, 'stock-levels');
      const inventoryQuery = query(inventoryRef, orderBy('materialName'));
      const inventorySnapshot = await getDocs(inventoryQuery);
      const inventoryData = inventorySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as InventoryItem[];
      setInventory(inventoryData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate metrics
  const totalUsers = users.length;
  const activeUsers = users.filter(user => user.status === 'active').length;
  const technicians = users.filter(user => user.role === 'technician').length;
  const supervisors = users.filter(user => user.role === 'supervisor').length;

  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter(task => task.status === 'pending').length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const overdueTasks = tasks.filter(task => {
    const scheduledDate = new Date(task.scheduledDate);
    return task.status === 'pending' && scheduledDate < new Date();
  }).length;

  const totalMachines = machines.length;
  const operationalMachines = machines.filter(machine => machine.status === 'Operational').length;
  const maintenanceNeeded = machines.filter(machine => machine.status === 'Maintenance Needed').length;

  const lowStockItems = inventory.filter(item => item.status === 'Low Stock').length;
  const totalInventoryItems = inventory.length;

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-2xl font-bold">{totalUsers}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <FiUsers className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm">
              <span>Technicians: {technicians}</span>
              <span>Supervisors: {supervisors}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">System Tasks</p>
              <p className="text-2xl font-bold">{totalTasks}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <FiClock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm">
              <span>Pending: {pendingTasks}</span>
              <span>Completed: {completedTasks}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Machines Status</p>
              <p className="text-2xl font-bold">{operationalMachines}/{totalMachines}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <FiTool className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm">
              <span>Operational: {operationalMachines}</span>
              <span>Maintenance: {maintenanceNeeded}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Inventory Status</p>
              <p className="text-2xl font-bold">{lowStockItems}/{totalInventoryItems}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <FiPackage className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-sm">
              <span>Low Stock: {lowStockItems}</span>
              <span>Total Items: {totalInventoryItems}</span>
            </div>
          </div>
        </div>
      </div>

      {/* System Users */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">System Users</h2>
            <Link href="/admin/users" className="text-sm text-blue-600 hover:underline">
              View All →
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.slice(0, 5).map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                      user.role === 'supervisor' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Recent Tasks</h2>
            <Link href="/admin/tasks" className="text-sm text-blue-600 hover:underline">
              View All →
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Machine</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Technician</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {tasks.slice(0, 5).map((task) => (
                <tr key={task.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{task.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{task.machineName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.status === 'completed' ? 'bg-green-100 text-green-800' :
                      task.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {task.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.priority === 'High' ? 'bg-red-100 text-red-800' :
                      task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {task.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{task.techName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Low Stock Items */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Low Stock Items</h2>
            <Link href="/admin/inventory" className="text-sm text-blue-600 hover:underline">
              View All →
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reorder Point</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {inventory
                .filter(item => item.status === 'Low Stock')
                .slice(0, 5)
                .map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.currentStock}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{item.reorderPoint}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Low Stock
                      </span>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 