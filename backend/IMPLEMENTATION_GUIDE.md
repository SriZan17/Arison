# Image Upload & Review API Implementation Guide

## 🎯 Implementation Complete!

Your CMD Transparency backend now supports **Image Upload** and **Citizen Reviews**! Here's what has been implemented:

## 📁 Files Added/Modified

### ✅ New Files Created:
- `app/routers/reviews.py` - Complete review API with image upload
- `test_api.py` - Python test script
- `test_api.sh` - Bash test script

### ✅ Files Modified:
- `requirements.txt` - Added file handling dependencies
- `app/models/schemas.py` - Added review models
- `app/main.py` - Added reviews router and static file serving
- `.gitignore` - Added uploads/ directory

## 🚀 How to Run

1. **Make sure dependencies are installed:**
   ```bash
   cd backend
   pip install fastapi uvicorn aiofiles python-multipart requests
   ```

2. **Start the server:**
   ```bash
   python -m uvicorn app.main:app --reload --port 8000
   ```

3. **Test the API:**
   ```bash
   python test_api.py
   ```

## 🔥 New API Endpoints

### 📸 Image Upload Endpoints

#### 1. Upload Single Image
```http
POST /api/reviews/upload-image
Content-Type: multipart/form-data

file: [image file]
```

#### 2. Upload Multiple Images
```http
POST /api/reviews/upload-images
Content-Type: multipart/form-data

files: [array of image files - max 5]
```

#### 3. Get Uploaded Image
```http
GET /api/reviews/image/{filename}
```

### 📝 Review Endpoints

#### 4. Submit Review with Images
```http
POST /api/reviews/{project_id}/submit
Content-Type: multipart/form-data

reporter_name: "John Doe" (optional)
reporter_contact: "john@example.com" (optional)
review_type: "Progress Update" | "Quality Issue" | "Completion Verification" | "Delay Report" | "Fraud Alert"
review_text: "Detailed review description" (min 10 chars)
work_completed: true/false
quality_rating: 1-5 (optional)
latitude: 27.6915 (optional)
longitude: 86.0660 (optional)
images: [files] (optional, max 5)
```

#### 5. Get All Reviews for Project
```http
GET /api/reviews/{project_id}/all
```

#### 6. Get Review Summary
```http
GET /api/reviews/{project_id}/summary
```

## 💡 Usage Examples

### Using cURL

**Submit a review with images:**
```bash
curl -X POST "http://localhost:8000/api/reviews/PRJ-2087-001/submit" \
  -F "reporter_name=John Doe" \
  -F "review_type=Completion Verification" \
  -F "review_text=The work is completed but quality could be better" \
  -F "work_completed=true" \
  -F "quality_rating=3" \
  -F "latitude=27.6915" \
  -F "longitude=86.0660" \
  -F "images=@photo1.jpg" \
  -F "images=@photo2.jpg"
```

**Get review summary:**
```bash
curl "http://localhost:8000/api/reviews/PRJ-2087-001/summary"
```

### Using Python

```python
import requests

# Submit review with images
files = [
    ('images', ('photo1.jpg', open('photo1.jpg', 'rb'), 'image/jpeg')),
    ('images', ('photo2.jpg', open('photo2.jpg', 'rb'), 'image/jpeg'))
]

data = {
    'reporter_name': 'Jane Doe',
    'review_type': 'Quality Issue',
    'review_text': 'Poor construction quality observed',
    'work_completed': False,
    'quality_rating': 2,
    'latitude': 27.6915,
    'longitude': 86.0660
}

response = requests.post(
    'http://localhost:8000/api/reviews/PRJ-2087-001/submit',
    files=files,
    data=data
)

print(response.json())
```

### Using JavaScript (Frontend)

