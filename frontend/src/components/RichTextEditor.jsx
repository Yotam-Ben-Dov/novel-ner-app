import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { useEffect } from 'react';

export default function RichTextEditor({ content, onChange, placeholder }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3]
        }
      }),
      Placeholder.configure({
        placeholder: placeholder || 'Start writing...'
      })
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[300px] p-4'
      }
    }
  });

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  return (
    <div style={{ border: '1px solid #ddd', borderRadius: '4px', backgroundColor: 'white' }}>
      {/* Toolbar */}
      <div style={{
        padding: '8px',
        borderBottom: '1px solid #ddd',
        display: 'flex',
        gap: '4px',
        flexWrap: 'wrap',
        backgroundColor: '#f9f9f9'
      }}>
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          disabled={!editor?.can().chain().focus().toggleBold().run()}
          style={{
            padding: '4px 8px',
            border: '1px solid #ccc',
            borderRadius: '3px',
            backgroundColor: editor?.isActive('bold') ? '#ddd' : 'white',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          B
        </button>
        
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          disabled={!editor?.can().chain().focus().toggleItalic().run()}
          style={{
            padding: '4px 8px',
            border: '1px solid #ccc',
            borderRadius: '3px',
            backgroundColor: editor?.isActive('italic') ? '#ddd' : 'white',
            cursor: 'pointer',
            fontStyle: 'italic'
          }}
        >
          I
        </button>

        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          disabled={!editor?.can().chain().focus().toggleStrike().run()}
          style={{
            padding: '4px 8px',
            border: '1px solid #ccc',
            borderRadius: '3px',
            backgroundColor: editor?.isActive('strike') ? '#ddd' : 'white',
            cursor: 'pointer',
            textDecoration: 'line-through'
          }}
        >
          S
        </button>

        <div style={{ width: '1px', backgroundColor: '#ccc', margin: '0 4px' }} />

        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          style={{
            padding: '4px 8px',
            border: '1px solid #ccc',
            borderRadius: '3px',
            backgroundColor: editor?.isActive('heading', { level: 1 }) ? '#ddd' : 'white',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          H1
        </button>

        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          style={{
            padding: '4px 8px',
            border: '1px solid #ccc',
            borderRadius: '3px',
            backgroundColor: editor?.isActive('heading', { level: 2 }) ? '#ddd' : 'white',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          H2
        </button>

        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          style={{
            padding: '4px 8px',
            border: '1px solid #ccc',
            borderRadius: '3px',
            backgroundColor: editor?.isActive('heading', { level: 3 }) ? '#ddd' : 'white',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          H3
        </button>

        <div style={{ width: '1px', backgroundColor: '#ccc', margin: '0 4px' }} />

        <button
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          style={{
            padding: '4px 8px',
            border: '1px solid #ccc',
            borderRadius: '3px',
            backgroundColor: editor?.isActive('bulletList') ? '#ddd' : 'white',
            cursor: 'pointer'
          }}
        >
          • List
        </button>

        <button
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          style={{
            padding: '4px 8px',
            border: '1px solid #ccc',
            borderRadius: '3px',
            backgroundColor: editor?.isActive('orderedList') ? '#ddd' : 'white',
            cursor: 'pointer'
          }}
        >
          1. List
        </button>

        <button
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          style={{
            padding: '4px 8px',
            border: '1px solid #ccc',
            borderRadius: '3px',
            backgroundColor: editor?.isActive('blockquote') ? '#ddd' : 'white',
            cursor: 'pointer'
          }}
        >
          " Quote
        </button>

        <div style={{ width: '1px', backgroundColor: '#ccc', margin: '0 4px' }} />

        <button
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          style={{
            padding: '4px 8px',
            border: '1px solid #ccc',
            borderRadius: '3px',
            backgroundColor: 'white',
            cursor: 'pointer'
          }}
        >
          ― HR
        </button>

        <button
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor?.can().chain().focus().undo().run()}
          style={{
            padding: '4px 8px',
            border: '1px solid #ccc',
            borderRadius: '3px',
            backgroundColor: 'white',
            cursor: 'pointer'
          }}
        >
          ↶ Undo
        </button>

        <button
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor?.can().chain().focus().redo().run()}
          style={{
            padding: '4px 8px',
            border: '1px solid #ccc',
            borderRadius: '3px',
            backgroundColor: 'white',
            cursor: 'pointer'
          }}
        >
          ↷ Redo
        </button>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} style={{ minHeight: '300px' }} />
    </div>
  );
}