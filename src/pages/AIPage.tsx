import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles, Send, Bot, User, Plus, Trash2, MessageSquare,
  ChevronRight, AlertTriangle, Calculator, HardHat, Lightbulb,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// ─── Types ───────────────────────────────────────────────────────────────────

interface AiConversation {
  id: string;
  user_id: string;
  title: string;
  project_id: string | null;
  created_at: string;
}

interface AiMessage {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

// ─── Keyword → calculator mapping ────────────────────────────────────────────

interface CalcHint {
  calculator: string;
  route: string;
  fields: string[];
  tip: string;
}

const KEYWORD_MAP: Array<{ keywords: string[]; hint: CalcHint }> = [
  {
    keywords: ['piso', 'porcelanato', 'cerâmica', 'revestimento', 'azulejo'],
    hint: {
      calculator: 'Pisos e Revestimentos',
      route: '/calculadoras',
      fields: ['Área do ambiente (m²)', 'Dimensões da peça (cm)', 'Peças por caixa', 'Margem de perda (%)', 'Preço por caixa'],
      tip: 'Assentamento reto: 10% de perda. Diagonal ou peças ≥ 80 cm: 15%. Use argamassa AC-II ou AC-III conforme ABNT NBR 14081.',
    },
  },
  {
    keywords: ['tinta', 'pintura', 'teto', 'parede', 'fachada'],
    hint: {
      calculator: 'Tintas',
      route: '/calculadoras',
      fields: ['Área das paredes/teto (m²)', 'Área de aberturas (portas/janelas)', 'Número de demãos', 'Rendimento por litro (m²/L)', 'Tamanho da embalagem (L)', 'Preço por embalagem'],
      tip: 'Aplique selador acrílico antes das demãos em reboco novo. Rendimento médio: 10–12 m²/L em 1 demão.',
    },
  },
  {
    keywords: ['tijolo', 'bloco', 'alvenaria', 'parede de alvenaria'],
    hint: {
      calculator: 'Tijolos e Blocos',
      route: '/calculadoras',
      fields: ['Área da parede (m²)', 'Dimensões do bloco (cm)', 'Espessura da junta (cm)', 'Margem de perda (%)', 'Preço por unidade ou milheiro'],
      tip: 'Junta padrão de argamassa: 1,5 cm. Inclua aberturas de portas e janelas para descontar da área total.',
    },
  },
  {
    keywords: ['concreto', 'laje', 'viga', 'pilar', 'fundação', 'lastro'],
    hint: {
      calculator: 'Concreto',
      route: '/calculadoras',
      fields: ['Comprimento (m)', 'Largura (m)', 'Espessura/Altura (m)', 'Margem de perda (%)', 'Preço por m³'],
      tip: '⚠️ Esta calculadora estima volume para orçamento preliminar. Dimensionamento estrutural exige ART/RRT de engenheiro civil habilitado.',
    },
  },
  {
    keywords: ['argamassa', 'chapisco', 'reboco', 'contrapiso', 'assentamento'],
    hint: {
      calculator: 'Argamassa',
      route: '/calculadoras',
      fields: ['Área (m²)', 'Consumo em kg/m²', 'Peso do saco (kg)', 'Preço por saco'],
      tip: 'Consumos típicos: chapisco ~4 kg/m², reboco ~20 kg/m², contrapiso ~40 kg/m² (5 cm). Consulte a ficha técnica do produto.',
    },
  },
  {
    keywords: ['telhado', 'telha', 'cobertura', 'teto'],
    hint: {
      calculator: 'Telhados',
      route: '/calculadoras',
      fields: ['Comprimento projetado (m)', 'Largura projetada (m)', 'Inclinação (%)', 'Telhas por m²', 'Margem de perda (%)', 'Preço por telha'],
      tip: 'A calculadora corrige a área real pela inclinação. Telhas cerâmicas comuns: ~10,5 unid/m². Verifique a ficha do fabricante.',
    },
  },
  {
    keywords: ['areia', 'cimento', 'brita', 'traço', 'betonada'],
    hint: {
      calculator: 'Traço de Concreto/Argamassa',
      route: '/calculadoras',
      fields: ['Volume desejado (m³)', 'Traço (cimento:areia:brita)', 'Fator água/cimento', 'Preço de cada insumo'],
      tip: 'Traço 1:2:3 (cimento:areia:brita) é comum para estruturas de baixo risco. Para Fck ≥ 20 MPa use concreto dosado em central.',
    },
  },
];

// ─── Local deterministic AI response ─────────────────────────────────────────

function generateAssistantReply(userText: string): string {
  const lower = userText.toLowerCase();

  const matched = KEYWORD_MAP.filter(({ keywords }) =>
    keywords.some((kw) => lower.includes(kw))
  );

  if (matched.length === 0) {
    // Generic construction guidance
    if (lower.includes('projeto') || lower.includes('planta') || lower.includes('aprovação')) {
      return (
        '📐 **Projetos e Aprovações**\n\n' +
        'Para aprovação de projetos residenciais, o processo geral envolve:\n' +
        '1. Projeto arquitetônico assinado por profissional habilitado (CAU/CREA);\n' +
        '2. ART ou RRT recolhida no conselho correspondente;\n' +
        '3. Protocolo na prefeitura com documentos do terreno e do proprietário;\n' +
        '4. Aguardar análise e emissão de alvará de construção.\n\n' +
        'Os prazos e taxas variam conforme o município. Consulte a seção de Projetos no sistema para gerenciar seus documentos. Os valores exatos dependem da tabela de emolumentos local — informe-se na sua prefeitura.'
      );
    }
    if (lower.includes('custo') || lower.includes('orçamento') || lower.includes('preço') || lower.includes('quanto')) {
      return (
        '💰 **Orçamento de Obras**\n\n' +
        'Para elaborar um orçamento preciso você precisa:\n' +
        '1. **Levantamento de quantitativos** — use as calculadoras disponíveis em /calculadoras;\n' +
        '2. **Coleta de preços locais** — os preços variam significativamente por região e fornecedor;\n' +
        '3. **BDI (Bonificações e Despesas Indiretas)** — costuma ser 20–30% sobre o custo direto;\n' +
        '4. **Cronograma financeiro** — distribuição dos gastos por etapa.\n\n' +
        '⚠️ Não utilizo tabelas de preços prontas pois elas envelhecem rapidamente. Insira os preços reais do seu fornecedor nas calculadoras para obter valores confiáveis.'
      );
    }
    if (lower.includes('norma') || lower.includes('abnt') || lower.includes('nit') || lower.includes('regulament')) {
      return (
        '📋 **Normas Técnicas**\n\n' +
        'As principais normas da construção civil brasileira são publicadas pela ABNT. Algumas referências frequentes:\n' +
        '- **NBR 6118** – Projeto de estruturas de concreto;\n' +
        '- **NBR 7190** – Projeto de estruturas de madeira;\n' +
        '- **NBR 9050** – Acessibilidade;\n' +
        '- **NBR 15575** – Desempenho de edificações habitacionais;\n' +
        '- **NBR 14081** – Argamassas para assentamento de revestimentos cerâmicos.\n\n' +
        'Os textos oficiais são comercializados pelo site da ABNT. Consulte sempre a versão vigente com o profissional responsável pela obra.'
      );
    }
    return (
      '🤖 **Assistente ObraCalculada**\n\n' +
      'Posso ajudar com dúvidas sobre materiais, cálculo de quantitativos e planejamento de obras. Experimente perguntar sobre:\n\n' +
      '• Pisos, revestimentos e cerâmicas\n' +
      '• Tintas e pintura\n' +
      '• Tijolos e alvenaria\n' +
      '• Concreto, lajes e fundações\n' +
      '• Argamassa e reboco\n' +
      '• Telhados e coberturas\n' +
      '• Traço de concreto e argamassa\n\n' +
      'Para cada tema, indico qual calculadora usar e os dados que você precisa levantar. Os valores finais sempre dependem dos preços praticados pelos fornecedores da sua região.'
    );
  }

  const parts: string[] = [];

  for (const { hint } of matched) {
    parts.push(
      `🧮 **Calculadora: ${hint.calculator}** → [Acessar](/calculadoras)\n\n` +
      `**Campos que você precisará preencher:**\n${hint.fields.map((f) => `• ${f}`).join('\n')}\n\n` +
      `💡 **Dica técnica:** ${hint.tip}`
    );
  }

  parts.push(
    '\n⚠️ **Importante:** Os valores calculados dependem inteiramente dos preços praticados pelos seus fornecedores locais. Não utilizo tabelas de preços prontas — insira os preços reais nas calculadoras para obter estimativas confiáveis.'
  );

  return parts.join('\n\n---\n\n');
}

// ─── Component ───────────────────────────────────────────────────────────────

export const AIPage: React.FC = () => {
  const { user } = useAuth();

  const [conversations, setConversations] = useState<AiConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);

