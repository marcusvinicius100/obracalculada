import { z } from 'zod';

/**
 * 1. PISOS E REVESTIMENTOS
 */
export const FlooringInputSchema = z.object({
  roomArea: z.number().positive('Área do ambiente deve ser maior que zero'),
  pieceLength: z.number().positive('Comprimento da peça em cm deve ser maior que zero'),
  pieceWidth: z.number().positive('Largura da peça em cm deve ser maior que zero'),
  piecesPerBox: z.number().int().positive('Peças por caixa deve ser número inteiro positivo'),
  wasteMarginPercentage: z.number().min(0, 'Margem de perda não pode ser negativa').default(10),
  pricePerBox: z.number().min(0, 'Preço por caixa não pode ser negativo').default(0),
});

export type FlooringInput = z.input<typeof FlooringInputSchema>;

export function calculateFlooring(input: FlooringInput) {
  const data = FlooringInputSchema.parse(input);
  const pieceAreaM2 = (data.pieceLength / 100) * (data.pieceWidth / 100);
  const boxCoverageM2 = pieceAreaM2 * data.piecesPerBox;
  const areaWithWaste = data.roomArea * (1 + data.wasteMarginPercentage / 100);
  const totalPieces = Math.ceil(areaWithWaste / pieceAreaM2);
  const totalBoxes = Math.ceil(areaWithWaste / boxCoverageM2);
  const totalCost = totalBoxes * data.pricePerBox;
  const actualCoveredArea = totalBoxes * boxCoverageM2;

  return {
    pieceAreaM2: Number(pieceAreaM2.toFixed(4)),
    boxCoverageM2: Number(boxCoverageM2.toFixed(2)),
    areaWithWaste: Number(areaWithWaste.toFixed(2)),
    totalPieces,
    totalBoxes,
    totalCost: Number(totalCost.toFixed(2)),
    actualCoveredArea: Number(actualCoveredArea.toFixed(2)),
  };
}

/**
 * 2. TINTAS
 */
export const PaintInputSchema = z.object({
  wallArea: z.number().positive('Área das paredes deve ser maior que zero'),
  openingsArea: z.number().min(0, 'Área de portas e janelas não pode ser negativa').default(0),
  coats: z.number().int().min(1, 'Número de demãos deve ser pelo menos 1').default(2),
  coveragePerLiter: z.number().positive('Rendimento por litro (m²/L) deve ser maior que zero').default(10),
  containerSizeLitres: z.number().positive('Tamanho da lata/galão deve ser maior que zero').default(18),
  pricePerContainer: z.number().min(0, 'Preço da embalagem não pode ser negativo').default(0),
});

export type PaintInput = z.input<typeof PaintInputSchema>;

export function calculatePaint(input: PaintInput) {
  const data = PaintInputSchema.parse(input);
  const effectiveArea = Math.max(0, data.wallArea - data.openingsArea);
  const totalPaintedArea = effectiveArea * data.coats;
  const litersNeeded = totalPaintedArea / data.coveragePerLiter;
  const containersNeeded = Math.ceil(litersNeeded / data.containerSizeLitres);
  const totalCost = containersNeeded * data.pricePerContainer;

  return {
    effectiveArea: Number(effectiveArea.toFixed(2)),
    totalPaintedArea: Number(totalPaintedArea.toFixed(2)),
    litersNeeded: Number(litersNeeded.toFixed(2)),
    containersNeeded,
    totalCost: Number(totalCost.toFixed(2)),
  };
}

/**
 * 3. TIJOLOS E BLOCOS
 */
export const MasonryInputSchema = z.object({
  wallArea: z.number().positive('Área da parede deve ser maior que zero'),
  blockLengthCm: z.number().positive('Comprimento do bloco deve ser positivo'),
  blockHeightCm: z.number().positive('Altura do bloco deve ser positiva'),
  jointThicknessCm: z.number().min(0, 'Espessura da junta não pode ser negativa').default(1.5),
  wasteMarginPercentage: z.number().min(0).default(10),
  pricePerThousandOrUnit: z.number().min(0).default(0),
  pricingType: z.enum(['unit', 'thousand']).default('unit'),
});

export type MasonryInput = z.input<typeof MasonryInputSchema>;

