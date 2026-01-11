import { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { EmptyState } from '@/components/ui/empty-state';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  Plus,
  Search,
  Send,
  MoreVertical,
  Pencil,
  Trash2,
  MessageSquare,
  Loader2,
  AlertTriangle,
  FileText,
  ChevronDown,
  Settings
} from 'lucide-react';
import {
  useChatSessions,
  useChatMessages,
  useCreateChatSession,
  useUpdateChatSession,
  useDeleteChatSession,
  useSendMessage,
} from '@/hooks/api/useChat';
import { useActiveLLMKey } from '@/hooks/api/useLLMKeys';
import { useApiError } from '@/hooks/useApiError';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

export default function ChatPage() {
  const { isAdmin, currentOrganizationId } = useApp();
  const { handleError } = useApiError();

  const orgId = currentOrganizationId ?? 0;

  // Chat sessions and messages
  const { data: sessions = [], isLoading: isLoadingSessions } = useChatSessions(orgId);
  const createSessionMutation = useCreateChatSession(orgId);
  const updateSessionMutation = useUpdateChatSession(orgId);
  const deleteSessionMutation = useDeleteChatSession(orgId);

  // LLM key status
  const { data: activeLLMKey, isLoading: isLoadingKey } = useActiveLLMKey(orgId);
  const hasApiKey = activeLLMKey !== undefined;

  // Local UI state
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [mobileSessionsOpen, setMobileSessionsOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get numeric session ID for API calls
  const numericSessionId = activeSessionId ? Number(activeSessionId) : 0;

  // Messages for active session
  const { data: messages = [], isLoading: isLoadingMessages } = useChatMessages(orgId, numericSessionId);
  const sendMessageMutation = useSendMessage(orgId, numericSessionId);

  // Auto-select first session when sessions load
  useEffect(() => {
    if (sessions.length > 0 && !activeSessionId) {
      setActiveSessionId(sessions[0].id);
    }
  }, [sessions, activeSessionId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Filter sessions by search query
  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNewChat = useCallback(async () => {
    try {
      const newSession = await createSessionMutation.mutateAsync('New Chat');
      setActiveSessionId(String(newSession.id));
      setMobileSessionsOpen(false);
    } catch (error) {
      handleError(error, 'creating new chat');
    }
  }, [createSessionMutation, handleError]);

  const handleSendMessage = useCallback(async () => {
    if (!inputValue.trim() || !activeSessionId || sendMessageMutation.isPending) return;

    const content = inputValue.trim();
    setInputValue('');
    setIsTyping(true);

    try {
      await sendMessageMutation.mutateAsync(content);
    } catch (error) {
      handleError(error, 'sending message');
    } finally {
      setIsTyping(false);
    }
  }, [inputValue, activeSessionId, sendMessageMutation, handleError]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSendMessage();
    }
  };

  const handleDeleteSession = useCallback(async () => {
    if (!sessionToDelete) return;

    try {
      await deleteSessionMutation.mutateAsync(Number(sessionToDelete));

      // If we deleted the active session, select another
      if (activeSessionId === sessionToDelete) {
        const remaining = sessions.filter((s) => s.id !== sessionToDelete);
        setActiveSessionId(remaining[0]?.id ?? null);
      }
    } catch (error) {
      handleError(error, 'deleting chat');
    } finally {
      setSessionToDelete(null);
    }
  }, [sessionToDelete, activeSessionId, sessions, deleteSessionMutation, handleError]);

  const handleRenameSession = useCallback(async (id: string) => {
    if (!editTitle.trim()) {
      setEditingSession(null);
      setEditTitle('');
      return;
    }

    try {
      await updateSessionMutation.mutateAsync({
        sessionId: Number(id),
        title: editTitle.trim(),
      });
    } catch (error) {
      handleError(error, 'renaming chat');
    } finally {
      setEditingSession(null);
      setEditTitle('');
    }
  }, [editTitle, updateSessionMutation, handleError]);

  const isSending = sendMessageMutation.isPending;

  const SessionsList = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 space-y-3">
        <Button
          onClick={handleNewChat}
          className="w-full"
          size="sm"
          disabled={createSessionMutation.isPending}
        >
          {createSessionMutation.isPending ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Plus className="w-4 h-4 mr-2" />
          )}
          New Chat
        </Button>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 px-2">
        {isLoadingSessions ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            {sessions.length === 0 ? 'No chats yet' : 'No chats found'}
          </div>
        ) : (
          <div className="space-y-1 pb-4">
            {filteredSessions.map((session) => (
              <div
                key={session.id}
                className={cn(
                  'group flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-colors',
                  activeSessionId === session.id
                    ? 'bg-accent/10 text-foreground'
                    : 'hover:bg-muted text-muted-foreground hover:text-foreground'
                )}
                onClick={() => {
                  setActiveSessionId(session.id);
                  setMobileSessionsOpen(false);
                }}
              >
                <MessageSquare className="w-4 h-4 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  {editingSession === session.id ? (
                    <Input
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onBlur={() => void handleRenameSession(session.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') void handleRenameSession(session.id);
                        if (e.key === 'Escape') setEditingSession(null);
                      }}
                      className="h-6 text-sm"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <>
                      <p className="text-sm font-medium truncate">{session.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(session.updatedAt), { addSuffix: true })}
                      </p>
                    </>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 opacity-0 group-hover:opacity-100"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditTitle(session.title);
                        setEditingSession(session.id);
                      }}
                    >
                      <Pencil className="w-4 h-4 mr-2" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.stopPropagation();
                        setSessionToDelete(session.id);
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  const isLoading = isLoadingSessions || isLoadingKey;

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-[calc(100vh-3.5rem)]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Desktop Sessions Panel */}
        <div className="hidden md:flex w-72 border-r bg-card flex-col">
          <SessionsList />
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* API Key Warning Banner */}
          {!hasApiKey && (
            <div className="bg-status-processing/10 border-b border-status-processing/20 px-4 py-3 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-status-processing flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  LLM key not configured for this organization
                </p>
                <p className="text-xs text-muted-foreground">
                  {isAdmin ? 'Configure your OpenAI API key in Settings.' : 'Contact an admin to configure the API key.'}
                </p>
              </div>
              {isAdmin && (
                <Button asChild size="sm" variant="outline">
                  <Link to="/settings">
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Link>
                </Button>
              )}
            </div>
          )}

          {/* Mobile Sessions Trigger */}
          <div className="md:hidden p-3 border-b">
            <Sheet open={mobileSessionsOpen} onOpenChange={setMobileSessionsOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-between">
                  <span className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    {sessions.find((s) => s.id === activeSessionId)?.title ?? 'Select a chat'}
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <SheetHeader className="sr-only">
                  <SheetTitle>Chat Sessions</SheetTitle>
                </SheetHeader>
                <SessionsList />
              </SheetContent>
            </Sheet>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1">
            {!activeSessionId ? (
              <EmptyState
                icon="chat"
                title="Start your first chat"
                description="Ask questions and get answers from your organization's documents using AI."
                action={
                  <Button onClick={handleNewChat} disabled={createSessionMutation.isPending}>
                    {createSessionMutation.isPending ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    New Chat
                  </Button>
                }
                className="h-full"
              />
            ) : isLoadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <EmptyState
                icon="chat"
                title="Start the conversation"
                description="Type a message below to start chatting with your documents."
                className="h-full"
              />
            ) : (
              <div className="max-w-3xl mx-auto p-4 space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      'flex animate-slide-up',
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    )}
                  >
                    <div
                      className={cn(
                        'max-w-[85%] rounded-2xl px-4 py-3',
                        msg.role === 'user'
                          ? 'bg-chat-user text-chat-user-foreground rounded-br-md'
                          : 'bg-chat-assistant text-chat-assistant-foreground rounded-bl-md'
                      )}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-current/10">
                          <p className="text-xs font-medium mb-2 opacity-70">Sources</p>
                          <div className="space-y-1">
                            {msg.sources.map((source, i) => (
                              <div
                                key={i}
                                className="flex items-center gap-2 text-xs opacity-70"
                              >
                                <FileText className="w-3 h-3" />
                                {source.fileName}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start animate-fade-in">
                    <div className="bg-chat-assistant rounded-2xl rounded-bl-md px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                        <span className="w-2 h-2 rounded-full bg-current animate-pulse" style={{ animationDelay: '0.2s' }} />
                        <span className="w-2 h-2 rounded-full bg-current animate-pulse" style={{ animationDelay: '0.4s' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
          </ScrollArea>

          {/* Input */}
          <div className="border-t bg-card p-4">
            <div className="max-w-3xl mx-auto">
              <div className="relative flex items-center gap-2">
                <Input
                  placeholder={hasApiKey ? "Ask a question..." : "API key required to chat"}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={!hasApiKey || isSending || !activeSessionId}
                  className="pr-12 h-12"
                />
                <Button
                  size="icon"
                  className="absolute right-1.5 h-9 w-9"
                  onClick={() => void handleSendMessage()}
                  disabled={!inputValue.trim() || !hasApiKey || isSending || !activeSessionId}
                >
                  {isSending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Shift + Enter for new line • Enter to send
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!sessionToDelete} onOpenChange={() => setSessionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete chat session?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this chat session and all its messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => void handleDeleteSession()}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteSessionMutation.isPending}
            >
              {deleteSessionMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
