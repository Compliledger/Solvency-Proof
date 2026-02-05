import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Product from "./pages/Product";
import HowItWorks from "./pages/HowItWorks";
import NotFound from "./pages/NotFound";
import Login from "./pages/app/Login";

// Verifier Pages (Public - No Auth Required)
import Dashboard from "./pages/app/Dashboard";
import ReportsList from "./pages/app/ReportsList";
import ReportDetail from "./pages/app/ReportDetail";
import InclusionCheck from "./pages/app/InclusionCheck";

// Demo Flow Pages
import YellowSessions from "./pages/app/YellowSessions";
import Liabilities from "./pages/app/Liabilities";
import Reserves from "./pages/app/Reserves";
import ProofGenerator from "./pages/app/ProofGenerator";
import Summary from "./pages/app/Summary";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Marketing Pages */}
          <Route path="/" element={<Index />} />
          <Route path="/product" element={<Product />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/login" element={<Login />} />

          {/* Proof Verifier (Public) */}
          <Route path="/verify" element={<Dashboard />} />
          <Route path="/proofs" element={<ReportsList />} />
          <Route path="/proofs/:id" element={<ReportDetail />} />
          <Route path="/inclusion" element={<InclusionCheck />} />

          {/* Demo Flow Pages */}
          <Route path="/yellow" element={<YellowSessions />} />
          <Route path="/liabilities" element={<Liabilities />} />
          <Route path="/reserves" element={<Reserves />} />
          <Route path="/proof" element={<ProofGenerator />} />
          <Route path="/summary" element={<Summary />} />

          {/* Legacy redirects */}
          <Route path="/app" element={<Dashboard />} />
          <Route path="/app/reports" element={<ReportsList />} />
          <Route path="/app/reports/:id" element={<ReportDetail />} />
          <Route path="/app/inclusion" element={<InclusionCheck />} />

          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
