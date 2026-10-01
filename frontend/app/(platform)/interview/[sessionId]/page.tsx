"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Phone,
  MessageSquare,
  Clock,
  Send,
  Volume2,
  Sparkles,
  Loader2,
  Settings,
  Check,
  Play,
  Square,
  Maximize2,
  Minimize2,
  AlertTriangle,
  ShieldAlert,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useInterviewSession } from "@/lib/api/queries/interviews";
import { useInterviewSocket, QuestionData } from "@/lib/hooks/useInterviewSocket";
import toast from "react-hot-toast";

interface Message {
  id: string;
  role: "ai" | "candidate";
  content: string;
  timestamp: Date;
  isWarning?: boolean;
  warningType?: "off_topic" | "abusive";
}

export default function InterviewRoomPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  // Query interview session from backend to obtain the session token
  const { data: sessionData, isLoading: sessionLoading } = useInterviewSession(sessionId);
  const sessionToken = sessionData?.sessionToken || sessionId;

  // Local state
  const [isRecording, setIsRecording] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [messages, setMessages] = useState<Message[]>([]);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [textAnswer, setTextAnswer] = useState("");

  // Fullscreen & Proctoring (Tab/Screen Change Detection)
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [proctorWarnings, setProctorWarnings] = useState(0);

  const lastWarningTimeRef = useRef<number>(0);
  const proctorWarningsRef = useRef<number>(0);
  const isTerminatedRef = useRef<boolean>(false);

  useEffect(() => {
    proctorWarningsRef.current = proctorWarnings;
  }, [proctorWarnings]);

  // Voice Customization State
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceURI, setSelectedVoiceURI] = useState<string>("");
  const [speechRate, setSpeechRate] = useState<number>(0.98);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [previewingVoiceURI, setPreviewingVoiceURI] = useState<string | null>(null);

  // Refs for stable callback access
  const selectedVoiceURIRef = useRef<string>("");
  const availableVoicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const speechRateRef = useRef<number>(0.98);

  useEffect(() => {
    selectedVoiceURIRef.current = selectedVoiceURI;
  }, [selectedVoiceURI]);

  useEffect(() => {
    availableVoicesRef.current = availableVoices;
  }, [availableVoices]);

  useEffect(() => {
    speechRateRef.current = speechRate;
  }, [speechRate]);

  // Load available browser speech synthesis voices
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      if (!allVoices || allVoices.length === 0) return;

      const enVoices = allVoices.filter(
        (v) => v.lang.startsWith("en") || v.lang.startsWith("en-"),
      );
      const list = enVoices.length > 0 ? enVoices : allVoices;
      setAvailableVoices(list);

      const savedURI = localStorage.getItem("sensei_interviewer_voice");
      const savedRate = localStorage.getItem("sensei_speech_rate");
      if (savedRate) {
        setSpeechRate(parseFloat(savedRate) || 0.98);
      }

      if (savedURI && list.some((v) => v.voiceURI === savedURI)) {
        setSelectedVoiceURI(savedURI);
      } else {
        // Auto-select realistic natural / neural voice
        const naturalVoice =
          list.find((v) => v.name.toLowerCase().includes("natural") && v.name.toLowerCase().includes("jenny")) ||
          list.find((v) => v.name.toLowerCase().includes("natural") && v.name.toLowerCase().includes("guy")) ||
          list.find((v) => v.name.toLowerCase().includes("natural")) ||
          list.find((v) => v.name.toLowerCase().includes("google") && v.lang === "en-US") ||
          list.find((v) => v.name.toLowerCase().includes("google")) ||
          list.find((v) => v.lang === "en-US") ||
          list[0];

        if (naturalVoice) {
          setSelectedVoiceURI(naturalVoice.voiceURI);
        }
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const handleTestVoice = (voiceURI: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    setPreviewingVoiceURI(voiceURI);

    const testUtterance = new SpeechSynthesisUtterance(
      "Hello! I am your Sensei technical interviewer. Let's begin the evaluation.",
    );
    const voice = availableVoicesRef.current.find((v) => v.voiceURI === voiceURI);
    if (voice) testUtterance.voice = voice;
    testUtterance.rate = speechRateRef.current || 0.98;
    testUtterance.pitch = 1.0;

    testUtterance.onend = () => setPreviewingVoiceURI(null);
    testUtterance.onerror = () => setPreviewingVoiceURI(null);

    window.speechSynthesis.speak(testUtterance);
  };

  const handleSelectVoice = (voiceURI: string) => {
    setSelectedVoiceURI(voiceURI);
    localStorage.setItem("sensei_interviewer_voice", voiceURI);
    handleTestVoice(voiceURI);
  };

  const selectedVoice = availableVoices.find((v) => v.voiceURI === selectedVoiceURI);
  const currentVoiceLabel = selectedVoice
    ? selectedVoice.name
        .replace(/Microsoft |Google |\(United States\)|\(United Kingdom\)/gi, "")
        .trim()
    : "Natural Voice";

  // Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordStartTimeRef = useRef<number>(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Socket.io integration
  const {
    isConnected,
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    submitAnswer,
    endInterview,
  } = useInterviewSocket({
    sessionToken,
    isVoiceMode: true,
    onQuestion: (qData: QuestionData) => {
      setIsAIThinking(false);
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last && last.role === "ai" && last.content.trim() === qData.question.trim()) {
          return prev;
        }
        return [
          ...prev,
          {
            id: `${Date.now()}-${qData.questionIndex}`,
            role: "ai",
            content: qData.question,
            timestamp: new Date(),
            isWarning: qData.isWarning,
            warningType: qData.warningType,
          },
        ];
      });

      // Play AI Voice TTS if provided, otherwise fallback to native browser speech synthesis
      if (qData.questionAudio) {
        setIsAISpeaking(true);
        try {
          if (audioPlayerRef.current) {
            audioPlayerRef.current.pause();
          }
          const audio = new Audio(`data:audio/mp3;base64,${qData.questionAudio}`);
          audioPlayerRef.current = audio;
          audio.onended = () => setIsAISpeaking(false);
          audio.play().catch((err) => {
            console.warn("Audio autoplay blocked by browser policy:", err);
            setIsAISpeaking(false);
          });
        } catch {
          setIsAISpeaking(false);
        }
      } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(qData.question);
          if (selectedVoiceURIRef.current) {
            const chosen = availableVoicesRef.current.find(
              (v) => v.voiceURI === selectedVoiceURIRef.current,
            );
            if (chosen) utterance.voice = chosen;
          }
          utterance.rate = speechRateRef.current || 0.98;
          utterance.pitch = 1.0;
          setIsAISpeaking(true);
          utterance.onend = () => setIsAISpeaking(false);
          utterance.onerror = () => setIsAISpeaking(false);
          window.speechSynthesis.speak(utterance);
        } catch {
          setIsAISpeaking(false);
        }
      }
    },
    onWarning: () => {
      setIsAIThinking(false);
    },
    onTranscription: (transData) => {
      setMessages((prev) => {
        const exists = prev.some(
          (m) => m.role === "candidate" && m.content === transData.transcription,
        );
        if (exists) return prev;
        return [
          ...prev,
          {
            id: Date.now().toString(),
            role: "candidate",
            content: transData.transcription,
            timestamp: new Date(),
          },
        ];
      });
      setIsAIThinking(true);
    },
    onCompleted: () => {
      router.push(`/interview/${sessionId}/results`);
    },
    onTimeout: () => {
      router.push(`/interview/${sessionId}/results`);
    },
  });

  // Elapsed Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Initialize camera preview
  useEffect(() => {
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.warn("Camera/Mic not available:", error);
      }
    };

    initCamera();

    return () => {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  // Scroll to bottom of message feed
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Toggle Voice Recording
  const toggleRecording = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        audioChunksRef.current = [];
        recordStartTimeRef.current = Date.now();

        mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };

        mediaRecorder.onstop = () => {
          const duration = Math.round((Date.now() - recordStartTimeRef.current) / 1000);
          const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });

          setIsAIThinking(true);

          // Send audio base64 to backend
          const reader = new FileReader();
          reader.onloadend = () => {
            const result = reader.result as string;
            const base64Audio = result.includes(",") ? result.split(",")[1] : result;

            submitAnswer({
              questionIndex: currentQuestionIndex,
              answer: textAnswer,
              audioBase64: base64Audio,
              audioDuration: duration,
            });

            setTextAnswer("");
          };
          reader.readAsDataURL(blob);
        };

        mediaRecorder.start();
        mediaRecorderRef.current = mediaRecorder;
        setIsRecording(true);
      } catch (error) {
        console.error("Error starting recording:", error);
        toast.error("Microphone access denied. Please enable mic permissions.");
      }
    }
  };

  // Submit typed text answer
  const handleSendTextAnswer = () => {
    if (!textAnswer.trim()) return;

    submitAnswer({
      questionIndex: currentQuestionIndex,
      answer: textAnswer,
    });

    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "candidate",
        content: textAnswer,
        timestamp: new Date(),
      },
    ]);

    setIsAIThinking(true);
    setTextAnswer("");
  };

  // Toggle video stream
  const toggleVideo = () => {
    if (videoRef.current?.srcObject) {
      const videoTrack = (videoRef.current.srcObject as MediaStream)
        .getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
      }
    }
  };

  // Toggle audio mute
  const toggleAudio = () => {
    if (videoRef.current?.srcObject) {
      const audioTrack = (videoRef.current.srcObject as MediaStream)
        .getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  // Fullscreen controller
  const requestFullscreen = async () => {
    try {
      if (typeof document !== "undefined" && document.documentElement && !document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
        setIsFullscreen(true);
      }
    } catch (e) {
      console.warn("Fullscreen request error:", e);
    }
  };

  const exitFullscreen = async () => {
    try {
      if (typeof document !== "undefined" && document.fullscreenElement) {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (e) {
      console.warn("Exit fullscreen error:", e);
    }
  };

  // Fullscreen auto-trigger on first interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      requestFullscreen();
    };
    window.addEventListener("click", handleFirstInteraction, { once: true });
    requestFullscreen();

    return () => {
      window.removeEventListener("click", handleFirstInteraction);
    };
  }, []);

  // Safe termination function (terminates media, sends end, redirects)
  const executeEndInterview = () => {
    if (isTerminatedRef.current) return;
    isTerminatedRef.current = true;
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
    }
    endInterview();
    router.push(`/interview/${sessionId}/results`);
  };

  // Proctoring: Screen change / tab switch / window blur listener
  useEffect(() => {
    const handleViolation = () => {
      if (isTerminatedRef.current) return;

      const now = Date.now();
      // Debounce events within 2.5 seconds
      if (now - lastWarningTimeRef.current < 2500) return;
      lastWarningTimeRef.current = now;

      const current = proctorWarningsRef.current + 1;
      setProctorWarnings(current);

      if (current < 3) {
        toast.error(
          `⚠️ Proctoring Warning (${current}/3): Screen exit or tab switch detected! Please stay on this tab in full-screen mode. After 3 warnings, the interview will automatically terminate.`,
          {
            duration: 6000,
            id: "proctoring-warning-toast",
            style: {
              background: "#ffffff",
              color: "#991b1b",
              border: "1px solid #fca5a5",
              borderRadius: "1rem",
              fontWeight: 600,
              fontSize: "12px",
            },
          }
        );
      } else {
        toast.error(
          "🚨 Proctoring Limit Reached (3/3): Multiple tab or screen changes detected. The interview has been automatically ended.",
          {
            duration: 6000,
            id: "proctoring-terminated-toast",
            style: {
              background: "#991b1b",
              color: "#ffffff",
              borderRadius: "1rem",
              fontWeight: 600,
              fontSize: "12px",
            },
          }
        );
        setTimeout(() => {
          executeEndInterview();
        }, 1200);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation();
      }
    };

    const handleFullscreenChange = () => {
      const isInFs = !!document.fullscreenElement;
      setIsFullscreen(isInFs);
      if (!isInFs && !isTerminatedRef.current) {
        handleViolation();
      }
    };

    const handleWindowBlur = () => {
      handleViolation();
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    window.addEventListener("blur", handleWindowBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, []);

  // End interview manually using interactive toast instead of window.confirm
  const handleEndInterview = () => {
    toast(
      (t) => (
        <div className="flex flex-col gap-2 p-1 font-sans">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
            <span className="text-xs font-bold text-slate-900">End Mock Interview Session?</span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Your responses up to this question will be submitted for scorecard and performance evaluation.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => {
                toast.dismiss(t.id);
                executeEndInterview();
              }}
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors"
            >
              Yes, End Session
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
            >
              Continue Interview
            </button>
          </div>
        </div>
      ),
      {
        duration: 8000,
        position: "top-center",
        id: "confirm-end-session",
        style: {
          background: "#ffffff",
          color: "#0f172a",
          border: "1px solid #fee2e2",
          borderRadius: "1rem",
          boxShadow: "0 10px 25px -5px rgba(225, 29, 72, 0.15)",
        },
      }
    );
  };

  return (
    <div className="h-screen max-h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* Studio Header - Fixed compact 56px */}
      <header className="h-14 shrink-0 border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur-xl z-20 flex items-center justify-between shadow-xs">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 border border-orange-200/80 text-orange-600 shadow-xs">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h1 className="font-sans text-sm sm:text-base font-bold text-slate-900 tracking-tight truncate">
              {sessionData?.practiceJob?.title ||
                sessionData?.application?.job?.title ||
                "AI Mock Interview Session"}
            </h1>
            <div className="flex items-center space-x-2 text-[11px] text-slate-500">
              <span className="flex items-center gap-1.5">
                <span
                  className={`inline-block h-2 w-2 rounded-full ${
                    isConnected
                      ? "bg-gradient-to-r from-orange-500 to-pink-500 animate-pulse"
                      : "bg-rose-500"
                  }`}
                />
                <span className="truncate">{isConnected ? "Neural Engine Connected" : "Connecting..."}</span>
              </span>
              <span>•</span>
              <span className="hidden sm:inline">115ms Groq Whisper</span>
              <span className="hidden sm:inline">•</span>
              <span className="font-mono text-slate-700 font-medium">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
          {/* Proctoring Warning Badge if warnings occur */}
          {proctorWarnings > 0 ? (
            <div className="flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-200 px-3 py-1 text-xs font-mono font-semibold text-rose-700 h-8 animate-pulse shadow-xs">
              <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
              <span>Warnings: {proctorWarnings}/3</span>
            </div>
          ) : (
            <div className="hidden xl:flex items-center gap-1.5 rounded-full bg-slate-100 border border-slate-200 px-2.5 py-1 text-[11px] font-mono text-slate-600 h-8">
              <ShieldAlert className="h-3 w-3 text-slate-500" />
              <span>Proctored</span>
            </div>
          )}

          {/* Fullscreen Toggle Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={isFullscreen ? exitFullscreen : requestFullscreen}
            className="flex items-center gap-1.5 rounded-full border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-all shadow-xs h-8"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-3.5 w-3.5 text-slate-600" />
            ) : (
              <Maximize2 className="h-3.5 w-3.5 text-slate-600" />
            )}
            <span className="hidden md:inline">{isFullscreen ? "Fullscreen" : "Go Fullscreen"}</span>
          </Button>

          {/* Voice Customization Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsVoiceModalOpen(true)}
            className="flex items-center gap-1.5 rounded-full border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-all shadow-xs h-8"
          >
            <Volume2 className="h-3.5 w-3.5 text-orange-500" />
            <span className="hidden md:inline text-slate-500">Voice:</span>
            <span className="max-w-[100px] truncate text-orange-600 font-mono font-semibold">
              {currentVoiceLabel}
            </span>
            <Settings className="h-3 w-3 text-slate-400" />
          </Button>

          {/* Elapsed Monospace Timer */}
          <div className="flex items-center space-x-1.5 rounded-full bg-slate-100 px-3 py-1 border border-slate-200 text-xs font-mono text-slate-700 h-8">
            <Clock className="h-3.5 w-3.5 text-orange-500" />
            <span>{formatTime(elapsedTime)}</span>
          </div>

          <Button
            variant="destructive"
            size="sm"
            onClick={handleEndInterview}
            className="gap-1.5 rounded-full px-3.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 shadow-xs h-8"
          >
            <Phone className="h-3.5 w-3.5 rotate-[135deg]" />
            <span className="hidden sm:inline">End Session</span>
          </Button>
        </div>
      </header>

      {/* Main Grid - Fills remaining height with zero overall overflow */}
      <main className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-3 p-3 overflow-hidden font-sans">
        {/* Left Column: Question Banner & Candidate Video Feed */}
        <div className="lg:col-span-7 flex flex-col gap-2.5 h-full min-h-0 overflow-hidden">
          {/* Active Question Box */}
          <div className="shrink-0 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-orange-500/10 via-pink-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex items-start justify-between gap-3">
              <div className="space-y-1 flex-1 min-w-0">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-[10px] font-mono font-semibold text-orange-600">
                  <Sparkles className="h-2.5 w-2.5 text-orange-500" />
                  <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
                </div>
                <h2 className="text-sm sm:text-base font-semibold text-slate-900 leading-snug line-clamp-3">
                  {isAIThinking
                    ? "Evaluating your answer and formulating the next dynamic question..."
                    : currentQuestion?.question || "Calibrating your first mock question..."}
                </h2>
              </div>
              {isAISpeaking && (
                <div className="flex items-center space-x-1.5 rounded-full bg-pink-50 border border-pink-200 px-2.5 py-0.5 text-[11px] font-mono font-semibold text-pink-700 shrink-0 shadow-xs">
                  <Volume2 className="h-3.5 w-3.5 animate-pulse text-pink-600" />
                  <span>AI Speaking</span>
                </div>
              )}
            </div>
          </div>

          {/* Candidate Video Feed */}
          <div className="relative flex-1 min-h-0 overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-900 flex items-center justify-center shadow-xs">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`h-full w-full object-cover ${!isVideoOn ? "hidden" : ""}`}
            />

            {!isVideoOn && (
              <div className="flex flex-col items-center justify-center space-y-2 text-slate-400">
                <VideoOff className="h-12 w-12 text-slate-500" />
                <p className="text-xs font-semibold text-slate-400">Camera is Turned Off</p>
              </div>
            )}

            {/* Media Control Bar */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center space-x-2 rounded-full bg-white/95 px-3 py-1.5 border border-slate-200 shadow-xl backdrop-blur-xl z-10">
              <Button
                variant={isVideoOn ? "ghost" : "destructive"}
                size="icon"
                onClick={toggleVideo}
                className="h-9 w-9 rounded-full text-slate-700 hover:bg-slate-100"
              >
                {isVideoOn ? <Video className="h-4 w-4 text-slate-700" /> : <VideoOff className="h-4 w-4" />}
              </Button>

              <Button
                variant={isMuted ? "destructive" : "ghost"}
                size="icon"
                onClick={toggleAudio}
                className="h-9 w-9 rounded-full text-slate-700 hover:bg-slate-100"
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4 text-slate-700" />}
              </Button>

              {/* Push to talk / Voice answer button */}
              <Button
                onClick={toggleRecording}
                className={`gap-1.5 rounded-full px-4 py-2 text-xs font-semibold text-white transition-all shadow-md h-9 ${
                  isRecording
                    ? "bg-rose-600 hover:bg-rose-700 animate-pulse shadow-rose-600/30"
                    : "bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 shadow-orange-500/20"
                }`}
              >
                <Mic className="h-3.5 w-3.5" />
                <span>{isRecording ? "Stop & Submit Response" : "Record Spoken Answer"}</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: Live Transcript & Chat Feed */}
        <div className="lg:col-span-5 flex flex-col h-full min-h-0 rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
          <div className="shrink-0 border-b border-slate-100 px-4 py-2.5 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="h-3.5 w-3.5 text-orange-500" />
              <span>Real-Time Dialogue Stream</span>
            </h3>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-200">
              Live Feed
            </span>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-3.5 space-y-3">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center text-slate-500 space-y-2 p-6">
                <Loader2 className="h-6 w-6 animate-spin text-orange-500 mb-1" />
                <p className="text-xs font-semibold text-slate-800">Synchronizing Interview Stream</p>
                <p className="text-[11px] text-slate-500 max-w-xs">
                  Your personalized questions are being formulated by the AI bar-raiser engine.
                </p>
              </div>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${m.role === "candidate" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                      m.role === "candidate"
                        ? "bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 text-white shadow-xs"
                        : m.isWarning && m.warningType === "abusive"
                        ? "bg-red-50 text-red-950 border border-red-300 shadow-xs"
                        : m.isWarning && m.warningType === "off_topic"
                        ? "bg-amber-50 text-amber-950 border border-amber-300 shadow-xs"
                        : "bg-slate-50 text-slate-800 border border-slate-200/80 shadow-xs"
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono font-semibold text-[10px] mb-1">
                      <span
                        className={
                          m.role === "candidate"
                            ? "text-white/80"
                            : m.isWarning && m.warningType === "abusive"
                            ? "text-red-700 font-bold"
                            : m.isWarning && m.warningType === "off_topic"
                            ? "text-amber-700 font-bold"
                            : "text-slate-500"
                        }
                      >
                        {m.role === "candidate"
                          ? "You (Candidate)"
                          : m.isWarning && m.warningType === "abusive"
                          ? "⚠️ Conduct Warning"
                          : m.isWarning && m.warningType === "off_topic"
                          ? "🎯 Interview Redirection"
                          : "Sensei AI Interviewer"}
                      </span>
                      {m.isWarning && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-white/70 font-sans font-medium text-slate-600 border border-slate-200">
                          Focus Required
                        </span>
                      )}
                    </div>
                    <p className="whitespace-pre-wrap">{m.content}</p>
                  </div>
                </div>
              ))
            )}

            {/* AI Thinking Indicator in Transcript */}
            {isAIThinking && (
              <div className="flex flex-col items-start animate-in fade-in-50 duration-300">
                <div className="max-w-[88%] rounded-2xl p-3 text-xs bg-orange-50/50 text-slate-800 border border-orange-200 shadow-xs flex flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 animate-bounce [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 animate-bounce [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 animate-bounce" />
                    </div>
                    <p className="font-semibold text-[11px] text-orange-600 font-mono">
                      Evaluating Response &amp; Calibrating Rubrics...
                    </p>
                  </div>
                  <p className="text-[10px] text-slate-500 italic">
                    Assessing algorithm efficiency, edge cases, and phrasing next follow-up.
                  </p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Text Answer Input Bar */}
          <div className="shrink-0 border-t border-slate-100 p-2.5 bg-white">
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendTextAnswer()}
                placeholder="Or type your technical explanation here and press enter..."
                className="flex-1 rounded-full bg-slate-50 border border-slate-200 px-3.5 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
              />
              <Button
                size="icon"
                onClick={handleSendTextAnswer}
                disabled={!textAnswer.trim()}
                className="h-8 w-8 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shrink-0 shadow-xs"
              >
                <Send className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Voice Customization Modal */}
      <Dialog open={isVoiceModalOpen} onOpenChange={setIsVoiceModalOpen}>
        <DialogContent className="border border-slate-200 bg-white text-slate-900 max-w-md p-6 rounded-3xl font-sans shadow-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold text-slate-900">
              <Volume2 className="h-5 w-5 text-orange-500" />
              Interviewer Neural Voice Settings
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Customize the AI interviewer voice to sound natural, human, and clear.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Speaking Pace Control */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2 font-mono">
                Speaking Pace: {speechRate.toFixed(2)}x
              </label>
              <div className="flex gap-2">
                {[
                  { label: "Deliberate (0.9x)", val: 0.9 },
                  { label: "Natural (0.98x)", val: 0.98 },
                  { label: "Brisk (1.1x)", val: 1.1 },
                ].map((speed) => (
                  <button
                    key={speed.val}
                    type="button"
                    onClick={() => {
                      setSpeechRate(speed.val);
                      localStorage.setItem("sensei_speech_rate", speed.val.toString());
                    }}
                    className={`flex-1 rounded-xl px-2.5 py-2 text-xs font-medium border transition-colors ${
                      Math.abs(speechRate - speed.val) < 0.03
                        ? "border-orange-500 bg-orange-50 text-orange-700 font-semibold"
                        : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {speed.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Voices List */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 block mb-2 font-mono">
                Select Voice ({availableVoices.length} available)
              </label>
              <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                {availableVoices.length === 0 ? (
                  <p className="text-xs text-slate-400 italic p-3 text-center">
                    Loading system voices...
                  </p>
                ) : (
                  availableVoices.map((voice) => {
                    const isSelected = voice.voiceURI === selectedVoiceURI;
                    const isNatural =
                      voice.name.toLowerCase().includes("natural") ||
                      voice.name.toLowerCase().includes("online") ||
                      voice.name.toLowerCase().includes("neural") ||
                      voice.name.toLowerCase().includes("google");

                    return (
                      <div
                        key={voice.voiceURI}
                        onClick={() => handleSelectVoice(voice.voiceURI)}
                        className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer transition-all ${
                          isSelected
                            ? "border-orange-500 bg-orange-50/70 text-slate-900 shadow-xs"
                            : "border-slate-200 bg-slate-50/60 hover:bg-slate-100 text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
                              isSelected
                                ? "bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold"
                                : "border border-slate-300 text-transparent"
                            }`}
                          >
                            <Check className="h-3 w-3" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className="text-xs font-semibold truncate">
                                {voice.name.replace(/Microsoft |Google /g, "")}
                              </p>
                              {isNatural && (
                                <span className="rounded-full bg-orange-100 border border-orange-200 px-1.5 py-0.2 text-[9px] font-mono font-semibold text-orange-700">
                                  Natural
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 truncate">
                              {voice.lang}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleTestVoice(voice.voiceURI);
                          }}
                          className={`p-1.5 rounded-xl border transition-colors ${
                            previewingVoiceURI === voice.voiceURI
                              ? "border-orange-500 bg-orange-500 text-white"
                              : "border-slate-200 bg-white text-slate-600 hover:text-slate-900"
                          }`}
                          title="Preview voice"
                        >
                          {previewingVoiceURI === voice.voiceURI ? (
                            <Square className="h-3 w-3 animate-pulse" />
                          ) : (
                            <Play className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="mt-4 pt-2 border-t border-slate-100">
            <Button
              onClick={() => setIsVoiceModalOpen(false)}
              className="w-full rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white text-xs font-semibold py-2.5 shadow-md shadow-orange-500/20"
            >
              Confirm Voice Selection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
