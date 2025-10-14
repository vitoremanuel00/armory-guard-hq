import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

type AllocationDuration = {
  weapon_id: string;
  model: string;
  duration_hours: number;
};

type TypeAllocation = {
  type: string;
  percentage: number;
  total_hours: number;
};

export const UserStats = () => {
  const [allocationDurations, setAllocationDurations] = useState<AllocationDuration[]>([]);
  const [typeAllocations, setTypeAllocations] = useState<TypeAllocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: allocations } = await supabase
        .from("allocations")
        .select(`
          weapon_id,
          allocated_at,
          returned_at,
          weapons (model, type)
        `)
        .eq("user_id", user.id);

      if (allocations) {
        const durations = allocations.map((alloc: any) => {
          const start = new Date(alloc.allocated_at);
          const end = alloc.returned_at ? new Date(alloc.returned_at) : new Date();
          const hours = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60));
          
          return {
            weapon_id: alloc.weapon_id,
            model: alloc.weapons?.model || "Desconhecido",
            duration_hours: hours,
          };
        }).sort((a, b) => b.duration_hours - a.duration_hours).slice(0, 5);

        setAllocationDurations(durations);

        // Type allocations
        const typeStats = allocations.reduce((acc: any, alloc: any) => {
          const type = alloc.weapons?.type || "unknown";
          const start = new Date(alloc.allocated_at);
          const end = alloc.returned_at ? new Date(alloc.returned_at) : new Date();
          const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
          
          if (!acc[type]) {
            acc[type] = 0;
          }
          acc[type] += hours;
          return acc;
        }, {});

        const totalHours = Object.values(typeStats).reduce((sum: number, h: any) => sum + h, 0) as number;
        
        const typeData = Object.entries(typeStats).map(([type, hours]: [string, any]) => ({
          type: type === "pistol" ? "Pistola" : type === "shotgun" ? "Escopeta" : type === "rifle" ? "Fuzil" : "Outro",
          percentage: totalHours > 0 ? Math.round((hours / totalHours) * 100) : 0,
          total_hours: Math.round(hours),
        }));

        setTypeAllocations(typeData);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const typePieData = typeAllocations.map((item, index) => ({
    name: item.type,
    value: item.percentage,
    hours: item.total_hours,
    color: ["hsl(215 55% 55%)", "hsl(270 55% 55%)", "hsl(142 70% 45%)"][index] || "hsl(var(--muted))",
  }));

  if (loading) {
    return <div className="text-muted-foreground">Carregando estatísticas...</div>;
  }

  return (
    <div className="space-y-6">
      {typeAllocations.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Minhas Alocações - Por Tipo de Arma</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={typePieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {typePieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any, name: any, props: any) => [`${value}% (${props.payload.hours}h)`, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {allocationDurations.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Minhas Alocações - Tempo de Uso</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={allocationDurations}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="model" stroke="hsl(var(--foreground))" />
                <YAxis stroke="hsl(var(--foreground))" label={{ value: 'Horas', angle: -90, position: 'insideLeft' }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                <Bar dataKey="duration_hours" fill="hsl(var(--primary))" name="Horas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {typeAllocations.length === 0 && allocationDurations.length === 0 && (
        <Card className="bg-card border-border">
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              Você ainda não possui histórico de alocações
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
