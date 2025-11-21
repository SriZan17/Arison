from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.routers import projects, reviews, auth
from app.database.config import connect_db, disconnect_db
from pathlib import Path

# Initialize FastAPI app
app = FastAPI(
    title="E-निरीक्षण API",
    description="API for Government Procurement Transparency Platform - Tracking tender data and project progress",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)


# Database event handlers
@app.on_event("startup")
async def startup():
    """Connect to database on startup"""
    await connect_db()


@app.on_event("shutdown")
async def shutdown():
    """Disconnect from database on shutdown"""
    await disconnect_db()


# Configure CORS - Allow frontend to access the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory for serving images
uploads_dir = Path("uploads")
uploads_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# Include routers
app.include_router(auth.router)
app.include_router(projects.router)
app.include_router(reviews.router)


@app.get("/")
async def root():
    """Root endpoint - API information"""
    return {
        "message": "E-निरीक्षण API",
        "description": "Government Procurement Transparency Platform",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "authentication": "/api/auth",
            "projects": "/api/projects",
            "reviews": "/api/reviews",
            "statistics": "/api/projects/stats/overview",
            "filters": "/api/projects/filters/options",
        },
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "cmd-transparency-api"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
