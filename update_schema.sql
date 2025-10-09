-- Update product_images table to support multiple image resolutions

-- Add new columns for different image sizes
ALTER TABLE product_images 
ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS medium_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS large_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add index for primary image lookup
CREATE INDEX IF NOT EXISTS idx_product_images_primary ON product_images(product_id, is_primary);

-- Add trigger for updated_at
CREATE TRIGGER update_product_images_updated_at BEFORE UPDATE ON product_images
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON COLUMN product_images.thumbnail_url IS 'Small thumbnail image (128x128)';
COMMENT ON COLUMN product_images.medium_url IS 'Medium size image (512x512)';
COMMENT ON COLUMN product_images.large_url IS 'Large size image (1024x1024)';
COMMENT ON COLUMN product_images.is_primary IS 'Indicates if this is the main product image';
