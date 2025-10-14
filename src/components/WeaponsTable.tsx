import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, ChevronLeft, ChevronRight, ArrowUpDown, Settings } from "lucide-react";
import { WeaponDetailsDialog } from "./WeaponDetailsDialog";
import { EditWeaponDialog } from "./EditWeaponDialog";

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

type SortField = "model" | "status" | null;
type SortDirection = "asc" | "desc";

type WeaponsTableProps = {
  isAdmin?: boolean;
};

export const WeaponsTable = ({ isAdmin = false }: WeaponsTableProps) => {
  const [weapons, setWeapons] = useState<Weapon[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const itemsPerPage = 30;

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(1);
  };

  let filteredWeapons = filterType === "all" 
    ? weapons 
    : weapons.filter(w => w.type === filterType);

  // Apply sorting
  if (sortField) {
    filteredWeapons = [...filteredWeapons].sort((a, b) => {
      let aValue: string | number = a[sortField];
      let bValue: string | number = b[sortField];
      
      if (sortField === "status") {
        const statusOrder = { available: 1, allocated: 2, maintenance: 3 };
        aValue = statusOrder[a.status as keyof typeof statusOrder] || 999;
        bValue = statusOrder[b.status as keyof typeof statusOrder] || 999;
      }
      
      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }

  // Pagination
  const totalPages = Math.ceil(filteredWeapons.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedWeapons = filteredWeapons.slice(startIndex, startIndex + itemsPerPage);

  const handleViewDetails = (weapon: Weapon) => {
    setSelectedWeapon(weapon);
    setDetailsOpen(true);
  };

  const handleEdit = (weapon: Weapon) => {
    setSelectedWeapon(weapon);
    setEditOpen(true);
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
                <>
                  <div className="rounded-md border border-border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="text-foreground">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSort("model")}
                              className="gap-2 font-semibold hover:bg-transparent p-0"
                            >
                              Modelo
                              <ArrowUpDown className="w-4 h-4" />
                            </Button>
                          </TableHead>
                          <TableHead className="text-foreground">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSort("status")}
                              className="gap-2 font-semibold hover:bg-transparent p-0"
                            >
                              Status
                              <ArrowUpDown className="w-4 h-4" />
                            </Button>
                          </TableHead>
                          <TableHead className="text-foreground w-24">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedWeapons.map((weapon) => (
                          <TableRow key={weapon.id} className="hover:bg-muted/30">
                            <TableCell className="font-medium text-foreground">{weapon.model}</TableCell>
                            <TableCell>{getStatusBadge(weapon.status)}</TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewDetails(weapon)}
                                  className="gap-2"
                                >
                                  <Eye className="w-4 h-4" />
                                  Detalhes
                                </Button>
                                {isAdmin && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(weapon)}
                                    className="gap-2"
                                  >
                                    <Settings className="w-4 h-4" />
                                    Editar
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <p className="text-sm text-muted-foreground">
                        Página {currentPage} de {totalPages} ({filteredWeapons.length} armas)
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          disabled={currentPage === 1}
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Anterior
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          disabled={currentPage === totalPages}
                        >
                          Próxima
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </>
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

      {isAdmin && (
        <EditWeaponDialog
          weapon={selectedWeapon as any}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      )}
    </>
  );
};
