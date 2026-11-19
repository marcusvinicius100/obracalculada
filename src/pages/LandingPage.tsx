import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HardHat,
  Calculator,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  Layers,
  FileSpreadsheet,
  ShieldCheck,
  ChevronDown,
  HelpCircle,
  Building2,
  Paintbrush,
  Zap,
  Droplets,
  Ruler,
  Compass,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const calculatorList = [
    { title: 'Pisos e Revestimentos', desc: 'Área, tamanho das peças, caixas e perda calculada.', icon: Layers },
    { title: 'Tintas e Vernizes', desc: 'Cálculo por demão com desconto exato de portas e janelas.', icon: Paintbrush },
    { title: 'Tijolos e Alvenaria', desc: 'Tijolo cerâmico ou bloco com espessura de junta.', icon: Building2 },
    { title: 'Concreto Estrutural e Lastro', desc: 'Volume cúbico e fator de perda para lajes e sapatas.', icon: HardHat },
    { title: 'Areia, Cimento e Brita', desc: 'Traço configurável para cada finalidade técnica.', icon: Calculator },
    { title: 'Telhados e Coberturas', desc: 'Correção trigonométrica de inclinação % e telhas por m².', icon: Compass },
    { title: 'Elétrica Residencial', desc: 'Pontos de tomada, iluminação e metragem preliminar de cabos.', icon: Zap },
    { title: 'Hidráulica e Esgoto', desc: 'Estimativa de conexões, tubos e pontos de água/esgoto.', icon: Droplets },
    { title: 'Conversor de Medidas', desc: 'Comprimento, área, volume, massa e capacidade em segundos.', icon: Ruler },
  ];

  const steps = [
    {
      step: '01',
      title: 'Selecione o serviço ou material',
      desc: 'Escolha entre alvenaria, pisos, tintas, concreto, elétrica ou outros módulos técnicos.',
    },
    {
      step: '02',
      title: 'Informe as medidas reais da obra',
      desc: 'Insira as metragens, selecione o padrão da peça e personalize a margem de perda recomendada.',
    },
    {
      step: '03',
      title: 'Receba a lista com custos e salve',
      desc: 'Veja o quantitativo exato, o valor orçado, envie para a lista de compras ou exporte via WhatsApp.',
    },
  ];

  const benefits = [
    {
      title: 'Fórmulas de Engenharia Reais',
      desc: 'Cálculos baseados em métodos consagrados da construção civil e normas ABNT aplicáveis, não em chutes arbitrários.',
      icon: ShieldCheck,
    },
    {
      title: 'Elimine o Desperdício de Material',
      desc: 'Compre a quantidade necessária com margem de segurança configurável por tipo de piso, telha ou argamassa.',
      icon: TrendingDown,
    },
    {
      title: 'Traços Editáveis e Transparentes',
      desc: 'Nada de receitas mágicas universais: escolha o traço correto para calçada, viga, fundação ou reboco.',
      icon: FileSpreadsheet,
    },
    {
      title: 'Integração com Lista de Compras',
      desc: 'Cada cálculo pode ser enviado diretamente para o orçamento do seu projeto no Supabase.',
      icon: CheckCircle2,
    },
  ];

  const faqs = [
    {
      q: 'Os cálculos substituem o projeto estrutural ou elétrico?',
      a: 'Não. O ObraCalculada fornece estimativas quantitativas e financeiras de insumos para planejamento e orçamento. Elementos estruturais, instalações elétricas e redes hidrossanitárias exigem dimensionamento por engenheiro ou arquiteto habilitado com emissão de ART/RRT.',
    },
    {
      q: 'Posso alterar a margem de perda de cada material?',
      a: 'Sim. Em todas as ferramentas é possível ajustar o percentual de quebra ou perda (por exemplo: 5% a 15% em pisos dependendo se o assentamento é reto ou diagonal).',
    },
    {
      q: 'O traço de concreto e argamassa é fixo?',
      a: 'Não. O sistema disponibiliza perfis pré-configurados recomendados (estrutural, contrapiso, alvenaria) e permite que você insira manualmente os índices de cimento, areia e brita.',
    },
    {
      q: 'Meus dados e cálculos ficam salvos?',
      a: 'Sim. Ao criar uma conta gratuita, seus projetos, orçamentos, listas de compras e históricos de cálculos ficam sincronizados em nuvem com o banco de dados Supabase.',
    },
  ];

  return (
    <div className="min-h-screen bg-brand-grayLight text-brand-grayDark selection:bg-brand-primary selection:text-white">
      {/* Header / Navbar */}
      <nav className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-brand-dark flex items-center justify-center text-white shadow-md">
              <HardHat className="w-6 h-6 text-brand-orange" />
            </div>
            <div>
              <span className="font-extrabold text-2xl text-brand-dark tracking-tight">Obra<span className="text-brand-primary">Calculada</span></span>
              <span className="hidden sm:block text-[10px] uppercase font-bold text-gray-400 tracking-wider">Engenharia & Orçamento</span>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2.5 rounded-xl text-sm font-bold text-brand-grayDark hover:text-brand-dark hover:bg-gray-100 transition-colors"
            >
              Entrar
            </Link>
            <Link
              to="/cadastro"
              className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-brand-primary hover:bg-brand-dark shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              Criar Conta Grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 lg:pt-28 lg:pb-32 bg-gradient-to-b from-brand-light/40 to-brand-grayLight">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-brand-light border border-brand-primary/20 text-brand-dark text-xs font-bold uppercase tracking-wider mb-8">
            <ShieldCheck className="w-4 h-4 text-brand-primary" />
            Precisão Técnica e Controle de Gastos
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-brand-grayDark tracking-tight max-w-4xl mx-auto leading-tight">
            Sua obra começa com um <span className="text-brand-primary underline decoration-brand-orange decoration-wavy decoration-2">bom cálculo.</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Calcule materiais, organize seu orçamento e acompanhe sua construção ou reforma em um só lugar. Simples, inteligente e gratuito.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/cadastro"
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-extrabold text-white bg-brand-primary hover:bg-brand-dark shadow-lg shadow-brand-primary/25 hover:shadow-xl transition-all flex items-center justify-center gap-3"
            >
              Começar gratuitamente
              <ArrowRight className="w-5 h-5" />
            </Link>

            <a
              href="#calculadoras"
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold text-brand-dark bg-white hover:bg-gray-50 border border-gray-200 shadow-sm transition-all text-center"
            >
              Conhecer as ferramentas
            </a>
          </div>

          <div className="mt-12 flex items-center justify-center gap-8 text-xs font-semibold text-gray-500">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand-primary" />
              12 Calculadoras Exatas
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand-primary" />
              Gestão de Despesas
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-brand-primary" />
              100% Gratuito
            </div>
          </div>
        </div>
      </section>

      {/* Calculators Grid Section */}
      <section id="calculadoras" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-brand-primary text-xs font-bold uppercase tracking-widest">Catálogo Completo</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-grayDark mt-2">
              Ferramentas de Cálculo Especializadas
            </h2>
            <p className="mt-4 text-gray-600 text-base">
              Desenvolvidas para construtores, reformadores e profissionais que precisam de quantitativos confiáveis sem complexidade desnecessária.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {calculatorList.map((calc, i) => {
              const Icon = calc.icon;
              return (
                <div
                  key={i}
                  className="p-6 rounded-2xl border border-gray-200/80 hover:border-brand-primary/40 bg-white hover:bg-brand-light/20 transition-all shadow-sm hover:shadow-md flex flex-col justify-between group"
                >
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-brand-light group-hover:bg-brand-primary text-brand-primary group-hover:text-white transition-colors flex items-center justify-center mb-4">
                      <Icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-lg font-bold text-brand-grayDark group-hover:text-brand-dark transition-colors">
                      {calc.title}
                    </h3>
                    <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                      {calc.desc}
                    </p>
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-100 flex items-center text-xs font-bold text-brand-primary group-hover:text-brand-dark">
                    <span>Acessar no app</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-brand-grayLight">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-brand-primary text-xs font-bold uppercase tracking-widest">Passo a Passo</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-grayDark mt-2">
              Como funciona o ObraCalculada
            </h2>
            <p className="mt-4 text-gray-600 text-base">
              Do dimensionamento inicial até a compra dos insumos na loja de materiais.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {steps.map((st, i) => (
              <div key={i} className="relative bg-white p-8 rounded-2xl border border-gray-200 shadow-sm">
                <span className="text-5xl font-extrabold text-brand-light select-none block mb-4">
                  {st.step}
                </span>
                <h3 className="text-xl font-bold text-brand-grayDark mb-2">{st.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-brand-primary text-xs font-bold uppercase tracking-widest">Diferenciais</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-grayDark mt-2">
              Por que usar o ObraCalculada?
            </h2>
            <p className="mt-4 text-gray-600 text-base">
              Sem dados fictícios ou regras arbitrárias. Engenharia transparente e aplicável.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            {benefits.map((b, i) => {
              const Icon = b.icon;
              return (
                <div key={i} className="flex items-start gap-4 p-6 rounded-2xl bg-brand-grayLight/60 border border-gray-100">
                  <div className="w-12 h-12 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center flex-shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-brand-grayDark">{b.title}</h3>
                    <p className="mt-1 text-sm text-gray-600 leading-relaxed">{b.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Technical Disclaimers Section */}
      <section className="py-16 bg-amber-50/70 border-y border-amber-200/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 mt-1 shadow-sm">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-3">
              <h3 className="text-lg font-extrabold text-amber-950">Avisos Técnicos e Limites de Responsabilidade</h3>
              <p className="text-sm text-amber-900/90 leading-relaxed">
                As ferramentas disponibilizadas na plataforma <strong>ObraCalculada</strong> têm finalidade exclusiva de assistência em orçamentos preliminares, planejamento logístico e estimativas quantitativas de compras de materiais.
              </p>
              <ul className="text-xs text-amber-900/80 space-y-1.5 list-disc list-inside">
                <li>Os cálculos de concreto e agregados <strong>não constituem dimensionamento estrutural</strong> nem dispensam projeto de fundações e superestruturas assinado por profissional técnico legalmente habilitado.</li>
                <li>As estimativas de fios, cabos e conduítes <strong>não substituem o projeto elétrico</strong> conforme a norma técnica ABNT NBR 5410.</li>
                <li>As estimativas hidrossanitárias <strong>não substituem os projetos de água fria e esgoto</strong> regidos pelas normas NBR 5626 e NBR 8160.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-brand-primary text-xs font-bold uppercase tracking-widest">Dúvidas Frequentes</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-grayDark mt-2">
              Perguntas e Respostas
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="border border-gray-200 rounded-2xl overflow-hidden transition-colors bg-brand-grayLight/40"
              >
                <button
                  onClick={() => toggleFaq(i)}
                  className="w-full text-left px-6 py-5 flex items-center justify-between font-bold text-brand-grayDark hover:text-brand-dark focus:outline-none"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
                      openFaq === i ? 'rotate-180 text-brand-primary' : ''
                    }`}
                  />
                </button>
                {openFaq === i && (
                  <div className="px-6 pb-5 pt-1 text-sm text-gray-600 leading-relaxed border-t border-gray-100">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="py-20 bg-brand-dark text-white text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Pronto para economizar tempo e dinheiro na sua obra?
          </h2>
          <p className="mt-4 text-base text-gray-300 max-w-xl mx-auto">
            Junte-se à plataforma que traz transparência matemática e organização para a sua reforma ou construção.
          </p>
          <div className="mt-8 flex justify-center">
            <Link
              to="/cadastro"
              className="px-8 py-4 rounded-xl text-base font-extrabold text-brand-dark bg-white hover:bg-brand-light shadow-lg transition-all flex items-center gap-2"
            >
              Criar Conta Gratuita Agora
              <ArrowRight className="w-5 h-5 text-brand-primary" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-brand-grayDark text-gray-400 py-10 text-xs text-center border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4">
          <p>© {new Date().getFullYear()} ObraCalculada. Todos os direitos reservados.</p>
          <p className="mt-2 text-gray-500">Estimativas quantitativas para construção civil e reformas residenciais.</p>
        </div>
      </footer>
    </div>
  );
};
