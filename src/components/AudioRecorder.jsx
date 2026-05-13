import { useState, useRef, useCallback } from 'react'

export default function AudioRecorder({ onTranscribed, disabled = false }) {
  const [state, setState] = useState('idle') // idle | recording | processing
  const [duration, setDuration] = useState(0)
  const [error, setError] = useState(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)

  const startRecording = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      chunksRef.current = []
      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = async () => {
        stream.getTracks().forEach(t => t.stop())
        clearInterval(timerRef.current)
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setState('processing')
        try {
          await onTranscribed(blob)
        } catch (e) {
          setError(e.message)
        } finally {
          setState('idle')
          setDuration(0)
        }
      }
      mr.start()
      mediaRecorderRef.current = mr
      setDuration(0)
      setState('recording')
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
    } catch (e) {
      setError('Microphone inaccessible. Vérifiez les permissions.')
      setState('idle')
    }
  }, [onTranscribed])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  const fmt = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        type="button"
        onClick={state === 'recording' ? stopRecording : startRecording}
        disabled={disabled || state === 'processing'}
        className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 focus:outline-none focus:ring-4 cursor-pointer
          ${state === 'recording'
            ? 'bg-red-500 hover:bg-red-600 focus:ring-red-300 record-pulse'
            : state === 'processing'
              ? 'bg-primary-300 cursor-not-allowed'
              : 'bg-primary-900 hover:bg-primary-700 focus:ring-primary-300 hover:scale-105 active:scale-95'
          }`}
        aria-label={state === 'recording' ? 'Arrêter l\'enregistrement' : 'Démarrer l\'enregistrement vocal'}
        aria-pressed={state === 'recording'}
      >
        {state === 'processing' ? (
          <div className="spinner w-7 h-7 border-white border-2" aria-hidden="true" />
        ) : state === 'recording' ? (
          <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <rect x="6" y="6" width="12" height="12" rx="2" />
          </svg>
        ) : (
          <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        )}
      </button>

      <div className="text-center" aria-live="polite">
        {state === 'recording' && (
          <p className="text-red-500 font-semibold text-sm flex items-center gap-2">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse inline-block" aria-hidden="true" />
            Enregistrement en cours — {fmt(duration)}
          </p>
        )}
        {state === 'processing' && (
          <p className="text-primary-700 text-sm font-medium">Transcription en cours...</p>
        )}
        {state === 'idle' && duration === 0 && (
          <p className="text-gray-400 text-xs">Appuyez pour enregistrer</p>
        )}
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 max-w-sm text-left w-full">
          <svg className="w-4 h-4 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
