from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text, nullable=True)
    is_own_writing = Column(Boolean, default=True)  # True = writing, False = reading
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    chapters = relationship("Chapter", back_populates="project", cascade="all, delete-orphan")
    entities = relationship("Entity", back_populates="project", cascade="all, delete-orphan")

class ChapterVersion(Base):
    __tablename__ = "chapter_versions"
    
    id = Column(Integer, primary_key=True, index=True)
    chapter_id = Column(Integer, ForeignKey("chapters.id"))
    version_number = Column(Integer)
    content = Column(Text)
    notes = Column(Text, nullable=True)
    word_count = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    created_by = Column(String, nullable=True)  # Future: user system
    change_summary = Column(String, nullable=True)  # "Added scene with Dumbledore"
    
    chapter = relationship("Chapter", back_populates="versions")


class Chapter(Base):
    __tablename__ = "chapters"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    chapter_number = Column(Integer)
    title = Column(String, nullable=True)
    content = Column(Text)  # Changed from original_text
    notes = Column(Text, nullable=True)  # For your writing notes
    word_count = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    versions = relationship("ChapterVersion", back_populates="chapter", cascade="all, delete-orphan")
    
    project = relationship("Project", back_populates="chapters")
    entity_mentions = relationship("EntityMention", back_populates="chapter", cascade="all, delete-orphan")

class Entity(Base):
    __tablename__ = "entities"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"))
    name = Column(String, index=True)
    entity_type = Column(String)  # 'character', 'location', 'organization', 'item', 'concept'
    description = Column(Text, nullable=True)  # Character background, location details, etc.
    aliases = Column(JSON, default=[])  # Alternative names ["John", "Johnny", "Mr. Smith"]
    extra_data = Column(JSON, default={})  # Flexible field for custom attributes
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    project = relationship("Project", back_populates="entities")
    mentions = relationship("EntityMention", back_populates="entity", cascade="all, delete-orphan")

class EntityMention(Base):
    __tablename__ = "entity_mentions"
    
    id = Column(Integer, primary_key=True, index=True)
    entity_id = Column(Integer, ForeignKey("entities.id"))
    chapter_id = Column(Integer, ForeignKey("chapters.id"))
    start_pos = Column(Integer)
    end_pos = Column(Integer)
    context = Column(Text)  # Surrounding text
    mentioned_as = Column(String)  # The exact text used
    
    entity = relationship("Entity", back_populates="mentions")
    chapter = relationship("Chapter", back_populates="entity_mentions")