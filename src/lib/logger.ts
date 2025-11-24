import { supabase } from "@/integrations/supabase/client";

interface LogEntry {
  log_type: "debug" | "info" | "warning" | "error" | "critical";
  source: "frontend";
  category: string;
  message: string;
  stack_trace?: string;
  metadata?: any;
  session_id: string;
  url: string;
  user_agent: string;
}

class Logger {
  private queue: LogEntry[] = [];
  private flushInterval = 5000; // 5 seconds
  private maxQueueSize = 20;
  private sessionId: string;
  private flushTimer: number | null = null;

  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.startFlushTimer();
    
    // Flush on page unload
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", () => this.flush());
    }
  }

  private getOrCreateSessionId(): string {
    const key = "log_session_id";
    let sessionId = sessionStorage.getItem(key);
    
    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem(key, sessionId);
    }
    
    return sessionId;
  }

  private startFlushTimer() {
    if (typeof window !== "undefined") {
      this.flushTimer = window.setInterval(() => {
        if (this.queue.length > 0) {
          this.flush();
        }
      }, this.flushInterval);
    }
  }

  private createLogEntry(
    logType: LogEntry["log_type"],
    category: string,
    message: string,
    metadata?: any,
    stackTrace?: string
  ): LogEntry {
    return {
      log_type: logType,
      source: "frontend",
      category,
      message,
      stack_trace: stackTrace,
      metadata: metadata || {},
      session_id: this.sessionId,
      url: window.location.href,
      user_agent: navigator.userAgent,
    };
  }

  private addToQueue(entry: LogEntry) {
    this.queue.push(entry);
    
    // Auto-flush if queue is full
    if (this.queue.length >= this.maxQueueSize) {
      this.flush();
    }
  }

  async flush() {
    if (this.queue.length === 0) return;

    const logsToSend = [...this.queue];
    this.queue = [];

    try {
      await supabase.functions.invoke("log-event", {
        body: { logs: logsToSend },
      });
    } catch (error) {
      console.error("Failed to send logs to backend:", error);
      // Re-add to queue on failure (but limit to prevent infinite growth)
      if (this.queue.length < this.maxQueueSize) {
        this.queue.unshift(...logsToSend.slice(0, this.maxQueueSize - this.queue.length));
      }
    }
  }

  info(message: string, metadata?: any, category: string = "app") {
    if (process.env.NODE_ENV === "development") {
      console.log(`[INFO] ${message}`, metadata);
    }
    
    const entry = this.createLogEntry("info", category, message, metadata);
    this.addToQueue(entry);
  }

  warn(message: string, metadata?: any, category: string = "app") {
    if (process.env.NODE_ENV === "development") {
      console.warn(`[WARN] ${message}`, metadata);
    }
    
    const entry = this.createLogEntry("warning", category, message, metadata);
    this.addToQueue(entry);
  }

  error(message: string, error?: Error, metadata?: any, category: string = "app") {
    if (process.env.NODE_ENV === "development") {
      console.error(`[ERROR] ${message}`, error, metadata);
    }
    
    const entry = this.createLogEntry(
      "error",
      category,
      message,
      {
        ...metadata,
        errorMessage: error?.message,
        errorName: error?.name,
      },
      error?.stack
    );
    this.addToQueue(entry);
  }

  debug(message: string, metadata?: any, category: string = "app") {
    if (process.env.NODE_ENV === "development") {
      console.debug(`[DEBUG] ${message}`, metadata);
      
      const entry = this.createLogEntry("debug", category, message, metadata);
      this.addToQueue(entry);
    }
  }

  critical(message: string, error?: Error, metadata?: any, category: string = "app") {
    console.error(`[CRITICAL] ${message}`, error, metadata);
    
    const entry = this.createLogEntry(
      "critical",
      category,
      message,
      {
        ...metadata,
        errorMessage: error?.message,
        errorName: error?.name,
      },
      error?.stack
    );
    
    // Critical logs are flushed immediately
    this.addToQueue(entry);
    this.flush();
  }
}

export const logger = new Logger();
