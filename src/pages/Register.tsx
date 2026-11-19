import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, UserType } from '../contexts/AuthContext';
import { HardHat, Mail, Lock, User, Phone, Briefcase, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';

export const Register: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState<UserType>('pessoa_fisica');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (password.length < 6) {
      setErrorMsg('A senha deve conter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);
    const { error } = await signUp({
      name,
      email,
      phone,
      password,
      user_type: userType,
    });
    setLoading(false);

    if (error) {
      setErrorMsg(error.message || 'Erro ao realizar cadastro.');
    } else {
      setSuccessMsg('Cadastro realizado com sucesso! Redirecionando...');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1500);
    }
  };

  return (
    <div className="min-h-screen bg-brand-grayLight flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <Link to="/" className="flex items-center justify-center gap-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-brand-dark flex items-center justify-center text-white shadow-md">
            <HardHat className="w-7 h-7 text-brand-orange" />
          </div>
          <span className="font-extrabold text-2xl text-brand-dark">
            Obra<span className="text-brand-primary">Calculada</span>
          </span>
        </Link>
        <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-brand-grayDark">
          Crie sua conta gratuita
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Já possui cadastro?{' '}
          <Link to="/login" className="font-semibold text-brand-primary hover:text-brand-dark hover:underline">
            Entrar agora
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-lg px-4">
        <div className="bg-white py-8 px-6 shadow-md rounded-2xl sm:px-10 border border-gray-100">
          {errorMsg && (
            <div className="mb-5 bg-red-50 border-l-4 border-red-500 p-4 rounded-md flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{errorMsg}</p>
            </div>
          )}

          {successMsg && (
            <div className="mb-5 bg-green-50 border-l-4 border-brand-primary p-4 rounded-md flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-brand-primary flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-800">{successMsg}</p>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Nome Completo ou Razão Social
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <User className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: João da Silva ou Construtora Alfa"
                  className="block w-full pl-11 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  E-mail
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="voce@exemplo.com"
                    className="block w-full pl-11 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Telefone / WhatsApp
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Phone className="h-5 w-5" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(11) 98765-4321"
                    className="block w-full pl-11 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Tipo de Usuário
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'pessoa_fisica', label: 'Pessoa Física', desc: 'Reforma/Construção' },
                  { id: 'profissional', label: 'Profissional', desc: 'Mestre / Engenheiro' },
                  { id: 'empresa', label: 'Empresa', desc: 'Construtora / Escritório' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setUserType(item.id as UserType)}
                    className={`p-3 text-left border rounded-xl transition-all ${
                      userType === item.id
                        ? 'border-brand-primary bg-brand-light text-brand-dark ring-2 ring-brand-primary/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white text-gray-600'
                    }`}
                  >
                    <div className="font-bold text-xs">{item.label}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Senha (mínimo 6 caracteres)
              </label>
              <div className="relative rounded-xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="block w-full pl-11 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-brand-primary hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-all disabled:opacity-50"
              >
                {loading ? 'Criando conta...' : 'Concluir cadastro e começar'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
