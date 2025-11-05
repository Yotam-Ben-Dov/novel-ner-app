from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routers import projects, chapters, entities, assistant
import time

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Novel NER API")

# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    print(f"{request.method} {request.url.path} - {response.status_code} ({duration:.2f}s)")
    return response

# CORS
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
app.include_router(assistant.router, prefix="/api/assistant", tags=["assistant"])  # Add this

@app.get("/")
def root():
    return {"message": "Novel NER API is running"}