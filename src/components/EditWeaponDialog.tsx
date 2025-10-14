import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const weaponSchema = z.object({
  serial_number: z.string().min(3, "Número de série deve ter no mínimo 3 caracteres"),
  model: z.string().min(2, "Modelo deve ter no mínimo 2 caracteres"),
  caliber: z.string().min(2, "Calibre inválido"),
  manufacturer: z.string().min(2, "Fabricante inválido"),
  type: z.enum(["pistol", "shotgun", "rifle"], { errorMap: () => ({ message: "Selecione um tipo válido" }) }),
  status: z.enum(["available", "allocated", "maintenance"]),
});

type Weapon = {
  id: string;
  serial_number: string;
  model: string;
  caliber: string;
  manufacturer: string;
  type: "pistol" | "shotgun" | "rifle";
  status: "available" | "allocated" | "maintenance";
};

type EditWeaponDialogProps = {
  weapon: Weapon | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const EditWeaponDialog = ({ weapon, open, onOpenChange }: EditWeaponDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    serial_number: "",
    model: "",
    caliber: "",
    manufacturer: "",
    type: "pistol" as "pistol" | "shotgun" | "rifle",
    status: "available" as "available" | "allocated" | "maintenance",
  });

  useEffect(() => {
    if (weapon) {
      setFormData({
        serial_number: weapon.serial_number,
        model: weapon.model,
        caliber: weapon.caliber,
        manufacturer: weapon.manufacturer,
        type: weapon.type,
        status: weapon.status,
      });
    }
  }, [weapon]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!weapon) return;

    setLoading(true);

    try {
      const validation = weaponSchema.safeParse(formData);
      if (!validation.success) {
        toast({
          title: "Erro de validação",
          description: validation.error.errors[0].message,
          variant: "destructive",
        });
        return;
      }

      // Verificar se a arma está alocada e se está sendo mudada para manutenção
      if (weapon.status === "allocated" && formData.status === "maintenance") {
        toast({
          title: "Arma alocada",
          description: "Não é possível colocar uma arma alocada em manutenção. Aguarde a devolução.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from("weapons")
        .update(formData)
        .eq("id", weapon.id);

      if (error) throw error;

      toast({
        title: "Arma atualizada!",
        description: "As informações da arma foram atualizadas com sucesso.",
      });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar a arma.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!weapon) return;
    
    if (!confirm("Tem certeza que deseja excluir esta arma? Esta ação não pode ser desfeita.")) {
      return;
    }

    setLoading(true);

    try {
      // Verificar se a arma está alocada
      if (weapon.status === "allocated") {
        toast({
          title: "Arma alocada",
          description: "Não é possível excluir uma arma alocada. Aguarde a devolução.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from("weapons")
        .delete()
        .eq("id", weapon.id);

      if (error) throw error;

      toast({
        title: "Arma excluída!",
        description: "A arma foi removida do estoque.",
      });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível excluir a arma.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!weapon) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Arma</DialogTitle>
          <DialogDescription>Atualize as informações da arma ou gerencie seu status.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="serial_number">Número de Série *</Label>
            <Input
              id="serial_number"
              value={formData.serial_number}
              onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">Modelo *</Label>
            <Input
              id="model"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="caliber">Calibre *</Label>
            <Input
              id="caliber"
              value={formData.caliber}
              onChange={(e) => setFormData({ ...formData, caliber: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="manufacturer">Fabricante *</Label>
            <Input
              id="manufacturer"
              value={formData.manufacturer}
              onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Tipo *</Label>
            <Select value={formData.type} onValueChange={(value: "pistol" | "shotgun" | "rifle") => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pistol">Pistola</SelectItem>
                <SelectItem value="shotgun">Escopeta</SelectItem>
                <SelectItem value="rifle">Fuzil</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select value={formData.status} onValueChange={(value: "available" | "allocated" | "maintenance") => setFormData({ ...formData, status: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="available">Disponível</SelectItem>
                <SelectItem value="allocated" disabled>Alocada (gerenciado automaticamente)</SelectItem>
                <SelectItem value="maintenance">Manutenção</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={loading}>
              Excluir
            </Button>
            <div className="flex-1" />
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
