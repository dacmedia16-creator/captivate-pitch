import type { SubjectProperty } from "./useMarketSimilarity";

export interface AdjustmentItem {
  adjustment_type: string;
  label: string;
  percentage: number;
  value: number;
  direction: "positive" | "negative" | "neutral";
}

export interface ComparableWithAdjustments {
  comparable_id: string;
  original_price: number;
  adjusted_price: number;
  adjustments: AdjustmentItem[];
}

export interface AdjustmentWeights {
  pool: number;
  gourmet_area: number;
  master_suite: number;
  extra_parking: number;
  better_conservation: number;
  newer_building: number;
  privileged_view: number;
  premium_location: number;
  larger_land: number;
}

const DEFAULT_WEIGHTS: AdjustmentWeights = {
  pool: 4,
  gourmet_area: 2.5,
  master_suite: 2,
  extra_parking: 1.5,
  better_conservation: 5,
  newer_building: 3,
  privileged_view: 4,
  premium_location: 3,
  larger_land: 3,
};

const CONSERVATION_LEVELS: Record<string, number> = {
  novo: 5,
  excelente: 4,
  bom: 3,
  regular: 2,
  "necessita reforma": 1,
  ruim: 1,
};

const STANDARD_LEVELS: Record<string, number> = {
  "alto luxo": 5,
  alto: 4,
  medio: 3,
  médio: 3,
  popular: 2,
  economico: 1,
  econômico: 1,
};

function norm(v?: string | null): string {
  return (v ?? "").trim().toLowerCase();
}

function hasDifferential(diffs: any, key: string): boolean {
  if (!diffs) return false;
  if (Array.isArray(diffs)) return diffs.includes(key);
  if (typeof diffs === "object") return !!diffs[key];
  return false;
}

function diffAdj(
  subjectHas: boolean,
  compHas: boolean,
  label: string,
  type: string,
  pct: number,
  price: number
): AdjustmentItem | null {
  if (subjectHas === compHas) return null;
  // If subject has it but comparable doesn't → comparable is worth LESS → negative adjustment (lower comp price to match)
  // If comparable has it but subject doesn't → comparable is worth MORE → positive adjustment
  const direction: "positive" | "negative" = compHas ? "positive" : "negative";
  const sign = compHas ? 1 : -1;
  return {
    adjustment_type: type,
    label,
    percentage: pct * sign,
    value: Math.round(price * (pct / 100) * sign),
    direction,
  };
}

export interface ComparableForAdjustment {
  id: string;
  price?: number | null;
  suites?: number | null;
  parking_spots?: number | null;
  conservation_state?: string | null;
  construction_standard?: string | null;
  area?: number | null;
  differentials?: any;
  [key: string]: any;
}

