import Chat from "@/features/chat/ChatPage";
import Index from "@/features/landing/IndexPage";
import Settings from "@/features/settings/SettingsPage";
import NotFound from "@/shared/components/NotFoundPage";
import { Toaster as Sonner } from "@/shared/ui/sonner";
import { Toaster } from "@/shared/ui/toaster";
import { TooltipProvider } from "@/shared/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ServiceProvider } from "./ServiceContext";
import { SidebarLayout } from "./SidebarLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ServiceProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Landing page - no sidebar */}
            <Route path="/" element={<Index />} />
            <Route path="/settings" element={<Settings />} />

            {/* Chat routes with sidebar */}
            <Route element={<SidebarLayout />}>
              <Route path="/chat" element={<Chat />} />
              <Route path="/chat/:conversationId" element={<Chat />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ServiceProvider>
  </QueryClientProvider>
);

export default App;
