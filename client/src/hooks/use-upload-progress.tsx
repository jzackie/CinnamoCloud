import { createContext, useContext, useState, ReactNode } from "react";

interface UploadProgress {
  fileName: string;
  progress: number;
  isComplete: boolean;
}

interface UploadProgressContextType {
  uploads: UploadProgress[];
  addUpload: (fileName: string) => void;
  updateProgress: (fileName: string, progress: number) => void;
  completeUpload: (fileName: string) => void;
  cancelUpload: (fileName: string) => void;
  cancelAllUploads: () => void;
  activeUploads: Map<string, XMLHttpRequest>;
  setActiveUpload: (fileName: string, xhr: XMLHttpRequest) => void;
  removeActiveUpload: (fileName: string) => void;
}

const UploadProgressContext = createContext<UploadProgressContextType | null>(null);

export function UploadProgressProvider({ children }: { children: ReactNode }) {
  const [uploads, setUploads] = useState<UploadProgress[]>([]);
  const [activeUploads, setActiveUploads] = useState<Map<string, XMLHttpRequest>>(new Map());

  const addUpload = (fileName: string) => {
    setUploads(prev => {
      const existing = prev.find(u => u.fileName === fileName);
      if (existing) return prev;
      return [...prev, { fileName, progress: 0, isComplete: false }];
    });
  };

  const updateProgress = (fileName: string, progress: number) => {
    setUploads(prev => 
      prev.map(upload => 
        upload.fileName === fileName 
          ? { ...upload, progress } 
          : upload
      )
    );
  };

  const completeUpload = (fileName: string) => {
    setUploads(prev => 
      prev.map(upload => 
        upload.fileName === fileName 
          ? { ...upload, progress: 100, isComplete: true } 
          : upload
      )
    );
    removeActiveUpload(fileName);
    
    // Remove completed uploads after 3 seconds
    setTimeout(() => {
      setUploads(prev => prev.filter(u => u.fileName !== fileName));
    }, 3000);
  };

  const cancelUpload = (fileName: string) => {
    const xhr = activeUploads.get(fileName);
    if (xhr) {
      xhr.abort();
    }
    removeActiveUpload(fileName);
    setUploads(prev => prev.filter(u => u.fileName !== fileName));
  };

  const cancelAllUploads = () => {
    activeUploads.forEach(xhr => xhr.abort());
    setActiveUploads(new Map());
    setUploads([]);
  };

  const setActiveUpload = (fileName: string, xhr: XMLHttpRequest) => {
    setActiveUploads(prev => new Map(prev).set(fileName, xhr));
  };

  const removeActiveUpload = (fileName: string) => {
    setActiveUploads(prev => {
      const newMap = new Map(prev);
      newMap.delete(fileName);
      return newMap;
    });
  };

  return (
    <UploadProgressContext.Provider value={{
      uploads,
      addUpload,
      updateProgress,
      completeUpload,
      cancelUpload,
      cancelAllUploads,
      activeUploads,
      setActiveUpload,
      removeActiveUpload,
    }}>
      {children}
    </UploadProgressContext.Provider>
  );
}

export function useUploadProgress() {
  const context = useContext(UploadProgressContext);
  if (!context) {
    throw new Error("useUploadProgress must be used within an UploadProgressProvider");
  }
  return context;
}