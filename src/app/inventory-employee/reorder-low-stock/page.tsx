'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, Timestamp, updateDoc, doc, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'react-hot-toast';
import { FiSearch, FiRefreshCw } from 'react-icons/fi';
import ExportCSVButton from '@/components/ExportCSVButton';

interface LowStockItem {
  id: string;
  materialName: string;
  availableQty: number;
  reorderLevel: number;
  lastUpdated: Timestamp;
  lastRefillDate?: Timestamp;
  unit: string;
}

interface PurchaseRequest {
  supplierName: string;
  expectedDate: string;
  materialName: string;
  quantityToOrder: number;
  unitPrice: number;
  totalPrice: number;
}

export default function ReorderLowStockPage() {
  const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<LowStockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LowStockItem | null>(null);
  const [purchaseRequest, setPurchaseRequest] = useState<PurchaseRequest>({
    supplierName: '',
    expectedDate: new Date().toISOString().split('T')[0],
    materialName: '',
    quantityToOrder: 0,
    unitPrice: 0,
    totalPrice: 0
  });

  useEffect(() => {
    fetchLowStockItems();
  }, []);

  useEffect(() => {
    filterItems();
  }, [searchQuery, lowStockItems]);

  const filterItems = () => {
    if (!searchQuery.trim()) {
      setFilteredItems(lowStockItems);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = lowStockItems.filter(item => 
      item.materialName.toLowerCase().includes(query) ||
      item.id.toLowerCase().includes(query)
    );
    setFilteredItems(filtered);
  };

  const fetchLowStockItems = async () => {
    try {
      setIsLoading(true);
      const stocksRef = collection(db, 'stocks');
      const q = query(
        stocksRef,
        orderBy('materialName')
      );
      const querySnapshot = await getDocs(q);
      const items = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          materialName: doc.data().materialName || '',
          availableQty: doc.data().availableQty || 0,
          reorderLevel: doc.data().reorderLevel || 0,
          lastUpdated: doc.data().lastUpdated || Timestamp.now(),
          lastRefillDate: doc.data().lastRefillDate,
          unit: doc.data().unit || ''
        }))
        .filter(item => item.availableQty <= item.reorderLevel);
      setLowStockItems(items);
      setFilteredItems(items);
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      toast.error('Failed to fetch low stock items');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReorder = async (item: LowStockItem) => {
    setSelectedItem(item);
    setPurchaseRequest({
      supplierName: '',
      expectedDate: new Date().toISOString().split('T')[0],
      materialName: item.materialName,
      quantityToOrder: item.reorderLevel * 2, // Default to double the reorder level
      unitPrice: 0,
      totalPrice: 0
    });
    setShowPurchaseModal(true);
  };

  const handlePurchaseRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    try {
      // Update last refill date
      const stockRef = doc(db, 'stocks', selectedItem.id);
      await updateDoc(stockRef, {
        lastRefillDate: Timestamp.now()
      });

      // Add purchase request to a new collection
      const purchaseRequestsRef = collection(db, 'purchase-requests');
      await addDoc(purchaseRequestsRef, {
        ...purchaseRequest,
        materialId: selectedItem.id,
        status: 'Pending',
        createdAt: Timestamp.now()
      });

      toast.success(`Purchase request submitted for ${selectedItem.materialName}`);
      setShowPurchaseModal(false);
      fetchLowStockItems();
    } catch (error) {
      console.error('Error processing purchase request:', error);
      toast.error('Failed to process purchase request');
    }
  };

  const calculateTotalPrice = (quantity: number, unitPrice: number) => {
    return quantity * unitPrice;
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
        <h1 className="text-2xl font-bold">Low Stock Items</h1>
        <div className="flex gap-4">
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          <button
            onClick={fetchLowStockItems}
            className="bg-primary-dark text-white px-4 py-2 rounded-lg shadow hover:bg-primary transition-colors flex items-center gap-2"
          >
            <FiRefreshCw /> Refresh
          </button>
        </div>
        <ExportCSVButton data={lowStockItems} filename="low-stock-items" />
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-primary-dark">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Material ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Material Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Current Qty</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Threshold Level</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Last Refill Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-dark">
            {filteredItems.map((item) => (
              <tr key={item.id} className="hover:bg-secondary-light transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">{item.id}</td>
                <td className="px-6 py-4 whitespace-nowrap">{item.materialName}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`font-medium ${
                    item.availableQty === 0 ? 'text-red-600' : 'text-yellow-600'
                  }`}>
                    {item.availableQty}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">{item.reorderLevel}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {item.lastRefillDate 
                    ? item.lastRefillDate.toDate().toLocaleDateString()
                    : 'Never'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleReorder(item)}
                    className="bg-primary-dark text-white px-4 py-2 rounded-lg shadow hover:bg-primary transition-colors"
                  >
                    Reorder
                  </button>
                </td>
              </tr>
            ))}
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                  {searchQuery ? 'No matching items found' : 'No low stock items found'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Purchase Request Modal */}
      {showPurchaseModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Purchase Request</h2>
            <form onSubmit={handlePurchaseRequest}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Supplier Name</label>
                  <input
                    type="text"
                    value={purchaseRequest.supplierName}
                    onChange={(e) => setPurchaseRequest({ ...purchaseRequest, supplierName: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Expected Date</label>
                  <input
                    type="date"
                    value={purchaseRequest.expectedDate}
                    onChange={(e) => setPurchaseRequest({ ...purchaseRequest, expectedDate: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Material Name</label>
                  <input
                    type="text"
                    value={purchaseRequest.materialName}
                    className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity to Order</label>
                  <input
                    type="number"
                    value={purchaseRequest.quantityToOrder}
                    onChange={(e) => {
                      const quantity = Number(e.target.value);
                      setPurchaseRequest({
                        ...purchaseRequest,
                        quantityToOrder: quantity,
                        totalPrice: calculateTotalPrice(quantity, purchaseRequest.unitPrice)
                      });
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    required
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Unit Price</label>
                  <input
                    type="number"
                    value={purchaseRequest.unitPrice}
                    onChange={(e) => {
                      const unitPrice = Number(e.target.value);
                      setPurchaseRequest({
                        ...purchaseRequest,
                        unitPrice: unitPrice,
                        totalPrice: calculateTotalPrice(purchaseRequest.quantityToOrder, unitPrice)
                      });
                    }}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    required
                    min="0"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Price</label>
                  <input
                    type="number"
                    value={purchaseRequest.totalPrice}
                    className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
                    disabled
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowPurchaseModal(false)}
                  className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-dark text-white rounded-md hover:bg-primary"
                >
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 