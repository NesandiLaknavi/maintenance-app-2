'use client';

import React from 'react';
import { FiFilter, FiX } from 'react-icons/fi';

export interface FilterOption {
  label: string;
  value: string;
}

interface TableFilterProps {
  label: string;
  options: FilterOption[];
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}

export default function TableFilter({ label, options, value, onChange, onClear }: TableFilterProps) {
  return (
    <div className="flex items-center space-x-2">
      <label className="text-sm font-medium text-gray-700">{label}:</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
        >
          <option value="">All</option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {value && (
          <button
            onClick={onClear}
            className="absolute inset-y-0 right-0 flex items-center pr-2 text-gray-400 hover:text-gray-600"
          >
            <FiX className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
} 