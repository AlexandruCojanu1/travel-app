-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(business_id, user_id) -- One review per user per business
);

-- Enable RLS (safe to run multiple times)
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid "policy already exists" errors
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON reviews;
DROP POLICY IF EXISTS "Users can create their own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON reviews;

-- Re-create Policies
CREATE POLICY "Reviews are viewable by everyone" 
    ON reviews FOR SELECT 
    USING (true);

CREATE POLICY "Users can create their own reviews" 
    ON reviews FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" 
    ON reviews FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" 
    ON reviews FOR DELETE 
    USING (auth.uid() = user_id);

-- Create index (IF NOT EXISTS is not standard in all PG versions for indexes, but normally consistent names handle this. 
-- For safety we can just wrap it or ignore error, but let's leave it simple as the table creation handles the main part)
CREATE INDEX IF NOT EXISTS idx_reviews_business_id ON reviews(business_id);
