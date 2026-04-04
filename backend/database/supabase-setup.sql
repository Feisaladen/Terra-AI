-- Terra AI Supabase Database Setup
-- Run this SQL in your Supabase project's SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create land_images table for storing uploaded images
CREATE TABLE IF NOT EXISTS land_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    lat DECIMAL(10, 8),
    lon DECIMAL(11, 8),
    file_size INTEGER,
    file_type TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create analysis_results table for storing AI analysis (optional - we're not using this anymore)
-- But keeping it here in case you want to use it later
CREATE TABLE IF NOT EXISTS analysis_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    image_id UUID NOT NULL REFERENCES land_images(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    result JSONB NOT NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_land_images_user_id ON land_images(user_id);
CREATE INDEX IF NOT EXISTS idx_land_images_created_at ON land_images(created_at);
CREATE INDEX IF NOT EXISTS idx_land_images_uploaded_at ON land_images(uploaded_at);

CREATE INDEX IF NOT EXISTS idx_analysis_results_image_id ON analysis_results(image_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_user_id ON analysis_results(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_results_created_at ON analysis_results(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE land_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for land_images table
DROP POLICY IF EXISTS "Users can view own land images" ON land_images;
CREATE POLICY "Users can view own land images" ON land_images
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own land images" ON land_images;
CREATE POLICY "Users can insert own land images" ON land_images
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own land images" ON land_images;
CREATE POLICY "Users can update own land images" ON land_images
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own land images" ON land_images;
CREATE POLICY "Users can delete own land images" ON land_images
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for analysis_results table
DROP POLICY IF EXISTS "Users can view own analysis results" ON analysis_results;
CREATE POLICY "Users can view own analysis results" ON analysis_results
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own analysis results" ON analysis_results;
CREATE POLICY "Users can insert own analysis results" ON analysis_results
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own analysis results" ON analysis_results;
CREATE POLICY "Users can update own analysis results" ON analysis_results
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own analysis results" ON analysis_results;
CREATE POLICY "Users can delete own analysis results" ON analysis_results
    FOR DELETE USING (auth.uid() = user_id);

-- Create storage bucket for images (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('land-images', 'land-images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies
DROP POLICY IF EXISTS "Users can upload own images" ON storage.objects;
CREATE POLICY "Users can upload own images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'land-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

DROP POLICY IF EXISTS "Users can view own images" ON storage.objects;
CREATE POLICY "Users can view own images" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'land-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

DROP POLICY IF EXISTS "Public can view images" ON storage.objects;
CREATE POLICY "Public can view images" ON storage.objects
    FOR SELECT USING (bucket_id = 'land-images');

DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
CREATE POLICY "Users can update own images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'land-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;
CREATE POLICY "Users can delete own images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'land-images' 
        AND auth.uid()::text = (storage.foldername(name))[1]
    );

-- Create a function to automatically delete images when land_images record is deleted
CREATE OR REPLACE FUNCTION delete_storage_object()
RETURNS TRIGGER AS $$
BEGIN
    -- Extract the file path from the image_url
    -- Assuming URL format: https://xxx.supabase.co/storage/v1/object/public/land-images/user_id/filename
    IF OLD.image_url IS NOT NULL THEN
        -- Extract filename from the URL
        DELETE FROM storage.objects 
        WHERE bucket_id = 'land-images' 
        AND name LIKE '%' || split_part(OLD.image_url, '/', array_length(string_to_array(OLD.image_url, '/'), 1));
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically delete storage objects
DROP TRIGGER IF EXISTS delete_land_image_trigger ON land_images;
CREATE TRIGGER delete_land_image_trigger
    BEFORE DELETE ON land_images
    FOR EACH ROW
    EXECUTE FUNCTION delete_storage_object();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON land_images TO anon, authenticated;
GRANT ALL ON analysis_results TO anon, authenticated;

-- Success message
SELECT 'Terra AI database setup completed successfully!' as status;

