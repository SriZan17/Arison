# CMD Transparency - Backend API

Government Procurement Transparency Platform - FastAPI Backend

## 🎯 Project Overview

This is the backend API for the CMD Transparency platform, designed to combat corruption in government procurement by providing transparent access to tender data and enabling citizen monitoring.

## 📁 Project Structure

```
backend/
├── app/
│   ├── ____init____.py
│   ├── main.py                 # FastAPI application entry point
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py          # Pydantic models for data validation
│   ├── routers/
│   │   ├── __init__.py
│   │   └── projects.py         # API endpoints for procurement projects
│   └── data/
│       ├── __init__.py
│       └── mock_data.py        # Mock procurement data (6 projects)
├── requirements.txt            # Python dependencies
└── README.md                   # This file
```

## 🚀 Features

### Core Functionality
- **Procurement Data Aggregation**: Clean API for government tender data
- **Advanced Filtering**: Filter by ministry, status, fiscal year, budget range
- **Progress Tracking**: Real-time project completion percentage
- **Citizen Reporting**: Allow citizens to report and verify project status
- **Statistics Dashboard**: Overview metrics and analytics

### API Endpoints

#### Projects
- `GET /api/projects/` - Get all projects with filters
- `GET /api/projects/{id}` - Get specific project details
- `GET /api/projects/{id}/progress` - Get project progress tracking
- `GET /api/projects/{id}/reports` - Get citizen reports for a project
- `POST /api/projects/{id}/report` - Submit a citizen report
- `GET /api/projects/stats/overview` - Get overall statistics
- `GET /api/projects/filters/options` - Get available filter options

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.8+
- pip (Python package manager)

### Step 1: Navigate to Backend Directory
```bash
cd backend
```

### Step 2: Create Virtual Environment (Recommended)
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Run the Server
```bash
# Option 1: Using uvicorn directly
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Option 2: Using Python
python -m uvicorn app.main:app --reload
```

The API will be available at: `http://localhost:8000`

## 📚 API Documentation

Once the server is running, access interactive documentation:

- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## 🧪 Testing the API

### Using cURL

**Get all projects:**
```bash
curl http://localhost:8000/api/projects/
```

**Filter by ministry:**
```bash
curl "http://localhost:8000/api/projects/?ministry=Ministry%20of%20Health"
```

**Get project progress:**
```bash
curl http://localhost:8000/api/projects/PRJ-2087-001/progress
```

**Get statistics:**
```bash
curl http://localhost:8000/api/projects/stats/overview
```

### Using Python requests
```python
import requests

# Get all projects
response = requests.get("http://localhost:8000/api/projects/")
projects = response.json()

# Filter by status
response = requests.get("http://localhost:8000/api/projects/?status=In%20Progress")
in_progress = response.json()

# Submit citizen report
report_data = {
    "project_id": "PRJ-2087-001",
    "reporter_name": "John Doe",
    "report_text": "Construction work is progressing well",
    "timestamp": "2025-11-20T10:00:00"
}
response = requests.post(
    "http://localhost:8000/api/projects/PRJ-2087-001/report",
    json=report_data
)
```

## 📊 Mock Data

The system includes 6 sample projects:

1. **Water Supply Project** - Likhu Tamakoshi (35% complete, In Progress)
2. **Health Center Construction** - Bhaktapur (60% complete, In Progress)
3. **School Building** - Chitwan (100% complete, Completed)
4. **Highway Construction** - Pokhara-Baglung (20% complete, Delayed)
5. **Irrigation Canal** - Bardiya (15% complete, In Progress)
6. **Hospital Equipment** - Karnali (75% complete, Disputed)

Each project includes:
- Complete procurement details
- Timeline information
- Contractor details
- Location (lat/lng)
- Citizen reports
- Progress percentage

## 🎨 Key Features for Hackathon Demo

### 1. Ministry Filtering
```python
# Filter by specific ministry
GET /api/projects/?ministry=Ministry of Health
```

### 2. Progress Tracking
```python
# Track project lifecycle
GET /api/projects/PRJ-2087-001/progress
# Returns: status, percentage, timeline, contractor
```

### 3. Citizen Verification
```python
# Citizens can report discrepancies
POST /api/projects/PRJ-2087-001/report
{
  "report_text": "Road construction not started yet",
  "photo_url": "...",
  "geolocation": {"lat": 27.69, "lng": 86.06}
}
```

### 4. Status Breakdown
```python
# Get overview statistics
GET /api/projects/stats/overview
# Returns: total projects, budget, status breakdown
```

## 🔐 Future Enhancements

- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] User authentication & authorization
- [ ] Image upload for citizen reports
- [ ] Real-time notifications
- [ ] Data scraping from government portals
- [ ] Advanced analytics and ML for fraud detection
- [ ] Email alerts for project delays

## 🤝 Contributing

This is a hackathon project. For improvements:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📝 License

See LICENSE file in the root directory.

## 🎤 Hackathon Pitch Points

When presenting this project:

1. **The Problem**: "Government says project is 100% done, but citizens see an empty field"
2. **The Gap**: "We have Open Data, but not Open Monitoring"
3. **The Solution**: "Real-time citizen verification with geolocation proof"
4. **The Impact**: "Crowdsourced anti-corruption monitoring"

## 👥 Team

Built for the CMD Transparency Hackathon

---

**API Status**: ✅ Ready for Integration
**Data**: ✅ Mock data loaded (6 projects)
**Documentation**: ✅ Swagger UI available
**CORS**: ✅ Enabled for frontend integration
