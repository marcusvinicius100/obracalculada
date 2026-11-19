import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Project, Expense, ShoppingListItem } from '../types/database';
import { formatCurrency } from '../lib/utils';
import {
  FolderKanban,
  Plus,
  MapPin,
  Archive,
  ArchiveRestore,
  Copy,
  Download,
  Upload,
  ExternalLink,
} from 'lucide-react';

// ── Helpers ───────────────────────────────────────────────────────────────────
type FilterTab = 'ativos' | 'arquivados';

function localGet<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) ?? '[]') as T[]; } catch { return []; }
}

// ── Main component ─────────────────────────────────────────────────────────────
export const ProjectsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTab, setFilterTab] = useState<FilterTab>('ativos');

  // Create modal state
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [initialBudget, setInitialBudget] = useState<number>(30000);
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ msg: string; type?: 'ok' | 'err' } | null>(null);

  // Import file input ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Load ─────────────────────────────────────────────────────────────────────
  const loadProjects = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (data) setProjects(data as Project[]);
    setLoading(false);
  };

  useEffect(() => { loadProjects(); }, [user]);

  // ── Filtered list ─────────────────────────────────────────────────────────────
  const filtered = projects.filter((p) =>
    filterTab === 'ativos' ? !p.deleted_at : !!p.deleted_at
  );

  // ── Create ────────────────────────────────────────────────────────────────────
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name) return;
    setSaving(true);
    const { error } = await supabase.from('projects').insert({
      owner_id: user.id,
      name,
      initial_budget: initialBudget,
      address,
      description,
      status: 'em_andamento',
    });
    setSaving(false);
    if (error) { showToast('Erro ao criar projeto.', 'err'); return; }
    setName(''); setDescription(''); setAddress(''); setInitialBudget(30000);
    setShowModal(false);
    loadProjects();
    showToast('Projeto criado!');
  };

  // ── Archive / Restore ─────────────────────────────────────────────────────────
  const handleArchive = async (p: Project) => {
    const newVal = p.deleted_at ? null : new Date().toISOString();
    const { error } = await supabase
      .from('projects')
      .update({ deleted_at: newVal })
      .eq('id', p.id);
    if (error) { showToast('Erro ao arquivar/restaurar.', 'err'); return; }
    showToast(newVal ? 'Projeto arquivado.' : 'Projeto restaurado.');
    loadProjects();
  };

  // ── Duplicate ─────────────────────────────────────────────────────────────────
  const handleDuplicate = async (p: Project) => {
    if (!user) return;
    const { error } = await supabase.from('projects').insert({
      owner_id: user.id,
      name: `${p.name} (Cópia)`,
      description: p.description,
      status: p.status,
      initial_budget: p.initial_budget,
      start_date: p.start_date,
      address: p.address,
    });
    if (error) { showToast('Erro ao duplicar.', 'err'); return; }
    showToast('Projeto duplicado!');
    loadProjects();
  };

  // ── Export JSON ───────────────────────────────────────────────────────────────
  const handleExport = (p: Project) => {
    const expenses: Expense[] = localGet<Expense>('obra_expenses').filter((e) => e.project_id === p.id);
    const shopping: ShoppingListItem[] = localGet<ShoppingListItem>('obra_shopping').filter((i) => i.project_id === p.id);

    const payload = {
      version: '1.0',
      exported_at: new Date().toISOString(),
      project: p,
      expenses,
      shopping_list_items: shopping,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${p.name.replace(/\s+/g, '_')}_export.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('JSON exportado!');
  };

  // ── Import JSON ───────────────────────────────────────────────────────────────
  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    try {
      const text = await file.text();
      const payload = JSON.parse(text) as {
        project?: Partial<Project>;
        expenses?: Expense[];
        shopping_list_items?: ShoppingListItem[];
      };

      if (!payload.project) {
        showToast('JSON inválido: campo "project" ausente.', 'err');
        return;
      }

      // Insert project (strip id/owner so Supabase generates new ones)
      const { id: _oldId, owner_id: _oldOwner, created_at: _c, updated_at: _u, deleted_at: _d, ...projectData } = payload.project as Project;

      const { data: newProject, error: projErr } = await supabase
        .from('projects')
        .insert({ ...projectData, owner_id: user.id })
        .select('id')
        .single();

      if (projErr || !newProject) {
        showToast('Erro ao importar projeto.', 'err');
        return;
      }

      const newId = newProject.id as string;

      // Persist expenses in localStorage
      if (payload.expenses?.length) {
        const existing: Expense[] = localGet<Expense>('obra_expenses');
        const incoming = payload.expenses.map((ex) => ({
          ...ex,
          id: crypto.randomUUID(),
          project_id: newId,
          user_id: user.id,
        }));
        localStorage.setItem('obra_expenses', JSON.stringify([...existing, ...incoming]));
      }

      // Persist shopping items in localStorage
      if (payload.shopping_list_items?.length) {
        const existing: ShoppingListItem[] = localGet<ShoppingListItem>('obra_shopping');
        const incoming = payload.shopping_list_items.map((it) => ({
          ...it,
          id: crypto.randomUUID(),
          project_id: newId,
          user_id: user.id,
        }));
        localStorage.setItem('obra_shopping', JSON.stringify([...existing, ...incoming]));
      }

      showToast('Importação concluída!');
      loadProjects();
    } catch {
      showToast('Erro ao ler o arquivo JSON.', 'err');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-lg text-sm font-semibold text-white transition-all ${
            toast.type === 'err' ? 'bg-red-500' : 'bg-[#198754]'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImportFile}
      />

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-800 tracking-tight">
            Meus Projetos
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Acompanhe o status e orçamento de cada construção ou reforma.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Import */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl font-semibold text-sm text-gray-700 border border-gray-300 bg-white hover:bg-gray-50 transition-all"
            title="Importar JSON"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Importar</span>
          </button>
          {/* New project */}
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white bg-[#198754] hover:bg-[#145C3B] transition-all"
          >
            <Plus className="w-4 h-4" />
            Novo Projeto
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['ativos', 'arquivados'] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setFilterTab(tab)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold capitalize transition-all ${
              filterTab === tab
                ? 'bg-[#198754] text-white'
                : 'bg-white text-gray-500 border border-gray-200 hover:bg-[#E8F5ED] hover:text-[#145C3B]'
            }`}
          >
            {tab === 'ativos' ? 'Ativos' : 'Arquivados'}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="p-12 text-center text-xs text-gray-400">Carregando projetos...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border text-center max-w-lg mx-auto">
          <FolderKanban className="w-12 h-12 text-[#198754] mx-auto mb-3" />
          <h3 className="font-bold text-base text-gray-800">
            {filterTab === 'ativos' ? 'Nenhum projeto ativo' : 'Nenhum projeto arquivado'}
          </h3>
          <p className="text-xs text-gray-500 mt-1 mb-4">
            {filterTab === 'ativos'
              ? 'Cadastre seu primeiro projeto para salvar orçamentos.'
              : 'Projetos arquivados aparecerão aqui.'}
          </p>
          {filterTab === 'ativos' && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-[#198754] text-white font-bold text-xs rounded-xl"
            >
              Cadastrar Obra
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p) => (
            <ProjectCard
              key={p.id}
              project={p}
              onArchive={handleArchive}
              onDuplicate={handleDuplicate}
              onExport={handleExport}
              onOpen={() => navigate(`/projetos/${p.id}`)}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-lg text-gray-800">Cadastrar Novo Projeto</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <Field label="Nome da Obra">
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Reforma Banheiro Suíte"
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </Field>
              <Field label="Orçamento Inicial (R$)">
                <input
                  type="number"
                  required
                  value={initialBudget}
                  onChange={(e) => setInitialBudget(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </Field>
              <Field label="Endereço / Local">
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Ex: Rua das Flores, 120"
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </Field>
              <Field label="Observações">
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Detalhes ou escopo da obra..."
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </Field>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-bold text-gray-500"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-[#198754] disabled:opacity-50"
                >
                  {saving ? 'Salvando…' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ── Field wrapper ─────────────────────────────────────────────────────────────
const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div>
    <label className="block text-xs font-bold text-gray-700 mb-1">{label}</label>
    {children}
  </div>
);

// ── Project Card ──────────────────────────────────────────────────────────────
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

interface CardProps {
  project: Project;
  onArchive: (p: Project) => void;
  onDuplicate: (p: Project) => void;
  onExport: (p: Project) => void;
  onOpen: () => void;
}

const ProjectCard: React.FC<CardProps> = ({ project: p, onArchive, onDuplicate, onExport, onOpen }) => {
  const isArchived = !!p.deleted_at;

  return (
    <div
      className={`bg-white p-5 rounded-2xl border shadow-sm flex flex-col justify-between transition-all ${
        isArchived ? 'border-gray-200 opacity-70' : 'border-gray-200 hover:shadow-md'
      }`}
    >
      <div>
        <div className="flex items-center justify-between mb-3">
          <span
            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              STATUS_COLORS[p.status] ?? 'bg-gray-100 text-gray-600'
            }`}
          >
            {STATUS_LABELS[p.status] ?? p.status}
          </span>
          <span className="text-xs text-gray-400">
            {p.created_at ? new Date(p.created_at).toLocaleDateString('pt-BR') : ''}
          </span>
        </div>
        <h3 className="font-extrabold text-lg text-gray-800">{p.name}</h3>
        {p.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.description}</p>}
        {p.address && (
          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5" /> {p.address}
          </p>
        )}
      </div>

      <div className="mt-5 pt-4 border-t border-gray-100">
        {/* Budget */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-[10px] font-semibold text-gray-400 block uppercase">Orçamento Inicial</span>
            <span className="font-black text-[#145C3B]">{formatCurrency(Number(p.initial_budget) || 0)}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Open detail */}
          {!isArchived && (
            <button
              onClick={onOpen}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#198754] hover:bg-[#145C3B] text-white text-xs font-bold transition-all"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Abrir
            </button>
          )}

          {/* Archive / Restore */}
          <button
            onClick={() => onArchive(p)}
            title={isArchived ? 'Restaurar' : 'Arquivar'}
            className="p-2 rounded-xl border border-gray-200 hover:bg-[#E8F5ED] hover:text-[#145C3B] text-gray-500 transition-all"
          >
            {isArchived ? <ArchiveRestore className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
          </button>

          {/* Duplicate */}
          {!isArchived && (
            <button
              onClick={() => onDuplicate(p)}
              title="Duplicar"
              className="p-2 rounded-xl border border-gray-200 hover:bg-[#E8F5ED] hover:text-[#145C3B] text-gray-500 transition-all"
            >
              <Copy className="w-4 h-4" />
            </button>
          )}

          {/* Export JSON */}
          <button
            onClick={() => onExport(p)}
            title="Exportar JSON"
            className="p-2 rounded-xl border border-gray-200 hover:bg-[#E8F5ED] hover:text-[#145C3B] text-gray-500 transition-all"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
