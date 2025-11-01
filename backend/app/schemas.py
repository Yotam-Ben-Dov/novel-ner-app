from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from datetime import datetime

class ProjectCreate(BaseModel):
    title: str
    description: Optional[str] = None
    is_own_writing: bool = True

class ProjectResponse(ProjectCreate):
    id: int
    created_at: datetime
    updated_at: Optional[datetime]
    chapter_count: int = 0
    
    class Config:
        from_attributes = True

class ChapterCreate(BaseModel):
    chapter_number: int
    title: Optional[str] = None
    content: str
    notes: Optional[str] = None

class ChapterUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    notes: Optional[str] = None

class ChapterResponse(BaseModel):
    id: int
    project_id: int
    chapter_number: int
    title: Optional[str]
    content: str
    notes: Optional[str]
    word_count: int
    created_at: datetime
    updated_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class EntityUpdate(BaseModel):
    name: Optional[str] = None
    entity_type: Optional[str] = None
    description: Optional[str] = None
    aliases: Optional[List[str]] = None

class EntityResponse(BaseModel):
    id: int
    name: str
    entity_type: str
    description: Optional[str]
    aliases: List[str] = []
    mention_count: int = 0
    first_appearance: Optional[int] = None  # Chapter number
    last_appearance: Optional[int] = None
    
    class Config:
        from_attributes = True