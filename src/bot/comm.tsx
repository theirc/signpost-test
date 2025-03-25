"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { Mic, X } from "lucide-react"
import { useReactMediaRecorder } from "react-media-recorder"
import { api } from "@/api/getBots"
import "./comm.css"
import { Button } from "@/components/ui/button"

interface Props {
  bot: number
  onSend?: (message?: string, audio?: any, tts?: boolean) => void
  onExit?: () => void
}

export function Comm(props: Props) {
  const { bot, onExit, onSend } = props
  const [state, setState] = useState<"ready" | "recording" | "waiting" | "playing">("ready")
  const [audio, setAudio] = useState<string>(null)

  const {
    status,
    startRecording,
    stopRecording,
    mediaBlobUrl,
    clearBlobUrl,
  } = useReactMediaRecorder({ audio: true })

  async function onStart() {
    setState("recording")
    clearBlobUrl()
    startRecording()
  }

  const onStop = () => {
    setState("waiting")
    stopRecording()
  }

  const handleRecordingStop = async () => {
    if (mediaBlobUrl) {
      try {
        const response = await fetch(mediaBlobUrl)
        const blob = await response.blob()
        const audio = await blobToBase64(blob)

        const { messages } = await api.askbot({ audio }, true, [{ label: "", value: bot, history: [] }])
        setAudio(messages[0].message)

        clearBlobUrl()
        setState("playing")
      } catch (error) {
        console.error("Error processing the recording: ", error)
      }
    }
  }

  useEffect(() => {
    if (status === "stopped" && mediaBlobUrl) {
      handleRecordingStop()
    }
  }, [status, mediaBlobUrl])

  if (state == "recording" || state == "ready") {
    return (
      <div className="w-full h-full bg-white text-gray-800 flex flex-col items-center justify-center content-center">
        <div className="text-center flex flex-col items-center justify-center">
          <div 
            className={`p-8 cursor-pointer mic-button ${
              state === "recording" ? 'mic-button-recording' : 'mic-button-ready'
            }`} 
            onMouseDown={onStart} 
            onMouseUp={onStop}
          >
            <div className="mic-inner-circle">
              <Mic size={100} className="mic-icon" />
            </div>
          </div>
          <div className="font-semibold tracking-wider text-gray-800 mb-8 mt-8">
            Push to talk
          </div>
          <div className="exit-button-container">
            <Button 
            onClick={onExit} 
            variant="outline" 
            size="sm"
            className="exit-button" >
            <X size={20} />
          </Button>
          </div>
        </div>
      </div>
    )
  }

  if (state === "waiting") {
    return (
      <div className="w-full h-full bg-white text-gray-800 flex flex-col items-center justify-center content-center">
      <div className="flex flex-col items-center justify-center">
        <svg
          className="mb-8 w-40 h-20 waiting-dots"
          x="0px" y="0px"
          viewBox="0 0 120 40">
          <circle cx="20" cy="20" r="12" fill="#a5b4fc">
            <animate
              attributeName="opacity"
              dur="1s"
              values="0;1;0"
              repeatCount="indefinite"
              begin="0.1" />
          </circle>
          <circle cx="60" cy="20" r="12" fill="#a5b4fc">
            <animate
              attributeName="opacity"
              dur="1s"
              values="0;1;0"
              repeatCount="indefinite"
              begin="0.2" />
          </circle>
          <circle cx="100" cy="20" r="12" fill="#a5b4fc">
            <animate
              attributeName="opacity"
              dur="1s"
              values="0;1;0"
              repeatCount="indefinite"
              begin="0.3" />
          </circle>
        </svg>
        <div className="exit-button-container">
        <Button 
          onClick={onExit} 
          variant="outline" 
          size="sm"
          className="exit-button" >
          <X size={20} />
        </Button>
        </div>
      </div>
    </div>
  )
}

  return (
    <div className="w-full h-full bg-white text-gray-800 flex flex-col items-center justify-center content-center">
      <div className="flex flex-col items-center w-full max-w-2xl">
        <SpeechVisualizer audio={audio} onEnd={() => setState("ready")} />
          <div className="exit-button-container">
        <Button 
          onClick={onExit} 
          variant="outline" 
          size="sm"
          className="exit-button">
          <X size={20} className="bg-gray-50" />
        </Button>
        </div>
      </div>
    </div>
  )
}

interface SpeechVisualizerProps {
  audio: string
  onEnd: () => void
}

function SpeechVisualizer({ audio, onEnd }: SpeechVisualizerProps) {
  const [frequencyData, setFrequencyData] = useState<Uint8Array | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const mounted = useRef(false)

  const base64ToBlob = (base64: string, contentType = 'audio/wav', sliceSize = 512) => {
    const byteCharacters = atob(base64)
    const byteArrays: Uint8Array[] = []

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize)

      const byteNumbers = new Array(slice.length)
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i)
      }

      const byteArray = new Uint8Array(byteNumbers)
      byteArrays.push(byteArray)
    }

    const audio = new Blob(byteArrays, { type: contentType })

    return URL.createObjectURL(audio)
  }

  const onStop = () => {
    if (audioRef.current) {
      try {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      } catch (err) {
      }
    }
    onEnd()
  }

  const setupAudio = async () => {
    if (audioRef.current && !analyserRef.current && !dataArrayRef.current) {
      const player = audioRef.current
      const blob = base64ToBlob(audio)
      player.pause()
      player.src = blob

      const audioContext = new AudioContext()
      const source = audioContext.createMediaElementSource(player)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 1024
      analyserRef.current = analyser
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount)

      source.connect(analyser)
      analyser.connect(audioContext.destination)

      const updateVisualization = () => {
        if (analyserRef.current && dataArrayRef.current) {
          analyserRef.current.getByteFrequencyData(dataArrayRef.current)
          setFrequencyData(new Uint8Array(dataArrayRef.current))
          if (!mounted.current) return
          requestAnimationFrame(updateVisualization)
        }
      }
      updateVisualization()
    }
  }

  const size = useWindowSize()

  useEffect(() => {
    mounted.current = true

    if (audioRef.current) {
      try {
        audioRef.current.pause()
      } catch (error) { }
      setupAudio().then(() => {
        audioRef.current.play().then(() => {})
      })
    }

    return () => {
      mounted.current = false
    }
  }, [])

  let bars = Math.floor(size[0] / 64)
  let width = Math.floor(size[0] / 100) + 1
  if (bars < 8) bars = 8
  if (width < 12) width = 12

  const ambars = Array.from({ length: bars }, (_, i) => i)

  return (
    <div className="w-full h-full flex flex-col">
    <div className="flex-grow flex justify-center items-center transition-all">
      {ambars.map((i) => (
        <div 
          key={i} 
          id={`sq${i + 1}`} 
          style={{ 
            height: frequencyData ? frequencyData[i] : 0, 
            width: width,
            backgroundColor: "#a5b4fc"
          }} 
          className="rounded-lg mx-1"
        ></div>
      ))}
    </div>
    <div className="text-center">
      <audio className="hidden" ref={audioRef} controls onEnded={onStop} />
    </div>
  </div>
)
}

function useWindowSize() {
  const [size, setSize] = useState([0, 0])
  useLayoutEffect(() => {
    function updateSize() {
      setSize([window.innerWidth, window.innerHeight])
    }
    window.addEventListener('resize', updateSize)
    updateSize()
    return () => window.removeEventListener('resize', updateSize)
  }, [])
  return size
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}