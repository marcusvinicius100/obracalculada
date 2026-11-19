import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  Search,
  ArrowUpDown,
  TrendingUp,
  TrendingDown,
  Tag,
  Store,
  Package,
  Trash2,
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  Filter,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface PriceRecord {
  id: string;
  user_id: string;
  product_name: string;
  brand: string;
  store_name: string;
  price: number;
  quantity: number;
  unit: string;
  created_at: string;
}

interface GroupedProduct {
  product_name: string;
  records: PriceRecord[];
  min_price: number;
  max_price: number;
  diff_brl: number;
  diff_pct: number;
  best_record: PriceRecord;
  worst_record: PriceRecord;
}

const UNITS = ['unidade', 'kg', 'g', 'litro', 'ml', 'm²', 'm', 'm³', 'saco', 'caixa', 'rolo', 'peça', 'par'];

const formatBRL = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatPct = (value: number) => `${value.toFixed(1)}%`;

export default function PriceComparatorPage() {
  const { user } = useAuth();

  const [records, setRecords] = useState<PriceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [expandedProducts, setExpandedProducts] = useState<Set<string>>(new Set());

  // Filters & sort
  const [filterProduct, setFilterProduct] = useState('');
  const [filterStore, setFilterStore] = useState('');
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'name_asc'>('name_asc');

  // Form state
  const emptyForm = {
    product_name: '',
    brand: '',
    store_name: '',
    price: '',
    quantity: '1',
    unit: 'unidade',
  };
  const [form, setForm] = useState(emptyForm);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchRecords = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbErr } = await supabase
        .from('price_records')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (dbErr) throw dbErr;
      setRecords(data as PriceRecord[]);
    } catch (e: any) {
      setError(e.message || 'Erro ao carregar registros');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.product_name.trim() || !form.store_name.trim() || !form.price) {
      setError('Produto, loja e preço são obrigatórios.');
      return;
    }
    const priceNum = parseFloat(form.price.replace(',', '.'));
    if (isNaN(priceNum) || priceNum <= 0) {
      setError('Preço inválido.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const { error: dbErr } = await supabase.from('price_records').insert({
        user_id: user.id,
        product_name: form.product_name.trim(),
        brand: form.brand.trim(),
        store_name: form.store_name.trim(),
        price: priceNum,
        quantity: parseFloat(form.quantity) || 1,
        unit: form.unit,
      });
      if (dbErr) throw dbErr;
      setForm(emptyForm);
      setShowForm(false);
      await fetchRecords();
    } catch (e: any) {
      setError(e.message || 'Erro ao salvar registro');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('Remover este registro?')) return;
    try {
      const { error: dbErr } = await supabase.from('price_records').delete().eq('id', id);
      if (dbErr) throw dbErr;
      setRecords(prev => prev.filter(r => r.id !== id));
    } catch (e: any) {
      setError(e.message || 'Erro ao remover');
    }
  };

  // ── Group & filter ─────────────────────────────────────────────────────────
  const grouped = useMemo<GroupedProduct[]>(() => {
    const filtered = records.filter(r => {
      const matchProduct = r.product_name.toLowerCase().includes(filterProduct.toLowerCase());
      const matchStore = r.store_name.toLowerCase().includes(filterStore.toLowerCase());
      return matchProduct && matchStore;
    });

    const map = new Map<string, PriceRecord[]>();
    filtered.forEach(r => {
      const key = r.product_name.toLowerCase();
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    });

    const groups: GroupedProduct[] = [];
    map.forEach((recs, _key) => {
      const prices = recs.map(r => r.price);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const diff_brl = max - min;
      const diff_pct = max > 0 ? (diff_brl / max) * 100 : 0;
      const best = recs.find(r => r.price === min)!;
      const worst = recs.find(r => r.price === max)!;
      groups.push({
        product_name: recs[0].product_name,
        records: recs,
        min_price: min,
        max_price: max,
        diff_brl,
        diff_pct,
        best_record: best,
        worst_record: worst,
      });
    });

    groups.sort((a, b) => {
      if (sortBy === 'price_asc') return a.min_price - b.min_price;
      if (sortBy === 'price_desc') return b.min_price - a.min_price;
      return a.product_name.localeCompare(b.product_name, 'pt-BR');
    });

    return groups;
  }, [records, filterProduct, filterStore, sortBy]);

  const toggleExpand = (name: string) => {
    setExpandedProducts(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: '#E8F5ED' }}>
                <ShoppingCart className="w-6 h-6" style={{ color: '#198754' }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Comparador de Preços</h1>
                <p className="text-sm text-gray-500">Compare preços de materiais entre diferentes lojas</p>
              </div>
            </div>
            <button
              onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-colors"
              style={{ backgroundColor: '#198754' }}
            >
              <Plus className="w-4 h-4" />
              Novo Registro
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Error banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Add form */}
        {showForm && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Tag className="w-5 h-5" style={{ color: '#198754' }} />
              Registrar Preço
            </h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Produto *</label>
                <input
                  type="text"
                  value={form.product_name}
                  onChange={e => setForm(f => ({ ...f, product_name: e.target.value }))}
                  placeholder="ex: Cimento CP-II, Tinta Acrílica..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                <input
                  type="text"
                  value={form.brand}
                  onChange={e => setForm(f => ({ ...f, brand: e.target.value }))}
                  placeholder="ex: Votoran, Coral..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Loja *</label>
                <input
                  type="text"
                  value={form.store_name}
                  onChange={e => setForm(f => ({ ...f, store_name: e.target.value }))}
                  placeholder="ex: Leroy Merlin, C&C..."
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preço (R$) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  placeholder="0,00"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={form.quantity}
                    onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidade</label>
                  <select
                    value={form.unit}
                    onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    {UNITS.map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="sm:col-span-2 lg:col-span-3 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setForm(emptyForm); setError(null); }}
                  className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-2 text-sm text-white rounded-lg font-medium disabled:opacity-60"
                  style={{ backgroundColor: '#198754' }}
                >
                  {saving ? 'Salvando...' : 'Salvar Registro'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        {records.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
              <Filter className="w-4 h-4 text-gray-400 hidden sm:block" />
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={filterProduct}
                  onChange={e => setFilterProduct(e.target.value)}
                  placeholder="Filtrar por produto..."
                  className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex-1 relative">
                <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={filterStore}
                  onChange={e => setFilterStore(e.target.value)}
                  placeholder="Filtrar por loja..."
                  className="w-full border border-gray-300 rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-gray-400" />
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as typeof sortBy)}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="name_asc">Nome A→Z</option>
                  <option value="price_asc">Menor Preço</option>
                  <option value="price_desc">Maior Preço</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: '#198754' }} />
          </div>
        ) : grouped.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 py-20 flex flex-col items-center gap-4 text-center">
            <div className="p-4 rounded-full" style={{ backgroundColor: '#E8F5ED' }}>
              <ShoppingCart className="w-10 h-10" style={{ color: '#198754' }} />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-700">
                {records.length === 0 ? 'Nenhum registro ainda' : 'Nenhum resultado encontrado'}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {records.length === 0
                  ? 'Clique em "Novo Registro" para começar a comparar preços de materiais entre lojas.'
                  : 'Tente ajustar os filtros de pesquisa.'}
              </p>
            </div>
            {records.length === 0 && (
              <button
                onClick={() => setShowForm(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-medium"
                style={{ backgroundColor: '#198754' }}
              >
                <Plus className="w-4 h-4" />
                Adicionar primeiro registro
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {grouped.map(group => {
              const isExpanded = expandedProducts.has(group.product_name);
              const hasMultiple = group.records.length > 1;

              return (
                <div key={group.product_name} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  {/* Summary row */}
                  <div
                    className={`p-4 ${hasMultiple ? 'cursor-pointer hover:bg-gray-50' : ''}`}
                    onClick={() => hasMultiple && toggleExpand(group.product_name)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex items-center gap-2 flex-1">
                        <Package className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="font-semibold text-gray-900">{group.product_name}</span>
                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                          {group.records.length} {group.records.length === 1 ? 'registro' : 'registros'}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                        {/* Min price */}
                        <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 px-3 py-1.5 rounded-lg">
                          <TrendingDown className="w-3.5 h-3.5 text-green-600" />
                          <div>
                            <p className="text-xs text-green-600 font-medium leading-none">Menor</p>
                            <p className="text-sm font-bold text-green-700">{formatBRL(group.min_price)}</p>
                          </div>
                        </div>

                        {/* Max price */}
                        {hasMultiple && (
                          <div className="flex items-center gap-1.5 bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg">
                            <TrendingUp className="w-3.5 h-3.5 text-red-600" />
                            <div>
                              <p className="text-xs text-red-600 font-medium leading-none">Maior</p>
                              <p className="text-sm font-bold text-red-700">{formatBRL(group.max_price)}</p>
                            </div>
                          </div>
                        )}

                        {/* Diff */}
                        {hasMultiple && group.diff_brl > 0 && (
                          <div className="bg-orange-50 border border-orange-200 px-3 py-1.5 rounded-lg">
                            <p className="text-xs text-orange-600 font-medium leading-none">Diferença</p>
                            <p className="text-sm font-bold text-orange-700">
                              {formatBRL(group.diff_brl)} · {formatPct(group.diff_pct)}
                            </p>
                          </div>
                        )}

                        {hasMultiple && (
                          isExpanded
                            ? <ChevronUp className="w-4 h-4 text-gray-400" />
                            : <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Best store summary */}
                    {hasMultiple && !isExpanded && (
                      <p className="text-xs text-gray-500 mt-2 ml-6">
                        Melhor preço em <strong>{group.best_record.store_name}</strong>
                        {group.best_record.brand ? ` · ${group.best_record.brand}` : ''}
                        {' '}· {group.best_record.quantity} {group.best_record.unit}
                      </p>
                    )}
                  </div>

                  {/* Detail rows */}
                  {(isExpanded || !hasMultiple) && (
                    <div className="border-t border-gray-100">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                            <th className="px-4 py-2 text-left">Loja</th>
                            <th className="px-4 py-2 text-left">Marca</th>
                            <th className="px-4 py-2 text-left">Qtd / Un.</th>
                            <th className="px-4 py-2 text-right">Preço</th>
                            <th className="px-4 py-2 text-right">Data</th>
                            <th className="px-4 py-2" />
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {group.records
                            .sort((a, b) => a.price - b.price)
                            .map(rec => {
                              const isBest = hasMultiple && rec.price === group.min_price;
                              const isWorst = hasMultiple && rec.price === group.max_price && group.diff_brl > 0;
                              return (
                                <tr
                                  key={rec.id}
                                  className={
                                    isBest
                                      ? 'bg-green-50'
                                      : isWorst
                                      ? 'bg-red-50'
                                      : 'hover:bg-gray-50'
                                  }
                                >
                                  <td className="px-4 py-2.5">
                                    <div className="flex items-center gap-1.5">
                                      <Store className="w-3 h-3 text-gray-400" />
                                      {rec.store_name}
                                    </div>
                                  </td>
                                  <td className="px-4 py-2.5 text-gray-600">{rec.brand || '—'}</td>
                                  <td className="px-4 py-2.5 text-gray-600">{rec.quantity} {rec.unit}</td>
                                  <td className="px-4 py-2.5 text-right font-semibold">
                                    <span
                                      className={
                                        isBest
                                          ? 'text-green-700'
                                          : isWorst
                                          ? 'text-red-700'
                                          : 'text-gray-900'
                                      }
                                    >
                                      {formatBRL(rec.price)}
                                    </span>
                                    {isBest && (
                                      <span className="ml-1.5 text-xs font-normal text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">
                                        Melhor
                                      </span>
                                    )}
                                    {isWorst && (
                                      <span className="ml-1.5 text-xs font-normal text-red-600 bg-red-100 px-1.5 py-0.5 rounded-full">
                                        Mais caro
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-2.5 text-right text-gray-400 text-xs">
                                    {new Date(rec.created_at).toLocaleDateString('pt-BR')}
                                  </td>
                                  <td className="px-4 py-2.5 text-right">
                                    <button
                                      onClick={() => handleDelete(rec.id)}
                                      className="text-gray-300 hover:text-red-500 transition-colors"
                                      title="Remover registro"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
