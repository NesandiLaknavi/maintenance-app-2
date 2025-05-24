'use client';

import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'react-hot-toast';
import { FiSearch } from 'react-icons/fi';
import ExportCSVButton from '@/components/ExportCSVButton';

interface Material {
  name: string;
  qty: number;
}

interface MaterialRequest {
  id: string;
  machineId: string;
  task: string;
  materials: Material[];
  techId: string;
  techName: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export default function RequestedMaterialsPage() {
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<MaterialRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [searchQuery, requests]);

  const filterRequests = () => {
    if (!searchQuery.trim()) {
      setFilteredRequests(requests);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = requests.filter(request => 
      request.machineId.toLowerCase().includes(query) ||
      request.task.toLowerCase().includes(query) ||
      request.techName.toLowerCase().includes(query) ||
      request.materials.some(material => 
        material.name.toLowerCase().includes(query)
      )
    );
    setFilteredRequests(filtered);
  };

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      const requestsRef = collection(db, 'material-requests');
      const q = query(requestsRef, where('status', 'in', ['pending', 'approved', 'rejected']));
      const querySnapshot = await getDocs(q);
      const requestsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MaterialRequest[];
      console.log('Fetched requests:', requestsList);
      setRequests(requestsList);
      setFilteredRequests(requestsList);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to fetch material requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (requestId: string, newStatus: 'pending' | 'approved' | 'rejected') => {
    try {
      const requestRef = doc(db, 'material-requests', requestId);
      await updateDoc(requestRef, {
        status: newStatus,
        updatedAt: Timestamp.now()
      });
      
      toast.success('Request status updated successfully');
      fetchRequests(); // Refresh the list
    } catch (error) {
      console.error('Error updating request status:', error);
      toast.error('Failed to update request status');
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
        <h1 className="text-2xl font-bold">Requested Materials</h1>
        <div className="relative w-64">
          <input
            type="text"
            placeholder="Search requests..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <FiSearch className="absolute left-3 top-3 text-gray-400" />
        </div>
        <ExportCSVButton data={requests} filename="requested-materials" />
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-primary-dark">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Machine</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Task</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Technician</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Materials</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Requested At</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-dark">
            {filteredRequests.length > 0 ? (
              filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-secondary-light transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">{request.machineId}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{request.task}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{request.techName}</td>
                  <td className="px-6 py-4">
                    <ul className="list-disc list-inside">
                      {request.materials.map((material, index) => (
                        <li key={index} className="text-sm">
                          {material.name} - Qty: {material.qty}
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      request.status === 'approved' ? 'bg-green-100 text-green-800' :
                      request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {request.createdAt?.toDate().toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={request.status}
                      onChange={(e) => handleStatusChange(request.id, e.target.value as 'pending' | 'approved' | 'rejected')}
                      className={`border rounded px-2 py-1 ${
                        request.status === 'approved' ? 'bg-green-50' :
                        request.status === 'rejected' ? 'bg-red-50' :
                        'bg-yellow-50'
                      }`}
                    >
                      <option value="pending">Pending</option>
                      <option value="approved">Approved</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                  {searchQuery ? 'No matching requests found' : 'No requests available'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 