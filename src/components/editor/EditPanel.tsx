import { SectionData } from "@/components/layouts/SectionRenderer";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Building, User, Globe, MapPin, Home, Target, Award, TrendingUp, BarChart3, DollarSign, Phone, Key, Briefcase, FileText, Plus, Trash2 } from "lucide-react";

const sectionIcons: Record<string, any> = {
  cover: Building, broker_intro: User, about_global: Globe, about_national: Globe,
  about_regional: MapPin, property_summary: Home, marketing_plan: Target,
  differentials: Award, results: TrendingUp, pricing_scenarios: DollarSign, closing: Phone,
  objectives_alignment: Key, agency_value_proposition: Briefcase, required_documentation: FileText,
};

interface EditPanelProps {
  section: SectionData | null;
  onUpdate: (id: string, content: any, title: string | null) => void;
}

export function EditPanel({ section, onUpdate }: EditPanelProps) {
  if (!section) {
    return (
      <div className="w-80 border-l border-border/40 bg-card/50 flex items-center justify-center p-6">
        <p className="text-muted-foreground text-xs text-center">Selecione um slide para editar</p>
      </div>
    );
  }

  const content = section.content || {};
  const Icon = sectionIcons[section.section_key] || Building;

  const handleFieldChange = (field: string, value: any) => {
    const updated = { ...content, [field]: value };
    onUpdate(section.id, updated, section.title);
  };

  const renderFields = () => {
    switch (section.section_key) {
      case "cover":
        return (
          <>
            <Field label="Título" value={content.title} onChange={v => handleFieldChange("title", v)} />
            <Field label="Endereço" value={content.address} onChange={v => handleFieldChange("address", v)} />
            <Field label="Bairro" value={content.neighborhood} onChange={v => handleFieldChange("neighborhood", v)} />
            <Field label="Cidade" value={content.city} onChange={v => handleFieldChange("city", v)} />
          </>
        );
      case "broker_intro":
        return (
          <>
            <Field label="Nome" value={content.name} onChange={v => handleFieldChange("name", v)} />
            <Field label="CRECI" value={content.creci} onChange={v => handleFieldChange("creci", v)} />
            <TextAreaField label="Bio" value={content.short_bio} onChange={v => handleFieldChange("short_bio", v)} />
            <Field label="Especialidades" value={content.specialties} onChange={v => handleFieldChange("specialties", v)} />
          </>
        );
      case "about_global":
      case "about_national":
      case "about_regional":
        return <TextAreaField label="Conteúdo" value={content.text} onChange={v => handleFieldChange("text", v)} rows={8} />;
      case "property_summary":
        return (
          <>
            <Field label="Tipo" value={content.property_type} onChange={v => handleFieldChange("property_type", v)} />
            <TextAreaField label="Destaques" value={content.highlights} onChange={v => handleFieldChange("highlights", v)} />
          </>
        );
      case "objectives_alignment":
        return (
          <>
            {(content.objectives || []).map((obj: any, i: number) => (
              <div key={i} className="space-y-1 p-3 rounded-lg border border-border/30 bg-muted/20">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Objetivo {i + 1}</p>
                <Field label="Ícone (key/chart/checklist)" value={obj.icon} onChange={v => {
                  const objectives = [...(content.objectives || [])];
                  objectives[i] = { ...objectives[i], icon: v };
                  handleFieldChange("objectives", objectives);
                }} />
                <Field label="Título" value={obj.title} onChange={v => {
                  const objectives = [...(content.objectives || [])];
                  objectives[i] = { ...objectives[i], title: v };
                  handleFieldChange("objectives", objectives);
                }} />
                <TextAreaField label="Descrição" value={obj.description} onChange={v => {
                  const objectives = [...(content.objectives || [])];
                  objectives[i] = { ...objectives[i], description: v };
                  handleFieldChange("objectives", objectives);
                }} rows={2} />
              </div>
            ))}
          </>
        );
      case "agency_value_proposition":
        return (
          <>
            {(content.value_propositions || []).map((vp: any, i: number) => (
              <div key={i} className="space-y-1 p-3 rounded-lg border border-border/30 bg-muted/20">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Proposta {i + 1}</p>
                <Field label="Título" value={vp.title} onChange={v => {
                  const vps = [...(content.value_propositions || [])];
                  vps[i] = { ...vps[i], title: v };
                  handleFieldChange("value_propositions", vps);
                }} />
                <TextAreaField label="Descrição" value={vp.description} onChange={v => {
                  const vps = [...(content.value_propositions || [])];
                  vps[i] = { ...vps[i], description: v };
                  handleFieldChange("value_propositions", vps);
                }} rows={2} />
              </div>
            ))}
            <div className="pt-2 border-t border-border/30">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2">Estatísticas Globais</p>
              <Field label="Países" value={content.global_stats?.countries} onChange={v => {
                handleFieldChange("global_stats", { ...content.global_stats, countries: Number(v) || 0 });
              }} type="number" />
              <Field label="Unidades" value={content.global_stats?.units} onChange={v => {
                handleFieldChange("global_stats", { ...content.global_stats, units: Number(v) || 0 });
              }} type="number" />
              <Field label="Corretores" value={content.global_stats?.brokers} onChange={v => {
                handleFieldChange("global_stats", { ...content.global_stats, brokers: Number(v) || 0 });
              }} type="number" />
            </div>
          </>
        );
      case "required_documentation":
        return (
          <>
            {(content.documents || []).map((doc: any, i: number) => (
              <div key={i} className="space-y-1 p-3 rounded-lg border border-border/30 bg-muted/20">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Documento {i + 1}</p>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                    const docs = (content.documents || []).filter((_: any, idx: number) => idx !== i);
                    handleFieldChange("documents", docs);
                  }}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
                <Field label="Título" value={doc.title} onChange={v => {
                  const docs = [...(content.documents || [])];
                  docs[i] = { ...docs[i], title: v };
                  handleFieldChange("documents", docs);
                }} />
                <div className="flex items-center gap-2 mt-1">
                  <Switch checked={doc.required !== false} onCheckedChange={v => {
                    const docs = [...(content.documents || [])];
                    docs[i] = { ...docs[i], required: v };
                    handleFieldChange("documents", docs);
                  }} />
                  <Label className="text-[11px] text-muted-foreground">Obrigatório</Label>
                </div>
              </div>
            ))}
            <Button variant="outline" size="sm" className="w-full" onClick={() => {
              const docs = [...(content.documents || []), { title: "", required: true }];
              handleFieldChange("documents", docs);
            }}>
              <Plus className="h-3 w-3 mr-1" /> Adicionar documento
            </Button>
          </>
        );
      case "pricing_scenarios":
        return (
          <>
            <Field label="Valor pretendido" value={content.owner_expected_price} onChange={v => handleFieldChange("owner_expected_price", v)} type="number" />
            {(content.scenarios || []).map((s: any, i: number) => (
              <Field key={i} label={s.label} value={s.value || ""} onChange={v => {
                const scenarios = [...(content.scenarios || [])];
                scenarios[i] = { ...scenarios[i], value: v };
                handleFieldChange("scenarios", scenarios);
              }} type="number" />
            ))}
          </>
        );
      case "closing":
        return (
          <>
            <Field label="Nome" value={content.broker_name} onChange={v => handleFieldChange("broker_name", v)} />
            <Field label="Telefone" value={content.broker_phone} onChange={v => handleFieldChange("broker_phone", v)} />
            <Field label="Email" value={content.broker_email} onChange={v => handleFieldChange("broker_email", v)} />
          </>
        );
      default:
        return (
          <>
            {content.text !== undefined && (
              <TextAreaField label="Conteúdo" value={content.text} onChange={v => handleFieldChange("text", v)} rows={6} />
            )}
            {content.message !== undefined && (
              <TextAreaField label="Mensagem" value={content.message} onChange={v => handleFieldChange("message", v)} />
            )}
          </>
        );
    }
  };

  return (
    <div className="w-80 border-l border-border/40 bg-card/50 overflow-y-auto">
      <div className="p-4 border-b border-border/30">
        <div className="flex items-center gap-2 mb-1">
          <div className="h-6 w-6 rounded-md bg-accent/10 flex items-center justify-center">
            <Icon className="h-3.5 w-3.5 text-accent" />
          </div>
          <h3 className="font-semibold text-sm font-sans">{section.title}</h3>
        </div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{section.section_key}</p>
      </div>
      <div className="p-4 space-y-4">
        {renderFields()}
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text" }: { label: string; value: any; onChange: (v: string) => void; type?: string }) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</Label>
      <Input type={type} value={value || ""} onChange={e => onChange(e.target.value)} className="h-8 text-sm" />
    </div>
  );
}

function TextAreaField({ label, value, onChange, rows = 4 }: { label: string; value: any; onChange: (v: string) => void; rows?: number }) {
  return (
    <div className="space-y-1">
      <Label className="text-[11px] text-muted-foreground uppercase tracking-wider">{label}</Label>
      <Textarea value={value || ""} onChange={e => onChange(e.target.value)} rows={rows} className="text-sm" />
    </div>
  );
}
