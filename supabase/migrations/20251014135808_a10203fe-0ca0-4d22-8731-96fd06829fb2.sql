-- Adicionar política para permitir que admin delete armas
CREATE POLICY "Admins can delete weapons"
ON public.weapons
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Adicionar comentário explicativo
COMMENT ON POLICY "Admins can delete weapons" ON public.weapons IS 
'Permite que administradores excluam armas do estoque.';