import React, { useState } from 'react';
import {
  Home, Bed, UtensilsCrossed, Bath, Car, Trees, Hammer,
  Calculator, ChevronDown, ChevronUp, AlertCircle, RefreshCw,
} from 'lucide-react';
import {
  calculateFlooring,
  calculatePaint,
  calculateMortar,
  calculateWaterproofing,
  calculateLabor,
} from '../utils/calculators';
import { formatCurrency } from '../lib/utils';

type RoomType = 'sala' | 'quarto' | 'cozinha' | 'banheiro' | 'garagem' | 'area_externa' | 'personalizado';

interface RoomConfig {
  label: string;
  icon: React.ReactNode;
  suggestions: string[];
}

const ROOMS: Record<RoomType, RoomConfig> = {
  sala: {
    label: 'Sala',
    icon: <Home size={22} />,
    suggestions: ['piso', 'pintura', 'mao_de_obra_piso', 'mao_de_obra_pintura'],
  },
  quarto: {
    label: 'Quarto',
    icon: <Bed size={22} />,
    suggestions: ['piso', 'pintura', 'mao_de_obra_pintura'],
  },
  cozinha: {
    label: 'Cozinha',
    icon: <UtensilsCrossed size={22} />,
    suggestions: ['piso', 'parede', 'argamassa', 'mao_de_obra_piso'],
  },
  banheiro: {
    label: 'Banheiro',
    icon: <Bath size={22} />,
    suggestions: ['piso', 'parede', 'impermeabilizacao', 'argamassa', 'mao_de_obra_piso'],
  },
  garagem: {
    label: 'Garagem',
    icon: <Car size={22} />,
    suggestions: ['piso', 'pintura', 'impermeabilizacao'],
  },
  area_externa: {
    label: 'Área Externa',
    icon: <Trees size={22} />,
    suggestions: ['piso', 'impermeabilizacao', 'mao_de_obra_piso'],
  },
  personalizado: {
    label: 'Personalizado',
    icon: <Hammer size={22} />,
    suggestions: ['piso', 'pintura', 'argamassa', 'impermeabilizacao', 'mao_de_obra_piso'],
  },
};

const SUGGESTION_LABELS: Record<string, string> = {
  piso: 'Piso/Revestimento (60×60cm)',
  parede: 'Revestimento de Parede (30×60cm)',
  pintura: 'Pintura (paredes)',
  argamassa: 'Argamassa',
  impermeabilizacao: 'Impermeabilização',
  mao_de_obra_piso: 'Mão de Obra — Revestimento',
  mao_de_obra_pintura: 'Mão de Obra — Pintura',
};

interface SimInput {
  area: string;
  wallHeight: string;
  tilePrice: string;
  paintPrice: string;
  mortarPrice: string;
  waterproofPrice: string;
  laborPrice: string;
}

const defaultInput: SimInput = {
  area: '',
  wallHeight: '2.8',
  tilePrice: '',
  paintPrice: '',
  mortarPrice: '',
  waterproofPrice: '',
  laborPrice: '',
};

interface SimResult {
  label: string;
  detail: string;
  cost: number;
}

