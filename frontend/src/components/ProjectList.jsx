import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

export default function ProjectList() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    is_own_writing: true
  });

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await api.getProjects();
      return res.data;
    }
  });

  const createMutation = useMutation({
    mutationFn: api.createProject,
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
      setShowForm(false);
      setFormData({ title: '', description: '', is_own_writing: true });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteProject,
    onSuccess: () => {
      queryClient.invalidateQueries(['projects']);
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleDelete = (e, projectId) => {
    e.stopPropagation();
    if (window.confirm('Delete this project? This cannot be undone.')) {
      deleteMutation.mutate(projectId);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2>My Projects</h2>
        <button onClick={() => setShowForm(!showForm)} style={{ padding: '10px 20px', cursor: 'pointer' }}>
          {showForm ? 'Cancel' : '+ New Project'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} style={{ 
          margin: '20px 0', 
          padding: '20px', 
          border: '1px solid #ccc',
          borderRadius: '8px',
          backgroundColor: '#f9f9f9'
        }}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              style={{ width: '100%', padding: '8px' }}
              placeholder="e.g., My Fantasy Novel"
              required
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{ width: '100%', padding: '8px', minHeight: '80px' }}
              placeholder="Brief description of your project..."
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                checked={formData.is_own_writing}
                onChange={(e) => setFormData({ ...formData, is_own_writing: e.target.checked })}
              />
              <span>This is my own writing (uncheck if analyzing/reading someone else's work)</span>
            </label>
          </div>
          <button type="submit" style={{ padding: '10px 20px', cursor: 'pointer' }}>
            Create Project
          </button>
        </form>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px', marginTop: '20px' }}>
        {projects?.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#666' }}>
            No projects yet. Click "New Project" to get started!
          </div>
        )}
        {projects?.map((project) => (
          <div
            key={project.id}
            style={{
              padding: '20px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'box-shadow 0.2s',
              backgroundColor: 'white'
            }}
            onClick={() => navigate(`/project/${project.id}`)}
            onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'}
            onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
              <h3 style={{ margin: 0 }}>{project.title}</h3>
              <button
                onClick={(e) => handleDelete(e, project.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#d32f2f',
                  cursor: 'pointer',
                  fontSize: '18px',
                  padding: '0 5px'
                }}
                title="Delete project"
              >
                ×
              </button>
            </div>
            {project.description && (
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '10px' }}>{project.description}</p>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#888' }}>
              <span>{project.chapter_count} chapters</span>
              <span>{project.is_own_writing ? '✍️ Writing' : '📖 Reading'}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}