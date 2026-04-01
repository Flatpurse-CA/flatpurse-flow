import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "next-themes";
import AppLayout from "@/components/AppLayout";
import AdminLayout from "@/components/AdminLayout";
import AuthPage from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import BusinessesPage from "@/pages/Businesses";
import BusinessDetailPage from "@/pages/BusinessDetail";
import AccountDetailPage from "@/pages/AccountDetail";
import ReportsPage from "@/pages/Reports";

import InvoicingLayout from "@/pages/invoicing/InvoicingLayout";
import InvoicingAll from "@/pages/invoicing/InvoicingAll";
import InvoicingDrafts from "@/pages/invoicing/InvoicingDrafts";
import InvoicingClients from "@/pages/invoicing/InvoicingClients";
import InvoicingRevenue from "@/pages/invoicing/InvoicingRevenue";
import InventoryLayout from "@/pages/inventory/InventoryLayout";
import InventoryProducts from "@/pages/inventory/InventoryProducts";
import InventorySales from "@/pages/inventory/InventorySales";
import InventoryUnpaid from "@/pages/inventory/InventoryUnpaid";

import InventoryBatches from "@/pages/inventory/InventoryBatches";
import InventoryWarehouses from "@/pages/inventory/InventoryWarehouses";
import InventoryPurchaseOrders from "@/pages/inventory/InventoryPurchaseOrders";

// Store sub-pages
import StoreLayout from "@/pages/store/StoreLayout";
import StorefrontPage from "@/pages/store/StorefrontPage";
import StoreProductsPage from "@/pages/store/StoreProductsPage";
import OrdersPage from "@/pages/store/OrdersPage";
import TeamPage from "@/pages/store/TeamPage";
import BranchesPage from "@/pages/store/BranchesPage";
import PublicStorefront from "@/pages/store/PublicStorefront";
import OrderTrackingPage from "@/pages/store/OrderTrackingPage";
import BusinessGuard from "@/components/BusinessGuard";

import SettingsPage from "@/pages/Settings";
import NotFound from "./pages/NotFound";
import TransactionDetail from "@/pages/TransactionDetail";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminUsersFree from "@/pages/admin/AdminUsersFree";
import AdminUsersPro from "@/pages/admin/AdminUsersPro";
import AdminBusinesses from "@/pages/admin/AdminBusinesses";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminEmails from "@/pages/admin/AdminEmails";
import AdminNotifications from "@/pages/admin/AdminNotifications";
import AdminSubscriptions from "@/pages/admin/AdminSubscriptions";
import AdminFinanceOverview from "@/pages/admin/AdminFinanceOverview";
import AdminFinancePayments from "@/pages/admin/AdminFinancePayments";
import AdminFinanceReports from "@/pages/admin/AdminFinanceReports";
import { useState, useEffect } from "react";
import { useBusinesses, useProfile } from "@/hooks/useData";
import { useRealtimeTransactions } from "@/hooks/useRealtimeTransactions";
import { useIsAdmin } from "@/hooks/useAdmin";
import ProGuard from "@/components/ProGuard";
import OnboardingModal from "@/components/OnboardingModal";
import { useReferralLink } from "@/hooks/useReferralLink";
import LandingPage from "@/pages/LandingPage";
import LandingPage2 from "@/pages/LandingPage2";
import LandingPage3 from "@/pages/LandingPage3";
import LandingPage4 from "@/pages/LandingPage4";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import ProductDocument from "@/pages/ProductDocument";
import WalletPage from "@/pages/Wallet";
import BillsPage from "@/pages/Bills";
import BillDetailPage from "@/pages/BillDetail";

