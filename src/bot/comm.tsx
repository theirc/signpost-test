"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Mic, StopCircle } from "lucide-react";
import { useReactMediaRecorder } from "react-media-recorder";
import { api } from "@/api/getBots";
import { Button } from "@/components/ui/button";

interface Props {
  bot: number;
}

export function Comm({ bot }: Props) {
  const [state, setState] = useState<"ready" | "recording" | "waiting" | "playing">("ready");
  const [audio, setAudio] = useState<string | null>(null);

  const { status, startRecording, stopRecording, mediaBlobUrl, clearBlobUrl } = useReactMediaRecorder({ audio: true });

  async function onStart() {
    setState("recording");
    clearBlobUrl();
    startRecording();
  }

  const onStop = () => {
    setState("waiting");
    stopRecording();
  };

  const handleRecordingStop = async () => {
    if (mediaBlobUrl) {
      try {
        const response = await fetch(mediaBlobUrl);
        const blob = await response.blob();
        const base64Audio = await blobToBase64(blob);

        const { messages } = await api.askbot({ audio: base64Audio }, true, [{ label: "", value: bot, history: [] }]);
        setAudio(messages[0].message);

        clearBlobUrl();
        setState("playing");
      } catch (error) {
        console.error("Error processing the recording: ", error);
      }
    }
  };

  useEffect(() => {
    if (status === "stopped" && mediaBlobUrl) {
      handleRecordingStop();
    }
  }, [status, mediaBlobUrl]);

  return (
    <div className="w-full h-full bg-black text-white flex flex-col items-center justify-center p-6">
      {state === "ready" || state === "recording" ? (
        <div className="text-center">
          <Button
            onMouseDown={onStart}
            onMouseUp={onStop}
            className={`rounded-full p-6 shadow-lg ${state === "recording" ? "bg-red-500" : "bg-blue-500"}`}
          >
            <Mic size={64} />
          </Button>
          <p className="mt-4 text-lg font-semibold">Hold to Speak</p>
        </div>
      ) : state === "waiting" ? (
        <div className="flex justify-center">
          <Loader />
        </div>
      ) : (
        <SpeechVisualizer audio={audio} onEnd={() => setState("ready")} />
      )}
    </div>
  );
}

function Loader() {
  return (
    <div className="flex space-x-2">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-3 h-3 bg-white rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.2}s` }}
        ></div>
      ))}
    </div>
  );
}

interface SpeechVisualizerProps {
  audio: string | null;
  onEnd: () => void;
}

function SpeechVisualizer({ audio, onEnd }: SpeechVisualizerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playAudio = () => {
    if (audio && audioRef.current) {
      const audioSrc = `data:audio/wav;base64,${audio}`;
      audioRef.current.src = audioSrc;
      audioRef.current.play();
    }
  };

  useEffect(() => {
    if (audioRef.current) {
      playAudio();
    }
  }, [audio]);

  return (
    <div className="flex flex-col items-center">
      <p className="text-lg">Playing Response...</p>
      <Button variant="destructive" onClick={onEnd} className="mt-4">
        <StopCircle size={32} />
      </Button>
      <audio ref={audioRef} onEnded={onEnd} className="hidden" />
    </div>
  );
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function useWindowSize() {
  const [size, setSize] = useState([0, 0])

  useLayoutEffect(() => {
    function updateSize() {
      setSize([window.innerWidth, window.innerHeight])
    }
    window.addEventListener("resize", updateSize)
    updateSize();
    return () => window.removeEventListener("resize", updateSize)
  }, []);

  return size
}