-- Create analysis_results table for storing AI analysis results
CREATE TABLE IF NOT EXISTS analysis_results (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    image_id UUID NOT NULL,
    user_id UUID NOT NULL,
    result JSONB NOT NULL,
    
    -- Add foreign key constraints if you have these tables
    -- FOREIGN KEY (image_id) REFERENCES land_images(id) ON DELETE CASCADE,
    -- FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Add indexes for better query performance
    INDEX idx_analysis_results_image_id (image_id),
    INDEX idx_analysis_results_user_id (user_id),
    INDEX idx_analysis_results_created_at (created_at)
);

-- Add RLS (Row Level Security) policies
ALTER TABLE analysis_results ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own analysis results
CREATE POLICY "Users can view own analysis results" ON analysis_results
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own analysis results
CREATE POLICY "Users can insert own analysis results" ON analysis_results
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own analysis results
CREATE POLICY "Users can update own analysis results" ON analysis_results
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own analysis results
CREATE POLICY "Users can delete own analysis results" ON analysis_results
    FOR DELETE USING (auth.uid() = user_id);

-- If you need to create the land_images table as well:
CREATE TABLE IF NOT EXISTS land_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID NOT NULL,
    image_url TEXT NOT NULL,
    lat DECIMAL(10, 8),
    lon DECIMAL(11, 8),
    file_size INTEGER,
    file_type TEXT,
    
    INDEX idx_land_images_user_id (user_id),
    INDEX idx_land_images_created_at (created_at)
);

-- Add RLS for land_images table
ALTER TABLE land_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own land images" ON land_images
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own land images" ON land_images
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own land images" ON land_images
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own land images" ON land_images
    FOR DELETE USING (auth.uid() = user_id);

