import * as React from "react";

interface LoadingState {
  [key: string]: boolean;
}

interface LoadingContextType {
  loadingStates: LoadingState;
  setLoading: (key: string, isLoading: boolean) => void;
  isLoading: (key: string) => boolean;
  isAnyLoading: () => boolean;
}

const LoadingContext = React.createContext<LoadingContextType | undefined>(undefined);

export const LoadingProvider = ({ children }: { children: React.ReactNode }) => {
  const [loadingStates, setLoadingStates] = React.useState<LoadingState>({});

  const setLoading = React.useCallback((key: string, isLoading: boolean) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: isLoading
    }));
  }, []);

  const isLoading = React.useCallback((key: string) => {
    return loadingStates[key] || false;
  }, [loadingStates]);

  const isAnyLoading = React.useCallback(() => {
    return Object.values(loadingStates).some(state => state === true);
  }, [loadingStates]);

  return (
    <LoadingContext.Provider value={{ loadingStates, setLoading, isLoading, isAnyLoading }}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const context = React.useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
};
