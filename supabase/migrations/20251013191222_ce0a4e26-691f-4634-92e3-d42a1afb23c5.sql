-- Add weapon type column
ALTER TABLE public.weapons ADD COLUMN type text NOT NULL DEFAULT 'pistol' CHECK (type IN ('pistol', 'shotgun', 'rifle'));

-- Insert sample weapons
INSERT INTO public.weapons (manufacturer, model, serial_number, caliber, type, status) VALUES
  ('Taurus', 'PT-840', 'TAU001', '.40', 'pistol', 'available'),
  ('Glock', '19 Gen5', 'GLK002', '9mm', 'pistol', 'available'),
  ('Taurus', 'PT-92', 'TAU003', '9mm', 'pistol', 'available'),
  ('Imbel', 'MD97', 'IMB004', '12GA', 'shotgun', 'available'),
  ('CBC', 'Pump', 'CBC005', '12GA', 'shotgun', 'available'),
  ('Taurus', 'T4', 'TAU006', '5.56mm', 'rifle', 'available'),
  ('IMBEL', 'IA2', 'IMB007', '5.56mm', 'rifle', 'available'),
  ('Glock', '17 Gen5', 'GLK008', '9mm', 'pistol', 'available'),
  ('Taurus', 'RT-838', 'TAU009', '.38', 'pistol', 'available'),
  ('Mossberg', '590', 'MOS010', '12GA', 'shotgun', 'available');