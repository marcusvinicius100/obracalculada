import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Project } from '../types/database';
import {
  Layers,
  Paintbrush,
  Building2,
  HardHat,
  Ruler,
  Zap,
  Droplets,
  Calculator,
  Compass,
  Hammer,
  ShieldAlert,
  Save,
  Share2,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import {
  calculateFlooring,
  calculatePaint,
  calculateMasonry,
  calculateConcrete,
  calculateMortar,
  calculateRoof,
  calculateAggregates,
  calculateLabor,
  calculateElectrical,
  calculatePlumbing,
  calculateWaterproofing,
  convertUnits,
  CONCRETE_MIX_PRESETS,
  CONCRETE_DISCLAIMER,
  ELECTRICAL_DISCLAIMER,
  PLUMBING_DISCLAIMER,
} from '../utils/calculators';
import { formatCurrency, formatNumber } from '../lib/utils';

export const CalculatorsPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('piso');
  const [userProjects, setUserProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // 1. Flooring State
  const [floorArea, setFloorArea] = useState<number>(20);
  const [floorPieceL, setFloorPieceL] = useState<number>(60);
  const [floorPieceW, setFloorPieceW] = useState<number>(60);
  const [floorPiecesBox, setFloorPiecesBox] = useState<number>(4);
  const [floorWaste, setFloorWaste] = useState<number>(10);
  const [floorPriceBox, setFloorPriceBox] = useState<number>(85);

  // 2. Paint State
  const [paintWallArea, setPaintWallArea] = useState<number>(45);
  const [paintOpenings, setPaintOpenings] = useState<number>(4.5);
  const [paintCoats, setPaintCoats] = useState<number>(2);
  const [paintCoverage, setPaintCoverage] = useState<number>(10);
  const [paintSize, setPaintSize] = useState<number>(18);
  const [paintPrice, setPaintPrice] = useState<number>(260);

  // 3. Masonry State
  const [masonryArea, setMasonryArea] = useState<number>(25);
  const [masonryL, setMasonryL] = useState<number>(19);
  const [masonryH, setMasonryH] = useState<number>(19);
  const [masonryJoint, setMasonryJoint] = useState<number>(1.5);
  const [masonryWaste, setMasonryWaste] = useState<number>(8);
  const [masonryPrice, setMasonryPrice] = useState<number>(1.8);

  // 4. Concrete State
  const [concreteL, setConcreteL] = useState<number>(6);
  const [concreteW, setConcreteW] = useState<number>(3);
  const [concreteT, setConcreteT] = useState<number>(0.12);
  const [concreteWaste, setConcreteWaste] = useState<number>(5);
  const [concretePriceM3, setConcretePriceM3] = useState<number>(420);

  // 5. Mortar State
  const [mortarArea, setMortarArea] = useState<number>(30);
  const [mortarCons, setMortarCons] = useState<number>(6);
  const [mortarBagWeight, setMortarBagWeight] = useState<number>(20);
  const [mortarPriceBag, setMortarPriceBag] = useState<number>(26);

  // 6. Roof State
  const [roofL, setRoofL] = useState<number>(10);
  const [roofW, setRoofW] = useState<number>(8);
  const [roofSlope, setRoofSlope] = useState<number>(30);
  const [roofTilesM2, setRoofTilesM2] = useState<number>(14);
  const [roofWaste, setRoofWaste] = useState<number>(6);
  const [roofPriceTile, setRoofPriceTile] = useState<number>(2.5);

  // 7. Aggregates State
  const [aggPreset, setAggPreset] = useState<string>('fundacoes_vigas');
  const [aggVolume, setAggVolume] = useState<number>(2);
  const [aggCementRatio, setAggCementRatio] = useState<number>(1);
  const [aggSandRatio, setAggSandRatio] = useState<number>(2);
  const [aggGravelRatio, setAggGravelRatio] = useState<number>(3);
  const [aggPriceCement, setAggPriceCement] = useState<number>(36);
  const [aggPriceSand, setAggPriceSand] = useState<number>(95);
  const [aggPriceGravel, setAggPriceGravel] = useState<number>(105);

  // 8. Labor State
  const [laborService, setLaborService] = useState<string>('Pintura e emassamento');
  const [laborMode, setLaborMode] = useState<'unit_area' | 'daily_rate'>('unit_area');
  const [laborQty, setLaborQty] = useState<number>(60);
  const [laborUnitPrice, setLaborUnitPrice] = useState<number>(35);
  const [laborWorkers, setLaborWorkers] = useState<number>(2);
  const [laborDays, setLaborDays] = useState<number>(5);
  const [laborDailyRate, setLaborDailyRate] = useState<number>(180);

  // 9. Electrical State
  const [elecOutlets, setElecOutlets] = useState<number>(14);
  const [elecSwitches, setElecSwitches] = useState<number>(5);
  const [elecLights, setElecLights] = useState<number>(8);
  const [elecPriceCableM, setElecPriceCableM] = useState<number>(3.8);
  const [elecPriceOutlet, setElecPriceOutlet] = useState<number>(16);
  const [elecPriceSwitch, setElecPriceSwitch] = useState<number>(14);

  // 10. Plumbing State
  const [plumbWater, setPlumbWater] = useState<number>(6);
  const [plumbSewage, setPlumbSewage] = useState<number>(5);
  const [plumbPricePipeM, setPlumbPricePipeM] = useState<number>(12);
  const [plumbPriceFitting, setPlumbPriceFitting] = useState<number>(6);

  // 11. Waterproofing State
  const [waterArea, setWaterArea] = useState<number>(25);
  const [waterCoverage, setWaterCoverage] = useState<number>(1.2);
  const [waterCoats, setWaterCoats] = useState<number>(3);
  const [waterWeight, setWaterWeight] = useState<number>(18);
  const [waterPrice, setWaterPrice] = useState<number>(130);

  // 12. Unit Converter State
  const [convVal, setConvVal] = useState<number>(10);
  const [convFrom, setConvFrom] = useState<any>('m');
  const [convTo, setConvTo] = useState<any>('cm');

  // Load user projects for "Salvar no Projeto"
  useEffect(() => {
    if (!user) return;
    const fetchProjects = async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (data && !error) {
        setUserProjects(data as Project[]);
        if (data.length > 0) {
          setSelectedProjectId(data[0].id);
        }
      }
    };
    fetchProjects();
  }, [user]);

  // Handle Preset changes for Aggregates
  const handlePresetSelect = (presetKey: string) => {
    setAggPreset(presetKey);
    const p = CONCRETE_MIX_PRESETS[presetKey];
    if (p) {
      setAggCementRatio(p.cementRatio);
      setAggSandRatio(p.sandRatio);
      setAggGravelRatio(p.gravelRatio);
    }
  };

  // Compute Active Results
  let activeTitle = '';
  let activeInputs: Record<string, any> = {};
  let activeOutputs: Record<string, any> = {};
  let activeMaterials: { name: string; quantity: number; unit: string; unit_price: number; category: string }[] = [];
  let formulaExplanation = '';
  let technicalDisclaimer: string | null = null;

  switch (activeTab) {
    case 'piso': {
      activeTitle = 'Cálculo de Pisos e Revestimentos';
      formulaExplanation = 'Área com perda = Área do ambiente × (1 + % perda/100). Caixas = Área com perda ÷ (Área da peça × peças por caixa).';
      const res = calculateFlooring({
        roomArea: Number(floorArea) || 0.1,
        pieceLength: Number(floorPieceL) || 1,
        pieceWidth: Number(floorPieceW) || 1,
        piecesPerBox: Number(floorPiecesBox) || 1,
        wasteMarginPercentage: Number(floorWaste) || 0,
        pricePerBox: Number(floorPriceBox) || 0,
      });
      activeInputs = { floorArea, floorPieceL, floorPieceW, floorPiecesBox, floorWaste, floorPriceBox };
      activeOutputs = res;
      activeMaterials = [
        {
          name: `Piso/Porcelanato (${floorPieceL}x${floorPieceW}cm)`,
          quantity: res.totalBoxes,
          unit: 'caixas',
          unit_price: floorPriceBox,
          category: 'Acabamentos',
        },
      ];
      break;
    }
    case 'tinta': {
      activeTitle = 'Cálculo de Pintura';
      formulaExplanation = 'Área líquida = Área das paredes - Janelas/Portas. Litros = (Área líquida × Demãos) ÷ Rendimento por litro.';
      const res = calculatePaint({
        wallArea: Number(paintWallArea) || 0.1,
        openingsArea: Number(paintOpenings) || 0,
        coats: Number(paintCoats) || 1,
        coveragePerLiter: Number(paintCoverage) || 1,
        containerSizeLitres: Number(paintSize) || 1,
        pricePerContainer: Number(paintPrice) || 0,
      });
      activeInputs = { paintWallArea, paintOpenings, paintCoats, paintCoverage, paintSize, paintPrice };
      activeOutputs = res;
      activeMaterials = [
        {
          name: `Tinta acrílica/látex (${paintSize}L)`,
          quantity: res.containersNeeded,
          unit: 'latas',
          unit_price: paintPrice,
          category: 'Pintura',
        },
      ];
      break;
    }
    case 'alvenaria': {
      activeTitle = 'Cálculo de Tijolos e Alvenaria';
      formulaExplanation = 'Área de cada bloco = (Comprimento + Junta) × (Altura + Junta). Quantidade = (Área parede ÷ Área do bloco) × (1 + % perda).';
      const res = calculateMasonry({
        wallArea: Number(masonryArea) || 0.1,
        blockLengthCm: Number(masonryL) || 1,
        blockHeightCm: Number(masonryH) || 1,
        jointThicknessCm: Number(masonryJoint) || 0,
        wasteMarginPercentage: Number(masonryWaste) || 0,
        pricePerThousandOrUnit: Number(masonryPrice) || 0,
        pricingType: 'unit',
      });
      activeInputs = { masonryArea, masonryL, masonryH, masonryJoint, masonryWaste, masonryPrice };
      activeOutputs = res;
      activeMaterials = [
        {
          name: `Bloco/Tijolo (${masonryL}x${masonryH}cm)`,
          quantity: res.totalBlocks,
          unit: 'unidades',
          unit_price: masonryPrice,
          category: 'Alvenaria',
        },
      ];
      break;
    }
    case 'concreto': {
      activeTitle = 'Cálculo de Concreto Volumétrico';
      formulaExplanation = 'Volume (m³) = Comprimento × Largura × Espessura. Volume com perda = Volume × (1 + % perda/100).';
      technicalDisclaimer = CONCRETE_DISCLAIMER;
      const res = calculateConcrete({
        lengthM: Number(concreteL) || 0.1,
        widthM: Number(concreteW) || 0.1,
        thicknessM: Number(concreteT) || 0.01,
        wasteMarginPercentage: Number(concreteWaste) || 0,
        pricePerM3: Number(concretePriceM3) || 0,
      });
      activeInputs = { concreteL, concreteW, concreteT, concreteWaste, concretePriceM3 };
      activeOutputs = res;
      activeMaterials = [
        {
          name: 'Concreto usinado/preparado (m³)',
          quantity: res.totalVolumeM3,
          unit: 'm³',
          unit_price: concretePriceM3,
          category: 'Estrutura',
        },
      ];
      break;
    }
    case 'argamassa': {
      activeTitle = 'Cálculo de Argamassa';
      formulaExplanation = 'Kg total = Área (m²) × Consumo (kg/m²). Sacos = Kg total ÷ Peso do saco.';
      const res = calculateMortar({
        areaM2: Number(mortarArea) || 0.1,
        consumptionKgPerM2: Number(mortarCons) || 0.1,
        bagWeightKg: Number(mortarBagWeight) || 1,
        pricePerBag: Number(mortarPriceBag) || 0,
      });
      activeInputs = { mortarArea, mortarCons, mortarBagWeight, mortarPriceBag };
      activeOutputs = res;
      activeMaterials = [
        {
          name: `Argamassa colante (${mortarBagWeight}kg)`,
          quantity: res.totalBags,
          unit: 'sacos',
          unit_price: mortarPriceBag,
          category: 'Argamassas',
        },
      ];
      break;
    }
    case 'telhado': {
      activeTitle = 'Cálculo de Telhados e Coberturas';
      formulaExplanation = 'Fator inclinação = √(1 + (inclinação % / 100)²). Área real = Área projetada × Fator. Telhas = Área real × Rendimento/m² × (1 + perda).';
      const res = calculateRoof({
        projectedLengthM: Number(roofL) || 0.1,
        projectedWidthM: Number(roofW) || 0.1,
        slopePercentage: Number(roofSlope) || 0,
        tilesPerM2: Number(roofTilesM2) || 1,
        wasteMarginPercentage: Number(roofWaste) || 0,
        pricePerTile: Number(roofPriceTile) || 0,
      });
      activeInputs = { roofL, roofW, roofSlope, roofTilesM2, roofWaste, roofPriceTile };
      activeOutputs = res;
      activeMaterials = [
        {
          name: 'Telhas cerâmicas/concreto',
          quantity: res.totalTiles,
          unit: 'unidades',
          unit_price: roofPriceTile,
          category: 'Cobertura',
        },
      ];
      break;
    }
    case 'agregados': {
      activeTitle = 'Cálculo de Areia, Cimento e Brita';
      formulaExplanation = 'Volume seco corrigido = Volume final × 1.25. Proporções distribuídas de acordo com os índices volumétricos C:A:B do traço.';
      const res = calculateAggregates({
        volumeM3: Number(aggVolume) || 0.1,
        cementRatio: Number(aggCementRatio) || 1,
        sandRatio: Number(aggSandRatio) || 0,
        gravelRatio: Number(aggGravelRatio) || 0,
        priceCementBag: Number(aggPriceCement) || 0,
        priceSandM3: Number(aggPriceSand) || 0,
        priceGravelM3: Number(aggPriceGravel) || 0,
      });
      activeInputs = { aggPreset, aggVolume, aggCementRatio, aggSandRatio, aggGravelRatio, aggPriceCement, aggPriceSand, aggPriceGravel };
      activeOutputs = res;
      activeMaterials = [
        { name: 'Cimento CP II (sacos 50kg)', quantity: res.cementBags, unit: 'sacos', unit_price: aggPriceCement, category: 'Básicos' },
        { name: 'Areia média lavada', quantity: res.sandVolumeM3, unit: 'm³', unit_price: aggPriceSand, category: 'Básicos' },
        { name: 'Pedra Brita 1', quantity: res.gravelVolumeM3, unit: 'm³', unit_price: aggPriceGravel, category: 'Básicos' },
      ];
      break;
    }
    case 'mao_de_obra': {
      activeTitle = 'Cálculo de Mão de Obra';
      formulaExplanation = 'Por produção: Área/Qtd × Valor unitário. Por diária: Número de operários × Dias trabalhados × Valor da diária.';
      const res = calculateLabor({
        serviceType: laborService,
        calcMode: laborMode,
        quantity: Number(laborQty) || 0,
        unitPrice: Number(laborUnitPrice) || 0,
        numberOfWorkers: Number(laborWorkers) || 1,
        numberOfDays: Number(laborDays) || 1,
        dailyRatePerWorker: Number(laborDailyRate) || 0,
      });
      activeInputs = { laborService, laborMode, laborQty, laborUnitPrice, laborWorkers, laborDays, laborDailyRate };
      activeOutputs = res;
      break;
    }
    case 'eletrica': {
      activeTitle = 'Estimativa de Instalações Elétricas';
      formulaExplanation = 'Média aproximada de cabos (F+N+T) e eletrodutos por ponto com base nas distâncias padrão e circuitos normativos NBR 5410.';
      technicalDisclaimer = ELECTRICAL_DISCLAIMER;
      const res = calculateElectrical({
        powerOutletsCount: Number(elecOutlets) || 0,
        lightSwitchesCount: Number(elecSwitches) || 0,
        lightingPointsCount: Number(elecLights) || 0,
        cableCostPerMeter: Number(elecPriceCableM) || 0,
        outletCostPerUnit: Number(elecPriceOutlet) || 0,
        switchCostPerUnit: Number(elecPriceSwitch) || 0,
      });
      activeInputs = { elecOutlets, elecSwitches, elecLights, elecPriceCableM, elecPriceOutlet, elecPriceSwitch };
      activeOutputs = res;
      activeMaterials = [
        { name: 'Cabo flexível condutor (2.5mm² / 1.5mm²)', quantity: res.estimatedCableMeters, unit: 'metros', unit_price: elecPriceCableM, category: 'Elétrica' },
        { name: 'Eletroduto corrugado flexível', quantity: res.estimatedConduitMeters, unit: 'metros', unit_price: 2.5, category: 'Elétrica' },
        { name: 'Conjunto módulo tomada 10A/20A', quantity: elecOutlets, unit: 'unidades', unit_price: elecPriceOutlet, category: 'Elétrica' },
      ];
      break;
    }
    case 'hidraulica': {
      activeTitle = 'Estimativa de Instalações Hidrossanitárias';
      formulaExplanation = 'Metragem preliminar de tubos de PVC (soldável e esgoto) e conexões conexas por ponto de consumo / descarte de água.';
      technicalDisclaimer = PLUMBING_DISCLAIMER;
      const res = calculatePlumbing({
        waterPointsCount: Number(plumbWater) || 0,
        sewagePointsCount: Number(plumbSewage) || 0,
        estimatedPvcCostPerMeter: Number(plumbPricePipeM) || 0,
        fittingAvgCost: Number(plumbPriceFitting) || 0,
      });
      activeInputs = { plumbWater, plumbSewage, plumbPricePipeM, plumbPriceFitting };
      activeOutputs = res;
      activeMaterials = [
        { name: 'Tubos de PVC água fria/esgoto (barras estimadas)', quantity: res.estimatedPipeMeters, unit: 'metros', unit_price: plumbPricePipeM, category: 'Hidráulica' },
        { name: 'Conexões diversas (joelhos, tês, luvas)', quantity: res.estimatedFittingsCount, unit: 'peças', unit_price: plumbPriceFitting, category: 'Hidráulica' },
      ];
      break;
    }
    case 'impermeabilizacao': {
      activeTitle = 'Cálculo de Impermeabilização';
      formulaExplanation = 'Kg total = Área × Consumo/demão × Demãos. Embalagens = Kg total ÷ Peso da embalagem.';
      const res = calculateWaterproofing({
        areaM2: Number(waterArea) || 0.1,
        coveragePerCoatKgM2: Number(waterCoverage) || 0.1,
        coats: Number(waterCoats) || 1,
        containerWeightKg: Number(waterWeight) || 1,
        pricePerContainer: Number(waterPrice) || 0,
      });
      activeInputs = { waterArea, waterCoverage, waterCoats, waterWeight, waterPrice };
      activeOutputs = res;
      activeMaterials = [
        { name: `Impermeabilizante / Manta líquida (${waterWeight}kg)`, quantity: res.containersNeeded, unit: 'baldes', unit_price: waterPrice, category: 'Impermeabilização' },
      ];
      break;
    }
    case 'conversor': {
      activeTitle = 'Conversor de Unidades da Construção';
      formulaExplanation = 'Conversão direta e precisa entre unidades de medida métricas, lineares, volumétricas e mássicas.';
      let result = 0;
      try {
        result = convertUnits({ value: Number(convVal) || 0, fromUnit: convFrom, toUnit: convTo });
      } catch (err: any) {
        result = 0;
      }
      activeInputs = { convVal, convFrom, convTo };
      activeOutputs = { convertedValue: result };
      break;
    }
  }

  // Handle WhatsApp Share
  const handleShareWhatsApp = () => {
    let text = `*ObraCalculada - ${activeTitle}*\n\n`;
    text += `*Resultados:*\n`;
    for (const [key, val] of Object.entries(activeOutputs)) {
      if (key === 'disclaimer') continue;
      if (typeof val === 'number') {
        text += `• ${key}: ${val}\n`;
      } else {
        text += `• ${key}: ${JSON.stringify(val)}\n`;
      }
    }
    if (activeOutputs.totalCost !== undefined) {
      text += `\n*Investimento Estimado:* ${formatCurrency(activeOutputs.totalCost)}\n`;
    }
    text += `\n_Calculado via ObraCalculada - Gestão e Engenharia na Prática._`;

    const encoded = encodeURIComponent(text);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  // Handle Save in Supabase
  const handleSaveToProject = async () => {
    setSaveSuccess(null);
    setSaveError(null);

    if (!user) {
      setSaveError('Você precisa estar autenticado para salvar em um projeto.');
      return;
    }

    if (!selectedProjectId) {
      setSaveError('Selecione ou crie um projeto primeiro no menu Projetos.');
      return;
    }

    setSaving(true);
    try {
      // 1. Insert into calculations
      const { data: calcData, error: calcErr } = await supabase
        .from('calculations')
        .insert({
          user_id: user.id,
          project_id: selectedProjectId,
          calculator_type: activeTab,
          title: activeTitle,
          inputs: activeInputs,
          outputs: activeOutputs,
        })
        .select()
        .single();

      if (calcErr) {
        throw new Error(`Erro ao salvar cálculo: ${calcErr.message}`);
      }

      // 2. If there are materials, insert into shopping_list_items
      if (activeMaterials.length > 0) {
        const itemsToInsert = activeMaterials.map((mat) => ({
          user_id: user.id,
          project_id: selectedProjectId,
          name: mat.name,
          quantity: mat.quantity,
          unit: mat.unit,
          unit_price: mat.unit_price,
          category: mat.category,
          is_purchased: false,
        }));

        const { error: shopErr } = await supabase.from('shopping_list_items').insert(itemsToInsert);
        if (shopErr) {
          console.warn('Aviso: itens salvos no cálculo, mas erro na lista de compras:', shopErr.message);
        }
      }

      setSaveSuccess(`Cálculo e ${activeMaterials.length} item(ns) salvos no projeto com sucesso!`);
    } catch (err: any) {
      setSaveError(err.message || 'Falha ao salvar no Supabase.');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'piso', label: 'Pisos e Revestimentos', icon: Layers },
    { id: 'tinta', label: 'Pintura e Paredes', icon: Paintbrush },
    { id: 'alvenaria', label: 'Tijolos e Alvenaria', icon: Building2 },
    { id: 'concreto', label: 'Concreto Volumétrico', icon: HardHat },
    { id: 'argamassa', label: 'Argamassa', icon: Hammer },
    { id: 'telhado', label: 'Telhados e Coberturas', icon: Compass },
    { id: 'agregados', label: 'Areia, Cimento e Brita', icon: Calculator },
    { id: 'mao_de_obra', label: 'Mão de Obra', icon: HardHat },
    { id: 'eletrica', label: 'Elétrica', icon: Zap },
    { id: 'hidraulica', label: 'Hidráulica', icon: Droplets },
    { id: 'impermeabilizacao', label: 'Impermeabilização', icon: ShieldAlert },
    { id: 'conversor', label: 'Conversor de Medidas', icon: Ruler },
  ];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-brand-grayDark tracking-tight">
            Central de Calculadoras
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Ferramentas com validação matemática pura e quantitativo detalhado.
          </p>
        </div>

        {/* Project Selector for Saving */}
        <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-gray-200 shadow-sm">
          <span className="text-xs font-semibold text-gray-500">Salvar no Projeto:</span>
          {userProjects.length > 0 ? (
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="text-xs font-bold text-brand-dark bg-transparent focus:outline-none cursor-pointer"
            >
              {userProjects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs text-amber-600 font-medium">Nenhum projeto ativo</span>
          )}
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="overflow-x-auto pb-2 scrollbar-none">
        <div className="flex gap-2 min-w-max">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setActiveTab(t.id);
                  setSaveSuccess(null);
                  setSaveError(null);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                  active
                    ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20'
                    : 'bg-white text-gray-600 hover:bg-gray-100 hover:text-brand-dark border border-gray-200/80'
                }`}
              >
                <Icon className="w-4 h-4" />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notifications */}
      {saveSuccess && (
        <div className="p-4 bg-green-50 border-l-4 border-brand-primary rounded-xl flex items-center gap-3 text-sm text-green-800">
          <CheckCircle2 className="w-5 h-5 text-brand-primary flex-shrink-0" />
          <span>{saveSuccess}</span>
        </div>
      )}
      {saveError && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-xl flex items-center gap-3 text-sm text-red-800">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
          <span>{saveError}</span>
        </div>
      )}

      {/* Calculator Body Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Form Inputs (7 cols on lg) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-lg font-bold text-brand-dark">{activeTitle}</h2>
              <p className="text-xs text-gray-500 mt-0.5">{formulaExplanation}</p>
            </div>
            <button
              onClick={() => {
                // reset active calculator defaults
                setFloorArea(20);
                setFloorWaste(10);
                setPaintWallArea(45);
                setPaintOpenings(4.5);
                setMasonryArea(25);
                setConcreteL(6);
                setMortarArea(30);
                setRoofL(10);
                setRoofSlope(30);
              }}
              title="Restaurar padrões"
              className="p-2 text-gray-400 hover:text-brand-primary hover:bg-gray-50 rounded-lg transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Tab 1: Pisos */}
          {activeTab === 'piso' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Área total do ambiente (m²)</label>
                <input
                  type="number"
                  step="0.1"
                  value={floorArea}
                  onChange={(e) => setFloorArea(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-xl text-sm focus:ring-2 focus:ring-brand-primary focus:border-brand-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Comprimento da peça (cm)</label>
                  <input
                    type="number"
                    value={floorPieceL}
                    onChange={(e) => setFloorPieceL(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Largura da peça (cm)</label>
                  <input
                    type="number"
                    value={floorPieceW}
                    onChange={(e) => setFloorPieceW(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Peças por caixa</label>
                  <input
                    type="number"
                    value={floorPiecesBox}
                    onChange={(e) => setFloorPiecesBox(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Margem de perda (%)</label>
                  <input
                    type="number"
                    value={floorWaste}
                    onChange={(e) => setFloorWaste(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Preço da caixa (R$)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={floorPriceBox}
                    onChange={(e) => setFloorPriceBox(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Tintas */}
          {activeTab === 'tinta' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Área bruta das paredes (m²)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={paintWallArea}
                    onChange={(e) => setPaintWallArea(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Desconto de portas/janelas (m²)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={paintOpenings}
                    onChange={(e) => setPaintOpenings(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Demãos</label>
                  <input
                    type="number"
                    value={paintCoats}
                    onChange={(e) => setPaintCoats(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Rendimento (m²/L)</label>
                  <input
                    type="number"
                    value={paintCoverage}
                    onChange={(e) => setPaintCoverage(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Lata (Litros)</label>
                  <select
                    value={paintSize}
                    onChange={(e) => setPaintSize(parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                  >
                    <option value={18}>18 L (Lata Grande)</option>
                    <option value={3.6}>3.6 L (Galão)</option>
                    <option value={0.9}>0.9 L (Quarto)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Preço lata (R$)</label>
                  <input
                    type="number"
                    value={paintPrice}
                    onChange={(e) => setPaintPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Alvenaria */}
          {activeTab === 'alvenaria' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Área da parede (m²)</label>
                <input
                  type="number"
                  value={masonryArea}
                  onChange={(e) => setMasonryArea(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Comprimento bloco (cm)</label>
                  <input
                    type="number"
                    value={masonryL}
                    onChange={(e) => setMasonryL(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Altura bloco (cm)</label>
                  <input
                    type="number"
                    value={masonryH}
                    onChange={(e) => setMasonryH(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Junta argamassa (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={masonryJoint}
                    onChange={(e) => setMasonryJoint(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Margem de perda (%)</label>
                  <input
                    type="number"
                    value={masonryWaste}
                    onChange={(e) => setMasonryWaste(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Preço por unidade (R$)</label>
                  <input
                    type="number"
                    step="0.05"
                    value={masonryPrice}
                    onChange={(e) => setMasonryPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 4: Concreto */}
          {activeTab === 'concreto' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Comprimento (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={concreteL}
                    onChange={(e) => setConcreteL(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Largura (m)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={concreteW}
                    onChange={(e) => setConcreteW(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Espessura / Altura (m)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={concreteT}
                    onChange={(e) => setConcreteT(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Margem de perda (%)</label>
                  <input
                    type="number"
                    value={concreteWaste}
                    onChange={(e) => setConcreteWaste(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Preço do m³ usinado (R$)</label>
                  <input
                    type="number"
                    value={concretePriceM3}
                    onChange={(e) => setConcretePriceM3(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Argamassa */}
          {activeTab === 'argamassa' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Área total a cobrir (m²)</label>
                <input
                  type="number"
                  value={mortarArea}
                  onChange={(e) => setMortarArea(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Consumo (kg/m²)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={mortarCons}
                    onChange={(e) => setMortarCons(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Peso do saco (kg)</label>
                  <input
                    type="number"
                    value={mortarBagWeight}
                    onChange={(e) => setMortarBagWeight(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Preço do saco (R$)</label>
                  <input
                    type="number"
                    value={mortarPriceBag}
                    onChange={(e) => setMortarPriceBag(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 6: Telhados */}
          {activeTab === 'telhado' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Comprimento em planta (m)</label>
                  <input
                    type="number"
                    value={roofL}
                    onChange={(e) => setRoofL(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Largura em planta (m)</label>
                  <input
                    type="number"
                    value={roofW}
                    onChange={(e) => setRoofW(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Inclinação (%)</label>
                  <input
                    type="number"
                    value={roofSlope}
                    onChange={(e) => setRoofSlope(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Telhas por m²</label>
                  <input
                    type="number"
                    value={roofTilesM2}
                    onChange={(e) => setRoofTilesM2(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Margem de perda (%)</label>
                  <input
                    type="number"
                    value={roofWaste}
                    onChange={(e) => setRoofWaste(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Preço da telha (R$)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={roofPriceTile}
                    onChange={(e) => setRoofPriceTile(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 7: Agregados (Traço Configurável) */}
          {activeTab === 'agregados' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Finalidade da Aplicação</label>
                <select
                  value={aggPreset}
                  onChange={(e) => handlePresetSelect(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                >
                  {Object.entries(CONCRETE_MIX_PRESETS).map(([key, item]) => (
                    <option key={key} value={key}>
                      {item.name} ({item.description})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Volume final necessário (m³)</label>
                <input
                  type="number"
                  step="0.1"
                  value={aggVolume}
                  onChange={(e) => setAggVolume(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div className="p-3 bg-brand-light/30 border border-brand-primary/20 rounded-xl space-y-2">
                <span className="text-xs font-extrabold text-brand-dark block">Índices do Traço Volumétrico:</span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Cimento (partes)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={aggCementRatio}
                      onChange={(e) => setAggCementRatio(parseFloat(e.target.value) || 1)}
                      className="w-full px-2 py-1.5 border rounded-lg text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Areia (partes)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={aggSandRatio}
                      onChange={(e) => setAggSandRatio(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 border rounded-lg text-sm bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Brita (partes)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={aggGravelRatio}
                      onChange={(e) => setAggGravelRatio(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 border rounded-lg text-sm bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Cimento (R$/saco)</label>
                  <input
                    type="number"
                    value={aggPriceCement}
                    onChange={(e) => setAggPriceCement(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Areia (R$/m³)</label>
                  <input
                    type="number"
                    value={aggPriceSand}
                    onChange={(e) => setAggPriceSand(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Brita (R$/m³)</label>
                  <input
                    type="number"
                    value={aggPriceGravel}
                    onChange={(e) => setAggPriceGravel(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 8: Mão de Obra */}
          {activeTab === 'mao_de_obra' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Descrição do Serviço</label>
                <input
                  type="text"
                  value={laborService}
                  onChange={(e) => setLaborService(e.target.value)}
                  placeholder="Ex: Assentamento de porcelanato"
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="labor_mode"
                    checked={laborMode === 'unit_area'}
                    onChange={() => setLaborMode('unit_area')}
                    className="text-brand-primary"
                  />
                  Por Área / Unidade (m² ou peça)
                </label>
                <label className="flex items-center gap-2 text-xs font-bold text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="labor_mode"
                    checked={laborMode === 'daily_rate'}
                    onChange={() => setLaborMode('daily_rate')}
                    className="text-brand-primary"
                  />
                  Por Diária e Equipe
                </label>
              </div>

              {laborMode === 'unit_area' ? (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Quantidade / Metragem</label>
                    <input
                      type="number"
                      value={laborQty}
                      onChange={(e) => setLaborQty(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Preço unitário (R$)</label>
                    <input
                      type="number"
                      value={laborUnitPrice}
                      onChange={(e) => setLaborUnitPrice(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border rounded-xl text-sm"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Profissionais</label>
                    <input
                      type="number"
                      value={laborWorkers}
                      onChange={(e) => setLaborWorkers(parseInt(e.target.value) || 1)}
                      className="w-full px-3 py-2 border rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Dias estimados</label>
                    <input
                      type="number"
                      value={laborDays}
                      onChange={(e) => setLaborDays(parseFloat(e.target.value) || 1)}
                      className="w-full px-3 py-2 border rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Diária (R$/prof.)</label>
                    <input
                      type="number"
                      value={laborDailyRate}
                      onChange={(e) => setLaborDailyRate(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 border rounded-xl text-sm"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 9: Elétrica */}
          {activeTab === 'eletrica' && (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Qtd Tomadas</label>
                  <input
                    type="number"
                    value={elecOutlets}
                    onChange={(e) => setElecOutlets(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Qtd Interruptores</label>
                  <input
                    type="number"
                    value={elecSwitches}
                    onChange={(e) => setElecSwitches(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Pontos de Luz</label>
                  <input
                    type="number"
                    value={elecLights}
                    onChange={(e) => setElecLights(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Cabo (R$/metro)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={elecPriceCableM}
                    onChange={(e) => setElecPriceCableM(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Tomada completa (R$)</label>
                  <input
                    type="number"
                    value={elecPriceOutlet}
                    onChange={(e) => setElecPriceOutlet(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Interruptor (R$)</label>
                  <input
                    type="number"
                    value={elecPriceSwitch}
                    onChange={(e) => setElecPriceSwitch(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 10: Hidráulica */}
          {activeTab === 'hidraulica' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Pontos de água fria/quente</label>
                  <input
                    type="number"
                    value={plumbWater}
                    onChange={(e) => setPlumbWater(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Pontos de ralo / esgoto</label>
                  <input
                    type="number"
                    value={plumbSewage}
                    onChange={(e) => setPlumbSewage(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Preço médio tubo (R$/metro)</label>
                  <input
                    type="number"
                    value={plumbPricePipeM}
                    onChange={(e) => setPlumbPricePipeM(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Preço médio por conexão (R$)</label>
                  <input
                    type="number"
                    value={plumbPriceFitting}
                    onChange={(e) => setPlumbPriceFitting(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 11: Impermeabilização */}
          {activeTab === 'impermeabilizacao' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Área a impermeabilizar (m²)</label>
                  <input
                    type="number"
                    value={waterArea}
                    onChange={(e) => setWaterArea(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Consumo/demão (kg/m²)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={waterCoverage}
                    onChange={(e) => setWaterCoverage(parseFloat(e.target.value) || 0.1)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Demãos</label>
                  <input
                    type="number"
                    value={waterCoats}
                    onChange={(e) => setWaterCoats(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Balde/Lata (kg)</label>
                  <input
                    type="number"
                    value={waterWeight}
                    onChange={(e) => setWaterWeight(parseFloat(e.target.value) || 1)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Preço do balde (R$)</label>
                  <input
                    type="number"
                    value={waterPrice}
                    onChange={(e) => setWaterPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Tab 12: Conversor */}
          {activeTab === 'conversor' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Valor a converter</label>
                <input
                  type="number"
                  step="0.01"
                  value={convVal}
                  onChange={(e) => setConvVal(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">De (Unidade de Origem)</label>
                  <select
                    value={convFrom}
                    onChange={(e) => setConvFrom(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                  >
                    <option value="m">Metros (m)</option>
                    <option value="cm">Centímetros (cm)</option>
                    <option value="mm">Milímetros (mm)</option>
                    <option value="m3">Metros Cúbicos (m³)</option>
                    <option value="l">Litros (L)</option>
                    <option value="kg">Quilos (kg)</option>
                    <option value="ton">Toneladas (ton)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Para (Unidade de Destino)</label>
                  <select
                    value={convTo}
                    onChange={(e) => setConvTo(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                  >
                    <option value="m">Metros (m)</option>
                    <option value="cm">Centímetros (cm)</option>
                    <option value="mm">Milímetros (mm)</option>
                    <option value="m3">Metros Cúbicos (m³)</option>
                    <option value="l">Litros (L)</option>
                    <option value="kg">Quilos (kg)</option>
                    <option value="ton">Toneladas (ton)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Technical Disclaimer if applicable */}
          {technicalDisclaimer && (
            <div className="p-4 bg-amber-50 border-l-4 border-amber-500 rounded-xl flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900 leading-relaxed">{technicalDisclaimer}</p>
            </div>
          )}
        </div>

        {/* Results Card (5 cols on lg) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-brand-primary">
                Resultado do Dimensionamento
              </span>
            </div>

            {/* Dynamic Results Display */}
            <div className="space-y-3">
              {Object.entries(activeOutputs)
                .filter(([k]) => k !== 'disclaimer' && k !== 'totalCost')
                .map(([key, val]) => (
                  <div key={key} className="flex justify-between items-center py-1.5 border-b border-gray-50 text-sm">
                    <span className="text-gray-500 capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</span>
                    <span className="font-extrabold text-brand-grayDark">
                      {typeof val === 'number' ? formatNumber(val) : String(val)}
                    </span>
                  </div>
                ))}
            </div>

            {/* Total Cost Highlight */}
            {activeOutputs.totalCost !== undefined && (
              <div className="p-4 rounded-xl bg-brand-light border border-brand-primary/20 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-brand-dark uppercase tracking-wider block">Custo Estimado</span>
                  <span className="text-2xl font-black text-brand-dark">{formatCurrency(activeOutputs.totalCost)}</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-brand-primary text-white flex items-center justify-center font-bold">
                  R$
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleSaveToProject}
                disabled={saving || !selectedProjectId}
                className="w-full py-3 px-4 rounded-xl font-bold text-sm text-white bg-brand-primary hover:bg-brand-dark transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Salvando no Projeto...' : 'Salvar no Projeto'}
              </button>

              <button
                onClick={handleShareWhatsApp}
                className="w-full py-2.5 px-4 rounded-xl font-bold text-sm text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 transition-colors flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Compartilhar no WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
