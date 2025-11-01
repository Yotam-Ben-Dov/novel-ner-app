from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import projects, chapters, entities

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Novel NER API")

# CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(chapters.router, prefix="/api/chapters", tags=["chapters"])
app.include_router(entities.router, prefix="/api/entities", tags=["entities"])

@app.get("/")
def root():
    return {"message": "Novel NER API is running"}