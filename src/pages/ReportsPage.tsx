import React, { useState, useEffect } from 'react';
import {
  BarChart2, Download, Loader2, AlertCircle, TrendingUp,
  FolderOpen, DollarSign, PieChart,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart as RechartsPie, Pie, Cell, Legend,
} from 'recharts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { formatCurrency } from '../lib/utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  expense_date: string;
  project_id: string | null;
}

interface Project {
  id: string;
  name: string;
  status: string;
  initial_budget: number;
  deleted_at: string | null;
}

const CATEGORY_COLORS: Record<string, string> = {
  material: '#198754',
  mao_de_obra: '#F28C28',
  equipamento: '#145C3B',
  transporte: '#0dcaf0',
  outros: '#6c757d',
};

const CATEGORY_LABELS: Record<string, string> = {
  material: 'Material',
  mao_de_obra: 'Mão de Obra',
  equipamento: 'Equipamento',
  transporte: 'Transporte',
  outros: 'Outros',
};

const STATUS_COLORS: Record<string, string> = {
  planejamento: '#6c757d',
  em_andamento: '#F28C28',
  concluido: '#198754',
  pausado: '#dc3545',
};

const STATUS_LABELS: Record<string, string> = {
  planejamento: 'Planejamento',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
  pausado: 'Pausado',
};

