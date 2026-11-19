import React, { useState, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, X, Calendar, User, TrendingUp,
  CheckCircle2, Clock, AlertTriangle, PlayCircle, ChevronDown, ChevronUp
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

type StageStatus = 'planejado' | 'em_andamento' | 'concluido' | 'atrasado';

interface Stage {
  id: string;
  nome: string;
  responsavel: string;
  data_inicio: string;
  data_fim: string;
  progresso: number; // 0–100
  status: StageStatus;
}

// ─── Defaults ────────────────────────────────────────────────────────────────

const DEFAULT_STAGES: Omit<Stage, 'id'>[] = [
  'Planejamento', 'Terreno', 'Fundação', 'Estrutura', 'Alvenaria',
  'Elétrica', 'Hidráulica', 'Cobertura', 'Reboco', 'Contrapiso',
  'Revestimentos', 'Pintura', 'Acabamento',
].map((nome) => ({
  nome,
  responsavel: '',
  data_inicio: '',
  data_fim: '',
  progresso: 0,
  status: 'planejado' as StageStatus,
}));

const LS_KEY = 'obracalculada_schedule';

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ─── Status config ───────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<StageStatus, { label: string; color: string; icon: React.ReactNode }> = {
  planejado: {
    label: 'Planejado',
    color: 'bg-blue-100 text-blue-700',
    icon: <Clock size={12} />,
  },
  em_andamento: {
    label: 'Em andamento',
    color: 'bg-yellow-100 text-yellow-700',
    icon: <PlayCircle size={12} />,
  },
  concluido: {
    label: 'Concluído',
    color: 'bg-green-100 text-green-700',
    icon: <CheckCircle2 size={12} />,
  },
  atrasado: {
    label: 'Atrasado',
    color: 'bg-red-100 text-red-700',
    icon: <AlertTriangle size={12} />,
  },
};

function progressColor(status: StageStatus) {
  if (status === 'concluido') return 'bg-[#198754]';
  if (status === 'em_andamento') return 'bg-[#F28C28]';
  if (status === 'atrasado') return 'bg-red-500';
  return 'bg-blue-400';
}

// ─── Empty modal state ────────────────────────────────────────────────────────

const emptyForm = (): Omit<Stage, 'id'> => ({
  nome: '',
  responsavel: '',
  data_inicio: '',
  data_fim: '',
  progresso: 0,
  status: 'planejado',
});

// ─── Component ───────────────────────────────────────────────────────────────

export default function SchedulePage() {
  const [stages, setStages] = useState<Stage[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Stage | null>(null);
  const [form, setForm] = useState<Omit<Stage, 'id'>>(emptyForm());
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        setStages(JSON.parse(raw));
      } else {
        const initial: Stage[] = DEFAULT_STAGES.map((s) => ({ ...s, id: uid() }));
        setStages(initial);
        localStorage.setItem(LS_KEY, JSON.stringify(initial));
      }
    } catch {
      setStages([]);
    }
  }, []);

  function persist(next: Stage[]) {
    setStages(next);
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm());
    setModalOpen(true);
  }

  function openEdit(stage: Stage) {
    setEditing(stage);
    setForm({
      nome: stage.nome,
      responsavel: stage.responsavel,
      data_inicio: stage.data_inicio,
      data_fim: stage.data_fim,
      progresso: stage.progresso,
      status: stage.status,
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditing(null);
    setForm(emptyForm());
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nome.trim()) return;
    if (editing) {
      persist(stages.map((s) => (s.id === editing.id ? { ...editing, ...form } : s)));
    } else {
      persist([...stages, { ...form, id: uid() }]);
    }
    closeModal();
  }

  function handleDelete(id: string) {
    if (confirm('Remover esta etapa?')) persist(stages.filter((s) => s.id !== id));
  }

  function toggleExpand(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  const totalProgress =
    stages.length > 0
      ? Math.round(stages.reduce((acc, s) => acc + s.progresso, 0) / stages.length)
      : 0;

  const counts = stages.reduce(
    (acc, s) => { acc[s.status] = (acc[s.status] || 0) + 1; return acc; },
    {} as Record<StageStatus, number>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#145C3B] text-white px-6 py-6">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Calendar size={24} />
              Cronograma da Obra
            </h1>
            <p className="text-green-200 text-sm mt-1">
              {stages.length} etapas · progresso geral {totalProgress}%
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-[#F28C28] hover:bg-orange-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus size={18} /> Nova Etapa
          </button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="bg-white border-b shadow-sm px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap gap-3 mb-3">
            {(Object.keys(STATUS_CONFIG) as StageStatus[]).map((s) => (
              <span key={s} className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${STATUS_CONFIG[s].color}`}>
                {STATUS_CONFIG[s].icon}
                {STATUS_CONFIG[s].label}: {counts[s] || 0}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <TrendingUp size={16} className="text-[#198754]" />
            <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-full bg-[#198754] transition-all duration-500 rounded-full"
                style={{ width: `${totalProgress}%` }}
              />
            </div>
            <span className="text-sm font-bold text-[#145C3B] w-10 text-right">{totalProgress}%</span>
          </div>
        </div>
      </div>

      {/* Stage list */}
      <div className="max-w-4xl mx-auto px-6 py-6 space-y-3">
        {stages.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Calendar size={48} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhuma etapa cadastrada.</p>
            <p className="text-sm">Clique em "Nova Etapa" para começar.</p>
          </div>
        )}

        {stages.map((stage, idx) => {
          const cfg = STATUS_CONFIG[stage.status];
          const isExpanded = expandedId === stage.id;

          return (
            <div key={stage.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Card header */}
              <div
                className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => toggleExpand(stage.id)}
              >
                {/* Index circle */}
                <div className="w-8 h-8 rounded-full bg-[#E8F5ED] text-[#145C3B] flex items-center justify-center text-sm font-bold shrink-0">
                  {idx + 1}
                </div>

                {/* Name + status */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-gray-800 truncate">{stage.nome}</span>
                    <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${cfg.color}`}>
                      {cfg.icon} {cfg.label}
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full ${progressColor(stage.status)} transition-all duration-500 rounded-full`}
                        style={{ width: `${stage.progresso}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-gray-600 w-9 text-right">{stage.progresso}%</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 ml-2 shrink-0">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEdit(stage); }}
                    className="p-1.5 text-gray-400 hover:text-[#198754] hover:bg-green-50 rounded-lg transition-colors"
                    title="Editar"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(stage.id); }}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remover"
                  >
                    <Trash2 size={15} />
                  </button>
                  {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="border-t border-gray-100 px-5 py-4 bg-[#E8F5ED]/30 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center gap-2 text-gray-600">
                    <User size={14} className="text-[#198754]" />
                    <span className="font-medium">Responsável:</span>
                    <span>{stage.responsavel || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={14} className="text-[#198754]" />
                    <span className="font-medium">Início:</span>
                    <span>{stage.data_inicio ? new Date(stage.data_inicio + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600">
                    <Calendar size={14} className="text-[#198754]" />
                    <span className="font-medium">Fim:</span>
                    <span>{stage.data_fim ? new Date(stage.data_fim + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-5 border-b">
              <h2 className="text-lg font-bold text-[#145C3B]">
                {editing ? 'Editar Etapa' : 'Nova Etapa'}
              </h2>
              <button onClick={closeModal} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                <X size={20} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da etapa *</label>
                <input
                  type="text"
                  required
                  value={form.nome}
                  onChange={(e) => setForm({ ...form, nome: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#198754]"
                  placeholder="ex: Fundação"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Responsável</label>
                <input
                  type="text"
                  value={form.responsavel}
                  onChange={(e) => setForm({ ...form, responsavel: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#198754]"
                  placeholder="Nome do responsável"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data início</label>
                  <input
                    type="date"
                    value={form.data_inicio}
                    onChange={(e) => setForm({ ...form, data_inicio: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#198754]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data fim</label>
                  <input
                    type="date"
                    value={form.data_fim}
                    onChange={(e) => setForm({ ...form, data_fim: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#198754]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Progresso: {form.progresso}%
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={form.progresso}
                  onChange={(e) => setForm({ ...form, progresso: Number(e.target.value) })}
                  className="w-full accent-[#198754]"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>0%</span><span>50%</span><span>100%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value as StageStatus })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#198754]"
                >
                  <option value="planejado">Planejado</option>
                  <option value="em_andamento">Em andamento</option>
                  <option value="concluido">Concluído</option>
                  <option value="atrasado">Atrasado</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-medium bg-[#198754] hover:bg-[#145C3B] text-white rounded-lg transition-colors"
                >
                  {editing ? 'Salvar alterações' : 'Criar etapa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
