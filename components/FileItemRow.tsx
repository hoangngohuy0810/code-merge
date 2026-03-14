import React from 'react';
import { FileItem } from '../types';
import { formatBytes } from '../utils/fileHelper';

interface Props {
  item: FileItem;
  index: number;
  onRemove: (id: string) => void;
  moveUp: (index: number) => void;
  moveDown: (index: number) => void;
  isFirst: boolean;
  isLast: boolean;
}

const FileItemRow: React.FC<Props> = ({ item, index, onRemove, moveUp, moveDown, isFirst, isLast }) => {
  return (
    <div className="flex items-center justify-between p-3 bg-slate-800 border border-slate-700 rounded-lg mb-2 hover:bg-slate-750 transition-colors group">
      <div className="flex items-center space-x-4 overflow-hidden">
        <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-slate-700 rounded-full text-xs font-mono text-slate-400">
          {index + 1}
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-medium text-slate-200 truncate pr-4" title={item.file.name}>
            {item.file.name}
          </span>
          <span className="text-xs text-slate-500">
            {formatBytes(item.file.size)}
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => moveUp(index)}
          disabled={isFirst}
          className={`p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed`}
          title="Lên trên"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <button
          onClick={() => moveDown(index)}
          disabled={isLast}
          className={`p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-600 disabled:opacity-30 disabled:cursor-not-allowed`}
          title="Xuống dưới"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <button
          onClick={() => onRemove(item.id)}
          className="p-1.5 rounded-md text-red-400 hover:text-red-300 hover:bg-red-900/30"
          title="Xóa"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default FileItemRow;