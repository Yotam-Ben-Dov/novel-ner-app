import spacy
from sqlalchemy.orm import Session
from .. import models
from ..database import SessionLocal  # Add this import

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

def process_chapter_ner(chapter_id: int, language: str):
    """Extract entities from chapter and create Entity + EntityMention records"""
    # Create a new database session for this background task
    db = SessionLocal()
    try:
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
        
        entities_created = 0
        mentions_created = 0
        
        for ent in doc.ents:
            entity_type = type_mapping.get(ent.label_, 'concept')
            
            # Skip if not a relevant entity type
            if entity_type not in ['character', 'location', 'organization', 'item', 'concept']:
                continue
            
            # Check if entity already exists (case-insensitive)
            existing_entity = db.query(models.Entity).filter(
                models.Entity.project_id == chapter.project_id,
                models.Entity.name.ilike(ent.text)  # Case-insensitive match
            ).first()
            
            if not existing_entity:
                existing_entity = models.Entity(
                    project_id=chapter.project_id,
                    name=ent.text,
                    entity_type=entity_type
                )
                db.add(existing_entity)
                db.flush()  # Get the ID without committing
                entities_created += 1
            
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
            mentions_created += 1
        
        db.commit()
        print(f"✅ NER completed for chapter {chapter_id}: {entities_created} entities, {mentions_created} mentions")
        
    except Exception as e:
        print(f"❌ NER error for chapter {chapter_id}: {str(e)}")
        db.rollback()
    finally:
        db.close()