  // ── Load conversations ──
  const loadConversations = useCallback(async () => {
    if (!user) return;
    setLoadingConvs(true);
    const { data, error: err } = await supabase
      .from('ai_conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!err && data) setConversations(data as AiConversation[]);
    setLoadingConvs(false);
  }, [user]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // ── Load messages when active conversation changes ──
  useEffect(() => {
    if (!activeConvId) { setMessages([]); return; }
    setLoadingMsgs(true);
    supabase
      .from('ai_messages')
      .select('*')
      .eq('conversation_id', activeConvId)
      .order('created_at', { ascending: true })
      .then(({ data, error: err }) => {
        if (!err && data) setMessages(data as AiMessage[]);
        setLoadingMsgs(false);
      });
  }, [activeConvId]);

  // ── Auto-scroll ──
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── New conversation ──
  const handleNewConversation = async () => {
    if (!user) return;
    const title = `Conversa ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
    const { data, error: err } = await supabase
      .from('ai_conversations')
      .insert({ user_id: user.id, title, project_id: null })
      .select()
      .single();

    if (!err && data) {
      setConversations((prev) => [data as AiConversation, ...prev]);
      setActiveConvId((data as AiConversation).id);
    }
  };

  // ── Clear messages ──
  const handleClearMessages = async () => {
    if (!activeConvId) return;
    await supabase
      .from('ai_messages')
      .delete()
      .eq('conversation_id', activeConvId);
    setMessages([]);
    setShowClearModal(false);
  };

  // ── Send message ──
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || !user || !activeConvId || sending) return;

    setSending(true);
    setError(null);
    setInput('');

    // Insert user message
    const { data: userMsg, error: userErr } = await supabase
      .from('ai_messages')
      .insert({ conversation_id: activeConvId, user_id: user.id, role: 'user', content: text })
      .select()
      .single();

    if (userErr) { setError('Erro ao salvar mensagem.'); setSending(false); return; }
    setMessages((prev) => [...prev, userMsg as AiMessage]);

    // Generate and insert assistant reply
    const reply = generateAssistantReply(text);
    const { data: assistantMsg, error: assistErr } = await supabase
      .from('ai_messages')
      .insert({ conversation_id: activeConvId, user_id: user.id, role: 'assistant', content: reply })
      .select()
      .single();

    if (!assistErr && assistantMsg) {
      setMessages((prev) => [...prev, assistantMsg as AiMessage]);

      // Update conversation title from first user message if default title
      const conv = conversations.find((c) => c.id === activeConvId);
      if (conv && conv.title.startsWith('Conversa ') && messages.length === 0) {
        const shortTitle = text.length > 50 ? text.slice(0, 50) + '…' : text;
        await supabase
          .from('ai_conversations')
          .update({ title: shortTitle })
          .eq('id', activeConvId);
        setConversations((prev) =>
          prev.map((c) => (c.id === activeConvId ? { ...c, title: shortTitle } : c))
        );
      }
    }

    setSending(false);
  };

  // ── Render message content (simple markdown-like) ──
  const renderContent = (text: string) => {
    return text.split('\n').map((line, i) => {
      // Bold **text**
      const parts = line.split(/(\*\*[^*]+\*\*)/g).map((p, j) =>
        p.startsWith('**') && p.endsWith('**')
          ? <strong key={j}>{p.slice(2, -2)}</strong>
          : p
      );
      return <p key={i} className="mb-1 leading-relaxed">{parts}</p>;
    });
  };

  return (
    <div className="flex h-[calc(100vh-64px)] bg-gray-50 overflow-hidden">

      {/* ── Sidebar ── */}
      <aside className="w-72 flex-shrink-0 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200" style={{ backgroundColor: '#145C3B' }}>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-5 h-5 text-white" />
            <h2 className="text-white font-semibold text-sm">Obra IA</h2>
          </div>
          <button
            onClick={handleNewConversation}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium text-white border border-white/30 hover:bg-white/10 transition-colors"
          >
            <Plus className="w-4 h-4" /> Nova Conversa
          </button>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto py-2">
          {loadingConvs ? (
            <p className="text-xs text-gray-400 text-center mt-6">Carregando…</p>
          ) : conversations.length === 0 ? (
            <div className="text-center px-4 mt-8">
              <MessageSquare className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-400">Nenhuma conversa ainda.</p>
              <p className="text-xs text-gray-400">Clique em "Nova Conversa".</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setActiveConvId(conv.id)}
                className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 transition-colors flex items-start gap-2 border-b border-gray-100 ${
                  activeConvId === conv.id ? 'bg-green-50 border-l-2' : ''
                }`}
                style={activeConvId === conv.id ? { borderLeftColor: '#198754' } : {}}
              >
                <ChevronRight className="w-3 h-3 mt-0.5 flex-shrink-0 text-gray-400" />
                <div className="overflow-hidden">
                  <p className="truncate font-medium text-gray-700" style={{ color: activeConvId === conv.id ? '#145C3B' : undefined }}>
                    {conv.title}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {new Date(conv.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </aside>

      {/* ── Main Chat ── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {!activeConvId ? (
          /* Welcome screen */
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ backgroundColor: '#E8F5ED' }}>
              <Sparkles className="w-8 h-8" style={{ color: '#198754' }} />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Obra IA</h1>
            <p className="text-gray-500 max-w-md mb-6">
              Assistente técnico de construção civil. Faça perguntas sobre materiais, quantitativos e planejamento de obras.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-xl w-full">
              {[
                { icon: <Calculator className="w-5 h-5" />, label: 'Quantitativos', desc: 'Pisos, tintas, blocos, concreto…' },
                { icon: <HardHat className="w-5 h-5" />, label: 'Materiais', desc: 'Dicas técnicas e especificações' },
                { icon: <Lightbulb className="w-5 h-5" />, label: 'Planejamento', desc: 'Orçamento, etapas e projetos' },
              ].map((card) => (
                <button
                  key={card.label}
                  onClick={handleNewConversation}
                  className="p-4 rounded-xl border border-gray-200 bg-white hover:border-green-300 hover:shadow-sm transition-all text-left"
                >
                  <div className="mb-2" style={{ color: '#198754' }}>{card.icon}</div>
                  <p className="font-semibold text-gray-700 text-sm">{card.label}</p>
                  <p className="text-xs text-gray-400 mt-1">{card.desc}</p>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-6">Clique em um cartão ou em "Nova Conversa" para começar.</p>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5" style={{ color: '#198754' }} />
                <span className="font-medium text-gray-700 text-sm">
                  {conversations.find((c) => c.id === activeConvId)?.title ?? 'Conversa'}
                </span>
              </div>
              <button
                onClick={() => setShowClearModal(true)}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 transition-colors px-2 py-1 rounded hover:bg-red-50"
              >
                <Trash2 className="w-3.5 h-3.5" /> Limpar
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {loadingMsgs ? (
                <p className="text-sm text-gray-400 text-center mt-8">Carregando mensagens…</p>
              ) : messages.length === 0 ? (
                <div className="text-center mt-8">
                  <p className="text-sm text-gray-400">Nenhuma mensagem ainda. Faça sua primeira pergunta!</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: '#E8F5ED' }}>
                        <Bot className="w-4 h-4" style={{ color: '#198754' }} />
                      </div>
                    )}
                    <div
                      className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                        msg.role === 'user'
                          ? 'text-white rounded-br-sm'
                          : 'bg-white text-gray-700 border border-gray-100 rounded-bl-sm'
                      }`}
                      style={msg.role === 'user' ? { backgroundColor: '#198754' } : {}}
                    >
                      {msg.role === 'assistant' ? renderContent(msg.content) : <p>{msg.content}</p>}
                      <p className={`text-xs mt-2 ${msg.role === 'user' ? 'text-green-100' : 'text-gray-400'}`}>
                        {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center bg-gray-200">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                    )}
                  </div>
                ))
              )}
              {sending && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center" style={{ backgroundColor: '#E8F5ED' }}>
                    <Bot className="w-4 h-4" style={{ color: '#198754' }} />
                  </div>
                  <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <span key={i} className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#198754', animationDelay: `${i * 0.15}s` }} />
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Error */}
            {error && (
              <div className="mx-6 mb-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-600">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {error}
              </div>
            )}

            {/* Disclaimer */}
            <div className="mx-6 mb-2 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>As respostas são orientativas. Consulte sempre um profissional habilitado (CREA/CAU) para decisões estruturais.</span>
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="bg-white border-t border-gray-200 px-6 py-4 flex gap-3 flex-shrink-0">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pergunte sobre materiais, cálculos ou planejamento…"
                disabled={sending}
                className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:border-transparent disabled:bg-gray-50"
                style={{ '--tw-ring-color': '#198754' } as React.CSSProperties}
              />
              <button
                type="submit"
                disabled={!input.trim() || sending}
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-opacity disabled:opacity-40"
                style={{ backgroundColor: '#198754' }}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </>
        )}
      </main>

      {/* ── Clear confirmation modal ── */}
      {showClearModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="font-semibold text-gray-800">Limpar conversa</h3>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              Todas as mensagens desta conversa serão excluídas permanentemente. Deseja continuar?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowClearModal(false)}
                className="flex-1 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleClearMessages}
                className="flex-1 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
              >
                Limpar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIPage;
