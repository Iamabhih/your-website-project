import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  ArrowLeft, Send, MessageCircle, Search, Filter, MoreVertical,
  Star, StarOff, User, Clock, CheckCheck, AlertCircle, Archive,
  Trash2, Tag, Download, RefreshCw, Volume2, VolumeX, Phone, Mail,
  Flag, UserCheck, Loader2, BarChart3, TrendingUp, MessageSquare,
  XCircle, CheckCircle, Users, Calendar
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { cn } from '@/lib/utils';

interface ChatSession {
  id: string;
  visitor_name: string | null;
  visitor_email: string | null;
  visitor_phone?: string | null;
  status: string;
  started_at: string;
  ended_at?: string | null;
  telegram_thread_id: string | null;
  category?: string | null;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string | null;
  tags?: string[];
  is_starred?: boolean;
  rating?: number;
  rating_feedback?: string;
  unread_count?: number;
  last_message?: string;
  last_message_at?: string;
}

interface Message {
  id: string;
  sender_type: string;
  message_text: string;
  created_at: string;
  is_read?: boolean;
  attachment_url?: string;
  attachment_type?: string;
}

interface CannedResponse {
  id: string;
  title: string;
  message: string;
  category: string;
}

interface ChatStats {
  totalChats: number;
  activeChats: number;
  closedChats: number;
  avgResponseTime: number;
  avgRating: number;
  todayChats: number;
}

const PRIORITY_COLORS = {
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-blue-100 text-blue-800',
  high: 'bg-orange-100 text-orange-800',
  urgent: 'bg-red-100 text-red-800',
};

const DEFAULT_CANNED_RESPONSES: CannedResponse[] = [
  { id: '1', title: 'Greeting', message: 'Hello! Thank you for contacting us. How can I help you today?', category: 'general' },
  { id: '2', title: 'Order Status', message: 'I can help you with your order status. Could you please provide your order number?', category: 'orders' },
  { id: '3', title: 'Processing Time', message: 'Orders typically take 1-2 business days to process before shipping.', category: 'orders' },
  { id: '4', title: 'Return Policy', message: 'We offer a 30-day return policy for unused items in original packaging. Would you like me to start a return for you?', category: 'returns' },
  { id: '5', title: 'Shipping Info', message: 'We ship via standard and express delivery. Standard takes 5-7 days, express 2-3 days.', category: 'shipping' },
  { id: '6', title: 'Out of Stock', message: 'I apologize, but this item is currently out of stock. Would you like to be notified when it\'s back?', category: 'products' },
  { id: '7', title: 'Thank You', message: 'Thank you for your patience. Is there anything else I can help you with?', category: 'general' },
  { id: '8', title: 'Closing', message: 'Thank you for chatting with us today! Feel free to reach out if you have any other questions. Have a great day!', category: 'general' },
];

