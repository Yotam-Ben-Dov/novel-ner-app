import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';

export default function AIAssistant({ projectId }) {
  const [question, setQuestion] = useState('');
  const [conversation, setConversation] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const askMutation = useMutation({
    mutationFn: (question) => api.askAssistant(projectId, question),
    onSuccess: (response) => {
      setConversation(prev => [...prev, {
        type: 'answer',
        content: response.data.answer,
        sources: response.data.sources,
        timestamp: new Date()
      }]);
      setQuestion('');
    }
  });

  const rebuildMutation = useMutation({
    mutationFn: () => api.rebuildKnowledgeBase(projectId),
    onSuccess: () => {
      alert('Knowledge base rebuilt! The assistant now has the latest information.');
    }
  });

  const handleAsk = (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    // Add question to conversation
    setConversation(prev => [...prev, {
      type: 'question',
      content: question,
      timestamp: new Date()
    }]);

    // Ask the assistant
    askMutation.mutate(question);
  };

  const suggestedQuestions = [
    "Who are the main characters?",
    "What are the key locations in the story?",
    "Summarize the plot so far",
    "What conflicts are happening?",
    "Who is the protagonist's main ally?",
    "What is the central mystery or problem?"
  ];

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          backgroundColor: '#7C3AED',
          color: 'white',
          border: 'none',
          fontSize: '24px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          zIndex: 1000
        }}
        title="Open AI Assistant"
      >
        🤖
      </button>
    );
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      width: '400px',
      height: '600px',
      backgroundColor: 'white',
      border: '1px solid #ddd',
      borderRadius: '12px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
      display: 'flex',
      flexDirection: 'column',
      zIndex: 1000
    }}>
      {/* Header */}
      <div style={{
        padding: '15px',
        backgroundColor: '#7C3AED',
        color: 'white',
        borderTopLeftRadius: '12px',
        borderTopRightRadius: '12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <div style={{ fontWeight: 'bold', fontSize: '16px' }}>🤖 Claude Assistant</div>
          <div style={{ fontSize: '11px', opacity: 0.9 }}>Ask Claude about your story</div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '20px',
            cursor: 'pointer',
            padding: '0 5px'
          }}
        >
          ×
        </button>
      </div>

      {/* Conversation */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '15px',
        backgroundColor: '#f9f9f9'
      }}>
        {conversation.length === 0 && (
          <div>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
              Hi! I'm Claude, your AI story assistant. I've read all your chapters and can help you with:
            </p>
            <ul style={{ fontSize: '13px', color: '#666', paddingLeft: '20px' }}>
              <li>Character information and relationships</li>
              <li>Plot summaries and timelines</li>
              <li>Finding inconsistencies</li>
              <li>Answering "what if" questions</li>
            </ul>
            
            <div style={{ marginTop: '20px' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', marginBottom: '8px', color: '#7C3AED' }}>
                Try asking:
              </div>
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => setQuestion(q)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 12px',
                    marginBottom: '6px',
                    backgroundColor: 'white',
                    border: '1px solid #ddd',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.backgroundColor = '#f0f0f0';
                    e.target.style.borderColor = '#7C3AED';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.backgroundColor = 'white';
                    e.target.style.borderColor = '#ddd';
                  }}
                >
                  {q}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => rebuildMutation.mutate()}
              disabled={rebuildMutation.isLoading}
              style={{
                marginTop: '15px',
                padding: '6px 12px',
                fontSize: '11px',
                backgroundColor: '#f0f0f0',
                border: '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              {rebuildMutation.isLoading ? '⏳ Rebuilding...' : '🔄 Rebuild Knowledge Base'}
            </button>
          </div>
        )}

        {conversation.map((msg, idx) => (
          <div key={idx} style={{
            marginBottom: '15px',
            textAlign: msg.type === 'question' ? 'right' : 'left'
          }}>
            {msg.type === 'question' ? (
              <div style={{
                display: 'inline-block',
                maxWidth: '80%',
                padding: '10px 15px',
                backgroundColor: '#7C3AED',
                color: 'white',
                borderRadius: '18px',
                fontSize: '14px'
              }}>
                {msg.content}
              </div>
            ) : (
              <div>
                <div style={{
                  display: 'inline-block',
                  maxWidth: '90%',
                  padding: '12px 15px',
                  backgroundColor: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '12px',
                  fontSize: '14px',
                  lineHeight: '1.6'
                }}>
                  {msg.content}
                </div>
                
                {msg.sources && msg.sources.length > 0 && (
                  <div style={{
                    marginTop: '8px',
                    fontSize: '11px',
                    color: '#666',
                    paddingLeft: '10px'
                  }}>
                    <strong>Sources:</strong>
                    {msg.sources.map((source, sidx) => (
                      <div key={sidx} style={{ marginTop: '4px' }}>
                        {source.type === 'chapter' && (
                          <span>📖 Chapter {source.chapter_number}: {source.chapter_title}</span>
                        )}
                        {source.type === 'entity' && (
                          <span>👤 Entity: {source.entity_name}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {askMutation.isLoading && (
          <div style={{
            padding: '10px',
            backgroundColor: '#f0f0f0',
            borderRadius: '12px',
            fontSize: '13px',
            color: '#666'
          }}>
            🤔 Thinking...
          </div>
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleAsk} style={{
        padding: '15px',
        borderTop: '1px solid #ddd',
        backgroundColor: 'white',
        borderBottomLeftRadius: '12px',
        borderBottomRightRadius: '12px'
      }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question..."
            style={{
              flex: 1,
              padding: '10px',
              border: '1px solid #ddd',
              borderRadius: '20px',
              fontSize: '14px',
              outline: 'none'
            }}
            disabled={askMutation.isLoading}
          />
          <button
            type="submit"
            disabled={askMutation.isLoading || !question.trim()}
            style={{
              padding: '10px 20px',
              backgroundColor: '#7C3AED',
              color: 'white',
              border: 'none',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}