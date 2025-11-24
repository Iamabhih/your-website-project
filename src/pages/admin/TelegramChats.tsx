import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Send, MessageCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { AdminLayout } from '@/components/admin/AdminLayout';

interface ChatSession {
  id: string;
  visitor_name: string | null;
  visitor_email: string | null;
  status: string;
  started_at: string;
  telegram_thread_id: string | null;
}

interface Message {
  id: string;
  sender_type: string;
  message_text: string;
  created_at: string;
}

export default function TelegramChats() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    loadSessions();
  }, [isAdmin]);

  useEffect(() => {
    if (selectedSession) {
      loadMessages(selectedSession.id);
      subscribeToMessages(selectedSession.id);
    }
  }, [selectedSession]);

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

    setSessions(data || []);
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
          setMessages((prev) => [...prev, payload.new as Message]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendReply = async () => {
    if (!reply.trim() || !selectedSession) return;

    setLoading(true);
    try {
      // Store admin reply in database
      const { error: insertError } = await supabase
        .from('chat_messages')
        .insert({
          session_id: selectedSession.id,
          sender_type: 'admin',
          message_text: reply,
        });

      if (insertError) throw insertError;

      // Send to Telegram via webhook
      await supabase.functions.invoke('telegram-webhook', {
        body: {
          message: {
            text: reply,
            chat: { id: parseInt(selectedSession.telegram_thread_id || '0') },
            message_thread_id: parseInt(selectedSession.telegram_thread_id || '0'),
          },
        },
      });

      setReply('');
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

  return (
    <AdminLayout>
      <Button
        variant="ghost"
        onClick={() => navigate('/admin')}
        className="mb-6"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Admin
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sessions List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Chat Sessions</CardTitle>
            <CardDescription>All customer conversations</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[600px]">
              <div className="space-y-2">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => setSelectedSession(session)}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedSession?.id === session.id
                        ? 'bg-primary/10 border-primary'
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">
                        {session.visitor_name || 'Anonymous'}
                      </span>
                      <Badge variant={session.status === 'active' ? 'default' : 'secondary'}>
                        {session.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {session.visitor_email || 'No email'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(session.started_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat View */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5" />
                  {selectedSession ? selectedSession.visitor_name || 'Anonymous' : 'Select a chat'}
                </CardTitle>
                {selectedSession && (
                  <CardDescription>{selectedSession.visitor_email}</CardDescription>
                )}
              </div>
              {selectedSession && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateSessionStatus(selectedSession.id, 'active')}
                  >
                    Mark Active
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateSessionStatus(selectedSession.id, 'closed')}
                  >
                    Close
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {selectedSession ? (
              <>
                <ScrollArea className="h-[450px] mb-4">
                  <div className="space-y-4 pr-4">
                    {messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${
                          msg.sender_type === 'admin' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[80%] rounded-lg p-3 ${
                            msg.sender_type === 'admin'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{msg.message_text}</p>
                          <span className="text-xs opacity-70 mt-1 block">
                            {new Date(msg.created_at).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your reply..."
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendReply();
                      }
                    }}
                    rows={3}
                  />
                  <Button
                    onClick={sendReply}
                    disabled={loading || !reply.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-[500px] text-muted-foreground">
                Select a chat session to view messages
              </div>
          )}
        </CardContent>
      </Card>
    </div>
    </AdminLayout>
  );
}
