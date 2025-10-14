import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, AlertTriangle, CheckCircle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

type WeaponStats = {
  available: number;
  allocated: number;
  maintenance: number;
};

export const AdminStats = () => {
  const [weaponStats, setWeaponStats] = useState<WeaponStats>({ available: 0, allocated: 0, maintenance: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: weapons } = await supabase
        .from("weapons")
        .select("status");

      if (weapons) {
        const stats = weapons.reduce((acc, weapon) => {
          acc[weapon.status as keyof WeaponStats] = (acc[weapon.status as keyof WeaponStats] || 0) + 1;
          return acc;
        }, { available: 0, allocated: 0, maintenance: 0 } as WeaponStats);
        
        setWeaponStats(stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const weaponPieData = [
    { name: "Disponíveis", value: weaponStats.available, color: "hsl(var(--success))" },
    { name: "Alocadas", value: weaponStats.allocated, color: "hsl(var(--primary))" },
    { name: "Manutenção", value: weaponStats.maintenance, color: "hsl(var(--destructive))" },
  ];

  if (loading) {
    return <div className="text-muted-foreground">Carregando estatísticas...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Disponíveis</CardTitle>
            <CheckCircle className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{weaponStats.available}</div>
            <p className="text-xs text-muted-foreground">armas em estoque</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Alocadas</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{weaponStats.allocated}</div>
            <p className="text-xs text-muted-foreground">armas em uso</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Manutenção</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{weaponStats.maintenance}</div>
            <p className="text-xs text-muted-foreground">armas em reparo</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Status Geral do Estoque</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={weaponPieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {weaponPieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
