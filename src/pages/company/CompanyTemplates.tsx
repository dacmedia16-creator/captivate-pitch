import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormModal } from "@/components/shared/FormModal";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Pencil, Trash2, FileText, Layers } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

const layoutLabels: Record<string, string> = {
  executivo: "Executivo",
  premium: "Premium",
  impacto_comercial: "Impacto Comercial",
};

export default function CompanyTemplates() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [newName, setNewName] = useState("");
  const [newLayout, setNewLayout] = useState("executivo");

  const { data: templates, isLoading } = useQuery({
    queryKey: ["company-templates", profile?.tenant_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("presentation_templates")
        .select("*")
        .eq("tenant_id", profile!.tenant_id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!profile?.tenant_id,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("presentation_templates").insert({
        tenant_id: profile!.tenant_id!,
        name: newName.trim(),
        layout: newLayout,
        structure: [],
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Template criado");
      queryClient.invalidateQueries({ queryKey: ["company-templates"] });
      setCreateOpen(false);
      setNewName("");
      setNewLayout("executivo");
    },
    onError: () => toast.error("Erro ao criar template"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("presentation_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Template excluído");
      queryClient.invalidateQueries({ queryKey: ["company-templates"] });
      setDeleteId(null);
    },
    onError: () => toast.error("Erro ao excluir"),
  });

  const renameMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from("presentation_templates").update({ name }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Template renomeado");
      queryClient.invalidateQueries({ queryKey: ["company-templates"] });
      setEditingId(null);
    },
    onError: () => toast.error("Erro ao renomear"),
  });

  const getSectionCount = (structure: unknown) => {
    if (Array.isArray(structure)) return structure.length;
    return 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Templates</h1>
          <p className="text-muted-foreground">Gerencie os modelos de apresentação disponíveis para sua equipe.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gold-gradient text-primary-foreground">
          <PlusCircle className="h-4 w-4 mr-2" /> Novo Template
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : templates?.length ? (
        <div className="grid gap-4">
          {templates.map(t => (
            <Card key={t.id} className="glass-card hover:shadow-md transition-shadow">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  {editingId === t.id ? (
                    <form
                      className="flex items-center gap-2"
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (editName.trim()) renameMutation.mutate({ id: t.id, name: editName.trim() });
                      }}
                    >
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8 max-w-xs"
                        autoFocus
                      />
                      <Button type="submit" size="sm" variant="outline" disabled={renameMutation.isPending}>
                        Salvar
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                        Cancelar
                      </Button>
                    </form>
                  ) : (
                    <>
                      <h3 className="font-semibold truncate">{t.name}</h3>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <Badge variant="outline" className="text-xs">
                          {layoutLabels[t.layout || ""] || t.layout || "Sem layout"}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <Layers className="h-3 w-3" />
                          {getSectionCount(t.structure)} seções
                        </span>
                        <span>{new Date(t.created_at).toLocaleDateString("pt-BR")}</span>
                        {t.is_default && (
                          <Badge className="bg-primary/10 text-primary text-xs">Padrão</Badge>
                        )}
                      </div>
                    </>
                  )}
                </div>
                {editingId !== t.id && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => { setEditingId(t.id); setEditName(t.name); }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(t.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="glass-card">
          <CardContent className="p-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">Nenhum template criado ainda.</p>
            <p className="text-sm text-muted-foreground mt-1">Crie um novo template ou salve uma apresentação como modelo no editor.</p>
          </CardContent>
        </Card>
      )}

      <FormModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        title="Novo Template"
        description="Crie um modelo de apresentação para sua equipe."
      >
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (newName.trim()) createMutation.mutate();
          }}
        >
          <div className="space-y-2">
            <Label>Nome do template</Label>
            <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Ex: Captação Premium" />
          </div>
          <div className="space-y-2">
            <Label>Layout</Label>
            <Select value={newLayout} onValueChange={setNewLayout}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="executivo">Executivo</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="impacto_comercial">Impacto Comercial</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" className="w-full gold-gradient text-primary-foreground" disabled={!newName.trim() || createMutation.isPending}>
            Criar Template
          </Button>
        </form>
      </FormModal>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title="Excluir template"
        description="Esta ação não pode ser desfeita. As apresentações criadas a partir deste modelo não serão afetadas."
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        destructive
      />
    </div>
  );
}
