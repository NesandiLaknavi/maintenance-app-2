'use client';

import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { FiAlertCircle, FiCheckCircle, FiBox, FiShoppingCart } from 'react-icons/fi';

interface DashboardStats {
  overdueTasks: number;
  completedTasks: number;
  lowStockItems: number;
  pendingPurchaseOrders: number;
}

interface RecentStockTransaction {
  id: string;
  materialName: string;
  type: string;
  quantity: number;
  date: Date;
  unit: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    overdueTasks: 0,
    completedTasks: 0,
    lowStockItems: 0,
    pendingPurchaseOrders: 0
  });
  const [recentTransactions, setRecentTransactions] = useState<RecentStockTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch overdue tasks
        const tasksRef = collection(db, 'maintenance-tasks');
        const overdueQuery = query(
          tasksRef,
          where('status', '==', 'pending')
        );
        const overdueSnapshot = await getDocs(overdueQuery);
        const currentDate = new Date();
        const overdueTasks = overdueSnapshot.docs.filter(doc => 
          new Date(doc.data().scheduledDate) < currentDate
        ).length;

        // Fetch completed tasks
        const completedQuery = query(
          tasksRef,
          where('status', '==', 'completed')
        );
        const completedSnapshot = await getDocs(completedQuery);
        const completedTasks = completedSnapshot.docs.length;

        // Fetch low stock items
        const stockRef = collection(db, 'stock');
        const lowStockQuery = query(
          stockRef,
          where('quantity', '<=', 10)
        );
        const lowStockSnapshot = await getDocs(lowStockQuery);
        const lowStockItems = lowStockSnapshot.docs.length;

        // Fetch pending purchase orders
        const poRef = collection(db, 'purchase-order');
        const pendingPOQuery = query(
          poRef,
          where('status', '==', 'pending')
        );
        const pendingPOSnapshot = await getDocs(pendingPOQuery);
        const pendingPurchaseOrders = pendingPOSnapshot.docs.length;

        // Fetch recent stock transactions
        const transactionsRef = collection(db, 'stock-transactions');
        const recentTransactionsQuery = query(
          transactionsRef,
          where('type', 'in', ['IN', 'OUT'])
        );
        const transactionsSnapshot = await getDocs(recentTransactionsQuery);
        const transactions = transactionsSnapshot.docs
          .map(doc => ({
            id: doc.id,
            materialName: doc.data().materialName || '',
            type: doc.data().type || '',
            quantity: doc.data().quantity || 0,
            unit: doc.data().unit || '',
            date: doc.data().date?.toDate?.() || new Date()
          }))
          .sort((a, b) => b.date.getTime() - a.date.getTime())
          .slice(0, 5);

        setStats({
          overdueTasks,
          completedTasks,
          lowStockItems,
          pendingPurchaseOrders
        });
        setRecentTransactions(transactions);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600">
              <FiAlertCircle className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Overdue Tasks</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.overdueTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <FiCheckCircle className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completed Tasks</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.completedTasks}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <FiBox className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.lowStockItems}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <FiShoppingCart className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Purchase Orders</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.pendingPurchaseOrders}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Recent Stock Transactions</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentTransactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{transaction.materialName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      transaction.type === 'IN' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {transaction.quantity} {transaction.unit}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transaction.date.toLocaleDateString()}
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