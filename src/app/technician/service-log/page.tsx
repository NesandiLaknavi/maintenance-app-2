'use client';

import React, { useState } from 'react';

interface ServiceLog {
  id: string;
  machineId: string;
  machineModel: string;
  techId: string;
  date: string;
  service: string;
  meterReading: number;
  usedMaterial: string;
  status: 'completed' | 'pending' | 'approved';
}

const initialServiceLogs: ServiceLog[] = [
  {
    id: '1',
    machineId: 'MCH-001',
    machineModel: 'Model X',
    techId: 'TECH-123',
    date: '2024-06-01',
    service: 'Oil Change',
    meterReading: 1200,
    usedMaterial: 'Oil Filter',
    status: 'completed',
  },
  {
    id: '2',
    machineId: 'MCH-002',
    machineModel: 'Model Y',
    techId: 'TECH-456',
    date: '2024-06-03',
    service: 'Belt Replacement',
    meterReading: 3400,
    usedMaterial: 'Belt',
    status: 'pending',
  },
  {
    id: '3',
    machineId: 'MCH-003',
    machineModel: 'Model Z',
    techId: 'TECH-789',
    date: '2024-06-05',
    service: 'Inspection',
    meterReading: 500,
    usedMaterial: 'N/A',
    status: 'approved',
  },
];

export default function ServiceLogPage() {
  const [serviceLogs, setServiceLogs] = useState<ServiceLog[]>(initialServiceLogs);

  const handleStatusChange = (id: string, newStatus: 'completed' | 'pending' | 'approved') => {
    setServiceLogs(serviceLogs.map(log => log.id === id ? { ...log, status: newStatus } : log));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-4">Service Log</h1>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-primary-dark">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Machine Id</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Machine Model</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Tech Id</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Service</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Meter Reading</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Used Material</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-dark">
            {serviceLogs.map((log) => (
              <tr key={log.id} className="hover:bg-secondary-light transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">{log.machineId}</td>
                <td className="px-6 py-4 whitespace-nowrap">{log.machineModel}</td>
                <td className="px-6 py-4 whitespace-nowrap">{log.techId}</td>
                <td className="px-6 py-4 whitespace-nowrap">{log.date}</td>
                <td className="px-6 py-4 whitespace-nowrap">{log.service}</td>
                <td className="px-6 py-4 whitespace-nowrap">{log.meterReading}</td>
                <td className="px-6 py-4 whitespace-nowrap">{log.usedMaterial}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    value={log.status}
                    onChange={(e) => handleStatusChange(log.id, e.target.value as 'completed' | 'pending' | 'approved')}
                    className="border rounded px-2 py-1"
                  >
                    <option value="completed">Completed</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 