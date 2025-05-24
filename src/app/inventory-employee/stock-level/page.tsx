'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'react-hot-toast';
import { FiPlus, FiRefreshCw } from 'react-icons/fi';
import ExportCSVButton from '@/components/ExportCSVButton';
import Pagination from '@/components/Pagination';

interface StockLevel {
  id: string;
  materialName: string;
  currentStock: number;
  reorderPoint: number;
  unit: string;
  status: string;
}

export default function StockLevelPage() {
  const [stockLevels, setStockLevels] = useState<StockLevel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [form, setForm] = useState({
    materialName: '',
    currentStock: '',
    reorderPoint: '',
    unit: '',
  });

  useEffect(() => {
    fetchStockLevels();
  }, []);

  const fetchStockLevels = async () => {
    try {
      setIsLoading(true);
      const stockLevelsRef = collection(db, 'stock-levels');
      const q = query(stockLevelsRef, orderBy('materialName'));
      const querySnapshot = await getDocs(q);
      const levels = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as StockLevel[];
      setStockLevels(levels);
    } catch (error) {
      console.error('Error fetching stock levels:', error);
      toast.error('Failed to fetch stock levels');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(stockLevels.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStockLevels = stockLevels.slice(startIndex, endIndex);

  const openAddModal = () => {
    setForm({
      materialName: '',
      currentStock: '',
      reorderPoint: '',
      unit: '',
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm({
      materialName: '',
      currentStock: '',
      reorderPoint: '',
      unit: '',
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentStock = Number(form.currentStock);
    const reorderPoint = Number(form.reorderPoint);
    const status = currentStock <= reorderPoint ? 'Low Stock' : 'In Stock';
    setStockLevels([
      ...stockLevels,
      {
        id: (Math.random() * 100000).toFixed(0),
        materialName: form.materialName,
        currentStock,
        reorderPoint,
        unit: form.unit,
        status
      },
    ]);
    closeModal();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold mb-4">Stock Levels</h1>
        <div className="flex gap-4">
          <button
            onClick={fetchStockLevels}
            className="bg-primary-dark text-white px-4 py-2 rounded-lg shadow hover:bg-primary transition-colors flex items-center gap-2"
          >
            <FiRefreshCw /> Refresh
          </button>
          <button
            onClick={openAddModal}
            className="bg-primary-dark text-white px-4 py-2 rounded-lg shadow hover:bg-primary transition-colors flex items-center gap-2"
          >
            <FiPlus /> Add New Stock Level
          </button>
        </div>
        <ExportCSVButton data={stockLevels} filename="stock-levels" />
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-primary-dark">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Material Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Current Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Reorder Point</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Unit</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-dark">
              {currentStockLevels.map((level) => (
                <tr key={level.id} className="hover:bg-secondary-light transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">{level.materialName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{level.currentStock}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{level.reorderPoint}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{level.unit}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      level.status === 'Low Stock' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {level.status}
                    </span>
                  </td>
                </tr>
              ))}
              {currentStockLevels.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    No stock levels found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Stock Level</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Material Name</label>
                <input
                  type="text"
                  name="materialName"
                  value={form.materialName}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Current Stock</label>
                <input
                  type="number"
                  name="currentStock"
                  value={form.currentStock}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Reorder Point</label>
                <input
                  type="number"
                  name="reorderPoint"
                  value={form.reorderPoint}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                  min="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Unit</label>
                <input
                  type="text"
                  name="unit"
                  value={form.unit}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
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
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 