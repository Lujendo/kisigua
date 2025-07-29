import React, { useState, useRef, useEffect } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "Start typing...",
  className = "",
  minHeight = "200px"
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);

  // Initialize editor content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  // Handle content changes
  const handleInput = () => {
    if (editorRef.current) {
      const content = editorRef.current.innerHTML;
      onChange(content);
    }
  };

  // Execute formatting commands
  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
    handleInput();
  };

  // Check if command is active
  const isCommandActive = (command: string): boolean => {
    return document.queryCommandState(command);
  };

  // Toolbar button component
  const ToolbarButton: React.FC<{
    command: string;
    icon: React.ReactNode;
    title: string;
    value?: string;
  }> = ({ command, icon, title, value }) => {
    const active = isCommandActive(command);
    return (
      <button
        type="button"
        onClick={() => execCommand(command, value)}
        className={`p-2 rounded hover:bg-gray-100 transition-colors ${
          active ? 'bg-gray-200 text-blue-600' : 'text-gray-600'
        }`}
        title={title}
      >
        {icon}
      </button>
    );
  };

  return (
    <div className={`border border-gray-300 rounded-lg overflow-hidden ${className}`}>
      {/* Toolbar */}
      <div className="border-b border-gray-200 bg-gray-50 p-2 flex flex-wrap gap-1">
        {/* Text Formatting */}
        <div className="flex border-r border-gray-300 pr-2 mr-2">
          <ToolbarButton
            command="bold"
            title="Bold (Ctrl+B)"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 4h8a4 4 0 014 4 4 4 0 01-4 4H6z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12h9a4 4 0 014 4 4 4 0 01-4 4H6z" />
              </svg>
            }
          />
          <ToolbarButton
            command="italic"
            title="Italic (Ctrl+I)"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 4l4 16M6 20h12" />
              </svg>
            }
          />
          <ToolbarButton
            command="underline"
            title="Underline (Ctrl+U)"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v8a5 5 0 0010 0V4M5 20h14" />
              </svg>
            }
          />
        </div>

        {/* Lists */}
        <div className="flex border-r border-gray-300 pr-2 mr-2">
          <ToolbarButton
            command="insertUnorderedList"
            title="Bullet List"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                <circle cx="2" cy="6" r="1" fill="currentColor" />
                <circle cx="2" cy="12" r="1" fill="currentColor" />
                <circle cx="2" cy="18" r="1" fill="currentColor" />
              </svg>
            }
          />
          <ToolbarButton
            command="insertOrderedList"
            title="Numbered List"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                <text x="2" y="8" fontSize="8" fill="currentColor">1</text>
                <text x="2" y="14" fontSize="8" fill="currentColor">2</text>
                <text x="2" y="20" fontSize="8" fill="currentColor">3</text>
              </svg>
            }
          />
        </div>

        {/* Alignment */}
        <div className="flex border-r border-gray-300 pr-2 mr-2">
          <ToolbarButton
            command="justifyLeft"
            title="Align Left"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h8M4 18h16" />
              </svg>
            }
          />
          <ToolbarButton
            command="justifyCenter"
            title="Align Center"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M8 12h8M4 18h16" />
              </svg>
            }
          />
          <ToolbarButton
            command="justifyRight"
            title="Align Right"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M12 12h8M4 18h16" />
              </svg>
            }
          />
        </div>

        {/* Headings */}
        <div className="flex border-r border-gray-300 pr-2 mr-2">
          <select
            onChange={(e) => {
              if (e.target.value) {
                execCommand('formatBlock', e.target.value);
                e.target.value = '';
              }
            }}
            className="px-2 py-1 text-sm border border-gray-300 rounded"
            defaultValue=""
          >
            <option value="">Format</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
            <option value="p">Paragraph</option>
          </select>
        </div>

        {/* Additional Actions */}
        <div className="flex">
          <ToolbarButton
            command="removeFormat"
            title="Clear Formatting"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            }
          />
          <ToolbarButton
            command="undo"
            title="Undo (Ctrl+Z)"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
              </svg>
            }
          />
          <ToolbarButton
            command="redo"
            title="Redo (Ctrl+Y)"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsActive(true)}
        onBlur={() => setIsActive(false)}
        className={`p-4 outline-none ${isActive ? 'ring-2 ring-green-500' : ''}`}
        style={{ minHeight }}
        data-placeholder={placeholder}
        suppressContentEditableWarning={true}
      />

      {/* Placeholder styling */}
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;
