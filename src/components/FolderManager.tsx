/**
 * FolderManager component for managing music folders in the Library.
 * Displays persisted folders, allows adding new ones, and re-scanning existing ones.
 */

import React, { useState, useEffect } from 'react';
import { FolderOpen, RefreshCw, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { getHandles, removeHandle } from '@/lib/storageService';
import { selectAndScanFolder, reScanFolder, type ScanResult } from '@/lib/scannerService';
import { ImportProgress } from '@/lib/importWithProgress';

interface FolderManagerProps {
  onTracksUpdate: () => void; // Callback to refresh tracks after import
  importProgress: ImportProgress;
  setImportProgress: React.Dispatch<React.SetStateAction<ImportProgress>>;
  onTracksUpload: () => void;
}

const FolderManager: React.FC<FolderManagerProps> = ({ onTracksUpdate, importProgress, setImportProgress, onTracksUpload }) => {
  const [folders, setFolders] = useState<FileSystemDirectoryHandle[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState<string | null>(null); // Track which folder is being scanned

  // Load persisted folders on mount
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
          // Handle progress updates if needed (could show a progress bar here)
          if (progress.errors && progress.errors.length > 0) {
            progress.errors.forEach(err => toast.warning(`${err.fileName}: ${err.error}`));
          }
        },
        () => {
          onTracksUpdate(); // Refresh tracks after import
          toast.success('Folder scanned and tracks imported');
        }
      );

      if (result) {
        setFolders(prev => [...prev, result.handle]);
      }
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
          // Handle progress updates
          if (progress.errors && progress.errors.length > 0) {
            progress.errors.forEach(err => toast.warning(`${err.fileName}: ${err.error}`));
          }
        },
        () => {
          onTracksUpdate(); // Refresh tracks after re-scan
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
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading folders...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Music Folders</h2>
          {/* <p className="text-sm text-muted-foreground">
            Manage folders for automatic music discovery and import
          </p> */}
        </div>
        <Button
          onClick={handleAddFolder}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Folder
        </Button>
      </div>

      {folders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 py-12">
          <FolderOpen className="mb-4 h-16 w-16 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No folders added yet</h3>
          {/* <p className="mb-4 text-sm text-muted-foreground text-center max-w-md">
            Add music folders to automatically scan and import audio files.
            Requires a Chromium-based browser (Chrome, Edge) for persistent access.
          </p> */}
          <Button onClick={handleAddFolder} variant="default">
            <Plus className="mr-2 h-4 w-4" />
            Add Your First Folder
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1 md:grid-cols-2">
          {folders.map((folderHandle) => (
            <div
              key={folderHandle.name}
              className="flex items-center justify-between p-4 border border-border rounded-lg bg-card"
            >
              <div className="flex items-center gap-3">
                <FolderOpen className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-medium">{folderHandle.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Persistent folder access granted
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRescan(folderHandle)}
                  disabled={scanning === folderHandle.name}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${scanning === folderHandle.name ? 'animate-spin' : ''}`} />
                  {scanning === folderHandle.name ? 'Scanning...' : 'Rescan'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleRemoveFolder(folderHandle)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="text-xs text-muted-foreground">
        {/* <p>
          <strong>Browser Support:</strong> Persistent folder access requires Chromium-based browsers
          (Chrome, Edge, Opera). In unsupported browsers, use the file/folder import in the Tracks tab instead.
        </p> */}
      </div>
    </div>
  );
};

export default FolderManager;
