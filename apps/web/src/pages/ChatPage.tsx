import { useState, useRef, useEffect } from 'react';
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
import { ChatSession, ChatMessage } from '@/types';
import { mockChatSessions, mockChatMessages, mockLLMSettings } from '@/data/mockData';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';

export default function ChatPage() {
  const { isAdmin } = useApp();
  const [sessions, setSessions] = useState<ChatSession[]>(mockChatSessions);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(mockChatSessions[0]?.id || null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [mobileSessionsOpen, setMobileSessionsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const hasApiKey = mockLLMSettings.keyStatus === 'SET';

  useEffect(() => {
    if (activeSessionId) {
      setMessages(mockChatMessages[activeSessionId] || []);
    }
  }, [activeSessionId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNewChat = () => {
    const newSession: ChatSession = {
      id: `cs-${Date.now()}`,
      title: 'New Chat',
      createdDate: new Date().toISOString(),
      lastUpdatedDate: new Date().toISOString(),
      messageCount: 0,
    };
    setSessions([newSession, ...sessions]);
    setActiveSessionId(newSession.id);
    setMessages([]);
    setMobileSessionsOpen(false);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || !activeSessionId || isSending) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsSending(true);
    setIsTyping(true);

    // Simulate AI response
    await new Promise((r) => setTimeout(r, 1500));

    const assistantMessage: ChatMessage = {
      id: `msg-${Date.now() + 1}`,
      role: 'assistant',
      content: "I'll help you with that. Based on the documents in your organization, here's what I found:\n\nThis is a simulated response. In a real implementation, this would be the AI-generated answer based on your organization's documents using RAG (Retrieval-Augmented Generation).",
      timestamp: new Date().toISOString(),
    };

    setIsTyping(false);
    setMessages((prev) => [...prev, assistantMessage]);
    setIsSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleDeleteSession = () => {
    if (sessionToDelete) {
      setSessions((prev) => prev.filter((s) => s.id !== sessionToDelete));
      if (activeSessionId === sessionToDelete) {
        const remaining = sessions.filter((s) => s.id !== sessionToDelete);
        setActiveSessionId(remaining[0]?.id || null);
      }
      setSessionToDelete(null);
    }
  };

  const handleRenameSession = (id: string) => {
    if (editTitle.trim()) {
      setSessions((prev) =>
        prev.map((s) => (s.id === id ? { ...s, title: editTitle.trim() } : s))
      );
    }
    setEditingSession(null);
    setEditTitle('');
  };

  const SessionsList = () => (
    <div className="flex flex-col h-full">
      <div className="p-4 space-y-3">
        <Button onClick={handleNewChat} className="w-full" size="sm">
          <Plus className="w-4 h-4 mr-2" />
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
        {filteredSessions.length === 0 ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            No chats found
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
                      onBlur={() => handleRenameSession(session.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleRenameSession(session.id);
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
                        {formatDistanceToNow(new Date(session.lastUpdatedDate), { addSuffix: true })}
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
                    {sessions.find((s) => s.id === activeSessionId)?.title || 'Select a chat'}
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
            {!activeSessionId || messages.length === 0 ? (
              <EmptyState
                icon="chat"
                title="Start your first chat"
                description="Ask questions and get answers from your organization's documents using AI."
                action={
                  <Button onClick={handleNewChat}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Chat
                  </Button>
                }
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
                  disabled={!hasApiKey || isSending}
                  className="pr-12 h-12"
                />
                <Button
                  size="icon"
                  className="absolute right-1.5 h-9 w-9"
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || !hasApiKey || isSending}
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
            <AlertDialogAction onClick={handleDeleteSession} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppShell>
  );
}
