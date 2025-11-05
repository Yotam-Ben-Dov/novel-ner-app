from typing import Dict, List
from sqlalchemy.orm import Session
from pathlib import Path
from .. import models
import os

# Modern imports - all current as of 2024
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_anthropic import ChatAnthropic
from langchain_voyageai import VoyageAIEmbeddings
from langchain_chroma import Chroma  # Modern Chroma import
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate, PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough, RunnableParallel

class StoryAssistant:
    """RAG-based assistant using Claude + Voyage AI with modern langchain"""
    
    def __init__(self, anthropic_api_key: str, voyage_api_key: str, project_id: int):
        self.project_id = project_id
        
        # Voyage AI for embeddings
        self.embeddings = VoyageAIEmbeddings(
            voyage_api_key=voyage_api_key,
            model="voyage-2",
            batch_size=8  # Optimize batch processing
        )
        
        # Claude for LLM
        self.llm = ChatAnthropic(
            model="claude-3-5-haiku-20241022",  # Latest Haiku model
            anthropic_api_key=anthropic_api_key,
            temperature=0.3,
            max_tokens=4096  # Increased for longer responses
        )
        
        # Persistent directory for this project
        self.persist_dir = Path("./vector_db") / f"project_{project_id}"
        self.persist_dir.mkdir(parents=True, exist_ok=True)
        
        self.vectorstore = None
    
    def build_knowledge_base(self, db: Session, project_id: int, force_rebuild: bool = False):
        """Build vector database from all chapters and entities"""
        
        # Check if we already have a persisted vector store
        if not force_rebuild and (self.persist_dir / "chroma.sqlite3").exists():
            print(f"✓ Loading existing knowledge base for project {project_id}", flush=True)
            try:
                self.vectorstore = Chroma(
                    persist_directory=str(self.persist_dir),
                    embedding_function=self.embeddings
                )
                return 0  # Already loaded
            except Exception as e:
                print(f"⚠ Could not load existing KB: {e}. Rebuilding...", flush=True)
                force_rebuild = True
        
        print(f"🔨 Building new knowledge base for project {project_id}...", flush=True)
        
        # Get all chapters
        chapters = db.query(models.Chapter).filter(
            models.Chapter.project_id == project_id
        ).order_by(models.Chapter.chapter_number).all()
        
        # Get all entities
        entities = db.query(models.Entity).filter(
            models.Entity.project_id == project_id
        ).all()
        
        if not chapters:
            print(f"⚠ No chapters found for project {project_id}", flush=True)
            return 0
        
        documents = []
        
        # Add chapter content
        for chapter in chapters:
            doc = Document(
                page_content=chapter.content,
                metadata={
                    'type': 'chapter',
                    'chapter_number': chapter.chapter_number,
                    'chapter_title': chapter.title or f"Chapter {chapter.chapter_number}",
                    'chapter_id': chapter.id,
                    'source': f"Chapter {chapter.chapter_number}"
                }
            )
            documents.append(doc)
            
            # Also add chapter notes if they exist
            if chapter.notes:
                doc_notes = Document(
                    page_content=f"Author's notes for Chapter {chapter.chapter_number}: {chapter.notes}",
                    metadata={
                        'type': 'notes',
                        'chapter_number': chapter.chapter_number,
                        'chapter_id': chapter.id,
                        'source': f"Notes for Chapter {chapter.chapter_number}"
                    }
                )
                documents.append(doc_notes)
        
        # Add entity information
        for entity in entities:
            entity_text = f"{entity.name} ({entity.entity_type})"
            if entity.description:
                entity_text += f": {entity.description}"
            if entity.aliases:
                entity_text += f". Also known as: {', '.join(entity.aliases)}"
            
            # Get mention count
            mention_count = len(entity.mentions)
            entity_text += f". Appears {mention_count} times in the story."
            
            doc = Document(
                page_content=entity_text,
                metadata={
                    'type': 'entity',
                    'entity_type': entity.entity_type,
                    'entity_name': entity.name,
                    'entity_id': entity.id,
                    'source': f"Entity: {entity.name}"
                }
            )
            documents.append(doc)
        
        # Split documents into chunks (optimized chunk size for Voyage)
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=800,  # Optimized for Voyage-2
            chunk_overlap=200,
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""]
        )
        splits = text_splitter.split_documents(documents)
        
        print(f"   Creating {len(splits)} embeddings...", flush=True)
        
        # Create vector store with persistence (modern API)
        self.vectorstore = Chroma.from_documents(
            documents=splits,
            embedding=self.embeddings,
            persist_directory=str(self.persist_dir),
            collection_name=f"project_{project_id}"
        )
        
        print(f"✓ Knowledge base built: {len(splits)} chunks", flush=True)
        return len(splits)
    
    def ask(self, question: str, project_title: str) -> Dict[str, any]:
        """Ask a question about the story using modern LCEL chain"""
        if not self.vectorstore:
            raise ValueError("Knowledge base not built. Call build_knowledge_base first.")
        
        # Modern prompt template
        template = """You are Claude, an AI assistant helping an author understand their story "{project_title}". 

Based on the following context from the story, please answer the question thoughtfully and specifically.

Key guidelines:
- Reference specific chapter numbers when possible
- Quote relevant passages if helpful
- If the answer isn't in the context, say so honestly
- Be concise but thorough

Context from the story:
{context}

Question: {question}

Answer:"""
        
        prompt = PromptTemplate(
            template=template,
            input_variables=["context", "question", "project_title"]
        )
        
        # Create retriever with MMR (Maximum Marginal Relevance) for diversity
        retriever = self.vectorstore.as_retriever(
            search_type="mmr",  # Better diversity than pure similarity
            search_kwargs={
                "k": 6,  # Retrieve more documents
                "fetch_k": 20,  # Consider more candidates
                "lambda_mult": 0.7  # Balance relevance vs diversity
            }
        )
        
        # Format documents helper
        def format_docs(docs):
            formatted = []
            for i, doc in enumerate(docs, 1):
                source = doc.metadata.get('source', 'Unknown')
                formatted.append(f"[Source {i}: {source}]\n{doc.page_content}")
            return "\n\n".join(formatted)
        
        # Modern LCEL chain with parallel execution
        rag_chain = (
            RunnableParallel(
                {
                    "context": retriever | format_docs,
                    "question": RunnablePassthrough(),
                    "project_title": lambda x: project_title
                }
            )
            | prompt
            | self.llm
            | StrOutputParser()
        )
        
        # Get answer
        try:
            answer = rag_chain.invoke(question)
        except Exception as e:
            print(f"Error in RAG chain: {e}", flush=True)
            raise
        
        # Get source documents for citation
        source_docs = retriever.invoke(question)
        
        sources = []
        seen_sources = set()
        
        for doc in source_docs[:4]:  # Limit to top 4 unique sources
            source_key = (
                doc.metadata.get('type'),
                doc.metadata.get('chapter_number'),
                doc.metadata.get('entity_name')
            )
            
            if source_key in seen_sources:
                continue
            seen_sources.add(source_key)
            
            source_info = {
                'type': doc.metadata.get('type'),
                'content_preview': doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content
            }
            
            if doc.metadata.get('type') == 'chapter':
                source_info['chapter_number'] = doc.metadata.get('chapter_number')
                source_info['chapter_title'] = doc.metadata.get('chapter_title')
            elif doc.metadata.get('type') == 'entity':
                source_info['entity_name'] = doc.metadata.get('entity_name')
                source_info['entity_type'] = doc.metadata.get('entity_type')
            
            sources.append(source_info)
        
        return {
            'answer': answer,
            'sources': sources
        }
    
    def get_statistics(self) -> Dict[str, any]:
        """Get statistics about the knowledge base"""
        if not self.vectorstore:
            return {"status": "not_built"}
        
        try:
            collection = self.vectorstore._collection
            count = collection.count()
            
            return {
                "status": "ready",
                "document_count": count,
                "project_id": self.project_id
            }
        except Exception as e:
            return {"status": "error", "error": str(e)}

