import React from 'react';
import { FiDownload } from 'react-icons/fi';

interface ExportCSVButtonProps {
  data: any[];
  filename: string;
  className?: string;
}

export default function ExportCSVButton({ data, filename, className = '' }: ExportCSVButtonProps) {
  const exportToCSV = () => {
    if (data.length === 0) return;

    // Get headers from the first object
    const headers = Object.keys(data[0]);

    // Create CSV content
    const csvContent = [
      headers.join(','), // Header row
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Handle special cases
          if (value instanceof Date) {
            return `"${value.toLocaleDateString()}"`;
          }
          if (typeof value === 'string' && value.includes(',')) {
            return `"${value}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <button
      onClick={exportToCSV}
      className={`inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary ${className}`}
    >
      <FiDownload className="h-4 w-4 mr-2" />
      Export CSV
    </button>
  );
} 