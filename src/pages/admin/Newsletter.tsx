import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Download,
  Search,
  UserX,
  Mail,
  Send,
  Users,
  UserCheck,
  UserMinus,
  Loader2,
  RefreshCw,
  Eye,
  Save,
  FileText,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Plus
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface Subscriber {
  id: string;
  email: string;
  subscribed_at: string;
  is_active: boolean;
  source: string;
  unsubscribed_at: string | null;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  created_at: string;
}

interface CampaignHistory {
  id: string;
  subject: string;
  sent_count: number;
  failed_count: number;
  created_at: string;
}

const ITEMS_PER_PAGE = 15;

export default function Newsletter() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSubscribers, setSelectedSubscribers] = useState<string[]>([]);

  // Compose state
  const [showCompose, setShowCompose] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const [sending, setSending] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showConfirmSend, setShowConfirmSend] = useState(false);

  // Template state
  const [showSaveTemplate, setShowSaveTemplate] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");

  const [stats, setStats] = useState({ total: 0, active: 0, unsubscribed: 0 });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([
      loadSubscribers(),
      loadTemplates(),
      loadCampaigns(),
    ]);
    setLoading(false);
  };

  const loadSubscribers = async () => {
    try {
      const { data, error } = await supabase
        .from("newsletter_subscribers")
        .select("*")
        .order("subscribed_at", { ascending: false });

      if (error) throw error;

      setSubscribers(data || []);

      const active = data?.filter(s => s.is_active).length || 0;
      setStats({
        total: data?.length || 0,
        active,
        unsubscribed: (data?.length || 0) - active
      });
    } catch (error: any) {
      toast.error("Failed to load subscribers");
    }
  };

  const loadTemplates = async () => {
    try {
      const { data } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "newsletter_templates")
        .single();

      if (data?.value) {
        const parsed = typeof data.value === "string"
          ? JSON.parse(data.value)
          : data.value;
        setTemplates(parsed.templates || []);
      }
    } catch (error) {
      console.error("Failed to load templates:", error);
    }
  };

  const loadCampaigns = async () => {
    try {
      const { data } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "newsletter_campaigns")
        .single();

      if (data?.value) {
        const parsed = typeof data.value === "string"
          ? JSON.parse(data.value)
          : data.value;
        setCampaigns(parsed.campaigns || []);
      }
    } catch (error) {
      console.error("Failed to load campaigns:", error);
    }
  };

  const handleUnsubscribe = async (id: string) => {
    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .update({
          is_active: false,
          unsubscribed_at: new Date().toISOString()
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Subscriber deactivated");
      loadSubscribers();
    } catch (error: any) {
      toast.error("Failed to unsubscribe user");
    }
  };

  const handleResubscribe = async (id: string) => {
    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .update({
          is_active: true,
          unsubscribed_at: null
        })
        .eq("id", id);

      if (error) throw error;

      toast.success("Subscriber reactivated");
      loadSubscribers();
    } catch (error: any) {
      toast.error("Failed to resubscribe user");
    }
  };

  const bulkUnsubscribe = async () => {
    if (selectedSubscribers.length === 0) return;

    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .update({
          is_active: false,
          unsubscribed_at: new Date().toISOString()
        })
        .in("id", selectedSubscribers);

      if (error) throw error;

      toast.success(`${selectedSubscribers.length} subscriber(s) deactivated`);
      setSelectedSubscribers([]);
      loadSubscribers();
    } catch (error: any) {
      toast.error("Failed to unsubscribe users");
    }
  };

  const exportToCSV = () => {
    const csv = [
      ["Email", "Subscribed At", "Status", "Source"],
      ...filteredSubscribers.map(s => [
        s.email,
        format(new Date(s.subscribed_at), "yyyy-MM-dd HH:mm"),
        s.is_active ? "Active" : "Unsubscribed",
        s.source || "website"
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `newsletter-subscribers-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    toast.success("Exported to CSV");
  };

  const sendNewsletter = async () => {
    if (!emailSubject.trim() || !emailContent.trim()) {
      toast.error("Please enter a subject and content");
      return;
    }

    const activeSubscribers = subscribers.filter(s => s.is_active);
    if (activeSubscribers.length === 0) {
      toast.error("No active subscribers to send to");
      return;
    }

    setSending(true);
    setShowConfirmSend(false);

    try {
      let sentCount = 0;
      let failedCount = 0;

      // Send emails via edge function
      for (const subscriber of activeSubscribers) {
        try {
          const { error } = await supabase.functions.invoke("send-newsletter", {
            body: {
              to: subscriber.email,
              subject: emailSubject,
              content: emailContent,
            },
          });

          if (!error) {
            sentCount++;
          } else {
            failedCount++;
          }
        } catch {
          failedCount++;
        }
      }

      // Save campaign history
      const newCampaign: CampaignHistory = {
        id: crypto.randomUUID(),
        subject: emailSubject,
        sent_count: sentCount,
        failed_count: failedCount,
        created_at: new Date().toISOString(),
      };

      const updatedCampaigns = [newCampaign, ...campaigns].slice(0, 50);

      await supabase
        .from("settings")
        .upsert([{
          key: "newsletter_campaigns",
          value: { campaigns: updatedCampaigns } as any,
          updated_at: new Date().toISOString(),
        }], { onConflict: "key" });

      setCampaigns(updatedCampaigns);
      setEmailSubject("");
      setEmailContent("");
      setShowCompose(false);

      toast.success(`Newsletter sent to ${sentCount} subscribers. ${failedCount} failed.`);
    } catch (error: any) {
      toast.error("Failed to send newsletter: " + error.message);
    } finally {
      setSending(false);
    }
  };

  const saveTemplate = async () => {
    if (!templateName.trim() || !emailSubject.trim() || !emailContent.trim()) {
      toast.error("Please fill in all fields");
      return;
    }

    const newTemplate: EmailTemplate = {
      id: crypto.randomUUID(),
      name: templateName,
      subject: emailSubject,
      content: emailContent,
      created_at: new Date().toISOString(),
    };

    const updatedTemplates = [...templates, newTemplate];

    try {
      const { error } = await supabase
        .from("settings")
        .upsert([{
          key: "newsletter_templates",
          value: { templates: updatedTemplates } as any,
          updated_at: new Date().toISOString(),
        }], { onConflict: "key" });

      if (error) throw error;

      setTemplates(updatedTemplates);
      setTemplateName("");
      setShowSaveTemplate(false);
      toast.success("Template saved");
    } catch (error: any) {
      toast.error("Failed to save template");
    }
  };

  const loadTemplate = (template: EmailTemplate) => {
    setEmailSubject(template.subject);
    setEmailContent(template.content);
    setSelectedTemplate(template.id);
  };

  const deleteTemplate = async (id: string) => {
    const updatedTemplates = templates.filter(t => t.id !== id);

    try {
      const { error } = await supabase
        .from("settings")
        .upsert([{
          key: "newsletter_templates",
          value: { templates: updatedTemplates } as any,
          updated_at: new Date().toISOString(),
        }], { onConflict: "key" });

      if (error) throw error;

      setTemplates(updatedTemplates);
      toast.success("Template deleted");
    } catch (error: any) {
      toast.error("Failed to delete template");
    }
  };

  const filteredSubscribers = useMemo(() => {
    let filtered = subscribers;

    if (searchTerm) {
      filtered = filtered.filter(s =>
        s.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(s =>
        statusFilter === "active" ? s.is_active : !s.is_active
      );
    }

    return filtered;
  }, [subscribers, searchTerm, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredSubscribers.length / ITEMS_PER_PAGE);
  const paginatedSubscribers = filteredSubscribers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const toggleSelectAll = () => {
    if (selectedSubscribers.length === paginatedSubscribers.length) {
      setSelectedSubscribers([]);
    } else {
      setSelectedSubscribers(paginatedSubscribers.map(s => s.id));
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold">Newsletter</h1>
            <p className="text-muted-foreground mt-1">
              Manage subscribers and send email campaigns
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadData} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button onClick={() => setShowCompose(true)}>
              <Mail className="mr-2 h-4 w-4" />
              Compose
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Subscribers</p>
                  <p className="text-3xl font-bold">{stats.total}</p>
                </div>
                <Users className="h-10 w-10 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Active</p>
                  <p className="text-3xl font-bold text-green-600">{stats.active}</p>
                </div>
                <UserCheck className="h-10 w-10 text-green-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Unsubscribed</p>
                  <p className="text-3xl font-bold text-muted-foreground">{stats.unsubscribed}</p>
                </div>
                <UserMinus className="h-10 w-10 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="subscribers" className="space-y-6">
          <TabsList>
            <TabsTrigger value="subscribers" className="gap-2">
              <Users className="h-4 w-4" />
              Subscribers
            </TabsTrigger>
            <TabsTrigger value="templates" className="gap-2">
              <FileText className="h-4 w-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <Send className="h-4 w-4" />
              Campaign History
            </TabsTrigger>
          </TabsList>

          {/* Subscribers Tab */}
          <TabsContent value="subscribers">
            <Card>
              <CardHeader>
                <CardTitle>All Subscribers</CardTitle>
                <CardDescription>Manage your newsletter subscribers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                  <div className="flex gap-2 flex-1">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Filter status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={exportToCSV} variant="outline">
                    <Download className="mr-2 h-4 w-4" />
                    Export CSV
                  </Button>
                </div>

                {selectedSubscribers.length > 0 && (
                  <div className="flex items-center justify-between p-3 mb-4 border rounded-lg bg-muted">
                    <span className="text-sm font-medium">
                      {selectedSubscribers.length} selected
                    </span>
                    <Button variant="destructive" size="sm" onClick={bulkUnsubscribe}>
                      <UserX className="mr-2 h-4 w-4" />
                      Unsubscribe Selected
                    </Button>
                  </div>
                )}

                {loading ? (
                  <div className="flex justify-center p-8">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">
                            <Checkbox
                              checked={selectedSubscribers.length === paginatedSubscribers.length && paginatedSubscribers.length > 0}
                              onCheckedChange={toggleSelectAll}
                            />
                          </TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Subscribed Date</TableHead>
                          <TableHead>Source</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedSubscribers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                              No subscribers found
                            </TableCell>
                          </TableRow>
                        ) : (
                          paginatedSubscribers.map((subscriber) => (
                            <TableRow key={subscriber.id}>
                              <TableCell>
                                <Checkbox
                                  checked={selectedSubscribers.includes(subscriber.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedSubscribers([...selectedSubscribers, subscriber.id]);
                                    } else {
                                      setSelectedSubscribers(selectedSubscribers.filter(id => id !== subscriber.id));
                                    }
                                  }}
                                />
                              </TableCell>
                              <TableCell className="font-medium">{subscriber.email}</TableCell>
                              <TableCell>
                                {format(new Date(subscriber.subscribed_at), "MMM dd, yyyy HH:mm")}
                              </TableCell>
                              <TableCell className="capitalize">{subscriber.source || "website"}</TableCell>
                              <TableCell>
                                {subscriber.is_active ? (
                                  <Badge variant="default">Active</Badge>
                                ) : (
                                  <Badge variant="secondary">Unsubscribed</Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {subscriber.is_active ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleUnsubscribe(subscriber.id)}
                                  >
                                    <UserX className="h-4 w-4" />
                                  </Button>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleResubscribe(subscriber.id)}
                                  >
                                    <UserCheck className="h-4 w-4" />
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-4">
                    <p className="text-sm text-muted-foreground">
                      Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, filteredSubscribers.length)} of {filteredSubscribers.length}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm">Page {currentPage} of {totalPages}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates">
            <Card>
              <CardHeader>
                <CardTitle>Email Templates</CardTitle>
                <CardDescription>Save and reuse email templates for your campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                {templates.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No templates saved yet</p>
                    <p className="text-sm mt-1">Create a newsletter and save it as a template</p>
                  </div>
                ) : (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {templates.map((template) => (
                      <Card key={template.id} className="cursor-pointer hover:border-primary transition-colors">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-lg flex items-center justify-between">
                            {template.name}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteTemplate(template.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </CardTitle>
                          <CardDescription className="truncate">
                            {template.subject}
                          </CardDescription>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {template.content.substring(0, 100)}...
                          </p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-4 w-full"
                            onClick={() => {
                              loadTemplate(template);
                              setShowCompose(true);
                            }}
                          >
                            Use Template
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Campaign History Tab */}
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Campaign History</CardTitle>
                <CardDescription>Past newsletter campaigns</CardDescription>
              </CardHeader>
              <CardContent>
                {campaigns.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Send className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p>No campaigns sent yet</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Subject</TableHead>
                        <TableHead>Sent</TableHead>
                        <TableHead>Failed</TableHead>
                        <TableHead>Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {campaigns.map((campaign) => (
                        <TableRow key={campaign.id}>
                          <TableCell className="font-medium">{campaign.subject}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{campaign.sent_count} sent</Badge>
                          </TableCell>
                          <TableCell>
                            {campaign.failed_count > 0 && (
                              <Badge variant="destructive">{campaign.failed_count} failed</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {format(new Date(campaign.created_at), "MMM dd, yyyy HH:mm")}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Compose Modal */}
      <Dialog open={showCompose} onOpenChange={setShowCompose}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Compose Newsletter
            </DialogTitle>
            <DialogDescription>
              Send a newsletter to {stats.active} active subscribers
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            {templates.length > 0 && (
              <div className="space-y-2">
                <Label>Load from Template</Label>
                <Select
                  value={selectedTemplate}
                  onValueChange={(value) => {
                    const template = templates.find(t => t.id === value);
                    if (template) loadTemplate(template);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="subject">Subject Line</Label>
              <Input
                id="subject"
                value={emailSubject}
                onChange={(e) => {
                  setEmailSubject(e.target.value);
                  setSelectedTemplate("");
                }}
                placeholder="Enter email subject..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="content">Email Content</Label>
              <Textarea
                id="content"
                value={emailContent}
                onChange={(e) => {
                  setEmailContent(e.target.value);
                  setSelectedTemplate("");
                }}
                placeholder="Write your newsletter content here...&#10;&#10;You can use HTML for formatting."
                rows={12}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Supports HTML formatting
              </p>
            </div>
          </div>

          <DialogFooter className="mt-6 flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setShowPreview(true)}
              disabled={!emailContent.trim()}
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowSaveTemplate(true)}
              disabled={!emailSubject.trim() || !emailContent.trim()}
            >
              <Save className="mr-2 h-4 w-4" />
              Save Template
            </Button>
            <Button
              onClick={() => setShowConfirmSend(true)}
              disabled={sending || !emailSubject.trim() || !emailContent.trim()}
            >
              {sending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Send to {stats.active} subscribers
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Modal */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Email Preview</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <div className="p-4 border rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">Subject:</p>
              <p className="font-medium mb-4">{emailSubject}</p>
              <div className="border-t pt-4">
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: emailContent }}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPreview(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save Template Modal */}
      <Dialog open={showSaveTemplate} onOpenChange={setShowSaveTemplate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save as Template</DialogTitle>
            <DialogDescription>
              Save this email for future use
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Monthly Newsletter, Sale Announcement"
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setShowSaveTemplate(false)}>
              Cancel
            </Button>
            <Button onClick={saveTemplate} disabled={!templateName.trim()}>
              <Save className="mr-2 h-4 w-4" />
              Save Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Send Dialog */}
      <AlertDialog open={showConfirmSend} onOpenChange={setShowConfirmSend}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Newsletter?</AlertDialogTitle>
            <AlertDialogDescription>
              You are about to send this newsletter to <strong>{stats.active} active subscribers</strong>.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={sendNewsletter}>
              <Send className="mr-2 h-4 w-4" />
              Send Newsletter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
