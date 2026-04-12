export interface SubjectProperty {
  condominium?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  property_type?: string | null;
  property_category?: string | null;
  area_useful?: number | null;
  area_built?: number | null;
  area_land?: number | null;
  bedrooms?: number | null;
  suites?: number | null;
  parking_spots?: number | null;
  construction_standard?: string | null;
  conservation_state?: string | null;
}

export interface ComparableForScoring {
  id?: string;
  condominium?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  property_type?: string | null;
  area?: number | null;
  bedrooms?: number | null;
  suites?: number | null;
  parking_spots?: number | null;
  construction_standard?: string | null;
  conservation_state?: string | null;
  [key: string]: any;
}

export interface SimilarityWeights {
  same_condominium: number;
  same_neighborhood: number;
  same_type: number;
  area_range: number;
  rooms_proximity: number;
  same_standard: number;
  same_profile: number;
}

const DEFAULT_WEIGHTS: SimilarityWeights = {
  same_condominium: 25,
  same_neighborhood: 20,
  same_type: 15,
  area_range: 15,
  rooms_proximity: 10,
  same_standard: 10,
  same_profile: 5,
};

function normalize(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function areaScore(subjectArea: number | null | undefined, compArea: number | null | undefined, maxPoints: number): number {
  if (!subjectArea || !compArea || subjectArea === 0) return 0;
  const diff = Math.abs(subjectArea - compArea) / subjectArea;
  if (diff <= 0.05) return maxPoints;
  if (diff <= 0.10) return maxPoints * 0.8;
  if (diff <= 0.20) return maxPoints * 0.5;
  if (diff <= 0.30) return maxPoints * 0.2;
  return 0;
}

function roomsScore(
  subject: SubjectProperty,
  comp: ComparableForScoring,
  maxPoints: number
): number {
  let total = 0;
  let count = 0;

  const pairs: [number | null | undefined, number | null | undefined][] = [
    [subject.bedrooms, comp.bedrooms],
    [subject.suites, comp.suites],
    [subject.parking_spots, comp.parking_spots],
  ];

  for (const [s, c] of pairs) {
    if (s == null && c == null) continue;
    count++;
    const diff = Math.abs((s ?? 0) - (c ?? 0));
    if (diff === 0) total += 1;
    else if (diff === 1) total += 0.6;
    else if (diff === 2) total += 0.2;
  }

  if (count === 0) return maxPoints * 0.5;
  return Math.round((total / count) * maxPoints);
}

export function calculateSimilarityScore(
  subject: SubjectProperty,
  comparable: ComparableForScoring,
  weights: SimilarityWeights = DEFAULT_WEIGHTS
): number {
  let score = 0;

  // Same condominium
  if (normalize(subject.condominium, comparable.condominium)) {
    score += weights.same_condominium;
  }

  // Same neighborhood
  if (normalize(subject.neighborhood, comparable.neighborhood)) {
    score += weights.same_neighborhood;
  }

  // Same type
  if (
    normalize(subject.property_type, comparable.property_type) ||
    normalize(subject.property_category, comparable.property_type)
  ) {
    score += weights.same_type;
  }

  // Area range
  const subjectArea = subject.area_useful || subject.area_built || subject.area_land;
  score += areaScore(subjectArea, comparable.area, weights.area_range);

  // Rooms proximity
  score += roomsScore(subject, comparable, weights.rooms_proximity);

  // Same standard
  if (normalize(subject.construction_standard, comparable.construction_standard)) {
    score += weights.same_standard;
  }

  // Profile bonus (city match + at least 2 other matches)
  if (normalize(subject.city, comparable.city) && score >= 30) {
    score += weights.same_profile;
  }

  return Math.min(100, Math.round(score));
}

export function scoredComparables<T extends ComparableForScoring>(
  subject: SubjectProperty,
  comparables: T[],
  weights?: SimilarityWeights,
  minScore = 30
): (T & { similarity_score: number })[] {
  return comparables
    .map((c) => ({
      ...c,
      similarity_score: calculateSimilarityScore(subject, c, weights),
    }))
    .filter((c) => c.similarity_score >= minScore)
    .sort((a, b) => b.similarity_score - a.similarity_score);
}
