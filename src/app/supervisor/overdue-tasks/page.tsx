'use client';

import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ExportCSVButton from '@/components/ExportCSVButton';
import Pagination from '@/components/Pagination';
import TablePagination from '@/components/TablePagination';
import LoadingScreen from '@/components/LoadingScreen';

interface OverdueTask {
  id: string;
  type: string;
  scheduledDate: string;
  status: string;
  techName: string;
  priorityLevel: string;
}

export default function OverdueTasksPage() {
  const [tasks, setTasks] = useState<OverdueTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchOverdueTasks = async () => {
      try {
        const tasksRef = collection(db, 'maintenance-tasks');
        const q = query(
          tasksRef,
          where('status', '==', 'pending')
        );
        const querySnapshot = await getDocs(q);
        
        const overdueTasks = querySnapshot.docs
          .map(doc => ({
            id: doc.id,
            type: doc.data().type,
            scheduledDate: doc.data().scheduledDate,
            status: doc.data().status,
            techName: doc.data().techName,
            priorityLevel: doc.data().priorityLevel
          }))
          .filter(task => {
            const scheduledDate = new Date(task.scheduledDate);
            return scheduledDate < new Date();
          });

        setTasks(overdueTasks);
      } catch (error) {
        console.error('Error fetching overdue tasks:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOverdueTasks();
  }, []);

  // Calculate pagination
  const totalPages = Math.ceil(tasks.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTasks = tasks.slice(startIndex, endIndex);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Overdue Tasks</h1>
        <ExportCSVButton data={tasks} filename="overdue-tasks" />
      </div>
      {tasks.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">No overdue tasks found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-primary-dark">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Task ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Task Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Scheduled Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Technician</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-dark">
                {currentTasks.map((task) => (
                  <tr key={task.id} className="hover:bg-secondary-light transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">{task.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{task.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{task.scheduledDate}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{task.techName}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{task.priorityLevel}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                        Overdue
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
} 