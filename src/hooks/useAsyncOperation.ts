import { useState, useCallback } from "react";
import { useLoading } from "@/contexts/LoadingContext";
import { toast } from "sonner";

interface UseAsyncOperationOptions {
  loadingKey?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  successMessage?: string;
  errorMessage?: string;
}

export const useAsyncOperation = <T extends any[], R>(
  operation: (...args: T) => Promise<R>,
  options: UseAsyncOperationOptions = {}
) => {
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { setLoading } = useLoading();

  const execute = useCallback(
    async (...args: T) => {
      try {
        setLocalLoading(true);
        setError(null);
        
        if (options.loadingKey) {
          setLoading(options.loadingKey, true);
        }

        const result = await operation(...args);

        if (options.successMessage) {
          toast.success(options.successMessage);
        }

        if (options.onSuccess) {
          options.onSuccess();
        }

        return result;
      } catch (err) {
        const error = err as Error;
        setError(error);

        if (options.errorMessage) {
          toast.error(options.errorMessage);
        } else {
          toast.error(error.message || "An error occurred");
        }

        if (options.onError) {
          options.onError(error);
        }

        throw error;
      } finally {
        setLocalLoading(false);
        
        if (options.loadingKey) {
          setLoading(options.loadingKey, false);
        }
      }
    },
    [operation, options, setLoading]
  );

  return {
    execute,
    loading: localLoading,
    error
  };
};
