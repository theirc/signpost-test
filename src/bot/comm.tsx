"use client"

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { Mic, MicOff, X } from "lucide-react"
import { useReactMediaRecorder } from "react-media-recorder"
import { api } from "@/api/getBots"
import "./comm.css"
import { Button } from "@/components/ui/button"
import * as motion from "motion/react-client"

function PulsatingCircle({ color = "#a5b4fc " }: { color?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: [1, 0.7, 1], 
        scale: [1, 1.1, 1] 
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        repeatType: "loop",
      }}
      style={{
        width: 100,
        height: 100,
        backgroundColor: color,
        borderRadius: "50%",
      }}
    />
  )
}

function useSilenceDetection({ onSilenceDetected, active, silenceThreshold = 0.01, silenceDuration = 1500, detectionDelay = 500, speechStartMultiplier = 3, minRecordingDuration = 1000, }: { onSilenceDetected: () => void
  active: boolean
  silenceThreshold?: number
  silenceDuration?: number
  detectionDelay?: number
  speechStartMultiplier?: number
  minRecordingDuration?: number
}) {
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const silenceStartRef = useRef<number | null>(null)
  const rafIdRef = useRef<number | null>(null)
  const detectionEnabledRef = useRef<boolean>(false)
  const hasSpokenRef = useRef<boolean>(false)
  const recordingStartRef = useRef<number>(0)

  useEffect(() => {
    if (!active) {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
      return
    }

    const checkSilence = () => {
      if (!active) return

      if (!detectionEnabledRef.current) {
        rafIdRef.current = requestAnimationFrame(checkSilence)
        return
      }

      if (!analyserRef.current || !dataArrayRef.current) {
        rafIdRef.current = requestAnimationFrame(checkSilence)
        return
      }

      analyserRef.current.getByteTimeDomainData(dataArrayRef.current)
      let sum = 0
      for (let i = 0; i < dataArrayRef.current.length; i++) {
        const normalized = dataArrayRef.current[i] / 128 - 1
        sum += Math.abs(normalized)
      }
      const average = sum / dataArrayRef.current.length

      if (Date.now() - recordingStartRef.current < minRecordingDuration) {
        rafIdRef.current = requestAnimationFrame(checkSilence)
        return
      }

      if (!hasSpokenRef.current) {
        if (average > silenceThreshold * speechStartMultiplier) {
          hasSpokenRef.current = true
        }
        rafIdRef.current = requestAnimationFrame(checkSilence)
        return
      }

      if (average < silenceThreshold) {
        if (!silenceStartRef.current) {
          silenceStartRef.current = Date.now()
        } else if (Date.now() - silenceStartRef.current > silenceDuration) {
          onSilenceDetected()
          return
        }
      } else {
        silenceStartRef.current = null
      }

      rafIdRef.current = requestAnimationFrame(checkSilence)
    }

    recordingStartRef.current = Date.now()

    const timeoutId = setTimeout(() => {
      detectionEnabledRef.current = true
    }, detectionDelay)

    checkSilence()

    return () => {
      clearTimeout(timeoutId)
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
    }
  }, [
    active,
    onSilenceDetected,
    silenceThreshold,
    silenceDuration,
    detectionDelay,
    speechStartMultiplier,
    minRecordingDuration,
  ])

  const initAnalyser = (mediaStream: MediaStream) => {
    detectionEnabledRef.current = false
    hasSpokenRef.current = false
    recordingStartRef.current = Date.now()
    const audioContext = new AudioContext()
    const source = audioContext.createMediaStreamSource(mediaStream)
    const analyser = audioContext.createAnalyser()
    analyser.fftSize = 1024
    analyserRef.current = analyser
    dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount)
    silenceStartRef.current = null
    setTimeout(() => {
      detectionEnabledRef.current = true
    }, detectionDelay)
    source.connect(analyser)
  }

  return { initAnalyser }
}

interface Props {
  bot: number
  onExit?: () => void
}

