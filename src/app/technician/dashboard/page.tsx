'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'react-hot-toast';
import { FiAlertCircle, FiCheckCircle, FiClock, FiTool } from 'react-icons/fi';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import LoadingScreen from '@/components/LoadingScreen';

interface Task {
  id: string;
  type: string;
  status: string;
  priority: string;
  scheduledDate: string;
  techName: string;
  machineName: string;
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

interface MaterialRequest {
  id: string;
  materialName: string;
  quantity: number;
  status: string;
  requestDate: Timestamp;
}

interface MeterReading {
  id: string;
  machineName: string;
  reading: number;
  date: Timestamp;
  technician: string;
}

export default function TechnicianDashboard() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [serviceLogs, setServiceLogs] = useState<ServiceLog[]>([]);
  const [materialRequests, setMaterialRequests] = useState<MaterialRequest[]>([]);
  const [meterReadings, setMeterReadings] = useState<MeterReading[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch tasks assigned to the current technician
      const tasksRef = collection(db, 'maintenance-tasks');
      const tasksQuery = query(
        tasksRef,
        where('techName', '==', 'Current Technician'), // Replace with actual technician name
        orderBy('scheduledDate', 'desc')
      );
      const tasksSnapshot = await getDocs(tasksQuery);
      const tasksData = tasksSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Task[];
      setTasks(tasksData);

      // Fetch service logs by the current technician
      const logsRef = collection(db, 'service-logs');
      const logsQuery = query(
        logsRef,
        where('technician', '==', 'Current Technician'), // Replace with actual technician name
        orderBy('date', 'desc')
      );
      const logsSnapshot = await getDocs(logsQuery);
      const logsData = logsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ServiceLog[];
      setServiceLogs(logsData);

      // Fetch material requests
      const requestsRef = collection(db, 'material-requests');
      const requestsQuery = query(
        requestsRef,
        where('technician', '==', 'Current Technician'), // Replace with actual technician name
        orderBy('requestDate', 'desc')
      );
      const requestsSnapshot = await getDocs(requestsQuery);
      const requestsData = requestsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MaterialRequest[];
      setMaterialRequests(requestsData);

      // Fetch meter readings
      const readingsRef = collection(db, 'meter-readings');
      const readingsQuery = query(
        readingsRef,
        where('technician', '==', 'Current Technician'), // Replace with actual technician name
        orderBy('date', 'desc')
      );
      const readingsSnapshot = await getDocs(readingsQuery);
      const readingsData = readingsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MeterReading[];
      setMeterReadings(readingsData);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate metrics
  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter(task => task.status === 'pending').length;
  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  const overdueTasks = tasks.filter(task => {
    const scheduledDate = new Date(task.scheduledDate);
    return task.status === 'pending' && scheduledDate < new Date();
  }).length;

  const pendingRequests = materialRequests.filter(req => req.status === 'pending').length;
  const recentReadings = meterReadings.length;

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-4">Technician Dashboard</h1>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">My Tasks</p>
              <p className="text-2xl font-bold">{totalTasks}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <FiClock className="w-6 h-6 text-blue-600" />
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
              <p className="text-sm text-gray-500">Overdue Tasks</p>
              <p className="text-2xl font-bold">{overdueTasks}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <FiAlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4">
            <Link href="/technician/overdue-tasks" className="text-sm text-blue-600 hover:underline">
              View Details →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Requests</p>
              <p className="text-2xl font-bold">{pendingRequests}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <FiTool className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4">
            <Link href="/technician/request-materials" className="text-sm text-blue-600 hover:underline">
              View Details →
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Recent Readings</p>
              <p className="text-2xl font-bold">{recentReadings}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <FiCheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4">
            <Link href="/technician/meter-reading" className="text-sm text-blue-600 hover:underline">
              View Details →
            </Link>
          </div>
        </div>
      </div>

      {/* My Tasks */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">My Tasks</h2>
            <Link href="/technician/tasks" className="text-sm text-blue-600 hover:underline">
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled Date</th>
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
                  <td className="px-6 py-4 whitespace-nowrap">{task.scheduledDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Service Logs */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Recent Service Logs</h2>
            <Link href="/technician/service-log" className="text-sm text-blue-600 hover:underline">
              View All →
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Machine</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {serviceLogs.slice(0, 5).map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{log.machineName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{log.type}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{log.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {log.date?.toDate().toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Meter Readings */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Recent Meter Readings</h2>
            <Link href="/technician/meter-reading" className="text-sm text-blue-600 hover:underline">
              View All →
            </Link>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Machine</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reading</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {meterReadings.slice(0, 5).map((reading) => (
                <tr key={reading.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{reading.machineName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{reading.reading}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {reading.date?.toDate().toLocaleDateString()}
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