// CRM sub-pages
import CRMLayout from "@/pages/crm/CRMLayout";
import CRMOverview from "@/pages/crm/CRMOverview";
import CRMLeads from "@/pages/crm/CRMLeads";
import CRMContacts from "@/pages/crm/CRMContacts";
import ContactDetail from "@/pages/crm/ContactDetail";
import CRMPipeline from "@/pages/crm/CRMPipeline";
import DealDetail from "@/pages/crm/DealDetail";
import CRMTasks from "@/pages/crm/CRMTasks";
import CRMInsights from "@/pages/crm/CRMInsights";
import CRMForms from "@/pages/crm/CRMForms";
import LeadFormPage from "@/pages/LeadForm";
const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { user, loading } = useAuth();
  const { data: businesses } = useBusinesses();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const [onboardingDone, setOnboardingDone] = useState(false);
  useRealtimeTransactions();
  useReferralLink();
  const [selectedBusinessId, setSelectedBusinessId] = useState<string | null>(null);

  // Auto-select first business
  useEffect(() => {
    if (!selectedBusinessId && businesses?.length) {
      setSelectedBusinessId(businesses[0].id);
    }
  }, [businesses, selectedBusinessId]);

  if (loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;

  // Show onboarding if use_mode not set yet
  if (!onboardingDone && profile && !profile.use_mode) {
    return <OnboardingModal onComplete={() => setOnboardingDone(true)} />;
  }

  return (
    <AppLayout selectedBusinessId={selectedBusinessId} onSelectBusiness={setSelectedBusinessId}>
      <Routes>
        <Route path="/home" element={<Dashboard selectedBusinessId={selectedBusinessId} />} />
        <Route path="/businesses" element={<BusinessesPage />} />
        <Route path="/businesses/:businessId" element={<BusinessDetailPage />} />
        <Route path="/businesses/:businessId/bills" element={<BillsPage />} />
        <Route path="/businesses/:businessId/bills/:billId" element={<BillDetailPage />} />
        <Route path="/businesses/:businessId/accounts/:accountId" element={<AccountDetailPage />} />
        <Route path="/reporting" element={<ReportsPage selectedBusinessId={selectedBusinessId} />} />
        
        
        <Route path="/invoicing" element={<InvoicingLayout selectedBusinessId={selectedBusinessId} />}>
          <Route index element={<InvoicingAll />} />
          <Route path="drafts" element={<InvoicingDrafts />} />
          <Route path="clients" element={<InvoicingClients />} />
          <Route path="revenue" element={<InvoicingRevenue />} />
        </Route>
        <Route path="/crm" element={<ProGuard><CRMLayout selectedBusinessId={selectedBusinessId} /></ProGuard>}>
          <Route index element={<CRMOverview />} />
          <Route path="leads" element={<CRMLeads />} />
          <Route path="contacts" element={<CRMContacts />} />
          <Route path="contacts/:contactId" element={<ContactDetail />} />
          <Route path="pipeline" element={<CRMPipeline />} />
          <Route path="deals/:dealId" element={<DealDetail />} />
          <Route path="forms" element={<CRMForms />} />
          <Route path="tasks" element={<CRMTasks />} />
          <Route path="insights" element={<CRMInsights />} />
        </Route>
        <Route path="/inventory" element={<ProGuard><InventoryLayout selectedBusinessId={selectedBusinessId} /></ProGuard>}>
          <Route index element={<InventoryProducts />} />
          <Route path="sales" element={<InventorySales />} />
          <Route path="unpaid" element={<InventoryUnpaid />} />
          
          <Route path="batches" element={<InventoryBatches />} />
          <Route path="warehouses" element={<InventoryWarehouses />} />
          <Route path="purchase-orders" element={<InventoryPurchaseOrders />} />
        </Route>
        <Route path="/store" element={<BusinessGuard><StoreLayout selectedBusinessId={selectedBusinessId} /></BusinessGuard>}>
          <Route index element={<StorefrontPage />} />
          <Route path="products" element={<StoreProductsPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="team" element={<TeamPage />} />
          <Route path="branches" element={<BranchesPage />} />
        </Route>
        <Route path="/wallet" element={<WalletPage />} />
        
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/transaction/:id" element={<TransactionDetail />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

function AdminRoutes() {
  const { user, loading } = useAuth();
  const { data: isAdmin, isLoading: roleLoading } = useIsAdmin();

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;

  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<AdminDashboard />} />
        <Route path="/users" element={<AdminUsers />} />
        <Route path="/users/free" element={<AdminUsersFree />} />
        <Route path="/users/pro" element={<AdminUsersPro />} />
        <Route path="/businesses" element={<AdminBusinesses />} />
        <Route path="/finance" element={<AdminFinanceOverview />} />
        <Route path="/finance/payments" element={<AdminFinancePayments />} />
        <Route path="/finance/subscriptions" element={<AdminSubscriptions />} />
        <Route path="/finance/reports" element={<AdminFinanceReports />} />
        <Route path="/subscriptions" element={<Navigate to="/admin/finance/subscriptions" replace />} />
        <Route path="/emails" element={<AdminEmails />} />
        <Route path="/notifications" element={<AdminNotifications />} />
        <Route path="/settings" element={<AdminSettings />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AdminLayout>
  );
}

function AuthRoute() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (user) return <Navigate to="/home" replace />;
  return <AuthPage />;
}

function LandingRoute() {
  const { user, loading } = useAuth();
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-6 h-6 border-2 border-foreground border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (user) return <Navigate to="/home" replace />;
  if (isStandalone) return <Navigate to="/auth" replace />;
  return <LandingPage3 />;
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingRoute />} />
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/landing2" element={<LandingPage2 />} />
              <Route path="/landing3" element={<LandingPage3 />} />
              <Route path="/landing4" element={<LandingPage4 />} />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/product-document" element={<ProductDocument />} />
              <Route path="/auth" element={<AuthRoute />} />
              <Route path="/f/:slug" element={<LeadFormPage />} />
              <Route path="/s/:slug" element={<PublicStorefront />} />
              <Route path="/track/:orderNumber" element={<OrderTrackingPage />} />
              <Route path="/admin/*" element={<AdminRoutes />} />
              <Route path="/*" element={<ProtectedRoutes />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
