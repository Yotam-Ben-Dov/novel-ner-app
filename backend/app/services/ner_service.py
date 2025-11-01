import spacy
from sqlalchemy.orm import Session
from .. import models

nlp_en = None

def get_nlp():
    global nlp_en
    if nlp_en is None:
        # Use the transformer model for better accuracy
        try:
            nlp_en = spacy.load("en_core_web_trf")
        except:
            # Fallback to smaller model
            nlp_en = spacy.load("en_core_web_sm")
    return nlp_en

def process_chapter_ner(chapter_id: int, language: str, db: Session):
    """Extract entities from chapter and create Entity + EntityMention records"""
    chapter = db.query(models.Chapter).filter(models.Chapter.id == chapter_id).first()
    if not chapter:
        return
    
    # Clear existing mentions for this chapter
    db.query(models.EntityMention).filter(
        models.EntityMention.chapter_id == chapter_id
    ).delete()
    
    nlp = get_nlp()
    doc = nlp(chapter.content)
    
    # Entity type mapping
    type_mapping = {
        'PERSON': 'character',
        'GPE': 'location',  # Geopolitical entity
        'LOC': 'location',
        'ORG': 'organization',
        'FAC': 'location',  # Facility
        'PRODUCT': 'item',
        'EVENT': 'concept',
        'WORK_OF_ART': 'concept'
    }
    
    for ent in doc.ents:
        entity_type = type_mapping.get(ent.label_, 'concept')
        
        # Skip if not a relevant entity type
        if entity_type not in ['character', 'location', 'organization', 'item', 'concept']:
            continue
        
        # Check if entity already exists
        existing_entity = db.query(models.Entity).filter(
            models.Entity.project_id == chapter.project_id,
            models.Entity.name == ent.text
        ).first()
        
        if not existing_entity:
            existing_entity = models.Entity(
                project_id=chapter.project_id,
                name=ent.text,
                entity_type=entity_type
            )
            db.add(existing_entity)
            db.commit()
            db.refresh(existing_entity)
            
        # Create mention with context
        context_start = max(0, ent.start_char - 50)
        context_end = min(len(chapter.content), ent.end_char + 50)
        context = chapter.content[context_start:context_end]
        
        mention = models.EntityMention(
            entity_id=existing_entity.id,
            chapter_id=chapter.id,
            start_pos=ent.start_char,
            end_pos=ent.end_char,
            context=context,
            mentioned_as=ent.text
        )
        db.add(mention)
    
    db.commit()