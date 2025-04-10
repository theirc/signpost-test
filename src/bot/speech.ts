// @refresh reset
import { useState, useEffect, useRef } from 'react'

export function useSpeech() {
  const [isSpeaking, setIsSpeaking] = useState(false)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const chunksRef = useRef<string[]>([])
  const synthesisRef = useRef<SpeechSynthesis | null>(null)
  const retryCountRef = useRef(0)

  useEffect(() => {
    if (window.speechSynthesis) {
      synthesisRef.current = window.speechSynthesis

      // Ensure voices are loaded
      if (synthesisRef.current.getVoices().length === 0) {
        synthesisRef.current.onvoiceschanged = () => {
          console.log("Voices loaded:", synthesisRef.current?.getVoices().length)
        }
      }

      const handleVisibilityChange = () => {
        if (isSpeaking) {
          if (document.hidden) {
            synthesisRef.current?.pause()
          } else {
            synthesisRef.current?.resume()
          }
        }
      }

      document.addEventListener('visibilitychange', handleVisibilityChange)

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        if (synthesisRef.current && isSpeaking) {
          synthesisRef.current.cancel()
        }
      }
    }
  }, [isSpeaking])

  function detectLanguage(text: string) {
    const patterns: { [key: string]: RegExp } = {
      'en-US': /^[a-zA-Z0-9\s.,!?'";:)(]+$/,
      'es-ES': /[áéíóúüñ¿¡]/i,
      'fr-FR': /[àâäæçéèêëîïôœùûüÿ]/i,
      'de-DE': /[äöüß]/i,
      'zh-CN': /[\u4e00-\u9fff]/,
      'ja-JP': /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff]/,
      'ko-KR': /[\uAC00-\uD7AF\u1100-\u11FF]/,
      'ar-SA': /[\u0600-\u06FF]/,
      'hi-IN': /[\u0900-\u097F]/,
      'ru-RU': /[\u0400-\u04FF]/,
    }

    for (const [lang, pattern] of Object.entries(patterns)) {
      if (pattern.test(text)) return lang
    }
    return 'en-US'
  }

  function getBestVoiceForLanguage(language: string) {
    if (!synthesisRef.current) return null

    const voices = synthesisRef.current.getVoices()
    if (!voices || voices.length === 0) return null

    const preferredVoicePatterns = [
      { contains: ["Google", language.split('-')[0]], isGoogle: true },
      { contains: ["Neural", language.split('-')[0]], isNeural: true },
      { contains: ["Daniel"], forLang: "en" },
      { contains: ["Samantha"], forLang: "en" },
      { contains: ["Allison"], forLang: "en" },
      { contains: ["Jorge"], forLang: "es" },
      { contains: ["Thomas"], forLang: "fr" },
      { contains: ["Yuna"], forLang: "ko" }
    ]

    const langCode = language.split('-')[0].toLowerCase()

    for (const pattern of preferredVoicePatterns) {
      if (pattern.forLang && pattern.forLang !== langCode) continue

      for (const voice of voices) {
        if (!voice.lang) continue;
        const voiceLang = voice.lang.toLowerCase()
        const voiceName = voice.name.toLowerCase()

        if (!voiceLang.startsWith(langCode)) continue

        if (pattern.contains.every(term => voiceName.includes(term.toLowerCase()))) {
          return voice
        }
      }
    }

    const exactMatch = voices.find(voice => voice.lang && voice.lang.toLowerCase() === language.toLowerCase())
    if (exactMatch) return exactMatch

    const langMatch = voices.find(voice => voice.lang && voice.lang.toLowerCase().startsWith(langCode))
    if (langMatch) return langMatch

    return voices.find(voice => voice.default) || voices[0]
  }

  function cleanTextForSpeech(text: string) {
    return text
      .replace(/<[^>]+>/g, '')
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/https?:\/\/\S+/g, 'link')
      .replace(/[^\w\s.,;:?!'"\(\)\-\u0080-\uFFFF]/g, ' ')
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, ' ')
      .trim();
  }

  function splitTextIntoChunks(text: string, maxChunkLength = 150) {
    const cleanedText = cleanTextForSpeech(text)
    const sentenceRegex = /[^.!?]+(?:[.!?](?=\s|$))?/g;
    const sentences = cleanedText.match(sentenceRegex) || [cleanedText]

    const chunks: string[] = []
    let currentChunk = ''

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim()
      if (!trimmedSentence) continue

      if (trimmedSentence.length > maxChunkLength) {
        if (currentChunk.trim().length > 0) {
          chunks.push(currentChunk.trim())
          currentChunk = ''
        }
        const parts = trimmedSentence.split(/([,;:])/).filter(Boolean)
        let partChunk = ''

        for (const part of parts) {
          if ((partChunk + part).length <= maxChunkLength) {
            partChunk += part
          } else {
            if (partChunk.trim().length > 0) chunks.push(partChunk.trim());
            partChunk = part
          }
        }
        if (partChunk.trim().length > 0) currentChunk = partChunk.trim() + ' '
      } else if ((currentChunk + trimmedSentence).length <= maxChunkLength) {
        currentChunk += trimmedSentence + ' '
      } else {
        if (currentChunk.trim().length > 0) chunks.push(currentChunk.trim());
        currentChunk = trimmedSentence + ' '
      }
    }

    if (currentChunk.trim().length > 0) chunks.push(currentChunk.trim())

    return chunks
  }

  function speakChunks(chunks: string[], detectedLang: string) {
    if (!synthesisRef.current || chunks.length === 0) {
      setIsSpeaking(false)
      return
    }

    chunksRef.current = [...chunks]
    retryCountRef.current = 0

    const speakNextChunk = () => {
      if (!synthesisRef.current || chunksRef.current.length === 0) {
        setIsSpeaking(false)
        return
      }

      const chunk = chunksRef.current.shift()
      if (!chunk || chunk.trim() === '') {
        if (chunksRef.current.length > 0) {
          setTimeout(speakNextChunk, 10)
        } else {
          setIsSpeaking(false)
        }
        return
      }

      let utterance: SpeechSynthesisUtterance
      try {
        utterance = new SpeechSynthesisUtterance(chunk)
        utteranceRef.current = utterance
        utterance.lang = detectedLang

        const bestVoice = getBestVoiceForLanguage(detectedLang)
        if (bestVoice) {
          utterance.voice = bestVoice
        }

        utterance.rate = 1.0
        utterance.pitch = 1.0
        utterance.volume = 1.0

        const safetyTimeout = setTimeout(() => {
          console.log("Safety timeout triggered - onend event may not have fired")
          if (chunksRef.current.length > 0) speakNextChunk()
          else setIsSpeaking(false)
        }, (chunk.length * 100) + 1000)

        utterance.onend = () => {
          clearTimeout(safetyTimeout)
          retryCountRef.current = 0
          setTimeout(() => {
            if (chunksRef.current.length > 0) speakNextChunk()
            else setIsSpeaking(false)
          }, 50)
        };

        utterance.onerror = (event) => {
          clearTimeout(safetyTimeout)
          console.error("Speech synthesis error:", event)
          setTimeout(() => {
            if (retryCountRef.current < 2) {
              retryCountRef.current++;
              console.log(`Retry attempt ${retryCountRef.current} for failed chunk`)
              if (chunksRef.current.length > 0) speakNextChunk()
              else setIsSpeaking(false)
            } else {
              setIsSpeaking(false)
            }
          }, 50)
        }

        synthesisRef.current.cancel()
        synthesisRef.current.speak(utterance)
      } catch (e) {
        console.error("Exception during speech synthesis setup:", e)
        setTimeout(() => {
          if (chunksRef.current.length > 0) {
            speakNextChunk()
          } else {
            setIsSpeaking(false)
          }
        }, 100)
      }
    };

    speakNextChunk()
  }

  function speakMessage(text: string) {
    if (!synthesisRef.current) {
      console.error("Speech synthesis not supported in this browser")
      return
    }

    if (isSpeaking) {
      synthesisRef.current.cancel()
      chunksRef.current = []
      setIsSpeaking(false)
      return;
    }

    const cleanedText = cleanTextForSpeech(text)
    const detectedLang = detectLanguage(cleanedText)
    const chunks = splitTextIntoChunks(cleanedText)

    if (chunks.length === 0) {
      console.warn("No text to speak")
      return
    }

    setIsSpeaking(true)

    setTimeout(() => {
      speakChunks(chunks, detectedLang)
    }, 100)
  }

  function stopSpeaking() {
    if (synthesisRef.current) {
      synthesisRef.current.cancel()
      chunksRef.current = []
      setIsSpeaking(false)
    }
  }

  return {
    isSpeaking,
    speakMessage,
    stopSpeaking
  }
}
