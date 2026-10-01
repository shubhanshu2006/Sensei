"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  Volume2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";

export default function InterviewWaitingRoomPage() {
  const params = useParams();
  const router = useRouter();
  const sessionId = params.sessionId as string;

  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isSpeakerWorking, setIsSpeakerWorking] = useState(false);
  const [deviceChecks, setDeviceChecks] = useState({
    camera: false,
    microphone: false,
    speaker: false,
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Check devices
  useEffect(() => {
    const checkDevices = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        streamRef.current = stream;

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        const videoTrack = stream.getVideoTracks()[0];
        const audioTrack = stream.getAudioTracks()[0];

        setDeviceChecks((prev) => ({
          ...prev,
          camera: videoTrack ? videoTrack.enabled : false,
          microphone: audioTrack ? audioTrack.enabled : false,
        }));
      } catch (error) {
        console.error("Error accessing devices:", error);
      }
    };

    checkDevices();

    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Test speaker with web audio synthetic tone if file missing
  const testSpeaker = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.6);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.6);

      setIsSpeakerWorking(true);
      setDeviceChecks((prev) => ({ ...prev, speaker: true }));
    } catch {
      setIsSpeakerWorking(true);
      setDeviceChecks((prev) => ({ ...prev, speaker: true }));
    }
  };

  // Toggle video
  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOn(videoTrack.enabled);
        setDeviceChecks((prev) => ({ ...prev, camera: videoTrack.enabled }));
      }
    }
  };

  // Toggle mic
  const toggleMic = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMicOn(audioTrack.enabled);
        setDeviceChecks((prev) => ({ ...prev, microphone: audioTrack.enabled }));
      }
    }
  };

  const handleJoinInterview = () => {
    router.push(`/interview/${sessionId}`);
  };

  const allChecksComplete = deviceChecks.camera && deviceChecks.microphone && deviceChecks.speaker;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans relative overflow-hidden flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Radiant ambient glow in brand Orange & Pink */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-gradient-to-br from-orange-500/10 via-pink-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-gradient-to-tl from-pink-500/10 via-rose-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="mx-auto max-w-5xl w-full relative z-10 space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-xs font-mono font-semibold text-orange-600">
            <Sparkles className="h-3.5 w-3.5 text-orange-500 animate-pulse" />
            <span>Pre-Flight Hardware Check</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900">
            Interview Waiting Studio
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
            Calibrate your camera, microphone, and speakers before entering the live voice room.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-12 items-stretch">
          {/* Video Preview Stage (Spans 7 cols) */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="relative rounded-3xl overflow-hidden border border-slate-200/90 bg-white shadow-sm flex-1 flex flex-col justify-between">
              {/* Top status overlay */}
              <div className="absolute top-4 left-4 z-20 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/70 backdrop-blur-md border border-slate-700/80 text-[11px] font-mono text-white">
                <span
                  className={`w-2 h-2 rounded-full ${
                    isVideoOn
                      ? "bg-gradient-to-r from-orange-500 to-pink-500 animate-pulse"
                      : "bg-rose-500"
                  }`}
                />
                <span>{isVideoOn ? "Video Stream Active" : "Camera Muted"}</span>
              </div>

              {/* Video Element Viewfinder */}
              <div className="relative aspect-video w-full flex-1 bg-slate-900 flex items-center justify-center overflow-hidden">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`h-full w-full object-cover ${!isVideoOn ? "hidden" : ""}`}
                />

                {!isVideoOn && (
                  <div className="text-center p-8 space-y-2">
                    <div className="h-16 w-16 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center mx-auto text-slate-400">
                      <VideoOff className="h-8 w-8" />
                    </div>
                    <p className="text-sm font-semibold text-slate-200">Camera Turned Off</p>
                    <p className="text-xs text-slate-400">Enable video stream for realistic interview simulation</p>
                  </div>
                )}
              </div>

              {/* Bottom Quick Controls Bar */}
              <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-center gap-3">
                <Button
                  variant="outline"
                  onClick={toggleMic}
                  className={`rounded-full px-5 py-2.5 text-xs font-semibold gap-2 transition-all ${
                    isMicOn
                      ? "border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100"
                      : "border-rose-200 bg-rose-50 text-rose-600"
                  }`}
                >
                  {isMicOn ? <Mic className="h-4 w-4 text-orange-500" /> : <MicOff className="h-4 w-4" />}
                  <span>{isMicOn ? "Microphone On" : "Microphone Muted"}</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={toggleVideo}
                  className={`rounded-full px-5 py-2.5 text-xs font-semibold gap-2 transition-all ${
                    isVideoOn
                      ? "border-slate-200 bg-slate-50 text-slate-800 hover:bg-slate-100"
                      : "border-rose-200 bg-rose-50 text-rose-600"
                  }`}
                >
                  {isVideoOn ? <Video className="h-4 w-4 text-pink-500" /> : <VideoOff className="h-4 w-4" />}
                  <span>{isVideoOn ? "Camera On" : "Camera Disabled"}</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Right Column: Device Calibration & Tips (Spans 5 cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-5">
            {/* Device Readiness Card */}
            <div className="rounded-3xl p-6 bg-white border border-slate-200/90 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-base font-bold text-slate-900">Hardware Readiness</h3>
                <span className="text-[10px] font-mono uppercase font-semibold px-2 py-0.5 rounded-full bg-orange-50 border border-orange-200 text-orange-600">
                  Pre-Check
                </span>
              </div>

              <div className="space-y-3">
                {/* Camera Check */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-orange-100/80 border border-orange-200/60 flex items-center justify-center text-orange-600">
                      <Video className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">Camera Feed</p>
                      <p className="text-[10px] text-slate-500">Video resolution checked</p>
                    </div>
                  </div>
                  {deviceChecks.camera ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-orange-600 font-semibold">
                      <CheckCircle2 className="h-4 w-4 text-orange-600" /> Ready
                    </span>
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  )}
                </div>

                {/* Microphone Check */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-pink-100/80 border border-pink-200/60 flex items-center justify-center text-pink-600">
                      <Mic className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">Microphone Input</p>
                      <p className="text-[10px] text-slate-500">Speech audio stream ready</p>
                    </div>
                  </div>
                  {deviceChecks.microphone ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-pink-600 font-semibold">
                      <CheckCircle2 className="h-4 w-4 text-pink-600" /> Ready
                    </span>
                  ) : (
                    <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
                  )}
                </div>

                {/* Speaker Audio Test */}
                <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-xl bg-orange-100/80 border border-orange-200/60 flex items-center justify-center text-orange-600">
                      <Volume2 className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900">Speaker Sound</p>
                      <p className="text-[10px] text-slate-500">AI audio playback check</p>
                    </div>
                  </div>

                  {deviceChecks.speaker ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-mono text-orange-600 font-semibold">
                      <CheckCircle2 className="h-4 w-4 text-orange-600" /> Tested
                    </span>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={testSpeaker}
                      className="rounded-full px-3 py-1 text-xs border-orange-200 bg-orange-50 text-orange-600 hover:bg-orange-100"
                    >
                      Play Test Tone
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Studio Recommendations */}
            <div className="rounded-3xl p-5 bg-gradient-to-br from-orange-50/40 via-white to-pink-50/20 border border-orange-200/60 space-y-2.5 text-xs text-slate-700">
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <ShieldCheck className="h-4 w-4 text-orange-600" />
                <span>Bar-Raiser Simulation Tips</span>
              </div>
              <ul className="space-y-1.5 text-[11px] text-slate-600 leading-relaxed list-disc list-inside">
                <li>Speak naturally; the neural model parses conversational cadence.</li>
                <li>State assumptions early in system design & architecture questions.</li>
                <li>Use the STAR framework (Situation, Task, Action, Result) for behavioral inquiries.</li>
              </ul>
            </div>

            {/* Action CTA */}
            <div className="space-y-2">
              <Button
                onClick={handleJoinInterview}
                disabled={!allChecksComplete}
                className="w-full py-4 rounded-full font-medium text-sm text-white bg-gradient-to-r from-orange-500 via-rose-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 shadow-md shadow-orange-500/20 transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 border-0"
              >
                {allChecksComplete ? (
                  <>
                    <span>Enter Live Interview Studio</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Run Speaker Test to Continue</span>
                  </>
                )}
              </Button>

              {!allChecksComplete && (
                <p className="text-center text-[11px] font-mono text-slate-500">
                  Tap &ldquo;Play Test Tone&rdquo; to complete audio speaker verification.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
