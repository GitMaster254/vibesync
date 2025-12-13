/**
 * Responsive FolderManager — desktop & mobile friendly
 * Mobile: uses 3-dot dropdown for actions
 */

import React, { useState, useEffect } from 'react';
import { 
  FolderOpen, 
  RefreshCw, 
  MoreVertical, 
  Trash2, 
  Music,
  Scan,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import { getHandles, removeHandle } from '@/lib/storageService';
import { ImportProgress } from '@/lib/importWithProgress';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';

interface FolderManagerProps {
  onTracksUpdate: () => void;
  importProgress: ImportProgress;
  setImportProgress: React.Dispatch<React.SetStateAction<ImportProgress>>;
  onTracksUpload: () => void;
}

interface FolderStats {
  trackCount: number;
  lastScanned?: Date;
  totalSize?: number;
}

const FolderManager: React.FC<FolderManagerProps> = ({
  onTracksUpdate,
}) => {
  const [folders, setFolders] = useState<FileSystemDirectoryHandle[]>([]);
  const [folderStats, setFolderStats] = useState<Map<string, FolderStats>>(new Map());
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState<string | null>(null);

  useEffect(() => {
    const loadFolders = async () => {
      try {
        const persistedHandles = await getHandles();
        setFolders(persistedHandles);
        // Load initial stats for each folder
        loadFolderStats(persistedHandles);
      } catch (error) {
        console.error('Failed to load folders:', error);
        toast.error('Failed to load saved folders');
      } finally {
        setLoading(false);
      }
    };
    loadFolders();
  }, []);

  const loadFolderStats = async (folderHandles: FileSystemDirectoryHandle[]) => {
    const stats = new Map<string, FolderStats>();
    
    // For now, set default stats. In a real app, you'd calculate these from your database
    folderHandles.forEach(handle => {
      stats.set(handle.name, {
        trackCount: 0, // You would query your DB for tracks from this folder
        lastScanned: new Date(),
        totalSize: 0
      });
    });
    
    setFolderStats(stats);
  };

  const handleRemoveFolder = async (folderHandle: FileSystemDirectoryHandle) => {
    try {
      await removeHandle(folderHandle.name);
      setFolders(prev => prev.filter(f => f.name !== folderHandle.name));
      toast.success(`Folder "${folderHandle.name}" removed`);
    } catch (error) {
      console.error('Failed to remove folder:', error);
      toast.error('Failed to remove folder');
    }
  };

  const handleScanFolder = async (folderHandle: FileSystemDirectoryHandle) => {
    setScanning(folderHandle.name);
    try {
      // Simulate scanning process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Update folder stats
      setFolderStats(prev => {
        const newStats = new Map(prev);
        newStats.set(folderHandle.name, {
          trackCount: Math.floor(Math.random() * 50) + 10, // Mock data
          lastScanned: new Date(),
          totalSize: Math.floor(Math.random() * 1000000000) + 100000000 // Mock data
        });
        return newStats;
      });
      
      toast.success(`Scanned folder "${folderHandle.name}"`);
      onTracksUpdate();
    } catch (error) {
      console.error('Failed to scan folder:', error);
      toast.error('Failed to scan folder');
    } finally {
      setScanning(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
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
        <div>
          <h2 className="text-xl sm:text-2xl font-bold">Music Folders</h2>
        </div>
      </div>

      {/* Empty state */}
      {folders.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/20 py-12 px-4 text-center">
          <FolderOpen className="mb-4 h-16 w-16 text-muted-foreground" />
          <h3 className="mb-2 text-lg font-semibold">No folders added yet</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            Add music folders to automatically import and organize your audio files
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {folders.map((folderHandle) => {
            const stats = folderStats.get(folderHandle.name);
            const isScanning = scanning === folderHandle.name;

            return (
              <div
                key={folderHandle.name}
                className="group relative flex flex-col p-4 border border-border rounded-xl bg-card/80 shadow-sm hover:shadow-md transition-all duration-200"
              >
                {/* Folder Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <FolderOpen className="h-10 w-10 text-primary flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm sm:text-base truncate" title={folderHandle.name}>
                        {folderHandle.name}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
                        File System Folder
                      </p>
                    </div>
                  </div>
                  
                  {/* Actions Dropdown */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 flex-shrink-0 opacity-70 hover:opacity-100"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={() => handleScanFolder(folderHandle)}
                        disabled={isScanning}
                        className="flex items-center gap-2"
                      >
                        <Scan className="h-4 w-4" />
                        {isScanning ? 'Scanning...' : 'Scan for new files'}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleRemoveFolder(folderHandle)}
                        className="flex items-center gap-2 text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove Folder
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Folder Stats */}
                {stats && (
                  <div className="space-y-2 mt-2 pt-3 border-t border-border">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Music className="h-3 w-3" />
                        <span>Tracks</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {stats.trackCount}
                      </Badge>
                    </div>
                    
                    {stats.totalSize && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Size</span>
                        <span className="font-medium">{formatFileSize(stats.totalSize)}</span>
                      </div>
                    )}
                    
                    {stats.lastScanned && (
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          <span>Last scanned</span>
                        </div>
                        <span className="font-medium">{formatDate(stats.lastScanned)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Scanning Overlay */}
                {isScanning && (
                  <div className="absolute inset-0 bg-background/80 rounded-xl flex items-center justify-center">
                    <div className="flex items-center gap-2 text-sm">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Scanning...</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FolderManager;