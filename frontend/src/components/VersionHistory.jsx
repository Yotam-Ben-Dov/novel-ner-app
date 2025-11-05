import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useState } from 'react';

export default function VersionHistory({ chapterId }) {
  const queryClient = useQueryClient();
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  const { data: versions } = useQuery({
    queryKey: ['versions', chapterId],
    queryFn: async () => {
      const res = await api.getChapterVersions(chapterId);
      return res.data;
    },
    enabled: !!chapterId && isOpen
  });

  const { data: versionContent } = useQuery({
    queryKey: ['version-content', selectedVersion],
    queryFn: async () => {
      const res = await api.getVersionContent(selectedVersion);
      return res.data;
    },
    enabled: !!selectedVersion
  });

  const createVersionMutation = useMutation({
    mutationFn: ({ summary }) => api.createChapterVersion(chapterId, summary),
    onSuccess: () => {
      queryClient.invalidateQueries(['versions', chapterId]);
      alert('Version saved!');
    }
  });

  const restoreMutation = useMutation({
    mutationFn: (versionId) => api.restoreVersion(chapterId, versionId),
    onSuccess: () => {
      queryClient.invalidateQueries(['chapter', chapterId]);
      queryClient.invalidateQueries(['chapters']);
      setSelectedVersion(null);
      alert('Version restored!');
    }
  });

  const handleCreateVersion = () => {
    const summary = prompt('Enter a brief description of changes (optional):');
    createVersionMutation.mutate({ summary });
  };

  const handleRestore = (versionId) => {
    if (window.confirm('Restore this version? Your current content will be backed up.')) {
      restoreMutation.mutate(versionId);
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          padding: '6px 12px',
          fontSize: '12px',
          backgroundColor: '#f0f0f0',
          border: '1px solid #ddd',
          borderRadius: '4px',
          cursor: 'pointer'
        }}
        title="Version History"
      >
        📜 History
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      width: '400px',
      height: '100vh',
      backgroundColor: 'white',
      borderLeft: '2px solid #ddd',
      boxShadow: '-2px 0 8px rgba(0,0,0,0.1)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 999
    }}>
      {/* Header */}
      <div style={{
        padding: '15px',
        borderBottom: '1px solid #ddd',
        backgroundColor: '#f9f9f9',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0 }}>📜 Version History</h3>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '20px',
            cursor: 'pointer'
          }}
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '15px' }}>
        {!selectedVersion ? (
          <>
            <button
              onClick={handleCreateVersion}
              disabled={createVersionMutation.isLoading}
              style={{
                width: '100%',
                padding: '10px',
                marginBottom: '15px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              {createVersionMutation.isLoading ? 'Saving...' : '💾 Save New Version'}
            </button>

            {versions && versions.length === 0 && (
              <p style={{ textAlign: 'center', color: '#666', fontSize: '14px' }}>
                No versions yet. Click "Save New Version" to create the first snapshot.
              </p>
            )}

            {versions?.map((version) => (
              <div
                key={version.id}
                style={{
                  padding: '12px',
                  marginBottom: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onClick={() => setSelectedVersion(version.id)}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#f9f9f9'}
                onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '6px' }}>
                  Version {version.version_number}
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                  {new Date(version.created_at).toLocaleString()}
                </div>
                {version.change_summary && (
                  <div style={{
                    fontSize: '12px',
                    padding: '6px',
                    backgroundColor: '#f0f0f0',
                    borderRadius: '3px',
                    marginTop: '6px'
                  }}>
                    {version.change_summary}
                  </div>
                )}
                <div style={{ fontSize: '11px', color: '#888', marginTop: '6px' }}>
                  {version.word_count} words
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            <button
              onClick={() => setSelectedVersion(null)}
              style={{
                padding: '8px 12px',
                marginBottom: '15px',
                backgroundColor: '#f0f0f0',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              ← Back to list
            </button>

            {versionContent && (
              <>
                <div style={{
                  padding: '12px',
                  backgroundColor: '#f9f9f9',
                  borderRadius: '4px',
                  marginBottom: '15px'
                }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
                    Version {versionContent.version_number}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    {new Date(versionContent.created_at).toLocaleString()}
                  </div>
                  {versionContent.change_summary && (
                    <div style={{ fontSize: '12px', marginTop: '8px' }}>
                      <strong>Changes:</strong> {versionContent.change_summary}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleRestore(selectedVersion)}
                  disabled={restoreMutation.isLoading}
                  style={{
                    width: '100%',
                    padding: '10px',
                    marginBottom: '15px',
                    backgroundColor: '#2196F3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {restoreMutation.isLoading ? 'Restoring...' : '↶ Restore This Version'}
                </button>

                <div style={{
                  padding: '15px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  backgroundColor: 'white',
                  maxHeight: '60vh',
                  overflowY: 'auto',
                  fontSize: '14px',
                  lineHeight: '1.6',
                  fontFamily: 'Georgia, serif'
                }}>
                  <div dangerouslySetInnerHTML={{ __html: versionContent.content }} />
                </div>

                {versionContent.notes && (
                  <div style={{
                    marginTop: '15px',
                    padding: '10px',
                    backgroundColor: '#fffef0',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '13px'
                  }}>
                    <strong>Notes:</strong>
                    <div style={{ marginTop: '6px' }}>{versionContent.notes}</div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}