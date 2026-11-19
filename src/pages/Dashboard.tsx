import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Project, Expense } from '../types/database';
import { formatCurrency, formatNumber } from '../lib/utils';
import {
  FolderKanban,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Plus,
  Calculator,
  Receipt,
  ShoppingCart,
  Sparkles,
  ArrowRight,
  Wallet,
  Clock,
  PieChart as PieIcon,
  BarChart3,
  Building,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from 'recharts';

export const Dashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New Project Modal State
  const [showNewProjectModal, setShowNewProjectModal] = useState<boolean>(false);
  const [newProjectName, setNewProjectName] = useState<string>('');
  const [newProjectBudget, setNewProjectBudget] = useState<number>(50000);
  const [newProjectDesc, setNewProjectDesc] = useState<string>('');
  const [creatingProject, setCreatingProject] = useState<boolean>(false);

  useEffect(() => {
    if (!user) return;
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      // 1. Fetch real projects
      const { data: projData, error: projErr } = await supabase
        .from('projects')
        .select('*')
        .eq('owner_id', user!.id)
        .order('created_at', { ascending: false });

      if (projErr) throw projErr;

      // 2. Fetch real expenses
      const { data: expData, error: expErr } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user!.id)
        .order('expense_date', { ascending: true });

      if (expErr) throw expErr;

      setProjects((projData as Project[]) || []);
      setExpenses((expData as Expense[]) || []);
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setErrorMsg(err.message || 'Não foi possível carregar as informações.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newProjectName) return;

    setCreatingProject(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .insert({
          owner_id: user.id,
          name: newProjectName,
          description: newProjectDesc,
          initial_budget: Number(newProjectBudget) || 0,
          status: 'em_andamento',
        })
        .select()
        .single();

      if (error) throw error;

      setShowNewProjectModal(false);
      setNewProjectName('');
      setNewProjectDesc('');
      await loadDashboardData();
    } catch (err: any) {
      alert(`Erro ao criar projeto: ${err.message}`);
    } finally {
      setCreatingProject(false);
    }
  };

  // Indicators calculations
  const totalProjects = projects.length;
  const inProgressProjects = projects.filter((p) => p.status === 'em_andamento').length;
  const completedProjects = projects.filter((p) => p.status === 'concluido').length;

  const totalBudget = projects.reduce((acc, p) => acc + (Number(p.initial_budget) || 0), 0);
  const totalSpent = expenses.reduce((acc, e) => acc + (Number(e.amount) || 0), 0);
  const remainingBudget = totalBudget - totalSpent;

  // Chart 1: Expenses by category
  const categoryMap: Record<string, number> = {};
  expenses.forEach((e) => {
    const cat = e.category || 'Geral';
    categoryMap[cat] = (categoryMap[cat] || 0) + Number(e.amount);
  });
  const categoryData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));

  // Chart 2: Planned vs Realized per project
  const projectComparisonData = projects.slice(0, 5).map((p) => {
    const pSpent = expenses
      .filter((e) => e.project_id === p.id)
      .reduce((acc, e) => acc + Number(e.amount), 0);
    return {
      name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
      planejado: Number(p.initial_budget) || 0,
      realizado: pSpent,
    };
  });

  // Chart 3: Expenses evolution over time
  const expensesTimeline = expenses.map((e) => ({
    date: e.expense_date ? new Date(e.expense_date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) : 'Data',
    valor: Number(e.amount),
  }));

  const COLORS = ['#198754', '#F28C28', '#145C3B', '#3B82F6', '#8B5CF6', '#EC4899'];

  return (
    <div className="space-y-8">
      {/* Welcome & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-grayDark tracking-tight">
            Olá, {profile?.name?.split(' ')[0] || user?.email?.split('@')[0]} 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Aqui está a visão geral em tempo real de suas obras e custos.
          </p>
        </div>

        <button
          onClick={() => setShowNewProjectModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white bg-brand-primary hover:bg-brand-dark shadow-md shadow-brand-primary/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Novo Projeto
        </button>
      </div>

      {/* Quick Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <button
          onClick={() => setShowNewProjectModal(true)}
          className="flex flex-col items-center justify-center p-3.5 bg-white border border-gray-200/80 hover:border-brand-primary/50 hover:bg-brand-light/20 rounded-2xl transition-all group shadow-sm text-center"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-light text-brand-primary group-hover:scale-105 transition-transform flex items-center justify-center mb-2">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-gray-700 group-hover:text-brand-dark">Novo Projeto</span>
        </button>

        <Link
          to="/calculadoras"
          className="flex flex-col items-center justify-center p-3.5 bg-white border border-gray-200/80 hover:border-brand-primary/50 hover:bg-brand-light/20 rounded-2xl transition-all group shadow-sm text-center"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-light text-brand-primary group-hover:scale-105 transition-transform flex items-center justify-center mb-2">
            <Calculator className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-gray-700 group-hover:text-brand-dark">Calculadoras</span>
        </Link>

        <Link
          to="/despesas"
          className="flex flex-col items-center justify-center p-3.5 bg-white border border-gray-200/80 hover:border-brand-primary/50 hover:bg-brand-light/20 rounded-2xl transition-all group shadow-sm text-center"
        >
          <div className="w-10 h-10 rounded-xl bg-orange-50 text-brand-orange group-hover:scale-105 transition-transform flex items-center justify-center mb-2">
            <Receipt className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-gray-700 group-hover:text-brand-dark">Registrar Despesa</span>
        </Link>

        <Link
          to="/lista-compras"
          className="flex flex-col items-center justify-center p-3.5 bg-white border border-gray-200/80 hover:border-brand-primary/50 hover:bg-brand-light/20 rounded-2xl transition-all group shadow-sm text-center"
        >
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 group-hover:scale-105 transition-transform flex items-center justify-center mb-2">
            <ShoppingCart className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold text-gray-700 group-hover:text-brand-dark">Lista de Compras</span>
        </Link>

        <Link
          to="/ia"
          className="col-span-2 sm:col-span-1 flex flex-col items-center justify-center p-3.5 bg-gradient-to-br from-brand-dark to-brand-primary text-white rounded-2xl transition-all shadow-sm group text-center"
        >
          <div className="w-10 h-10 rounded-xl bg-white/20 text-white group-hover:scale-105 transition-transform flex items-center justify-center mb-2">
            <Sparkles className="w-5 h-5 text-amber-300" />
          </div>
          <span className="text-xs font-bold text-white">Obra IA</span>
        </Link>
      </div>

      {/* Metric Indicator Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Total Projetos */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold">Total de Projetos</span>
            <FolderKanban className="w-4 h-4 text-brand-primary" />
          </div>
          <span className="text-2xl font-black text-brand-grayDark">{totalProjects}</span>
          <span className="text-[11px] text-gray-400 mt-1">cadastrados</span>
        </div>

        {/* Em Andamento */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold">Em Andamento</span>
            <Clock className="w-4 h-4 text-brand-orange" />
          </div>
          <span className="text-2xl font-black text-brand-orange">{inProgressProjects}</span>
          <span className="text-[11px] text-gray-400 mt-1">obras ativas</span>
        </div>

        {/* Concluídos */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold">Concluídos</span>
            <CheckCircle2 className="w-4 h-4 text-brand-primary" />
          </div>
          <span className="text-2xl font-black text-brand-primary">{completedProjects}</span>
          <span className="text-[11px] text-gray-400 mt-1">finalizados</span>
        </div>

        {/* Orçamento Total */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold">Orçamento Total</span>
            <Wallet className="w-4 h-4 text-blue-600" />
          </div>
          <span className="text-lg font-black text-brand-grayDark truncate">{formatCurrency(totalBudget)}</span>
          <span className="text-[11px] text-gray-400 mt-1">planejado</span>
        </div>

        {/* Total Gasto */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold">Total Gasto</span>
            <Receipt className="w-4 h-4 text-red-500" />
          </div>
          <span className="text-lg font-black text-red-600 truncate">{formatCurrency(totalSpent)}</span>
          <span className="text-[11px] text-gray-400 mt-1">despesas pagas</span>
        </div>

        {/* Saldo Disponível */}
        <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 mb-2">
            <span className="text-xs font-semibold">Saldo Disponível</span>
            <TrendingUp className="w-4 h-4 text-brand-primary" />
          </div>
          <span className={`text-lg font-black truncate ${remainingBudget < 0 ? 'text-red-600' : 'text-brand-dark'}`}>
            {formatCurrency(remainingBudget)}
          </span>
          <span className="text-[11px] text-gray-400 mt-1">restante</span>
        </div>
      </div>

      {/* Main Content: Charts or Empty State */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center bg-white rounded-2xl border border-gray-200">
          <div className="w-8 h-8 border-3 border-brand-primary border-t-transparent rounded-full animate-spin mb-3" />
          <p className="text-xs text-gray-500">Buscando dados no Supabase...</p>
        </div>
      ) : totalProjects === 0 ? (
        /* Friendly Empty State */
        <div className="bg-white rounded-3xl border border-gray-200 p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-brand-light text-brand-primary mx-auto flex items-center justify-center mb-5">
            <Building className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-brand-grayDark">Nenhum projeto cadastrado ainda</h2>
          <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
            Comece cadastrando sua primeira obra ou reforma. Você poderá salvar cálculos de materiais, gerenciar despesas e emitir relatórios.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => setShowNewProjectModal(true)}
              className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm text-white bg-brand-primary hover:bg-brand-dark shadow-md transition-all flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Criar Primeiro Projeto
            </button>
            <Link
              to="/calculadoras"
              className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm text-brand-dark bg-brand-light hover:bg-brand-light/80 transition-all text-center"
            >
              Experimentar Calculadoras
            </Link>
          </div>
        </div>
      ) : (
        /* Real Charts Grid */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Gastos por Categoria */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-brand-grayDark">Gastos por Categoria</h3>
                <p className="text-xs text-gray-500">Distribuição real dos insumos da obra</p>
              </div>
              <PieIcon className="w-5 h-5 text-gray-400" />
            </div>

            {categoryData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-gray-400 text-xs">
                Nenhuma despesa registrada ainda para compor o gráfico.
              </div>
            )}
          </div>

          {/* Chart 2: Planejado vs Realizado */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-brand-grayDark">Orçamento Planejado vs Realizado</h3>
                <p className="text-xs text-gray-500">Comparação financeira por projeto</p>
              </div>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v / 1000}k`} />
                  <Tooltip formatter={(val: any) => formatCurrency(Number(val))} />
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="planejado" fill="#198754" name="Planejado" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="realizado" fill="#F28C28" name="Gasto Real" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Evolução dos Gastos */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4 lg:col-span-2">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-brand-grayDark">Evolução Cronológica de Despesas</h3>
                <p className="text-xs text-gray-500">Histórico de lançamentos ao longo do tempo</p>
              </div>
              <TrendingUp className="w-5 h-5 text-gray-400" />
            </div>

            {expensesTimeline.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={expensesTimeline}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `R$${v}`} />
                    <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                    <Line
                      type="monotone"
                      dataKey="valor"
                      stroke="#145C3B"
                      strokeWidth={3}
                      name="Despesa Lançada"
                      dot={{ r: 4, fill: '#F28C28' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-64 flex flex-col items-center justify-center text-gray-400 text-xs">
                Adicione lançamentos em Despesas para visualizar a curva temporal.
              </div>
            )}
          </div>
        </div>
      )}

      {/* New Project Modal */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-gray-100">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-lg text-brand-grayDark">Cadastrar Novo Projeto</h3>
              <button
                onClick={() => setShowNewProjectModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nome do Projeto / Obra</label>
                <input
                  type="text"
                  required
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="Ex: Reforma da Cozinha ou Casa Jardim"
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Orçamento Planejado (R$)</label>
                <input
                  type="number"
                  step="100"
                  required
                  value={newProjectBudget}
                  onChange={(e) => setNewProjectBudget(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Descrição / Localização</label>
                <textarea
                  rows={2}
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="Notas preliminares da reforma..."
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-brand-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowNewProjectModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-500 hover:text-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creatingProject}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-brand-primary hover:bg-brand-dark transition-all disabled:opacity-50"
                >
                  {creatingProject ? 'Criando...' : 'Salvar Projeto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
