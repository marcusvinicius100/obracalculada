import { describe, it, expect } from 'vitest';
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
  CONCRETE_DISCLAIMER,
  ELECTRICAL_DISCLAIMER,
  PLUMBING_DISCLAIMER,
} from '../calculators';

describe('Calculadoras de Materiais e Construção', () => {
  describe('9.1 Pisos e Revestimentos', () => {
    it('deve calcular corretamente caixas e peças com margem de perda e decimais', () => {
      // 20.5 m², peça 60x60cm (0.36m²), 4 peças por caixa (1.44m²/cx), 10% perda, R$ 85 por caixa
      const res = calculateFlooring({
        roomArea: 20.5,
        pieceLength: 60,
        pieceWidth: 60,
        piecesPerBox: 4,
        wasteMarginPercentage: 10,
        pricePerBox: 85,
      });

      expect(res.pieceAreaM2).toBe(0.36);
      expect(res.boxCoverageM2).toBe(1.44);
      expect(res.areaWithWaste).toBe(22.55);
      // 22.55 / 1.44 = 15.65 -> 16 caixas
      expect(res.totalBoxes).toBe(16);
      expect(res.totalCost).toBe(16 * 85);
    });

    it('deve rejeitar valores zerados ou negativos para dimensões e área', () => {
      expect(() =>
        calculateFlooring({
          roomArea: 0,
          pieceLength: 60,
          pieceWidth: 60,
          piecesPerBox: 4,
          wasteMarginPercentage: 10,
          pricePerBox: 50,
        })
      ).toThrow();
    });
  });

  describe('9.2 Tintas', () => {
    it('deve calcular litros e latas descontando aberturas', () => {
      // 50m² paredes, 5.5m² aberturas, 2 demãos, 10m²/L, lata 18L, R$ 250
      const res = calculatePaint({
        wallArea: 50,
        openingsArea: 5.5,
        coats: 2,
        coveragePerLiter: 10,
        containerSizeLitres: 18,
        pricePerContainer: 250,
      });

      expect(res.effectiveArea).toBe(44.5);
      expect(res.totalPaintedArea).toBe(89);
      expect(res.litersNeeded).toBe(8.9);
      expect(res.containersNeeded).toBe(1); // 8.9L cabe em 1 lata de 18L
      expect(res.totalCost).toBe(250);
    });

    it('deve validar demãos mínima de 1', () => {
      expect(() =>
        calculatePaint({
          wallArea: 30,
          openingsArea: 0,
          coats: 0,
          coveragePerLiter: 10,
          containerSizeLitres: 18,
          pricePerContainer: 100,
        })
      ).toThrow();
    });
  });

  describe('9.3 Alvenaria (Tijolos e Blocos)', () => {
    it('deve calcular quantidade de blocos considerando junta de argamassa', () => {
      // Parede 15m², bloco 19x19 cm, junta 1.5cm, perda 10%, R$ 1.50 un
      const res = calculateMasonry({
        wallArea: 15,
        blockLengthCm: 19,
        blockHeightCm: 19,
        jointThicknessCm: 1.5,
        wasteMarginPercentage: 10,
        pricePerThousandOrUnit: 1.5,
        pricingType: 'unit',
      });

      // face total: (0.205) * (0.205) = 0.042025 m² -> ~23.8 blocos/m²
      expect(res.blocksPerM2).toBeGreaterThan(20);
      expect(res.totalBlocks).toBeGreaterThan(res.netBlocks);
      expect(res.totalCost).toBe(res.totalBlocks * 1.5);
    });
  });

  describe('9.4 Concreto e Aviso Técnico', () => {
    it('deve calcular volume cúbico com perda e incluir disclaimer obrigatório', () => {
      const res = calculateConcrete({
        lengthM: 10.5,
        widthM: 0.2,
        thicknessM: 0.4,
        wasteMarginPercentage: 5,
        pricePerM3: 400,
      });

      // 10.5 * 0.2 * 0.4 = 0.84 m³ * 1.05 = 0.882 m³
      expect(res.netVolumeM3).toBe(0.84);
      expect(res.totalVolumeM3).toBe(0.882);
      expect(res.totalCost).toBe(352.8);
      expect(res.disclaimer).toBe(CONCRETE_DISCLAIMER);
    });
  });

  describe('9.5 Argamassa', () => {
    it('deve calcular consumo em kg e quantidade de sacos', () => {
      const res = calculateMortar({
        areaM2: 25.5,
        consumptionKgPerM2: 5, // 5 kg/m²
        bagWeightKg: 20,
        pricePerBag: 28,
      });

      // 25.5 * 5 = 127.5 kg -> 127.5 / 20 = 6.375 -> 7 sacos
      expect(res.totalKg).toBe(127.5);
      expect(res.totalBags).toBe(7);
      expect(res.totalCost).toBe(7 * 28);
    });
  });

  describe('9.6 Telhados', () => {
    it('deve corrigir área plana para área inclinada com base na inclinação %', () => {
      const res = calculateRoof({
        projectedLengthM: 10,
        projectedWidthM: 8,
        slopePercentage: 30, // 30% de inclinação
        tilesPerM2: 15,
        wasteMarginPercentage: 5,
        pricePerTile: 2.2,
      });

      expect(res.projectedAreaM2).toBe(80);
      // fator ~ sqrt(1 + 0.3^2) = sqrt(1.09) ~ 1.044
      expect(res.realInclinedAreaM2).toBeGreaterThan(80);
      expect(res.totalTiles).toBeGreaterThan(res.netTiles);
    });
  });

  describe('9.7 Areia, Cimento e Brita (Traço Configurável)', () => {
    it('deve calcular proporções configuráveis e sacos de cimento', () => {
      const res = calculateAggregates({
        volumeM3: 1, // 1 m³ de concreto
        cementRatio: 1,
        sandRatio: 2,
        gravelRatio: 3,
        cementBagWeightKg: 50,
        priceCementBag: 35,
        priceSandM3: 90,
        priceGravelM3: 100,
      });

      expect(res.cementBags).toBeGreaterThan(0);
      expect(res.sandVolumeM3).toBeGreaterThan(0);
      expect(res.gravelVolumeM3).toBeGreaterThan(0);
      expect(res.totalCost).toBe(res.costCement + res.costSand + res.costGravel);
    });
  });

  describe('9.8 Mão de Obra', () => {
    it('deve calcular por m² e por diária', () => {
      const resArea = calculateLabor({
        serviceType: 'Assentamento de Piso',
        calcMode: 'unit_area',
        quantity: 50,
        unitPrice: 45,
        numberOfWorkers: 1,
        numberOfDays: 1,
        dailyRatePerWorker: 0,
      });
      expect(resArea.totalCost).toBe(2250);

      const resDaily = calculateLabor({
        serviceType: 'Pintura Geral',
        calcMode: 'daily_rate',
        quantity: 0,
        unitPrice: 0,
        numberOfWorkers: 2,
        numberOfDays: 5,
        dailyRatePerWorker: 180,
      });
      expect(resDaily.totalCost).toBe(2 * 5 * 180);
    });
  });

  describe('9.9 Elétrica e Aviso Obrigatório', () => {
    it('deve estimar cabos e conduítes e incluir aviso normativo NBR 5410', () => {
      const res = calculateElectrical({
        powerOutletsCount: 12,
        lightSwitchesCount: 4,
        lightingPointsCount: 6,
        circuitsCount: 4,
        avgDistancePerPointM: 8,
        cableCostPerMeter: 3.5,
        outletCostPerUnit: 15,
        switchCostPerUnit: 12,
      });

      expect(res.totalPoints).toBe(22);
      expect(res.estimatedCableMeters).toBeGreaterThan(100);
      expect(res.disclaimer).toBe(ELECTRICAL_DISCLAIMER);
    });
  });

  describe('9.10 Hidráulica e Aviso Obrigatório', () => {
    it('deve calcular pontos e tubos com aviso NBR 5626/8160', () => {
      const res = calculatePlumbing({
        waterPointsCount: 5,
        sewagePointsCount: 4,
        avgPipesMetersPerPoint: 3,
        estimatedPvcCostPerMeter: 12,
        avgFittingsPerPoint: 3,
        fittingAvgCost: 5,
      });

      expect(res.totalPoints).toBe(9);
      expect(res.estimatedPipeMeters).toBe(27);
      expect(res.disclaimer).toBe(PLUMBING_DISCLAIMER);
    });
  });

  describe('9.11 Impermeabilização', () => {
    it('deve calcular consumo em kg e embalagens com demãos', () => {
      const res = calculateWaterproofing({
        areaM2: 30,
        coveragePerCoatKgM2: 1.2,
        coats: 3,
        containerWeightKg: 18,
        pricePerContainer: 120,
      });

      // 30 * 1.2 * 3 = 108 kg -> 108 / 18 = 6 embalagens
      expect(res.totalKg).toBe(108);
      expect(res.containersNeeded).toBe(6);
      expect(res.totalCost).toBe(720);
    });
  });

  describe('9.12 Conversor de Medidas', () => {
    it('deve converter m para cm e mm', () => {
      expect(convertUnits({ value: 2.5, fromUnit: 'm', toUnit: 'cm' })).toBe(250);
      expect(convertUnits({ value: 1500, fromUnit: 'mm', toUnit: 'm' })).toBe(1.5);
    });

    it('deve converter m³ para litros e litros para m³', () => {
      expect(convertUnits({ value: 2, fromUnit: 'm3', toUnit: 'l' })).toBe(2000);
      expect(convertUnits({ value: 500, fromUnit: 'l', toUnit: 'm3' })).toBe(0.5);
    });

    it('deve converter kg para toneladas e vice-versa', () => {
      expect(convertUnits({ value: 3500, fromUnit: 'kg', toUnit: 'ton' })).toBe(3.5);
      expect(convertUnits({ value: 1.2, fromUnit: 'ton', toUnit: 'kg' })).toBe(1200);
    });

    it('deve disparar erro ao tentar converter unidades incompatíveis (ex: m para kg)', () => {
      expect(() =>
        convertUnits({ value: 10, fromUnit: 'm', toUnit: 'kg' })
      ).toThrow();
    });
  });
});