export default function TelegramChats() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin, user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [showCannedResponses, setShowCannedResponses] = useState(false);
  const [cannedResponses] = useState<CannedResponse[]>(DEFAULT_CANNED_RESPONSES);
  const [isTyping, setIsTyping] = useState(false);
  const [visitorTyping, setVisitorTyping] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showStatsDialog, setShowStatsDialog] = useState(false);
  const [stats, setStats] = useState<ChatStats | null>(null);
  const [showCustomerInfo, setShowCustomerInfo] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    audioRef.current = new Audio('/notification.mp3');
    loadSessions();
    loadStats();
    subscribeToNewSessions();
  }, [isAdmin]);

  useEffect(() => {
    if (selectedSession) {
      loadMessages(selectedSession.id);
      const unsubscribe = subscribeToMessages(selectedSession.id);
      subscribeToTyping(selectedSession.id);
      markAsRead(selectedSession.id);
      return () => unsubscribe?.();
    }
  }, [selectedSession]);

  useEffect(() => {
    filterSessions();
  }, [sessions, searchQuery, statusFilter, priorityFilter]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadStats = async () => {
    try {
      const { data: allSessions } = await supabase
        .from('chat_sessions')
        .select('*');

      if (allSessions) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const activeChats = allSessions.filter(s => s.status === 'active').length;
        const closedChats = allSessions.filter(s => s.status === 'closed').length;
        const todayChats = allSessions.filter(s => new Date(s.started_at) >= today).length;
        const ratings = allSessions.filter(s => s.rating).map(s => s.rating as number);
        const avgRating = ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0;

        setStats({
          totalChats: allSessions.length,
          activeChats,
          closedChats,
          avgResponseTime: 5, // Would need message timestamps to calculate properly
          avgRating,
          todayChats,
        });
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadSessions = async () => {
    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .order('started_at', { ascending: false });

    if (error) {
      console.error('Error loading sessions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load chat sessions',
        variant: 'destructive',
      });
      return;
    }

    setSessions((data || []) as ChatSession[]);
  };

  const filterSessions = () => {
    let filtered = [...sessions];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.visitor_name?.toLowerCase().includes(query) ||
        s.visitor_email?.toLowerCase().includes(query) ||
        s.visitor_phone?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter);
    }

    // Priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(s => s.priority === priorityFilter);
    }

    // Sort: starred first, then by date
    filtered.sort((a, b) => {
      if (a.is_starred && !b.is_starred) return -1;
      if (!a.is_starred && b.is_starred) return 1;
      return new Date(b.started_at).getTime() - new Date(a.started_at).getTime();
    });

    setFilteredSessions(filtered);
  };

  const subscribeToNewSessions = () => {
    const channel = supabase
      .channel('new-sessions')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_sessions',
        },
        (payload) => {
          setSessions(prev => [payload.new as ChatSession, ...prev]);
          if (soundEnabled && audioRef.current) {
            audioRef.current.play().catch(() => {});
          }
          toast({
            title: 'New chat',
            description: `${payload.new.visitor_name || 'Anonymous'} started a chat`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadMessages = async (sessionId: string) => {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error loading messages:', error);
      return;
    }

    setMessages(data || []);
  };

  const subscribeToMessages = (sessionId: string) => {
    const channel = supabase
      .channel(`admin-chat:${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, newMsg]);

          if (newMsg.sender_type === 'visitor' && soundEnabled && audioRef.current) {
            audioRef.current.play().catch(() => {});
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const subscribeToTyping = (sessionId: string) => {
    const channel = supabase
      .channel(`typing:${sessionId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload?.sender === 'visitor') {
          setVisitorTyping(true);
          setTimeout(() => setVisitorTyping(false), 3000);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const broadcastTyping = useCallback(() => {
    if (!selectedSession) return;

    supabase.channel(`typing:${selectedSession.id}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: { sender: 'admin' }
    });
  }, [selectedSession]);

  const handleReplyChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setReply(e.target.value);

    if (!isTyping) {
      setIsTyping(true);
      broadcastTyping();
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  };

  const markAsRead = async (sessionId: string) => {
    await supabase
      .from('chat_messages')
      .update({ is_read: true })
      .eq('session_id', sessionId)
      .eq('sender_type', 'visitor')
      .eq('is_read', false);
  };

  const sendReply = async (messageText?: string) => {
    const text = messageText || reply;
    if (!text.trim() || !selectedSession) return;

    setLoading(true);
    try {
      const { error: insertError } = await supabase
        .from('chat_messages')
        .insert({
          session_id: selectedSession.id,
          sender_type: 'admin',
          message_text: text,
        });

      if (insertError) throw insertError;

      // Send to Telegram via webhook
      if (selectedSession.telegram_thread_id) {
        await supabase.functions.invoke('telegram-webhook', {
          body: {
            message: {
              text: text,
              chat: { id: parseInt(selectedSession.telegram_thread_id || '0') },
              message_thread_id: parseInt(selectedSession.telegram_thread_id || '0'),
            },
          },
        });
      }

      setReply('');
      setShowCannedResponses(false);
      toast({
        title: 'Reply sent',
        description: 'Your message has been sent',
      });
    } catch (error) {
      console.error('Error sending reply:', error);
      toast({
        title: 'Error',
        description: 'Failed to send reply',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateSessionStatus = async (sessionId: string, status: string) => {
    const { error } = await supabase
      .from('chat_sessions')
      .update({ status, ended_at: status === 'closed' ? new Date().toISOString() : null })
      .eq('id', sessionId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update session status',
        variant: 'destructive',
      });
      return;
    }

    loadSessions();
    toast({
      title: 'Status updated',
      description: `Session marked as ${status}`,
    });
  };

  const updateSessionPriority = async (sessionId: string, priority: string) => {
    const { error } = await supabase
      .from('chat_sessions')
      .update({ priority })
      .eq('id', sessionId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to update priority',
        variant: 'destructive',
      });
      return;
    }

    setSessions(prev => prev.map(s =>
      s.id === sessionId ? { ...s, priority: priority as any } : s
    ));
    if (selectedSession?.id === sessionId) {
      setSelectedSession(prev => prev ? { ...prev, priority: priority as any } : null);
    }
  };

  const toggleStar = async (sessionId: string) => {
    const session = sessions.find(s => s.id === sessionId);
    const { error } = await supabase
      .from('chat_sessions')
      .update({ is_starred: !session?.is_starred })
      .eq('id', sessionId);

    if (!error) {
      setSessions(prev => prev.map(s =>
        s.id === sessionId ? { ...s, is_starred: !s.is_starred } : s
      ));
    }
  };

  const addTag = async () => {
    if (!selectedSession || !newTag.trim()) return;

    const currentTags = selectedSession.tags || [];
    if (currentTags.includes(newTag.trim())) {
      setNewTag('');
      return;
    }

    const { error } = await supabase
      .from('chat_sessions')
      .update({ tags: [...currentTags, newTag.trim()] })
      .eq('id', selectedSession.id);

    if (!error) {
      setSelectedSession(prev => prev ? {
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      } : null);
      setSessions(prev => prev.map(s =>
        s.id === selectedSession.id ? { ...s, tags: [...(s.tags || []), newTag.trim()] } : s
      ));
    }
    setNewTag('');
    setShowTagDialog(false);
  };

  const removeTag = async (tag: string) => {
    if (!selectedSession) return;

    const newTags = (selectedSession.tags || []).filter(t => t !== tag);
    const { error } = await supabase
      .from('chat_sessions')
      .update({ tags: newTags })
      .eq('id', selectedSession.id);

    if (!error) {
      setSelectedSession(prev => prev ? { ...prev, tags: newTags } : null);
      setSessions(prev => prev.map(s =>
        s.id === selectedSession.id ? { ...s, tags: newTags } : s
      ));
    }
  };

  const bulkUpdateStatus = async (status: string) => {
    if (selectedSessions.length === 0) return;

    const { error } = await supabase
      .from('chat_sessions')
      .update({ status, ended_at: status === 'closed' ? new Date().toISOString() : null })
      .in('id', selectedSessions);

    if (!error) {
      loadSessions();
      setSelectedSessions([]);
      toast({
        title: 'Sessions updated',
        description: `${selectedSessions.length} sessions marked as ${status}`,
      });
    }
  };

  const bulkDelete = async () => {
    if (selectedSessions.length === 0) return;

    // Delete messages first
    await supabase
      .from('chat_messages')
      .delete()
      .in('session_id', selectedSessions);

    // Delete sessions
    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .in('id', selectedSessions);

    if (!error) {
      loadSessions();
      setSelectedSessions([]);
      setShowDeleteDialog(false);
      toast({
        title: 'Sessions deleted',
        description: `${selectedSessions.length} sessions deleted`,
      });
    }
  };

  const exportChat = () => {
    if (!selectedSession || messages.length === 0) return;

    const chatText = messages.map(msg => {
      const time = new Date(msg.created_at).toLocaleString();
      const sender = msg.sender_type === 'admin' ? 'Support' : selectedSession.visitor_name || 'Visitor';
      return `[${time}] ${sender}: ${msg.message_text}`;
    }).join('\n');

    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${selectedSession.id.slice(0, 8)}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success/10 text-success';
      case 'waiting': return 'bg-yellow-100 text-yellow-800';
      case 'closed': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryLabel = (category?: string | null) => {
    const categories: Record<string, string> = {
      order: 'Order Issues',
      shipping: 'Shipping',
      returns: 'Returns',
      product: 'Products',
      payment: 'Payment',
      account: 'Account',
      other: 'Other',
    };
    return category ? categories[category] || category : null;
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/admin')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Chat Support</h1>
            <p className="text-muted-foreground">Manage customer conversations</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setSoundEnabled(!soundEnabled)}
              >
                {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {soundEnabled ? 'Mute notifications' : 'Enable notifications'}
            </TooltipContent>
          </Tooltip>
          <Button
            variant="outline"
            onClick={() => setShowStatsDialog(true)}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Stats
          </Button>
          <Button
            variant="outline"
            onClick={() => { loadSessions(); loadStats(); }}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sessions List */}
        <Card className="lg:col-span-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Conversations</CardTitle>
              {selectedSessions.length > 0 && (
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => bulkUpdateStatus('closed')}
                  >
                    <Archive className="h-3 w-3 mr-1" />
                    Close
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>
            {/* Search and Filters */}
            <div className="space-y-2 pt-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="waiting">Waiting</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priority</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              <div className="p-2 space-y-1">
                {filteredSessions.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
                    <p>No conversations found</p>
                  </div>
                ) : (
                  filteredSessions.map((session) => (
                    <div
                      key={session.id}
                      className={cn(
                        "p-3 rounded-lg border cursor-pointer transition-colors relative group",
                        selectedSession?.id === session.id
                          ? 'bg-primary/10 border-primary'
                          : 'hover:bg-muted'
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <Checkbox
                          checked={selectedSessions.includes(session.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedSessions(prev => [...prev, session.id]);
                            } else {
                              setSelectedSessions(prev => prev.filter(id => id !== session.id));
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div
                          className="flex-1 min-w-0"
                          onClick={() => setSelectedSession(session)}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium truncate">
                                {session.visitor_name || 'Anonymous'}
                              </span>
                              {session.is_starred && (
                                <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              {session.priority && (
                                <Badge variant="secondary" className={cn("text-xs", PRIORITY_COLORS[session.priority])}>
                                  {session.priority}
                                </Badge>
                              )}
                              <Badge variant="secondary" className={cn("text-xs", getStatusColor(session.status))}>
                                {session.status}
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {session.visitor_email || 'No email'}
                          </p>
                          {getCategoryLabel(session.category) && (
                            <Badge variant="outline" className="mt-1 text-xs">
                              {getCategoryLabel(session.category)}
                            </Badge>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(session.started_at).toLocaleString()}
                          </p>
                          {session.tags && session.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {session.tags.map(tag => (
                                <Badge key={tag} variant="outline" className="text-xs h-5">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 opacity-0 group-hover:opacity-100"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => toggleStar(session.id)}>
                              {session.is_starred ? (
                                <><StarOff className="h-4 w-4 mr-2" /> Unstar</>
                              ) : (
                                <><Star className="h-4 w-4 mr-2" /> Star</>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => updateSessionPriority(session.id, 'urgent')}>
                              <Flag className="h-4 w-4 mr-2 text-red-500" /> Mark Urgent
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateSessionPriority(session.id, 'high')}>
                              <Flag className="h-4 w-4 mr-2 text-orange-500" /> Mark High
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => updateSessionPriority(session.id, 'low')}>
                              <Flag className="h-4 w-4 mr-2 text-gray-400" /> Mark Low
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => updateSessionStatus(session.id, 'closed')}>
                              <Archive className="h-4 w-4 mr-2" /> Close
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat View */}
        <Card className="lg:col-span-8">
          {selectedSession ? (
            <>
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        {selectedSession.visitor_name || 'Anonymous'}
                        {selectedSession.is_starred && (
                          <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {selectedSession.visitor_email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {selectedSession.visitor_email}
                          </span>
                        )}
                        {selectedSession.visitor_phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {selectedSession.visitor_phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCustomerInfo(!showCustomerInfo)}
                    >
                      <User className="h-4 w-4 mr-1" />
                      Info
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedSession(selectedSession);
                        setShowTagDialog(true);
                      }}
                    >
                      <Tag className="h-4 w-4 mr-1" />
                      Tag
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={exportChat}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                    <Select
                      value={selectedSession.status}
                      onValueChange={(value) => updateSessionStatus(selectedSession.id, value)}
                    >
                      <SelectTrigger className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="waiting">Waiting</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>

              <div className="flex">
                <div className={cn("flex-1 flex flex-col", showCustomerInfo ? "lg:border-r" : "")}>
                  {/* Messages */}
                  <ScrollArea className="flex-1 h-[400px]" ref={scrollRef}>
                    <div className="p-4 space-y-4">
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${
                            msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={cn(
                              "max-w-[80%] rounded-lg p-3",
                              msg.sender_type === 'admin'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            )}
                          >
                            {msg.attachment_url && msg.attachment_type === 'image' && (
                              <img
                                src={msg.attachment_url}
                                alt="Attachment"
                                className="max-w-full rounded mb-2 cursor-pointer"
                                onClick={() => window.open(msg.attachment_url, '_blank')}
                              />
                            )}
                            <p className="text-sm whitespace-pre-wrap">{msg.message_text}</p>
                            <div className="flex items-center justify-end gap-1 mt-1">
                              <span className="text-xs opacity-70">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {msg.sender_type === 'admin' && (
                                <CheckCheck className={cn(
                                  "h-3 w-3 opacity-70",
                                  msg.is_read && "text-blue-400"
                                )} />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Visitor typing indicator */}
                      {visitorTyping && (
                        <div className="flex justify-start">
                          <div className="bg-muted rounded-lg p-3">
                            <div className="flex gap-1">
                              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                              <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </ScrollArea>

                  {/* Canned Responses */}
                  {showCannedResponses && (
                    <div className="border-t p-3">
                      <Tabs defaultValue="general">
                        <TabsList className="h-8">
                          <TabsTrigger value="general" className="text-xs">General</TabsTrigger>
                          <TabsTrigger value="orders" className="text-xs">Orders</TabsTrigger>
                          <TabsTrigger value="shipping" className="text-xs">Shipping</TabsTrigger>
                          <TabsTrigger value="returns" className="text-xs">Returns</TabsTrigger>
                        </TabsList>
                        {['general', 'orders', 'shipping', 'returns'].map(cat => (
                          <TabsContent key={cat} value={cat} className="mt-2">
                            <div className="grid grid-cols-2 gap-2">
                              {cannedResponses
                                .filter(r => r.category === cat)
                                .map(response => (
                                  <Button
                                    key={response.id}
                                    variant="outline"
                                    size="sm"
                                    className="justify-start text-xs h-auto py-2"
                                    onClick={() => sendReply(response.message)}
                                  >
                                    {response.title}
                                  </Button>
                                ))
                              }
                            </div>
                          </TabsContent>
                        ))}
                      </Tabs>
                    </div>
                  )}

                  {/* Input */}
                  <div className="p-4 border-t space-y-2">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowCannedResponses(!showCannedResponses)}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                      <Textarea
                        placeholder="Type your reply..."
                        value={reply}
                        onChange={handleReplyChange}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            sendReply();
                          }
                        }}
                        rows={2}
                        className="flex-1"
                      />
                      <Button
                        onClick={() => sendReply()}
                        disabled={loading || !reply.trim()}
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Customer Info Sidebar */}
                {showCustomerInfo && (
                  <div className="w-64 p-4 hidden lg:block">
                    <h4 className="font-semibold mb-4">Customer Info</h4>
                    <div className="space-y-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Name</p>
                        <p className="font-medium">{selectedSession.visitor_name || 'Anonymous'}</p>
                      </div>
                      {selectedSession.visitor_email && (
                        <div>
                          <p className="text-muted-foreground">Email</p>
                          <p className="font-medium">{selectedSession.visitor_email}</p>
                        </div>
                      )}
                      {selectedSession.visitor_phone && (
                        <div>
                          <p className="text-muted-foreground">Phone</p>
                          <p className="font-medium">{selectedSession.visitor_phone}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-muted-foreground">Category</p>
                        <p className="font-medium">{getCategoryLabel(selectedSession.category) || 'Not specified'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Started</p>
                        <p className="font-medium">{new Date(selectedSession.started_at).toLocaleString()}</p>
                      </div>
                      {selectedSession.ended_at && (
                        <div>
                          <p className="text-muted-foreground">Ended</p>
                          <p className="font-medium">{new Date(selectedSession.ended_at).toLocaleString()}</p>
                        </div>
                      )}
                      {selectedSession.rating && (
                        <div>
                          <p className="text-muted-foreground">Rating</p>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(star => (
                              <Star
                                key={star}
                                className={cn(
                                  "h-4 w-4",
                                  star <= selectedSession.rating!
                                    ? "text-yellow-500 fill-yellow-500"
                                    : "text-gray-300"
                                )}
                              />
                            ))}
                          </div>
                          {selectedSession.rating_feedback && (
                            <p className="text-xs text-muted-foreground mt-1">
                              "{selectedSession.rating_feedback}"
                            </p>
                          )}
                        </div>
                      )}
                      <div>
                        <p className="text-muted-foreground mb-2">Tags</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedSession.tags?.map(tag => (
                            <Badge
                              key={tag}
                              variant="secondary"
                              className="cursor-pointer"
                              onClick={() => removeTag(tag)}
                            >
                              {tag}
                              <XCircle className="h-3 w-3 ml-1" />
                            </Badge>
                          ))}
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-xs"
                            onClick={() => setShowTagDialog(true)}
                          >
                            + Add
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[600px] text-muted-foreground">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 mx-auto mb-4 opacity-20" />
                <p className="text-lg font-medium">Select a conversation</p>
                <p className="text-sm">Choose a chat from the list to view messages</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Add Tag Dialog */}
      <Dialog open={showTagDialog} onOpenChange={setShowTagDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Tag</DialogTitle>
            <DialogDescription>
              Add a tag to categorize this conversation
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Enter tag name"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTag()}
            />
            <div className="flex flex-wrap gap-2">
              {['VIP', 'Follow-up', 'Complaint', 'Refund', 'Technical', 'Sales'].map(tag => (
                <Button
                  key={tag}
                  variant="outline"
                  size="sm"
                  onClick={() => setNewTag(tag)}
                >
                  {tag}
                </Button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTagDialog(false)}>Cancel</Button>
            <Button onClick={addTag} disabled={!newTag.trim()}>Add Tag</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Selected Chats</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedSessions.length} chat(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={bulkDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Stats Dialog */}
      <Dialog open={showStatsDialog} onOpenChange={setShowStatsDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Chat Statistics</DialogTitle>
            <DialogDescription>
              Overview of your chat support performance
            </DialogDescription>
          </DialogHeader>
          {stats && (
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalChats}</p>
                    <p className="text-sm text-muted-foreground">Total Chats</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-success/10 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.activeChats}</p>
                    <p className="text-sm text-muted-foreground">Active</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <Archive className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.closedChats}</p>
                    <p className="text-sm text-muted-foreground">Closed</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.todayChats}</p>
                    <p className="text-sm text-muted-foreground">Today</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4 col-span-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Star className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.avgRating.toFixed(1)}/5</p>
                    <p className="text-sm text-muted-foreground">Average Rating</p>
                  </div>
                  <div className="ml-auto flex">
                    {[1, 2, 3, 4, 5].map(star => (
                      <Star
                        key={star}
                        className={cn(
                          "h-5 w-5",
                          star <= Math.round(stats.avgRating)
                            ? "text-yellow-500 fill-yellow-500"
                            : "text-gray-300"
                        )}
                      />
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
