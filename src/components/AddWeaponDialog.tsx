import { useState } from "react";
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

const weaponSchema = z.object({
  serial_number: z.string().min(3, "Número de série deve ter no mínimo 3 caracteres"),
  model: z.string().min(2, "Modelo deve ter no mínimo 2 caracteres"),
  caliber: z.string().min(2, "Calibre inválido"),
  manufacturer: z.string().min(2, "Fabricante inválido"),
});

type AddWeaponDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const AddWeaponDialog = ({ open, onOpenChange }: AddWeaponDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    serial_number: "",
    model: "",
    caliber: "",
    manufacturer: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

      const { error } = await supabase.from("weapons").insert([formData]);

      if (error) throw error;

      toast({
        title: "Arma cadastrada!",
        description: "A arma foi adicionada ao estoque com sucesso.",
      });

      setFormData({
        serial_number: "",
        model: "",
        caliber: "",
        manufacturer: "",
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível cadastrar a arma.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Nova Arma</DialogTitle>
          <DialogDescription>Adicione uma nova arma ao estoque.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="serial_number">Número de Série *</Label>
            <Input
              id="serial_number"
              value={formData.serial_number}
              onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
              placeholder="Ex: ABC123456"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">Modelo *</Label>
            <Input
              id="model"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
              placeholder="Ex: Taurus PT-92"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="caliber">Calibre *</Label>
            <Input
              id="caliber"
              value={formData.caliber}
              onChange={(e) => setFormData({ ...formData, caliber: e.target.value })}
              placeholder="Ex: 9mm"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="manufacturer">Fabricante *</Label>
            <Input
              id="manufacturer"
              value={formData.manufacturer}
              onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              placeholder="Ex: Taurus"
              required
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                "Cadastrar"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
