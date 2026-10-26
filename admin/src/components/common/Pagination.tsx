import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  itemsPerPage?: number;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 text-xs text-slate-500">
      <div>
        {totalItems !== undefined && itemsPerPage !== undefined ? (
          <span>
            Showing <strong className="text-slate-700">{Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}</strong> to{' '}
            <strong className="text-slate-700">{Math.min(currentPage * itemsPerPage, totalItems)}</strong> of{' '}
            <strong className="text-slate-700">{totalItems}</strong> entries
          </span>
        ) : (
          <span>
            Page <strong className="text-slate-700">{currentPage}</strong> of <strong className="text-slate-700">{totalPages}</strong>
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="px-3 py-1 font-medium text-slate-700 bg-slate-100 rounded-lg">
          {currentPage} / {totalPages}
        </span>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
