import React, { useState } from 'react';
import {
  HelpCircle, ChevronDown, ChevronUp, Calculator, FolderOpen,
  User, AlertTriangle, MessageSquare, ExternalLink, Search
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface FAQItem {
  question: string;
  answer: string;
  link?: { label: string; to: string };
}

interface FAQSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  items: FAQItem[];
}

const sections: FAQSection[] = [
  {
    id: 'calculadoras',
    title: 'Calculadoras',
    icon: <Calculator size={20} />,
    items: [
      {
        question: 'As calculadoras substituem um profissional?',
        answer:
          'Não. As calculadoras do ObraCalculada fornecem estimativas de materiais e custos para fins de planejamento. Projetos estruturais, elétricos, hidráulicos e arquitetônicos devem sempre ser elaborados e assinados por profissionais habilitados (Engenheiros e Arquitetos registrados no CREA/CAU).',
      },
      {
        question: 'O cálculo de concreto é preciso?',
        answer:
          'O cálculo fornece o volume de concreto com base nas dimensões informadas. No entanto, o dimensionamento estrutural (espessuras, armaduras, resistência fck) deve ser definido por um Engenheiro Civil. Nunca utilize apenas esta calculadora para decisões estruturais.',
      },
      {
        question: 'Por que a margem de desperdício é editável?',
        answer:
          'A margem de desperdício varia conforme a habilidade do aplicador, as condições do local e o tipo de serviço. O valor padrão é uma referência comum do mercado, mas você pode ajustá-lo conforme sua experiência ou orientação do fornecedor.',
      },
      {
        question: 'Posso salvar um cálculo em um projeto?',
        answer:
          'Sim. Após realizar um cálculo, clique em "Salvar no Projeto". Os materiais serão enviados automaticamente para a lista de compras do projeto selecionado.',
        link: { label: 'Ir para Calculadoras', to: '/calculadoras' },
      },
      {
        question: 'Os preços informados nas calculadoras são reais?',
        answer:
          'Não. Os campos de preço começam em zero e devem ser preenchidos por você com base em cotações reais do seu fornecedor. O ObraCalculada não inventa preços de mercado.',
      },
    ],
  },
  {
    id: 'projetos',
    title: 'Projetos',
    icon: <FolderOpen size={20} />,
    items: [
      {
        question: 'Como criar um projeto?',
        answer:
          'Acesse o menu "Projetos" e clique em "Novo Projeto". Preencha o nome, descrição, orçamento inicial e data de início. Após salvar, você pode adicionar despesas, listas de compras, cronograma e tarefas dentro do projeto.',
        link: { label: 'Ir para Projetos', to: '/projetos' },
      },
      {
        question: 'Como arquivar ou excluir um projeto?',
        answer:
          'Na página de Projetos, utilize o menu de opções do projeto e selecione "Arquivar". Projetos arquivados não são excluídos permanentemente e podem ser restaurados na aba "Arquivados". A exclusão permanente está disponível na aba de projetos arquivados.',
      },
      {
        question: 'O que é a duplicação de projeto?',
        answer:
          'A duplicação cria uma cópia do projeto com o mesmo nome, orçamento e descrição (sufixo "Cópia"). É útil para reutilizar estruturas de projetos semelhantes sem criar tudo do zero.',
      },
      {
        question: 'Posso exportar e importar projetos?',
        answer:
          'Sim. Na tela de Projetos, utilize o botão "Exportar JSON" para baixar um backup completo do projeto (incluindo despesas e lista de compras). Para restaurar, clique em "Importar JSON" e selecione o arquivo exportado.',
      },
      {
        question: 'Como funciona o cronograma?',
        answer:
          'O cronograma exibe as 13 etapas padrão de uma obra (Planejamento, Fundação, Estrutura, etc.) que podem ser personalizadas com responsáveis, datas e progresso. Os dados são salvos localmente no seu dispositivo.',
        link: { label: 'Ir para Cronograma', to: '/cronograma' },
      },
    ],
  },
  {
    id: 'conta',
    title: 'Conta e Perfil',
    icon: <User size={20} />,
    items: [
      {
        question: 'Como alterar minha senha?',
        answer:
          'Acesse "Perfil" no menu lateral e role até a seção "Alterar Senha". Digite a nova senha (mínimo 6 caracteres) e confirme. Clique em "Salvar Nova Senha".',
        link: { label: 'Ir para Perfil', to: '/perfil' },
      },
      {
        question: 'Como excluir minha conta?',
        answer:
          'Na página de Perfil, role até a "Zona de Perigo" e clique em "Excluir Conta". Você precisará digitar "DELETE" para confirmar. Atenção: esta ação é irreversível e todos os seus dados serão removidos permanentemente.',
      },
      {
        question: 'Meus dados ficam salvos se eu trocar de dispositivo?',
        answer:
          'Seus projetos, despesas, listas de compras e cálculos salvos ficam armazenados no Supabase e são sincronizados automaticamente ao fazer login em qualquer dispositivo. Dados locais (cronograma, checklist, planta baixa) ficam apenas no dispositivo atual.',
      },
      {
        question: 'Esqueci minha senha. O que faço?',
        answer:
          'Na tela de login, clique em "Esqueceu a senha?" e informe o seu e-mail. Você receberá um link para redefinir a senha.',
        link: { label: 'Recuperar Senha', to: '/recuperar-senha' },
      },
    ],
  },
  {
    id: 'tecnicos',
    title: 'Avisos Técnicos',
    icon: <AlertTriangle size={20} />,
    items: [
      {
        question: 'O projeto elétrico pode ser feito pela calculadora?',
        answer:
          'Não. A calculadora elétrica fornece apenas uma estimativa de cabeamento e materiais para fins de planejamento. Todo projeto elétrico deve ser elaborado por Engenheiro Eletricista habilitado, seguindo a norma ABNT NBR 5410.',
      },
      {
        question: 'O projeto hidráulico pode ser feito pela calculadora?',
        answer:
          'Não. A calculadora hidráulica estima tubulações e conexões para fins ilustrativos. O projeto hidráulico deve seguir as normas ABNT NBR 5626 (instalações prediais de água fria) e NBR 8160 (esgoto sanitário), elaborado por profissional habilitado.',
      },
      {
        question: 'A planta baixa criada no ObraCalculada é válida legalmente?',
        answer:
          'Não. O editor de planta baixa é uma ferramenta de esboço e planejamento pessoal. Projetos arquitetônicos e estruturais devem ser desenvolvidos e assinados por Arquiteto (CAU) ou Engenheiro Civil (CREA) conforme exigências legais.',
      },
      {
        question: 'Os orçamentos gerados são contratos ou documentos oficiais?',
        answer:
          'Não. Os PDFs gerados pelo ObraCalculada são estimativas de materiais e custos para uso pessoal e de planejamento. Não possuem validade jurídica como contratos ou propostas comerciais oficiais. Sempre formalize contratos com profissionais qualificados.',
      },
    ],
  },
  {
    id: 'ia',
    title: 'Obra IA',
    icon: <MessageSquare size={20} />,
    items: [
      {
        question: 'O que é o Obra IA?',
        answer:
          'O Obra IA é um assistente de construção civil que responde dúvidas sobre materiais, cálculos e etapas de obra. Ele utiliza as funções das calculadoras do ObraCalculada e nunca inventa preços ou normas técnicas.',
        link: { label: 'Ir para Obra IA', to: '/obra-ia' },
      },
      {
        question: 'O Obra IA substitui um engenheiro ou arquiteto?',
        answer:
          'Não. O Obra IA é uma ferramenta de apoio e informação. Decisões técnicas de projeto, estrutura, elétrica e hidráulica devem ser tomadas por profissionais habilitados.',
      },
      {
        question: 'Minhas conversas com o Obra IA ficam salvas?',
        answer:
          'Sim. Todas as conversas são salvas no Supabase e ficam disponíveis no histórico da tela Obra IA. Você pode criar novas conversas ou continuar conversas anteriores.',
      },
    ],
  },
];

