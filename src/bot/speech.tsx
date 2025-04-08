// @refresh reset
import { useState, useEffect, useRef } from 'react'

export const useSpeech = () => {
    const [isSpeaking, setIsSpeaking] = useState(false)
    const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
    const chunksRef = useRef<string[]>([])
    const synthesisRef = useRef<SpeechSynthesis | null>(null)

    useEffect(() => {
        if (window.speechSynthesis) {
            synthesisRef.current = window.speechSynthesis

            if (synthesisRef.current.getVoices().length === 0) {
                synthesisRef.current.onvoiceschanged = () => {
                    console.log("Voices loaded:", synthesisRef.current.getVoices().length)
                }
            }

            const handleVisibilityChange = () => {
                if (document.hidden && isSpeaking) {
                    synthesisRef.current?.pause()
                } else if (isSpeaking) {
                    synthesisRef.current?.resume()
                }
            }

            document.addEventListener('visibilitychange', handleVisibilityChange)

            const handleBlur = () => {
                if (isSpeaking) synthesisRef.current?.pause()
            }

            const handleFocus = () => {
                if (isSpeaking) synthesisRef.current?.resume()
            }

            window.addEventListener('blur', handleBlur)
            window.addEventListener('focus', handleFocus)

            return () => {
                document.removeEventListener('visibilitychange', handleVisibilityChange)
                window.removeEventListener('blur', handleBlur)
                window.removeEventListener('focus', handleFocus)

                if (synthesisRef.current && isSpeaking) {
                    synthesisRef.current.cancel()
                }
            }
        }
    }, [isSpeaking])

    function detectLanguage(text: string): string {
        const patterns: Record<string, RegExp> = {
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
            if (pattern.test(text)) {
                return lang
            }
        }
        return 'en-US'
    }

    function getBestVoiceForLanguage(language: string): SpeechSynthesisVoice | null {
        if (!synthesisRef.current) return null

        const voices = synthesisRef.current.getVoices()
        if (!voices || voices.length === 0) return null

        interface VoicePattern {
            contains: string[]
            isGoogle?: boolean
            isNeural?: boolean
            forLang?: string
        }

        const preferredVoicePatterns: VoicePattern[] = [
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
                const voiceLang = voice.lang.toLowerCase()
                const voiceName = voice.name.toLowerCase()

                if (!voiceLang.startsWith(langCode)) continue

                if (pattern.contains.every(term => voiceName.includes(term.toLowerCase()))) {
                    return voice
                }
            }
        }

        const exactMatch = voices.find(voice => voice.lang.toLowerCase() === language.toLowerCase())
        if (exactMatch) return exactMatch

        const langMatch = voices.find(voice => voice.lang.toLowerCase().startsWith(langCode))
        if (langMatch) return langMatch

        return voices.find(voice => voice.default) || voices[0]
    }

    function splitTextIntoChunks(text: string, maxChunkLength = 200): string[] {
        const cleanedText = text
        .replace(/<[^>]+>/g, '')  
        .replace(/```[\s\S]*?```/g, 'Code block omitted.') 
        .replace(/https?:\/\/\S+/g, 'link') 
        .replace(/\n+/g, ' ')    
        .replace(/\s+/g, ' ')     
        .trim();

        const sentenceRegex = /[^.!?]+(?:[.!?](?=\s|$))?/g
        const sentences = cleanedText.match(sentenceRegex) || [cleanedText]

        const chunks: string[] = []
        let currentChunk = '';

        for (const sentence of sentences) {
            const trimmedSentence = sentence.trim()
            if (!trimmedSentence) continue

            if ((currentChunk + trimmedSentence).length <= maxChunkLength) {
                currentChunk += trimmedSentence + ' '
            } else {

                if (currentChunk.trim().length > 0) {
                    chunks.push(currentChunk.trim())
                }

                currentChunk = trimmedSentence + ' ';
            }
        }

        if (currentChunk.trim().length > 0) {
            chunks.push(currentChunk.trim())
        }

        return chunks
    }

    function speakChunks(chunks: string[], detectedLang: string): void {
        if (!synthesisRef.current || chunks.length === 0) return

        chunksRef.current = [...chunks]

        const speakNextChunk = () => {
            if (chunksRef.current.length === 0) {
                setIsSpeaking(false)
                return
            }

            const chunk = chunksRef.current.shift()!
            const utterance = new SpeechSynthesisUtterance(chunk)
            utteranceRef.current = utterance

            utterance.lang = detectedLang

            const bestVoice = getBestVoiceForLanguage(detectedLang)
            if (bestVoice) {
                utterance.voice = bestVoice
            }

            utterance.rate = 1.1
            utterance.pitch = 1.0
            utterance.volume = 1.0

            utterance.onend = () => {
                if (chunksRef.current.length > 0) {
                    speakNextChunk()
                } else {
                    setIsSpeaking(false)
                }
            }

            utterance.onerror = (event) => {
                console.error("Speech synthesis error:", event)
                if (chunksRef.current.length > 0) {
                    speakNextChunk()
                } else {
                    setIsSpeaking(false)
                }
            }

            synthesisRef.current.speak(utterance);
        }

        speakNextChunk()
    }

    function speakMessage(text: string): void {
        if (!synthesisRef.current) {
            console.error("Speech synthesis not supported in this browser")
            return
        }

        if (isSpeaking) {
            synthesisRef.current.cancel()
            chunksRef.current = []
            setIsSpeaking(false)
            return
        }

        const detectedLang = detectLanguage(text)
        const chunks = splitTextIntoChunks(text)

        if (chunks.length === 0) {
            console.warn("No text to speak")
            return
        }

        setIsSpeaking(true)
        speakChunks(chunks, detectedLang)
    }

    function stopSpeaking(): void {
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