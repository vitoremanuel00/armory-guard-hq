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
  type: string;
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
    // Verificar se o usuário não é admin
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (roleData) {
      toast({
        title: "Acesso negado",
        description: "Administradores não podem alocar armas.",
        variant: "destructive",
      });
      return;
    }

    const { data, error } = await supabase
      .from("weapons")
      .select("id, serial_number, model, type")
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
      // Verificar se o usuário não é admin
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (roleData) {
        toast({
          title: "Acesso negado",
          description: "Administradores não podem alocar armas.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Verificar se a arma não está em manutenção
      const { data: weaponData } = await supabase
        .from("weapons")
        .select("status")
        .eq("id", weaponId)
        .single();

      if (weaponData?.status === "maintenance") {
        toast({
          title: "Arma em manutenção",
          description: "Esta arma não pode ser alocada pois está em manutenção.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }
      // Verificar se usuário já tem alocações ativas
      const { data: existingAllocations, error: checkError } = await supabase
        .from("allocations")
        .select("id, weapons(type)")
        .eq("user_id", userId)
        .eq("status", "active");

      if (checkError) throw checkError;

      if (existingAllocations && existingAllocations.length > 0) {
        toast({
          title: "Usuário já possui alocação ativa",
          description: "Este funcionário já tem armas alocadas. Devolva antes de alocar novas.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Obter tipo da arma selecionada
      const selectedWeapon = weapons.find(w => w.id === weaponId);
      if (!selectedWeapon) {
        toast({
          title: "Erro",
          description: "Arma não encontrada.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Validar regras de alocação
      const allocatedTypes = existingAllocations?.map((a: any) => a.weapons.type) || [];
      const hasPistol = allocatedTypes.includes("pistol");
      const hasShotgun = allocatedTypes.includes("shotgun");
      const hasRifle = allocatedTypes.includes("rifle");

      if (selectedWeapon.type === "pistol" && hasPistol) {
        toast({
          title: "Limite atingido",
          description: "Usuário já possui uma pistola alocada.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (selectedWeapon.type === "shotgun" && (hasShotgun || hasRifle)) {
        toast({
          title: "Combinação inválida",
          description: "Usuário já possui escopeta ou fuzil. Só é permitido 1 pistola + 1 escopeta OU 1 pistola + 1 fuzil.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      if (selectedWeapon.type === "rifle" && (hasRifle || hasShotgun)) {
        toast({
          title: "Combinação inválida",
          description: "Usuário já possui fuzil ou escopeta. Só é permitido 1 pistola + 1 fuzil OU 1 pistola + 1 escopeta.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

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
                      {weapon.serial_number} - {weapon.model} ({weapon.type === 'pistol' ? 'Pistola' : weapon.type === 'shotgun' ? 'Escopeta' : 'Fuzil'})
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
