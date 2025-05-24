'use client';

import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ExportCSVButton from '@/components/ExportCSVButton';
import Pagination from '@/components/Pagination';
import LoadingScreen from '@/components/LoadingScreen';

interface MaterialUsage {
  id: string;
  name: string;
  totalQuantity: number;
  lastUsedDate: Date;
  unit: string;
}

export default function MaterialUsagePage() {
  const [materialUsages, setMaterialUsages] = useState<MaterialUsage[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchMaterialUsage = async () => {
      try {
        console.log('Fetching material usage data...');
        const transactionsRef = collection(db, 'stock-transactions');
        const q = query(
          transactionsRef,
          where('type', '==', 'OUT')
        );
        const querySnapshot = await getDocs(q);
        
        console.log('Number of stock-out transactions:', querySnapshot.docs.length);
        
        // Create a map to store material usage totals
        const materialUsageMap = new Map<string, { 
          totalQuantity: number; 
          lastUsedDate: Date;
          name: string;
          unit: string;
        }>();
        
        querySnapshot.docs.forEach(doc => {
          const data = doc.data();
          console.log('Processing transaction:', data);
          
          const materialId = data.materialId;
          const quantity = Number(data.quantity) || 0;
          const date = data.date?.toDate?.() || new Date();
          const materialName = data.materialName || 'Unknown Material';
          const unit = data.unit || '';

          console.log('Processed data:', {
            materialId,
            quantity,
            date,
            materialName,
            unit
          });

          if (materialUsageMap.has(materialId)) {
            const current = materialUsageMap.get(materialId)!;
            materialUsageMap.set(materialId, {
              totalQuantity: current.totalQuantity + quantity,
              lastUsedDate: date > current.lastUsedDate ? date : current.lastUsedDate,
              name: materialName,
              unit: unit
            });
          } else {
            materialUsageMap.set(materialId, {
              totalQuantity: quantity,
              lastUsedDate: date,
              name: materialName,
              unit: unit
            });
          }
        });

        console.log('Material usage map:', Object.fromEntries(materialUsageMap));

        // Convert map to array and sort by total quantity
        const usages = Array.from(materialUsageMap.entries()).map(([id, data]) => ({
          id,
          name: data.name,
          totalQuantity: data.totalQuantity,
          lastUsedDate: data.lastUsedDate,
          unit: data.unit
        })).sort((a, b) => b.totalQuantity - a.totalQuantity);

        console.log('Final processed usages:', usages);
        setMaterialUsages(usages);
      } catch (error) {
        console.error('Error fetching material usage:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMaterialUsage();
  }, []);

  // Calculate pagination
  const totalPages = Math.ceil(materialUsages.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentUsages = materialUsages.slice(startIndex, endIndex);

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Material Usage</h1>
        <ExportCSVButton data={materialUsages} filename="material-usage" />
      </div>
      {materialUsages.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <p className="text-gray-500">No material usage data available</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-primary-dark">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Material ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Material Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Last Used Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Total Quantity Used</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary-dark">
                {currentUsages.map((usage) => (
                  <tr key={usage.id} className="hover:bg-secondary-light transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">{usage.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{usage.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{usage.lastUsedDate.toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{usage.totalQuantity}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{usage.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
} 