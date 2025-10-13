import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Lock, Package, History } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4">
            <div className="mx-auto w-20 h-20 bg-primary rounded-full flex items-center justify-center shadow-lg">
              <Shield className="w-12 h-12 text-primary-foreground" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground">
              Sistema de Controle de Armamento
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Gerencie o estoque e alocações de armas da sua empresa de segurança com
              eficiência e segurança.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
            <Button size="lg" onClick={() => navigate("/auth")} className="gap-2">
              <Lock className="w-5 h-5" />
              Acessar Sistema
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6 pt-16">
            <div className="p-6 rounded-lg bg-card border border-border shadow-sm">
              <Package className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Controle de Estoque</h3>
              <p className="text-muted-foreground">
                Cadastre e gerencie todas as armas do seu arsenal de forma organizada.
              </p>
            </div>
            <div className="p-6 rounded-lg bg-card border border-border shadow-sm">
              <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Alocação Segura</h3>
              <p className="text-muted-foreground">
                Registre alocações de armas para funcionários com rastreamento completo.
              </p>
            </div>
            <div className="p-6 rounded-lg bg-card border border-border shadow-sm">
              <History className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Histórico Completo</h3>
              <p className="text-muted-foreground">
                Acompanhe todo o histórico de alocações e devoluções em tempo real.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
