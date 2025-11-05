from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Dict, Optional
from .. import models
from ..database import get_db
from ..services.ai_assistant import get_assistant

router = APIRouter()

class QuestionRequest(BaseModel):
    question: str
    rebuild_kb: bool = False

class AnswerResponse(BaseModel):
    answer: str
    sources: List[Dict]

@router.post("/{project_id}/ask", response_model=AnswerResponse)
def ask_question(
    project_id: int,
    request: QuestionRequest,
    db: Session = Depends(get_db)
):
    """Ask the AI assistant a question about the story"""
    # Check project exists
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    try:
        # Get or create assistant
        assistant = get_assistant(project_id, db, rebuild=request.rebuild_kb)
        
        # Ask question
        result = assistant.ask(request.question, project.title)
        
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.post("/{project_id}/rebuild-kb")
def rebuild_knowledge_base(project_id: int, db: Session = Depends(get_db)):
    """Force rebuild of the knowledge base (call after major edits)"""
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    try:
        assistant = get_assistant(project_id, db, rebuild=True)
        return {"message": "Knowledge base rebuilt successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")