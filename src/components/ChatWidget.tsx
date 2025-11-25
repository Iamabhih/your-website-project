import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageCircle, X, Send, Paperclip, ImageIcon, Smile,
  Clock, CheckCheck, Volume2, VolumeX, Minimize2, Maximize2,
  Star, ThumbsUp, ThumbsDown, HelpCircle, MessageSquare,
  RefreshCw, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  sender_type: string;
  message_text: string;
  created_at: string;
  attachment_url?: string;
  attachment_type?: string;
  is_read?: boolean;
}

interface QuickReply {
  id: string;
  label: string;
  message: string;
}

const QUICK_REPLIES: QuickReply[] = [
  { id: '1', label: '📦 Order Status', message: 'I would like to check my order status' },
  { id: '2', label: '🚚 Shipping Info', message: 'I have a question about shipping' },
  { id: '3', label: '↩️ Returns', message: 'I need help with a return' },
  { id: '4', label: '💳 Payment', message: 'I have a payment question' },
  { id: '5', label: '🛒 Products', message: 'I need help choosing a product' },
];

const ISSUE_CATEGORIES = [
  { value: 'order', label: 'Order Issues' },
  { value: 'shipping', label: 'Shipping & Delivery' },
  { value: 'returns', label: 'Returns & Refunds' },
  { value: 'product', label: 'Product Questions' },
  { value: 'payment', label: 'Payment & Billing' },
  { value: 'account', label: 'Account Help' },
  { value: 'other', label: 'Other' },
];

