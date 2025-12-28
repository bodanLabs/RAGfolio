import { cn } from '@/lib/utils';
import { ReactNode } from 'react';
import { FileText, MessageSquare, Users, FolderOpen } from 'lucide-react';

interface EmptyStateProps {
  icon?: 'documents' | 'chat' | 'members' | 'files';
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

const icons = {
  documents: FileText,
  chat: MessageSquare,
  members: Users,
  files: FolderOpen,
};

export function EmptyState({ icon = 'files', title, description, action, className }: EmptyStateProps) {
  const Icon = icons[icon];
  
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 px-4 text-center', className)}>
      <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      {action}
    </div>
  );
}
