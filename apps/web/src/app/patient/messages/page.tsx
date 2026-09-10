'use client';

import { useState } from 'react';
import { MessageSquare, Send, Clock, CheckCheck, Stethoscope } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const initialMessages = [
  {
    id: '1',
    from: 'doctor',
    text: 'Good morning Devaki! Your recent blood pressure readings look good. Keep taking your Furosemide every morning as prescribed.',
    time: 'Yesterday, 9:15 AM',
    read: true,
  },
  {
    id: '2',
    from: 'patient',
    text: 'Thank you Doctor. I felt a little dizzy yesterday evening. Should I be worried?',
    time: 'Yesterday, 2:30 PM',
    read: true,
  },
  {
    id: '3',
    from: 'doctor',
    text: 'The dizziness may be from the Furosemide. Make sure you drink enough water through the day. If it happens again or feels severe, use the Emergency SOS button immediately. I will check in with you on Tuesday.',
    time: 'Yesterday, 4:10 PM',
    read: true,
  },
];

export default function PatientMessagesPage() {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);

  const sendMessage = () => {
    if (!draft.trim()) return;
    setSending(true);
    const newMsg = {
      id: String(Date.now()),
      from: 'patient' as const,
      text: draft.trim(),
      time: 'Just now',
      read: true,
    };
    setMessages((prev) => [...prev, newMsg]);
    setDraft('');
    setTimeout(() => setSending(false), 500);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="rounded-3xl bg-sky-600 text-white p-6 md:p-8 shadow-md">
        <p className="text-base font-black uppercase tracking-wider text-sky-100 mb-1">Messages</p>
        <h1 className="text-3xl md:text-4xl font-extrabold">Ask Your Doctor</h1>
        <p className="text-xl text-sky-100 mt-2">
          Send a message to{' '}
          <span className="text-white font-black underline">Dr. Vikram Malhotra</span>.
        </p>
        <div className="mt-4 flex items-center gap-2 bg-sky-700/60 rounded-2xl px-4 py-3 w-fit">
          <Clock className="w-5 h-5 text-sky-200 flex-shrink-0" />
          <p className="text-lg font-bold text-sky-100">
            Non-urgent — doctor usually replies within 24 hours.{' '}
            <span className="text-white font-black">For urgent problems, use Emergency Help on Home.</span>
          </p>
        </div>
      </div>

      {/* Message Thread */}
      <Card className="border-4 border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <CardHeader className="bg-slate-50 border-b-2 border-slate-200 p-5">
          <CardTitle className="text-2xl font-black flex items-center gap-2.5 text-slate-950">
            <MessageSquare className="w-7 h-7 text-sky-600" />
            Conversation with Dr. Malhotra
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* Messages */}
          <div className="p-5 md:p-7 space-y-6 max-h-[480px] overflow-y-auto">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-4 ${msg.from === 'patient' ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-base flex-shrink-0 border-2 ${
                  msg.from === 'doctor'
                    ? 'bg-blue-100 text-blue-900 border-blue-300'
                    : 'bg-sky-100 text-sky-900 border-sky-300'
                }`}>
                  {msg.from === 'doctor' ? <Stethoscope className="w-6 h-6" /> : 'DS'}
                </div>

                {/* Bubble */}
                <div className={`max-w-[75%] space-y-1 ${msg.from === 'patient' ? 'items-end' : 'items-start'} flex flex-col`}>
                  <span className={`text-base font-black ${msg.from === 'doctor' ? 'text-slate-700' : 'text-sky-700'}`}>
                    {msg.from === 'doctor' ? 'Dr. Vikram Malhotra' : 'You'}
                  </span>
                  <div className={`px-5 py-4 rounded-3xl text-xl font-semibold leading-relaxed ${
                    msg.from === 'doctor'
                      ? 'bg-blue-50 border-2 border-blue-200 text-slate-900 rounded-tl-none'
                      : 'bg-sky-600 text-white rounded-tr-none'
                  }`}>
                    {msg.text}
                  </div>
                  <div className={`flex items-center gap-1.5 text-base font-semibold text-slate-500 ${msg.from === 'patient' ? 'flex-row-reverse' : ''}`}>
                    <span>{msg.time}</span>
                    {msg.from === 'patient' && <CheckCheck className="w-4 h-4 text-sky-500" />}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Compose */}
          <div className="border-t-4 border-slate-200 p-5 md:p-6 bg-slate-50">
            <label className="text-lg font-black text-slate-800 mb-3 block">Your message to Dr. Malhotra:</label>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Type your question or concern here…"
              rows={3}
              className="w-full rounded-2xl border-2 border-slate-300 bg-white px-5 py-4 text-xl font-semibold text-slate-900 resize-none focus:outline-none focus:border-sky-500 transition-colors placeholder:text-slate-400"
            />
            <div className="mt-4 flex items-center justify-between flex-wrap gap-4">
              <p className="text-base font-semibold text-slate-600">
                Press <kbd className="px-2 py-0.5 rounded bg-slate-200 font-mono text-sm">Enter</kbd> to send,{' '}
                <kbd className="px-2 py-0.5 rounded bg-slate-200 font-mono text-sm">Shift+Enter</kbd> for new line.
              </p>
              <Button
                onClick={sendMessage}
                disabled={!draft.trim() || sending}
                className="h-14 px-8 text-xl font-black rounded-2xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Send className="w-6 h-6" />
                Send Message
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
