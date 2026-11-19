import React, { useState, useEffect } from 'react';
import { FileText, Download, Share2, Loader2, AlertCircle, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  initial_budget: number | null;
  start_date: string | null;
  address: string | null;
  created_at: string;
}

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  expense_date: string;
}

interface ShoppingListItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unit_price: number;
  category: string;
  is_purchased: boolean;
}

interface Calculation {
  id: string;
  calculator_type: string;
  title: string;
  inputs: Record<string, unknown>;
  outputs: Record<string, unknown>;
  created_at: string;
}

type PdfType =
  | 'Orçamento de Materiais'
  | 'Mão de Obra'
  | 'Completo'
  | 'Relatório Financeiro'
  | 'Lista de Compras';

const PDF_TYPES: PdfType[] = [
  'Orçamento de Materiais',
  'Mão de Obra',
  'Completo',
  'Relatório Financeiro',
  'Lista de Compras',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('pt-BR');
};

// ─── PDF Builder ─────────────────────────────────────────────────────────────

function buildPdf(
  type: PdfType,
  project: Project,
  expenses: Expense[],
  items: ShoppingListItem[],
  calculations: Calculation[]
): jsPDF {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const BRAND_DARK = '#145C3B';
  const BRAND_LIGHT = '#E8F5ED';
  const BRAND_ORANGE = '#F28C28';
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;

  // ── Header ──────────────────────────────────────────────────────────────
  doc.setFillColor(BRAND_DARK);
  doc.rect(0, 0, pageWidth, 28, 'F');

  doc.setTextColor('#FFFFFF');
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('ObraCalculada', margin, 12);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(type, margin, 20);
  doc.text(`Gerado em ${new Date().toLocaleDateString('pt-BR')}`, pageWidth - margin, 20, { align: 'right' });

  // ── Project Info ─────────────────────────────────────────────────────────
  doc.setTextColor('#000000');
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(`Projeto: ${project.name}`, margin, 36);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor('#444444');
  const infoLines = [
    `Status: ${project.status}`,
    `Orçamento Inicial: ${formatCurrency(project.initial_budget ?? 0)}`,
    project.start_date ? `Início: ${formatDate(project.start_date)}` : null,
    project.address ? `Endereço: ${project.address}` : null,
    project.description ? `Descrição: ${project.description}` : null,
  ].filter(Boolean) as string[];
  doc.text(infoLines, margin, 42);

  let cursorY = 42 + infoLines.length * 5 + 4;

  // ── Sections by type ─────────────────────────────────────────────────────

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalItems = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const budget = project.initial_budget ?? 0;

  if (type === 'Orçamento de Materiais' || type === 'Completo') {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(BRAND_DARK);
    doc.text('Lista de Compras / Materiais', margin, cursorY);
    cursorY += 4;

    if (items.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor('#888888');
      doc.text('Nenhum item na lista de compras.', margin, cursorY + 6);
      cursorY += 12;
    } else {
      autoTable(doc, {
        startY: cursorY,
        head: [['Item', 'Categoria', 'Qtd', 'Unid.', 'Preço Unit.', 'Total', 'Comprado']],
        body: items.map((i) => [
          i.name,
          i.category,
          i.quantity,
          i.unit,
          formatCurrency(i.unit_price),
          formatCurrency(i.quantity * i.unit_price),
          i.is_purchased ? 'Sim' : 'Não',
        ]),
        headStyles: { fillColor: BRAND_DARK, textColor: '#FFFFFF', fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        alternateRowStyles: { fillColor: BRAND_LIGHT },
        margin: { left: margin, right: margin },
      });
      cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
    }
  }

  if (type === 'Mão de Obra' || type === 'Completo' || type === 'Relatório Financeiro') {
    // Group expenses by category
    const byCategory: Record<string, Expense[]> = {};
    expenses.forEach((e) => {
      byCategory[e.category] = byCategory[e.category] ?? [];
      byCategory[e.category].push(e);
    });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(BRAND_DARK);
    doc.text('Despesas / Mão de Obra', margin, cursorY);
    cursorY += 4;

    if (expenses.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor('#888888');
      doc.text('Nenhuma despesa lançada.', margin, cursorY + 6);
      cursorY += 12;
    } else {
      autoTable(doc, {
        startY: cursorY,
        head: [['Descrição', 'Categoria', 'Data', 'Valor']],
        body: expenses.map((e) => [
          e.description,
          e.category,
          formatDate(e.expense_date),
          formatCurrency(e.amount),
        ]),
        foot: [['', '', 'Total', formatCurrency(totalExpenses)]],
        headStyles: { fillColor: BRAND_DARK, textColor: '#FFFFFF', fontSize: 8 },
        footStyles: { fillColor: BRAND_ORANGE, textColor: '#FFFFFF', fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8 },
        alternateRowStyles: { fillColor: BRAND_LIGHT },
        margin: { left: margin, right: margin },
      });
      cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
    }
  }

  if (type === 'Lista de Compras') {
    const purchased = items.filter((i) => i.is_purchased);
    const pending = items.filter((i) => !i.is_purchased);

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(BRAND_DARK);
    doc.text('Lista de Compras', margin, cursorY);
    cursorY += 4;

    if (items.length === 0) {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(9);
      doc.setTextColor('#888888');
      doc.text('Lista vazia.', margin, cursorY + 6);
      cursorY += 12;
    } else {
      autoTable(doc, {
        startY: cursorY,
        head: [['Item', 'Categoria', 'Qtd', 'Unid.', 'Preço Unit.', 'Total', 'Status']],
        body: [
          ...pending.map((i) => [i.name, i.category, i.quantity, i.unit, formatCurrency(i.unit_price), formatCurrency(i.quantity * i.unit_price), '⬜ Pendente']),
          ...purchased.map((i) => [i.name, i.category, i.quantity, i.unit, formatCurrency(i.unit_price), formatCurrency(i.quantity * i.unit_price), '✅ Comprado']),
        ],
        foot: [['', '', '', '', 'Total estimado', formatCurrency(totalItems), '']],
        headStyles: { fillColor: BRAND_DARK, textColor: '#FFFFFF', fontSize: 8 },
        footStyles: { fillColor: BRAND_ORANGE, textColor: '#FFFFFF', fontSize: 8, fontStyle: 'bold' },
        bodyStyles: { fontSize: 8 },
        alternateRowStyles: { fillColor: BRAND_LIGHT },
        margin: { left: margin, right: margin },
      });
      cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
    }
  }

  if (type === 'Completo' || type === 'Relatório Financeiro') {
    // Calculations summary
    if (calculations.length > 0) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(BRAND_DARK);
      doc.text('Cálculos Realizados', margin, cursorY);
      cursorY += 4;

      autoTable(doc, {
        startY: cursorY,
        head: [['Título', 'Tipo', 'Data']],
        body: calculations.map((c) => [c.title, c.calculator_type, formatDate(c.created_at)]),
        headStyles: { fillColor: BRAND_DARK, textColor: '#FFFFFF', fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        alternateRowStyles: { fillColor: BRAND_LIGHT },
        margin: { left: margin, right: margin },
      });
      cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
    }
  }

  // ── Financial Summary ────────────────────────────────────────────────────
  if (type === 'Completo' || type === 'Relatório Financeiro') {
    const totalGasto = totalExpenses + totalItems;
    const saldo = budget - totalGasto;

    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(BRAND_DARK);
    doc.text('Resumo Financeiro', margin, cursorY);
    cursorY += 4;

    autoTable(doc, {
      startY: cursorY,
      head: [['Item', 'Valor']],
      body: [
        ['Orçamento Inicial', formatCurrency(budget)],
        ['Total em Despesas', formatCurrency(totalExpenses)],
        ['Total em Materiais', formatCurrency(totalItems)],
        ['Total Gasto', formatCurrency(totalGasto)],
        [saldo >= 0 ? 'Saldo Disponível' : 'Estouro de Orçamento', formatCurrency(Math.abs(saldo))],
      ],
      headStyles: { fillColor: BRAND_DARK, textColor: '#FFFFFF', fontSize: 9 },
      bodyStyles: { fontSize: 9 },
      alternateRowStyles: { fillColor: BRAND_LIGHT },
      columnStyles: { 1: { halign: 'right' } },
      margin: { left: margin, right: margin },
      didParseCell: (data) => {
        if (data.row.index === 4 && data.section === 'body') {
          data.cell.styles.textColor = saldo >= 0 ? '#145C3B' : '#DC2626';
          data.cell.styles.fontStyle = 'bold';
        }
      },
    });
    cursorY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 6;
  }

  // ── Footer ───────────────────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFillColor('#F0F0F0');
    doc.rect(0, pageHeight - 14, pageWidth, 14, 'F');
    doc.setFontSize(7);
    doc.setTextColor('#666666');
    doc.setFont('helvetica', 'italic');
    doc.text(
      'Documento gerado automaticamente. Valores são estimativas sujeitas a variação de mercado.',
      margin,
      pageHeight - 7
    );
    doc.text(`Página ${p} de ${totalPages}`, pageWidth - margin, pageHeight - 7, { align: 'right' });
  }

  return doc;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function QuoteGeneratorPage() {
  const { user } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [pdfType, setPdfType] = useState<PdfType>('Completo');
  const [loading, setLoading] = useState(false);
  const [fetchingProjects, setFetchingProjects] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFilename, setLastFilename] = useState<string | null>(null);
  const [lastPdfDataUrl, setLastPdfDataUrl] = useState<string | null>(null);

  // Fetch projects on mount
  useEffect(() => {
    if (!user) return;
    setFetchingProjects(true);
    supabase
      .from('projects')
      .select('id, name, description, status, initial_budget, start_date, address, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .then(({ data, error: err }) => {
        if (err) setError(err.message);
        else setProjects(data ?? []);
        setFetchingProjects(false);
      });
  }, [user]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId) ?? null;

  async function handleGenerate() {
    if (!selectedProject) return;
    setError(null);
    setLoading(true);
    setLastFilename(null);
    setLastPdfDataUrl(null);

    try {
      const [expRes, itemRes, calcRes] = await Promise.all([
        supabase
          .from('expenses')
          .select('id, description, amount, category, expense_date')
          .eq('project_id', selectedProjectId)
          .order('expense_date', { ascending: false }),
        supabase
          .from('shopping_list_items')
          .select('id, name, quantity, unit, unit_price, category, is_purchased')
          .eq('project_id', selectedProjectId)
          .order('created_at', { ascending: false }),
        supabase
          .from('calculations')
          .select('id, calculator_type, title, inputs, outputs, created_at')
          .eq('project_id', selectedProjectId)
          .order('created_at', { ascending: false }),
      ]);

      if (expRes.error) throw new Error(expRes.error.message);
      if (itemRes.error) throw new Error(itemRes.error.message);
      if (calcRes.error) throw new Error(calcRes.error.message);

      const expenses: Expense[] = expRes.data ?? [];
      const items: ShoppingListItem[] = itemRes.data ?? [];
      const calculations: Calculation[] = calcRes.data ?? [];

      const doc = buildPdf(pdfType, selectedProject, expenses, items, calculations);
      const filename = `ObraCalculada_${selectedProject.name.replace(/\s+/g, '_')}_${pdfType.replace(/\s+/g, '_')}_${Date.now()}.pdf`;
      doc.save(filename);

      const dataUrl = doc.output('datauristring');
      setLastFilename(filename);
      setLastPdfDataUrl(dataUrl);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao gerar PDF');
    } finally {
      setLoading(false);
    }
  }

  function handleShareWhatsApp() {
    if (!selectedProject) return;
    const text = encodeURIComponent(
      `📋 *${pdfType} — ${selectedProject.name}*\n\nGerado pelo ObraCalculada.\nAcesse o app para visualizar o relatório completo.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-xl" style={{ background: '#145C3B' }}>
            <FileText className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: '#145C3B' }}>
              Gerador de Orçamentos
            </h1>
            <p className="text-sm text-gray-500">Crie PDFs profissionais dos seus projetos</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow p-6 space-y-6">
          {/* Project Select */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Projeto
            </label>
            {fetchingProjects ? (
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" /> Carregando projetos…
              </div>
            ) : (
              <div className="relative">
                <select
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 pr-10 appearance-none focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': '#198754' } as React.CSSProperties}
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                >
                  <option value="">— Selecione um projeto —</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.status})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            )}
          </div>

          {/* PDF Type Select */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Tipo de Documento
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {PDF_TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setPdfType(t)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-medium transition-all"
                  style={
                    pdfType === t
                      ? { background: '#145C3B', color: '#fff', borderColor: '#145C3B' }
                      : { background: '#fff', color: '#374151', borderColor: '#D1D5DB' }
                  }
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Project Preview */}
          {selectedProject && (
            <div
              className="rounded-xl p-4 text-sm space-y-1"
              style={{ background: '#E8F5ED' }}
            >
              <p className="font-semibold" style={{ color: '#145C3B' }}>
                {selectedProject.name}
              </p>
              <p className="text-gray-600">
                Orçamento: {formatCurrency(selectedProject.initial_budget ?? 0)} · Status:{' '}
                {selectedProject.status}
              </p>
              {selectedProject.start_date && (
                <p className="text-gray-500">Início: {formatDate(selectedProject.start_date)}</p>
              )}
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleGenerate}
              disabled={!selectedProjectId || loading}
              className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: loading || !selectedProjectId ? '#9CA3AF' : '#145C3B' }}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              {loading ? 'Gerando PDF…' : 'Gerar & Baixar PDF'}
            </button>

            <button
              onClick={handleShareWhatsApp}
              disabled={!selectedProjectId}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: '#25D366', color: '#fff' }}
            >
              <Share2 className="w-4 h-4" />
              WhatsApp
            </button>
          </div>

          {lastFilename && (
            <div className="text-xs text-green-700 bg-green-50 rounded-lg px-4 py-2 flex items-center gap-2">
              ✅ PDF gerado: <span className="font-mono">{lastFilename}</span>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-800">
          <strong>⚠️ Aviso:</strong> Documento gerado automaticamente. Valores são estimativas
          sujeitas a variação de mercado.
        </div>
      </div>
    </div>
  );
}
