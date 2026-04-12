import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import {
  SubjectPropertyForm,
  type SubjectPropertyData,
} from "@/components/market-study/SubjectPropertyForm";
import {
  SearchConfigForm,
  type SearchConfigData,
} from "@/components/market-study/SearchConfigForm";
import { scoredComparables } from "@/hooks/useMarketSimilarity";
import {
  calculateAllAdjustments,
  calculateMarketResult,
} from "@/hooks/useMarketAdjustments";

const steps = ["Dados do Imóvel", "Configuração de Pesquisa", "Gerando..."];

export default function NewMarketStudy() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [progressMsg, setProgressMsg] = useState("");

  const [propertyData, setPropertyData] = useState<SubjectPropertyData>({
    purpose: "venda",
    property_type: "",
    property_category: "",
    address: "",
    neighborhood: "",
    condominium: "",
    city: "",
    state: "",
    cep: "",
    area_land: undefined,
    area_built: undefined,
    area_useful: undefined,
    bedrooms: undefined,
    suites: undefined,
    bathrooms: undefined,
    parking_spots: undefined,
    living_rooms: undefined,
    powder_rooms: undefined,
    property_age: "",
    construction_standard: "",
    conservation_state: "",
    differentials: [],
    condominium_fee: undefined,
    iptu: undefined,
    observations: "",
    pricing_objective: "melhor_preco",
    owner_expected_price: undefined,
  });

  const [searchConfig, setSearchConfig] = useState<SearchConfigData>({
    same_condominium: false,
    radius_km: 5,
    area_range_pct: 20,
    price_range_pct: 30,
    max_comparables: 15,
    min_similarity: 30,
    selectedPortals: [],
  });

  // --------------- helpers ---------------

  /** Build the property input for the edge functions */
  function buildPropertyInput() {
    const area =
      propertyData.area_useful ||
      propertyData.area_built ||
      propertyData.area_land;
    return {
      property_type: propertyData.property_type,
      property_purpose: propertyData.purpose,
      address: propertyData.address,
      city: propertyData.city,
      neighborhood: propertyData.neighborhood,
      area_total: area ? String(area) : undefined,
      area_built: propertyData.area_built
        ? String(propertyData.area_built)
        : undefined,
      bedrooms: propertyData.bedrooms
        ? String(propertyData.bedrooms)
        : undefined,
      suites: propertyData.suites ? String(propertyData.suites) : undefined,
      bathrooms: propertyData.bathrooms
        ? String(propertyData.bathrooms)
        : undefined,
      parking_spots: propertyData.parking_spots
        ? String(propertyData.parking_spots)
        : undefined,
      property_standard: propertyData.construction_standard || undefined,
      owner_expected_price: propertyData.owner_expected_price
        ? String(propertyData.owner_expected_price)
        : undefined,
      condominium: propertyData.condominium || undefined,
    };
  }

  /** Resolve selected portal IDs → names/codes for edge functions */
  async function resolvePortals() {
    if (searchConfig.selectedPortals.length === 0) return [];
    const { data } = await supabase
      .from("portal_sources")
      .select("id, name, code, base_url")
      .in("id", searchConfig.selectedPortals);
    return (data || []).map((p) => ({
      name: p.name,
      code: p.code,
      base_url: p.base_url,
    }));
  }

  /** Build filters for the edge functions (same format the wizard uses) */
  function buildFilters() {
    const area =
      propertyData.area_useful ||
      propertyData.area_built ||
      propertyData.area_land;
    const minArea = area
      ? Math.round(area * (1 - searchConfig.area_range_pct / 100))
      : undefined;
    const maxArea = area
      ? Math.round(area * (1 + searchConfig.area_range_pct / 100))
      : undefined;
    const price = propertyData.owner_expected_price;
    const minPrice = price
      ? Math.round(price * (1 - searchConfig.price_range_pct / 100))
      : undefined;
    const maxPrice = price
      ? Math.round(price * (1 + searchConfig.price_range_pct / 100))
      : undefined;
    return {
      searchRadius: `${searchConfig.radius_km}km`,
      minArea: minArea ? String(minArea) : "",
      maxArea: maxArea ? String(maxArea) : "",
      minPrice: minPrice ? String(minPrice) : "",
      maxPrice: maxPrice ? String(maxPrice) : "",
      maxComparables: String(searchConfig.max_comparables),
    };
  }

  /** Call Manus → fallback Firecrawl → fallback simulated */
  async function fetchComparables(
    propertyInput: any,
    portals: any[],
    filters: any
  ): Promise<{ comparables: any[]; source: string }> {
    // 1. Manus
    setProgressMsg("Buscando comparáveis via Manus nos portais...");
    try {
      const { data, error } = await supabase.functions.invoke(
        "analyze-market-manus",
        { body: { property: propertyInput, portals, filters } }
      );
      if (!error && data?.success && data.comparables?.length > 0) {
        return { comparables: data.comparables, source: "manus" };
      }
      console.warn("Manus returned no data or failed:", error || data?.message);
    } catch (e) {
      console.warn("Manus call failed:", e);
    }

    // 2. Firecrawl
    setProgressMsg("Manus indisponível. Tentando busca alternativa...");
    try {
      const { data, error } = await supabase.functions.invoke(
        "analyze-market",
        { body: { property: propertyInput, portals, filters } }
      );
      if (!error && data?.success && data.comparables?.length > 0) {
        return { comparables: data.comparables, source: "firecrawl" };
      }
      console.warn(
        "Firecrawl returned no data or failed:",
        error || data?.message
      );
    } catch (e) {
      console.warn("Firecrawl call failed:", e);
    }

    // 3. Simulated
    setProgressMsg("Gerando comparáveis simulados para demonstração...");
    const { generateSimulatedComparables } = await import(
      "@/hooks/useSimulateComparables"
    );
    const simulated = generateSimulatedComparables(
      "sim",
      propertyInput,
      portals.map((p, i) => ({ id: String(i), name: p.name }))
    );
    return {
      comparables: simulated.map((c) => ({
        title: c.title,
        price: c.price,
        area: c.area,
        bedrooms: c.bedrooms,
        suites: c.suites,
        parking_spots: c.parking_spots,
        address: c.address,
        neighborhood: c.neighborhood,
        price_per_sqm: c.price_per_sqm,
        source_url: c.source_url,
        source_name: c.source_name,
        image_url: null,
        is_approved: true,
        similarity_score: c.similarity_score,
      })),
      source: "simulated",
    };
  }

  // --------------- main handler ---------------

  const handleCreate = async () => {
    if (!user || !profile?.tenant_id) {
      toast.error("Usuário não autenticado");
      return;
    }

    setSaving(true);
    setCurrentStep(2);
    setProgressMsg("Criando estudo de mercado...");

    try {
      // 1. Create the study
      const { data: study, error: studyError } = await supabase
        .from("market_studies")
        .insert({
          tenant_id: profile.tenant_id,
          broker_id: user.id,
          title: propertyData.address
            ? `Estudo - ${propertyData.address}`
            : "Novo Estudo de Mercado",
          purpose: propertyData.purpose,
          status: "draft",
        })
        .select()
        .single();

      if (studyError) throw studyError;

      // 2. Create the subject property
      setProgressMsg("Salvando dados do imóvel...");
      const { error: propError } = await supabase
        .from("market_study_subject_properties")
        .insert({ market_study_id: study.id, ...propertyData });

      if (propError) throw propError;

      // 3. Fetch comparables via Manus / Firecrawl / Simulated
      const propertyInput = buildPropertyInput();
      const portals = await resolvePortals();
      const filters = buildFilters();

      const { comparables: rawComparables, source } = await fetchComparables(
        propertyInput,
        portals,
        filters
      );

      // 4. Save comparables to market_study_comparables
      setProgressMsg(
        `${rawComparables.length} comparáveis encontrados (${source}). Salvando...`
      );

      const comparablesToInsert = rawComparables.map((c: any) => ({
        market_study_id: study.id,
        title: c.title || "Imóvel comparável",
        price: c.price ? Number(c.price) : null,
        area: c.area ? Number(c.area) : null,
        bedrooms: c.bedrooms ? Number(c.bedrooms) : null,
        suites: c.suites ? Number(c.suites) : null,
        parking_spots: c.parking_spots ? Number(c.parking_spots) : null,
        address: c.address || null,
        neighborhood: c.neighborhood || null,
        price_per_sqm: c.price_per_sqm ? Number(c.price_per_sqm) : null,
        source_url: c.source_url || "",
        source_name: c.source_name || source,
        image_url: c.image_url || null,
        is_approved: true,
        similarity_score: c.similarity_score ? Number(c.similarity_score) : null,
      }));

      const { data: savedComparables, error: compError } = await supabase
        .from("market_study_comparables")
        .insert(comparablesToInsert)
        .select("*");

      if (compError) throw compError;

      const comparables = savedComparables || [];

      if (comparables.length > 0) {
        // 5. Calculate similarity scores
        setProgressMsg("Calculando similaridade...");
        const scored = scoredComparables(
          propertyData,
          comparables,
          undefined,
          searchConfig.min_similarity
        );

        for (const comp of scored) {
          await supabase
            .from("market_study_comparables")
            .update({ similarity_score: comp.similarity_score })
            .eq("id", comp.id);
        }

        // 6. Calculate adjustments
        setProgressMsg("Calculando ajustes de preço...");
        const adjusted = calculateAllAdjustments(
          propertyData,
          scored.map((c) => ({
            id: c.id,
            price: Number(c.price),
            suites: c.suites,
            parking_spots: c.parking_spots,
            conservation_state: c.conservation_state,
            construction_standard: c.construction_standard,
            area: Number(c.area),
            differentials: c.differentials,
          }))
        );

        for (const comp of adjusted) {
          await supabase
            .from("market_study_comparables")
            .update({ adjusted_price: comp.adjusted_price })
            .eq("id", comp.comparable_id);

          if (comp.adjustments.length > 0) {
            await supabase.from("market_study_adjustments").insert(
              comp.adjustments.map((a) => ({
                comparable_id: comp.comparable_id,
                adjustment_type: a.adjustment_type,
                label: a.label,
                percentage: a.percentage,
                value: a.value,
                direction: a.direction,
              }))
            );
          }
        }

        // 7. Calculate and save results
        setProgressMsg("Gerando resultado final...");
        const result = calculateMarketResult(adjusted);
        const subjectArea =
          propertyData.area_useful ||
          propertyData.area_built ||
          propertyData.area_land;
        const avgPricePerSqm =
          subjectArea && subjectArea > 0
            ? Math.round(result.avg_price / subjectArea)
            : 0;

        await supabase.from("market_study_results").insert({
          market_study_id: study.id,
          avg_price: result.avg_price,
          median_price: result.median_price,
          avg_price_per_sqm: avgPricePerSqm,
          suggested_ad_price: result.suggested_ad_price,
          suggested_market_price: result.suggested_market_price,
          suggested_fast_sale_price: result.suggested_fast_sale_price,
          price_range_min: result.price_range_min,
          price_range_max: result.price_range_max,
          confidence_level:
            adjusted.length >= 5
              ? "high"
              : adjusted.length >= 3
              ? "medium"
              : "low",
        });

        await supabase
          .from("market_studies")
          .update({ status: "completed" })
          .eq("id", study.id);
      }

      toast.success("Estudo criado com sucesso!");
      navigate(`/market-studies/${study.id}`);
    } catch (err: any) {
      console.error("Error creating study:", err);
      toast.error(
        "Erro ao criar estudo: " + (err.message || "erro desconhecido")
      );
      setCurrentStep(1);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold font-display">
          Novo Estudo de Mercado
        </h1>
        <p className="text-muted-foreground">
          Preencha os dados do imóvel para gerar a análise comparativa
        </p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div
              className={`flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold transition-colors ${
                i <= currentStep
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {i < currentStep ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <span
              className={`text-sm hidden sm:inline ${
                i === currentStep ? "font-semibold" : "text-muted-foreground"
              }`}
            >
              {label}
            </span>
            {i < steps.length - 1 && (
              <div className="w-8 h-px bg-border mx-1" />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      {currentStep === 0 && (
        <SubjectPropertyForm data={propertyData} onChange={setPropertyData} />
      )}

      {currentStep === 1 && (
        <SearchConfigForm data={searchConfig} onChange={setSearchConfig} />
      )}

      {currentStep === 2 && (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg font-medium">Criando estudo de mercado...</p>
          <p className="text-sm text-muted-foreground text-center max-w-md">
            {progressMsg}
          </p>
        </div>
      )}

      {/* Navigation */}
      {currentStep < 2 && (
        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={() =>
              currentStep === 0
                ? navigate("/market-studies")
                : setCurrentStep(currentStep - 1)
            }
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {currentStep === 0 ? "Cancelar" : "Voltar"}
          </Button>

          {currentStep === 0 ? (
            <Button onClick={() => setCurrentStep(1)}>
              Próximo
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Criar Estudo
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