const CHAT_SESSION_KEY = 'chat-session';
const CHAT_SOUND_KEY = 'chat-sound-enabled';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [issueCategory, setIssueCategory] = useState('');
  const [initialMessage, setInitialMessage] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [adminTyping, setAdminTyping] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [waitTime, setWaitTime] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachmentPreview, setAttachmentPreview] = useState<string | null>(null);
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  // Initialize audio and load saved settings
  useEffect(() => {
    try {
      audioRef.current = new Audio('/notification.mp3');
      audioRef.current.load();
    } catch (e) {
      console.warn('Failed to load notification sound:', e);
    }
    const savedSound = localStorage.getItem(CHAT_SOUND_KEY);
    if (savedSound !== null) {
      setSoundEnabled(savedSound === 'true');
    }

    // Restore session
    const savedSession = localStorage.getItem(CHAT_SESSION_KEY);
    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        if (session.sessionId && session.visitorName) {
          setSessionId(session.sessionId);
          setVisitorName(session.visitorName);
          setVisitorEmail(session.visitorEmail || '');
          setIsStarted(true);
        }
      } catch (e) {
        console.error('Failed to restore chat session:', e);
      }
    }

    // Check online status
    checkOnlineStatus();
    const interval = setInterval(checkOnlineStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  // Load messages and subscribe when session is set
  useEffect(() => {
    if (sessionId) {
      loadMessages();
      const unsubscribe = subscribeToMessages();
      subscribeToTyping();
      return () => unsubscribe?.();
    }
  }, [sessionId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current && !isMinimized) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isMinimized]);

  // Reset unread count when chat is opened
  useEffect(() => {
    if (isOpen && !isMinimized) {
      setUnreadCount(0);
    }
  }, [isOpen, isMinimized]);

  const checkOnlineStatus = async () => {
    try {
      // Check if support is online (business hours or active admin)
      const now = new Date();
      const hour = now.getHours();
      // Support available 9 AM - 6 PM (configurable)
      const isBusinessHours = hour >= 9 && hour < 18;
      setIsOnline(isBusinessHours);

      // Estimate wait time based on active sessions
      if (isBusinessHours) {
        const { count } = await supabase
          .from('chat_sessions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        // Estimate 5 min per active session
        setWaitTime(count ? Math.max(1, count * 2) : 1);
      }
    } catch (e) {
      console.error('Failed to check online status:', e);
    }
  };

  const loadMessages = async () => {
    if (!sessionId) return;

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

  const subscribeToMessages = () => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`chat:${sessionId}`)
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

          // Play sound for admin messages
          if (newMsg.sender_type === 'admin' && soundEnabled && audioRef.current) {
            audioRef.current.play().catch(() => {});
          }

          // Increment unread if minimized or closed
          if (newMsg.sender_type === 'admin' && (isMinimized || !isOpen)) {
            setUnreadCount(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const subscribeToTyping = () => {
    if (!sessionId) return;

    const channel = supabase
      .channel(`typing:${sessionId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload?.sender === 'admin') {
          setAdminTyping(true);
          setTimeout(() => setAdminTyping(false), 3000);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const broadcastTyping = useCallback(() => {
    if (!sessionId) return;

    supabase.channel(`typing:${sessionId}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: { sender: 'visitor' }
    });
  }, [sessionId]);

  const handleMessageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);

    // Broadcast typing indicator
    if (!isTyping) {
      setIsTyping(true);
      broadcastTyping();
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing indicator
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  };

  const startChat = async () => {
    if (!visitorName.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter your name to start chatting',
        variant: 'destructive',
      });
      return;
    }

    if (!issueCategory) {
      toast({
        title: 'Category required',
        description: 'Please select what you need help with',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const categoryLabel = ISSUE_CATEGORIES.find(c => c.value === issueCategory)?.label || issueCategory;
      const fullMessage = initialMessage.trim()
        ? `[${categoryLabel}] ${initialMessage}`
        : `[${categoryLabel}] Hi, I need help!`;

      const { data, error } = await supabase.functions.invoke('send-to-telegram', {
        body: {
          message: fullMessage,
          visitorName,
          visitorEmail: visitorEmail || undefined,
          visitorPhone: visitorPhone || undefined,
          category: issueCategory,
        },
      });

      if (error) throw error;

      // Save session to localStorage
      const sessionData = {
        sessionId: data.sessionId,
        visitorName,
        visitorEmail,
      };
      localStorage.setItem(CHAT_SESSION_KEY, JSON.stringify(sessionData));

      setSessionId(data.sessionId);
      setIsStarted(true);
      toast({
        title: 'Chat started',
        description: isOnline
          ? `Estimated wait time: ~${waitTime || 2} minutes`
          : 'Our team will respond as soon as possible',
      });
    } catch (error) {
      console.error('Error starting chat:', error);
      toast({
        title: 'Error',
        description: 'Failed to start chat. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (messageText?: string) => {
    const text = messageText || newMessage;
    if (!text.trim() || !sessionId) return;

    setLoading(true);
    try {
      const body: any = {
        sessionId,
        message: text,
        visitorName,
        visitorEmail,
      };

      // Handle file attachment
      if (attachmentFile) {
        const formData = new FormData();
        formData.append('file', attachmentFile);

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('chat-attachments')
          .upload(`${sessionId}/${Date.now()}-${attachmentFile.name}`, attachmentFile);

        if (!uploadError && uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from('chat-attachments')
            .getPublicUrl(uploadData.path);

          body.attachmentUrl = publicUrl;
          body.attachmentType = attachmentFile.type.startsWith('image/') ? 'image' : 'file';
        }
      }

      const { error } = await supabase.functions.invoke('send-to-telegram', {
        body,
      });

      if (error) throw error;

      setNewMessage('');
      setAttachmentFile(null);
      setAttachmentPreview(null);
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: 'Failed to send message. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleQuickReply = (reply: QuickReply) => {
    sendMessage(reply.message);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select a file under 5MB',
        variant: 'destructive',
      });
      return;
    }

    setAttachmentFile(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAttachmentPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setAttachmentPreview(null);
    }
  };

  const removeAttachment = () => {
    setAttachmentFile(null);
    setAttachmentPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleSound = () => {
    const newValue = !soundEnabled;
    setSoundEnabled(newValue);
    localStorage.setItem(CHAT_SOUND_KEY, String(newValue));
  };

  const endChat = () => {
    setShowRatingDialog(true);
  };

  const submitRating = async () => {
    if (sessionId && rating > 0) {
      try {
        await supabase.from('chat_sessions').update({
          rating,
          rating_feedback: ratingFeedback,
          status: 'closed',
          ended_at: new Date().toISOString(),
        }).eq('id', sessionId);
      } catch (e) {
        console.error('Failed to submit rating:', e);
      }
    }

    // Clear session
    localStorage.removeItem(CHAT_SESSION_KEY);
    setShowRatingDialog(false);
    setSessionId(null);
    setIsStarted(false);
    setMessages([]);
    setRating(0);
    setRatingFeedback('');
    setVisitorName('');
    setVisitorEmail('');
    setVisitorPhone('');
    setIssueCategory('');
    setInitialMessage('');

    toast({
      title: 'Thank you!',
      description: 'Your feedback helps us improve',
    });
  };

  const addEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  const commonEmojis = ['👍', '👋', '😊', '🙏', '❤️', '✅', '🎉', '💯'];

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg z-50"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
              variant="destructive"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className={cn(
          "fixed bottom-6 right-6 shadow-2xl z-50 flex flex-col transition-all duration-300",
          isMinimized ? "w-80 h-14" : "w-96 h-[600px]"
        )}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground rounded-t-lg">
            <div className="flex items-center gap-2">
              <div className="relative">
                <MessageCircle className="h-5 w-5" />
                <span className={cn(
                  "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-primary",
                  isOnline ? "bg-success" : "bg-gray-400"
                )} />
              </div>
              <div>
                <h3 className="font-semibold text-sm">Live Support</h3>
                {!isMinimized && (
                  <p className="text-xs opacity-80">
                    {isOnline ? 'We typically reply in minutes' : 'Leave a message'}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {isStarted && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleSound}
                      className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                    >
                      {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {soundEnabled ? 'Mute notifications' : 'Enable notifications'}
                  </TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                  >
                    {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isMinimized ? 'Expand' : 'Minimize'}
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Close</TooltipContent>
              </Tooltip>
            </div>
          </div>

          {/* Content */}
          {!isMinimized && (
            <>
              {!isStarted ? (
                <ScrollArea className="flex-1">
                  <div className="p-6 space-y-4">
                    {/* Online status banner */}
                    {!isOnline && (
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm">
                        <p className="font-medium text-amber-800">We're currently offline</p>
                        <p className="text-amber-700 text-xs mt-1">
                          Leave a message and we'll get back to you soon!
                        </p>
                      </div>
                    )}

                    <div>
                      <h4 className="font-semibold mb-2">Start a conversation</h4>
                      <p className="text-sm text-muted-foreground mb-4">
                        Fill in your details and we'll connect you with our team
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Input
                        placeholder="Your name *"
                        value={visitorName}
                        onChange={(e) => setVisitorName(e.target.value)}
                      />
                      <Input
                        type="email"
                        placeholder="Your email (optional)"
                        value={visitorEmail}
                        onChange={(e) => setVisitorEmail(e.target.value)}
                      />
                      <Input
                        type="tel"
                        placeholder="Phone number (optional)"
                        value={visitorPhone}
                        onChange={(e) => setVisitorPhone(e.target.value)}
                      />
                      <Select value={issueCategory} onValueChange={setIssueCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="What do you need help with? *" />
                        </SelectTrigger>
                        <SelectContent>
                          {ISSUE_CATEGORIES.map((cat) => (
                            <SelectItem key={cat.value} value={cat.value}>
                              {cat.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Textarea
                        placeholder="Briefly describe your issue (optional)"
                        value={initialMessage}
                        onChange={(e) => setInitialMessage(e.target.value)}
                        rows={3}
                      />

                      {isOnline && waitTime && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>Estimated wait: ~{waitTime} min</span>
                        </div>
                      )}

                      <Button
                        onClick={startChat}
                        disabled={loading}
                        className="w-full"
                      >
                        {loading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Starting...
                          </>
                        ) : (
                          'Start Chat'
                        )}
                      </Button>
                    </div>

                    {/* Quick help links */}
                    <div className="border-t pt-4 mt-4">
                      <p className="text-xs text-muted-foreground mb-2">Quick help</p>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" className="text-xs h-7">
                          <HelpCircle className="h-3 w-3 mr-1" />
                          FAQ
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs h-7">
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Contact Us
                        </Button>
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              ) : (
                <>
                  {/* Messages */}
                  <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                    <div className="space-y-4">
                      {/* Welcome message */}
                      {messages.length === 0 && (
                        <div className="text-center text-sm text-muted-foreground py-8">
                          <MessageCircle className="h-12 w-12 mx-auto mb-2 opacity-20" />
                          <p>Chat started! Our team will respond shortly.</p>
                        </div>
                      )}

                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${
                            msg.sender_type === 'visitor' ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={cn(
                              "max-w-[80%] rounded-lg p-3",
                              msg.sender_type === 'visitor'
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
                            {msg.attachment_url && msg.attachment_type === 'file' && (
                              <a
                                href={msg.attachment_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm underline mb-2"
                              >
                                <Paperclip className="h-4 w-4" />
                                View attachment
                              </a>
                            )}
                            <p className="text-sm whitespace-pre-wrap">{msg.message_text}</p>
                            <div className="flex items-center justify-end gap-1 mt-1">
                              <span className="text-xs opacity-70">
                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {msg.sender_type === 'visitor' && (
                                <CheckCheck className={cn(
                                  "h-3 w-3 opacity-70",
                                  msg.is_read && "text-blue-400"
                                )} />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                      {/* Typing indicator */}
                      {adminTyping && (
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

                  {/* Quick Replies */}
                  {messages.length < 3 && (
                    <div className="px-4 pb-2">
                      <p className="text-xs text-muted-foreground mb-2">Quick replies:</p>
                      <div className="flex flex-wrap gap-1">
                        {QUICK_REPLIES.slice(0, 3).map((reply) => (
                          <Button
                            key={reply.id}
                            variant="outline"
                            size="sm"
                            className="text-xs h-7"
                            onClick={() => handleQuickReply(reply)}
                          >
                            {reply.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Attachment Preview */}
                  {attachmentFile && (
                    <div className="px-4 pb-2">
                      <div className="flex items-center gap-2 bg-muted rounded-lg p-2">
                        {attachmentPreview ? (
                          <img src={attachmentPreview} alt="Preview" className="h-12 w-12 object-cover rounded" />
                        ) : (
                          <Paperclip className="h-4 w-4" />
                        )}
                        <span className="text-sm flex-1 truncate">{attachmentFile.name}</span>
                        <Button variant="ghost" size="sm" onClick={removeAttachment}>
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Input */}
                  <div className="p-4 border-t space-y-2">
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Input
                          placeholder="Type your message..."
                          value={newMessage}
                          onChange={handleMessageChange}
                          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                          disabled={loading}
                          className="pr-20"
                        />
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                          <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept="image/*,.pdf,.doc,.docx"
                            onChange={handleFileSelect}
                          />
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={() => fileInputRef.current?.click()}
                              >
                                <Paperclip className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Attach file</TooltipContent>
                          </Tooltip>
                          <div className="relative">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                >
                                  <Smile className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Add emoji</TooltipContent>
                            </Tooltip>
                            {showEmojiPicker && (
                              <div className="absolute bottom-full right-0 mb-2 bg-white border rounded-lg shadow-lg p-2 flex gap-1">
                                {commonEmojis.map((emoji) => (
                                  <button
                                    key={emoji}
                                    className="text-lg hover:bg-muted rounded p-1"
                                    onClick={() => addEmoji(emoji)}
                                  >
                                    {emoji}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      <Button
                        onClick={() => sendMessage()}
                        disabled={loading || (!newMessage.trim() && !attachmentFile)}
                        size="icon"
                      >
                        {loading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                      </Button>
                    </div>

                    {/* End chat button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-muted-foreground"
                      onClick={endChat}
                    >
                      End chat & rate experience
                    </Button>
                  </div>
                </>
              )}
            </>
          )}
        </Card>
      )}

      {/* Rating Dialog */}
      <Dialog open={showRatingDialog} onOpenChange={setShowRatingDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Rate your experience</DialogTitle>
            <DialogDescription>
              How was your chat experience today?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={cn(
                    "p-2 rounded-full transition-colors",
                    rating >= star ? "text-yellow-400" : "text-gray-300"
                  )}
                >
                  <Star className={cn("h-8 w-8", rating >= star && "fill-current")} />
                </button>
              ))}
            </div>
            <div className="flex justify-center gap-4">
              <Button
                variant={rating === 1 ? "default" : "outline"}
                size="sm"
                onClick={() => setRating(1)}
              >
                <ThumbsDown className="h-4 w-4 mr-1" />
                Not helpful
              </Button>
              <Button
                variant={rating === 5 ? "default" : "outline"}
                size="sm"
                onClick={() => setRating(5)}
              >
                <ThumbsUp className="h-4 w-4 mr-1" />
                Very helpful
              </Button>
            </div>
            <Textarea
              placeholder="Any additional feedback? (optional)"
              value={ratingFeedback}
              onChange={(e) => setRatingFeedback(e.target.value)}
              rows={3}
            />
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => {
                setShowRatingDialog(false);
                localStorage.removeItem(CHAT_SESSION_KEY);
                setSessionId(null);
                setIsStarted(false);
                setMessages([]);
              }}>
                Skip
              </Button>
              <Button className="flex-1" onClick={submitRating}>
                Submit & Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
