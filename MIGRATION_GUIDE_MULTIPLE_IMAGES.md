# Multiple Product Images Migration Guide

## Overview
This guide covers the implementation of multiple product images with different resolutions across the PawSmart system.

## Files Modified

### 1. API Specifications

#### CMS API (`api-swagger-cms.yaml`)
- **GET /products & /products/{id}**: Added `images` array to Product response schema
- **POST /products**: Added `multipart/form-data` support for multiple image uploads
- **PUT /products/{id}**: Added `multipart/form-data` support with image management
  - New images can be uploaded via `images` array
  - Existing images can be removed via `remove_image_ids` array

#### Mobile API (`api-swagger-mobile.yaml`)
- **GET /products & /products/{id}**: Added `images` array with multiple resolutions
  - Each image includes: `thumbnail`, `medium`, `large` URLs
  - Marked `image_128` field as deprecated for backward compatibility

### 2. Database Schema

#### Migration Script (`schema_updates_product_images.sql`)
Run this script on existing databases to add support for multiple image resolutions:

```sql
-- Add new columns
ALTER TABLE product_images
ADD COLUMN thumbnail_url VARCHAR(500),
ADD COLUMN medium_url VARCHAR(500),
ADD COLUMN large_url VARCHAR(500),
ADD COLUMN is_primary BOOLEAN DEFAULT FALSE,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add index
CREATE INDEX idx_product_images_primary ON product_images(product_id, is_primary);
```

#### Updated Table Structure
```sql
CREATE TABLE product_images (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,           -- Original/full resolution
    thumbnail_url VARCHAR(500),                 -- 128x128
    medium_url VARCHAR(500),                    -- 512x512
    large_url VARCHAR(500),                     -- 1024x1024
    image_type VARCHAR(50),                     -- 'main', 'gallery', 'thumbnail'
    is_primary BOOLEAN DEFAULT FALSE,           -- Main product image flag
    sort_order INTEGER DEFAULT 0,               -- Display order
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Implementation Steps

### Backend Implementation

1. **Image Upload Handling** (POST /products)
   ```javascript
   // Accept multipart/form-data with images array
   // Generate multiple resolutions for each uploaded image
   const sizes = {
     thumbnail: { width: 128, height: 128 },
     medium: { width: 512, height: 512 },
     large: { width: 1024, height: 1024 }
   };
   ```

2. **Image Processing**
   - Use image processing library (Sharp, Jimp, etc.)
   - Generate 4 versions: original, thumbnail, medium, large
   - Upload all versions to CDN/storage
   - Store URLs in `product_images` table

3. **Update Product Response**
   ```javascript
   // Include images array in product response
   {
     id: 101,
     name: "Royal Canin Dog Food",
     images: [
       {
         id: 1,
         url: "https://cdn.pawsmart.com/products/rc-dog-001-1.jpg",
         thumbnail: "https://cdn.pawsmart.com/products/rc-dog-001-1-thumb.jpg",
         medium: "https://cdn.pawsmart.com/products/rc-dog-001-1-medium.jpg",
         large: "https://cdn.pawsmart.com/products/rc-dog-001-1-large.jpg",
         is_primary: true,
         sort_order: 0
       }
     ]
   }
   ```

### Frontend Implementation (Mobile App)

1. **Product Listing**
   ```javascript
   // Use thumbnail for list view
   <Image source={{ uri: product.images[0]?.thumbnail }} />
   ```

2. **Product Detail**
   ```javascript
   // Use medium/large for detail view with image carousel
   <ImageCarousel
     images={product.images.map(img => img.large)}
   />
   ```

3. **Backward Compatibility**
   ```javascript
   // Fallback to deprecated image_128 if images array is empty
   const productImage = product.images?.[0]?.thumbnail || product.image_128;
   ```

### CMS Implementation

1. **Product Form**
   - Add multiple file upload field
   - Show existing images with delete option
   - Allow drag-and-drop reordering
   - Set primary image

2. **Image Management**
   ```javascript
   // Upload new images
   formData.append('images', file1);
   formData.append('images', file2);

   // Remove existing images
   formData.append('remove_image_ids', [3, 5]);
   ```

## Database Migration Steps

1. **Backup current database**
   ```bash
   pg_dump pawsmart > backup_$(date +%Y%m%d).sql
   ```

2. **Run migration script**
   ```bash
   psql -U postgres -d pawsmart -f schema_updates_product_images.sql
   ```

3. **Migrate existing image data** (if applicable)
   ```sql
   -- Copy image_128 from products to product_images
   INSERT INTO product_images (product_id, image_url, thumbnail_url, is_primary, sort_order)
   SELECT id, image_1920, image_128, true, 0
   FROM products
   WHERE image_128 IS NOT NULL;
   ```

## Image Processing Recommendations

### Storage Strategy
- Use CDN (CloudFlare, AWS CloudFront, etc.)
- Organize by product ID: `/products/{product_id}/{image_id}-{size}.jpg`
- Use WebP format for better compression (with JPEG fallback)

### Size Specifications
- **Thumbnail**: 128x128px - Product lists, cart
- **Medium**: 512x512px - Product detail on mobile
- **Large**: 1024x1024px - Image zoom, desktop view
- **Original**: Keep for future use

### Processing Library Options
- **Node.js**: Sharp (recommended)
- **Python**: Pillow
- **Go**: imaging, resize

## Testing Checklist

- [ ] Upload product with multiple images via CMS
- [ ] Verify all image sizes are generated
- [ ] Check product list shows thumbnail
- [ ] Check product detail shows full carousel
- [ ] Test image deletion
- [ ] Test image reordering
- [ ] Verify primary image selection
- [ ] Test backward compatibility (apps using image_128)
- [ ] Performance test with 5+ images per product

## Rollback Plan

If issues occur, restore from backup and revert API changes:
```bash
psql -U postgres -d pawsmart < backup_YYYYMMDD.sql
git checkout HEAD~1 api-swagger-*.yaml
```

## Performance Considerations

1. **Lazy Loading**: Load images progressively
2. **Caching**: Cache CDN URLs, set proper cache headers
3. **Pagination**: Limit images loaded in product lists
4. **Optimization**: Compress images before upload
5. **Indexes**: Ensure `idx_product_images_product` index is used

## Security Notes

- Validate file types (accept only images)
- Limit file size (e.g., 5MB max)
- Sanitize filenames
- Use signed URLs for private images
- Implement rate limiting on upload endpoints
