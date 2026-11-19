import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ForgotPassword } from './pages/ForgotPassword';
import { Dashboard } from './pages/Dashboard';
import { CalculatorsPage } from './pages/CalculatorsPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { ExpensesPage } from './pages/ExpensesPage';
import { ShoppingListPage } from './pages/ShoppingListPage';
import { AIPage } from './pages/AIPage';
import SchedulePage from './pages/SchedulePage';
import ChecklistPage from './pages/ChecklistPage';
import PriceComparatorPage from './pages/PriceComparatorPage';
import FloorPlanPage from './pages/FloorPlanPage';
import { RenovationSimulatorPage } from './pages/RenovationSimulatorPage';
import QuoteGeneratorPage from './pages/QuoteGeneratorPage';
import { ReportsPage } from './pages/ReportsPage';
import { ProfilePage } from './pages/ProfilePage';
import { HelpPage } from './pages/HelpPage';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cadastro" element={<Register />} />
          <Route path="/recuperar-senha" element={<ForgotPassword />} />

          {/* Protected Routes (AppLayout with Desktop Sidebar & Mobile Bottom Nav) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/calculadoras" element={<CalculatorsPage />} />
            <Route path="/projetos" element={<ProjectsPage />} />
            <Route path="/projetos/:id" element={<ProjectDetailPage />} />
            <Route path="/despesas" element={<ExpensesPage />} />
            <Route path="/lista-compras" element={<ShoppingListPage />} />
            <Route path="/cronograma" element={<SchedulePage />} />
            <Route path="/checklist" element={<ChecklistPage />} />
            <Route path="/comparador-precos" element={<PriceComparatorPage />} />
            <Route path="/planta-baixa" element={<FloorPlanPage />} />
            <Route path="/simulador-reforma" element={<RenovationSimulatorPage />} />
            <Route path="/gerador-orcamentos" element={<QuoteGeneratorPage />} />
            <Route path="/relatorios" element={<ReportsPage />} />
            <Route path="/obra-ia" element={<AIPage />} />
            <Route path="/ia" element={<Navigate to="/obra-ia" replace />} />
            <Route path="/perfil" element={<ProfilePage />} />
            <Route path="/ajuda" element={<HelpPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
