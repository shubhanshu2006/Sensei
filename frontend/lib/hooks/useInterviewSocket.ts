"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import toast from "react-hot-toast";

export interface QuestionData {
  questionIndex: number;
  question: string;
  questionAudio?: string; // Base64 MP3 audio from OpenAI TTS
  totalQuestions: number;
}

export interface UseInterviewSocketOptions {
  sessionToken: string;
  isVoiceMode?: boolean;
  onQuestion?: (data: QuestionData) => void;
  onTranscription?: (data: { questionIndex: number; transcription: string }) => void;
  onCompleted?: () => void;
  onTimeout?: () => void;
  onError?: (err: { message: string; code?: string }) => void;
}

export function useInterviewSocket({
  sessionToken,
  isVoiceMode = true,
  onQuestion,
  onTranscription,
  onCompleted,
  onTimeout,
  onError,
}: UseInterviewSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionData | null>(null);
  const currentQuestionRef = useRef<QuestionData | null>(null);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const socketRef = useRef<Socket | null>(null);
  const heartbeatTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Send answer (voice or text)
  const submitAnswer = useCallback(
    ({
      questionIndex,
      answer,
      audioBase64,
      audioDuration,
    }: {
      questionIndex: number;
      answer: string;
      audioBase64?: string;
      audioDuration?: number;
    }) => {
      if (!socketRef.current || !socketRef.current.connected) {
        toast.error("Not connected to interview server");
        return false;
      }

      socketRef.current.emit("submit-answer", {
        questionIndex,
        questionText: currentQuestionRef.current?.question,
        answer,
        audioBase64,
        audioDuration,
        isVoiceMode: !!audioBase64,
      });

      return true;
    },
    [],
  );

  // Manually end interview early
  const endInterview = useCallback(() => {
    if (!socketRef.current || !socketRef.current.connected) {
      return false;
    }
    socketRef.current.emit("end-interview");
    return true;
  }, []);

  // Keep callback refs fresh without triggering socket reconnection
  const onQuestionRef = useRef(onQuestion);
  const onTranscriptionRef = useRef(onTranscription);
  const onCompletedRef = useRef(onCompleted);
  const onTimeoutRef = useRef(onTimeout);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onQuestionRef.current = onQuestion;
    onTranscriptionRef.current = onTranscription;
    onCompletedRef.current = onCompleted;
    onTimeoutRef.current = onTimeout;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    if (!sessionToken) return;

    // Default to origin or NEXT_PUBLIC_WS_URL (strip ws:// to http:// for Socket.io)
    let wsUrl = process.env.NEXT_PUBLIC_WS_URL || "http://localhost:5000";
    if (wsUrl.startsWith("ws://")) wsUrl = wsUrl.replace("ws://", "http://");
    if (wsUrl.startsWith("wss://")) wsUrl = wsUrl.replace("wss://", "https://");

    const socket = io(wsUrl, {
      auth: { sessionToken },
      transports: ["websocket", "polling"],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("[Socket.io] Connected to interview server");
      setIsConnected(true);

      // Join the session
      socket.emit("join-session", { isVoiceMode });

      // Start periodic heartbeat
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = setInterval(() => {
        if (socket.connected) {
          socket.emit("heartbeat");
        }
      }, 20000);
    });

    socket.on("session-joined", (data: any) => {
      console.log("[Socket.io] session-joined", data);
      if (data.totalQuestions) setTotalQuestions(data.totalQuestions);
      if (data.currentQuestionIndex !== undefined) {
        setCurrentQuestionIndex(data.currentQuestionIndex);
      }
    });

    socket.on("question", (data: QuestionData) => {
      console.log("[Socket.io] Received question", data.questionIndex);
      setCurrentQuestion(data);
      currentQuestionRef.current = data;
      setCurrentQuestionIndex(data.questionIndex);
      if (data.totalQuestions) setTotalQuestions(data.totalQuestions);
      onQuestionRef.current?.(data);
    });

    socket.on("transcription-complete", (data: { questionIndex: number; transcription: string }) => {
      console.log("[Socket.io] Transcription complete", data);
      onTranscriptionRef.current?.(data);
    });

    socket.on("session-completed", () => {
      console.log("[Socket.io] Session completed");
      toast.success("Interview completed! Generating scorecard...");
      onCompletedRef.current?.();
    });

    socket.on("session-timeout", (data: any) => {
      console.warn("[Socket.io] Session timeout", data);
      toast.error(data?.message || "Session timed out due to inactivity");
      onTimeoutRef.current?.();
    });

    socket.on("error", (error: any) => {
      console.error("[Socket.io] Error from server", error);
      toast.error(error.message || "An interview session error occurred");
      onErrorRef.current?.(error);
    });

    socket.on("disconnect", (reason: string) => {
      console.log("[Socket.io] Disconnected", reason);
      setIsConnected(false);
    });

    return () => {
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [sessionToken, isVoiceMode]);

  return {
    isConnected,
    currentQuestion,
    currentQuestionIndex,
    totalQuestions,
    submitAnswer,
    endInterview,
  };
}