```javascript
// Submit review with images
const formData = new FormData();
formData.append('reporter_name', 'John Doe');
formData.append('review_type', 'Progress Update');
formData.append('review_text', 'Work is progressing well');
formData.append('work_completed', 'false');
formData.append('quality_rating', '4');
formData.append('latitude', '27.6915');
formData.append('longitude', '86.0660');

// Add images
const imageFiles = document.getElementById('images').files;
for (let i = 0; i < imageFiles.length; i++) {
    formData.append('images', imageFiles[i]);
}

fetch('http://localhost:8000/api/reviews/PRJ-2087-001/submit', {
    method: 'POST',
    body: formData
})
.then(response => response.json())
.then(data => console.log(data));
```

## 🎨 Key Features

### ✅ Image Upload
- **Supported formats**: JPG, JPEG, PNG, GIF, WebP
- **Max file size**: 10MB per image
- **Max images per review**: 5
- **Unique filenames**: UUID-based to prevent conflicts
- **File validation**: Size and format checking

### ✅ Enhanced Reviews
- **Review Types**: Progress Update, Quality Issue, Completion Verification, Delay Report, Fraud Alert
- **Work Completion**: Boolean flag to verify official status
- **Quality Rating**: 1-5 star rating system
- **Geolocation**: GPS coordinates for verification
- **Anonymous Reporting**: Optional reporter information

### ✅ Statistics & Analytics
- **Review Summary**: Aggregated data per project
- **Completion Percentage**: How many citizens confirm work is done
- **Average Quality Rating**: Community quality assessment
- **Review Type Breakdown**: Types of reports received
- **Image Evidence**: Count of reviews with photo proof

## 📊 API Response Examples

### Review Submission Response:
```json
{
  "review_id": "REV-A1B2C3D4",
  "project_id": "PRJ-2087-001",
  "message": "Review submitted successfully",
  "review": {
    "review_id": "REV-A1B2C3D4",
    "reporter_name": "John Doe",
    "review_type": "Progress Update",
    "review_text": "Work is progressing well",
    "work_completed": false,
    "quality_rating": 4,
    "geolocation": {"lat": 27.6915, "lng": 86.0660},
    "photo_urls": ["/uploads/reviews/uuid1.jpg", "/uploads/reviews/uuid2.jpg"],
    "timestamp": "2025-11-20T10:30:00",
    "verified": false
  },
  "uploaded_images": ["/uploads/reviews/uuid1.jpg", "/uploads/reviews/uuid2.jpg"]
}
```

### Review Summary Response:
```json
{
  "project_id": "PRJ-2087-001",
  "project_name": "Hile Khanapani Yojana-6, Khamti",
  "total_reviews": 3,
  "work_completed_percentage": 33.33,
  "average_quality_rating": 3.67,
  "review_type_breakdown": {
    "Progress Update": 2,
    "Quality Issue": 1
  },
  "reviews_with_images": 2,
  "verified_reviews": 0
}
```

## 🔧 Technical Details

### File Storage
- Images stored in `uploads/reviews/` directory
- Unique UUID filenames prevent conflicts
- Static file serving via FastAPI StaticFiles

### Data Models
- `CitizenReview` - Enhanced review model with validation
- `ImageUploadResponse` - Image upload metadata
- `ReviewSubmissionResponse` - Complete submission response
- `ReviewType` - Enum for review categories

### Validation
- File size validation (10MB max)
- File type validation (images only)
- Text length validation (10 char minimum)
- Rating range validation (1-5)

## 🎤 Hackathon Demo Flow

1. **Show existing project**: "Government says this road is 35% complete"
2. **Submit citizen review**: Post review saying work hasn't started
3. **Upload photos**: Add evidence showing empty construction site
4. **Show discrepancy**: API shows 0% citizen completion vs 35% official
5. **The impact**: "This is how we crowdsource anti-corruption monitoring!"

## 🔐 Security Considerations

For production deployment:
- Add authentication and authorization
- Implement rate limiting
- Add CSRF protection
- Use cloud storage (AWS S3, etc.)
- Add image compression/optimization
- Implement content moderation

## 🌐 Interactive Documentation

Visit `http://localhost:8000/docs` to see the interactive Swagger UI with all endpoints!

---

**Your CMD Transparency Platform is now ready with full image upload and citizen review capabilities!** 🎉