export function RenovationSimulatorPage() {
  const [selectedRoom, setSelectedRoom] = useState<RoomType>('sala');
  const [inputs, setInputs] = useState<SimInput>(defaultInput);
  const [results, setResults] = useState<SimResult[] | null>(null);
  const [openInfo, setOpenInfo] = useState(false);

  function handleInput(field: keyof SimInput, value: string) {
    setInputs(prev => ({ ...prev, [field]: value }));
  }

  function simulate() {
    const area = parseFloat(inputs.area) || 0;
    if (area <= 0) return;
    const wallH = parseFloat(inputs.wallHeight) || 2.8;
    const tileP = parseFloat(inputs.tilePrice) || 0;
    const paintP = parseFloat(inputs.paintPrice) || 0;
    const mortarP = parseFloat(inputs.mortarPrice) || 0;
    const waterP = parseFloat(inputs.waterproofPrice) || 0;
    const laborP = parseFloat(inputs.laborPrice) || 0;

    const perimeter = Math.sqrt(area) * 4; // approx square room
    const wallArea = perimeter * wallH;

    const suggestions = ROOMS[selectedRoom].suggestions;
    const res: SimResult[] = [];

    try {
      // Floor tiles
      if (suggestions.includes('piso')) {
        const r = calculateFlooring({
          roomArea: area,
          pieceLength: 60,
          pieceWidth: 60,
          piecesPerBox: 4,
          wasteMarginPercentage: 10,
          pricePerBox: tileP,
        });
        res.push({
          label: 'Piso/Revestimento',
          detail: `${r.totalBoxes} caixas (60×60cm, 10% desperdício)`,
          cost: r.totalCost,
        });
      }

      // Wall tiles (kitchen/bathroom)
      if (suggestions.includes('parede')) {
        const r = calculateFlooring({
          roomArea: wallArea * 0.7,
          pieceLength: 30,
          pieceWidth: 60,
          piecesPerBox: 6,
          wasteMarginPercentage: 12,
          pricePerBox: tileP,
        });
        res.push({
          label: 'Revestimento de Parede',
          detail: `${r.totalBoxes} caixas (30×60cm, 12% desperdício)`,
          cost: r.totalCost,
        });
      }

      // Paint
      if (suggestions.includes('pintura')) {
        const r = calculatePaint({
          wallArea: wallArea,
          openingsArea: area * 0.1,
          coats: 2,
          coveragePerLiter: 10,
          containerSizeLitres: 18,
          pricePerContainer: paintP,
        });
        res.push({
          label: 'Pintura (paredes)',
          detail: `${r.litersNeeded.toFixed(1)}L — ${r.containersNeeded} latas de 18L`,
          cost: r.totalCost,
        });
      }

      // Mortar
      if (suggestions.includes('argamassa')) {
        const mortarArea = area + (suggestions.includes('parede') ? wallArea * 0.7 : 0);
        const r = calculateMortar({
          areaM2: mortarArea,
          consumptionKgPerM2: 5,
          bagWeightKg: 20,
          pricePerBag: mortarP,
        });
        res.push({
          label: 'Argamassa',
          detail: `${r.totalBags} sacos de 20kg`,
          cost: r.totalCost,
        });
      }

      // Waterproofing
      if (suggestions.includes('impermeabilizacao')) {
        const r = calculateWaterproofing({
          areaM2: area,
          coats: 2,
          coveragePerCoatKgM2: 1.0,
          containerWeightKg: 18,
          pricePerContainer: waterP,
        });
        res.push({
          label: 'Impermeabilização',
          detail: `${r.totalKg.toFixed(1)}kg — ${r.containersNeeded} embalagens de 18kg`,
          cost: r.totalCost,
        });
      }

      // Labor (tiling)
      if (suggestions.includes('mao_de_obra_piso')) {
        const r = calculateLabor({
          serviceType: 'Revestimento',
          calcMode: 'unit_area',
          quantity: area,
          unitPrice: laborP,
          numberOfWorkers: 1,
          numberOfDays: Math.ceil(area / 15),
          dailyRatePerWorker: 0,
        });
        res.push({
          label: 'Mão de Obra — Revestimento',
          detail: `${Math.ceil(area / 15)} dias estimados (1 profissional)`,
          cost: r.totalCost,
        });
      }

      // Labor (painting)
      if (suggestions.includes('mao_de_obra_pintura')) {
        const r = calculateLabor({
          serviceType: 'Pintura',
          calcMode: 'unit_area',
          quantity: wallArea,
          unitPrice: laborP,
          numberOfWorkers: 1,
          numberOfDays: Math.ceil(wallArea / 40),
          dailyRatePerWorker: 0,
        });
        res.push({
          label: 'Mão de Obra — Pintura',
          detail: `${Math.ceil(wallArea / 40)} dias estimados (1 profissional)`,
          cost: r.totalCost,
        });
      }
    } catch {
      // silently skip invalid calc inputs
    }

    setResults(res);
  }

  function reset() {
    setInputs(defaultInput);
    setResults(null);
  }

  const totalCost = results?.reduce((s, r) => s + r.cost, 0) || 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
          <Hammer className="text-brand-primary" size={28} />
          Simulador de Reforma
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Selecione o ambiente e informe as medidas para estimar os materiais e custos da reforma.
        </p>
      </div>

      {/* Disclaimer */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
        <AlertCircle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800">
          Este simulador fornece estimativas de materiais e custos para fins de planejamento. Os valores dependem de preços inseridos pelo usuário. Não substitui orçamento profissional ou projeto técnico.
        </p>
      </div>

      {/* Room selector */}
      <div>
        <label className="block text-sm font-semibold text-brand-dark mb-3">Escolha o Ambiente</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(Object.keys(ROOMS) as RoomType[]).map(room => (
            <button
              key={room}
              onClick={() => { setSelectedRoom(room); setResults(null); }}
              className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                selectedRoom === room
                  ? 'border-brand-primary bg-brand-light text-brand-dark'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-brand-primary/40'
              }`}
            >
              <span className={selectedRoom === room ? 'text-brand-primary' : 'text-gray-400'}>
                {ROOMS[room].icon}
              </span>
              {ROOMS[room].label}
            </button>
          ))}
        </div>
      </div>

      {/* Suggestions info */}
      <div>
        <button
          onClick={() => setOpenInfo(!openInfo)}
          className="text-sm text-brand-primary flex items-center gap-1 hover:underline"
        >
          <Calculator size={14} />
          Calculadoras sugeridas para {ROOMS[selectedRoom].label}
          {openInfo ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>
        {openInfo && (
          <ul className="mt-2 ml-5 list-disc text-sm text-gray-600 space-y-1">
            {ROOMS[selectedRoom].suggestions.map(s => (
              <li key={s}>{SUGGESTION_LABELS[s] || s}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Inputs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <h2 className="font-semibold text-brand-dark">Medidas e Preços</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Área do Ambiente (m²) *</label>
            <input
              type="number"
              min="0"
              value={inputs.area}
              onChange={e => handleInput('area', e.target.value)}
              placeholder="ex: 20"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Altura da Parede (m)</label>
            <input
              type="number"
              min="0"
              value={inputs.wallHeight}
              onChange={e => handleInput('wallHeight', e.target.value)}
              placeholder="2.8"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
            />
          </div>
        </div>

        <p className="text-xs text-gray-400">Preencha os preços que deseja calcular (deixe em branco para omitir o item):</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { field: 'tilePrice' as keyof SimInput, label: 'Preço da Caixa de Piso/Revest. (R$)' },
            { field: 'paintPrice' as keyof SimInput, label: 'Preço da Tinta por Litro (R$)', hint: 'usado em latas de 18L' },
            { field: 'mortarPrice' as keyof SimInput, label: 'Preço do Saco de Argamassa (R$)' },
            { field: 'waterproofPrice' as keyof SimInput, label: 'Preço Impermeabilização/Litro (R$)' },
            { field: 'laborPrice' as keyof SimInput, label: 'Preço Mão de Obra /m² (R$)' },
          ].map(({ field, label, hint }) => (
            <div key={field}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
              {hint && <p className="text-xs text-gray-400 mb-1">{hint}</p>}
              <input
                type="number"
                min="0"
                value={inputs[field]}
                onChange={e => handleInput(field, e.target.value)}
                placeholder="0,00"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/40"
              />
            </div>
          ))}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={simulate}
            disabled={!inputs.area || parseFloat(inputs.area) <= 0}
            className="flex-1 bg-brand-primary text-white py-2.5 rounded-xl font-semibold hover:bg-brand-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Simular
          </button>
          <button
            onClick={reset}
            className="flex items-center gap-1.5 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={15} />
            Limpar
          </button>
        </div>
      </div>

      {/* Results */}
      {results && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
          <h2 className="font-semibold text-brand-dark">
            Estimativa — {ROOMS[selectedRoom].label} ({inputs.area} m²)
          </h2>

          {results.length === 0 ? (
            <p className="text-gray-500 text-sm">Nenhum item calculado. Verifique se a área está correta.</p>
          ) : (
            <div className="space-y-3">
              {results.map((r, i) => (
                <div key={i} className="flex items-start justify-between gap-4 py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{r.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{r.detail}</p>
                  </div>
                  <span className="font-semibold text-brand-dark text-sm whitespace-nowrap">
                    {r.cost > 0 ? formatCurrency(r.cost) : '—'}
                  </span>
                </div>
              ))}

              <div className="flex items-center justify-between pt-3 border-t-2 border-brand-primary/20">
                <span className="font-bold text-brand-dark">Estimativa Total</span>
                <span className="text-xl font-bold text-brand-primary">{formatCurrency(totalCost)}</span>
              </div>

              <p className="text-xs text-gray-400 pt-1">
                * Estimativa baseada nas medidas e preços informados. Obtenha cotações reais com seus fornecedores.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default RenovationSimulatorPage;
