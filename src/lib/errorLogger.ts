import { supabase } from "@/integrations/supabase/client";

interface ErrorTrackingData {
  error_message: string;
  error_type?: string;
  stack_trace?: string;
  source_file?: string;
  line_number?: number;
  column_number?: number;
  browser_info?: any;
  severity?: "critical" | "error" | "warning" | "info";
}

class ErrorLogger {
  private lastErrorTime = 0;
  private lastErrorMessage = "";
  private debounceMs = 1000; // Prevent duplicate errors within 1 second

  constructor() {
    if (typeof window !== "undefined") {
      this.initGlobalHandlers();
    }
  }

  private initGlobalHandlers() {
    // Handle unhandled errors
    window.addEventListener("error", (event) => {
      this.logError({
        error_message: event.message,
        error_type: event.error?.name || "Error",
        stack_trace: event.error?.stack,
        source_file: event.filename,
        line_number: event.lineno,
        column_number: event.colno,
        severity: "error",
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener("unhandledrejection", (event) => {
      this.logError({
        error_message: event.reason?.message || String(event.reason),
        error_type: event.reason?.name || "UnhandledRejection",
        stack_trace: event.reason?.stack,
        severity: "error",
      });
    });
  }

  private shouldLog(message: string): boolean {
    const now = Date.now();
    
    // Debounce duplicate errors
    if (
      message === this.lastErrorMessage &&
      now - this.lastErrorTime < this.debounceMs
    ) {
      return false;
    }

    this.lastErrorTime = now;
    this.lastErrorMessage = message;
    return true;
  }

  async logError(data: ErrorTrackingData) {
    if (!this.shouldLog(data.error_message)) {
      return;
    }

    const browserInfo = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    };

    try {
      await supabase.functions.invoke("log-event", {
        body: {
          error: {
            ...data,
            browser_info: browserInfo,
          },
        },
      });
    } catch (error) {
      console.error("Failed to log error to backend:", error);
    }
  }

  // Public method for manual error logging
  captureError(
    error: Error,
    context?: { severity?: ErrorTrackingData["severity"]; metadata?: any }
  ) {
    this.logError({
      error_message: error.message,
      error_type: error.name,
      stack_trace: error.stack,
      severity: context?.severity || "error",
    });
  }
}

export const errorLogger = new ErrorLogger();