export function Comm({ bot, onExit }: Props) {
  const [state, setState] = useState<"ready" | "recording" | "waiting" | "playing">("ready")
  const [audio, setAudio] = useState<string | null>(null)

  const {
    status,
    startRecording,
    stopRecording,
    mediaBlobUrl,
    clearBlobUrl,
  } = useReactMediaRecorder({ audio: true })

  const mediaStreamRef = useRef<MediaStream | null>(null)

  const { initAnalyser } = useSilenceDetection({
    onSilenceDetected: () => {
      if (state === "recording") {
        setState("waiting")
        stopRecording()
      }
    },
    active: state === "recording",
    silenceThreshold: 0.01,
    silenceDuration: 1500,
    detectionDelay: 500,
  })

  async function handleStartRecording() {
    setState("recording")
    clearBlobUrl()

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      mediaStreamRef.current = stream
      initAnalyser(stream)
      startRecording()
    } catch (err) {
      console.error("Error accessing mic: ", err)
    }
  }

  function handleManualStop(){
    if(state === "recording") {
      setState("waiting")
      stopRecording()
    }
  }

  async function handleRecordingStop() {
    if (!mediaBlobUrl) return
    try {
      const response = await fetch(mediaBlobUrl)
      const blob = await response.blob()
      const audioBase64 = await blobToBase64(blob)

      const { messages } = await api.askbot({ audio: audioBase64 }, true, [
        { label: "", value: bot, history: [] },
      ])

      setAudio(messages[0].message)

      clearBlobUrl()
      setState("playing")
    } catch (err) {
      console.error("Error processing recording:", err)
    }
  }

  useEffect(() => {
    if (status === "stopped" && mediaBlobUrl) {
      handleRecordingStop()
    }
  }, [status, mediaBlobUrl])

  let micIcon = <Mic size={20} color="gray"/>
  let micDisabled = false
  let micOnClick = () => {}

  if (state === "ready") {
    micIcon = <Mic size={20} color="gray" />
    micOnClick = handleStartRecording
  } else if (state === "recording") {
    micIcon = <Mic size={20} color="red" />
    micOnClick = handleManualStop 
  } else if (state === "waiting") {
    micIcon = <Mic size={20} color="gray" />
    micDisabled = true
  } else if (state === "playing") {
    micIcon = <MicOff size={20} color="red" />
    micDisabled = true
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center relative backgrad mt-60">
      <div className="flex flex-col items-center justify-center">
        {state === "ready" || state === "recording" ? (
          <PulsatingCircle color={state === "recording" ? "#a5b4fc" : "#a5b4fc"} />
        ) : null}

        {state === "waiting" ? (
          <svg
            className="mb-8 w-40 h-20 waiting-dots"
            x="0px"
            y="0px"
            viewBox="0 0 120 40"
          >
            <circle cx="20" cy="20" r="12">
              <animate
                attributeName="opacity"
                dur="1s"
                values="0;1;0"
                repeatCount="indefinite"
                begin="0.1"
              />
            </circle>
            <circle cx="60" cy="20" r="12">
              <animate
                attributeName="opacity"
                dur="1s"
                values="0;1;0"
                repeatCount="indefinite"
                begin="0.2"
              />
            </circle>
            <circle cx="100" cy="20" r="12">
              <animate
                attributeName="opacity"
                dur="1s"
                values="0;1;0"
                repeatCount="indefinite"
                begin="0.3"
              />
            </circle>
          </svg>
        ) : null}

        {state === "playing" ? (
          // Bot's response audio + visualization
          <SpeechVisualizer
            audio={audio}
            onEnd={() => {
              setState("ready")
            }}
          />
        ) : null}
      </div>
      <div className="fixed bottom-4 w-full flex items-center justify-center gap-2 z-10">
        <Button
          onClick={!micDisabled ? micOnClick : undefined}
          variant="outline"
          size="sm"
          disabled={micDisabled}
        >
          {micIcon}
        </Button>
        <Button onClick={onExit} variant="outline" size="sm">
          <X size={20} />
        </Button>
      </div>
    </div>
  )
}

interface SpeechVisualizerProps {
  audio: string | null
  onEnd: () => void
}

function SpeechVisualizer({ audio, onEnd }: SpeechVisualizerProps) {
  const [frequencyData, setFrequencyData] = useState<Uint8Array | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataArrayRef = useRef<Uint8Array | null>(null)
  const mounted = useRef(false)

  const base64ToBlob = (base64: string, contentType = "audio/wav", sliceSize = 512) => {
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

    const audioBlob = new Blob(byteArrays, { type: contentType })
    return URL.createObjectURL(audioBlob)
  }

  const onStop = () => {
    if (audioRef.current) {
      try {
        audioRef.current.pause()
        audioRef.current.currentTime = 0
      } catch (err) {}
    }
    onEnd()
  };

  const setupAudio = async () => {
    if (audioRef.current && audio && !analyserRef.current && !dataArrayRef.current) {
      const player = audioRef.current
      const blobUrl = base64ToBlob(audio)
      player.pause()
      player.src = blobUrl

      const audioContext = new AudioContext()
      const source = audioContext.createMediaElementSource(player)
      const analyser = audioContext.createAnalyser()
      analyser.fftSize = 512
      analyser.smoothingTimeConstant = 0.3

      analyserRef.current = analyser
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount)

      source.connect(analyser)
      analyser.connect(audioContext.destination)

      const updateVisualization = () => {
        if (!mounted.current || !analyserRef.current || !dataArrayRef.current) return
        analyserRef.current.getByteFrequencyData(dataArrayRef.current)
        setFrequencyData(new Uint8Array(dataArrayRef.current))
        requestAnimationFrame(updateVisualization)
      }
      updateVisualization()
    }
  }

  useEffect(() => {
    mounted.current = true
    if (audioRef.current && audio) {
      setupAudio().then(() => {
        audioRef.current!.play().catch(console.error)
      })
    }
    return () => {
      mounted.current = false
    }
  }, [audio])

  let bars = 50
  const barArray = Array.from({ length: bars }, (_, i) => i)

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex-grow flex justify-center items-center transition-all">
        {barArray.map((i) => {
          const height = frequencyData ? frequencyData[i] : 0;
          return (
            <div
              key={i}
              style={{
                height,
                width: 6,
                backgroundColor: "#a5b4fc",
                margin: "0 2px",
              }}
              className="rounded"
            />
          )
        })}
      </div>
      <div className="text-center">
        <audio className="hidden" ref={audioRef} onEnded={onStop} />
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
    window.addEventListener("resize", updateSize)
    updateSize()
    return () => window.removeEventListener("resize", updateSize)
  }, [])
  return size
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

