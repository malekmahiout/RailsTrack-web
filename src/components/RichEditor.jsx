import { useRef, useEffect, useCallback } from 'react'

const TOOLS = [
  { cmd: 'bold', label: 'G', title: 'Gras', style: 'font-bold' },
  { cmd: 'italic', label: 'I', title: 'Italique', style: 'italic' },
  { cmd: 'underline', label: 'S', title: 'Souligné', style: 'underline' },
  { cmd: 'strikeThrough', label: 'S̶', title: 'Barré', style: 'line-through' },
  { type: 'sep' },
  { cmd: 'insertUnorderedList', label: '≡', title: 'Liste à puces' },
  { cmd: 'insertOrderedList', label: '1.', title: 'Liste numérotée' },
  { type: 'sep' },
  { cmd: 'removeFormat', label: '✕', title: 'Effacer le formatage' },
]

function ToolbarBtn({ tool, onAction }) {
  if (tool.type === 'sep') return <div className="w-px h-5 bg-gray-200 mx-1" aria-hidden="true" />

  return (
    <button
      type="button"
      title={tool.title}
      aria-label={tool.title}
      onMouseDown={e => { e.preventDefault(); onAction(tool.cmd) }}
      className="px-2.5 py-1 text-sm rounded hover:bg-gray-100 text-gray-700 transition-colors duration-150 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500"
    >
      <span className={tool.style}>{tool.label}</span>
    </button>
  )
}

export default function RichEditor({ value = '', onChange, placeholder = 'Saisissez votre contenu...', readOnly = false }) {
  const editorRef = useRef(null)
  const lastValueRef = useRef(value)

  useEffect(() => {
    const el = editorRef.current
    if (!el) return
    if (value !== lastValueRef.current) {
      el.innerHTML = value
      lastValueRef.current = value
    }
  }, [value])

  const handleInput = useCallback(() => {
    const html = editorRef.current?.innerHTML || ''
    lastValueRef.current = html
    onChange?.(html)
  }, [onChange])

  const execCmd = useCallback(cmd => {
    document.execCommand(cmd, false, null)
    editorRef.current?.focus()
    handleInput()
  }, [handleInput])

  const changeFontSize = useCallback(delta => {
    const sel = window.getSelection()
    if (!sel || sel.rangeCount === 0) return
    const range = sel.getRangeAt(0)
    if (range.collapsed) return
    const span = document.createElement('span')
    const current = parseFloat(window.getComputedStyle(range.startContainer.parentElement).fontSize) || 14
    span.style.fontSize = `${Math.max(10, Math.min(24, current + delta))}px`
    range.surroundContents(span)
    handleInput()
  }, [handleInput])

  if (readOnly) {
    return (
      <div
        className="min-h-[120px] p-4 text-sm text-gray-800 leading-relaxed prose prose-sm max-w-none"
        style={{ lineHeight: 1.7 }}
        dangerouslySetInnerHTML={{ __html: value }}
        role="article"
        aria-label="Contenu du rapport"
      />
    )
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent bg-white">
      {/* Toolbar */}
      <div className="flex items-center flex-wrap gap-0.5 px-2 py-1.5 border-b border-gray-100 bg-gray-50" role="toolbar" aria-label="Outils de mise en forme">
        {TOOLS.map((t, i) => (
          <ToolbarBtn key={i} tool={t} onAction={execCmd} />
        ))}
        <div className="w-px h-5 bg-gray-200 mx-1" aria-hidden="true" />
        <button
          type="button"
          title="Réduire la taille"
          aria-label="Réduire la taille du texte"
          onMouseDown={e => { e.preventDefault(); changeFontSize(-1) }}
          className="px-2.5 py-1 text-sm rounded hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          A-
        </button>
        <button
          type="button"
          title="Agrandir la taille"
          aria-label="Agrandir la taille du texte"
          onMouseDown={e => { e.preventDefault(); changeFontSize(1) }}
          className="px-2.5 py-1 text-sm rounded hover:bg-gray-100 text-gray-700 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          A+
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        data-placeholder={placeholder}
        className="rich-editor"
        role="textbox"
        aria-multiline="true"
        aria-label="Éditeur de contenu"
        style={{ lineHeight: 1.7, minHeight: 180 }}
      />
    </div>
  )
}