export function HelpPage() {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({ calculadoras: true });
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState('');

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleItem = (key: string) => {
    setOpenItems(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredSections = sections
    .map(section => ({
      ...section,
      items: section.items.filter(
        item =>
          !search ||
          item.question.toLowerCase().includes(search.toLowerCase()) ||
          item.answer.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter(s => s.items.length > 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
          <HelpCircle className="text-brand-primary" size={28} />
          Central de Ajuda
        </h1>
        <p className="text-gray-500 mt-1">Encontre respostas para as dúvidas mais frequentes sobre o ObraCalculada.</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Pesquisar nas perguntas frequentes..."
          className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-primary/40 bg-white"
        />
      </div>

      {filteredSections.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <HelpCircle size={48} className="mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhum resultado encontrado</p>
          <p className="text-sm mt-1">Tente pesquisar com outras palavras.</p>
        </div>
      )}

      {/* Sections */}
      {filteredSections.map(section => (
        <div key={section.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <button
            onClick={() => toggleSection(section.id)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-brand-light/40 transition-colors"
          >
            <div className="flex items-center gap-3 text-brand-dark font-semibold">
              <span className="text-brand-primary">{section.icon}</span>
              {section.title}
              <span className="text-xs font-normal text-gray-400 ml-1">
                ({section.items.length} {section.items.length === 1 ? 'pergunta' : 'perguntas'})
              </span>
            </div>
            {openSections[section.id] ? (
              <ChevronUp size={18} className="text-gray-400" />
            ) : (
              <ChevronDown size={18} className="text-gray-400" />
            )}
          </button>

          {openSections[section.id] && (
            <div className="border-t border-gray-100 divide-y divide-gray-50">
              {section.items.map((item, idx) => {
                const key = `${section.id}-${idx}`;
                return (
                  <div key={key}>
                    <button
                      onClick={() => toggleItem(key)}
                      className="w-full flex items-start justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors gap-4"
                    >
                      <span className="font-medium text-gray-800 flex-1">{item.question}</span>
                      {openItems[key] ? (
                        <ChevronUp size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      ) : (
                        <ChevronDown size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                      )}
                    </button>

                    {openItems[key] && (
                      <div className="px-6 pb-5 text-gray-600 text-sm leading-relaxed space-y-3">
                        <p>{item.answer}</p>
                        {item.link && (
                          <Link
                            to={item.link.to}
                            className="inline-flex items-center gap-1.5 text-brand-primary font-medium hover:underline text-sm"
                          >
                            <ExternalLink size={14} />
                            {item.link.label}
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {/* Footer note */}
      <div className="bg-brand-light border border-brand-primary/20 rounded-2xl p-5 text-sm text-brand-dark">
        <p className="font-semibold mb-1">Não encontrou sua resposta?</p>
        <p className="text-gray-600">
          Use o <strong>Obra IA</strong> para fazer perguntas específicas sobre materiais, cálculos e etapas da sua
          obra.{' '}
          <Link to="/obra-ia" className="text-brand-primary font-medium hover:underline">
            Acessar Obra IA →
          </Link>
        </p>
      </div>
    </div>
  );
}

export default HelpPage;
