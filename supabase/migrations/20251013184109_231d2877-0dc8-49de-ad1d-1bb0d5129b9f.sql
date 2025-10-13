-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create weapons table
CREATE TABLE public.weapons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  serial_number TEXT UNIQUE NOT NULL,
  model TEXT NOT NULL,
  caliber TEXT NOT NULL,
  manufacturer TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'allocated', 'maintenance')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.weapons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view weapons"
  ON public.weapons FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create weapons"
  ON public.weapons FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update weapons"
  ON public.weapons FOR UPDATE
  TO authenticated
  USING (true);

-- Create allocations table
CREATE TABLE public.allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  weapon_id UUID NOT NULL REFERENCES public.weapons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  allocated_at TIMESTAMPTZ DEFAULT NOW(),
  returned_at TIMESTAMPTZ,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'returned'))
);

ALTER TABLE public.allocations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view allocations"
  ON public.allocations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create allocations"
  ON public.allocations FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update allocations"
  ON public.allocations FOR UPDATE
  TO authenticated
  USING (true);

-- Function to update weapon status on allocation
CREATE OR REPLACE FUNCTION update_weapon_status()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' THEN
    UPDATE public.weapons SET status = 'allocated' WHERE id = NEW.weapon_id;
  ELSIF NEW.status = 'returned' THEN
    UPDATE public.weapons SET status = 'available' WHERE id = NEW.weapon_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER allocation_status_trigger
  AFTER INSERT OR UPDATE ON public.allocations
  FOR EACH ROW EXECUTE FUNCTION update_weapon_status();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER weapons_updated_at
  BEFORE UPDATE ON public.weapons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();