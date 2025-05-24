'use client';

import React, { useState } from 'react';

interface Machine {
  id: string;
  model: string;
  brand: string;
}

const initialMachines: Machine[] = [
  { id: 'MCH-001', model: 'Model X', brand: 'BrandA' },
  { id: 'MCH-002', model: 'Model Y', brand: 'BrandB' },
  { id: 'MCH-003', model: 'Model Z', brand: 'BrandC' },
];

export default function MachinesPage() {
  const [machines, setMachines] = useState<Machine[]>(initialMachines);
  const [showModal, setShowModal] = useState(false);
  const [editMachine, setEditMachine] = useState<Machine | null>(null);
  const [form, setForm] = useState({ id: '', model: '', brand: '' });

  const openAddModal = () => {
    setEditMachine(null);
    setForm({ id: '', model: '', brand: '' });
    setShowModal(true);
  };

  const openEditModal = (machine: Machine) => {
    setEditMachine(machine);
    setForm({ id: machine.id, model: machine.model, brand: machine.brand });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditMachine(null);
    setForm({ id: '', model: '', brand: '' });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editMachine) {
      // Update
      setMachines(machines.map(m => m.id === editMachine.id ? { ...form } : m));
    } else {
      // Create
      setMachines([...machines, { ...form }]);
    }
    closeModal();
  };

  const handleDelete = (id: string) => {
    setMachines(machines.filter(m => m.id !== id));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold mb-4">Machines</h1>
        <button
          onClick={openAddModal}
          className="bg-primary-dark text-white px-4 py-2 rounded-lg shadow hover:bg-primary transition-colors"
        >
          Add New Machine
        </button>
      </div>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-primary-dark">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Model</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Brand</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-dark">
            {machines.map((machine) => (
              <tr key={machine.id} className="hover:bg-secondary-light transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">{machine.id}</td>
                <td className="px-6 py-4 whitespace-nowrap">{machine.model}</td>
                <td className="px-6 py-4 whitespace-nowrap">{machine.brand}</td>
                <td className="px-6 py-4 whitespace-nowrap space-x-2">
                  <button
                    onClick={() => openEditModal(machine)}
                    className="text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(machine.id)}
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
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">{editMachine ? 'Edit Machine' : 'Add New Machine'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">ID</label>
                <input
                  type="text"
                  name="id"
                  value={form.id}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                  disabled={!!editMachine}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Model</label>
                <input
                  type="text"
                  name="model"
                  value={form.model}
                  onChange={handleChange}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Brand</label>
                <input
                  type="text"
                  name="brand"
                  value={form.brand}
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
                  {editMachine ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 