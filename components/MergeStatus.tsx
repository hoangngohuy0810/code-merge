import React from 'react';
import { MergeResult } from '../types';
import { formatBytes } from '../utils/fileHelper';

interface Props {
  isMerging: boolean;
  result: MergeResult | null;
  onReset: () => void;
}

const MergeStatus: React.FC<Props> = ({ isMerging, result, onReset }) => {
  if (isMerging) {
    return (
      <div className="mt-6 p-6 bg-slate-800 rounded-xl border border-indigo-500/30 flex flex-col items-center animate-pulse">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-indigo-300 font-medium">Đang xử lý hợp nhất file...</p>
        <p className="text-xs text-slate-500 mt-2">Vui lòng không đóng trình duyệt</p>
      </div>
    );
  }

  if (result) {
    return (
      <div className="mt-6 p-6 bg-emerald-900/20 border border-emerald-500/30 rounded-xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-emerald-100">Hợp nhất thành công!</h3>
              <p className="text-sm text-emerald-300/80">{result.filename} • {formatBytes(result.blob.size)}</p>
            </div>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
             <button 
              onClick={onReset}
              className="px-4 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors text-sm font-medium"
            >
              Làm mới
            </button>
            <a
              href={result.url}
              download={result.filename}
              className="flex-1 md:flex-none px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors shadow-lg shadow-emerald-900/50 flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Tải xuống
            </a>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default MergeStatus;