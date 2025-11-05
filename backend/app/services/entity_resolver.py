import re
from sqlalchemy.orm import Session
from sqlalchemy import func
from .. import models

class EntityResolver:
    """Resolve and merge similar entities"""
    
    @staticmethod
    def normalize_name(name: str) -> str:
        """Remove possessives, extra spaces, etc."""
        # Remove possessive 's
        name = re.sub(r"'s$", "", name)
        name = re.sub(r"'s$", "", name)  # Also handle curly apostrophe
        
        # Remove articles at the start
        name = re.sub(r"^(the|a|an)\s+", "", name, flags=re.IGNORECASE)
        
        # Normalize spaces
        name = " ".join(name.split())
        
        # Capitalize properly (Title Case for names)
        name = name.title()
        
        return name.strip()
    
    @staticmethod
    def find_similar_entities(db: Session, project_id: int, name: str, entity_type: str, threshold: float = 0.8):
        """Find entities that might be the same person/place"""
        from difflib import SequenceMatcher
        
        normalized = EntityResolver.normalize_name(name)
        
        # Get all entities of same type in project
        existing = db.query(models.Entity).filter(
            models.Entity.project_id == project_id,
            models.Entity.entity_type == entity_type
        ).all()
        
        similar = []
        for entity in existing:
            entity_normalized = EntityResolver.normalize_name(entity.name)
            
            # Check normalized name match
            if entity_normalized.lower() == normalized.lower():
                similar.append((entity, 1.0))
                continue
            
            # Check if one is substring of other (e.g., "Harry" vs "Harry Potter")
            if normalized.lower() in entity_normalized.lower() or entity_normalized.lower() in normalized.lower():
                similar.append((entity, 0.9))
                continue
            
            # Check fuzzy similarity
            ratio = SequenceMatcher(None, normalized.lower(), entity_normalized.lower()).ratio()
            if ratio >= threshold:
                similar.append((entity, ratio))
        
        return sorted(similar, key=lambda x: x[1], reverse=True)
    
    @staticmethod
    def merge_entities(db: Session, keep_entity_id: int, merge_entity_ids: list):
        """Merge multiple entities into one"""
        # Update all mentions to point to the kept entity
        for entity_id in merge_entity_ids:
            db.query(models.EntityMention).filter(
                models.EntityMention.entity_id == entity_id
            ).update({'entity_id': keep_entity_id})
            
            # Get the entity to merge
            merge_entity = db.query(models.Entity).filter(models.Entity.id == entity_id).first()
            if merge_entity:
                # Add aliases from merged entity
                keep_entity = db.query(models.Entity).filter(models.Entity.id == keep_entity_id).first()
                if keep_entity:
                    existing_aliases = set(keep_entity.aliases or [])
                    existing_aliases.add(merge_entity.name)
                    existing_aliases.update(merge_entity.aliases or [])
                    keep_entity.aliases = list(existing_aliases)
                
                # Delete the merged entity
                db.delete(merge_entity)
        
        db.commit()