export function calculateMasonry(input: MasonryInput) {
  const data = MasonryInputSchema.parse(input);
  const totalLengthM = (data.blockLengthCm + data.jointThicknessCm) / 100;
  const totalHeightM = (data.blockHeightCm + data.jointThicknessCm) / 100;
  const blockFaceAreaM2 = totalLengthM * totalHeightM;
  const blocksPerM2 = 1 / blockFaceAreaM2;
  const netBlocks = data.wallArea * blocksPerM2;
  const totalBlocks = Math.ceil(netBlocks * (1 + data.wasteMarginPercentage / 100));

  let totalCost = 0;
  if (data.pricingType === 'thousand') {
    totalCost = (totalBlocks / 1000) * data.pricePerThousandOrUnit;
  } else {
    totalCost = totalBlocks * data.pricePerThousandOrUnit;
  }

  return {
    blocksPerM2: Number(blocksPerM2.toFixed(1)),
    netBlocks: Math.round(netBlocks),
    totalBlocks,
    totalCost: Number(totalCost.toFixed(2)),
  };
}

/**
 * 4. CONCRETO
 */
export const ConcreteInputSchema = z.object({
  lengthM: z.number().positive('Comprimento deve ser maior que zero'),
  widthM: z.number().positive('Largura deve ser maior que zero'),
  thicknessM: z.number().positive('Espessura/Altura deve ser maior que zero'),
  wasteMarginPercentage: z.number().min(0).default(5),
  pricePerM3: z.number().min(0).default(0),
});

export type ConcreteInput = z.input<typeof ConcreteInputSchema>;

export const CONCRETE_DISCLAIMER = 'Atenção: Este cálculo volumétrico serve exclusivamente para estimativa quantitativa de materiais e orçamento preliminar. NÃO substitui o dimensionamento estrutural, cálculo de cargas, projeto de armadura ou laudo de responsabilidade técnica (ART/RRT) emitido por engenheiro civil ou calculista habilitado.';

export function calculateConcrete(input: ConcreteInput) {
  const data = ConcreteInputSchema.parse(input);
  const netVolumeM3 = data.lengthM * data.widthM * data.thicknessM;
  const totalVolumeM3 = netVolumeM3 * (1 + data.wasteMarginPercentage / 100);
  const totalCost = totalVolumeM3 * data.pricePerM3;

  return {
    netVolumeM3: Number(netVolumeM3.toFixed(3)),
    totalVolumeM3: Number(totalVolumeM3.toFixed(3)),
    totalCost: Number(totalCost.toFixed(2)),
    disclaimer: CONCRETE_DISCLAIMER,
  };
}

/**
 * 5. ARGAMASSA
 */
export const MortarInputSchema = z.object({
  areaM2: z.number().positive('Área deve ser maior que zero'),
  consumptionKgPerM2: z.number().positive('Consumo (kg/m²) deve ser maior que zero'),
  bagWeightKg: z.number().positive('Peso do saco deve ser maior que zero').default(20),
  pricePerBag: z.number().min(0).default(0),
});

export type MortarInput = z.input<typeof MortarInputSchema>;

export function calculateMortar(input: MortarInput) {
  const data = MortarInputSchema.parse(input);
  const totalKg = data.areaM2 * data.consumptionKgPerM2;
  const totalBags = Math.ceil(totalKg / data.bagWeightKg);
  const totalCost = totalBags * data.pricePerBag;

  return {
    totalKg: Number(totalKg.toFixed(2)),
    totalBags,
    totalCost: Number(totalCost.toFixed(2)),
  };
}

/**
 * 6. TELHADOS
 */
export const RoofInputSchema = z.object({
  projectedLengthM: z.number().positive('Comprimento projetado deve ser positivo'),
  projectedWidthM: z.number().positive('Largura projetada deve ser positiva'),
  slopePercentage: z.number().min(0, 'Inclinação não pode ser negativa'),
  tilesPerM2: z.number().positive('Telhas por m² deve ser maior que zero').default(10.5),
  wasteMarginPercentage: z.number().min(0).default(5),
  pricePerTile: z.number().min(0).default(0),
});

export type RoofInput = z.input<typeof RoofInputSchema>;

