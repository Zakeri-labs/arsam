-- 1. Create services table (Each service is a separate row)
CREATE TABLE IF NOT EXISTS public.services (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    image_url TEXT,

    -- Multilingual Titles
    title_en TEXT,
    title_fa TEXT,
    title_ar TEXT,

    -- Multilingual Descriptions
    description_en TEXT,
    description_fa TEXT,
    description_ar TEXT,

    -- Multilingual Fees & Working Days
    service_fee_en TEXT,
    service_fee_fa TEXT,
    service_fee_ar TEXT,

    government_fees_en TEXT,
    government_fees_fa TEXT,
    government_fees_ar TEXT,

    working_days_en TEXT,
    working_days_fa TEXT,
    working_days_ar TEXT,

    -- Multilingual Requirements
    requirements_en JSONB DEFAULT '[]'::jsonb,
    requirements_fa JSONB DEFAULT '[]'::jsonb,
    requirements_ar JSONB DEFAULT '[]'::jsonb,

    -- Region Availability Flags
    is_uae BOOLEAN DEFAULT true,
    is_oman BOOLEAN DEFAULT true,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create services_data table (legacy backup / compatibility)
CREATE TABLE IF NOT EXISTS public.services_data (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create requests table
CREATE TABLE IF NOT EXISTS public.requests (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    description TEXT,
    service_title TEXT NOT NULL,
    files JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public all access on services" ON public.services;
DROP POLICY IF EXISTS "Allow public all access on services_data" ON public.services_data;
DROP POLICY IF EXISTS "Allow public all access on requests" ON public.requests;

-- Create policies for full access
CREATE POLICY "Allow public all access on services" ON public.services FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on services_data" ON public.services_data FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public all access on requests" ON public.requests FOR ALL USING (true) WITH CHECK (true);

-- 4. Create Storage bucket for uploads
INSERT INTO storage.buckets (id, name, public) 
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop storage policies if existing
DROP POLICY IF EXISTS "Allow public read on uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public upload to uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update on uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete on uploads" ON storage.objects;

-- Create Storage policies
CREATE POLICY "Allow public read on uploads" ON storage.objects FOR SELECT USING (bucket_id = 'uploads');
CREATE POLICY "Allow public upload to uploads" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'uploads');
CREATE POLICY "Allow public update on uploads" ON storage.objects FOR UPDATE USING (bucket_id = 'uploads');
CREATE POLICY "Allow public delete on uploads" ON storage.objects FOR DELETE USING (bucket_id = 'uploads');
