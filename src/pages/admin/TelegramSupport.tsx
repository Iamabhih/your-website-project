import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MessageSquare, Clock, CheckCircle, XCircle } from "lucide-react";

interface SupportMessage {
  id: string;
  chat_id: string;
  username: string | null;
  message_text: string;
  status: string;
  admin_reply: string | null;
  replied_at: string | null;
  created_at: string;
}

export default function TelegramSupport() {
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState<{ [key: string]: string }>({});
  const [sendingReply, setSendingReply] = useState<{ [key: string]: boolean }>({});
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    loadMessages();
    subscribeToMessages();
  }, []);

  const subscribeToMessages = () => {
    const channel = supabase
      .channel("telegram_support_messages")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "telegram_support_messages",
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("telegram_support_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error loading messages:", error);
      toast.error("Failed to load support messages");
    } finally {
      setLoading(false);
    }
  };

  const sendReply = async (messageId: string, chatId: string) => {
    const reply = replyText[messageId];
    if (!reply?.trim()) {
      toast.error("Please enter a reply");
      return;
    }

    setSendingReply({ ...sendingReply, [messageId]: true });

    try {
      // Send message via Telegram
      const { error: functionError } = await supabase.functions.invoke(
        "send-to-telegram",
        {
          body: {
            event: "admin_reply",
            chatId: chatId,
            message: reply,
          },
        }
      );

      if (functionError) throw functionError;

      // Update database
      const { error: updateError } = await supabase
        .from("telegram_support_messages")
        .update({
          status: "replied",
          admin_reply: reply,
          replied_at: new Date().toISOString(),
        })
        .eq("id", messageId);

      if (updateError) throw updateError;

      toast.success("Reply sent successfully");
      setReplyText({ ...replyText, [messageId]: "" });
      loadMessages();
    } catch (error) {
      console.error("Error sending reply:", error);
      toast.error("Failed to send reply");
    } finally {
      setSendingReply({ ...sendingReply, [messageId]: false });
    }
  };

  const markAsResolved = async (messageId: string) => {
    try {
      const { error } = await supabase
        .from("telegram_support_messages")
        .update({ status: "resolved" })
        .eq("id", messageId);

      if (error) throw error;
      toast.success("Marked as resolved");
      loadMessages();
    } catch (error) {
      console.error("Error updating status:", error);
      toast.error("Failed to update status");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Pending</Badge>;
      case "replied":
        return <Badge variant="default"><MessageSquare className="w-3 h-3 mr-1" /> Replied</Badge>;
      case "resolved":
        return <Badge variant="outline"><CheckCircle className="w-3 h-3 mr-1" /> Resolved</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const filteredMessages = messages.filter((msg) => {
    if (filter === "all") return true;
    return msg.status === filter;
  });

  const stats = {
    pending: messages.filter((m) => m.status === "pending").length,
    replied: messages.filter((m) => m.status === "replied").length,
    resolved: messages.filter((m) => m.status === "resolved").length,
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Telegram Support Messages</h1>
          <p className="text-muted-foreground">Manage and respond to customer support inquiries</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="cursor-pointer" onClick={() => setFilter("pending")}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                  <p className="text-2xl font-bold">{stats.pending}</p>
                </div>
                <Clock className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer" onClick={() => setFilter("replied")}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Replied</p>
                  <p className="text-2xl font-bold">{stats.replied}</p>
                </div>
                <MessageSquare className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer" onClick={() => setFilter("resolved")}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Resolved</p>
                  <p className="text-2xl font-bold">{stats.resolved}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-2">
          <Button
            variant={filter === "all" ? "default" : "outline"}
            onClick={() => setFilter("all")}
          >
            All
          </Button>
          <Button
            variant={filter === "pending" ? "default" : "outline"}
            onClick={() => setFilter("pending")}
          >
            Pending
          </Button>
          <Button
            variant={filter === "replied" ? "default" : "outline"}
            onClick={() => setFilter("replied")}
          >
            Replied
          </Button>
          <Button
            variant={filter === "resolved" ? "default" : "outline"}
            onClick={() => setFilter("resolved")}
          >
            Resolved
          </Button>
        </div>

        <div className="space-y-4">
          {loading ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">Loading messages...</p>
              </CardContent>
            </Card>
          ) : filteredMessages.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">No messages found</p>
              </CardContent>
            </Card>
          ) : (
            filteredMessages.map((message) => (
              <Card key={message.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" />
                      <CardTitle className="text-lg">
                        @{message.username || message.chat_id}
                      </CardTitle>
                      {getStatusBadge(message.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {new Date(message.created_at).toLocaleString()}
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <p className="text-sm font-medium mb-1">Customer Message:</p>
                    <p>{message.message_text}</p>
                  </div>

                  {message.admin_reply && (
                    <div className="bg-primary/10 p-4 rounded-lg">
                      <p className="text-sm font-medium mb-1">Your Reply:</p>
                      <p>{message.admin_reply}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        Replied: {new Date(message.replied_at!).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {message.status !== "resolved" && (
                    <div className="space-y-2">
                      <Textarea
                        placeholder="Type your reply..."
                        value={replyText[message.id] || ""}
                        onChange={(e) =>
                          setReplyText({ ...replyText, [message.id]: e.target.value })
                        }
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => sendReply(message.id, message.chat_id)}
                          disabled={sendingReply[message.id]}
                        >
                          {sendingReply[message.id] ? "Sending..." : "Send Reply"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => markAsResolved(message.id)}
                        >
                          Mark as Resolved
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
