import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/context/LanguageContext";
import { isAppRoot } from "@/lib/route";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

/**
 * There is no router. The app is a single screen — `Index` owns the whole flow
 * (welcome, upload, customise, play) in local state — so react-router bought
 * nothing but a dependency and its open-redirect advisory (GHSA-wrjc-x8rr-h8h6).
 *
 * The path is read once at mount, which is sound precisely because nothing here
 * pushes history: the only link off the not-found page is a plain anchor, and that
 * loads a fresh document.
 */
const App = () => {
  const pathname = window.location.pathname;

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {isAppRoot(pathname) ? <Index /> : <NotFound pathname={pathname} />}
        </TooltipProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default App;
