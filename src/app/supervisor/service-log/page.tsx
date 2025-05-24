import React from 'react';

const mockServiceLogs = [
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

const statusColors: Record<string, string> = {
  completed: 'bg-green-100 text-green-800',
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
};

export default function ServiceLogPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-4">Service Log</h1>
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-primary-dark">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Machine ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Machine Model</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Tech ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Service</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Meter Reading</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Used Material</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary-dark">
            {mockServiceLogs.map((log) => (
              <tr key={log.id} className="hover:bg-secondary-light transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">{log.machineId}</td>
                <td className="px-6 py-4 whitespace-nowrap">{log.machineModel}</td>
                <td className="px-6 py-4 whitespace-nowrap">{log.techId}</td>
                <td className="px-6 py-4 whitespace-nowrap">{log.date}</td>
                <td className="px-6 py-4 whitespace-nowrap">{log.service}</td>
                <td className="px-6 py-4 whitespace-nowrap">{log.meterReading}</td>
                <td className="px-6 py-4 whitespace-nowrap">{log.usedMaterial}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusColors[log.status] || ''}`}>
                    {log.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 