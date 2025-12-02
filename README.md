# 📚 Novel NER Workbench

A powerful web-based application for writers and readers to analyze novels and webnovels using Named Entity Recognition (NER) and AI-powered insights. Track characters, locations, organizations, and their interactions throughout complex stories with AI assistance from Claude.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Python](https://img.shields.io/badge/python-3.11-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115.0-green)
![React](https://img.shields.io/badge/React-18.x-blue)
![License](https://img.shields.io/badge/license-MIT-green)

## ✨ Features

### 📝 **Novel Management**
- Create and manage multiple novel projects
- Organize content by chapters
- Track word counts automatically
- Add personal notes for each chapter
- Rich text editing with formatting support

### 🤖 **AI-Powered Assistant**
- Ask questions about your story using Claude 3.5
- Get insights on characters, plot, and themes
- Context-aware responses with chapter citations
- Powered by Anthropic's Claude and Voyage AI embeddings

### 🏷️ **Named Entity Recognition**
- Automatic entity extraction using spaCy
- Track characters, locations, organizations, items, and concepts
- Smart entity normalization (handles possessives, articles, etc.)
- Duplicate entity detection and merging
- Entity relationship tracking

### 📊 **Analytics & Tracking**
- Entity mention frequency across chapters
- First and last appearance tracking
- Context preview for each mention
- Chapter-by-chapter entity presence
- Export capabilities

### 🕐 **Version Control**
- Automatic chapter versioning
- Restore previous versions
- Track changes over time
- Compare versions side-by-side

## 🛠️ Tech Stack

### **Backend**
- **FastAPI** - Modern Python web framework
- **PostgreSQL** - Relational database
- **SQLAlchemy** - ORM for database operations
- **spaCy** - NER and NLP processing
- **Langchain** - AI orchestration framework
- **Claude 3.5 Haiku** - LLM for AI assistant
- **Voyage AI** - Embeddings for semantic search
- **Chroma** - Vector database for RAG

### **Frontend**
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **TanStack Query** - Data fetching and caching
- **Axios** - HTTP client
- **TipTap** - Rich text editor

## 📋 Prerequisites

- **Python 3.11+** (Windows Store version or standard installation)
- **Node.js 18+** and npm
- **PostgreSQL 14+**
- **Git** (for version control)

### **API Keys Required**
- **Anthropic API Key** - Get from [console.anthropic.com](https://console.anthropic.com/settings/keys)
- **Voyage AI API Key** - Get from [dash.voyageai.com](https://dash.voyageai.com/)

## 🚀 Installation

### **1. Clone the Repository**

```bash
git clone https://github.com/yourusername/novel-ner-app.git
cd novel-ner-app
```

### **2. Backend Setup**

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows PowerShell:
.\venv\Scripts\activate
# Windows CMD:
venv\Scripts\activate.bat
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Download spaCy English model
python -m spacy download en_core_web_sm

# Optional: Install sentence-transformers for local embeddings
pip install sentence-transformers
```

### **3. Database Setup**

```bash
# Start PostgreSQL service (Windows)
Start-Service postgresql-x64-15

# Create database
psql -U postgres
CREATE DATABASE novel_ner_db;
\q
```

### **4. Environment Configuration**

Create `backend/.env`:

```env
# Database
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/novel_ner_db

# AI APIs
ANTHROPIC_API_KEY=sk-ant-api03-YOUR-ANTHROPIC-KEY-HERE
VOYAGE_API_KEY=pa-YOUR-VOYAGE-KEY-HERE

# Optional: For fallback embeddings
OPENAI_API_KEY=sk-YOUR-OPENAI-KEY-HERE
```

### **5. Frontend Setup**

```bash
cd ../frontend

# Install dependencies
npm install

# Install additional packages
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-placeholder
```

## 🎮 Running the Application

### **Start Backend Server**

```bash
cd backend
.\venv\Scripts\activate  # If not already activated
uvicorn app.main:app --reload
```

Backend will run on: **http://localhost:8000**

### **Start Frontend Server**

```bash
cd frontend
npm run dev
```

Frontend will run on: **http://localhost:3000**

### **Access the Application**

Open your browser and navigate to: **http://localhost:3000**

## 📁 Project Structure

```
novel-ner-app/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py                 # FastAPI application entry
│   │   ├── database.py             # Database configuration
│   │   ├── models.py               # SQLAlchemy models
│   │   ├── schemas.py              # Pydantic schemas
│   │   ├── routers/
│   │   │   ├── projects.py         # Project endpoints
│   │   │   ├── chapters.py         # Chapter endpoints
│   │   │   ├── entities.py         # Entity endpoints
│   │   │   └── assistant.py        # AI assistant endpoints
│   │   └── services/
│   │       ├── ner_service.py      # NER processing
│   │       ├── entity_resolver.py  # Entity normalization
│   │       └── ai_assistant.py     # AI/RAG implementation
│   ├── venv/                       # Virtual environment
│   ├── requirements.txt            # Python dependencies
│   └── .env                        # Environment variables
│
└── frontend/
    ├── src/
    │   ├── main.jsx                # React entry point
    │   ├── App.jsx                 # Main app component
    │   ├── components/
    │   │   ├── ProjectList.jsx     # Project management
    │   │   ├── ChapterEditor.jsx   # Chapter editing interface
    │   │   ├── EntitySidebar.jsx   # Entity browser
    │   │   ├── AIAssistant.jsx     # AI chat interface
    │   │   ├── VersionHistory.jsx  # Version control
    │   │   ├── RichTextEditor.jsx  # TipTap editor wrapper
    │   │   └── EntityManagement.jsx # Entity merging
    │   └── services/
    │       └── api.js              # API client
    ├── package.json                # Node dependencies
    ├── vite.config.js              # Vite configuration
    └── index.html                  # HTML template
```

## 🔌 API Documentation

### **Base URL:** `http://localhost:8000/api`

### **Projects**
- `GET /projects/` - List all projects
- `POST /projects/` - Create new project
- `GET /projects/{id}` - Get project details
- `DELETE /projects/{id}` - Delete project

### **Chapters**
- `GET /chapters/{project_id}` - List chapters in project
- `POST /chapters/{project_id}` - Create new chapter
- `GET /chapters/single/{chapter_id}` - Get chapter details
- `PUT /chapters/{chapter_id}` - Update chapter
- `DELETE /chapters/{chapter_id}` - Delete chapter
- `GET /chapters/{chapter_id}/versions` - Get version history
- `POST /chapters/{chapter_id}/create-version` - Save version
- `POST /chapters/{chapter_id}/restore-version/{version_id}` - Restore version

### **Entities**
- `GET /entities/{project_id}` - List entities (with optional type filter)
- `GET /entities/{entity_id}/mentions` - Get entity mentions
- `PUT /entities/{entity_id}` - Update entity
- `DELETE /entities/{entity_id}` - Delete entity
- `GET /entities/duplicates/{project_id}` - Find duplicate entities
- `POST /entities/merge` - Merge entities

### **AI Assistant**
- `POST /assistant/{project_id}/ask` - Ask question about story
- `POST /assistant/{project_id}/rebuild-kb` - Rebuild knowledge base

### **Health Check**
- `GET /health` - Check API health status

## 💡 Usage Guide

### **Creating Your First Project**

1. Click "**+ New Project**" on the home screen
2. Enter project title and description
3. Choose whether it's your own writing or something you're reading
4. Click "**Create Project**"

### **Adding Chapters**

1. Open a project
2. Click "**+ Add Chapter**" in the left sidebar
3. Enter chapter number, title (optional), and content
4. Click "**Create Chapter**"
5. NER processing runs automatically in the background

### **Using the AI Assistant**

1. Click the **🤖 button** in the bottom-right corner
2. Ask questions like:
   - "Who are the main characters?"
   - "What happened in chapter 3?"
   - "Describe the relationship between [Character A] and [Character B]"
   - "Are there any plot holes?"
3. Claude will respond with context from your chapters

### **Managing Entities**

1. View detected entities in the **right sidebar**
2. Filter by type: Characters, Locations, Organizations, etc.
3. Click an entity to see:
   - All mentions across chapters
   - Context for each mention
   - First/last appearance
4. Edit entity details:
   - Update name, type, or description
   - Add aliases
5. Merge duplicate entities if detected

### **Version Control**

1. Click "**📜 History**" button while editing a chapter
2. Click "**💾 Save New Version**" to create a snapshot
3. Browse previous versions and click to view
4. Click "**↶ Restore This Version**" to revert changes

### **Rich Text Formatting**

Use the toolbar to format your text:
- **Bold**, *Italic*, ~~Strikethrough~~
- Headings (H1, H2, H3)
- Bullet lists and numbered lists
- Block quotes
- Horizontal rules
- Undo/Redo

## ⚙️ Configuration

### **spaCy Models**

The app uses `en_core_web_sm` by default. For better accuracy:

```bash
# Install larger model
python -m spacy download en_core_web_lg

# Or use transformer model (requires GPU)
python -m spacy download en_core_web_trf
```

Update `ner_service.py` to use the new model.

### **Claude Model Selection**

In `ai_assistant.py`, change the model:

```python
self.llm = ChatAnthropic(
    # model="claude-3-5-haiku-20241022",  # Fastest, cheapest
    model="claude-3-5-sonnet-20241022",   # Best balance
    # model="claude-3-opus-20240229",     # Highest quality
    ...
)
```

### **Voyage Embeddings**

Choose embedding model based on your needs:

```python
self.embeddings = VoyageAIEmbeddings(
    voyage_api_key=voyage_api_key,
    model="voyage-2"          # General purpose (1024 dims)
    # model="voyage-large-2"  # Higher quality (1536 dims)
    # model="voyage-code-2"   # For technical content
)
```

### **Database Connection Pooling**

For production, configure connection pooling in `database.py`:

```python
engine = create_engine(
    DATABASE_URL,
    pool_size=10,           # Max connections
    max_overflow=20,        # Extra connections
    pool_pre_ping=True,     # Verify connections
    pool_recycle=3600       # Recycle after 1 hour
)
```

## 🐛 Troubleshooting

### **Backend won't start**

```bash
# Check if PostgreSQL is running
Get-Service postgresql*

# Verify database exists
psql -U postgres -l

# Check Python version
python --version  # Should be 3.11+

# Reinstall dependencies
pip install --force-reinstall -r requirements.txt
```

### **NER not detecting entities**

- Check backend console for error messages
- Verify spaCy model is installed: `python -m spacy validate`
- Try with sample text: "Harry
