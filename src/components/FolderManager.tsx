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
  importProgress,
  setImportProgress,
  onTracksUpload
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

  const handleRescan = async (handle: FileSystemDirectoryHandle) => {
    setScanning(handle.name);
    try {
      await reScanFolder(
        handle,
        (progress: ImportProgress) => {
          if (progress.errors && progress.errors.length > 0) {
            progress.errors.forEach(err => toast.warning(`${err.fileName}: ${err.error}`));
          }
        },
        () => {
          onTracksUpdate();
          toast.success(`Re-scanned "${handle.name}" and updated tracks`);
        }
      );
    } catch (error) {
      console.error('Failed to re-scan folder:', error);
      toast.error((error as Error).message || 'Failed to re-scan folder');
    } finally {
      setScanning(null);
    }
  };

  const handleRemoveFolder = async (handle: FileSystemDirectoryHandle) => {
    try {
      await removeHandle(handle.name);
      setFolders(prev => prev.filter(f => f.name !== handle.name));
      toast.success(`Removed "${handle.name}" from library`);
    } catch (error) {
      console.error('Failed to remove folder:', error);
      toast.error('Failed to remove folder');
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
          <Button onClick={handleAddFolder} className="mt-2">
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Folder
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {folders.map((folderHandle) => (
            <div
              key={folderHandle.name}
              className="flex items-center justify-between p-4 border border-border rounded-xl bg-card/80 shadow-sm gap-3"
            >
              <div className="flex items-center gap-3">
                <FolderOpen className="h-7 w-7 text-primary" />
                <div>
                  <p className="font-medium text-sm sm:text-base">{folderHandle.name}</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Persistent access granted
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="hidden sm:flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRescan(folderHandle)}
                  disabled={scanning === folderHandle.name}
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-1 ${
                      scanning === folderHandle.name ? 'animate-spin' : ''
                    }`}
                  />
                  {scanning === folderHandle.name ? 'Scanning' : 'Rescan'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveFolder(folderHandle)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>

              {/* Mobile 3-dot menu */}
              <div className="sm:hidden">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-32">
                    <DropdownMenuItem
                      onClick={() => handleRescan(folderHandle)}
                      disabled={scanning === folderHandle.name}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      {scanning === folderHandle.name ? 'Scanning' : 'Rescan'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleRemoveFolder(folderHandle)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FolderManager;
