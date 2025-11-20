from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import projects

# Initialize FastAPI app
app = FastAPI(
    title="CMD Transparency API",
    description="API for Government Procurement Transparency Platform - Tracking tender data and project progress",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS - Allow frontend to access the API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(projects.router)


@app.get("/")
async def root():
    """Root endpoint - API information"""
    return {
        "message": "CMD Transparency API",
        "description": "Government Procurement Transparency Platform",
        "version": "1.0.0",
        "docs": "/docs",
        "endpoints": {
            "projects": "/api/projects",
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
