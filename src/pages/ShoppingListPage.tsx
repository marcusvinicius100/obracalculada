import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ShoppingListItem, Project } from '../types/database';
import { formatCurrency, formatNumber } from '../lib/utils';
import { ShoppingCart, CheckSquare, Square, Trash2, Plus, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const ShoppingListPage: React.FC = () => {
  const { user } = useAuth();
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  // New item modal
  const [showModal, setShowModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQty, setNewItemQty] = useState(1);
  const [newItemUnit, setNewItemUnit] = useState('un');
  const [newItemPrice, setNewItemPrice] = useState(0);
  const [newItemCat, setNewItemCat] = useState('Geral');
  const [newItemProj, setNewItemProj] = useState('');

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    const { data: p } = await supabase.from('projects').select('*').eq('owner_id', user.id);
    if (p) {
      setProjects(p as Project[]);
      if (p.length > 0 && !newItemProj) setNewItemProj(p[0].id);
    }

    let query = supabase.from('shopping_list_items').select('*').eq('user_id', user.id);
    if (selectedProjectId !== 'all') {
      query = query.eq('project_id', selectedProjectId);
    }

    const { data: it } = await query.order('created_at', { ascending: false });
    if (it) setItems(it as ShoppingListItem[]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user, selectedProjectId]);

  const togglePurchased = async (item: ShoppingListItem) => {
    const updated = !item.is_purchased;
    await supabase.from('shopping_list_items').update({ is_purchased: updated }).eq('id', item.id);
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_purchased: updated } : i)));
  };

  const deleteItem = async (id: string) => {
    await supabase.from('shopping_list_items').delete().eq('id', id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newItemName || !newItemProj) return;

    await supabase.from('shopping_list_items').insert({
      user_id: user.id,
      project_id: newItemProj,
      name: newItemName,
      quantity: newItemQty,
      unit: newItemUnit,
      unit_price: newItemPrice,
      category: newItemCat,
      is_purchased: false,
    });

    setNewItemName('');
    setShowModal(false);
    loadData();
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text('ObraCalculada - Lista de Compras de Materiais', 14, 15);
    doc.setFontSize(10);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 22);

    const tableRows = items.map((i) => [
      i.is_purchased ? '[X]' : '[ ]',
      i.name,
      `${i.quantity} ${i.unit}`,
      formatCurrency(Number(i.unit_price) || 0),
      formatCurrency((Number(i.quantity) || 0) * (Number(i.unit_price) || 0)),
      i.category || 'Geral',
    ]);

    autoTable(doc, {
      head: [['Status', 'Item', 'Qtd / Unidade', 'Preço Unit.', 'Subtotal', 'Categoria']],
      body: tableRows,
      startY: 28,
      theme: 'grid',
      headStyles: { fillColor: [20, 92, 59] },
    });

    doc.save('lista-de-compras-obracalculada.pdf');
  };

  const totalEstimated = items.reduce((acc, i) => acc + (Number(i.quantity) || 0) * (Number(i.unit_price) || 0), 0);
  const totalBought = items.filter((i) => i.is_purchased).reduce((acc, i) => acc + (Number(i.quantity) || 0) * (Number(i.unit_price) || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-grayDark tracking-tight">
            Lista de Compras
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Materiais gerados pelas calculadoras ou adicionados manualmente para cotação.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {items.length > 0 && (
            <button
              onClick={exportPDF}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs text-brand-dark bg-white border border-gray-200 hover:bg-gray-50 shadow-sm transition-all"
            >
              <Download className="w-4 h-4 text-brand-primary" />
              Exportar PDF
            </button>
          )}

          <button
            onClick={() => setShowModal(true)}
            disabled={projects.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white bg-brand-primary hover:bg-brand-dark transition-all disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Adicionar Item
          </button>
        </div>
      </div>

      {/* Filter and stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-gray-500">Filtrar por obra:</span>
          <select
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="text-xs font-bold text-brand-dark bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200"
          >
            <option value="all">Todos os Projetos</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-6 text-xs">
          <div>
            <span className="text-gray-400 block font-medium">Total Estimado</span>
            <span className="font-extrabold text-brand-grayDark text-sm">{formatCurrency(totalEstimated)}</span>
          </div>
          <div>
            <span className="text-gray-400 block font-medium">Já Comprado</span>
            <span className="font-extrabold text-brand-primary text-sm">{formatCurrency(totalBought)}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-gray-400">Carregando lista de compras...</div>
      ) : items.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border text-center max-w-lg mx-auto">
          <ShoppingCart className="w-12 h-12 text-blue-500 mx-auto mb-3" />
          <h3 className="font-bold text-base text-gray-800">Sua lista está vazia</h3>
          <p className="text-xs text-gray-500 mt-1 mb-4">
            Utilize as Calculadoras e clique em "Salvar no Projeto" para enviar materiais automaticamente para cá!
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="divide-y divide-gray-100">
            {items.map((item) => (
              <div
                key={item.id}
                className={`flex items-center justify-between p-4 transition-colors ${
                  item.is_purchased ? 'bg-gray-50/70 text-gray-400' : 'hover:bg-gray-50/40 text-brand-grayDark'
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => togglePurchased(item)}
                    className="text-gray-400 hover:text-brand-primary"
                  >
                    {item.is_purchased ? (
                      <CheckSquare className="w-5 h-5 text-brand-primary" />
                    ) : (
                      <Square className="w-5 h-5" />
                    )}
                  </button>
                  <div>
                    <span className={`font-bold text-sm block ${item.is_purchased ? 'line-through text-gray-400' : ''}`}>
                      {item.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {item.quantity} {item.unit} • {formatCurrency(Number(item.unit_price) || 0)}/un
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-black text-sm text-brand-dark">
                    {formatCurrency((Number(item.quantity) || 0) * (Number(item.unit_price) || 0))}
                  </span>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-lg text-brand-grayDark">Adicionar Item Manual</h3>
            <form onSubmit={handleAddItem} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Projeto</label>
                <select
                  value={newItemProj}
                  onChange={(e) => setNewItemProj(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nome do Material / Insumo</label>
                <input
                  type="text"
                  required
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="Ex: Fita veda-rosca 18mm"
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Qtd</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newItemQty}
                    onChange={(e) => setNewItemQty(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Unidade</label>
                  <input
                    type="text"
                    value={newItemUnit}
                    onChange={(e) => setNewItemUnit(e.target.value)}
                    placeholder="un, m, kg"
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Preço Est. (R$)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newItemPrice}
                    onChange={(e) => setNewItemPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>

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
                  className="px-5 py-2.5 rounded-xl font-bold text-xs text-white bg-brand-primary"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
