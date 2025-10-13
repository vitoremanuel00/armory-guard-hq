-- Drop the restrictive policy that only allows users to see their own profile
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Create a new policy that allows authenticated users to view all profiles
-- This is necessary for the allocations table to show employee names
CREATE POLICY "Authenticated users can view all profiles"
ON public.profiles
FOR SELECT
USING (auth.role() = 'authenticated');