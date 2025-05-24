'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'react-hot-toast';
import { FiPlus, FiRefreshCw } from 'react-icons/fi';
import ExportCSVButton from '@/components/ExportCSVButton';
import Pagination from '@/components/Pagination';

interface PurchaseRequest {
  id: string;
  supplierName: string;
  expectedDate: string;
  materialId: string;
  materialName: string;
  quantityToOrder: number;
  unitPrice: number;
  totalPrice: number;
  status: string;
  createdAt: Timestamp;
}

export default function PurchaseOrderPage() {
  const [orders, setOrders] = useState<PurchaseRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [form, setForm] = useState({
    supplierName: '',
    expectedDate: '',
    materialName: '',
    qtyToOrder: '',
    unitPrice: '',
  });

  useEffect(() => {
    fetchPurchaseRequests();
  }, []);

  const fetchPurchaseRequests = async () => {
    try {
      setIsLoading(true);
      const purchaseRequestsRef = collection(db, 'purchase-requests');
      const q = query(purchaseRequestsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const requests = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as PurchaseRequest[];
      setOrders(requests);
    } catch (error) {
      console.error('Error fetching purchase requests:', error);
      toast.error('Failed to fetch purchase requests');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate pagination
  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentOrders = orders.slice(startIndex, endIndex);

  const openAddModal = () => {
    setForm({ supplierName: '', expectedDate: '', materialName: '', qtyToOrder: '', unitPrice: '' });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm({ supplierName: '', expectedDate: '', materialName: '', qtyToOrder: '', unitPrice: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qtyToOrder = Number(form.qtyToOrder);
    const unitPrice = Number(form.unitPrice);
    const totalPrice = qtyToOrder * unitPrice;
    setOrders([
      ...orders,
      {
        id: (Math.random() * 100000).toFixed(0),
        supplierName: form.supplierName,
        expectedDate: form.expectedDate,
        materialId: '',
        materialName: form.materialName,
        quantityToOrder: qtyToOrder,
        unitPrice,
        totalPrice,
        status: 'Pending',
        createdAt: Timestamp.now()
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
        <h1 className="text-2xl font-bold mb-4">Purchase Orders</h1>
        <div className="flex gap-4">
          <button
            onClick={fetchPurchaseRequests}
            className="bg-primary-dark text-white px-4 py-2 rounded-lg shadow hover:bg-primary transition-colors flex items-center gap-2"
          >
            <FiRefreshCw /> Refresh
          </button>
          <button
            onClick={openAddModal}
            className="bg-primary-dark text-white px-4 py-2 rounded-lg shadow hover:bg-primary transition-colors flex items-center gap-2"
          >
            <FiPlus /> Add New Order
          </button>
        </div>
        <ExportCSVButton data={orders} filename="purchase-orders" />
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-primary-dark">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Supplier Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Expected Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Material Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Qty to Order</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Unit Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Total Price</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary-dark">
              {currentOrders.map((order) => (
                <tr key={order.id} className="hover:bg-secondary-light transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">{order.supplierName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{order.expectedDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{order.materialName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{order.quantityToOrder}</td>
                  <td className="px-6 py-4 whitespace-nowrap">${order.unitPrice.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">${order.totalPrice.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                      order.status === 'Approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {order.createdAt?.toDate().toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {currentOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    No purchase orders found
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
            <h2 className="text-xl font-bold mb-4">Add New Purchase Order</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Supplier Name</label>
                <input
                  type="text"
                  name="supplierName"
                  value={form.supplierName}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Expected Date</label>
                <input
                  type="date"
                  name="expectedDate"
                  value={form.expectedDate}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
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
                <label className="block text-sm font-medium mb-1">Qty to Order</label>
                <input
                  type="number"
                  name="qtyToOrder"
                  value={form.qtyToOrder}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                  min="1"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Unit Price</label>
                <input
                  type="number"
                  name="unitPrice"
                  value={form.unitPrice}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                  min="0"
                  step="0.01"
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