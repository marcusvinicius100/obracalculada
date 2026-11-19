import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Expense, Project } from '../types/database';
import { formatCurrency } from '../lib/utils';
import { Receipt, Plus, Tag, Calendar, Building } from 'lucide-react';

export const ExpensesPage: React.FC = () => {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const [projectId, setProjectId] = useState('');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState('Materiais');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    const { data: p } = await supabase.from('projects').select('*').eq('owner_id', user.id);
    if (p) {
      setProjects(p as Project[]);
      if (p.length > 0 && !projectId) setProjectId(p[0].id);
    }

    const { data: e } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .order('expense_date', { ascending: false });

    if (e) setExpenses(e as Expense[]);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !projectId || !description || amount <= 0) return;

    await supabase.from('expenses').insert({
      user_id: user.id,
      project_id: projectId,
      description,
      amount,
      category,
      expense_date: expenseDate,
    });

    setDescription('');
    setAmount(0);
    setShowModal(false);
    loadData();
  };

  const categories = ['Materiais', 'Mão de Obra', 'Equipamentos', 'Projetos e Taxas', 'Acabamentos', 'Outros'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-grayDark tracking-tight">
            Controle de Despesas
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Lance cada nota, recibo ou compra para manter seu saldo sob controle.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          disabled={projects.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm text-white bg-brand-primary hover:bg-brand-dark transition-all self-start sm:self-auto disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Registrar Despesa
        </button>
      </div>

      {loading ? (
        <div className="p-12 text-center text-xs text-gray-400">Carregando despesas...</div>
      ) : expenses.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border text-center max-w-lg mx-auto">
          <Receipt className="w-12 h-12 text-brand-orange mx-auto mb-3" />
          <h3 className="font-bold text-base text-gray-800">Nenhuma despesa lançada</h3>
          <p className="text-xs text-gray-500 mt-1 mb-4">Adicione seus comprovantes para acompanhar o custo real.</p>
          <button
            onClick={() => setShowModal(true)}
            disabled={projects.length === 0}
            className="px-4 py-2 bg-brand-primary text-white font-bold text-xs rounded-xl disabled:opacity-50"
          >
            Lançar Primeira Despesa
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold text-gray-500 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Descrição</th>
                  <th className="px-6 py-4">Categoria</th>
                  <th className="px-6 py-4 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-6 py-4 text-gray-500 text-xs whitespace-nowrap">
                      {new Date(exp.expense_date).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 font-bold text-brand-grayDark">{exp.description}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-light text-brand-dark">
                        {exp.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-black text-red-600 whitespace-nowrap">
                      {formatCurrency(Number(exp.amount))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-lg text-brand-grayDark">Lançar Nova Despesa</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Projeto</label>
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
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
                <label className="block text-xs font-bold text-gray-700 mb-1">Descrição</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ex: 5 sacos de cimento e areia"
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Data</label>
                  <input
                    type="date"
                    required
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Categoria</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
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
                  Salvar Despesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
