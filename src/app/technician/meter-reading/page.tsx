'use client';

import React, { useState, useEffect } from 'react';
import { collection, addDoc, updateDoc, deleteDoc, doc, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import TableSearch from '@/components/TableSearch';

interface Machine {
  id: string;
  machineId: string;
  name: string;
}

interface MeterReading {
  id: string;
  machineId: string;
  machineName: string;
  currentReading: number;
  unitType: string;
  timestamp: string;
}

export default function MeterReadingPage() {
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [filteredReadings, setFilteredReadings] = useState<MeterReading[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [machines, setMachines] = useState<Machine[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editReading, setEditReading] = useState<MeterReading | null>(null);
  const [form, setForm] = useState({
    machineId: '',
    machineName: '',
    currentReading: '',
    unitType: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchReadings();
    fetchMachines();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredReadings(readings);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = readings.filter(reading => 
        reading.machineId.toLowerCase().includes(query) ||
        reading.machineName.toLowerCase().includes(query) ||
        reading.unitType.toLowerCase().includes(query) ||
        reading.currentReading.toString().includes(query)
      );
      setFilteredReadings(filtered);
    }
  }, [searchQuery, readings]);

  const fetchMachines = async () => {
    try {
      const machinesRef = collection(db, 'machines');
      const querySnapshot = await getDocs(machinesRef);
      const machinesList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Machine[];
      setMachines(machinesList);
    } catch (err) {
      console.error('Error fetching machines:', err);
      setError('Failed to fetch machines');
    }
  };

  const fetchReadings = async () => {
    try {
      setLoading(true);
      const readingsRef = collection(db, 'meter-readings');
      const q = query(readingsRef, orderBy('timestamp', 'desc'));
      const querySnapshot = await getDocs(q);
      const readingsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MeterReading[];
      setReadings(readingsList);
    } catch (err) {
      console.error('Error fetching readings:', err);
      setError('Failed to fetch meter readings');
    } finally {
      setLoading(false);
    }
  };

  const openAddModal = () => {
    setEditReading(null);
    setForm({ machineId: '', machineName: '', currentReading: '', unitType: '' });
    setShowModal(true);
  };

  const openEditModal = (reading: MeterReading) => {
    setEditReading(reading);
    setForm({
      machineId: reading.machineId,
      machineName: reading.machineName,
      currentReading: reading.currentReading.toString(),
      unitType: reading.unitType,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditReading(null);
    setForm({ machineId: '', machineName: '', currentReading: '', unitType: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (name === 'machineId') {
      const selectedMachine = machines.find(m => m.machineId === value);
      setForm({ 
        ...form, 
        machineId: value,
        machineName: selectedMachine?.name || ''
      });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const readingData = {
        machineId: form.machineId,
        machineName: form.machineName,
        currentReading: Number(form.currentReading),
        unitType: form.unitType,
        timestamp: new Date().toISOString()
      };

      if (editReading) {
        // Update existing reading
        const readingRef = doc(db, 'meter-readings', editReading.id);
        await updateDoc(readingRef, readingData);
      } else {
        // Create new reading
        await addDoc(collection(db, 'meter-readings'), readingData);
      }

      await fetchReadings();
      closeModal();
    } catch (err) {
      console.error('Error saving reading:', err);
      setError('Failed to save meter reading');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this reading?')) return;

    try {
      await deleteDoc(doc(db, 'meter-readings', id));
      await fetchReadings();
    } catch (err) {
      console.error('Error deleting reading:', err);
      setError('Failed to delete meter reading');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold mb-4">Meter Reading</h1>
        <button
          onClick={openAddModal}
          className="bg-primary-dark text-white px-4 py-2 rounded-lg shadow hover:bg-primary transition-colors"
        >
          Add New Reading
        </button>
      </div>
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}
      <TableSearch
        value={searchQuery}
        onChange={setSearchQuery}
        placeholder="Search by machine ID, name, reading, or unit type..."
      />
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-primary-dark">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Machine Id</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Machine Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Current Reading</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Unit Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Timestamp</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-dark">
            {filteredReadings.map((reading) => (
              <tr key={reading.id} className="hover:bg-secondary-light transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">{reading.machineId}</td>
                <td className="px-6 py-4 whitespace-nowrap">{reading.machineName}</td>
                <td className="px-6 py-4 whitespace-nowrap">{reading.currentReading}</td>
                <td className="px-6 py-4 whitespace-nowrap">{reading.unitType}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {new Date(reading.timestamp).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap space-x-2">
                  <button
                    onClick={() => openEditModal(reading)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(reading.id)}
                    className="text-red-600 hover:text-red-800 font-medium"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-50 z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editReading ? 'Edit Reading' : 'Add New Reading'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Machine</label>
                <select
                  name="machineId"
                  value={form.machineId}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                  disabled={!!editReading}
                >
                  <option value="">Select a machine</option>
                  {machines.map((machine) => (
                    <option key={machine.id} value={machine.machineId}>
                      {machine.machineId} - {machine.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Current Reading</label>
                <input
                  type="number"
                  name="currentReading"
                  value={form.currentReading}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Unit Type</label>
                <select
                  name="unitType"
                  value={form.unitType}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                >
                  <option value="">Select unit type</option>
                  <option value="hours">Hours</option>
                  <option value="kmh-1">kmh-1</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded bg-primary-dark text-white hover:bg-primary flex items-center space-x-2 ${
                    submitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                      <span>{editReading ? 'Updating...' : 'Creating...'}</span>
                    </>
                  ) : (
                    <span>{editReading ? 'Update' : 'Create'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 