import React, { useState, useRef } from 'react';
import { FileItem, SortMethod, MergeResult } from './types';
import { generateUniqueId, sortFiles, formatBytes, readFileAsText, resolveCodeConflicts } from './utils/fileHelper';
import FileItemRow from './components/FileItemRow';
import MergeStatus from './components/MergeStatus';
import { suggestFilenameWithAI } from './services/geminiService';

const App: React.FC = () => {
  const [fileItems, setFileItems] = useState<FileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [mergeResult, setMergeResult] = useState<MergeResult | null>(null);
  const [sortMethod, setSortMethod] = useState<SortMethod>(SortMethod.NAME_ASC);
  const [customRegex, setCustomRegex] = useState<string>('(\\d+)'); // Default matching numbers
  const [resolveConflicts, setResolveConflicts] = useState<boolean>(true);
  const [suggestedName, setSuggestedName] = useState<string>('');
  const [isThinking, setIsThinking] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const processFiles = (files: FileList | null) => {
    if (!files) return;

    const newItems: FileItem[] = Array.from(files)
      .filter(f => f.name.endsWith('.ts') || f.name.endsWith('.tsx') || f.name.endsWith('.js'))
      .map(file => ({
        id: generateUniqueId(),
        file,
        order: 0
      }));

    if (newItems.length === 0) {
      alert("Vui lòng chọn các file mã nguồn (.ts, .tsx, .js)");
      return;
    }

    setFileItems(prev => {
      const combined = [...prev, ...newItems];
      return sortFiles(combined, sortMethod, customRegex).map((item, idx) => ({ ...item, order: idx }));
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const removeFile = (id: string) => {
    setFileItems(prev => prev.filter(item => item.id !== id));
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newItems = [...fileItems];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < newItems.length) {
      [newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]];
      setFileItems(newItems);
    }
  };

  const applySort = (method: SortMethod) => {
    setSortMethod(method);
    setFileItems(prev => sortFiles([...prev], method, customRegex));
  };

  const handleCustomRegexChange = (val: string) => {
    setCustomRegex(val);
    if (sortMethod === SortMethod.CUSTOM_REGEX) {
      setFileItems(prev => sortFiles([...prev], SortMethod.CUSTOM_REGEX, val));
    }
  };

  const handleClearAll = () => {
    if (window.confirm("Bạn có chắc muốn xóa toàn bộ danh sách?")) {
      setFileItems([]);
      setMergeResult(null);
      setSuggestedName('');
    }
  };

  const handleMerge = async () => {
    if (fileItems.length === 0) return;

    setIsMerging(true);
    setMergeResult(null);

    // Use a timeout to allow UI to render the loading state
    setTimeout(async () => {
      try {
        // 1. Read all files as Text
        const fileContents = await Promise.all(
          fileItems.map(async (item) => ({
            name: item.file.name,
            content: await readFileAsText(item.file)
          }))
        );

        // 2. Resolve Conflicts (Optional)
        let processedContents: string[];
        if (resolveConflicts) {
          processedContents = resolveCodeConflicts(fileContents);
        } else {
          processedContents = fileContents.map(f => `/** SOURCE: ${f.name} **/\n${f.content}`);
        }

        // 3. Merge
        const finalContent = processedContents.join('\n\n// ------------------------------------------------------------------\n\n');
        
        const mergedBlob = new Blob([finalContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(mergedBlob);
        
        // Ensure .ts extension logic
        let finalName = suggestedName.trim();
        if (!finalName) {
          finalName = `merged_code_${Date.now()}.ts`;
        } else if (!finalName.toLowerCase().endsWith('.ts')) {
          finalName += '.ts';
        }

        setMergeResult({
          blob: mergedBlob,
          url,
          filename: finalName
        });
      } catch (error) {
        console.error("Merge error:", error);
        alert("Có lỗi xảy ra khi đọc hoặc xử lý file.");
      } finally {
        setIsMerging(false);
      }
    }, 500);
  };

  const handleSmartName = async () => {
    if (fileItems.length === 0) return;
    setIsThinking(true);
    const names = fileItems.map(i => i.file.name);
    const suggestion = await suggestFilenameWithAI(names);
    setSuggestedName(suggestion);
    setIsThinking(false);
  };

  const totalSize = fileItems.reduce((acc, item) => acc + item.file.size, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* Header */}
        <header className="mb-8 text-center">
          <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400 mb-2">
            TypeScript Merger
          </h1>
          <p className="text-slate-400">Hợp nhất mã nguồn .ts, tự động xử lý xung đột tên biến & sắp xếp regex</p>
        </header>

        {/* Main Card */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
          
          {/* Toolbar */}
          <div className="p-4 bg-slate-800/50 border-b border-slate-700 flex flex-col gap-4">
             {/* Top Row: Add Files & Main Controls */}
             <div className="flex flex-wrap gap-3 items-center justify-between">
                <div className="flex gap-2">
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-all shadow-lg shadow-indigo-900/20 flex items-center gap-2"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Thêm Files (.ts)
                    </button>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      multiple 
                      accept=".ts,.tsx,.js"
                      onChange={(e) => {
                          processFiles(e.target.files);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                    />
                </div>

                {fileItems.length > 0 && (
                  <div className="flex items-center gap-2">
                      <select 
                        value={sortMethod}
                        onChange={(e) => applySort(e.target.value as SortMethod)}
                        className="bg-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 border-none focus:ring-2 focus:ring-indigo-500 outline-none"
                      >
                        <option value={SortMethod.NAME_ASC}>Tên (A-Z)</option>
                        <option value={SortMethod.NAME_DESC}>Tên (Z-A)</option>
                        <option value={SortMethod.SIZE_ASC}>Kích thước (Nhỏ-Lớn)</option>
                        <option value={SortMethod.LAST_MODIFIED}>Ngày sửa đổi</option>
                        <option value={SortMethod.CUSTOM_REGEX}>Regex Pattern</option>
                      </select>
                      <button 
                        onClick={handleClearAll}
                        className="p-2 text-slate-400 hover:text-red-400 transition-colors"
                        title="Xóa tất cả"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                  </div>
                )}
             </div>

             {/* Advanced Options Row */}
             {fileItems.length > 0 && (
               <div className="flex flex-col md:flex-row gap-4 pt-2 border-t border-slate-700/50">
                  {/* Regex Sort Input */}
                  {sortMethod === SortMethod.CUSTOM_REGEX && (
                     <div className="flex-1">
                        <label className="text-xs text-slate-400 mb-1 block">Quy tắc sắp xếp (Regex)</label>
                        <div className="flex items-center gap-2">
                          <input 
                            type="text" 
                            value={customRegex}
                            onChange={(e) => handleCustomRegexChange(e.target.value)}
                            placeholder="Ví dụ: (\d+) để lấy số"
                            className="bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-sm text-indigo-300 w-full focus:border-indigo-500 outline-none"
                          />
                          <div className="group relative">
                             <span className="cursor-help text-slate-500">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                             </span>
                             <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-black text-xs text-slate-300 rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                               Nhập Regex để trích xuất phần tên file dùng để sắp xếp. Ví dụ: <code>(\d+)</code> sẽ tìm số đầu tiên trong tên file.
                             </div>
                          </div>
                        </div>
                     </div>
                  )}

                  {/* Conflict Toggle */}
                  <div className="flex items-center gap-3 bg-slate-800/80 px-4 py-2 rounded-lg border border-slate-700">
                      <div className="flex-1">
                          <span className="text-sm font-medium text-slate-200 block">Xử lý xung đột tên</span>
                          <span className="text-xs text-slate-500">Đổi tên biến trùng lặp (var, const, fn...)</span>
                      </div>
                      <button 
                        onClick={() => setResolveConflicts(!resolveConflicts)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${resolveConflicts ? 'bg-indigo-500' : 'bg-slate-600'}`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition transition-transform ${resolveConflicts ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                  </div>
               </div>
             )}
          </div>

          {/* File List Area */}
          <div 
            className={`
              min-h-[300px] max-h-[500px] overflow-y-auto p-4 transition-all
              ${fileItems.length === 0 ? 'flex flex-col items-center justify-center border-2 border-dashed border-slate-700 m-4 rounded-xl bg-slate-800/30' : ''}
              ${isDragging ? 'border-indigo-500 bg-indigo-500/10' : ''}
            `}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            {fileItems.length === 0 ? (
              <div className="text-center pointer-events-none">
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-slate-400 text-lg">Kéo thả file mã nguồn (.ts) vào đây</p>
                  <p className="text-slate-600 text-sm mt-2">Hỗ trợ TypeScript, JavaScript</p>
              </div>
            ) : (
              <div>
                {fileItems.map((item, index) => (
                  <FileItemRow 
                    key={item.id} 
                    item={item} 
                    index={index}
                    onRemove={removeFile}
                    moveUp={(idx) => moveItem(idx, 'up')}
                    moveDown={(idx) => moveItem(idx, 'down')}
                    isFirst={index === 0}
                    isLast={index === fileItems.length - 1}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer / Actions */}
          <div className="p-4 bg-slate-800 border-t border-slate-700">
             <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-sm text-slate-400">
                  Tổng cộng: <span className="text-white font-medium">{fileItems.length} files</span>
                  <span className="mx-2">•</span>
                  Kích thước: <span className="text-white font-medium">{formatBytes(totalSize)}</span>
                </div>

                {fileItems.length > 0 && !mergeResult && !isMerging && (
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    {/* Gemini AI Renaming Feature */}
                    <div className="flex-1 md:flex-none relative">
                      <div className="flex bg-slate-900 rounded-lg border border-slate-600 focus-within:border-indigo-500 transition-colors">
                        <input 
                          type="text" 
                          placeholder="Tên file kết quả..."
                          value={suggestedName}
                          onChange={(e) => setSuggestedName(e.target.value)}
                          className="bg-transparent px-3 py-2 text-sm text-white outline-none w-full min-w-[200px]"
                        />
                         <button 
                            onClick={handleSmartName}
                            disabled={isThinking}
                            className="px-3 py-1 text-xs font-medium text-indigo-300 hover:text-white border-l border-slate-700 hover:bg-indigo-600/30 transition-colors flex items-center gap-1"
                            title="Gợi ý tên file bằng AI"
                         >
                           {isThinking ? (
                              <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                           ) : (
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                             </svg>
                           )}
                           AI Name
                         </button>
                      </div>
                    </div>

                    <button 
                      onClick={handleMerge}
                      className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white rounded-lg font-bold shadow-lg shadow-indigo-500/30 transition-all transform hover:scale-105 whitespace-nowrap"
                    >
                      Hợp nhất Code
                    </button>
                  </div>
                )}
             </div>

             <MergeStatus 
                isMerging={isMerging} 
                result={mergeResult} 
                onReset={() => {
                  setMergeResult(null);
                  setSuggestedName('');
                }}
             />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;