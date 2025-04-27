'use client'

import { useState, useRef, useEffect, ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { CirclePlus, ArrowUp, AudioWaveform, Circle, FileText } from 'lucide-react'
import { useReactMediaRecorder } from 'react-media-recorder'
import Tesseract from 'tesseract.js'

interface SearchInputProps {
  onSearch: (message?: string, audio?: any, tts?: boolean) => void
  disabled: boolean
  openFileDialog: () => void
  audioMode: boolean
  onModeChanged: () => void
}

export function SearchInput(props: SearchInputProps) {
  const { onSearch, disabled, openFileDialog, audioMode, onModeChanged } = props

  const [value, setValue] = useState<string>("")
  const [ocrLoading, setOcrLoading] = useState<boolean>(false)
  const [recordingComplete, setRecordingComplete] = useState<boolean>(false)
  const [tts, setTts] = useState<boolean>(false)
  const [isRecordingMode, setIsRecordingMode] = useState<boolean>(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const {
    status,
    startRecording,
    stopRecording,
    mediaBlobUrl,
    clearBlobUrl,
  } = useReactMediaRecorder({ audio: true })

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }, [value])

  const handleSearchChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
  }
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submitText(value)
    }
  }
  const submitText = (v: string) => {
    if (!v.trim()) return
    onSearch(v, '', tts)
    setValue("")
  }

  const handleToggleRecording = () => {
    if (status === "recording") {
      stopRecording()
      setRecordingComplete(true)
    } else {
      clearBlobUrl()
      startRecording()
      setRecordingComplete(false)
    }
  }
  const blobToBase64 = (blob: Blob) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(reader.result as string)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  const handleSendRecording = async () => {
    if (!mediaBlobUrl) return
    const res = await fetch(mediaBlobUrl)
    const blob = await res.blob()
    const base64 = await blobToBase64(blob)
    onSearch(undefined, base64, true)
    clearBlobUrl()
    setRecordingComplete(false)
    setIsRecordingMode(false)
  }
  const handleOcrFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setOcrLoading(true)
    try {
      const { data } = await Tesseract.recognize(file, 'eng', {
        logger: m => console.log('[OCR]', m),
      })
      const text = data.text.trim()
      onSearch(text, undefined, false)
    } catch (err: any) {
      console.error("OCR error:", err)
      onSearch(`❗️ OCR failed: ${err.message ?? err}`)
    } finally {
      setOcrLoading(false)
      e.target.value = ""  
    }
  }

  return (
    <div className="w-full">
      {isRecordingMode ? (
        <div className="relative bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
          <div className="flex flex-col items-center p-6">
            <div className="text-lg font-medium text-gray-700 mb-6">
              {status === "recording" ? "Recording..." : "Ready to record"}
            </div>
            <Button onClick={handleToggleRecording} className={`h-20 w-20 rounded-full ${status === "recording" ? 'bg-red-500' : 'bg-gray-200 hover:bg-gray-300'}`}>
              {status === "recording"
                ? <Circle className="h-8 w-8 text-white" />
                : <AudioWaveform className="h-8 w-8 text-gray-800" />}
            </Button>
            {mediaBlobUrl && (
              <>
                <audio controls src={mediaBlobUrl} className="mt-6 w-full max-w-md rounded-md border border-gray-300" />
                <Button onClick={handleSendRecording} className="mt-4 px-4 py-2 bg-black text-white rounded-full">
                  <ArrowUp className="h-5 w-5 mr-2" /><span>Send</span>
                </Button>
              </>
            )}
            <Button onClick={() => setIsRecordingMode(false)} className="mt-6 text-gray-600">
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="relative">
        <form
          onSubmit={e => { e.preventDefault(); submitText(value) }}
          className={`relative bg-white rounded-xl border border-gray-200 overflow-hidden ${
            !value.trim()
              ? 'pulse-input-shadow'
              : 'shadow-[4px_4px_20px_-4px_rgba(236,72,153,0.1),_-4px_4px_20px_-4px_rgba(124,58,237,0.1),_0_4px_20px_-4px_rgba(34,211,238,0.1)]'
          }`}
        >
          <div className="flex flex-col w-full">
            <div className="px-2 py-3 max-h-80 overflow-y-auto">
              <textarea
                ref={textareaRef}
                value={value}
                onChange={handleSearchChange}
                onKeyDown={handleKeyDown}
                placeholder="Type your message here."
                className="w-full outline-none resize-none py-1 px-1 text-sm min-h-[40px]"
                style={{ fontFamily: 'Inter, sans-serif' }}
              />
            </div>
            <div className="flex justify-between items-center p-2">
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  onClick={openFileDialog}
                  variant="ghost"
                  className="w-10 h-10"
                >
                  <CirclePlus className="h-6 w-6 text-gray-400 hover:text-black" />
                </Button>
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled}
                  variant='ghost'
                  className="w-10 h-10"
                >
                  <FileText className='h-6 w-6 text-gray-400 hover:text-black'/>
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,application/pdf"
                  className="hidden"
                  onChange={handleOcrFile}
                />
                {ocrLoading && (
                  <span className="ml-2 text-sm text-gray-500">
                     Extracting…
                  </span>
                )}
              </div>
              <div>
                <Button
                  type="button"
                  onClick={value.trim() ? () => submitText(value) : onModeChanged}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-black text-white"
                  disabled={disabled}
                >
                  {value.trim()
                    ? <ArrowUp className="h-5 w-5" />
                    : <AudioWaveform className="h-5 w-5" />}
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    )}
  </div>
)
}
