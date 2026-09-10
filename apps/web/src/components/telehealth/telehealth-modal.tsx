'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Activity,
  Heart,
  Pill,
  MessageSquare,
  Shield,
  FileText,
  User,
  Sparkles,
  Volume2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TelehealthModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientName?: string;
  patientHandle?: string;
  doctorName?: string;
  doctorHandle?: string;
}

export function TelehealthModal({
  isOpen,
  onClose,
  patientName = 'Devaki Sundaram',
  patientHandle = '@devaki_sundaram',
  doctorName = 'Dr. Vikram Malhotra',
  doctorHandle = '@dr_vikram_malhotra',
}: TelehealthModalProps) {
  const [micOn, setMicOn] = useState(true);
  const [videoOn, setVideoOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [activeTab, setActiveTab] = useState<'vitals' | 'notes' | 'chat'>('vitals');
  const [consultNotes, setConsultNotes] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    let interval: any;
    if (isOpen) {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);

      // Attempt to access user webcam if available
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
          .then((stream) => {
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
          })
          .catch((err) => {
            console.log('Using simulated clinical stream:', err.message);
          });
      }
    } else {
      setCallDuration(0);
    }
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${rem.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-6xl h-[85vh] bg-slate-950 text-white rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-slate-800 animate-in fade-in zoom-in duration-200">
        {/* Top Call Bar */}
        <div className="h-16 border-b border-slate-800 bg-slate-900/90 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                Telehealth Consultation • {patientName}
                <span className="text-xs text-slate-400 font-mono">{patientHandle}</span>
              </h3>
              <p className="text-xs text-slate-400">
                Encrypted WebRTC Session • Duration: {formatTime(callDuration)}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-emerald-950/60 text-emerald-400 border-emerald-600 text-xs">
              HD Audio & Video
            </Badge>
            <Badge variant="outline" className="bg-blue-950/60 text-blue-400 border-blue-600 text-xs">
              Attending: {doctorName}
            </Badge>
          </div>
        </div>

        {/* Video Stage & Side HUD */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 overflow-hidden">
          {/* Main Video Screen */}
          <div className="lg:col-span-3 relative bg-slate-900 flex items-center justify-center overflow-hidden">
            {/* Live Video Feed (Webcam or High-Def Simulation) */}
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />

            {/* Simulated Overlay when webcam is off or on preview */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

            {/* Participant Card Bottom-Left */}
            <div className="absolute bottom-6 left-6 flex items-center gap-3 bg-black/60 backdrop-blur-md px-4 py-2.5 rounded-2xl border border-white/10">
              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-sm">
                DS
              </div>
              <div>
                <p className="text-sm font-bold text-white leading-tight">{patientName}</p>
                <p className="text-xs text-emerald-300">Speaking (Microphone Active)</p>
              </div>
            </div>

            {/* Doctor Self-View Top-Right */}
            <div className="absolute top-6 right-6 w-44 h-32 rounded-2xl bg-slate-800 border-2 border-primary overflow-hidden shadow-lg hidden sm:block">
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-xs text-slate-300">
                <User className="w-8 h-8 text-primary mb-1" />
                <span className="font-semibold">{doctorName}</span>
                <span className="text-[10px] text-emerald-400">Doctor View (You)</span>
              </div>
            </div>

            {/* Live Vitals HUD Floating Bar */}
            <div className="absolute top-6 left-6 bg-black/70 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10 flex items-center gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5 text-rose-400">
                <Heart className="w-3.5 h-3.5" />
                <span>HR: 72 bpm</span>
              </div>
              <div className="flex items-center gap-1.5 text-blue-400">
                <Activity className="w-3.5 h-3.5" />
                <span>BP: 128/82</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-400">
                <span>SpO2: 97%</span>
              </div>
            </div>
          </div>

          {/* Right Clinical HUD / Side Panel */}
          <div className="bg-slate-950 border-l border-slate-800 flex flex-col overflow-hidden">
            <div className="flex border-b border-slate-800 text-xs">
              <button
                onClick={() => setActiveTab('vitals')}
                className={`flex-1 py-3 font-semibold text-center border-b-2 transition-colors ${
                  activeTab === 'vitals' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Telemetry HUD
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`flex-1 py-3 font-semibold text-center border-b-2 transition-colors ${
                  activeTab === 'notes' ? 'border-primary text-primary bg-primary/5' : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                Live Rx Notes
              </button>
            </div>

            <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
              {activeTab === 'vitals' && (
                <>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                    <span className="text-muted-foreground uppercase text-[10px] font-bold">Primary Diagnosis</span>
                    <p className="text-white font-semibold text-sm">Heart Failure (HFpEF) & T2DM</p>
                    <p className="text-slate-400 text-xs">Baseline LVEF: 52% • NYHA Class II</p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                    <span className="text-muted-foreground uppercase text-[10px] font-bold">Active Medications</span>
                    <div className="space-y-1 font-mono text-[11px]">
                      <div className="text-emerald-400">✓ Furosemide 40mg Oral (Taken 08:00 AM)</div>
                      <div className="text-emerald-400">✓ Empagliflozin 10mg Oral (Taken 08:00 AM)</div>
                      <div className="text-amber-400">○ Spironolactone 25mg (Scheduled 01:00 PM)</div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-800/40 text-amber-200 space-y-1">
                    <div className="font-bold flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      AI Telemetry Analysis
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      Dry weight stabilized at 71.6 kg today. Ankle edema resolving. Patient states shortness of breath is reduced.
                    </p>
                  </div>
                </>
              )}

              {activeTab === 'notes' && (
                <div className="space-y-3">
                  <label className="block text-slate-300 font-semibold">Consultation Summary & Orders</label>
                  <textarea
                    rows={8}
                    value={consultNotes}
                    onChange={(e) => setConsultNotes(e.target.value)}
                    placeholder="Enter instructions, medication titration, follow-up date..."
                    className="w-full rounded-xl bg-slate-900 border border-slate-800 p-3 text-white text-xs outline-none focus:border-primary"
                  />
                  <Button size="sm" className="w-full text-xs font-semibold">
                    Sign & Send to Patient Care Circle
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Call Controls */}
        <div className="h-20 border-t border-slate-800 bg-slate-900 px-6 flex items-center justify-between">
          <div className="text-xs text-slate-400 font-mono hidden sm:block">
            Latency: 28ms • Loss: 0.0%
          </div>

          <div className="flex items-center gap-4 mx-auto sm:mx-0">
            <button
              onClick={() => setMicOn(!micOn)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                micOn ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-red-600 text-white'
              }`}
              title={micOn ? 'Mute Mic' : 'Unmute Mic'}
            >
              {micOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            </button>

            <button
              onClick={() => setVideoOn(!videoOn)}
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                videoOn ? 'bg-slate-800 hover:bg-slate-700 text-white' : 'bg-red-600 text-white'
              }`}
              title={videoOn ? 'Turn Off Video' : 'Turn On Video'}
            >
              {videoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            </button>

            <button
              onClick={onClose}
              className="h-12 px-6 rounded-full bg-red-600 hover:bg-red-700 text-white font-bold text-sm flex items-center gap-2 shadow-lg active:scale-95 transition-all"
            >
              <PhoneOff className="w-5 h-5" />
              End Consultation
            </button>
          </div>

          <div className="hidden sm:block">
            <Button variant="outline" size="sm" onClick={onClose} className="text-xs border-slate-700 text-slate-300">
              Minimize
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