export function calculateRoof(input: RoofInput) {
  const data = RoofInputSchema.parse(input);
  const projectedAreaM2 = data.projectedLengthM * data.projectedWidthM;
  const slopeFactor = Math.sqrt(1 + Math.pow(data.slopePercentage / 100, 2));
  const realInclinedAreaM2 = projectedAreaM2 * slopeFactor;
  const netTiles = realInclinedAreaM2 * data.tilesPerM2;
  const totalTiles = Math.ceil(netTiles * (1 + data.wasteMarginPercentage / 100));
  const totalCost = totalTiles * data.pricePerTile;

  return {
    projectedAreaM2: Number(projectedAreaM2.toFixed(2)),
    slopeFactor: Number(slopeFactor.toFixed(4)),
    realInclinedAreaM2: Number(realInclinedAreaM2.toFixed(2)),
    netTiles: Math.round(netTiles),
    totalTiles,
    totalCost: Number(totalCost.toFixed(2)),
  };
}

/**
 * 7. AREIA, CIMENTO E BRITA (TRAÇO CONFIGURÁVEL)
 */
export interface ConcreteMixPreset {
  name: string;
  description: string;
  cementRatio: number;
  sandRatio: number;
  gravelRatio: number;
  waterRatio: number;
}

export const CONCRETE_MIX_PRESETS: Record<string, ConcreteMixPreset> = {
  fundacoes_vigas: {
    name: 'Fundações, Vigas e Pilares (Estrutural ~20-25 MPa)',
    description: 'Traço 1 : 2 : 3 (1 cimento, 2 areia média, 3 brita 1)',
    cementRatio: 1,
    sandRatio: 2,
    gravelRatio: 3,
    waterRatio: 0.55,
  },
  pisos_contrapisos: {
    name: 'Contrapiso e Calçadas',
    description: 'Traço 1 : 3 : 4 (1 cimento, 3 areia, 4 brita)',
    cementRatio: 1,
    sandRatio: 3,
    gravelRatio: 4,
    waterRatio: 0.6,
  },
  reboco_alvenaria: {
    name: 'Argamassa para Reboco/Assentamento (Sem Brita)',
    description: 'Traço 1 : 4 (1 cimento, 4 areia)',
    cementRatio: 1,
    sandRatio: 4,
    gravelRatio: 0,
    waterRatio: 0.65,
  },
  concreto_magro: {
    name: 'Concreto Magro para Lastro de Fundação',
    description: 'Traço 1 : 4 : 8 (1 cimento, 4 areia, 8 brita)',
    cementRatio: 1,
    sandRatio: 4,
    gravelRatio: 8,
    waterRatio: 0.8,
  },
};

export const AggregatesInputSchema = z.object({
  volumeM3: z.number().positive('Volume em m³ deve ser maior que zero'),
  cementRatio: z.number().positive('Índice de cimento deve ser maior que zero'),
  sandRatio: z.number().min(0, 'Índice de areia não pode ser negativo'),
  gravelRatio: z.number().min(0, 'Índice de brita não pode ser negativo'),
  cementBagWeightKg: z.number().positive().default(50),
  priceCementBag: z.number().min(0).default(0),
  priceSandM3: z.number().min(0).default(0),
  priceGravelM3: z.number().min(0).default(0),
});

export type AggregatesInput = z.input<typeof AggregatesInputSchema>;

export function calculateAggregates(input: AggregatesInput) {
  const data = AggregatesInputSchema.parse(input);
  const totalParts = data.cementRatio + data.sandRatio + data.gravelRatio;
  if (totalParts <= 0) {
    throw new Error('A soma dos índices do traço deve ser maior que zero');
  }

  const yieldFactor = 1.25; 
  const totalDryVolume = data.volumeM3 * yieldFactor;

  const cementVolumeM3 = (data.cementRatio / totalParts) * totalDryVolume;
  const sandVolumeM3 = (data.sandRatio / totalParts) * totalDryVolume;
  const gravelVolumeM3 = (data.gravelRatio / totalParts) * totalDryVolume;

  const cementTotalKg = cementVolumeM3 * 1400;
  const cementBags = Math.ceil(cementTotalKg / data.cementBagWeightKg);

  const costCement = cementBags * data.priceCementBag;
  const costSand = sandVolumeM3 * data.priceSandM3;
  const costGravel = gravelVolumeM3 * data.priceGravelM3;
  const totalCost = costCement + costSand + costGravel;

  return {
    cementBags,
    cementTotalKg: Math.round(cementTotalKg),
    sandVolumeM3: Number(sandVolumeM3.toFixed(2)),
    gravelVolumeM3: Number(gravelVolumeM3.toFixed(2)),
    costCement: Number(costCement.toFixed(2)),
    costSand: Number(costSand.toFixed(2)),
    costGravel: Number(costGravel.toFixed(2)),
    totalCost: Number(totalCost.toFixed(2)),
  };
}