# Global cache of assistants (one per project)
_assistant_cache: Dict[int, StoryAssistant] = {}

def get_assistant(project_id: int, db: Session, rebuild: bool = False) -> StoryAssistant:
    """Get or create assistant for a project"""
    anthropic_key = os.getenv("ANTHROPIC_API_KEY")
    voyage_key = os.getenv("VOYAGE_API_KEY")
    
    if not anthropic_key:
        raise ValueError("ANTHROPIC_API_KEY not set in environment. Get one at https://console.anthropic.com/")
    if not voyage_key:
        raise ValueError("VOYAGE_API_KEY not set in environment. Get one at https://dash.voyageai.com/")
    
    if rebuild or project_id not in _assistant_cache:
        assistant = StoryAssistant(
            anthropic_api_key=anthropic_key,
            voyage_api_key=voyage_key,
            project_id=project_id
        )
        chunks = assistant.build_knowledge_base(db, project_id, force_rebuild=rebuild)
        _assistant_cache[project_id] = assistant
        if chunks > 0:
            print(f"✓ Built knowledge base for project {project_id}: {chunks} chunks", flush=True)
        else:
            print(f"✓ Loaded existing knowledge base for project {project_id}", flush=True)
    
    return _assistant_cache[project_id]

def clear_cache(project_id: int = None):
    """Clear assistant cache (useful for memory management)"""
    global _assistant_cache
    if project_id:
        _assistant_cache.pop(project_id, None)
    else:
        _assistant_cache.clear()