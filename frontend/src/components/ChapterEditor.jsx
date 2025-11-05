import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useState, useEffect } from 'react';
import EntitySidebar from './EntitySidebar';
import AIAssistant from './AIAssistant';
import RichTextEditor from './RichTextEditor';
import VersionHistory from './VersionHistory';

export default function ChapterEditor() {
  const { projectId } = useParams();
  const queryClient = useQueryClient();
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [content, setContent] = useState('');
  const [notes, setNotes] = useState('');
  const [showNewChapter, setShowNewChapter] = useState(false);
  const [newChapter, setNewChapter] = useState({
    chapter_number: 1,
    title: '',
    content: ''
  });

  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const res = await api.getProject(projectId);
      return res.data;
    }
  });

  const { data: chapters } = useQuery({
    queryKey: ['chapters', projectId],
    queryFn: async () => {
      const res = await api.getChapters(projectId);
      return res.data;
    }
  });

  const { data: chapterDetail } = useQuery({
    queryKey: ['chapter', selectedChapter],
    queryFn: async () => {
      const res = await api.getChapter(selectedChapter);
      return res.data;
    },
    enabled: !!selectedChapter
  });

  // Update local state when chapter loads
  useEffect(() => {
    if (chapterDetail) {
      setContent(chapterDetail.content || '');
      setNotes(chapterDetail.notes || '');
    }
  }, [chapterDetail]);

  const createChapterMutation = useMutation({
    mutationFn: (data) => api.createChapter(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['chapters', projectId]);
      setShowNewChapter(false);
      setNewChapter({ chapter_number: (chapters?.length || 0) + 1, title: '', content: '' });
    }
  });

  const updateChapterMutation = useMutation({
    mutationFn: ({ chapterId, data }) => api.updateChapter(chapterId, data),
    onSuccess: async () => {
      queryClient.invalidateQueries(['chapter', selectedChapter]);
      queryClient.invalidateQueries(['chapters', projectId]);

    }
  });

  const deleteChapterMutation = useMutation({
    mutationFn: api.deleteChapter,
    onSuccess: () => {
      queryClient.invalidateQueries(['chapters', projectId]);
      setSelectedChapter(null);
    }
  });

  const handleSave = () => {
    if (selectedChapter) {
      updateChapterMutation.mutate({
        chapterId: selectedChapter,
        data: { content, notes }
      });
    }
  };

  const handleCreateChapter = (e) => {
    e.preventDefault();
    createChapterMutation.mutate(newChapter);
  };

  const handleDeleteChapter = () => {
    if (window.confirm('Delete this chapter? This cannot be undone.')) {
      deleteChapterMutation.mutate(selectedChapter);
    }
  };

  useEffect(() => {
    if (newChapter.chapter_number === 1 && chapters?.length > 0) {
      setNewChapter({ ...newChapter, chapter_number: chapters.length + 1 });
    }
  }, [chapters]);

  return (
    <div style={{ display: 'flex', height: '90vh', gap: '10px' }}>
      {/* Left sidebar - Chapter list */}
      <div style={{ 
        width: '250px', 
        borderRight: '1px solid #ccc', 
        padding: '15px', 
        overflowY: 'auto',
        backgroundColor: '#f9f9f9'
      }}>
        <h3 style={{ marginTop: 0 }}>{project?.title}</h3>
        <button 
          onClick={() => setShowNewChapter(!showNewChapter)} 
          style={{ 
            width: '100%', 
            marginBottom: '15px', 
            padding: '10px',
            cursor: 'pointer',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px'
          }}
        >
          {showNewChapter ? 'Cancel' : '+ Add Chapter'}
        </button>

        {showNewChapter && (
          <form onSubmit={handleCreateChapter} style={{ marginBottom: '20px', padding: '10px', backgroundColor: 'white', borderRadius: '4px' }}>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Chapter #</label>
              <input
                type="number"
                value={newChapter.chapter_number}
                onChange={(e) => setNewChapter({ ...newChapter, chapter_number: parseInt(e.target.value) })}
                style={{ width: '100%', padding: '6px', marginTop: '4px' }}
              />
            </div>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Title</label>
              <input
                type="text"
                value={newChapter.title}
                onChange={(e) => setNewChapter({ ...newChapter, title: e.target.value })}
                style={{ width: '100%', padding: '6px', marginTop: '4px' }}
                placeholder="Optional"
              />
            </div>
            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold' }}>Content *</label>
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="Write or paste your chapter content here..."
              />
            </div>
            <button type="submit" style={{ width: '100%', padding: '8px', cursor: 'pointer' }}>
              Create Chapter
            </button>
          </form>
        )}

        <div style={{ fontSize: '14px' }}>
          {chapters?.length === 0 && (
            <p style={{ color: '#666', textAlign: 'center' }}>No chapters yet</p>
          )}
          {chapters?.map((chapter) => (
            <div
              key={chapter.id}
              onClick={() => setSelectedChapter(chapter.id)}
              style={{
                padding: '12px',
                margin: '8px 0',
                backgroundColor: selectedChapter === chapter.id ? '#2196F3' : 'white',
                color: selectedChapter === chapter.id ? 'white' : 'black',
                cursor: 'pointer',
                border: '1px solid #ddd',
                borderRadius: '4px',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ fontWeight: 'bold' }}>Chapter {chapter.chapter_number}</div>
              {chapter.title && <div style={{ fontSize: '12px', marginTop: '4px' }}>{chapter.title}</div>}
              <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.8 }}>
                {chapter.word_count} words
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Center - Editor */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '15px', overflowY: 'auto' }}>
        {chapterDetail ? (
          <>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '15px',
              paddingBottom: '15px',
              borderBottom: '2px solid #eee'
            }}>
              <div>
                <h2 style={{ margin: 0 }}>
                  Chapter {chapterDetail.chapter_number}
                  {chapterDetail.title && `: ${chapterDetail.title}`}
                </h2>
                <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
                  {chapterDetail.word_count} words • Last updated: {new Date(chapterDetail.updated_at).toLocaleDateString()}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <VersionHistory chapterId={selectedChapter}/>
                <button 
                  onClick={handleSave} 
                  disabled={updateChapterMutation.isLoading}
                  style={{ 
                    padding: '10px 20px', 
                    cursor: 'pointer',
                    backgroundColor: '#4CAF50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px'
                  }}
                >
                  {updateChapterMutation.isLoading ? 'Saving...' : '💾 Save'}
                </button>
                <button
                  onClick={handleDeleteChapter}
                  style={{
                    padding: '10px 20px',
                    cursor: 'pointer',
                    backgroundColor: '#f44336',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px'
                  }}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontWeight: 'bold', marginBottom: '8px' }}>Content</label>
              <RichTextEditor
                content={content}
                onChange={setContent}
                placeholder="Write or paste your chapter content here..."
              />
              
              <label style={{ fontWeight: 'bold', marginBottom: '8px' }}>Notes (optional)</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this chapter (plot points, character development, etc.)"
                style={{
                  height: '100px',
                  padding: '10px',
                  fontFamily: 'monospace',
                  fontSize: '14px',
                  resize: 'none',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: '#fffef0'
                }}
              />
            </div>
          </>
        ) : (
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            height: '100%',
            color: '#999',
            fontSize: '18px'
          }}>
            ← Select a chapter to begin, or create a new one
          </div>
        )}
      </div>

      {/* Right sidebar - Entities */}
      {selectedChapter && (
        <EntitySidebar projectId={projectId} chapterId={selectedChapter} />
      )}
      {/* AI Assistant - floating button */}
        <AIAssistant projectId={projectId} />
    </div>
  );
}