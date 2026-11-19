import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Calculator,
  FolderKanban,
  Receipt,
  ShoppingCart,
  Sparkles,
  LogOut,
  User as UserIcon,
  HardHat,
  Menu,
  X,
  CalendarDays,
  CheckSquare,
  Scale,
  Compass,
  Wrench,
  FileSpreadsheet,
  BarChart3,
  HelpCircle,
} from 'lucide-react';

interface AppLayoutProps {
  children: React.ReactNode;
}

interface NavGroup {
  title: string;
  items: {
    name: string;
    href: string;
    icon: React.ElementType;
  }[];
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navGroups: NavGroup[] = [
    {
      title: 'Principal',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      ],
    },
    {
      title: 'Ferramentas',
      items: [
        { name: 'Calculadoras', href: '/calculadoras', icon: Calculator },
        { name: 'Comparador de Preços', href: '/comparador-precos', icon: Scale },
        { name: 'Planta Baixa 2D', href: '/planta-baixa', icon: Compass },
        { name: 'Simulador de Reforma', href: '/simulador-reforma', icon: Wrench },
      ],
    },
    {
      title: 'Gestão da Obra',
      items: [
        { name: 'Projetos', href: '/projetos', icon: FolderKanban },
        { name: 'Cronograma', href: '/cronograma', icon: CalendarDays },
        { name: 'Checklist', href: '/checklist', icon: CheckSquare },
        { name: 'Despesas', href: '/despesas', icon: Receipt },
        { name: 'Lista de Compras', href: '/lista-compras', icon: ShoppingCart },
      ],
    },
    {
      title: 'Documentos',
      items: [
        { name: 'Orçamentos PDF', href: '/gerador-orcamentos', icon: FileSpreadsheet },
        { name: 'Relatórios', href: '/relatorios', icon: BarChart3 },
      ],
    },
    {
      title: 'Inteligência Artificial',
      items: [
        { name: 'Obra IA', href: '/obra-ia', icon: Sparkles },
      ],
    },
    {
      title: 'Conta e Suporte',
      items: [
        { name: 'Meu Perfil', href: '/perfil', icon: UserIcon },
        { name: 'Central de Ajuda', href: '/ajuda', icon: HelpCircle },
      ],
    },
  ];

  const bottomNavItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Calculadoras', href: '/calculadoras', icon: Calculator },
    { name: 'Projetos', href: '/projetos', icon: FolderKanban },
    { name: 'Despesas', href: '/despesas', icon: Receipt },
    { name: 'Obra IA', href: '/obra-ia', icon: Sparkles },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isActive = (path: string) => {
    if (path === '/projetos' && location.pathname.startsWith('/projetos/')) {
      return true;
    }
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-brand-grayLight flex flex-col md:flex-row text-brand-grayDark font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-gray-200 shadow-sm z-30">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-6 h-18 border-b border-gray-100 py-4">
          <div className="w-10 h-10 rounded-xl bg-brand-dark flex items-center justify-center text-white shadow-md flex-shrink-0">
            <HardHat className="w-6 h-6 text-brand-orange" />
          </div>
          <div className="min-w-0">
            <span className="font-extrabold text-xl text-brand-dark tracking-tight block">
              Obra<span className="text-brand-primary">Calculada</span>
            </span>
            <span className="block text-[10px] font-medium text-gray-400 uppercase tracking-wider">
              Gestão & Engenharia
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 flex flex-col justify-between p-3 overflow-y-auto space-y-4">
          <nav className="space-y-4">
            {navGroups.map((group) => (
              <div key={group.title} className="space-y-1">
                <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                  {group.title}
                </p>
                {group.items.map((item) => {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2 text-xs font-semibold rounded-xl transition-all ${
                        active
                          ? 'bg-brand-light text-brand-dark shadow-sm border border-brand-primary/20'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-brand-dark'
                      }`}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-brand-primary' : 'text-gray-400'}`} />
                      <span className="truncate">{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>

          {/* User profile & logout */}
          <div className="pt-3 border-t border-gray-100 space-y-2">
            <Link
              to="/perfil"
              className="flex items-center gap-3 px-2 py-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-brand-primary/20 text-brand-dark font-bold flex items-center justify-center text-xs flex-shrink-0">
                {profile?.name ? profile.name.charAt(0).toUpperCase() : <UserIcon className="w-4 h-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-brand-grayDark truncate">
                  {profile?.name || user?.email?.split('@')[0]}
                </p>
                <p className="text-[10px] text-gray-500 capitalize truncate">
                  {profile?.user_type?.replace('_', ' ') || 'Usuário'}
                </p>
              </div>
            </Link>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sair da conta
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-dark flex items-center justify-center text-white">
            <HardHat className="w-5 h-5 text-brand-orange" />
          </div>
          <span className="font-extrabold text-lg text-brand-dark">
            Obra<span className="text-brand-primary">Calculada</span>
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 text-gray-600 hover:text-brand-dark rounded-lg hover:bg-gray-100"
          aria-label="Abrir menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile Slide-down Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[57px] bottom-0 bg-white z-40 overflow-y-auto p-4 shadow-xl">
          <div className="mb-4 pb-3 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-brand-primary/20 text-brand-dark font-bold flex items-center justify-center">
                {profile?.name ? profile.name.charAt(0).toUpperCase() : <UserIcon className="w-5 h-5" />}
              </div>
              <div>
                <p className="font-bold text-sm text-brand-dark">{profile?.name || user?.email}</p>
                <p className="text-xs text-gray-500 capitalize">{profile?.user_type?.replace('_', ' ') || 'Usuário'}</p>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="text-xs font-semibold text-red-600 hover:bg-red-50 px-2 py-1.5 rounded-lg flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" /> Sair
            </button>
          </div>

          <div className="space-y-4 pb-16">
            {navGroups.map((group) => (
              <div key={group.title} className="space-y-1">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">
                  {group.title}
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {group.items.map((item) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-medium ${
                          active
                            ? 'bg-brand-light text-brand-dark font-bold border border-brand-primary/30'
                            : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <Icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-brand-primary' : 'text-gray-400'}`} />
                        <span className="truncate">{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 md:pl-64 flex flex-col min-h-screen pb-20 md:pb-8">
        <div className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 px-2 py-1.5 flex justify-around items-center z-30 shadow-lg">
        {bottomNavItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-semibold transition-colors ${
                active ? 'text-brand-primary font-bold' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${active ? 'text-brand-primary' : 'text-gray-400'}`} />
              <span className="truncate max-w-[64px]">{item.name}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};
export default AppLayout;
