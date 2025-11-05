from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, asc
from typing import List, Optional
from .. import models, schemas
from ..database import get_db

router = APIRouter()

@router.get("/{project_id}", response_model=List[schemas.EntityResponse])
def list_entities(
    project_id: int,
    entity_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    # Fixed query with explicit select_from and join conditions
    query = db.query(
        models.Entity,
        func.count(models.EntityMention.id).label('mention_count'),
        func.min(models.Chapter.chapter_number).label('first_appearance'),
        func.max(models.Chapter.chapter_number).label('last_appearance')
    ).select_from(models.Entity).outerjoin(
        models.EntityMention,
        models.Entity.id == models.EntityMention.entity_id
    ).outerjoin(
        models.Chapter,
        models.EntityMention.chapter_id == models.Chapter.id
    ).filter(models.Entity.project_id == project_id)
    
    if entity_type:
        query = query.filter(models.Entity.entity_type == entity_type)
    
    results = query.group_by(models.Entity.id).all()
    
    return [
        {
            **entity.__dict__,
            'mention_count': count or 0,
            'first_appearance': first,
            'last_appearance': last
        }
        for entity, count, first, last in results
    ]

@router.get("/{entity_id}/mentions")
def get_entity_mentions(entity_id: int, db: Session = Depends(get_db)):
    mentions = db.query(models.EntityMention).join(
        models.Chapter,
        models.EntityMention.chapter_id == models.Chapter.id
    ).filter(
        models.EntityMention.entity_id == entity_id
    ).order_by(asc(models.Chapter.chapter_number)).all()
    
    return [
        {
            "chapter_id": m.chapter_id,
            "chapter_number": m.chapter.chapter_number,
            "chapter_title": m.chapter.title,
            "context": m.context,
            "mentioned_as": m.mentioned_as,
            "position": m.start_pos
        }
        for m in mentions
    ]

@router.put("/{entity_id}", response_model=schemas.EntityResponse)
def update_entity(
    entity_id: int,
    entity: schemas.EntityUpdate,
    db: Session = Depends(get_db)
):
    db_entity = db.query(models.Entity).filter(models.Entity.id == entity_id).first()
    if not db_entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    
    for key, value in entity.model_dump(exclude_unset=True).items():
        setattr(db_entity, key, value)
    
    db.commit()
    db.refresh(db_entity)
    
    # Get mention count
    mention_count = db.query(func.count(models.EntityMention.id)).filter(
        models.EntityMention.entity_id == entity_id
    ).scalar() or 0
    
    return {**db_entity.__dict__, 'mention_count': mention_count}

@router.delete("/{entity_id}")
def delete_entity(entity_id: int, db: Session = Depends(get_db)):
    entity = db.query(models.Entity).filter(models.Entity.id == entity_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    db.delete(entity)
    db.commit()
    return {"message": "Entity deleted"}

@router.post("/merge")
def merge_entities(
    keep_id: int,
    merge_ids: List[int],
    db: Session = Depends(get_db)
):
    """Merge multiple entities into one"""
    from ..services.entity_resolver import EntityResolver
    
    EntityResolver.merge_entities(db, keep_id, merge_ids)
    return {"message": f"Merged {len(merge_ids)} entities into entity {keep_id}"}

@router.get("/duplicates/{project_id}")
def find_duplicate_entities(project_id: int, db: Session = Depends(get_db)):
    """Find potential duplicate entities"""
    from ..services.entity_resolver import EntityResolver
    
    entities = db.query(models.Entity).filter(
        models.Entity.project_id == project_id
    ).all()
    
    duplicates = []
    checked = set()
    
    for entity in entities:
        if entity.id in checked:
            continue
        
        similar = EntityResolver.find_similar_entities(
            db, project_id, entity.name, entity.entity_type, threshold=0.7
        )
        
        if len(similar) > 1:  # Found duplicates
            group = [entity.id] + [s[0].id for s in similar if s[0].id != entity.id]
            duplicates.append({
                'entities': [
                    {'id': e.id, 'name': e.name} 
                    for e in entities if e.id in group
                ],
                'similarity': similar[0][1] if similar else 0
            })
            checked.update(group)
    
    return duplicates

@router.get("/{project_id}/relationships")
def get_entity_relationships(project_id: int, db: Session = Depends(get_db)):
    """Get entities that appear together in chapters"""
    from sqlalchemy import and_, func
    
    # Find entities that appear in the same chapters
    relationships = db.query(
        models.EntityMention.entity_id.label('entity_1'),
        models.EntityMention.entity_id.label('entity_2'),
        func.count(models.EntityMention.chapter_id).label('co_occurrences')
    ).join(
        models.EntityMention,
        and_(
            models.EntityMention.chapter_id == models.EntityMention.chapter_id,
            models.EntityMention.entity_id < models.EntityMention.entity_id
        )
    ).group_by('entity_1', 'entity_2').all()
    
    return relationships

@router.get("/{project_id}/export")
def export_project(project_id: int, format: str = "json", db: Session = Depends(get_db)):
    """Export project data (entities, chapters, etc.)"""
    import json
    
    project = db.query(models.Project).filter(models.Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    chapters = db.query(models.Chapter).filter(
        models.Chapter.project_id == project_id
    ).order_by(models.Chapter.chapter_number).all()
    
    entities = db.query(models.Entity).filter(
        models.Entity.project_id == project_id
    ).all()
    
    export_data = {
        'project': {
            'title': project.title,
            'description': project.description,
            'is_own_writing': project.is_own_writing
        },
        'chapters': [
            {
                'number': ch.chapter_number,
                'title': ch.title,
                'content': ch.content,
                'notes': ch.notes,
                'word_count': ch.word_count
            }
            for ch in chapters
        ],
        'entities': [
            {
                'name': e.name,
                'type': e.entity_type,
                'description': e.description,
                'aliases': e.aliases
            }
            for e in entities
        ]
    }
    
    if format == "json":
        from fastapi.responses import JSONResponse
        return JSONResponse(content=export_data)
    elif format == "markdown":
        # Generate markdown format
        md = f"# {project.title}\n\n"
        md += f"{project.description}\n\n"
        md += "## Chapters\n\n"
        for ch in chapters:
            md += f"### Chapter {ch.chapter_number}: {ch.title}\n\n"
            md += f"{ch.content}\n\n"
        return {"content": md, "format": "markdown"}
    
@router.get("/{project_id}/search")
def search_content(
    project_id: int,
    query: str,
    search_type: str = "all",  # all, chapters, entities
    db: Session = Depends(get_db)
):
    """Search through chapters and entities"""
    from sqlalchemy import or_
    
    results = {
        'chapters': [],
        'entities': []
    }
    
    if search_type in ["all", "chapters"]:
        chapters = db.query(models.Chapter).filter(
            models.Chapter.project_id == project_id,
            or_(
                models.Chapter.content.ilike(f"%{query}%"),
                models.Chapter.title.ilike(f"%{query}%"),
                models.Chapter.notes.ilike(f"%{query}%")
            )
        ).all()
        
        results['chapters'] = [
            {
                'id': ch.id,
                'chapter_number': ch.chapter_number,
                'title': ch.title,
                'preview': get_context_preview(ch.content, query)
            }
            for ch in chapters
        ]
    
    if search_type in ["all", "entities"]:
        entities = db.query(models.Entity).filter(
            models.Entity.project_id == project_id,
            or_(
                models.Entity.name.ilike(f"%{query}%"),
                models.Entity.description.ilike(f"%{query}%")
            )
        ).all()
        
        results['entities'] = [
            {
                'id': e.id,
                'name': e.name,
                'type': e.entity_type,
                'description': e.description
            }
            for e in entities
        ]
    
    return results

def get_context_preview(text: str, query: str, context_length: int = 100):
    """Get preview of text around the search query"""
    lower_text = text.lower()
    lower_query = query.lower()
    
    pos = lower_text.find(lower_query)
    if pos == -1:
        return text[:context_length] + "..."
    
    start = max(0, pos - context_length // 2)
    end = min(len(text), pos + len(query) + context_length // 2)
    
    preview = text[start:end]
    if start > 0:
        preview = "..." + preview
    if end < len(text):
        preview = preview + "..."
    
    return preview