import React, { useState } from 'react';
import {
  User, Mail, Phone, Shield, Eye, EyeOff, AlertTriangle,
  CheckCircle, Loader2, Trash2, ChevronDown, ChevronUp,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth, UserType } from '../contexts/AuthContext';

// ─── Types ───────────────────────────────────────────────────────────────────

interface FormState {
  name: string;
  phone: string;
  user_type: UserType;
}

interface PasswordState {
  newPassword: string;
  confirmPassword: string;
  showNew: boolean;
  showConfirm: boolean;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const ProfilePage: React.FC = () => {
  const { user, profile, updateProfile, deleteAccount } = useAuth();

  // ── Profile form ──
  const [form, setForm] = useState<FormState>({
    name: profile?.name ?? '',
    phone: profile?.phone ?? '',
    user_type: profile?.user_type ?? 'pessoa_fisica',
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // ── Password form ──
  const [passwordState, setPasswordState] = useState<PasswordState>({
    newPassword: '',
    confirmPassword: '',
    showNew: false,
    showConfirm: false,
  });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showPasswordSection, setShowPasswordSection] = useState(false);

  // ── Danger zone ──
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // ── Handlers ──

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileError(null);
    setProfileSuccess(false);

    const { error } = await updateProfile({
      name: form.name.trim(),
      phone: form.phone.trim() || undefined,
      user_type: form.user_type,
    });

    if (error) {
      setProfileError(error.message ?? 'Erro ao salvar perfil.');
    } else {
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    }
    setProfileSaving(false);
  };

  const handlePasswordSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    const { newPassword, confirmPassword } = passwordState;

    if (newPassword.length < 8) {
      setPasswordError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('As senhas não coincidem.');
      return;
    }

    setPasswordSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setPasswordError(error.message ?? 'Erro ao alterar senha.');
    } else {
      setPasswordSuccess(true);
      setPasswordState((p) => ({ ...p, newPassword: '', confirmPassword: '' }));
      setTimeout(() => setPasswordSuccess(false), 3000);
    }
    setPasswordSaving(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return;
    setDeleting(true);
    setDeleteError(null);

    const { error } = await deleteAccount();
    if (error) {
      setDeleteError(error.message ?? 'Erro ao excluir conta.');
      setDeleting(false);
    }
    // On success, AuthContext will sign the user out automatically
  };

  const userTypeLabels: Record<UserType, string> = {
    pessoa_fisica: 'Pessoa Física',
    profissional: 'Profissional (Arquiteto, Engenheiro…)',
    empresa: 'Empresa / Construtora',
  };

  return (
    <div className="min-h-screen py-10 px-4" style={{ backgroundColor: '#F9FAFB' }}>
      <div className="max-w-2xl mx-auto space-y-6">

        {/* ── Page header ── */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E8F5ED' }}>
            <User className="w-6 h-6" style={{ color: '#198754' }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Meu Perfil</h1>
            <p className="text-sm text-gray-500">Gerencie suas informações pessoais e segurança</p>
          </div>
        </div>

        {/* ── Profile form ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-base font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <User className="w-4 h-4" style={{ color: '#198754' }} />
            Informações Pessoais
          </h2>

          <form onSubmit={handleProfileSave} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Nome completo *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': '#198754' } as React.CSSProperties}
                  placeholder="Seu nome"
                />
              </div>
            </div>

            {/* Email (readonly) */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">E-mail</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  value={user?.email ?? ''}
                  readOnly
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 text-gray-500 cursor-not-allowed"
                />
              </div>
              <p className="text-xs text-gray-400 mt-1">O e-mail não pode ser alterado diretamente.</p>
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Telefone</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': '#198754' } as React.CSSProperties}
                  placeholder="(11) 90000-0000"
                />
              </div>
            </div>

            {/* User type */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Tipo de usuário</label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <select
                  value={form.user_type}
                  onChange={(e) => setForm((p) => ({ ...p, user_type: e.target.value as UserType }))}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 appearance-none bg-white"
                  style={{ '--tw-ring-color': '#198754' } as React.CSSProperties}
                >
                  {(Object.entries(userTypeLabels) as [UserType, string][]).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Feedback */}
            {profileError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {profileError}
              </div>
            )}
            {profileSuccess && (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" /> Perfil salvo com sucesso!
              </div>
            )}

            <button
              type="submit"
              disabled={profileSaving}
              className="w-full py-2.5 rounded-xl text-white text-sm font-medium flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
              style={{ backgroundColor: '#198754' }}
            >
              {profileSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {profileSaving ? 'Salvando…' : 'Salvar Alterações'}
            </button>
          </form>
        </div>

        {/* ── Password section ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <button
            type="button"
            onClick={() => setShowPasswordSection((p) => !p)}
            className="w-full flex items-center justify-between text-base font-semibold text-gray-700"
          >
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4" style={{ color: '#198754' }} />
              Alterar Senha
            </span>
            {showPasswordSection ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          {showPasswordSection && (
            <form onSubmit={handlePasswordSave} className="mt-4 space-y-4">
              {/* New password */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Nova senha</label>
                <div className="relative">
                  <input
                    type={passwordState.showNew ? 'text' : 'password'}
                    value={passwordState.newPassword}
                    onChange={(e) => setPasswordState((p) => ({ ...p, newPassword: e.target.value }))}
                    required
                    minLength={8}
                    className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': '#198754' } as React.CSSProperties}
                    placeholder="Mínimo 8 caracteres"
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordState((p) => ({ ...p, showNew: !p.showNew }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {passwordState.showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm password */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Confirmar nova senha</label>
                <div className="relative">
                  <input
                    type={passwordState.showConfirm ? 'text' : 'password'}
                    value={passwordState.confirmPassword}
                    onChange={(e) => setPasswordState((p) => ({ ...p, confirmPassword: e.target.value }))}
                    required
                    className="w-full pl-4 pr-10 py-2.5 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2"
                    style={{ '--tw-ring-color': '#198754' } as React.CSSProperties}
                    placeholder="Repita a nova senha"
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordState((p) => ({ ...p, showConfirm: !p.showConfirm }))}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {passwordState.showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Feedback */}
              {passwordError && (
                <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {passwordError}
                </div>
              )}
              {passwordSuccess && (
                <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" /> Senha alterada com sucesso!
                </div>
              )}

              <button
                type="submit"
                disabled={passwordSaving}
                className="w-full py-2.5 rounded-xl text-white text-sm font-medium flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
                style={{ backgroundColor: '#198754' }}
              >
                {passwordSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {passwordSaving ? 'Alterando…' : 'Alterar Senha'}
              </button>
            </form>
          )}
        </div>

        {/* ── Danger zone ── */}
        <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-6">
          <h2 className="text-base font-semibold text-red-600 mb-1 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Zona de Perigo
          </h2>
          <p className="text-sm text-gray-500 mb-4">
            A exclusão da conta é permanente e remove todos os seus dados (projetos, calculadoras e histórico).
          </p>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-600 rounded-xl text-sm font-medium hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Excluir Minha Conta
          </button>
        </div>
      </div>

      {/* ── Delete confirmation modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-800">Excluir conta permanentemente</h3>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              Esta ação é <strong>irreversível</strong>. Todos os seus dados serão excluídos.
              Para confirmar, digite <strong className="font-mono">DELETE</strong> no campo abaixo:
            </p>
            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-red-400 mb-4"
              placeholder="DELETE"
            />
            {deleteError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {deleteError}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirmText(''); setDeleteError(null); }}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || deleting}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {deleting ? 'Excluindo…' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
