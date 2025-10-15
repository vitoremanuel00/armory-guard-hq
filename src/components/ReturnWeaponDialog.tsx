import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, Loader2, Wrench } from "lucide-react";

type ReturnWeaponDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allocationId: string;
  userId: string;
  weaponId: string;
  weaponModel: string;
};

export const ReturnWeaponDialog = ({
  open,
  onOpenChange,
  allocationId,
  userId,
  weaponId,
  weaponModel,
}: ReturnWeaponDialogProps) => {
  const [destination, setDestination] = useState<"stock" | "maintenance">("stock");
  const [maintenanceReason, setMaintenanceReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (destination === "maintenance" && !maintenanceReason.trim()) {
      toast({
        title: "Motivo necessário",
        description: "Por favor, informe o motivo da manutenção.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Verificar se usuário realmente tem essa alocação ativa
      const { data: allocation, error: checkError } = await supabase
        .from("allocations")
        .select("*")
        .eq("id", allocationId)
        .eq("user_id", userId)
        .eq("status", "active")
        .single();

      if (checkError || !allocation) {
        toast({
          title: "Erro de validação",
          description: "Esta alocação não existe ou já foi devolvida.",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      // Atualizar alocação
      const { error: updateError } = await supabase
        .from("allocations")
        .update({
          status: "returned",
          returned_at: new Date().toISOString(),
          maintenance_required: destination === "maintenance",
          maintenance_reason: destination === "maintenance" ? maintenanceReason : null,
        })
        .eq("id", allocationId);

      if (updateError) throw updateError;

      // Se for para manutenção, atualizar status da arma
      if (destination === "maintenance") {
        const { error: weaponError } = await supabase
          .from("weapons")
          .update({
            status: "maintenance",
            maintenance_at: new Date().toISOString(),
          })
          .eq("id", weaponId);

        if (weaponError) throw weaponError;
      }

      toast({
        title: "Devolução registrada!",
        description: destination === "maintenance"
          ? "A arma foi enviada para manutenção."
          : "A arma foi devolvida ao estoque.",
      });

      onOpenChange(false);
      setDestination("stock");
      setMaintenanceReason("");
    } catch (error) {
      console.error("Error returning weapon:", error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar a devolução.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Devolver Arma</DialogTitle>
          <DialogDescription>
            Escolha o destino da arma: {weaponModel}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <RadioGroup value={destination} onValueChange={(value) => setDestination(value as "stock" | "maintenance")}>
            <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-accent">
              <RadioGroupItem value="stock" id="stock" />
              <Label htmlFor="stock" className="flex items-center gap-2 cursor-pointer flex-1">
                <CheckCircle className="w-4 h-4" />
                Devolver ao estoque
              </Label>
            </div>
            <div className="flex items-center space-x-2 p-4 border rounded-lg cursor-pointer hover:bg-accent">
              <RadioGroupItem value="maintenance" id="maintenance" />
              <Label htmlFor="maintenance" className="flex items-center gap-2 cursor-pointer flex-1">
                <Wrench className="w-4 h-4" />
                Enviar para manutenção
              </Label>
            </div>
          </RadioGroup>

          {destination === "maintenance" && (
            <div className="space-y-2">
              <Label htmlFor="reason">Motivo da manutenção *</Label>
              <Textarea
                id="reason"
                placeholder="Descreva o problema ou motivo da manutenção..."
                value={maintenanceReason}
                onChange={(e) => setMaintenanceReason(e.target.value)}
                rows={4}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Confirmar Devolução
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};