import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye } from "lucide-react";
import { WeaponDetailsDialog } from "./WeaponDetailsDialog";

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

export const WeaponsTable = () => {
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    fetchWeapons();

    const channel = supabase
      .channel("weapons-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "weapons",
        },
        () => {
          fetchWeapons();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchWeapons = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("weapons")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching weapons:", error);
    } else {
      setWeapons(data || []);
    }
    setLoading(false);
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

  const filteredWeapons = filterType === "all" 
    ? weapons 
    : weapons.filter(w => w.type === filterType);

  const handleViewDetails = (weapon: Weapon) => {
    setSelectedWeapon(weapon);
    setDetailsOpen(true);
  };

  if (loading) {
    return (
      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-foreground">Estoque de Armas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-card border-border shadow-sm">
        <CardHeader>
          <CardTitle className="text-foreground">Estoque de Armas</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={filterType} onValueChange={setFilterType} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="all">Todas</TabsTrigger>
              <TabsTrigger value="pistol">Pistolas</TabsTrigger>
              <TabsTrigger value="shotgun">Escopetas</TabsTrigger>
              <TabsTrigger value="rifle">Fuzis</TabsTrigger>
            </TabsList>

            <TabsContent value={filterType} className="mt-0">
              {filteredWeapons.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Nenhuma arma encontrada
                </p>
              ) : (
                <div className="rounded-md border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-foreground">Modelo</TableHead>
                        <TableHead className="text-foreground">Status</TableHead>
                        <TableHead className="text-foreground w-24">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredWeapons.map((weapon) => (
                        <TableRow key={weapon.id} className="hover:bg-muted/30">
                          <TableCell className="font-medium text-foreground">{weapon.model}</TableCell>
                          <TableCell>{getStatusBadge(weapon.status)}</TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetails(weapon)}
                              className="gap-2"
                            >
                              <Eye className="w-4 h-4" />
                              Detalhes
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <WeaponDetailsDialog 
        weapon={selectedWeapon}
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
      />
    </>
  );
};
