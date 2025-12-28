import { cn } from '@/lib/utils';
import { DocumentStatus } from '@/types';

interface StatusBadgeProps {
  status: DocumentStatus;
  className?: string;
}

const statusConfig: Record<DocumentStatus, { label: string; className: string }> = {
  UPLOADED: {
    label: 'Uploaded',
    className: 'bg-status-uploaded/15 text-status-uploaded border-status-uploaded/30',
  },
  PROCESSING: {
    label: 'Processing',
    className: 'bg-status-processing/15 text-status-processing border-status-processing/30',
  },
  READY: {
    label: 'Ready',
    className: 'bg-status-ready/15 text-status-ready border-status-ready/30',
  },
  FAILED: {
    label: 'Failed',
    className: 'bg-status-failed/15 text-status-failed border-status-failed/30',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border',
        config.className,
        className
      )}
    >
      {status === 'PROCESSING' && (
        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
      )}
      {config.label}
    </span>
  );
}
