import { supabase } from "@/integrations/supabase/client";

/**
 * Syncs market study results to all linked presentation sections.
 * Call after recalculation or when market_study_results change.
 */
export async function syncMarketStudySections(marketStudyId: string) {
  // 1. Fetch latest results, approved comparables, subject property, and linked presentations
  const [resultRes, compsRes, presRes, subjectRes] = await Promise.all([
    supabase.from("market_study_results").select("*").eq("market_study_id", marketStudyId).single(),
    supabase.from("market_study_comparables").select("*").eq("market_study_id", marketStudyId).eq("is_approved", true),
    supabase.from("presentations").select("id, owner_expected_price").eq("market_study_id", marketStudyId),
    supabase.from("market_study_subject_properties").select("*").eq("market_study_id", marketStudyId).single(),
  ]);

  const report = resultRes.data;
  const comparables = compsRes.data || [];
  const presentations = presRes.data || [];
  const subject = subjectRes.data;

  if (!report || presentations.length === 0) return;

  // Build compact comparables array for slides
  const comparablesForSlide = comparables.map((comp: any) => ({
    title: comp.title,
    price: comp.price,
    area: comp.area,
    bedrooms: comp.bedrooms,
    suites: comp.suites,
    parking_spots: comp.parking_spots,
    bathrooms: comp.bathrooms,
    neighborhood: comp.neighborhood,
    condominium: comp.condominium,
    conservation_state: comp.conservation_state,
    construction_standard: comp.construction_standard,
    similarity_score: comp.similarity_score,
    adjusted_price: comp.adjusted_price,
    price_per_sqm: comp.price_per_sqm,
    source_name: comp.source_name,
  }));

  // Build subject property summary
  const subjectForSlide = subject ? {
    property_type: subject.property_type,
    construction_standard: subject.construction_standard,
    conservation_state: subject.conservation_state,
    property_age: subject.property_age,
    area_built: subject.area_built,
    area_land: subject.area_land,
    area_useful: subject.area_useful,
    bedrooms: subject.bedrooms,
    suites: subject.suites,
    bathrooms: subject.bathrooms,
    parking_spots: subject.parking_spots,
    neighborhood: subject.neighborhood,
    city: subject.city,
    condominium: subject.condominium,
    differentials: subject.differentials,
    owner_expected_price: subject.owner_expected_price,
  } : null;

  // 2. For each linked presentation, update the relevant sections
  for (const pres of presentations) {
    const marketStudyContent = {
      status: "completed",
      avg_price: report.avg_price,
      median_price: report.median_price,
      avg_price_per_sqm: report.avg_price_per_sqm,
      confidence_level: report.confidence_level,
      executive_summary: report.executive_summary,
      comparables_count: comparables.length,
      comparables: comparablesForSlide,
      subject_property: subjectForSlide,
      owner_expected_price: pres.owner_expected_price || subject?.owner_expected_price,
    };

    const pricingScenariosContent = {
      owner_expected_price: pres.owner_expected_price || subject?.owner_expected_price,
      scenarios: [
        { label: "Preço aspiracional", value: report.suggested_ad_price || null },
        { label: "Preço de mercado", value: report.suggested_market_price || null },
        { label: "Preço de venda rápida", value: report.suggested_fast_sale_price || null },
      ],
    };

    // Update both sections in parallel
    await Promise.all([
      supabase
        .from("presentation_sections")
        .update({ content: marketStudyContent as any })
        .eq("presentation_id", pres.id)
        .eq("section_key", "market_study_placeholder"),
      supabase
        .from("presentation_sections")
        .update({ content: pricingScenariosContent as any })
        .eq("presentation_id", pres.id)
        .eq("section_key", "pricing_scenarios"),
    ]);
  }

  console.log(`[SYNC] Updated ${presentations.length} presentation(s) with market study ${marketStudyId}`);
}
