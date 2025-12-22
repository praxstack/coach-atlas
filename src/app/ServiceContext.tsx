/**
 * ServiceContext - React Context for Service Layer
 * Provides dependency injection for services
 */
import { aiService, AIService, storageService, StorageService } from "@/services";
import { createContext, ReactNode, useContext } from "react";

interface ServiceContextValue {
  aiService: AIService;
  storageService: StorageService;
}

const ServiceContext = createContext<ServiceContextValue | null>(null);

export function ServiceProvider({ children }: { children: ReactNode }) {
  // Services are singletons, created once at app startup
  const value: ServiceContextValue = {
    aiService,
    storageService,
  };

  return (
    <ServiceContext.Provider value={value}>
      {children}
    </ServiceContext.Provider>
  );
}

/**
 * Hook to access services
 * Throws if used outside of ServiceProvider
 */
export function useServices(): ServiceContextValue {
  const context = useContext(ServiceContext);

  if (!context) {
    throw new Error("useServices must be used within a ServiceProvider");
  }

  return context;
}

/**
 * Convenience hooks for individual services
 */
export function useAIService(): AIService {
  return useServices().aiService;
}

export function useStorageService(): StorageService {
  return useServices().storageService;
}
