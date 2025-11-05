import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useState } from 'react';

export default function EntityManagement({ projectId }) {
  const queryClient = useQueryClient();
  const [mergeMode, setMergeMode] = useState(false);
  const [selectedForMerge, setSelectedForMerge] = useState([]);

  const { data: duplicates } = useQuery({
    queryKey: ['duplicates', projectId],
    queryFn: async () => {
      const res = await api.findDuplicates(projectId);
      return res.data;
    }
  });

  const mergeMutation = useMutation({
    mutationFn: ({ keepId, mergeIds }) => api.mergeEntities(keepId, mergeIds),
    onSuccess: () => {
      queryClient.invalidateQueries(['entities', projectId]);
      setMergeMode(false);
      setSelectedForMerge([]);
    }
  });

  const handleMerge = (group) => {
    const keepId = group.entities[0].id;
    const mergeIds = group.entities.slice(1).map(e => e.id);
    
    if (window.confirm(`Merge ${mergeIds.length} entities into "${group.entities[0].name}"?`)) {
      mergeMutation.mutate({ keepId, mergeIds });
    }
  };

  return (
    <div style={{ padding: '15px', backgroundColor: '#fff3cd', borderRadius: '4px', marginBottom: '15px' }}>
      <h4 style={{ marginTop: 0 }}>🔍 Entity Management</h4>
      
      {duplicates && duplicates.length > 0 && (
        <div>
          <p style={{ fontSize: '13px', marginBottom: '10px' }}>
            Found {duplicates.length} potential duplicate groups:
          </p>
          {duplicates.map((group, idx) => (
            <div key={idx} style={{
              padding: '10px',
              backgroundColor: 'white',
              border: '1px solid #ddd',
              borderRadius: '4px',
              marginBottom: '8px'
            }}>
              <div style={{ fontSize: '12px', marginBottom: '6px' }}>
                {group.entities.map((e, i) => (
                  <span key={e.id}>
                    {i > 0 && ' ≈ '}
                    <strong>{e.name}</strong>
                  </span>
                ))}
              </div>
              <button
                onClick={() => handleMerge(group)}
                style={{
                  padding: '4px 8px',
                  fontSize: '11px',
                  cursor: 'pointer',
                  backgroundColor: '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '3px'
                }}
              >
                Merge into "{group.entities[0].name}"
              </button>
            </div>
          ))}
        </div>
      )}
      
      {(!duplicates || duplicates.length === 0) && (
        <p style={{ fontSize: '13px', color: '#666' }}>
          ✓ No duplicate entities found
        </p>
      )}
    </div>
  );
}