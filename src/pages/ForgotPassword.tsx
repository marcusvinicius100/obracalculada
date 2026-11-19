import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { HardHat, Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { resetPassword } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setLoading(true);

    const { error } = await resetPassword(email);
    setLoading(false);

    if (error) {
      setErrorMsg(error.message || 'Erro ao solicitar redefinição de senha.');
    } else {
      setSuccessMsg('Enviamos um link de recuperação para o seu e-mail. Verifique sua caixa de entrada.');
    }
  };

  return (
    <div className="min-h-screen bg-brand-grayLight flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Link to="/" className="flex items-center justify-center gap-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-brand-dark flex items-center justify-center text-white shadow-md">
            <HardHat className="w-7 h-7 text-brand-orange" />
          </div>
          <span className="font-extrabold text-2xl text-brand-dark">
            Obra<span className="text-brand-primary">Calculada</span>
          </span>
        </Link>
        <h2 className="text-center text-2xl sm:text-3xl font-extrabold text-brand-grayDark">
          Recuperar senha
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Informe seu e-mail para receber as instruções de redefinição.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
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

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                E-mail cadastrado
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
                  placeholder="seu@email.com"
                  className="block w-full pl-11 pr-3 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-primary focus:border-brand-primary text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-brand-primary hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary transition-all disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Enviar link de recuperação'}
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-brand-dark"
            >
              <ArrowLeft className="w-4 h-4" /> Voltar para o Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
