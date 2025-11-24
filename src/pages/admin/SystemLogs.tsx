import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  RefreshCw, 
  Search,
  TrendingUp,
  XCircle,
  Database,
  Activity
} from "lucide-react";
import { format } from "date-fns";

const LOG_TYPE_COLORS = {
  debug: "bg-muted text-muted-foreground",
  info: "bg-blue-500/10 text-blue-500",
  warning: "bg-yellow-500/10 text-yellow-500",
  error: "bg-red-500/10 text-red-500",
  critical: "bg-purple-500/10 text-purple-500",
};

const SEVERITY_COLORS = {
  critical: "bg-purple-500/10 text-purple-500",
  error: "bg-red-500/10 text-red-500",
  warning: "bg-yellow-500/10 text-yellow-500",
  info: "bg-blue-500/10 text-blue-500",
};

export default function SystemLogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [logTypeFilter, setLogTypeFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [autoRefresh, setAutoRefresh] = useState(false);
  const queryClient = useQueryClient();

  // Fetch system logs
  const { data: systemLogs, isLoading: logsLoading } = useQuery({
    queryKey: ["system-logs", logTypeFilter, sourceFilter, searchQuery],
    queryFn: async () => {
      let query = supabase
        .from("system_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (logTypeFilter !== "all") {
        query = query.eq("log_type", logTypeFilter);
      }
      if (sourceFilter !== "all") {
        query = query.eq("source", sourceFilter);
      }
      if (searchQuery) {
        query = query.ilike("message", `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    refetchInterval: autoRefresh ? 30000 : false,
  });

  // Fetch error tracking
  const { data: errorTracking, isLoading: errorsLoading } = useQuery({
    queryKey: ["error-tracking", severityFilter],
    queryFn: async () => {
      let query = supabase
        .from("error_tracking")
        .select("*")
        .order("last_seen", { ascending: false })
        .limit(50);

      if (severityFilter !== "all") {
        query = query.eq("severity", severityFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Fetch audit logs
  const { data: auditLogs, isLoading: auditLoading } = useQuery({
    queryKey: ["audit-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) throw error;
      return data;
    },
  });

  // Resolve error mutation
  const resolveErrorMutation = useMutation({
    mutationFn: async ({ id, notes }: { id: string; notes: string }) => {
      const { error } = await supabase
        .from("error_tracking")
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString(),
          resolution_notes: notes,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["error-tracking"] });
      toast.success("Error marked as resolved");
    },
    onError: (error) => {
      toast.error("Failed to resolve error");
      console.error(error);
    },
  });

  const handleResolveError = (id: string, notes: string) => {
    resolveErrorMutation.mutate({ id, notes });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">System Logs</h2>
            <p className="text-muted-foreground">
              Monitor application health and track errors
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={autoRefresh ? "default" : "outline"}
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${autoRefresh ? "animate-spin" : ""}`} />
              Auto-refresh
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview" className="gap-2">
              <Activity className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="errors" className="gap-2">
              <AlertCircle className="h-4 w-4" />
              Error Tracking
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2">
              <FileText className="h-4 w-4" />
              Audit Trail
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search logs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 max-w-sm"
                />
              </div>
              <Select value={logTypeFilter} onValueChange={setLogTypeFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Log Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="debug">Debug</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sourceFilter} onValueChange={setSourceFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="frontend">Frontend</SelectItem>
                  <SelectItem value="edge-function">Edge Function</SelectItem>
                  <SelectItem value="database">Database</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Logs</CardTitle>
                <CardDescription>Latest 100 log entries</CardDescription>
              </CardHeader>
              <CardContent>
                {logsLoading ? (
                  <p className="text-center text-muted-foreground py-8">Loading logs...</p>
                ) : systemLogs && systemLogs.length > 0 ? (
                  <div className="space-y-2">
                    {systemLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge className={LOG_TYPE_COLORS[log.log_type as keyof typeof LOG_TYPE_COLORS]}>
                                {log.log_type}
                              </Badge>
                              <Badge variant="outline">{log.source}</Badge>
                              <Badge variant="outline">{log.category}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(log.created_at), "PPp")}
                              </span>
                            </div>
                            <p className="text-sm font-medium">{log.message}</p>
                            {log.stack_trace && (
                              <details className="text-xs text-muted-foreground">
                                <summary className="cursor-pointer hover:text-foreground">
                                  View stack trace
                                </summary>
                                <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto">
                                  {log.stack_trace}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No logs found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="errors" className="space-y-4">
            <div className="flex gap-4 mb-4">
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Error Tracking</CardTitle>
                <CardDescription>Grouped errors with occurrence counts</CardDescription>
              </CardHeader>
              <CardContent>
                {errorsLoading ? (
                  <p className="text-center text-muted-foreground py-8">Loading errors...</p>
                ) : errorTracking && errorTracking.length > 0 ? (
                  <div className="space-y-4">
                    {errorTracking.map((error) => (
                      <div
                        key={error.id}
                        className="p-4 border rounded-lg space-y-3"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <Badge className={SEVERITY_COLORS[error.severity as keyof typeof SEVERITY_COLORS]}>
                                {error.severity}
                              </Badge>
                              {error.is_resolved ? (
                                <Badge variant="outline" className="gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Resolved
                                </Badge>
                              ) : (
                                <Badge variant="destructive" className="gap-1">
                                  <XCircle className="h-3 w-3" />
                                  Unresolved
                                </Badge>
                              )}
                              <Badge variant="secondary">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                {error.occurrence_count}x
                              </Badge>
                            </div>
                            <p className="text-sm font-medium">{error.error_message}</p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                First: {format(new Date(error.first_seen), "PPp")}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Last: {format(new Date(error.last_seen), "PPp")}
                              </span>
                            </div>
                            {error.stack_trace && (
                              <details className="text-xs text-muted-foreground">
                                <summary className="cursor-pointer hover:text-foreground">
                                  View stack trace
                                </summary>
                                <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto">
                                  {error.stack_trace}
                                </pre>
                              </details>
                            )}
                            {!error.is_resolved && (
                              <div className="flex gap-2 pt-2">
                                <Textarea
                                  placeholder="Resolution notes..."
                                  id={`notes-${error.id}`}
                                  className="text-xs"
                                  rows={2}
                                />
                                <Button
                                  size="sm"
                                  onClick={() => {
                                    const notes = (document.getElementById(`notes-${error.id}`) as HTMLTextAreaElement)?.value || "";
                                    handleResolveError(error.id, notes);
                                  }}
                                >
                                  Mark Resolved
                                </Button>
                              </div>
                            )}
                            {error.is_resolved && error.resolution_notes && (
                              <div className="p-2 bg-muted rounded text-xs">
                                <p className="font-medium">Resolution Notes:</p>
                                <p className="text-muted-foreground">{error.resolution_notes}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No errors tracked</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Audit Trail</CardTitle>
                <CardDescription>User actions and system changes</CardDescription>
              </CardHeader>
              <CardContent>
                {auditLoading ? (
                  <p className="text-center text-muted-foreground py-8">Loading audit logs...</p>
                ) : auditLogs && auditLogs.length > 0 ? (
                  <div className="space-y-2">
                    {auditLogs.map((log) => (
                      <div
                        key={log.id}
                        className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{log.entity_type}</Badge>
                              <Badge variant="outline">{log.action}</Badge>
                              {log.severity && (
                                <Badge className={SEVERITY_COLORS[log.severity as keyof typeof SEVERITY_COLORS]}>
                                  {log.severity}
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground">
                                {format(new Date(log.created_at), "PPp")}
                              </span>
                            </div>
                            {log.details && (
                              <details className="text-xs text-muted-foreground">
                                <summary className="cursor-pointer hover:text-foreground">
                                  View details
                                </summary>
                                <pre className="mt-2 p-2 bg-muted rounded overflow-x-auto">
                                  {JSON.stringify(log.details, null, 2)}
                                </pre>
                              </details>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No audit logs found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
