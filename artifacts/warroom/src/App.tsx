import React from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { Layout } from "@/components/layout/Layout";
import Dashboard from "@/pages/Dashboard";
import Domains from "@/pages/Domains";
import Scenarios from "@/pages/Scenarios";
import Threats from "@/pages/Threats";
import Agents from "@/pages/Agents";
import Chains from "@/pages/Chains";
import Sessions from "@/pages/Sessions";
import SessionWorkspace from "@/pages/SessionWorkspace";
import Reports from "@/pages/Reports";
import Guide from "@/pages/Guide";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/domains" component={Domains} />
        <Route path="/scenarios" component={Scenarios} />
        <Route path="/threats" component={Threats} />
        <Route path="/agents" component={Agents} />
        <Route path="/chains" component={Chains} />
        <Route path="/sessions" component={Sessions} />
        <Route path="/sessions/:id" component={SessionWorkspace} />
        <Route path="/reports" component={Reports} />
        <Route path="/guide" component={Guide} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
