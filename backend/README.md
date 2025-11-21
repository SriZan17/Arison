# E-निरीक्षण Backend API

> **Government Procurement Transparency Platform**  
> A comprehensive FastAPI-based backend system for tracking government procurement projects and enabling citizen oversight through reviews and reports.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation & Setup](#installation--setup)
- [Database Configuration](#database-configuration)
- [API Documentation](#api-documentation)
- [Core Modules](#core-modules)
- [Database Schema](#database-schema)
- [Environment Configuration](#environment-configuration)
- [Running the Application](#running-the-application)
- [API Endpoints](#api-endpoints)
- [Data Models](#data-models)
- [File Upload System](#file-upload-system)
- [Development Workflow](#development-workflow)
- [Testing](#testing)
- [Production Deployment](#production-deployment)
- [Contributing](#contributing)

## 🎯 Overview

The E-निरीक्षण Backend is a comprehensive API system designed to enhance government procurement transparency. It enables citizens to track project progress, submit reviews with photographic evidence, and access detailed procurement information. The system serves as the backbone for democratic oversight of public spending.

### Key Objectives
- **Transparency**: Provide open access to government procurement data
- **Accountability**: Enable citizen reporting and verification
- **Efficiency**: Streamline procurement monitoring processes
- **Data Integrity**: Maintain accurate and verifiable project records

## ✨ Features

### 🏗️ **Project Management**
- Complete procurement project lifecycle tracking
- Advanced filtering by ministry, status, fiscal year, and budget
- Real-time progress monitoring with percentage completion
- Contractor and timeline management
- Budget analysis and financial oversight

### 👥 **Citizen Engagement**
- Anonymous and named citizen reporting system
- Multi-image upload support (up to 5 images per report)
- Geolocation tagging for on-site verification
- Quality rating system (1-5 stars)
- Review categorization (Progress Update, Quality Issue, etc.)

### 📊 **Analytics & Statistics**
- Real-time dashboard metrics
- Project completion analytics
- Ministry-wise spending breakdown
- Citizen engagement statistics
- Quality rating aggregations

### 🔐 **Data Security**
- Input validation and sanitization
- File upload restrictions and validation
- SQL injection prevention
- CORS security configuration

## 🛠️ Technology Stack

### **Backend Framework**
- **FastAPI 0.104.1** - Modern, fast web framework for APIs
- **Python 3.8+** - Programming language
- **Uvicorn** - ASGI server for production deployment

### **Database**
- **PostgreSQL** - Primary database for data persistence
- **SQLAlchemy** - ORM for database operations
- **Alembic** - Database migration management
- **asyncpg** - Async PostgreSQL driver

### **File Handling**
- **aiofiles** - Async file operations
- **python-multipart** - Multipart form data handling

### **Data Validation**
- **Pydantic** - Data validation and serialization
- **Python-dotenv** - Environment variable management

## 📁 Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                 # FastAPI application entry point
│   ├── database/
│   │   ├── __init__.py
│   │   ├── config.py           # Database configuration
│   │   ├── models.py           # SQLAlchemy ORM models
│   │   └── service.py          # Database service layer
│   ├── models/
│   │   ├── __init__.py
│   │   └── schemas.py          # Pydantic models for API
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── projects.py         # Project management endpoints
│   │   └── reviews.py          # Citizen review endpoints
│   └── data/
│       ├── __init__.py
│       └── mock_data.py        # Sample data for development
├── uploads/                    # File upload directory
│   └── reviews/               # Review images storage
├── migrate_database.py         # Database migration script
├── requirements.txt           # Python dependencies
├── .env                      # Environment variables
├── .gitignore               # Git ignore rules
└── README.md               # This documentation
```

## 🚀 Installation & Setup

### Prerequisites
- Python 3.8 or higher
- PostgreSQL 12 or higher
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/SriZan17/Arison.git
cd Arison/backend
```

### 2. Create Virtual Environment
```bash
python -m venv venv

# Windows
venv\Scripts\activate

# macOS/Linux
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Environment Configuration
Create a `.env` file in the backend directory:
```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/cmd_transparency
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_password
POSTGRES_DB=cmd_transparency
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Application Settings
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1

# File Upload Settings
UPLOAD_MAX_SIZE=10485760  # 10MB in bytes
ALLOWED_IMAGE_TYPES=jpg,jpeg,png,gif,webp
```

## 🗄️ Database Configuration

### PostgreSQL Setup
1. **Install PostgreSQL** on your system
2. **Create Database**:
```sql
CREATE DATABASE cmd_transparency;
CREATE USER cmd_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE cmd_transparency TO cmd_user;
```

3. **Run Migration**:
```bash
python migrate_database.py
```

This will create all tables and import sample data including:
- 6 government projects across different ministries
- 6 citizen reports with various review types
- 5 ministry records
- Project statistics and analytics

## 📖 API Documentation

### Interactive Documentation
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

### Base URL
- **Development**: `http://localhost:8000`

## 🔧 Core Modules

### 1. **Database Service Layer** (`app/database/service.py`)
Handles all database operations with optimized async queries:

```python
class DatabaseService:
    @staticmethod
    async def get_all_projects(ministry=None, status=None, ...)
    @staticmethod
    async def get_project_by_id(project_id: str)
    @staticmethod
    async def create_citizen_report(...)
    @staticmethod
    async def get_project_statistics(project_id: str)
```

### 2. **Projects Router** (`app/routers/projects.py`)
Manages government procurement projects:
- Project listing with advanced filters
- Individual project details
- Progress tracking
- Citizen report submission
- Statistical overviews

### 3. **Reviews Router** (`app/routers/reviews.py`)
Handles citizen engagement features:
- Image upload (single and multiple)
- Review submission with images
- Review analytics and summaries
- Image retrieval and management

## 🗃️ Database Schema

### **Projects Table**
```sql
CREATE TABLE projects (
    id VARCHAR(50) PRIMARY KEY,
    fiscal_year VARCHAR(10) NOT NULL,
    ministry VARCHAR(255) NOT NULL,
    budget_subtitle VARCHAR(500),
    procurement_plan JSONB NOT NULL,
    signatures JSONB,
    status VARCHAR(50) NOT NULL,
    progress_percentage DECIMAL(5,2) DEFAULT 0,
    location JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **Citizen Reports Table**
```sql
CREATE TABLE citizen_reports (
    id SERIAL PRIMARY KEY,
    review_id VARCHAR(50) UNIQUE NOT NULL,
    project_id VARCHAR(50) REFERENCES projects(id),
    reporter_name VARCHAR(255),
    reporter_contact VARCHAR(255),
    review_type VARCHAR(100) NOT NULL,
    review_text TEXT NOT NULL,
    work_completed BOOLEAN DEFAULT FALSE,
    quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
    geolocation JSONB,
    photo_urls JSONB,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **Ministries Table**
```sql
CREATE TABLE ministries (
    id SERIAL PRIMARY KEY,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **Project Statistics Table**
```sql
CREATE TABLE project_statistics (
    project_id VARCHAR(50) PRIMARY KEY REFERENCES projects(id),
    total_reviews INTEGER DEFAULT 0,
    work_completed_percentage DECIMAL(5,2) DEFAULT 0,
    average_quality_rating DECIMAL(3,2),
    reviews_with_images INTEGER DEFAULT 0,
    verified_reviews INTEGER DEFAULT 0,
    progress_updates INTEGER DEFAULT 0,
    quality_issues INTEGER DEFAULT 0,
    completion_verifications INTEGER DEFAULT 0,
    delay_reports INTEGER DEFAULT 0,
    fraud_alerts INTEGER DEFAULT 0,
    last_calculated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🏃‍♂️ Running the Application

### Development Mode
```bash
# Start with auto-reload
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or use the main.py directly
python app/main.py
```

### Production Mode
```bash
# Start with optimized settings
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Health Check
Visit `http://localhost:8000/health` to verify the application is running.

## 🛣️ API Endpoints

### **Projects API**

#### `GET /api/projects/`
Get all projects with filtering options.

**Query Parameters:**
- `ministry` (string): Filter by ministry name
- `status` (enum): Filter by project status
- `fiscal_year` (string): Filter by fiscal year
- `min_amount` (float): Minimum contract amount
- `max_amount` (float): Maximum contract amount
- `search` (string): Search in project details

**Example:**
```bash
curl "http://localhost:8000/api/projects/?ministry=Health&status=In Progress&min_amount=50000"
```

#### `GET /api/projects/{project_id}`
Get detailed information about a specific project.

#### `GET /api/projects/{project_id}/progress`
Get progress tracking information for a project.

#### `POST /api/projects/{project_id}/report`
Submit a citizen report for a project.

#### `GET /api/projects/{project_id}/reports`
Get all citizen reports for a specific project.

#### `GET /api/projects/stats/overview`
Get overall platform statistics.

#### `GET /api/projects/filters/options`
Get available filter options for the frontend.

### **Reviews API**

#### `POST /api/reviews/upload-image`
Upload a single image for a review.

#### `POST /api/reviews/upload-images`
Upload multiple images (up to 5) for a review.

#### `POST /api/reviews/{project_id}/submit`
Submit a complete citizen review with optional images.

#### `GET /api/reviews/image/{filename}`
Retrieve an uploaded review image.

#### `GET /api/reviews/{project_id}/all`
Get all reviews for a specific project.

#### `GET /api/reviews/{project_id}/summary`
Get summary statistics of reviews for a project.

#### `DELETE /api/reviews/image/{filename}`
Delete an uploaded review image.

## 📁 File Upload System

### **Configuration**
- **Maximum file size**: 10MB per image
- **Allowed formats**: JPG, JPEG, PNG, GIF, WebP
- **Storage location**: `uploads/reviews/` directory
- **Naming convention**: UUID-based unique filenames

### **Security Measures**
- File extension validation
- File size limits
- Content type checking
- Unique filename generation to prevent conflicts
- Directory traversal protection

## 🧪 Testing

### **API Testing**
```bash
# Test health endpoint
curl http://localhost:8000/health

# Test projects endpoint
curl http://localhost:8000/api/projects/

# Test with filters
curl "http://localhost:8000/api/projects/?ministry=Health&status=In Progress"
```

## 🚀 Production Deployment

### **Docker Deployment**
```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## 🤝 Contributing

### **Development Setup**
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `pytest`
5. Format code: `black app/`
6. Commit changes: `git commit -m 'Add amazing feature'`
7. Push to branch: `git push origin feature/amazing-feature`
8. Open a Pull Request

## 📈 Current Status

### **✅ Implemented Features**
- ✅ Complete FastAPI backend with PostgreSQL integration
- ✅ Advanced project filtering and search
- ✅ Multi-image upload system for citizen reviews
- ✅ Real-time statistics and analytics
- ✅ Comprehensive API documentation
- ✅ Database migration system with sample data

### **🔄 Database Integration**
- ✅ **Projects**: Fully database-backed with PostgreSQL
- ✅ **Citizen Reports**: Stored in database with image paths
- ✅ **Statistics**: Real-time calculation from live data
- ✅ **Ministries**: Database-sourced ministry list
- ✅ **File Uploads**: Integrated with database records

### **📊 Sample Data**
The system includes 6 comprehensive projects:
1. **PRJ-2087-001** - Rural Health Center Construction (35% complete)
2. **PRJ-2087-002** - Urban Water Supply System (60% complete)
3. **PRJ-2087-003** - Primary School Building (100% complete)
4. **PRJ-2087-004** - Highway Expansion Project (20% complete)
5. **PRJ-2087-005** - Irrigation Canal Development (15% complete)
6. **PRJ-2087-006** - Hospital Equipment Procurement (75% complete)

## 📞 Support

For technical support or questions:
- **Documentation**: [API Docs](http://localhost:8000/docs)
- **Issue Tracker**: [GitHub Issues](https://github.com/SriZan17/Arison/issues)

---

**🎯 API Status**: ✅ Production Ready with Full Database Integration  
**📊 Data**: ✅ PostgreSQL with 6 projects, 6 reports, 5 ministries  
**📚 Documentation**: ✅ Comprehensive API documentation available  
**🔄 CORS**: ✅ Enabled for frontend integration  
**📁 File Uploads**: ✅ Multi-image support with database integration  

*Built with ❤️ for Government Transparency and Democratic Oversight*
