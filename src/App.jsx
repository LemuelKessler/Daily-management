import { Toaster } from "sonner"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import AppLayout from '@/components/layout/AppLayout';
import Home from '@/pages/Home';
import RegionalDashboard from '@/pages/RegionalDashboard';
import HubDetail from '@/pages/HubDetail';
import ReportInput from '@/pages/ReportInput';
import HubManagement from '@/pages/HubManagement';
import LiderArea from '@/pages/LiderArea';
import RegionalConsolidadoMensal from '@/pages/RegionalConsolidadoMensal';
import HistoricoReports from '@/pages/HistoricoReports';
import DailyManagement from '@/pages/DailyManagement';
import LeftoverAnalise from '@/pages/LeftoverAnalise';
import ImportReport from '@/pages/ImportReport';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/regional/:regional" element={<RegionalDashboard />} />
        <Route path="/hub/:hubId" element={<HubDetail />} />
        <Route path="/regional/:regional/consolidado" element={<RegionalConsolidadoMensal />} />
        <Route path="/historico" element={<HistoricoReports />} />
        <Route path="/daily" element={<DailyManagement />} />
      <Route path="/leftover-analise" element={<LeftoverAnalise />} />
      <Route path="/import" element={<ImportReport />} />
        <Route path="/input" element={<ReportInput />} />
        <Route path="/hubs" element={<HubManagement />} />
      </Route>
      <Route path="/lideres" element={<LiderArea />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
