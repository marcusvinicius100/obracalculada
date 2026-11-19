import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Project, Expense, ShoppingListItem, Stage, Task } from '../types/database';
import { formatCurrency } from '../lib/utils';
import {
  ArrowLeft,
  LayoutDashboard,
  Calculator,
  Receipt,
  ShoppingCart,
  CalendarDays,
  CheckSquare,
  FileText,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  Info,
  PackageOpen,
} from 'lucide-react';

// ── Tab definition ────────────────────────────────────────────────────────────
type TabId =
  | 'overview'
  | 'calculators'
  | 'expenses'
  | 'shopping'
  | 'schedule'
  | 'tasks'
  | 'documents';

interface Tab {
  id: TabId;
  label: string;
  icon: React.ReactNode;
}

const TABS: Tab[] = [
  { id: 'overview',    label: 'Visão Geral',     icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: 'calculators', label: 'Calculadoras',    icon: <Calculator className="w-4 h-4" /> },
  { id: 'expenses',    label: 'Despesas',         icon: <Receipt className="w-4 h-4" /> },
  { id: 'shopping',    label: 'Lista de Compras', icon: <ShoppingCart className="w-4 h-4" /> },
  { id: 'schedule',    label: 'Cronograma',       icon: <CalendarDays className="w-4 h-4" /> },
  { id: 'tasks',       label: 'Tarefas',          icon: <CheckSquare className="w-4 h-4" /> },
  { id: 'documents',   label: 'Documentos',       icon: <FileText className="w-4 h-4" /> },
];

// ── Status badge helper ───────────────────────────────────────────────────────
const STATUS_LABELS: Record<string, string> = {
  planejamento: 'Planejamento',
  em_andamento: 'Em Andamento',
  pausado: 'Pausado',
  concluido: 'Concluído',
};

const STATUS_COLORS: Record<string, string> = {
  planejamento: 'bg-blue-100 text-blue-800',
  em_andamento: 'bg-[#E8F5ED] text-[#145C3B]',
  pausado: 'bg-yellow-100 text-yellow-800',
  concluido: 'bg-green-100 text-green-800',
};

// ── Empty-state component ─────────────────────────────────────────────────────
const EmptyState: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex flex-col items-center justify-center py-20 text-center">
    <PackageOpen className="w-14 h-14 text-[#198754]/30 mb-4" />
    <p className="font-semibold text-gray-500">Nenhum {label} cadastrado ainda.</p>
    <p className="text-xs text-gray-400 mt-1">Use os módulos correspondentes para adicionar dados.</p>
  </div>
);

// ── Tab panels ────────────────────────────────────────────────────────────────
const OverviewPanel: React.FC<{ project: Project; expenses: Expense[]; shopping: ShoppingListItem[] }> = ({
  project,
  expenses,
  shopping,
}) => {
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const totalShopping = shopping.reduce((s, i) => s + Number(i.unit_price) * Number(i.quantity), 0);
  const budget = Number(project.initial_budget) || 0;
  const spent = totalExpenses + totalShopping;
  const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;

  return (
    <div className="space-y-6">
      {/* Budget bar */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <h3 className="text-sm font-bold text-gray-700 mb-3">Resumo Orçamentário</h3>
        <div className="flex items-end justify-between mb-2">
          <span className="text-xs text-gray-500">Gasto estimado</span>
          <span className="text-sm font-black text-[#145C3B]">{formatCurrency(spent)}</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-2.5 mb-2">
          <div
            className="h-2.5 rounded-full transition-all"
            style={{
              width: `${pct}%`,
              backgroundColor: pct >= 90 ? '#dc2626' : '#198754',
            }}
          />
        </div>
        <div className="flex justify-between text-[11px] text-gray-400">
          <span>0%</span>
          <span>Orçamento: {formatCurrency(budget)}</span>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <InfoCard icon={<DollarSign className="w-5 h-5 text-[#198754]" />} label="Orçamento Inicial" value={formatCurrency(budget)} />
        <InfoCard icon={<Receipt className="w-5 h-5 text-[#F28C28]" />} label="Total Despesas" value={formatCurrency(totalExpenses)} />
        <InfoCard icon={<ShoppingCart className="w-5 h-5 text-blue-500" />} label="Lista de Compras" value={formatCurrency(totalShopping)} />
        {project.start_date && (
          <InfoCard icon={<Calendar className="w-5 h-5 text-purple-500" />} label="Início" value={new Date(project.start_date).toLocaleDateString('pt-BR')} />
        )}
        {project.address && (
          <InfoCard icon={<MapPin className="w-5 h-5 text-red-400" />} label="Endereço" value={project.address} />
        )}
        <InfoCard icon={<Clock className="w-5 h-5 text-gray-400" />} label="Criado em" value={project.created_at ? new Date(project.created_at).toLocaleDateString('pt-BR') : '—'} />
      </div>

      {/* Description */}
      {project.description && (
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-[#198754]" />
            <h3 className="text-sm font-bold text-gray-700">Observações</h3>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{project.description}</p>
        </div>
      )}
    </div>
  );
};

const InfoCard: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm flex items-center gap-3">
    <div className="p-2 rounded-xl bg-gray-50">{icon}</div>
    <div>
      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">{label}</p>
      <p className="text-sm font-bold text-gray-800 mt-0.5 break-all">{value}</p>
    </div>
  </div>
);

const ExpensesPanel: React.FC<{ expenses: Expense[] }> = ({ expenses }) => {
  if (expenses.length === 0) return <EmptyState label="despesa" />;
  return (
    <div className="space-y-3">
      {expenses.map((e) => (
        <div key={e.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between shadow-sm">
          <div>
            <p className="font-semibold text-sm text-gray-800">{e.description}</p>
            <p className="text-xs text-gray-400 mt-0.5">{e.category} · {new Date(e.expense_date).toLocaleDateString('pt-BR')}</p>
          </div>
          <span className="font-black text-[#F28C28]">{formatCurrency(Number(e.amount))}</span>
        </div>
      ))}
    </div>
  );
};

const ShoppingPanel: React.FC<{ items: ShoppingListItem[] }> = ({ items }) => {
  if (items.length === 0) return <EmptyState label="item de compra" />;
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className={`bg-white rounded-xl border p-4 flex items-center justify-between shadow-sm ${item.is_purchased ? 'opacity-50' : 'border-gray-200'}`}>
          <div className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${item.is_purchased ? 'bg-[#198754]' : 'bg-gray-200'}`} />
            <div>
              <p className="font-semibold text-sm text-gray-800">{item.name}</p>
              <p className="text-xs text-gray-400">{item.quantity} {item.unit} · {item.category}</p>
            </div>
          </div>
          <span className="font-black text-[#145C3B]">{formatCurrency(Number(item.unit_price) * Number(item.quantity))}</span>
        </div>
      ))}
    </div>
  );
};

const SchedulePanel: React.FC<{ stages: Stage[] }> = ({ stages }) => {
  if (stages.length === 0) return <EmptyState label="etapa de cronograma" />;
  return (
    <div className="space-y-3">
      {stages.sort((a, b) => a.order - b.order).map((s) => (
        <div key={s.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <p className="font-bold text-sm text-gray-800">{s.name}</p>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${STATUS_COLORS[s.status] ?? 'bg-gray-100 text-gray-600'}`}>
              {STATUS_LABELS[s.status] ?? s.status}
            </span>
          </div>
          {s.description && <p className="text-xs text-gray-500">{s.description}</p>}
          {(s.start_date || s.end_date) && (
            <p className="text-xs text-gray-400 mt-1">
              {s.start_date ? new Date(s.start_date).toLocaleDateString('pt-BR') : '?'} →{' '}
              {s.end_date ? new Date(s.end_date).toLocaleDateString('pt-BR') : '?'}
            </p>
          )}
        </div>
      ))}
    </div>
  );
};