export function ReportsPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  async function loadData() {
    setLoading(true);
    setError(null);
    try {
      const [expRes, projRes] = await Promise.all([
        supabase.from('expenses').select('*').eq('user_id', user!.id),
        supabase.from('projects').select('*').eq('owner_id', user!.id).is('deleted_at', null),
      ]);
      if (expRes.error) throw expRes.error;
      if (projRes.error) throw projRes.error;
      setExpenses(expRes.data || []);
      setProjects(projRes.data || []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  }

  // Expenses by category
  const expensesByCategory = Object.entries(
    expenses.reduce<Record<string, number>>((acc, e) => {
      const cat = e.category || 'outros';
      acc[cat] = (acc[cat] || 0) + e.amount;
      return acc;
    }, {})
  ).map(([name, value]) => ({ name: CATEGORY_LABELS[name] || name, value, key: name }));

  // Projects by status
  const projectsByStatus = Object.entries(
    projects.reduce<Record<string, number>>((acc, p) => {
      const st = p.status || 'planejamento';
      acc[st] = (acc[st] || 0) + 1;
      return acc;
    }, {})
  ).map(([status, count]) => ({
    name: STATUS_LABELS[status] || status,
    value: count,
    key: status,
  }));

  // Monthly expenses (last 6 months)
  const now = new Date();
  const months: { label: string; total: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    const total = expenses
      .filter(e => {
        const eDate = new Date(e.expense_date);
        return eDate.getFullYear() === d.getFullYear() && eDate.getMonth() === d.getMonth();
      })
      .reduce((sum, e) => sum + e.amount, 0);
    months.push({ label, total });
  }

  // Budget vs realized per project
  const budgetVsReal = projects
    .slice(0, 8)
    .map(p => ({
      name: p.name.length > 15 ? p.name.slice(0, 15) + '…' : p.name,
      orcamento: p.initial_budget || 0,
      realizado: expenses.filter(e => e.project_id === p.id).reduce((s, e) => s + e.amount, 0),
    }));

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalBudget = projects.reduce((s, p) => s + (p.initial_budget || 0), 0);
  const saldo = totalBudget - totalExpenses;

  function exportPDF() {
    setExporting(true);
    try {
      const doc = new jsPDF();
      doc.setFillColor(20, 92, 59);
      doc.rect(0, 0, 210, 30, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('ObraCalculada — Relatório Financeiro', 14, 19);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 38);

      // Summary
      autoTable(doc, {
        startY: 44,
        head: [['Total de Projetos', 'Orçamento Total', 'Total Gasto', 'Saldo']],
        body: [[
          String(projects.length),
          formatCurrency(totalBudget),
          formatCurrency(totalExpenses),
          formatCurrency(saldo),
        ]],
        headStyles: { fillColor: [20, 92, 59] },
        theme: 'striped',
      });

      // Expenses by category
      autoTable(doc, {
        startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10,
        head: [['Categoria', 'Total']],
        body: expensesByCategory.map(c => [c.name, formatCurrency(c.value)]),
        headStyles: { fillColor: [25, 135, 84] },
        theme: 'striped',
        didDrawPage: () => {},
      });

      // All expenses table
      autoTable(doc, {
        startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10,
        head: [['Data', 'Descrição', 'Categoria', 'Valor']],
        body: expenses.map(e => [
          new Date(e.expense_date).toLocaleDateString('pt-BR'),
          e.description,
          CATEGORY_LABELS[e.category] || e.category,
          formatCurrency(e.amount),
        ]),
        headStyles: { fillColor: [38, 51, 45] },
        theme: 'striped',
      });

      const pageCount = (doc as unknown as { internal: { getNumberOfPages: () => number } }).internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(130, 130, 130);
        doc.text(
          'Este relatório é uma estimativa para fins de planejamento. Não possui valor contábil ou jurídico.',
          14,
          doc.internal.pageSize.height - 10
        );
      }

      doc.save(`relatorio-obracalculada-${new Date().toISOString().slice(0, 10)}.pdf`);
    } finally {
      setExporting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-brand-primary" size={36} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-6 text-red-700">
        <AlertCircle size={22} />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
            <BarChart2 className="text-brand-primary" size={28} />
            Relatórios
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">Visão consolidada dos seus projetos e despesas.</p>
        </div>
        <button
          onClick={exportPDF}
          disabled={exporting}
          className="flex items-center gap-2 bg-brand-dark text-white px-4 py-2.5 rounded-xl hover:bg-brand-dark/90 transition-colors disabled:opacity-60"
        >
          {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          Exportar PDF
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Projetos Ativos', value: String(projects.length), icon: <FolderOpen size={20} />, color: 'text-brand-primary' },
          { label: 'Orçamento Total', value: formatCurrency(totalBudget), icon: <DollarSign size={20} />, color: 'text-brand-dark' },
          { label: 'Total Gasto', value: formatCurrency(totalExpenses), icon: <TrendingUp size={20} />, color: 'text-brand-orange' },
          { label: 'Saldo Disponível', value: formatCurrency(saldo), icon: <PieChart size={20} />, color: saldo >= 0 ? 'text-brand-primary' : 'text-red-500' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <div className={`${card.color} mb-2`}>{card.icon}</div>
            <p className="text-xs text-gray-500 mb-1">{card.label}</p>
            <p className="text-lg font-bold text-brand-dark">{card.value}</p>
          </div>
        ))}
      </div>

      {expenses.length === 0 && projects.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <BarChart2 size={56} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-500 font-medium">Nenhum dado disponível</p>
          <p className="text-gray-400 text-sm mt-1">Crie projetos e registre despesas para ver os relatórios.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Expenses by category */}
          {expensesByCategory.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-semibold text-brand-dark mb-4">Gastos por Categoria</h2>
              <ResponsiveContainer width="100%" height={260}>
                <RechartsPie>
                  <Pie
                    data={expensesByCategory}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, percent }: { name: string; percent: number }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {expensesByCategory.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={CATEGORY_COLORS[entry.key] || '#ccc'}
                      />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
          )}

          {/* Projects by status */}
          {projectsByStatus.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-semibold text-brand-dark mb-4">Projetos por Status</h2>
              <ResponsiveContainer width="100%" height={260}>
                <RechartsPie>
                  <Pie
                    data={projectsByStatus}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={90}
                    label={({ name, value }: { name: string; value: number }) => `${name} (${value})`}
                    labelLine={false}
                  >
                    {projectsByStatus.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={STATUS_COLORS[entry.key] || '#ccc'}
                      />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
          )}

          {/* Monthly expenses */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="font-semibold text-brand-dark mb-4">Evolução Mensal de Despesas</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={months} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Bar dataKey="total" name="Despesas" fill="#198754" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Budget vs realized */}
          {budgetVsReal.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h2 className="font-semibold text-brand-dark mb-4">Orçamento vs Realizado</h2>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={budgetVsReal} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={(v: number) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Bar dataKey="orcamento" name="Orçamento" fill="#145C3B" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="realizado" name="Realizado" fill="#F28C28" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-gray-400 text-center pb-4">
        * Os valores exibidos são baseados nos dados inseridos pelo usuário. Não possuem validade contábil ou fiscal.
      </p>
    </div>
  );
}

export default ReportsPage;
