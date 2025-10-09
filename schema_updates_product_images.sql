-- ============================================================================
-- Migration: Add Multiple Image Support to Products
-- Date: 2025-10-12
-- Description: Adds support for multiple product images with different resolutions
-- ============================================================================

-- Update product_images table to support multiple image resolutions
ALTER TABLE product_images
ADD COLUMN IF NOT EXISTS thumbnail_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS medium_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS large_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add index for primary image lookup
CREATE INDEX IF NOT EXISTS idx_product_images_primary ON product_images(product_id, is_primary);

-- Add trigger for updated_at column
DROP TRIGGER IF EXISTS update_product_images_updated_at ON product_images;
CREATE TRIGGER update_product_images_updated_at BEFORE UPDATE ON product_images
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add column comments
COMMENT ON COLUMN product_images.image_url IS 'Original/full resolution image URL';
COMMENT ON COLUMN product_images.thumbnail_url IS 'Small thumbnail image (128x128)';
COMMENT ON COLUMN product_images.medium_url IS 'Medium size image (512x512)';
COMMENT ON COLUMN product_images.large_url IS 'Large size image (1024x1024)';
COMMENT ON COLUMN product_images.is_primary IS 'Indicates if this is the main product image';
COMMENT ON COLUMN product_images.sort_order IS 'Display order of the image';

-- ============================================================================
-- Example usage:
-- ============================================================================
-- INSERT INTO product_images (
--     product_id,
--     image_url,
--     thumbnail_url,
--     medium_url,
--     large_url,
--     is_primary,
--     sort_order
-- ) VALUES (
--     1,
--     'https://cdn.pawsmart.com/products/rc-dog-001-1.jpg',
--     'https://cdn.pawsmart.com/products/rc-dog-001-1-thumb.jpg',
--     'https://cdn.pawsmart.com/products/rc-dog-001-1-medium.jpg',
--     'https://cdn.pawsmart.com/products/rc-dog-001-1-large.jpg',
--     true,
--     0
-- );
