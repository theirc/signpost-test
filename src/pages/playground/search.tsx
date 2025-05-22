'use client'

import { useState, useRef, ChangeEvent } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowUp, FileText } from 'lucide-react'
import Tesseract from 'tesseract.js'

interface SearchInputProps {
  onSearch: (message?: string, audio?: any, tts?: boolean) => void
  disabled: boolean
}

export function SearchInput(props: SearchInputProps) {
  const { onSearch, disabled } = props

  const [value, setValue] = useState<string>("")
  const [ocrLoading, setOcrLoading] = useState<boolean>(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSearchChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    e.target.style.height = "auto"
    e.target.style.height = `${e.target.scrollHeight}px`
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submitText(value)
    }
  }

  const submitText = (v: string) => {
    if (!v.trim()) return
    onSearch(v, '', false)
    setValue("")
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
                  onClick={() => submitText(value)}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-black text-white"
                  disabled={disabled || !value.trim()}
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