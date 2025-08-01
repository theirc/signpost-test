'use client'

import { useState, useRef, ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowUp, FileText, FileJson, Type } from 'lucide-react'
import Tesseract from 'tesseract.js'
import { JsonEditor } from 'json-edit-react'

interface SearchInputProps {
  onSearch: (message?: string, audio?: any, tts?: boolean) => void
  disabled: boolean
}

export function SearchInput(props: SearchInputProps) {
  const { onSearch, disabled } = props

  const [value, setValue] = useState<string>("")
  const [ocrLoading, setOcrLoading] = useState<boolean>(false)
  const [isJsonInput, setIsJsonInput] = useState<boolean>(false)
  const [jsonError, setJsonError] = useState<string>("")
  const [isJsonEditorMode, setIsJsonEditorMode] = useState<boolean>(false)
  const [jsonData, setJsonData] = useState<any>({})

  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const validateJsonInput = (input: string) => {
    const trimmed = input.trim()
    if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || 
        (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
      try {
        JSON.parse(trimmed)
        setIsJsonInput(true)
        setJsonError("")
      } catch (e) {
        setIsJsonInput(true)
        setJsonError("Invalid JSON format")
      }
    } else {
      setIsJsonInput(false)
      setJsonError("")
    }
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value
    setValue(newValue)
    validateJsonInput(newValue)
    e.target.style.height = "auto"
    e.target.style.height = `${e.target.scrollHeight}px`
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isJsonEditorMode) {
      e.preventDefault()
      submitText(value)
    }
  }

  const submitText = (v: string) => {
    if (!v.trim()) return
    if (isJsonInput && jsonError) return
    onSearch(v, '', false)
    setValue("")
    setIsJsonInput(false)
    setJsonError("")
  }

  const submitJson = () => {
    try {
      const jsonString = JSON.stringify(jsonData, null, 2)
      if (jsonString === '{}' || jsonString === '[]') return
      onSearch(jsonString, '', false)
      setJsonData({})
    } catch (error) {
      console.error('Error submitting JSON:', error)
    }
  }

  const toggleJsonEditorMode = () => {
    setIsJsonEditorMode(!isJsonEditorMode)
    if (!isJsonEditorMode) {
      // Switching to JSON editor mode
      if (value.trim()) {
        try {
          const parsed = JSON.parse(value)
          setJsonData(parsed)
        } catch (e) {
          setJsonData({})
        }
      }
      setValue("")
    } else {
      // Switching to text mode
      if (Object.keys(jsonData).length > 0) {
        setValue(JSON.stringify(jsonData, null, 2))
      }
      setJsonData({})
    }
    setIsJsonInput(false)
    setJsonError("")
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
      <div className="relative">
        <form
          onSubmit={e => { 
            e.preventDefault()
            if (isJsonEditorMode) {
              submitJson()
            } else {
              submitText(value)
            }
          }}
          className={`relative bg-white rounded-xl border overflow-hidden ${
            jsonError 
              ? 'border-red-400 shadow-[0_0_10px_rgba(239,68,68,0.3)]'
              : (isJsonInput || isJsonEditorMode)
                ? 'border-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                : !value.trim() && Object.keys(jsonData).length === 0
                  ? 'border-gray-200 pulse-input-shadow'
                  : 'border-gray-200 shadow-[4px_4px_20px_-4px_rgba(236,72,153,0.1),_-4px_4px_20px_-4px_rgba(124,58,237,0.1),_0_4px_20px_-4px_rgba(34,211,238,0.1)]'
          }`}
        >
          <div className="flex flex-col w-full">
            {(isJsonInput || isJsonEditorMode) && (
              <div className={`px-3 py-1 text-xs flex items-center justify-between ${
                jsonError ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
              }`}>
                <span>{jsonError || (isJsonEditorMode ? 'JSON Editor Mode' : 'JSON input detected')}</span>
                {!jsonError && (
                  <span className="text-xs bg-blue-100 px-1.5 py-0.5 rounded">JSON</span>
                )}
              </div>
            )}
            
            {isJsonEditorMode ? (
              <div className="p-3 min-h-[200px] max-h-80 overflow-y-auto">
                <JsonEditor
                  data={jsonData}
                  setData={setJsonData}
                  enableClipboard={false}
                  showErrorMessages={true}
                />
              </div>
            ) : (
              <div className="px-2 py-3 max-h-80 overflow-y-auto">
                <textarea
                  ref={textareaRef}
                  value={value}
                  onChange={handleSearchChange}
                  onKeyDown={handleKeyDown}
                  placeholder={isJsonInput ? "Enter valid JSON object or array..." : "Type your message here."}
                  className="w-full outline-none resize-none py-1 px-1 text-sm min-h-[40px]"
                  style={{ fontFamily: isJsonInput ? 'Monaco, Consolas, monospace' : 'Inter, sans-serif' }}
                />
              </div>
            )}
            
            <div className="flex justify-between items-center p-2">
              <div className="flex items-center space-x-2">
                <Button
                  type="button"
                  onClick={toggleJsonEditorMode}
                  variant={isJsonEditorMode ? 'default' : 'ghost'}
                  className="w-10 h-10"
                  title={isJsonEditorMode ? 'Switch to text mode' : 'Switch to JSON editor'}
                >
                  {isJsonEditorMode ? <Type className='h-6 w-6' /> : <FileJson className='h-6 w-6 text-gray-400 hover:text-black'/>}
                </Button>
                <Button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={disabled}
                  variant='ghost'
                  className="w-10 h-10"
                  title="Upload File (Image/PDF)"
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
                  onClick={() => {
                    if (isJsonEditorMode) {
                      submitJson()
                    } else {
                      submitText(value)
                    }
                  }}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-black text-white"
                  disabled={disabled || (!value.trim() && Object.keys(jsonData).length === 0) || (isJsonInput && !!jsonError)}
                  title="Send Message"
                >
                  <ArrowUp className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}