const TasksPanel: React.FC<{ tasks: Task[] }> = ({ tasks }) => {
  if (tasks.length === 0) return <EmptyState label="tarefa" />;
  return (
    <div className="space-y-3">
      {tasks.map((t) => (
        <div key={t.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between shadow-sm">
          <p className="font-semibold text-sm text-gray-800">{t.title}</p>
          {t.due_date && (
            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(t.due_date).toLocaleDateString('pt-BR')}
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

const DocumentsPanel: React.FC = () => <EmptyState label="documento" />;

// ── Main component ─────────────────────────────────────────────────────────────
export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  // local-storage data
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [shopping, setShopping] = useState<ShoppingListItem[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Load project from Supabase
  useEffect(() => {
    if (!user || !id) return;
    setLoading(true);

    supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single()
      .then(({ data, error }) => {
        if (error || !data) {
          setNotFound(true);
        } else {
          setProject(data as Project);
        }
        setLoading(false);
      });
  }, [user, id]);

  // Load localStorage data
  useEffect(() => {
    if (!id) return;

    const raw = (key: string) => {
      try { return JSON.parse(localStorage.getItem(key) ?? '[]'); } catch { return []; }
    };

    setExpenses((raw('obra_expenses') as Expense[]).filter((e) => e.project_id === id));
    setShopping((raw('obra_shopping') as ShoppingListItem[]).filter((i) => i.project_id === id));
    setStages((raw('obra_stages') as Stage[]).filter((s) => s.project_id === id));

    // tasks come from Supabase
    if (user) {
      supabase
        .from('tasks')
        .select('*')
        .eq('project_id', id)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .then(({ data }) => {
          if (data) setTasks(data as Task[]);
        });
    }
  }, [id, user]);

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-gray-400">
        Carregando projeto...
      </div>
    );
  }

  if (notFound || !project) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
        <PackageOpen className="w-16 h-16 text-gray-300" />
        <p className="text-lg font-bold text-gray-500">Projeto não encontrado</p>
        <p className="text-sm text-gray-400">O projeto pode ter sido removido ou você não tem acesso.</p>
        <button
          onClick={() => navigate('/projetos')}
          className="mt-2 px-5 py-2.5 rounded-xl bg-[#198754] text-white font-bold text-sm"
        >
          Voltar aos Projetos
        </button>
      </div>
    );
  }

  const renderPanel = () => {
    switch (activeTab) {
      case 'overview':    return <OverviewPanel project={project} expenses={expenses} shopping={shopping} />;
      case 'expenses':    return <ExpensesPanel expenses={expenses} />;
      case 'shopping':    return <ShoppingPanel items={shopping} />;
      case 'schedule':    return <SchedulePanel stages={stages} />;
      case 'tasks':       return <TasksPanel tasks={tasks} />;
      case 'calculators': return <EmptyState label="cálculo salvo" />;
      case 'documents':   return <DocumentsPanel />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <button
          onClick={() => navigate('/projetos')}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#198754] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Projetos
        </button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3 mb-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 tracking-tight">
              {project.name}
            </h1>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${STATUS_COLORS[project.status] ?? 'bg-gray-100 text-gray-600'}`}>
              {STATUS_LABELS[project.status] ?? project.status}
            </span>
          </div>
          {project.address && (
            <p className="text-sm text-gray-400 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              {project.address}
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-none">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-[#198754] text-white shadow-sm'
                : 'bg-white text-gray-500 hover:bg-[#E8F5ED] hover:text-[#145C3B] border border-gray-200'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Panel */}
      <div>{renderPanel()}</div>
    </div>
  );
};
