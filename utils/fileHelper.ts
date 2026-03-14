import { FileItem, SortMethod } from '../types';

export const formatBytes = (bytes: number, decimals = 2) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
};

// Logic xử lý xung đột tên biến/hàm
export const resolveCodeConflicts = (filesData: { name: string, content: string }[]) => {
  // Regex tìm khai báo top-level: const, let, var, function, class, type, interface, enum
  const declRegex = /(?:export\s+)?(?:const|let|var|function|class|interface|type|enum)\s+([a-zA-Z_$][0-9a-zA-Z_$]*)/g;
  
  const globalCounts = new Map<string, number>();

  // B1: Đếm tần suất xuất hiện của các định danh (identifiers)
  filesData.forEach(f => {
    const matches = [...f.content.matchAll(declRegex)];
    const fileIdentifiers = new Set<string>(); // Tránh đếm trùng trong cùng 1 file
    matches.forEach(m => {
      if (!fileIdentifiers.has(m[1])) {
        fileIdentifiers.add(m[1]);
        globalCounts.set(m[1], (globalCounts.get(m[1]) || 0) + 1);
      }
    });
  });

  // B2: Đổi tên nếu count > 1
  return filesData.map(f => {
    let newContent = f.content;
    const matches = [...f.content.matchAll(declRegex)];
    
    // Lọc ra các biến bị trùng lặp ở file khác
    const conflicts = matches.filter(m => (globalCounts.get(m[1]) || 0) > 1);
    
    // Dùng Set để đảm bảo mỗi biến chỉ xử lý replace 1 lần cho file này
    const processedInFile = new Set<string>();

    conflicts.forEach(m => {
        const originalName = m[1];
        if (processedInFile.has(originalName)) return;
        processedInFile.add(originalName);

        // Tạo hậu tố từ tên file (loại bỏ ký tự lạ)
        const suffix = f.name.replace(/[^a-zA-Z0-9]/g, '_').replace(/_ts$/i, '');
        const newName = `${originalName}_${suffix}`;
        
        // Regex replace whole word (\b) toàn cục (g)
        // Lưu ý: Cách này thay thế cả trong string hoặc comment nếu trùng word, 
        // nhưng là giải pháp tối ưu nhất nếu không dùng AST parser.
        const replaceRegex = new RegExp(`\\b${originalName}\\b`, 'g');
        newContent = newContent.replace(replaceRegex, newName);
    });

    // Thêm header comment để biết code từ file nào
    return `/** SOURCE: ${f.name} **/\n${newContent}`;
  });
};

export const sortFiles = (files: FileItem[], method: SortMethod, customRegex?: string): FileItem[] => {
  const sorted = [...files];
  switch (method) {
    case SortMethod.NAME_ASC:
      sorted.sort((a, b) => a.file.name.localeCompare(b.file.name, undefined, { numeric: true, sensitivity: 'base' }));
      break;
    case SortMethod.NAME_DESC:
      sorted.sort((a, b) => b.file.name.localeCompare(a.file.name, undefined, { numeric: true, sensitivity: 'base' }));
      break;
    case SortMethod.SIZE_ASC:
      sorted.sort((a, b) => a.file.size - b.file.size);
      break;
    case SortMethod.SIZE_DESC:
      sorted.sort((a, b) => b.file.size - a.file.size);
      break;
    case SortMethod.LAST_MODIFIED:
      sorted.sort((a, b) => a.file.lastModified - b.file.lastModified);
      break;
    case SortMethod.CUSTOM_REGEX:
      if (customRegex) {
        try {
          const regex = new RegExp(customRegex);
          sorted.sort((a, b) => {
            const matchA = a.file.name.match(regex);
            const matchB = b.file.name.match(regex);
            
            // Nếu match được group đầu tiên
            const valA = matchA ? matchA[1] || matchA[0] : '';
            const valB = matchB ? matchB[1] || matchB[0] : '';
            
            // Thử so sánh số
            const numA = parseFloat(valA);
            const numB = parseFloat(valB);

            if (!isNaN(numA) && !isNaN(numB)) {
              return numA - numB;
            }
            // So sánh chuỗi
            return valA.localeCompare(valB);
          });
        } catch (e) {
          console.warn("Invalid Regex", e);
        }
      }
      break;
    default:
      break;
  }
  return sorted;
};

export const generateUniqueId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};