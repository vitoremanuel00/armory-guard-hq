-- Remover políticas antigas de INSERT em allocations
DROP POLICY IF EXISTS "Users can create their own allocations" ON public.allocations;

-- Criar nova política que impede admin de criar allocations
CREATE POLICY "Non-admin users can create their own allocations"
ON public.allocations
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND NOT public.has_role(auth.uid(), 'admin')
);

-- Adicionar comentário explicativo
COMMENT ON POLICY "Non-admin users can create their own allocations" ON public.allocations IS 
'Permite que apenas usuários não-admin criem alocações para si mesmos. Administradores não podem alocar armas.';