export function calculateAdjustments(
  subject: SubjectProperty & { differentials?: any },
  comparable: ComparableForAdjustment,
  weights: AdjustmentWeights = DEFAULT_WEIGHTS
): ComparableWithAdjustments {
  const price = comparable.price ?? 0;
  const adjustments: AdjustmentItem[] = [];

  // Differential-based adjustments
  const diffChecks: [string, string, number][] = [
    ["piscina", "Piscina", weights.pool],
    ["area_gourmet", "Área Gourmet", weights.gourmet_area],
    ["vista_privilegiada", "Vista Privilegiada", weights.privileged_view],
    ["localizacao_premium", "Localização Premium", weights.premium_location],
  ];

  for (const [key, label, pct] of diffChecks) {
    const adj = diffAdj(
      hasDifferential(subject.differentials, key),
      hasDifferential(comparable.differentials, key),
      label,
      key,
      pct,
      price
    );
    if (adj) adjustments.push(adj);
  }

  // Suites difference
  const subSuites = subject.suites ?? 0;
  const compSuites = comparable.suites ?? 0;
  if (subSuites !== compSuites) {
    const diff = compSuites - subSuites;
    const pct = weights.master_suite * Math.abs(diff);
    adjustments.push({
      adjustment_type: "suites",
      label: `Suítes (${diff > 0 ? "+" : ""}${diff})`,
      percentage: diff > 0 ? pct : -pct,
      value: Math.round(price * (pct / 100) * (diff > 0 ? 1 : -1)),
      direction: diff > 0 ? "positive" : "negative",
    });
  }

  // Parking difference
  const subParking = subject.parking_spots ?? 0;
  const compParking = comparable.parking_spots ?? 0;
  if (subParking !== compParking) {
    const diff = compParking - subParking;
    const pct = weights.extra_parking * Math.abs(diff);
    adjustments.push({
      adjustment_type: "parking",
      label: `Vagas (${diff > 0 ? "+" : ""}${diff})`,
      percentage: diff > 0 ? pct : -pct,
      value: Math.round(price * (pct / 100) * (diff > 0 ? 1 : -1)),
      direction: diff > 0 ? "positive" : "negative",
    });
  }

  // Conservation state
  const subConservation = CONSERVATION_LEVELS[norm(subject.conservation_state)] ?? 3;
  const compConservation = CONSERVATION_LEVELS[norm(comparable.conservation_state)] ?? 3;
  if (subConservation !== compConservation) {
    const diff = compConservation - subConservation;
    const pct = weights.better_conservation * Math.abs(diff) * 0.5;
    adjustments.push({
      adjustment_type: "conservation",
      label: `Conservação (${comparable.conservation_state || "—"})`,
      percentage: diff > 0 ? pct : -pct,
      value: Math.round(price * (pct / 100) * (diff > 0 ? 1 : -1)),
      direction: diff > 0 ? "positive" : "negative",
    });
  }

  // Construction standard
  const subStandard = STANDARD_LEVELS[norm(subject.construction_standard)] ?? 3;
  const compStandard = STANDARD_LEVELS[norm(comparable.construction_standard)] ?? 3;
  if (subStandard !== compStandard) {
    const diff = compStandard - subStandard;
    const pct = 5 * Math.abs(diff) * 0.5;
    adjustments.push({
      adjustment_type: "standard",
      label: `Padrão (${comparable.construction_standard || "—"})`,
      percentage: diff > 0 ? pct : -pct,
      value: Math.round(price * (pct / 100) * (diff > 0 ? 1 : -1)),
      direction: diff > 0 ? "positive" : "negative",
    });
  }

  // Area difference (land)
  const subArea = subject.area_land ?? subject.area_built ?? subject.area_useful ?? 0;
  const compArea = comparable.area ?? 0;
  if (subArea > 0 && compArea > 0 && subArea !== compArea) {
    const diffPct = ((compArea - subArea) / subArea) * 100;
    if (Math.abs(diffPct) > 5) {
      const adjPct = Math.min(Math.abs(diffPct) * 0.15, weights.larger_land * 3);
      adjustments.push({
        adjustment_type: "area",
        label: `Área (${diffPct > 0 ? "+" : ""}${diffPct.toFixed(0)}%)`,
        percentage: diffPct > 0 ? adjPct : -adjPct,
        value: Math.round(price * (adjPct / 100) * (diffPct > 0 ? 1 : -1)),
        direction: diffPct > 0 ? "positive" : "negative",
      });
    }
  }

  // Calculate adjusted price
  const totalAdjustmentValue = adjustments.reduce((sum, a) => sum + a.value, 0);

  return {
    comparable_id: comparable.id,
    original_price: price,
    adjusted_price: Math.round(price + totalAdjustmentValue),
    adjustments,
  };
}

export function calculateAllAdjustments(
  subject: SubjectProperty & { differentials?: any },
  comparables: ComparableForAdjustment[],
  weights?: AdjustmentWeights
): ComparableWithAdjustments[] {
  return comparables
    .filter((c) => c.price != null && c.price > 0)
    .map((c) => calculateAdjustments(subject, c, weights));
}

export function calculateMarketResult(adjustedComparables: ComparableWithAdjustments[]) {
  const prices = adjustedComparables.map((c) => c.adjusted_price).filter((p) => p > 0);
  if (prices.length === 0) {
    return {
      avg_price: 0,
      median_price: 0,
      avg_price_per_sqm: 0,
      suggested_ad_price: 0,
      suggested_market_price: 0,
      suggested_fast_sale_price: 0,
      price_range_min: 0,
      price_range_max: 0,
    };
  }

  const sorted = [...prices].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 !== 0 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
  const avg = Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);

  return {
    avg_price: avg,
    median_price: median,
    avg_price_per_sqm: 0, // calculated separately with area
    suggested_ad_price: Math.round(median * 1.05),
    suggested_market_price: median,
    suggested_fast_sale_price: Math.round(median * 0.9),
    price_range_min: sorted[0],
    price_range_max: sorted[sorted.length - 1],
  };
}
