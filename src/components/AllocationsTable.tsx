import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { History, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Allocation = {
  id: string;
  weapon_id: string;
  user_id: string;
  allocated_at: string;
  returned_at: string | null;
  notes: string | null;
  status: string;
  weapons: {
    serial_number: string;
    model: string;
  };
  profiles: {
    full_name: string;
    email: string;
  };
};

export const AllocationsTable = () => {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAllocations();

    const channel = supabase
      .channel("allocations-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "allocations",
        },
        () => {
          fetchAllocations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAllocations = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("allocations")
      .select(`
        *,
        weapons (serial_number, model),
        profiles (full_name, email)
      `)
      .order("allocated_at", { ascending: false });

    if (error) {
      console.error("Error fetching allocations:", error);
    } else {
      setAllocations(data || []);
    }
    setLoading(false);
  };

  const handleReturn = async (id: string) => {
    const { error } = await supabase
      .from("allocations")
      .update({ status: "returned", returned_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível registrar a devolução.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Devolução registrada!",
        description: "A arma foi devolvida com sucesso.",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Alocações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-8">Carregando...</p>
        </CardContent>
      </Card>
    );
  }

  if (allocations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Alocações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-3">
            <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">Nenhuma alocação registrada ainda.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Alocações ({allocations.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border border-border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Arma</TableHead>
                <TableHead>Funcionário</TableHead>
                <TableHead>Alocação</TableHead>
                <TableHead>Devolução</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allocations.map((allocation) => (
                <TableRow key={allocation.id}>
                  <TableCell className="font-medium">
                    <div>
                      <p className="font-semibold">{allocation.weapons.serial_number}</p>
                      <p className="text-sm text-muted-foreground">{allocation.weapons.model}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{allocation.profiles.full_name}</p>
                      <p className="text-sm text-muted-foreground">{allocation.profiles.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(allocation.allocated_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                  </TableCell>
                  <TableCell>
                    {allocation.returned_at
                      ? format(new Date(allocation.returned_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                      : "-"}
                  </TableCell>
                  <TableCell>
                    {allocation.status === "active" ? (
                      <Badge className="bg-accent text-accent-foreground">Ativa</Badge>
                    ) : (
                      <Badge className="bg-success text-success-foreground">Devolvida</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {allocation.status === "active" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleReturn(allocation.id)}
                        className="gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Devolver
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
