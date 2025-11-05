import spacy
from sqlalchemy.orm import Session
from .. import models
from ..database import SessionLocal
from .entity_resolver import EntityResolver

nlp_en = None

def get_nlp():
    global nlp_en
    if nlp_en is None:
        print("🔄 Loading spaCy model...", flush=True)
        try:
            nlp_en = spacy.load("en_core_web_trf")
            print("✓ Loaded en_core_web_trf model", flush=True)
        except:
            try:
                nlp_en = spacy.load("en_core_web_sm")
                print("✓ Loaded en_core_web_sm model", flush=True)
            except Exception as e:
                print(f"✗ Failed to load spaCy model: {e}", flush=True)
                raise
    return nlp_en

def process_chapter_ner(chapter_id: int, language: str):
    """Extract entities from chapter and create Entity + EntityMention records"""
    db = SessionLocal()
    
    try:
        chapter = db.query(models.Chapter).filter(models.Chapter.id == chapter_id).first()
        if not chapter:
            print(f"✗ Chapter {chapter_id} not found in database", flush=True)
            return
        
        print(f"\n{'='*60}", flush=True)
        print(f"🚀 NER PROCESSING: Chapter {chapter.chapter_number}", flush=True)
        print(f"{'='*60}\n", flush=True)
        
        # Clear existing mentions for this chapter
        deleted_count = db.query(models.EntityMention).filter(
            models.EntityMention.chapter_id == chapter_id
        ).delete()
        db.commit()
        print(f"✓ Cleared {deleted_count} existing mentions", flush=True)
        
        nlp = get_nlp()
        doc = nlp(chapter.content)
        
        # Entity type mapping
        type_mapping = {
            'PERSON': 'character',
            'GPE': 'location',
            'LOC': 'location',
            'ORG': 'organization',
            'FAC': 'location',
            'PRODUCT': 'item',
            'EVENT': 'concept',
            'WORK_OF_ART': 'concept',
            'NORP': 'concept',
        }
        
        entities_created = 0
        entities_reused = 0
        mentions_created = 0
        
        for ent in doc.ents:
            entity_type = type_mapping.get(ent.label_, None)
            if not entity_type:
                continue
            
            # Normalize the entity name
            normalized_name = EntityResolver.normalize_name(ent.text)
            
            # Skip very short names (likely noise)
            if len(normalized_name) < 2:
                continue
            
            # Find similar existing entities
            similar = EntityResolver.find_similar_entities(
                db, chapter.project_id, normalized_name, entity_type, threshold=0.85
            )
            
            if similar and similar[0][1] >= 0.85:  # High confidence match
                existing_entity = similar[0][0]
                entities_reused += 1
                print(f"   ↻ Matched '{ent.text}' → '{existing_entity.name}' ({similar[0][1]:.2f})", flush=True)
            else:
                # Create new entity with normalized name
                existing_entity = models.Entity(
                    project_id=chapter.project_id,
                    name=normalized_name,
                    entity_type=entity_type,
                    aliases=[ent.text] if ent.text != normalized_name else []
                )
                db.add(existing_entity)
                db.commit()
                db.refresh(existing_entity)
                entities_created += 1
                print(f"   ✓ Created: {normalized_name} ({entity_type})", flush=True)
            
            # Create mention
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
        
        print(f"\n{'='*60}", flush=True)
        print(f"✅ COMPLETE: {entities_created} new, {entities_reused} matched, {mentions_created} mentions", flush=True)
        print(f"{'='*60}\n", flush=True)
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}\n", flush=True)
        db.rollback()
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()