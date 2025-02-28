"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { Mic, StopCircle } from "lucide-react"
import { useReactMediaRecorder } from "react-media-recorder"
import { api } from "@/api/getBots"
import "./comm.css"
import { Button } from "@/components/ui/button"

interface Props {
  bot: number
}

export function Comm(props: Props) {

  const { bot } = props
  const [state, setState] = useState<"ready" | "recoding" | "waiting" | "playing">("ready")
  const [audio, setAudio] = useState<string>(null)

  const {
    status,
    startRecording,
    stopRecording,
    mediaBlobUrl,
    clearBlobUrl,
  } = useReactMediaRecorder({ audio: true })



  async function onStart() {
    setState("recoding")
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


  let classNameColor = state === "recoding" ? "bg-red-500" : "bg-blue-500"

  if (state == "recoding" || state == "ready") {
    return <div className="w-full h-full bg-black text-white flex flex-col items-center justify-center content-center backgrad" >
      <div className="text-center flex-grow grid justify-center content-center">
        <div className={`shadow rounded-full p-4 mb-4 cursor-pointer ${classNameColor}`} onMouseDown={onStart} onMouseUp={onStop}>
          <Mic size={128} />
        </div>
        <div className="font-semibold tracking-wider shadow">
          PUSH TO TALK
        </div>
      </div>
    </div>
  }

  if (state === "waiting") {
    return <div className="w-full h-full text-white flex flex-col items-center justify-center content-center backgrad">
      <div className="">
        <svg
          className="svgDots w-full h-full ml-[20%]"
          x="0px" y="0px"
          viewBox="0 0 100 100">
          <circle fill="#fff" stroke="none" cx="6" cy="50" r="6">
            <animate
              attributeName="opacity"
              dur="1s"
              values="0;1;0"
              repeatCount="indefinite"
              begin="0.1" />
          </circle>
          <circle fill="#fff" stroke="none" cx="26" cy="50" r="6">
            <animate
              attributeName="opacity"
              dur="1s"
              values="0;1;0"
              repeatCount="indefinite"
              begin="0.2" />
          </circle>
          <circle fill="#fff" stroke="none" cx="46" cy="50" r="6">
            <animate
              attributeName="opacity"
              dur="1s"
              values="0;1;0"
              repeatCount="indefinite"
              begin="0.3" />
          </circle>
        </svg>
      </div>
    </div>
  }

  return <div className="w-full h-full bg-black text-white flex flex-col items-center justify-center content-center backgrad" >
    <SpeechVisualizer audio={audio} onEnd={() => setState("ready")} />
  </div>

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
        audioRef.current.play().then(() => {

        })
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

  return <div className="w-full h-full flex flex-col" >
    <div className="flex-grow flex justify-center items-center transition-all">
      {/* {ambars.map((i) => <div key={i} id={`sq${i + 1}`} style={{ height: frequencyData ? frequencyData[i] : 0 }} className="bg-white w-[24px] rounded-lg mx-2"></div>)} */}
      {ambars.map((i) => <div key={i} id={`sq${i + 1}`} style={{ height: frequencyData ? frequencyData[i] : 0, width: width }} className="bg-white rounded-lg mx-2"></div>)}
    </div>
    <div>
      <div className="grid justify-center content-center mb-4 cursor-pointer" onClick={onStop}>
        <StopCircle size={64} color="red" className="shadow" />
      </div>
      <audio className="hidden" ref={audioRef} controls onEnded={onStop} />
    </div>
  </div>


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