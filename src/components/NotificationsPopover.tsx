import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Bell, Clock, AlertCircle } from "lucide-react";
import { differenceInHours, differenceInMinutes, format } from "date-fns";
import { ptBR } from "date-fns/locale";

type Notification = {
  id: string;
  weapon_model: string;
  allocated_at: string;
  type: 'warning' | 'overdue';
};

export const NotificationsPopover = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications();
    }, 60000); // Atualiza a cada 1 minuto

    const channel = supabase
      .channel("allocations-notifications")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "allocations",
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("allocations")
      .select(`
        id,
        allocated_at,
        weapons (model)
      `)
      .eq("user_id", user.id)
      .eq("status", "active");

    if (error) {
      console.error("Error fetching notifications:", error);
      setLoading(false);
      return;
    }

    const now = new Date();
    const notifs: Notification[] = [];

    data?.forEach((allocation: any) => {
      const allocatedDate = new Date(allocation.allocated_at);
      const hoursElapsed = differenceInHours(now, allocatedDate);
      const minutesUntilDue = differenceInMinutes(allocatedDate, now) + 24 * 60;

      // Notificação de prazo estourado (mais de 24 horas)
      if (hoursElapsed >= 24) {
        notifs.push({
          id: allocation.id,
          weapon_model: allocation.weapons.model,
          allocated_at: allocation.allocated_at,
          type: 'overdue',
        });
      }
      // Notificação de aviso (faltam 60 minutos ou menos para completar 24h)
      else if (minutesUntilDue <= 60 && minutesUntilDue > 0) {
        notifs.push({
          id: allocation.id,
          weapon_model: allocation.weapons.model,
          allocated_at: allocation.allocated_at,
          type: 'warning',
        });
      }
    });

    setNotifications(notifs);
    setLoading(false);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative gap-2">
          <Bell className="w-4 h-4" />
          {notifications.length > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-destructive text-destructive-foreground">
              {notifications.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80">
        <div className="space-y-4">
          <h4 className="font-semibold">Notificações</h4>
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando...</p>
          ) : notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
          ) : (
            <div className="space-y-2">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 rounded-lg border ${
                    notif.type === 'overdue' 
                      ? 'bg-destructive/10 border-destructive' 
                      : 'bg-warning/10 border-warning'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {notif.type === 'overdue' ? (
                      <AlertCircle className="w-4 h-4 text-destructive mt-0.5" />
                    ) : (
                      <Clock className="w-4 h-4 text-warning mt-0.5" />
                    )}
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium">
                        {notif.type === 'overdue' 
                          ? 'Prazo estourado!' 
                          : 'Prazo próximo do fim'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {notif.weapon_model}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Alocada em: {format(new Date(notif.allocated_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};