/**
 * 8. MÃO DE OBRA
 */
export const LaborInputSchema = z.object({
  serviceType: z.string().min(1, 'Tipo de serviço é obrigatório'),
  calcMode: z.enum(['unit_area', 'daily_rate']),
  quantity: z.number().min(0).default(0),
  unitPrice: z.number().min(0).default(0),
  numberOfWorkers: z.number().int().min(1).default(1),
  numberOfDays: z.number().min(0).default(1),
  dailyRatePerWorker: z.number().min(0).default(0),
});

export type LaborInput = z.input<typeof LaborInputSchema>;

export function calculateLabor(input: LaborInput) {
  const data = LaborInputSchema.parse(input);
  let totalCost = 0;

  if (data.calcMode === 'unit_area') {
    totalCost = data.quantity * data.unitPrice;
  } else {
    totalCost = data.numberOfWorkers * data.numberOfDays * data.dailyRatePerWorker;
  }

  return {
    serviceType: data.serviceType,
    calcMode: data.calcMode,
    totalCost: Number(totalCost.toFixed(2)),
  };
}

/**
 * 9. ELÉTRICA
 */
export const ElectricalInputSchema = z.object({
  powerOutletsCount: z.number().int().min(0, 'Quantidade de tomadas não pode ser negativa'),
  lightSwitchesCount: z.number().int().min(0, 'Quantidade de interruptores não pode ser negativa'),
  lightingPointsCount: z.number().int().min(0, 'Pontos de luz não podem ser negativos'),
  circuitsCount: z.number().int().min(1, 'Pelo menos 1 circuito').default(4),
  avgDistancePerPointM: z.number().positive().default(8),
  cableCostPerMeter: z.number().min(0).default(0),
  outletCostPerUnit: z.number().min(0).default(0),
  switchCostPerUnit: z.number().min(0).default(0),
});

export type ElectricalInput = z.input<typeof ElectricalInputSchema>;

export const ELECTRICAL_DISCLAIMER = 'Atenção: Este cálculo representa uma estimativa média preliminar para compra inicial de insumos. NÃO substitui um projeto elétrico formal com diagrama unifilar, dimensionamento de disjuntores, equilíbrio de fases e cálculo de queda de tensão conforme a norma NBR 5410. Consulte sempre um eletricista qualificado ou engenheiro eletricista.';

export function calculateElectrical(input: ElectricalInput) {
  const data = ElectricalInputSchema.parse(input);
  const totalPoints = data.powerOutletsCount + data.lightSwitchesCount + data.lightingPointsCount;
  const estimatedCableMeters = totalPoints * data.avgDistancePerPointM * 2.5; 
  const estimatedConduitMeters = totalPoints * (data.avgDistancePerPointM * 0.8);

  const materialsCost = 
    (estimatedCableMeters * data.cableCostPerMeter) +
    (data.powerOutletsCount * data.outletCostPerUnit) +
    (data.lightSwitchesCount * data.switchCostPerUnit);

  return {
    totalPoints,
    estimatedCableMeters: Math.ceil(estimatedCableMeters),
    estimatedConduitMeters: Math.ceil(estimatedConduitMeters),
    recommendedCircuits: Math.max(data.circuitsCount, Math.ceil(totalPoints / 8)),
    totalCost: Number(materialsCost.toFixed(2)),
    disclaimer: ELECTRICAL_DISCLAIMER,
  };
}

/**
 * 10. HIDRÁULICA
 */
export const PlumbingInputSchema = z.object({
  waterPointsCount: z.number().int().min(0, 'Pontos de água não podem ser negativos'),
  sewagePointsCount: z.number().int().min(0, 'Pontos de esgoto não podem ser negativos'),
  avgPipesMetersPerPoint: z.number().positive().default(3.5),
  estimatedPvcCostPerMeter: z.number().min(0).default(0),
  avgFittingsPerPoint: z.number().min(0).default(4),
  fittingAvgCost: z.number().min(0).default(0),
});

