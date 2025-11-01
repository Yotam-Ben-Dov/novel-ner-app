import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useState } from 'react';

export default function EntitySidebar({ projectId, chapterId }) {
  const queryClient = useQueryClient();
  const [selectedEntity, setSelectedEntity] = useState(null);
  const [filterType, setFilterType] = useState(null);
  const [editingEntity, setEditingEntity] = useState(null);
  const [editForm, setEditForm] = useState({});

  const { data: entities } = useQuery({
    queryKey: ['entities', projectId, filterType],
    queryFn: async () => {
      const res = await api.getEntities(projectId, filterType);
      return res.data;
    }
  });

  const { data: mentions } = useQuery({
    queryKey: ['mentions', selectedEntity],
    queryFn: async () => {
      const res = await api.getEntityMentions(selectedEntity);
      return res.data;
    },
    enabled: !!selectedEntity
  });

  const updateEntityMutation = useMutation({
    mutationFn: ({ entityId, data }) => api.updateEntity(entityId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['entities', projectId]);
      setEditingEntity(null);
    }
  });

  const deleteEntityMutation = useMutation({
    mutationFn: api.deleteEntity,
    onSuccess: () => {
      queryClient.invalidateQueries(['entities', projectId]);
      setSelectedEntity(null);
    }
  });

  const handleEditEntity = (entity) => {
    setEditingEntity(entity.id);
    setEditForm({
      name: entity.name,
      entity_type: entity.entity_type,
      description: entity.description || '',
      aliases: entity.aliases.join(', ')
    });
  };

  const handleSaveEntity = () => {
    const aliases = editForm.aliases
      .split(',')
      .map(a => a.trim())
      .filter(a => a.length > 0);
    
    updateEntityMutation.mutate({
      entityId: editingEntity,
      data: {
        ...editForm,
        aliases
      }
    });
  };

  const handleDeleteEntity = (entityId) => {
    if (window.confirm('Delete this entity? All mentions will be removed.')) {
      deleteEntityMutation.mutate(entityId);
    }
  };

  const entityTypes = [
    { value: null, label: 'All', icon: '📚' },
    { value: 'character', label: 'Characters', icon: '👤' },
    { value: 'location', label: 'Locations', icon: '📍' },
    { value: 'organization', label: 'Organizations', icon: '🏢' },
    { value: 'item', label: 'Items', icon: '⚔️' },
    { value: 'concept', label: 'Concepts', icon: '💡' }
  ];

  return (
    <div style={{ 
      width: '350px', 
      borderLeft: '1px solid #ccc', 
      padding: '15px', 
      overflowY: 'auto',
      backgroundColor: '#f9f9f9'
    }}>
      <h3 style={{ marginTop: 0 }}>Entities</h3>
      
      {selectedEntity ? (
        <div>
          <button 
            onClick={() => setSelectedEntity(null)}
            style={{ marginBottom: '15px', padding: '8px 12px', cursor: 'pointer' }}
          >
            ← Back to List
          </button>
          
          {editingEntity === selectedEntity ? (
            // Edit mode
            <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '4px' }}>
              <h4 style={{ marginTop: 0 }}>Edit Entity</h4>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                  Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  style={{ width: '100%', padding: '6px' }}
                />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                  Type
                </label>
                <select
                  value={editForm.entity_type}
                  onChange={(e) => setEditForm({ ...editForm, entity_type: e.target.value })}
                  style={{ width: '100%', padding: '6px' }}
                >
                  <option value="character">Character</option>
                  <option value="location">Location</option>
                  <option value="organization">Organization</option>
                  <option value="item">Item</option>
                  <option value="concept">Concept</option>
                </select>
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  style={{ width: '100%', padding: '6px', minHeight: '60px' }}
                  placeholder="Add background info, role in story, etc."
                />
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }}>
                  Aliases (comma-separated)
                </label>
                <input
                  type="text"
                  value={editForm.aliases}
                  onChange={(e) => setEditForm({ ...editForm, aliases: e.target.value })}
                  style={{ width: '100%', padding: '6px' }}
                  placeholder="e.g., John, Johnny, Mr. Smith"
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  onClick={handleSaveEntity}
                  style={{ flex: 1, padding: '8px', cursor: 'pointer', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px' }}
                >
                  Save
                </button>
                <button 
                  onClick={() => setEditingEntity(null)}
                  style={{ flex: 1, padding: '8px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            // View mode
            <div>
              {(() => {
                const entity = entities?.find(e => e.id === selectedEntity);
                if (!entity) return null;
                
                return (
                  <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '4px', marginBottom: '15px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '10px' }}>
                      <h4 style={{ margin: 0 }}>{entity.name}</h4>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <button
                          onClick={() => handleEditEntity(entity)}
                          style={{ padding: '4px 8px', fontSize: '12px', cursor: 'pointer' }}
                          title="Edit entity"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteEntity(entity.id)}
                          style={{ padding: '4px 8px', fontSize: '12px', cursor: 'pointer', color: '#d32f2f' }}
                          title="Delete entity"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#666', marginBottom: '8px' }}>
                      <strong>Type:</strong> {entity.entity_type}
                    </div>
                    {entity.description && (
                      <div style={{ fontSize: '13px', marginBottom: '8px', padding: '8px', backgroundColor: '#f9f9f9', borderRadius: '4px' }}>
                        {entity.description}
                      </div>
                    )}
                    {entity.aliases?.length > 0 && (
                      <div style={{ fontSize: '12px', marginBottom: '8px' }}>
                        <strong>Also known as:</strong> {entity.aliases.join(', ')}
                      </div>
                    )}
                    <div style={{ fontSize: '12px', color: '#666' }}>
                      <strong>First appearance:</strong> Chapter {entity.first_appearance}<br />
                      <strong>Last seen:</strong> Chapter {entity.last_appearance}<br />
                      <strong>Total mentions:</strong> {entity.mention_count}
                    </div>
                  </div>
                );
              })()}
              
              <h5 style={{ marginTop: '20px', marginBottom: '10px' }}>
                All Mentions ({mentions?.length || 0})
              </h5>
              <div>
                {mentions?.map((mention, idx) => (
                  <div 
                    key={idx} 
                    style={{ 
                      marginBottom: '12px', 
                      padding: '12px', 
                      backgroundColor: 'white', 
                      fontSize: '13px',
                      borderRadius: '4px',
                      border: '1px solid #eee'
                    }}
                  >
                    <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#2196F3' }}>
                      Chapter {mention.chapter_number}
                      {mention.chapter_title && `: ${mention.chapter_title}`}
                    </div>
                    <div style={{ 
                      padding: '8px', 
                      backgroundColor: '#fffef0', 
                      borderLeft: '3px solid #2196F3',
                      fontStyle: 'italic',
                      lineHeight: '1.5'
                    }}>
                      ...{mention.context}...
                    </div>
                    <div style={{ marginTop: '6px', fontSize: '11px', color: '#666' }}>
                      Mentioned as: <strong>{mention.mentioned_as}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        // Entity list view
        <div>
          {/* Filter buttons */}
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '6px', 
            marginBottom: '15px',
            paddingBottom: '15px',
            borderBottom: '1px solid #ddd'
          }}>
            {entityTypes.map(type => (
              <button
                key={type.value || 'all'}
                onClick={() => setFilterType(type.value)}
                style={{
                  padding: '6px 12px',
                  fontSize: '12px',
                  cursor: 'pointer',
                  backgroundColor: filterType === type.value ? '#2196F3' : 'white',
                  color: filterType === type.value ? 'white' : 'black',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  transition: 'all 0.2s'
                }}
              >
                {type.icon} {type.label}
              </button>
            ))}
          </div>

          {/* Entity count */}
          <div style={{ fontSize: '13px', color: '#666', marginBottom: '10px' }}>
            {entities?.length || 0} {filterType ? entityTypes.find(t => t.value === filterType)?.label.toLowerCase() : 'entities'} found
          </div>

          {/* Entity list */}
          {entities?.length === 0 && (
            <div style={{ 
              textAlign: 'center', 
              padding: '30px 20px', 
              color: '#999',
              fontSize: '13px'
            }}>
              {filterType 
                ? `No ${entityTypes.find(t => t.value === filterType)?.label.toLowerCase()} detected yet.`
                : 'No entities detected yet. Add content to a chapter to see entities appear here.'}
            </div>
          )}
          
          {entities?.map((entity) => (
            <div
              key={entity.id}
              onClick={() => setSelectedEntity(entity.id)}
              style={{
                padding: '12px',
                margin: '8px 0',
                backgroundColor: 'white',
                cursor: 'pointer',
                border: '1px solid #ddd',
                borderRadius: '4px',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)'}
              onMouseLeave={(e) => e.currentTarget.style.boxShadow = 'none'}
            >
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                {entity.name}
              </div>
              {entity.description && (
                <div style={{ 
                  fontSize: '12px', 
                  color: '#666', 
                  marginBottom: '6px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  {entity.description}
                </div>
              )}
              <div style={{ fontSize: '11px', color: '#888', display: 'flex', justifyContent: 'space-between' }}>
                <span>{entity.entity_type}</span>
                <span>{entity.mention_count} mentions</span>
              </div>
              {entity.first_appearance && (
                <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>
                  Ch {entity.first_appearance} → {entity.last_appearance}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}