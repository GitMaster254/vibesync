/**
 * Responsive FolderManager — desktop & mobile friendly
 * Mobile: uses 3-dot dropdown for actions
 */

import React, { useState, useEffect } from 'react';
import { FolderOpen, RefreshCw, Trash2, Plus, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { getHandles, removeHandle } from '@/lib/storageService';
import { selectAndScanFolder, reScanFolder, type ScanResult } from '@/lib/scannerService';
import { ImportProgress } from '@/lib/importWithProgress';

interface FolderManagerProps {
  onTracksUpdate: () => void;
  importProgress: ImportProgress;
  setImportProgress: React.Dispatch<React.SetStateAction<ImportProgress>>;
  onTracksUpload: () => void;
}

const FolderManager: React.FC<FolderManagerProps> = ({
  onTracksUpdate,
}) => {
  const [folders, setFolders] = useState<FileSystemDirectoryHandle[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState<string | null>(null);

  useEffect(() => {
    const loadFolders = async () => {
      try {
        const persistedHandles = await getHandles();
        setFolders(persistedHandles);
      } catch (error) {
        console.error('Failed to load folders:', error);
        toast.error('Failed to load saved folders');
      } finally {
        setLoading(false);
      }
    };
    loadFolders();
  }, []);

  const handleAddFolder = async () => {
    setLoading(true);
    try {
      const result: ScanResult | null = await selectAndScanFolder(
        (progress: ImportProgress) => {
          if (progress.errors && progress.errors.length > 0) {
            progress.errors.forEach(err => toast.warning(`${err.fileName}: ${err.error}`));
          }
        },
        () => {
          onTracksUpdate();
          toast.success('Folder scanned and tracks imported');
        }
      );

      if (result) setFolders(prev => [...prev, result.handle]);
    } catch (error) {
      console.error('Failed to add folder:', error);
      toast.error((error as Error).message || 'Failed to add folder');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="mt-2 text-muted-foreground text-sm">Loading folders...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-2 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <h2 className="text-xl sm:text-2xl font-bold">Music Folders</h2>
        <Button
          onClick={handleAddFolder}
          disabled={loading}
          className="flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Plus className="h-4 w-4" />
          Add Folder
        </Button>
      </div>

      {/* Empty state */}
      {folders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 py-12 px-4 text-center">
          <FolderOpen className="mb-4 h-16 w-16 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No folders added yet</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {folders.map((folderHandle) => (
            <div
              key={folderHandle.name}
              className="flex items-center justify-between p-4 border border-border rounded-xl bg-card/80 shadow-sm gap-3"
            >
              <div className="flex items-center gap-3">
                <FolderOpen className="h-9 w-9 text-primary" />
                <div>
                  <p className="font-medium text-sm sm:text-base">{folderHandle.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FolderManager;
