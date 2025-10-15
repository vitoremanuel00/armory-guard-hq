-- Add maintenance fields to allocations table
ALTER TABLE public.allocations
ADD COLUMN maintenance_required boolean DEFAULT false,
ADD COLUMN maintenance_reason text;

-- Add maintenance timestamp to weapons table
ALTER TABLE public.weapons
ADD COLUMN maintenance_at timestamp with time zone;