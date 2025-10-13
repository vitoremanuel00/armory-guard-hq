import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import pistolImage from "@/assets/pistol-example.jpg";
import shotgunImage from "@/assets/shotgun-example.jpg";
import rifleImage from "@/assets/rifle-example.jpg";

type Weapon = {
  id: string;
  serial_number: string;
  model: string;
  caliber: string;
  manufacturer: string;
  status: string;
  type: string;
  photo_url?: string;
};

interface WeaponDetailsDialogProps {
  weapon: Weapon | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getWeaponImage = (type: string) => {
  switch (type) {
    case "pistol":
      return pistolImage;
    case "shotgun":
      return shotgunImage;
    case "rifle":
      return rifleImage;
    default:
      return pistolImage;
  }
};

const getTypeBadge = (type: string) => {
  const variants: Record<string, { label: string; className: string }> = {
    pistol: { label: "Pistola", className: "bg-blue-500/10 text-blue-600 border-blue-500/20" },
    shotgun: { label: "Escopeta", className: "bg-purple-500/10 text-purple-600 border-purple-500/20" },
    rifle: { label: "Fuzil", className: "bg-green-500/10 text-green-600 border-green-500/20" },
  };
  
  const variant = variants[type] || variants.pistol;
  return <Badge variant="outline" className={variant.className}>{variant.label}</Badge>;
};

const getStatusBadge = (status: string) => {
  const variants: Record<string, { label: string; variant: "default" | "secondary" | "destructive" }> = {
    available: { label: "Disponível", variant: "default" },
    allocated: { label: "Alocada", variant: "secondary" },
    maintenance: { label: "Manutenção", variant: "destructive" },
  };
  
  const variant = variants[status] || variants.available;
  return <Badge variant={variant.variant}>{variant.label}</Badge>;
};

export const WeaponDetailsDialog = ({ weapon, open, onOpenChange }: WeaponDetailsDialogProps) => {
  if (!weapon) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-foreground">Detalhes da Arma</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="aspect-video w-full overflow-hidden rounded-lg bg-muted/30 flex items-center justify-center">
            <img 
              src={weapon.photo_url || getWeaponImage(weapon.type)}
              alt={weapon.model}
              className="max-h-full w-auto object-contain"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Modelo</p>
              <p className="font-semibold text-foreground">{weapon.model}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Tipo</p>
              <div>{getTypeBadge(weapon.type)}</div>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Calibre</p>
              <p className="font-semibold text-foreground">{weapon.caliber}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Fabricante</p>
              <p className="font-semibold text-foreground">{weapon.manufacturer}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Número de Série</p>
              <p className="font-mono text-sm font-semibold text-foreground">{weapon.serial_number}</p>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Status</p>
              <div>{getStatusBadge(weapon.status)}</div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
