-- Update RLS policies for allocations table to show only user's own allocations
DROP POLICY IF EXISTS "Authenticated users can view allocations" ON public.allocations;
DROP POLICY IF EXISTS "Authenticated users can create allocations" ON public.allocations;
DROP POLICY IF EXISTS "Authenticated users can update allocations" ON public.allocations;

-- Users can only see their own allocations
CREATE POLICY "Users can view their own allocations"
ON public.allocations
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create allocations for themselves
CREATE POLICY "Users can create their own allocations"
ON public.allocations
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update only their own allocations (for returns)
CREATE POLICY "Users can update their own allocations"
ON public.allocations
FOR UPDATE
USING (auth.uid() = user_id);

-- Insert 100 pistols
INSERT INTO public.weapons (serial_number, model, manufacturer, caliber, type)
SELECT 
  'PST-' || LPAD(generate_series::text, 5, '0'),
  CASE (generate_series % 5)
    WHEN 0 THEN 'Glock 17'
    WHEN 1 THEN 'Beretta 92'
    WHEN 2 THEN 'SIG Sauer P226'
    WHEN 3 THEN 'Taurus PT92'
    WHEN 4 THEN 'Imbel MD1'
  END,
  CASE (generate_series % 5)
    WHEN 0 THEN 'Glock'
    WHEN 1 THEN 'Beretta'
    WHEN 2 THEN 'SIG Sauer'
    WHEN 3 THEN 'Taurus'
    WHEN 4 THEN 'Imbel'
  END,
  CASE (generate_series % 3)
    WHEN 0 THEN '9mm'
    WHEN 1 THEN '.40'
    WHEN 2 THEN '.45'
  END,
  'pistol'
FROM generate_series(1, 100);

-- Insert 100 shotguns
INSERT INTO public.weapons (serial_number, model, manufacturer, caliber, type)
SELECT 
  'SHT-' || LPAD(generate_series::text, 5, '0'),
  CASE (generate_series % 5)
    WHEN 0 THEN 'Remington 870'
    WHEN 1 THEN 'Mossberg 500'
    WHEN 2 THEN 'Benelli M4'
    WHEN 3 THEN 'Winchester 1300'
    WHEN 4 THEN 'Boito Standard'
  END,
  CASE (generate_series % 5)
    WHEN 0 THEN 'Remington'
    WHEN 1 THEN 'Mossberg'
    WHEN 2 THEN 'Benelli'
    WHEN 3 THEN 'Winchester'
    WHEN 4 THEN 'Boito'
  END,
  CASE (generate_series % 2)
    WHEN 0 THEN '12GA'
    WHEN 1 THEN '20GA'
  END,
  'shotgun'
FROM generate_series(1, 100);

-- Insert 100 rifles
INSERT INTO public.weapons (serial_number, model, manufacturer, caliber, type)
SELECT 
  'RFL-' || LPAD(generate_series::text, 5, '0'),
  CASE (generate_series % 5)
    WHEN 0 THEN 'M4A1'
    WHEN 1 THEN 'AK-47'
    WHEN 2 THEN 'HK G36'
    WHEN 3 THEN 'FN FAL'
    WHEN 4 THEN 'Imbel IA2'
  END,
  CASE (generate_series % 5)
    WHEN 0 THEN 'Colt'
    WHEN 1 THEN 'Kalashnikov'
    WHEN 2 THEN 'Heckler & Koch'
    WHEN 3 THEN 'FN Herstal'
    WHEN 4 THEN 'Imbel'
  END,
  CASE (generate_series % 4)
    WHEN 0 THEN '5.56mm'
    WHEN 1 THEN '7.62mm'
    WHEN 2 THEN '5.45mm'
    WHEN 3 THEN '.308'
  END,
  'rifle'
FROM generate_series(1, 100);