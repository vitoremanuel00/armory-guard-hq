import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, AlertCircle } from "lucide-react";

type Weapon = {
  id: string;
  serial_number: string;
  model: string;
  caliber: string;
  manufacturer: string;
  status: string;
};

export const WeaponsTable = () => {
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [loading, setLoading] = useState(true);

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
    switch (status) {
      case "available":
        return <Badge className="bg-success text-success-foreground">Disponível</Badge>;
      case "allocated":
        return <Badge className="bg-accent text-accent-foreground">Alocada</Badge>;
      case "maintenance":
        return <Badge variant="destructive">Manutenção</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Estoque de Armas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  if (weapons.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Estoque de Armas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-3">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">Nenhuma arma cadastrada ainda.</p>
            <p className="text-sm text-muted-foreground">Clique em "Nova Arma" para começar.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="w-5 h-5" />
          Estoque de Armas ({weapons.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Número de Série</TableHead>
                <TableHead>Modelo</TableHead>
                <TableHead>Calibre</TableHead>
                <TableHead>Fabricante</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {weapons.map((weapon) => (
                <TableRow key={weapon.id}>
                  <TableCell className="font-medium">{weapon.serial_number}</TableCell>
                  <TableCell>{weapon.model}</TableCell>
                  <TableCell>{weapon.caliber}</TableCell>
                  <TableCell>{weapon.manufacturer}</TableCell>
                  <TableCell>{getStatusBadge(weapon.status)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
