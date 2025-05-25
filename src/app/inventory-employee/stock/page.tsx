'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, doc, deleteDoc, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'react-hot-toast';
import { FiPlus, FiEdit2, FiTrash2, FiSearch } from 'react-icons/fi';
import ExportCSVButton from '@/components/ExportCSVButton';

interface Stock {
  id: string;
  materialName: string;
  unit: string;
  availableQty: number;
  reorderLevel: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  lowStock: boolean;
  lastUpdated: Timestamp;
}

interface StockTransaction {
  id: string;
  date: Timestamp;
  materialId: string;
  materialName: string;
  unit: string;
  quantity: number;
  type: 'IN' | 'OUT';
  reference: string;
}

interface StockItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  reorderLevel: number;
  location: string;
}

export default function StockPage() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<Stock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [transactionType, setTransactionType] = useState<'IN' | 'OUT'>('IN');
  const [stockItems, setStockItems] = useState<StockItem[]>([]);

  // Form states
  const [formData, setFormData] = useState({
    materialName: '',
    unit: '',
    availableQty: 0,
    reorderLevel: 10,
    status: 'In Stock' as 'In Stock' | 'Low Stock' | 'Out of Stock',
    lowStock: false
  });

  const [transactionData, setTransactionData] = useState({
    quantity: 0,
    reference: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchStocks();
    fetchStockItems();
  }, []);

  useEffect(() => {
    filterStocks();
  }, [searchQuery, stocks]);

  const filterStocks = () => {
    if (!searchQuery.trim()) {
      setFilteredStocks(stocks);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = stocks.filter(stock => 
      stock.materialName.toLowerCase().includes(query)
    );
    setFilteredStocks(filtered);
  };

  const fetchStocks = async () => {
    try {
      setIsLoading(true);
      const stocksRef = collection(db, 'stocks');
      const q = query(stocksRef, orderBy('materialName'));
      const querySnapshot = await getDocs(q);
      const stocksList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Stock[];
      setStocks(stocksList);
      setFilteredStocks(stocksList);
    } catch (error) {
      console.error('Error fetching stocks:', error);
      toast.error('Failed to fetch stock data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStockItems = async () => {
    try {
      const stockRef = collection(db, 'stock');
      const q = query(stockRef);
      const querySnapshot = await getDocs(q);
      
      const items = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        quantity: doc.data().quantity,
        unit: doc.data().unit,
        reorderLevel: doc.data().reorderLevel,
        location: doc.data().location
      }));

      setStockItems(items);
    } catch (error) {
      console.error('Error fetching stock items:', error);
    }
  };

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const isLowStock = formData.availableQty <= formData.reorderLevel;
      const stockRef = collection(db, 'stocks');
      const docRef = await addDoc(stockRef, {
        ...formData,
        lowStock: isLowStock,
        lastUpdated: Timestamp.now()
      });
      
      // Update the document with its ID as materialId
      await updateDoc(docRef, {
        materialId: docRef.id
      });

      toast.success('Stock added successfully');
      setShowAddModal(false);
      fetchStocks();
    } catch (error) {
      console.error('Error adding stock:', error);
      toast.error('Failed to add stock');
    }
  };

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStock) return;

    try {
      const isLowStock = formData.availableQty <= formData.reorderLevel;
      const stockRef = doc(db, 'stocks', selectedStock.id);
      await updateDoc(stockRef, {
        ...formData,
        lowStock: isLowStock,
        lastUpdated: Timestamp.now()
      });
      toast.success('Stock updated successfully');
      setShowAddModal(false);
      fetchStocks();
    } catch (error) {
      console.error('Error updating stock:', error);
      toast.error('Failed to update stock');
    }
  };

  const handleDeleteStock = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this stock item?')) return;

    try {
      await deleteDoc(doc(db, 'stocks', id));
      toast.success('Stock deleted successfully');
      fetchStocks();
    } catch (error) {
      console.error('Error deleting stock:', error);
      toast.error('Failed to delete stock');
    }
  };

  const handleStockTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStock) return;

    try {
      const newQty = transactionType === 'IN' 
        ? selectedStock.availableQty + transactionData.quantity
        : selectedStock.availableQty - transactionData.quantity;

      if (newQty < 0) {
        toast.error('Insufficient stock for this transaction');
        return;
      }

      const isLowStock = newQty <= selectedStock.reorderLevel;

      // Update stock quantity
      const stockRef = doc(db, 'stocks', selectedStock.id);
      await updateDoc(stockRef, {
        availableQty: newQty,
        status: newQty === 0 ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock',
        lowStock: isLowStock,
        lastUpdated: Timestamp.now()
      });

      // Record transaction
      const transactionRef = collection(db, 'stock-transactions');
      await addDoc(transactionRef, {
        date: Timestamp.fromDate(new Date(transactionData.date)),
        materialId: selectedStock.id,
        materialName: selectedStock.materialName,
        unit: selectedStock.unit,
        quantity: transactionData.quantity,
        type: transactionType,
        reference: transactionData.reference
      });

      toast.success('Transaction completed successfully');
      setShowTransactionModal(false);
      fetchStocks();
    } catch (error) {
      console.error('Error processing transaction:', error);
      toast.error('Failed to process transaction');
    }
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
        <h1 className="text-2xl font-bold">Stock Management</h1>
        <div className="flex gap-4">
          <div className="relative w-64">
            <input
              type="text"
              placeholder="Search stocks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <FiSearch className="absolute left-3 top-3 text-gray-400" />
          </div>
          <button
            onClick={() => {
              setSelectedStock(null);
              setFormData({
                materialName: '',
                unit: '',
                availableQty: 0,
                reorderLevel: 10,
                status: 'In Stock',
                lowStock: false
              });
              setShowAddModal(true);
            }}
            className="bg-primary-dark text-white px-4 py-2 rounded-lg shadow hover:bg-primary transition-colors flex items-center gap-2"
          >
            <FiPlus /> Add New Stock
          </button>
        </div>
        <ExportCSVButton data={stockItems} filename="stock-items" />
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-primary-dark">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Material ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Material Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Unit</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Available Qty</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Last Updated</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-dark">
            {filteredStocks.map((stock) => (
              <tr key={stock.id} className="hover:bg-secondary-light transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">{stock.id}</td>
                <td className="px-6 py-4 whitespace-nowrap">{stock.materialName}</td>
                <td className="px-6 py-4 whitespace-nowrap">{stock.unit}</td>
                <td className="px-6 py-4 whitespace-nowrap">{stock.availableQty}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    stock.status === 'In Stock' ? 'bg-green-100 text-green-800' :
                    stock.status === 'Low Stock' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {stock.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {stock.lastUpdated?.toDate().toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedStock(stock);
                        setFormData({
                          materialName: stock.materialName,
                          unit: stock.unit,
                          availableQty: stock.availableQty,
                          reorderLevel: stock.reorderLevel,
                          status: stock.status,
                          lowStock: stock.lowStock
                        });
                        setShowAddModal(true);
                      }}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      <FiEdit2 />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedStock(stock);
                        setTransactionType('IN');
                        setTransactionData({
                          quantity: 0,
                          reference: '',
                          date: new Date().toISOString().split('T')[0]
                        });
                        setShowTransactionModal(true);
                      }}
                      className="text-green-600 hover:text-green-800"
                    >
                      Stock In
                    </button>
                    <button
                      onClick={() => {
                        setSelectedStock(stock);
                        setTransactionType('OUT');
                        setTransactionData({
                          quantity: 0,
                          reference: '',
                          date: new Date().toISOString().split('T')[0]
                        });
                        setShowTransactionModal(true);
                      }}
                      className="text-orange-600 hover:text-orange-800"
                    >
                      Stock Out
                    </button>
                    <button
                      onClick={() => handleDeleteStock(stock.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Stock Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {selectedStock ? 'Edit Stock' : 'Add New Stock'}
            </h2>
            <form onSubmit={selectedStock ? handleUpdateStock : handleAddStock}>
              <div className="space-y-4">
                {selectedStock && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Material ID</label>
                    <input
                      type="text"
                      value={selectedStock.id}
                      className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
                      disabled
                    />
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium text-gray-700">Material Name</label>
                  <input
                    type="text"
                    value={formData.materialName}
                    onChange={(e) => setFormData({ ...formData, materialName: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Unit</label>
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Available Quantity
                  </label>
                  <input
                    type="number"
                    name="availableQty"
                    value={formData.availableQty}
                    onChange={(e) => setFormData({ ...formData, availableQty: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Reorder Level
                  </label>
                  <input
                    type="number"
                    name="reorderLevel"
                    value={formData.reorderLevel}
                    onChange={(e) => setFormData({ ...formData, reorderLevel: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    required
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Stock will be marked as "Low Stock" when it falls below this level
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-dark text-white rounded-md hover:bg-primary"
                >
                  {selectedStock ? 'Update' : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Transaction Modal */}
      {showTransactionModal && selectedStock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              Stock {transactionType === 'IN' ? 'In' : 'Out'}
            </h2>
            <form onSubmit={handleStockTransaction}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Material</label>
                  <input
                    type="text"
                    value={`${selectedStock.materialName} (${selectedStock.id})`}
                    className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Stock</label>
                  <input
                    type="text"
                    value={`${selectedStock.availableQty} ${selectedStock.unit}`}
                    className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity</label>
                  <input
                    type="number"
                    value={transactionData.quantity}
                    onChange={(e) => setTransactionData({ ...transactionData, quantity: Number(e.target.value) })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    required
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    value={transactionData.date}
                    onChange={(e) => setTransactionData({ ...transactionData, date: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Reference</label>
                  <input
                    type="text"
                    value={transactionData.reference}
                    onChange={(e) => setTransactionData({ ...transactionData, reference: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary"
                    required
                    placeholder="PO number, Requisition ID, etc."
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setShowTransactionModal(false)}
                  className="px-4 py-2 border rounded-md text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-white rounded-md ${
                    transactionType === 'IN' ? 'bg-green-600 hover:bg-green-700' : 'bg-orange-600 hover:bg-orange-700'
                  }`}
                >
                  Confirm {transactionType === 'IN' ? 'Stock In' : 'Stock Out'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 