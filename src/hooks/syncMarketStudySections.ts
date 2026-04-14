import { supabase } from "@/integrations/supabase/client";

/**
 * Syncs market study results to all linked presentation sections.
 * Call after recalculation or when market_study_results change.
 */
export async function syncMarketStudySections(marketStudyId: string) {
  // 1. Fetch latest results and approved comparables
  const [resultRes, compsRes, presRes] = await Promise.all([
    supabase.from("market_study_results").select("*").eq("market_study_id", marketStudyId).single(),
    supabase.from("market_study_comparables").select("*").eq("market_study_id", marketStudyId).eq("is_approved", true),
    supabase.from("presentations").select("id, owner_expected_price").eq("market_study_id", marketStudyId),
  ]);

  const report = resultRes.data;
  const comparables = compsRes.data || [];
  const presentations = presRes.data || [];

  if (!report || presentations.length === 0) return;

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
    };

    const pricingScenariosContent = {
      owner_expected_price: pres.owner_expected_price,
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
