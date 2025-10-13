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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

type AllocateWeaponDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

type Weapon = {
  id: string;
  serial_number: string;
  model: string;
};

type Profile = {
  id: string;
  full_name: string;
  email: string;
};

export const AllocateWeaponDialog = ({ open, onOpenChange }: AllocateWeaponDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [weaponId, setWeaponId] = useState("");
  const [userId, setUserId] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (open) {
      fetchAvailableWeapons();
      fetchProfiles();
    }
  }, [open]);

  const fetchAvailableWeapons = async () => {
    const { data, error } = await supabase
      .from("weapons")
      .select("id, serial_number, model")
      .eq("status", "available")
      .order("serial_number");

    if (error) {
      console.error("Error fetching weapons:", error);
    } else {
      setWeapons(data || []);
    }
  };

  const fetchProfiles = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .order("full_name");

    if (error) {
      console.error("Error fetching profiles:", error);
    } else {
      setProfiles(data || []);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!weaponId || !userId) {
      toast({
        title: "Erro",
        description: "Selecione uma arma e um funcionário.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("allocations").insert([
        {
          weapon_id: weaponId,
          user_id: userId,
          notes: notes || null,
          status: "active",
        },
      ]);

      if (error) throw error;

      toast({
        title: "Alocação realizada!",
        description: "A arma foi alocada com sucesso.",
      });

      setWeaponId("");
      setUserId("");
      setNotes("");
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível realizar a alocação.",
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
          <DialogTitle>Alocar Arma</DialogTitle>
          <DialogDescription>Aloque uma arma disponível para um funcionário.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="weapon">Arma *</Label>
            <Select value={weaponId} onValueChange={setWeaponId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma arma" />
              </SelectTrigger>
              <SelectContent>
                {weapons.length === 0 ? (
                  <div className="px-2 py-3 text-sm text-muted-foreground">
                    Nenhuma arma disponível
                  </div>
                ) : (
                  weapons.map((weapon) => (
                    <SelectItem key={weapon.id} value={weapon.id}>
                      {weapon.serial_number} - {weapon.model}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="user">Funcionário *</Label>
            <Select value={userId} onValueChange={setUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um funcionário" />
              </SelectTrigger>
              <SelectContent>
                {profiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    {profile.full_name} ({profile.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Observações</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione observações sobre esta alocação (opcional)"
              rows={3}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || weapons.length === 0} className="flex-1">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Alocando...
                </>
              ) : (
                "Alocar"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
