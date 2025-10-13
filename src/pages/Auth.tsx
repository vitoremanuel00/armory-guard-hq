import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Shield, Loader2 } from "lucide-react";
import { z } from "zod";

const authSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  fullName: z.string().min(3, "Nome deve ter no mínimo 3 caracteres").optional(),
});

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        navigate("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isForgotPassword) {
        const validation = z.object({ email: z.string().email() }).safeParse({ email });
        if (!validation.success) {
          toast({
            title: "Erro",
            description: validation.error.errors[0].message,
            variant: "destructive",
          });
          return;
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/reset-password`,
        });

        if (error) throw error;

        toast({
          title: "Email enviado!",
          description: "Verifique sua caixa de entrada para redefinir sua senha.",
        });
        setIsForgotPassword(false);
      } else if (isLogin) {
        const validation = authSchema.omit({ fullName: true }).safeParse({ email, password });
        if (!validation.success) {
          toast({
            title: "Erro",
            description: validation.error.errors[0].message,
            variant: "destructive",
          });
          return;
        }

        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        toast({
          title: "Login realizado!",
          description: "Bem-vindo ao sistema.",
        });
      } else {
        const validation = authSchema.safeParse({ email, password, fullName });
        if (!validation.success) {
          toast({
            title: "Erro",
            description: validation.error.errors[0].message,
            variant: "destructive",
          });
          return;
        }

        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: {
              full_name: fullName,
            },
          },
        });

        if (error) throw error;

        toast({
          title: "Cadastro realizado!",
          description: "Sua conta foi criada com sucesso.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-secondary to-background p-4">
      <Card className="w-full max-w-md border-border shadow-2xl">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <Shield className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold text-foreground">
            {isForgotPassword ? "Recuperar Senha" : isLogin ? "Login" : "Criar Conta"}
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            {isForgotPassword
              ? "Digite seu email para recuperar sua senha"
              : isLogin
              ? "Entre no sistema de controle de armamento"
              : "Registre-se no sistema"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && !isForgotPassword && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Nome Completo</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Seu nome completo"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="border-input"
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu.email@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-input"
              />
            </div>
            {!isForgotPassword && (
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="border-input"
                />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : isForgotPassword ? (
                "Enviar Email"
              ) : isLogin ? (
                "Entrar"
              ) : (
                "Criar Conta"
              )}
            </Button>
          </form>

          <div className="mt-6 space-y-2 text-center text-sm">
            {!isForgotPassword && (
              <>
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-primary hover:underline block w-full"
                >
                  {isLogin ? "Não tem conta? Cadastre-se" : "Já tem conta? Faça login"}
                </button>
                {isLogin && (
                  <button
                    onClick={() => setIsForgotPassword(true)}
                    className="text-muted-foreground hover:text-primary hover:underline block w-full"
                  >
                    Esqueceu sua senha?
                  </button>
                )}
              </>
            )}
            {isForgotPassword && (
              <button
                onClick={() => setIsForgotPassword(false)}
                className="text-primary hover:underline block w-full"
              >
                Voltar para login
              </button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