export type PlumbingInput = z.input<typeof PlumbingInputSchema>;

export const PLUMBING_DISCLAIMER = 'Atenção: Estimativa quantitativa preliminar de conexões e tubos. Não substitui o projeto hidrossanitário regulamentado pelas normas ABNT NBR 5626 (água fria) e NBR 8160 (esgoto), que define diâmetros, pressões, caixas de gordura e respiros adequados.';

export function calculatePlumbing(input: PlumbingInput) {
  const data = PlumbingInputSchema.parse(input);
  const totalPoints = data.waterPointsCount + data.sewagePointsCount;
  const estimatedPipeMeters = totalPoints * data.avgPipesMetersPerPoint;
  const estimatedFittingsCount = Math.ceil(totalPoints * data.avgFittingsPerPoint);

  const totalCost = (estimatedPipeMeters * data.estimatedPvcCostPerMeter) + (estimatedFittingsCount * data.fittingAvgCost);

  return {
    totalPoints,
    estimatedPipeMeters: Number(estimatedPipeMeters.toFixed(1)),
    estimatedFittingsCount,
    totalCost: Number(totalCost.toFixed(2)),
    disclaimer: PLUMBING_DISCLAIMER,
  };
}

/**
 * 11. IMPERMEABILIZAÇÃO
 */
export const WaterproofingInputSchema = z.object({
  areaM2: z.number().positive('Área a impermeabilizar deve ser maior que zero'),
  coveragePerCoatKgM2: z.number().positive('Consumo por demão deve ser maior que zero').default(1.0),
  coats: z.number().int().min(1, 'Número de demãos deve ser pelo menos 1').default(3),
  containerWeightKg: z.number().positive('Peso da embalagem (ex: 18kg) deve ser positivo').default(18),
  pricePerContainer: z.number().min(0).default(0),
});

export type WaterproofingInput = z.input<typeof WaterproofingInputSchema>;

export function calculateWaterproofing(input: WaterproofingInput) {
  const data = WaterproofingInputSchema.parse(input);
  const totalKg = data.areaM2 * data.coveragePerCoatKgM2 * data.coats;
  const containersNeeded = Math.ceil(totalKg / data.containerWeightKg);
  const totalCost = containersNeeded * data.pricePerContainer;

  return {
    totalKg: Number(totalKg.toFixed(2)),
    containersNeeded,
    totalCost: Number(totalCost.toFixed(2)),
  };
}

/**
 * 12. CONVERSOR DE MEDIDAS
 */
export type MeasurementUnit = 'm' | 'cm' | 'mm' | 'm2' | 'm3' | 'l' | 'kg' | 'ton';

export const UnitConvertInputSchema = z.object({
  value: z.number(),
  fromUnit: z.enum(['m', 'cm', 'mm', 'm2', 'm3', 'l', 'kg', 'ton']),
  toUnit: z.enum(['m', 'cm', 'mm', 'm2', 'm3', 'l', 'kg', 'ton']),
});

export type UnitConvertInput = z.input<typeof UnitConvertInputSchema>;

export function convertUnits(input: UnitConvertInput): number {
  const { value, fromUnit, toUnit } = UnitConvertInputSchema.parse(input);
  if (fromUnit === toUnit) return value;

  const lengthToMeters: Record<string, number> = { m: 1, cm: 0.01, mm: 0.001 };
  if (['m', 'cm', 'mm'].includes(fromUnit) && ['m', 'cm', 'mm'].includes(toUnit)) {
    const meters = value * lengthToMeters[fromUnit];
    return Number((meters / lengthToMeters[toUnit]).toFixed(4));
  }

  if (['m3', 'l'].includes(fromUnit) && ['m3', 'l'].includes(toUnit)) {
    if (fromUnit === 'm3' && toUnit === 'l') return value * 1000;
    if (fromUnit === 'l' && toUnit === 'm3') return Number((value / 1000).toFixed(4));
  }

  if (['kg', 'ton'].includes(fromUnit) && ['kg', 'ton'].includes(toUnit)) {
    if (fromUnit === 'ton' && toUnit === 'kg') return value * 1000;
    if (fromUnit === 'kg' && toUnit === 'ton') return Number((value / 1000).toFixed(4));
  }

  throw new Error(`Conversão incompatível entre grandezas: de ${fromUnit} para ${toUnit}`);
}
