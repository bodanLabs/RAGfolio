import { useState, useCallback, useMemo } from 'react';
import { AppShell } from '@/components/layout/AppShell';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/ui/empty-state';
import { LoadingSkeleton } from '@/components/ui/loading-skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Upload,
  Search,
  FileText,
  Layers,
  HardDrive,
  MoreVertical,
  Trash2,
  RefreshCw,
  Clock,
  X,
  File,
  Loader2,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import {
  useDocuments,
  useDocumentStats,
  useUploadDocument,
  useDeleteDocument,
  useReprocessDocument,
} from '@/hooks/api/useDocuments';
import { useApiError } from '@/hooks/useApiError';
import type { DocumentStatus } from '@/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

export default function DocumentsPage() {
  const { isAdmin, currentOrganizationId } = useApp();
  const { toast } = useToast();
  const { handleError } = useApiError();

  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'ALL'>(
    'ALL'
  );
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [documentToDelete, setDocumentToDelete] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const orgId = currentOrganizationId ?? 0;

  // Fetch documents with filters
  const {
    data: documentsData,
    isLoading: isLoadingDocuments,
    error: documentsError,
    refetch: refetchDocuments,
  } = useDocuments(orgId, {
    page,
    pageSize: 20,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    search: searchQuery || undefined,
  });

  // Fetch document stats
  const { data: stats, isLoading: isLoadingStats } = useDocumentStats(orgId);

  // Mutations
  const uploadMutation = useUploadDocument(orgId);
  const deleteMutation = useDeleteDocument(orgId);
  const reprocessMutation = useReprocessDocument(orgId);

  const documents = documentsData?.documents ?? [];
  const pagination = documentsData?.pagination;

  // Memoize filtered documents for display
  const displayDocuments = useMemo(() => documents, [documents]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(
      (f) =>
        f.name.endsWith('.txt') ||
        f.name.endsWith('.pdf') ||
        f.name.endsWith('.docx')
    );
    setSelectedFiles((prev) => [...prev, ...files]);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    let successCount = 0;
    let errorCount = 0;

    for (const file of selectedFiles) {
      try {
        await uploadMutation.mutateAsync(file);
        successCount++;
      } catch (error) {
        errorCount++;
        handleError(error, `Failed to upload ${file.name}`);
      }
    }

    if (successCount > 0) {
      toast({
        title: 'Files uploaded',
        description: `${successCount} file(s) uploaded successfully.${errorCount > 0 ? ` ${errorCount} failed.` : ''}`,
      });
    }

    setUploadModalOpen(false);
    setSelectedFiles([]);
  };

  const handleDelete = async () => {
    if (!documentToDelete) return;

    try {
      await deleteMutation.mutateAsync(Number(documentToDelete));
      toast({
        title: 'Document deleted',
        description: 'The document has been removed.',
      });
    } catch (error) {
      handleError(error, 'Failed to delete document');
    } finally {
      setDocumentToDelete(null);
    }
  };

  const handleReprocess = async (docId: string) => {
    try {
      await reprocessMutation.mutateAsync(Number(docId));
      toast({
        title: 'Reprocessing started',
        description: 'The document is being reprocessed.',
      });
    } catch (error) {
      handleError(error, 'Failed to reprocess document');
    }
  };

  // Handle search with debounce effect (reset page on search change)
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };

  // Handle status filter change
  const handleStatusChange = (value: string) => {
    setStatusFilter(value as DocumentStatus | 'ALL');
    setPage(1);
  };

  // Error state
  if (documentsError) {
    return (
      <AppShell>
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
          <PageHeader
            title="Documents"
            description="Manage your organization's knowledge base"
          />
          <EmptyState
            icon="documents"
            title="Failed to load documents"
            description="There was an error loading your documents. Please try again."
            action={
              <Button onClick={() => refetchDocuments()}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </Button>
            }
          />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <PageHeader
          title="Documents"
          description="Manage your organization's knowledge base"
          actions={
            isAdmin && (
              <Button onClick={() => setUploadModalOpen(true)}>
                <Upload className="w-4 h-4 mr-2" />
                Upload files
              </Button>
            )
          }
        />

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total files</p>
                  {isLoadingStats ? (
                    <div className="h-8 w-12 bg-muted animate-pulse rounded" />
                  ) : (
                    <p className="text-2xl font-semibold">
                      {stats?.totalDocuments ?? 0}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Layers className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total chunks</p>
                  {isLoadingStats ? (
                    <div className="h-8 w-12 bg-muted animate-pulse rounded" />
                  ) : (
                    <p className="text-2xl font-semibold">
                      {(stats?.totalChunks ?? 0).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <HardDrive className="w-5 h-5 text-secondary-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Storage used</p>
                  {isLoadingStats ? (
                    <div className="h-8 w-12 bg-muted animate-pulse rounded" />
                  ) : (
                    <p className="text-2xl font-semibold">
                      {formatFileSize(stats?.totalSize ?? 0)}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All statuses</SelectItem>
              <SelectItem value="READY">Ready</SelectItem>
              <SelectItem value="PROCESSING">Processing</SelectItem>
              <SelectItem value="UPLOADED">Uploaded</SelectItem>
              <SelectItem value="FAILED">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Documents Table */}
        {isLoadingDocuments ? (
          <LoadingSkeleton variant="table" count={5} />
        ) : displayDocuments.length === 0 ? (
          <EmptyState
            icon="documents"
            title={
              documents.length === 0 && !searchQuery && statusFilter === 'ALL'
                ? 'No documents yet'
                : 'No matching documents'
            }
            description={
              documents.length === 0 && !searchQuery && statusFilter === 'ALL'
                ? isAdmin
                  ? "Upload files to enable RAG over your organization's knowledge."
                  : 'Ask an admin to upload documents.'
                : 'Try adjusting your search or filters.'
            }
            action={
              documents.length === 0 &&
              !searchQuery &&
              statusFilter === 'ALL' &&
              isAdmin ? (
                <Button onClick={() => setUploadModalOpen(true)}>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload files
                </Button>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>File name</TableHead>
                    <TableHead className="hidden sm:table-cell">Type</TableHead>
                    <TableHead className="hidden md:table-cell">Size</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Uploaded
                    </TableHead>
                    {isAdmin && <TableHead className="w-12"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="font-medium truncate max-w-[200px] sm:max-w-[300px]">
                            {doc.fileName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell uppercase text-xs text-muted-foreground">
                        {doc.fileType}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-muted-foreground">
                        {formatFileSize(doc.fileSize)}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={doc.status} />
                        {doc.status === 'FAILED' && doc.errorMessage && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-destructive">
                            <AlertCircle className="w-3 h-3" />
                            <span className="truncate max-w-[150px]">
                              {doc.errorMessage}
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          {format(new Date(doc.uploadedAt), 'MMM d, yyyy')}
                        </div>
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                              >
                                <MoreVertical className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleReprocess(doc.id)}
                                disabled={reprocessMutation.isPending}
                              >
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Reprocess
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => setDocumentToDelete(doc.id)}
                                className="text-destructive"
                              >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {pagination && pagination.total_pages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {(page - 1) * 20 + 1} to{' '}
                  {Math.min(page * 20, pagination.total)} of {pagination.total}{' '}
                  documents
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!pagination.has_prev}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm">
                    Page {page} of {pagination.total_pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!pagination.has_next}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Upload Modal */}
        <Dialog open={uploadModalOpen} onOpenChange={setUploadModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Upload files</DialogTitle>
              <DialogDescription>
                Upload documents to add them to your organization's knowledge
                base.
              </DialogDescription>
            </DialogHeader>

            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
                isDragging ? 'border-accent bg-accent/5' : 'border-border'
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-foreground mb-1">
                Drag & drop files here, or{' '}
                <label className="text-accent cursor-pointer hover:underline">
                  browse
                  <input
                    type="file"
                    className="hidden"
                    accept=".txt,.pdf,.docx"
                    multiple
                    onChange={handleFileSelect}
                  />
                </label>
              </p>
              <p className="text-xs text-muted-foreground">
                Supports TXT, PDF, DOCX
              </p>
            </div>

            {selectedFiles.length > 0 && (
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {selectedFiles.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2 bg-muted rounded-lg"
                  >
                    <File className="w-4 h-4 text-muted-foreground" />
                    <span className="flex-1 text-sm truncate">{file.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => handleRemoveFile(i)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setUploadModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={selectedFiles.length === 0 || uploadMutation.isPending}
              >
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  `Upload ${selectedFiles.length} file${selectedFiles.length !== 1 ? 's' : ''}`
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog
          open={!!documentToDelete}
          onOpenChange={() => setDocumentToDelete(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete document?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this
                document and remove its chunks from the knowledge base.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AppShell>
  );
}
