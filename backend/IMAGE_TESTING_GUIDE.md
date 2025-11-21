# 📸 Image Testing Guide for CMD Transparency API

## 🎯 How Images Work with Reviews

### **Image Storage Structure:**
```
Each Citizen Review contains:
├── review_id (e.g., "REV-A1B2C3D4")
├── project_id (e.g., "PRJ-2087-001")
├── reporter_name
├── review_text
├── photo_urls: ["uuid-filename1.jpg", "uuid-filename2.jpg", ...]
└── other review data
```

## 🔄 Complete Image Testing Workflow

### **Step 1: Upload Images and Submit Review**
1. **Use:** `Submit Review with Images` endpoint
2. **Method:** `POST /api/reviews/{project_id}/submit`
3. **Result:** Gets a `review_id` and uploaded image filenames

### **Step 2: Get Review Data with Image URLs**
1. **Use:** `Get All Project Reviews` endpoint  
2. **Method:** `GET /api/reviews/{project_id}/all`
3. **Response Structure:**
```json
{
  "project_id": "PRJ-2087-001",
  "total_reviews": 3,
  "reviews": [
    {
      "review_id": "REV-A1B2C3D4",
      "reporter_name": "John Citizen",
      "photo_urls": [
        "/uploads/reviews/12345678-1234-1234-1234-123456789abc.jpg",
        "/uploads/reviews/87654321-4321-4321-4321-cba987654321.jpg"
      ],
      // ... other review data
    }
  ]
}
```

### **Step 3: Access Individual Images**
1. **Extract filename** from `photo_urls` array
2. **Use:** `Get Review Image by Filename` endpoint
3. **Method:** `GET /api/reviews/image/{filename}`
4. **Example:** `GET /api/reviews/image/12345678-1234-1234-1234-123456789abc.jpg`

## 🧪 Testing Sequence in Postman

### **1. Submit a Review with Images**
```
POST {{base_url}}/api/reviews/PRJ-2087-001/submit
Form Data:
- reporter_name: "Test Reporter"
- review_type: "Progress Update"  
- review_text: "Testing image upload functionality"
- work_completed: true
- quality_rating: 4
- images: [file1.jpg, file2.jpg]
```

**Expected Response:**
```json
{
  "review_id": "REV-12345678",
  "project_id": "PRJ-2087-001", 
  "message": "Review submitted successfully",
  "review": {
    "review_id": "REV-12345678",
    "photo_urls": ["uuid1.jpg", "uuid2.jpg"]
  },
  "uploaded_images": ["path1", "path2"]
}
```

### **2. Get All Reviews for Project**
```
GET {{base_url}}/api/reviews/PRJ-2087-001/all
```

**Copy the `review_id` and filenames from `photo_urls`**

### **3. Access Specific Review Images**
```
GET {{base_url}}/api/reviews/image/uuid1.jpg
GET {{base_url}}/api/reviews/image/uuid2.jpg
```

## 📝 Updated Postman Variables

Set these variables in your Postman environment:

| Variable | Example Value | Description |
|----------|---------------|-------------|
| `base_url` | `http://localhost:8000` | API base URL |
| `project_id` | `PRJ-2087-001` | Project to test with |
| `review_id` | `REV-12345678` | Get from review submission response |
| `image_filename` | `uuid-generated.jpg` | Get from photo_urls array |

## 🔍 How to Find Review Images

### **Method 1: Get Specific Review (NEW - Recommended)**
1. **Use:** `Get Specific Review by ID` endpoint
2. **Method:** `GET /api/reviews/{project_id}/review/{review_id}`
3. **Use `photo_urls` array** to access individual images
4. **Most efficient** for getting a single review's data

### **Method 2: After Submitting Review**
1. Submit review → Get `review_id` 
2. Response includes `uploaded_images` array with full paths
3. Extract filename portion for image access

### **Method 3: From Project Reviews**
1. Get all reviews for project
2. Find specific review by `review_id`
3. Use `photo_urls` array to access images

### **Method 4: From Review Summary**
1. Get review summary for project
2. Shows `reviews_with_images` count
3. Get full review list to access specific images

## 🛠️ Database Schema Context

```sql
citizen_reports table:
├── review_id VARCHAR(50) UNIQUE  -- Primary identifier
├── project_id VARCHAR(50)        -- Links to project
├── photo_urls JSONB              -- Array of image filenames
└── ... other fields

Images stored in: uploads/reviews/{uuid-filename}.jpg
```

## ✅ Complete Test Checklist

- [ ] Upload single image
- [ ] Upload multiple images (up to 5)
- [ ] Submit review with images
- [ ] Get all reviews and verify photo_urls
- [ ] Access images using filenames from photo_urls
- [ ] Test image not found (404) scenario
- [ ] Verify image file size and type validation

## 🚨 Important Notes

1. **Image filenames are UUID-generated** - don't use hardcoded filenames
2. **Images are linked to review_id** - each review has its own photo_urls array  
3. **Get actual filenames** from API responses, not from assumptions
4. **Images persist** across API restarts (stored on filesystem)
5. **File validation** - only JPG, PNG, GIF, WebP up to 10MB allowed

This workflow ensures proper testing of the review-image relationship in your CMD Transparency API! 📸✅