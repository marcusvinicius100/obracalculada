import React, { useState, useEffect } from 'react';
import {
  Plus, Trash2, X, CheckSquare, Square, ClipboardList,
  ChevronDown, ChevronUp, Edit2, AlertCircle
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ChecklistItem {
  id: string;
  texto: string;
  concluido: boolean;
  prazo: string;
  observacao: string;
}

interface Checklist {
  id: string;
  titulo: string;
  items: ChecklistItem[];
}

// ─── Constants ───────────────────────────────────────────────────────────────

const LS_KEY = 'obracalculada_checklists';

const PRESET_TITLES = ['Materiais', 'Ferramentas', 'Documentação', 'Acabamento', 'Personalizado'];

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

const DEFAULT_CHECKLISTS: Checklist[] = [
  {
    id: uid(),
    titulo: 'Materiais',
    items: [
      { id: uid(), texto: 'Cimento', concluido: false, prazo: '', observacao: '' },
      { id: uid(), texto: 'Areia', concluido: false, prazo: '', observacao: '' },
      { id: uid(), texto: 'Tijolos', concluido: false, prazo: '', observacao: '' },
    ],
  },
  {
    id: uid(),
    titulo: 'Documentação',
    items: [
      { id: uid(), texto: 'Alvará de construção', concluido: false, prazo: '', observacao: '' },
      { id: uid(), texto: 'Projeto aprovado', concluido: false, prazo: '', observacao: '' },
    ],
  },
];

// ─── Helper ───────────────────────────────────────────────────────────────────

function progress(list: Checklist) {
  if (!list.items.length) return 0;
  return Math.round((list.items.filter((i) => i.concluido).length / list.items.length) * 100);
}

function progressColor(pct: number) {
  if (pct === 100) return 'bg-[#198754]';
  if (pct >= 50) return 'bg-[#F28C28]';
  return 'bg-blue-400';
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ChecklistPage() {
  const [checklists, setChecklists] = useState<Checklist[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Modal: new checklist
  const [newListModal, setNewListModal] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [newListPreset, setNewListPreset] = useState(PRESET_TITLES[0]);

  // Modal: add item
  const [addItemModal, setAddItemModal] = useState<{ listId: string } | null>(null);
  const [itemForm, setItemForm] = useState({ texto: '', prazo: '', observacao: '' });

  // Edit list title
  const [editingTitle, setEditingTitle] = useState<{ id: string; value: string } | null>(null);

  // Load from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        setChecklists(JSON.parse(raw));
      } else {
        setChecklists(DEFAULT_CHECKLISTS);
        localStorage.setItem(LS_KEY, JSON.stringify(DEFAULT_CHECKLISTS));
      }
    } catch {
      setChecklists([]);
    }
  }, []);

  function persist(next: Checklist[]) {
    setChecklists(next);
    localStorage.setItem(LS_KEY, JSON.stringify(next));
  }

  // ── List actions ─────────────────────────────────────────────────────────

  function createList() {
    const title = newListPreset === 'Personalizado' ? newListTitle.trim() : newListPreset;
    if (!title) return;
    const newList: Checklist = { id: uid(), titulo: title, items: [] };
    const next = [...checklists, newList];
    persist(next);
    setExpandedId(newList.id);
    setNewListModal(false);
    setNewListTitle('');
    setNewListPreset(PRESET_TITLES[0]);
  }

  function deleteList(id: string) {
    if (confirm('Remover esta lista?')) persist(checklists.filter((c) => c.id !== id));
  }

  function saveTitle(id: string, value: string) {
    if (!value.trim()) return;
    persist(checklists.map((c) => (c.id === id ? { ...c, titulo: value.trim() } : c)));
    setEditingTitle(null);
  }

  // ── Item actions ──────────────────────────────────────────────────────────

  function toggleItem(listId: string, itemId: string) {
    persist(
      checklists.map((c) =>
        c.id === listId
          ? { ...c, items: c.items.map((i) => (i.id === itemId ? { ...i, concluido: !i.concluido } : i)) }
          : c
      )
    );
  }

  function addItem(listId: string) {
    if (!itemForm.texto.trim()) return;
    const item: ChecklistItem = {
      id: uid(),
      texto: itemForm.texto.trim(),
      concluido: false,
      prazo: itemForm.prazo,
      observacao: itemForm.observacao,
    };
    persist(
      checklists.map((c) => (c.id === listId ? { ...c, items: [...c.items, item] } : c))
    );
    setItemForm({ texto: '', prazo: '', observacao: '' });
    setAddItemModal(null);
  }

  function deleteItem(listId: string, itemId: string) {
    persist(
      checklists.map((c) =>
        c.id === listId ? { ...c, items: c.items.filter((i) => i.id !== itemId) } : c
      )
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#145C3B] text-white px-6 py-6">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <ClipboardList size={24} />
              Checklists da Obra
            </h1>
            <p className="text-green-200 text-sm mt-1">
              {checklists.length} listas · {checklists.reduce((acc, c) => acc + c.items.length, 0)} itens
            </p>
          </div>
          <button
            onClick={() => setNewListModal(true)}
            className="flex items-center gap-2 bg-[#F28C28] hover:bg-orange-500 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Plus size={18} /> Nova Lista
          </button>
        </div>
      </div>

      {/* Lists */}
      <div className="max-w-3xl mx-auto px-6 py-6 space-y-4">
        {checklists.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <ClipboardList size={48} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">Nenhuma lista criada.</p>
            <p className="text-sm">Clique em "Nova Lista" para começar.</p>
          </div>
        )}

        {checklists.map((list) => {
          const pct = progress(list);
          const isExpanded = expandedId === list.id;
          const done = list.items.filter((i) => i.concluido).length;

          return (
            <div key={list.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              {/* List header */}
              <div
                className="flex items-center gap-3 px-5 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedId((prev) => (prev === list.id ? null : list.id))}
              >
                <div className="flex-1 min-w-0">
                  {/* Title row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {editingTitle?.id === list.id ? (
                      <input
                        autoFocus
                        type="text"
                        value={editingTitle.value}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setEditingTitle({ id: list.id, value: e.target.value })}
                        onBlur={() => saveTitle(list.id, editingTitle.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveTitle(list.id, editingTitle.value);
                          if (e.key === 'Escape') setEditingTitle(null);
                        }}
                        className="border border-[#198754] rounded px-2 py-0.5 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#198754]"
                      />
                    ) : (
                      <span className="font-semibold text-gray-800 truncate">{list.titulo}</span>
                    )}

                    {/* Progress badge */}
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full text-white ${progressColor(pct)}`}
                    >
                      {done}/{list.items.length} · {pct}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-2 flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full ${progressColor(pct)} transition-all duration-500 rounded-full`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 ml-2 shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingTitle({ id: list.id, value: list.titulo });
                    }}
                    className="p-1.5 text-gray-400 hover:text-[#198754] hover:bg-green-50 rounded-lg transition-colors"
                    title="Renomear"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); deleteList(list.id); }}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remover lista"
                  >
                    <Trash2 size={15} />
                  </button>
                  {isExpanded ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
                </div>
              </div>

              {/* Items */}
              {isExpanded && (
                <div className="border-t border-gray-100">
                  {list.items.length === 0 && (
                    <p className="text-sm text-gray-400 px-5 py-4 italic">Nenhum item. Adicione abaixo.</p>
                  )}

                  {list.items.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-start gap-3 px-5 py-3 border-b border-gray-50 hover:bg-gray-50 transition-colors ${item.concluido ? 'opacity-60' : ''}`}
                    >
                      {/* Checkbox */}
                      <button
                        onClick={() => toggleItem(list.id, item.id)}
                        className={`mt-0.5 shrink-0 ${item.concluido ? 'text-[#198754]' : 'text-gray-300 hover:text-[#198754]'} transition-colors`}
                      >
                        {item.concluido ? <CheckSquare size={20} /> : <Square size={20} />}
                      </button>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${item.concluido ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                          {item.texto}
                        </p>
                        <div className="flex flex-wrap gap-3 mt-1">
                          {item.prazo && (
                            <span className="flex items-center gap-1 text-xs text-orange-600">
                              <AlertCircle size={11} />
                              Prazo: {new Date(item.prazo + 'T00:00:00').toLocaleDateString('pt-BR')}
                            </span>
                          )}
                          {item.observacao && (
                            <span className="text-xs text-gray-400 italic truncate max-w-xs">{item.observacao}</span>
                          )}
                        </div>
                      </div>

                      {/* Delete item */}
                      <button
                        onClick={() => deleteItem(list.id, item.id)}
                        className="p-1 text-gray-300 hover:text-red-400 transition-colors shrink-0"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}

                  {/* Add item button */}
                  <div className="px-5 py-3">
                    <button
                      onClick={() => { setAddItemModal({ listId: list.id }); setItemForm({ texto: '', prazo: '', observacao: '' }); }}
                      className="flex items-center gap-2 text-sm text-[#198754] hover:text-[#145C3B] font-medium transition-colors"
                    >
                      <Plus size={16} /> Adicionar item
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Modal: New list ───────────────────────────────────────────────── */}
      {newListModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-5 border-b">
              <h2 className="text-lg font-bold text-[#145C3B]">Nova Lista</h2>
              <button onClick={() => setNewListModal(false)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de lista</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_TITLES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setNewListPreset(t)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                        newListPreset === t
                          ? 'bg-[#145C3B] text-white border-[#145C3B]'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-[#198754] hover:text-[#198754]'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {newListPreset === 'Personalizado' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome da lista *</label>
                  <input
                    type="text"
                    autoFocus
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') createList(); }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#198754]"
                    placeholder="ex: Acabamento Premium"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setNewListModal(false)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={createList}
                  disabled={newListPreset === 'Personalizado' && !newListTitle.trim()}
                  className="px-5 py-2 text-sm font-medium bg-[#198754] hover:bg-[#145C3B] text-white rounded-lg transition-colors disabled:opacity-40"
                >
                  Criar lista
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal: Add item ───────────────────────────────────────────────── */}
      {addItemModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="flex items-center justify-between px-6 py-5 border-b">
              <h2 className="text-lg font-bold text-[#145C3B]">Adicionar Item</h2>
              <button onClick={() => setAddItemModal(null)} className="p-1 text-gray-400 hover:text-gray-600 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Texto do item *</label>
                <input
                  type="text"
                  autoFocus
                  value={itemForm.texto}
                  onChange={(e) => setItemForm({ ...itemForm, texto: e.target.value })}
                  onKeyDown={(e) => { if (e.key === 'Enter') addItem(addItemModal.listId); }}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#198754]"
                  placeholder="ex: Comprar cimento"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prazo</label>
                <input
                  type="date"
                  value={itemForm.prazo}
                  onChange={(e) => setItemForm({ ...itemForm, prazo: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#198754]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observação</label>
                <textarea
                  value={itemForm.observacao}
                  onChange={(e) => setItemForm({ ...itemForm, observacao: e.target.value })}
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#198754] resize-none"
                  placeholder="Detalhes opcionais..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAddItemModal(null)}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => addItem(addItemModal.listId)}
                  disabled={!itemForm.texto.trim()}
                  className="px-5 py-2 text-sm font-medium bg-[#198754] hover:bg-[#145C3B] text-white rounded-lg transition-colors disabled:opacity-40"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
