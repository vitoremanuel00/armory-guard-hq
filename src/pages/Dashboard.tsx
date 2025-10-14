import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Shield, LogOut, Plus, Package } from "lucide-react";
import { WeaponsTable } from "@/components/WeaponsTable";
import { AllocationsTable } from "@/components/AllocationsTable";
import { AddWeaponDialog } from "@/components/AddWeaponDialog";
import { AllocateWeaponDialog } from "@/components/AllocateWeaponDialog";
import { AdminStats } from "@/components/AdminStats";
import { UserStats } from "@/components/UserStats";
import { User, Session } from "@supabase/supabase-js";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [addWeaponOpen, setAddWeaponOpen] = useState(false);
  const [allocateWeaponOpen, setAllocateWeaponOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      } else {
        // Check if user is admin
        const { data: roleData } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", session.user.id)
          .eq("role", "admin")
          .maybeSingle();
        
        setIsAdmin(!!roleData);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logout realizado",
      description: "Até logo!",
    });
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Shield className="w-16 h-16 text-primary mx-auto animate-pulse" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Sistema de Armamento</h1>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Controle de Armamento</h2>
            <p className="text-muted-foreground mt-1">Gerencie o estoque e alocações de armas</p>
          </div>
          {isAdmin ? (
            <Button onClick={() => setAddWeaponOpen(true)} className="gap-2">
              <Package className="w-4 h-4" />
              Nova Arma
            </Button>
          ) : (
            <Button onClick={() => setAllocateWeaponOpen(true)} variant="secondary" className="gap-2">
              <Plus className="w-4 h-4" />
              Alocar Arma
            </Button>
          )}
        </div>

        {isAdmin ? <AdminStats /> : <UserStats />}

        <div className="grid gap-8">
          <WeaponsTable isAdmin={isAdmin} />
          <AllocationsTable />
        </div>
      </main>

      {isAdmin && <AddWeaponDialog open={addWeaponOpen} onOpenChange={setAddWeaponOpen} />}
      {!isAdmin && <AllocateWeaponDialog open={allocateWeaponOpen} onOpenChange={setAllocateWeaponOpen} />}
    </div>
  );
};

export default Dashboard;
