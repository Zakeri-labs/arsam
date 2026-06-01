-- Supabase Setup Script

-- 1. Create table for storing services JSON data
CREATE TABLE IF NOT EXISTS public.services_data (
  id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for services_data
ALTER TABLE public.services_data ENABLE ROW LEVEL SECURITY;

-- Allow public read access to services_data
CREATE POLICY "Allow public read access on services_data"
  ON public.services_data FOR SELECT
  USING (true);

-- Allow public write access to services_data (or restrict to admin role if you prefer)
CREATE POLICY "Allow public insert/update on services_data"
  ON public.services_data FOR ALL
  USING (true)
  WITH CHECK (true);


-- 2. Create table for customer requests
CREATE TABLE IF NOT EXISTS public.requests (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  description TEXT,
  service_title TEXT NOT NULL,
  files JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS) for requests
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

-- Allow public to insert requests
CREATE POLICY "Allow public insert on requests"
  ON public.requests FOR INSERT
  WITH CHECK (true);

-- Allow public to read requests (or restrict to admin)
CREATE POLICY "Allow public read on requests"
  ON public.requests FOR SELECT
  USING (true);

-- Allow public to delete requests (or restrict to admin)
CREATE POLICY "Allow public delete on requests"
  ON public.requests FOR DELETE
  USING (true);


-- 3. Create 'uploads' bucket in Storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS for the uploads bucket
-- Policy to allow public to read files
CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'uploads' );

-- Policy to allow public to upload files
CREATE POLICY "Public Upload"
  ON storage.objects FOR INSERT
  WITH CHECK ( bucket_id = 'uploads' );

-- Policy to allow public to delete files
CREATE POLICY "Public Delete"
  ON storage.objects FOR DELETE
  USING ( bucket_id = 'uploads' );
