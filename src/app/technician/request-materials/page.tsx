'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'react-hot-toast';

interface Material {
  name: string;
  qty: number;
}

interface Machine {
  id: string;
  machineId: string;
  brand: string;
  model: string;
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

export default function RequestMaterialsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<MaterialRequest[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [form, setForm] = useState({
    machine: '',
    task: '',
    materials: [{ name: '', qty: '' }] as { name: string; qty: string }[]
  });

  useEffect(() => {
    if (user?.uid) {
      fetchRequests();
      fetchMachines();
    }
  }, [user?.uid]);

  const fetchMachines = async () => {
    try {
      const machinesRef = collection(db, 'machines');
      const querySnapshot = await getDocs(machinesRef);
      const machinesList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Machine[];
      console.log('Fetched machines:', machinesList);
      setMachines(machinesList);
    } catch (error) {
      console.error('Error fetching machines:', error);
      toast.error('Failed to fetch machines');
    }
  };

  const fetchRequests = async () => {
    try {
      setIsLoading(true);
      if (!user?.uid) {
        console.error('No user ID available');
        return;
      }

      const requestsRef = collection(db, 'material-requests');
      const q = query(requestsRef, where('techId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      const requestsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MaterialRequest[];
      console.log('Fetched requests:', requestsList);
      setRequests(requestsList);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to fetch material requests');
    } finally {
      setIsLoading(false);
    }
  };

  const openAddModal = () => {
    setForm({ 
      machine: '', 
      task: '', 
      materials: [{ name: '', qty: '' }] 
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setForm({ 
      machine: '', 
      task: '', 
      materials: [{ name: '', qty: '' }] 
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    console.log('Form change:', { name, value });
    
    if (name.startsWith('material-')) {
      const index = parseInt(name.split('-')[1]);
      const field = name.split('-')[2];
      const newMaterials = [...form.materials];
      newMaterials[index] = {
        ...newMaterials[index],
        [field]: value
      };
      setForm({ ...form, materials: newMaterials });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const addMaterialField = () => {
    setForm({
      ...form,
      materials: [...form.materials, { name: '', qty: '' }]
    });
  };

  const removeMaterialField = (index: number) => {
    const newMaterials = form.materials.filter((_, i) => i !== index);
    setForm({
      ...form,
      materials: newMaterials.length ? newMaterials : [{ name: '', qty: '' }]
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Validate user
      if (!user?.uid) {
        toast.error('User not authenticated');
        return;
      }

      // Validate machine selection
      if (!form.machine) {
        toast.error('Please select a machine');
        return;
      }

      // Validate task
      if (!form.task.trim()) {
        toast.error('Please enter a task description');
        return;
      }

      // Process materials
      const materials = form.materials
        .filter(m => m.name.trim() !== '')
        .map(m => ({
          name: m.name.trim(),
          qty: Number(m.qty) || 0
        }));

      if (materials.length === 0) {
        toast.error('Please add at least one material');
        return;
      }

      // Validate quantities
      const invalidQuantity = materials.find(m => m.qty <= 0);
      if (invalidQuantity) {
        toast.error(`Invalid quantity for material: ${invalidQuantity.name}`);
        return;
      }

      // Get selected machine
      console.log('Form machine value:', form.machine);
      console.log('Available machines:', machines);
      
      const selectedMachine = machines.find(m => m.machineId === form.machine);
      console.log('Selected machine:', selectedMachine);

      if (!selectedMachine) {
        console.error('Machine not found with ID:', form.machine);
        toast.error('Selected machine not found');
        return;
      }

      // Get user's name from auth context or user data
      const techName = user.displayName || user.email?.split('@')[0] || 'Unknown';
      console.log('User data:', {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        techName
      });

      // Prepare request data with explicit type checking
      const requestData: Omit<MaterialRequest, 'id'> = {
        machineId: selectedMachine.machineId,
        task: form.task.trim(),
        materials,
        techId: user.uid,
        techName,
        status: 'pending',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      // Validate all required fields
      const requiredFields = ['machineId', 'task', 'techId', 'techName', 'status'];
      const missingFields = requiredFields.filter(field => !requestData[field as keyof typeof requestData]);
      
      if (missingFields.length > 0) {
        console.error('Missing required fields:', missingFields);
        toast.error('Invalid request data: missing required fields');
        return;
      }

      console.log('Creating request with data:', requestData);

      // Create request in Firestore
      const docRef = await addDoc(collection(db, 'material-requests'), requestData);
      console.log('Request created with ID:', docRef.id);

      toast.success('Material request created successfully');
      closeModal();
      fetchRequests();
    } catch (error) {
      console.error('Error creating request:', error);
      if (error instanceof Error) {
        toast.error(`Failed to create request: ${error.message}`);
      } else {
        toast.error('Failed to create material request');
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this request?')) return;
    
    try {
      await deleteDoc(doc(db, 'material-requests', id));
      toast.success('Request deleted successfully');
      fetchRequests();
    } catch (error) {
      console.error('Error deleting request:', error);
      toast.error('Failed to delete request');
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
        <h1 className="text-2xl font-bold mb-4">Request Materials</h1>
        <button
          onClick={openAddModal}
          className="bg-primary-dark text-white px-4 py-2 rounded-lg shadow hover:bg-primary transition-colors"
        >
          Add New Request
        </button>
      </div>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-primary-dark">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Machine</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Task</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Materials</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Created At</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-dark">
            {requests.map((request) => (
              <tr key={request.id} className="hover:bg-secondary-light transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">{request.machineId}</td>
                <td className="px-6 py-4 whitespace-nowrap">{request.task}</td>
                <td className="px-6 py-4">
                  {request.materials.length > 0 ? (
                    <ul className="list-disc list-inside">
                      {request.materials.map((material, index) => (
                        <li key={index} className="text-sm">
                          {material.name} - Qty: {material.qty}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-500">No materials requested</span>
                  )}
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
                  {request.status === 'pending' && (
                    <button
                      onClick={() => handleDelete(request.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Add New Request</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Machine</label>
                <select
                  name="machine"
                  value={form.machine}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  <option value="">Select a machine</option>
                  {machines.map((machine) => (
                    <option key={machine.id} value={machine.machineId}>
                      {machine.machineId} ({machine.brand} {machine.model})
                    </option>
                  ))}
                </select>
                {form.machine && (
                  <p className="text-sm text-gray-500 mt-1">
                    Selected: {machines.find(m => m.machineId === form.machine)?.machineId || 'Unknown'}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Task</label>
                <input
                  type="text"
                  name="task"
                  value={form.task}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium">Materials</label>
                  <button
                    type="button"
                    onClick={addMaterialField}
                    className="text-sm text-primary-dark hover:text-primary"
                  >
                    + Add Material
                  </button>
                </div>
                {form.materials.map((material, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <div className="flex-1">
                      <input
                        type="text"
                        name={`material-${index}-name`}
                        value={material.name}
                        onChange={handleChange}
                        placeholder="Material name"
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                    <div className="w-24">
                      <input
                        type="number"
                        name={`material-${index}-qty`}
                        value={material.qty}
                        onChange={handleChange}
                        placeholder="Qty"
                        min="0"
                        className="w-full border rounded px-3 py-2"
                      />
                    </div>
                    {form.materials.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMaterialField(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
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