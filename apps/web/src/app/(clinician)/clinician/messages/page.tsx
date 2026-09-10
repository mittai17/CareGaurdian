'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  Send,
  User,
  Heart,
  Stethoscope,
  Shield,
  Phone,
  Video,
  Info,
  Paperclip,
  Smile,
  Check,
  CheckCheck,
  Clock,
  MoreVertical,
  ArrowLeft,
  Calendar,
  Pill,
  Activity,
  FileText,
  Copy,
  ExternalLink,
  Sparkles,
  Users,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { messagesApi } from '@/lib/api';
import { TelehealthModal } from '@/components/telehealth/telehealth-modal';
import { useAuth } from '@/context/auth-context';

export interface ChatUser {
  id: string;
  handle: string; // unique Instagram-like handle e.g. @ananya_kumar
  name: string;
  role: 'CLINICIAN' | 'FAMILY_CAREGIVER' | 'GUARDIAN' | 'PATIENT' | 'ADMIN';
  roleLabel: string;
  avatarBg: string;
  avatarText: string;
  patientContext?: string;
  patientId?: string;
  status: 'ONLINE' | 'ACTIVE_RECENTLY' | 'OFFLINE';
  lastSeen?: string;
  email: string;
  phone?: string;
  bio?: string;
}

export interface ChatMessage {
  id: string;
  senderHandle: string; // @handle of sender
  senderName: string;
  text: string;
  timestamp: string;
  isSelf: boolean;
  status?: 'sent' | 'delivered' | 'seen';
  attachment?: {
    type: 'vitals' | 'medication' | 'lab_result' | 'photo';
    title: string;
    detail: string;
  };
}

export interface Conversation {
  id: string;
  user: ChatUser;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  messages: ChatMessage[];
}

// Full directory of seeded CareGuardian users with unique Instagram-style handles
const ALL_USERS: ChatUser[] = [
  {
    id: 'dc3a32da-21bf-4dc2-be6c-6f9ee354eddc',
    handle: '@ananya_kumar',
    name: 'Ananya Kumar',
    role: 'FAMILY_CAREGIVER',
    roleLabel: 'Daughter (Caregiver)',
    avatarBg: 'bg-emerald-600',
    avatarText: 'AK',
    patientContext: 'Caring for Ravi Kumar',
    patientId: '66c67bf7-f6e3-478e-b972-20d7d25b4958',
    status: 'ONLINE',
    email: 'ananya.kumar@careguardian.health',
    phone: '+91 98401 23456',
    bio: 'Primary family caregiver for my father Ravi. Monitoring daily gait and medication routines.',
  },
  {
    id: '12aca202-5859-47ba-94a9-bb201c00db8b',
    handle: '@suresh_raghavan',
    name: 'Suresh Raghavan',
    role: 'GUARDIAN',
    roleLabel: 'Legal Guardian / Husband',
    avatarBg: 'bg-blue-600',
    avatarText: 'SR',
    patientContext: 'Caring for Lakshmi Raghavan',
    patientId: 'eaf97dad-41d4-4e48-a345-5f1d3f0f5380',
    status: 'ONLINE',
    email: 'suresh.raghavan@careguardian.health',
    phone: '+91 98402 34567',
    bio: 'Husband and primary guardian for Lakshmi. Logging daily blood pressure and vitals.',
  },
  {
    id: '80d25af6-5015-46ad-b2a8-2a6c10914c0d',
    handle: '@divya_raghavan',
    name: 'Divya Raghavan',
    role: 'FAMILY_CAREGIVER',
    roleLabel: 'Daughter-in-law',
    avatarBg: 'bg-purple-600',
    avatarText: 'DR',
    patientContext: 'Caring for Lakshmi Raghavan',
    patientId: 'eaf97dad-41d4-4e48-a345-5f1d3f0f5380',
    status: 'ACTIVE_RECENTLY',
    lastSeen: '15m ago',
    email: 'divya.raghavan@careguardian.health',
    phone: '+91 98403 45678',
    bio: 'Assists with morning medications and nutrition planning.',
  },
  {
    id: '3e317f05-cf39-46c1-8cf6-234d652880ff',
    handle: '@dr_arjun_nair',
    name: 'Dr. Arjun Nair',
    role: 'CLINICIAN',
    roleLabel: 'Consultant Geriatrician',
    avatarBg: 'bg-indigo-600',
    avatarText: 'AN',
    status: 'ONLINE',
    email: 'dr.arjun.nair@careguardian.health',
    phone: '+91 98400 11223',
    bio: 'Geriatric medicine lead at Sunrise Senior Care. Specializing in polypharmacy & cognitive baselines.',
  },
  {
    id: '3a482f16-80e4-4474-9bf0-4c1d29e4d740',
    handle: '@dr_meera_pillai',
    name: 'Dr. Meera Pillai',
    role: 'CLINICIAN',
    roleLabel: 'Consultant Neurologist',
    avatarBg: 'bg-teal-600',
    avatarText: 'MP',
    status: 'ACTIVE_RECENTLY',
    lastSeen: '1h ago',
    email: 'dr.meera.pillai@careguardian.health',
    phone: '+91 98400 44556',
    bio: 'Neurologist at CareFirst. Focus on tremor analysis, Parkinsons, and neurodegenerative drift.',
  },
  {
    id: 'e43e5eca-a3ac-4bf1-940d-b8d58f348629',
    handle: '@latha_caregiver',
    name: 'Latha Reddy',
    role: 'FAMILY_CAREGIVER',
    roleLabel: 'Professional Nurse / Caregiver',
    avatarBg: 'bg-pink-600',
    avatarText: 'LR',
    patientContext: 'Caring for Krishnamurthy Swaminathan',
    patientId: '5b29040a-ea76-4cf3-9d2c-f63c70fcd419',
    status: 'ONLINE',
    email: 'latha.reddy@careguardian.health',
    phone: '+91 98404 56789',
    bio: 'Certified geriatric nurse. Daily health observation reporter.',
  },
  {
    id: '1a08cfc4-88b7-454a-918c-dae4ee9af3e7',
    handle: '@ravi_kumar50',
    name: 'Ravi Kumar',
    role: 'PATIENT',
    roleLabel: 'Patient',
    avatarBg: 'bg-amber-600',
    avatarText: 'RK',
    status: 'ACTIVE_RECENTLY',
    lastSeen: '2h ago',
    email: 'ravi.kumar@careguardian.health',
    phone: '+91 98405 67890',
    bio: 'Patient under Dr. Arjun Nair. Baseline enrolled since Jan 2026.',
  },
  {
    id: '4ac8ad7f-c6b8-46d4-b80d-422ab2423545',
    handle: '@lakshmi_r48',
    name: 'Lakshmi Raghavan',
    role: 'PATIENT',
    roleLabel: 'Patient',
    avatarBg: 'bg-rose-600',
    avatarText: 'LR',
    status: 'OFFLINE',
    lastSeen: 'Yesterday',
    email: 'lakshmi.raghavan@careguardian.health',
    phone: '+91 98406 78901',
    bio: 'Patient under Dr. Priya Sharma. Hypertension & thyroid management.',
  },
  {
    id: 'e339ef8c-d249-4348-9b57-8e802c83f5bf',
    handle: '@careguardian_admin',
    name: 'CareGuardian Admin',
    role: 'ADMIN',
    roleLabel: 'System Administrator',
    avatarBg: 'bg-slate-700',
    avatarText: 'CA',
    status: 'ONLINE',
    email: 'admin@careguardian.health',
    bio: 'Platform infrastructure, clinical system integration & audit logging.',
  },
];

const initialConversations: Conversation[] = [
  {
    id: 'conv-1',
    user: ALL_USERS[0], // Ananya Kumar (@ananya_kumar)
    lastMessage: 'Doctor, I checked the new antibiotic. Should we hold off on Amoxicillin?',
    lastMessageTime: '10:42 AM',
    unreadCount: 1,
    messages: [
      {
        id: 'm1',
        senderHandle: '@ananya_kumar',
        senderName: 'Ananya Kumar',
        text: 'Good morning Dr. Sharma. My father Ravi had a brief dizzy spell while walking to the kitchen yesterday evening.',
        timestamp: 'Yesterday 6:15 PM',
        isSelf: false,
      },
      {
        id: 'm2',
        senderHandle: '@dr_priya_sharma',
        senderName: 'Dr. Priya Sharma',
        text: 'Hello Ananya. Did he experience any loss of consciousness or sudden weakness in the limbs?',
        timestamp: 'Yesterday 6:30 PM',
        isSelf: true,
        status: 'seen',
      },
      {
        id: 'm3',
        senderHandle: '@ananya_kumar',
        senderName: 'Ananya Kumar',
        text: 'No loss of consciousness, but his step speed was slower. Also, a local GP prescribed Amoxicillin 500mg today for throat irritation.',
        timestamp: '10:38 AM',
        isSelf: false,
      },
      {
        id: 'm4',
        senderHandle: '@dr_priya_sharma',
        senderName: 'Dr. Priya Sharma',
        text: 'STOP immediately! Ravi has a documented severe allergy to Penicillin. Amoxicillin is in the penicillin class and can trigger an anaphylactic reaction. I have flagged a critical contradiction alert.',
        timestamp: '10:40 AM',
        isSelf: true,
        status: 'seen',
        attachment: {
          type: 'medication',
          title: 'Critical Allergy Conflict Alert',
          detail: 'Amoxicillin vs Documented Penicillin Anaphylactoid Allergy',
        },
      },
      {
        id: 'm5',
        senderHandle: '@ananya_kumar',
        senderName: 'Ananya Kumar',
        text: 'Doctor, I checked the new antibiotic. Should we hold off on Amoxicillin? Thank goodness you caught this! What alternative should we ask the GP for?',
        timestamp: '10:42 AM',
        isSelf: false,
      },
    ],
  },
  {
    id: 'conv-2',
    user: ALL_USERS[1], // Suresh Raghavan (@suresh_raghavan)
    lastMessage: 'Morning BP reading logged: 148/88 mmHg. Pulse is 76.',
    lastMessageTime: '9:15 AM',
    unreadCount: 0,
    messages: [
      {
        id: 'm201',
        senderHandle: '@suresh_raghavan',
        senderName: 'Suresh Raghavan',
        text: 'Dr. Sharma, here is the morning blood pressure measurement for Lakshmi as requested.',
        timestamp: '9:12 AM',
        isSelf: false,
        attachment: {
          type: 'vitals',
          title: 'Blood Pressure Measurement',
          detail: '148/88 mmHg • Pulse 76 bpm • Omron Arm Cuff',
        },
      },
      {
        id: 'm202',
        senderHandle: '@suresh_raghavan',
        senderName: 'Suresh Raghavan',
        text: 'Morning BP reading logged: 148/88 mmHg. Pulse is 76.',
        timestamp: '9:15 AM',
        isSelf: false,
      },
      {
        id: 'm203',
        senderHandle: '@dr_priya_sharma',
        senderName: 'Dr. Priya Sharma',
        text: 'Thank you Suresh. It is slightly above our 135 mmHg target. Please ensure she takes the Telmisartan dose with breakfast. We will review at our Friday consult.',
        timestamp: '9:25 AM',
        isSelf: true,
        status: 'seen',
      },
    ],
  },
  {
    id: 'conv-3',
    user: ALL_USERS[3], // Dr. Arjun Nair (@dr_arjun_nair)
    lastMessage: 'Reviewed the geriatric polypharmacy roster for Sunrise centre.',
    lastMessageTime: 'Yesterday',
    unreadCount: 0,
    messages: [
      {
        id: 'm301',
        senderHandle: '@dr_arjun_nair',
        senderName: 'Dr. Arjun Nair',
        text: 'Hi Priya, I reviewed the geriatric polypharmacy roster for Sunrise centre. Sunita B.’s DEXA scan results look consistent with T-score -2.8.',
        timestamp: 'Yesterday 4:00 PM',
        isSelf: false,
      },
      {
        id: 'm302',
        senderHandle: '@dr_priya_sharma',
        senderName: 'Dr. Priya Sharma',
        text: 'Thanks Arjun. I am scheduling a bisphosphonate regimen adjustment for her on Monday.',
        timestamp: 'Yesterday 4:45 PM',
        isSelf: true,
        status: 'seen',
      },
    ],
  },
  {
    id: 'conv-4',
    user: ALL_USERS[5], // Latha Reddy (@latha_caregiver)
    lastMessage: 'Mr. Krishnamurthy was calm after the music therapy session today.',
    lastMessageTime: 'Sep 9',
    unreadCount: 0,
    messages: [
      {
        id: 'm401',
        senderHandle: '@latha_caregiver',
        senderName: 'Latha Reddy',
        text: 'Good afternoon Doctor. Mr. Krishnamurthy was calm after the music therapy session today. Sundowning agitation was noticeably reduced compared to last Tuesday.',
        timestamp: 'Sep 9 3:20 PM',
        isSelf: false,
      },
    ],
  },
];

export default function ClinicianMessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('baseline_clinician_messages');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return initialConversations;
  });

  const [activeConvId, setActiveConvId] = useState<string>(conversations[0]?.id || 'conv-1');
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [modalSearchQuery, setModalSearchQuery] = useState('');
  const [copiedHandle, setCopiedHandle] = useState<string | null>(null);
  const [showTelehealth, setShowTelehealth] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync with local storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('baseline_clinician_messages', JSON.stringify(conversations));
    }
  }, [conversations]);

  // Scroll to bottom of active conversation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeConvId, conversations]);

  const activeConversation = useMemo(() => {
    return conversations.find((c) => c.id === activeConvId) || conversations[0];
  }, [conversations, activeConvId]);

  const { user } = useAuth();
  const currentSenderName = user?.name || 'Dr. Vikram Malhotra';
  const currentSenderHandle = user?.handle || (user?.email ? `@${user.email.split('@')[0]}` : '@dr_vikram_malhotra');

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeConversation) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderHandle: currentSenderHandle,
      senderName: currentSenderName,
      text: inputText.trim(),
      timestamp: 'Just now',
      isSelf: true,
      status: 'sent',
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConversation.id) {
          return {
            ...c,
            lastMessage: newMsg.text,
            lastMessageTime: 'Just now',
            unreadCount: 0,
            messages: [...c.messages, newMsg],
          };
        }
        return c;
      })
    );

    const sentText = inputText.trim();
    setInputText('');

    // Persist to Neon PostgreSQL
    if (activeConversation.user?.id) {
      messagesApi.send({
        receiverId: activeConversation.user.id,
        content: sentText,
        patientId: activeConversation.user.patientId,
      }).catch((err) => {
        console.warn('Neon DB async sync message:', err?.message || err);
      });
    }
  };

  const handleSendQuickAction = (type: 'vitals' | 'medication' | 'followup') => {
    if (!activeConversation) return;

    let attachmentDetail = '';
    let attachmentTitle = '';
    let msgText = '';

    if (type === 'vitals') {
      attachmentTitle = 'Vitals Log Request';
      attachmentDetail = 'Please record blood pressure and resting pulse before 12:00 PM.';
      msgText = 'Clinical prompt: Please log today’s blood pressure and pulse readings when convenient.';
    } else if (type === 'medication') {
      attachmentTitle = 'Medication Adherence Check';
      attachmentDetail = 'Morning doses verification: Telmisartan 40mg + Metformin 500mg.';
      msgText = 'Care Circle reminder: Please confirm if morning medications have been taken today.';
    } else {
      attachmentTitle = 'Follow-up Consultation';
      attachmentDetail = 'Telehealth follow-up scheduled for Friday, 10:00 AM.';
      msgText = 'I have scheduled our follow-up video consultation for Friday at 10:00 AM.';
    }

    const quickMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderHandle: '@dr_priya_sharma',
      senderName: 'Dr. Priya Sharma',
      text: msgText,
      timestamp: 'Just now',
      isSelf: true,
      status: 'sent',
      attachment: {
        type: type === 'vitals' ? 'vitals' : 'medication',
        title: attachmentTitle,
        detail: attachmentDetail,
      },
    };

    setConversations((prev) =>
      prev.map((c) => {
        if (c.id === activeConversation.id) {
          return {
            ...c,
            lastMessage: quickMsg.text,
            lastMessageTime: 'Just now',
            unreadCount: 0,
            messages: [...c.messages, quickMsg],
          };
        }
        return c;
      })
    );
  };

  const handleStartChatWithUser = (targetUser: ChatUser) => {
    // Check if conversation already exists
    const existing = conversations.find((c) => c.user.handle === targetUser.handle);
    if (existing) {
      setActiveConvId(existing.id);
      setShowNewChatModal(false);
      return;
    }

    // Create new conversation
    const newConv: Conversation = {
      id: `conv-${Date.now()}`,
      user: targetUser,
      lastMessage: `Conversation opened with ${targetUser.handle}`,
      lastMessageTime: 'Just now',
      unreadCount: 0,
      messages: [
        {
          id: `m-init-${Date.now()}`,
          senderHandle: '@dr_priya_sharma',
          senderName: 'Dr. Priya Sharma',
          text: `Hello ${targetUser.name}, I am connecting with you regarding clinical coordination on Baseline.`,
          timestamp: 'Just now',
          isSelf: true,
          status: 'sent',
        },
      ],
    };

    setConversations((prev) => [newConv, ...prev]);
    setActiveConvId(newConv.id);
    setShowNewChatModal(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedHandle(text);
    setTimeout(() => setCopiedHandle(null), 2500);
  };

  // Filtered conversation list
  const filteredConversations = useMemo(() => {
    return conversations.filter((c) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          c.user.handle.toLowerCase().includes(q) ||
          c.user.name.toLowerCase().includes(q) ||
          (c.user.patientContext && c.user.patientContext.toLowerCase().includes(q)) ||
          c.lastMessage.toLowerCase().includes(q);
        if (!matches) return false;
      }
      if (selectedRoleFilter !== 'ALL') {
        if (selectedRoleFilter === 'CAREGIVERS' && c.user.role !== 'FAMILY_CAREGIVER' && c.user.role !== 'GUARDIAN') return false;
        if (selectedRoleFilter === 'CLINICIANS' && c.user.role !== 'CLINICIAN') return false;
        if (selectedRoleFilter === 'PATIENTS' && c.user.role !== 'PATIENT') return false;
      }
      return true;
    });
  }, [conversations, searchQuery, selectedRoleFilter]);

  // Filtered directory in New Chat Modal
  const modalFilteredUsers = useMemo(() => {
    if (!modalSearchQuery.trim()) return ALL_USERS;
    const q = modalSearchQuery.toLowerCase();
    return ALL_USERS.filter(
      (u) =>
        u.handle.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q) ||
        u.roleLabel.toLowerCase().includes(q) ||
        (u.patientContext && u.patientContext.toLowerCase().includes(q))
    );
  }, [modalSearchQuery]);

  return (
    <div className="h-[calc(100vh-4rem)] flex overflow-hidden bg-background">
      {/* LEFT PANE: Conversations list */}
      <div className="w-80 md:w-96 flex flex-col border-r border-border bg-white flex-shrink-0">
        {/* User Handle & Action Header */}
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-primary to-blue-500 text-white flex items-center justify-center font-bold text-xs ring-2 ring-primary/20">
              PS
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <span className="font-bold text-sm text-foreground truncate">@dr_priya_sharma</span>
                <span className="h-2 w-2 rounded-full bg-emerald-500 flex-shrink-0" title="Online" />
              </div>
              <p className="text-[11px] text-muted-foreground truncate">Internal Medicine • Clinician ID #0346</p>
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => setShowNewChatModal(true)}
            className="h-8 px-2.5 text-xs gap-1.5 shadow-sm"
          >
            <Plus className="h-3.5 w-3.5" /> New
          </Button>
        </div>

        {/* Search input */}
        <div className="p-3 border-b border-border">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search by @handle, name, or patient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-input bg-muted/30 py-1.5 pl-8 pr-3 text-xs outline-none focus:bg-background focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 mt-2.5 overflow-x-auto no-scrollbar text-[11px] font-medium">
            <button
              onClick={() => setSelectedRoleFilter('ALL')}
              className={cn(
                'px-2.5 py-1 rounded-full whitespace-nowrap transition-colors',
                selectedRoleFilter === 'ALL'
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              All Direct Messages
            </button>
            <button
              onClick={() => setSelectedRoleFilter('CAREGIVERS')}
              className={cn(
                'px-2.5 py-1 rounded-full whitespace-nowrap transition-colors',
                selectedRoleFilter === 'CAREGIVERS'
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              Caregivers
            </button>
            <button
              onClick={() => setSelectedRoleFilter('CLINICIANS')}
              className={cn(
                'px-2.5 py-1 rounded-full whitespace-nowrap transition-colors',
                selectedRoleFilter === 'CLINICIANS'
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              Doctors
            </button>
            <button
              onClick={() => setSelectedRoleFilter('PATIENTS')}
              className={cn(
                'px-2.5 py-1 rounded-full whitespace-nowrap transition-colors',
                selectedRoleFilter === 'PATIENTS'
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'text-muted-foreground hover:bg-muted'
              )}
            >
              Patients
            </button>
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/60">
          {filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-xs">
              No conversations found. Click &ldquo;+ New&rdquo; to start messaging by user handle.
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const isActive = conv.id === activeConversation?.id;
              const user = conv.user;

              return (
                <div
                  key={conv.id}
                  onClick={() => {
                    setActiveConvId(conv.id);
                    // Clear unread count on selection
                    setConversations((prev) =>
                      prev.map((c) => (c.id === conv.id ? { ...c, unreadCount: 0 } : c))
                    );
                  }}
                  className={cn(
                    'p-3.5 flex items-start gap-3 cursor-pointer transition-colors hover:bg-muted/40',
                    isActive && 'bg-primary/5 border-l-4 border-l-primary'
                  )}
                >
                  {/* Instagram-style Avatar with gradient ring */}
                  <div className="relative flex-shrink-0">
                    <div className="p-[2px] rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-primary">
                      <div
                        className={cn(
                          'h-11 w-11 rounded-full flex items-center justify-center font-bold text-xs text-white border-2 border-white',
                          user.avatarBg
                        )}
                      >
                        {user.avatarText}
                      </div>
                    </div>
                    {user.status === 'ONLINE' && (
                      <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-white" />
                    )}
                  </div>

                  {/* Conv Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-xs font-bold text-foreground truncate">
                        {user.name}
                      </p>
                      <span className="text-[10px] text-muted-foreground flex-shrink-0">
                        {conv.lastMessageTime}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-[11px] font-semibold text-primary truncate">
                        {user.handle}
                      </span>
                      <span className="text-[10px] text-muted-foreground truncate">
                        • {user.roleLabel}
                      </span>
                    </div>

                    <p className="text-xs text-muted-foreground line-clamp-1 mt-1">
                      {conv.lastMessage}
                    </p>

                    {user.patientContext && (
                      <div className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground bg-muted/60 px-1.5 py-0.5 rounded w-fit">
                        <Heart className="h-2.5 w-2.5 text-rose-500" />
                        <span className="truncate">{user.patientContext}</span>
                      </div>
                    )}
                  </div>

                  {/* Unread indicator */}
                  {conv.unreadCount > 0 && (
                    <span className="flex-shrink-0 h-5 w-5 rounded-full bg-primary text-white font-bold text-[10px] flex items-center justify-center">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* CENTER PANE: Active Chat */}
      {activeConversation ? (
        <div className="flex-1 flex flex-col min-w-0 bg-slate-50/40">
          {/* Chat Header */}
          <div className="h-16 px-6 border-b border-border bg-white flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              {/* Avatar with IG-style gradient ring */}
              <div className="relative flex-shrink-0">
                <div className="p-[2px] rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-primary">
                  <div
                    className={cn(
                      'h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs text-white border-2 border-white',
                      activeConversation.user.avatarBg
                    )}
                  >
                    {activeConversation.user.avatarText}
                  </div>
                </div>
                {activeConversation.user.status === 'ONLINE' && (
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-foreground truncate">
                    {activeConversation.user.name}
                  </h2>
                  <button
                    onClick={() => copyToClipboard(activeConversation.user.handle)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    title="Click to copy handle"
                  >
                    {activeConversation.user.handle}
                    <Copy className="h-3 w-3 text-muted-foreground" />
                  </button>
                  {copiedHandle === activeConversation.user.handle && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1 rounded">Copied!</span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground flex items-center gap-2 truncate">
                  <span>{activeConversation.user.roleLabel}</span>
                  {activeConversation.user.patientContext && (
                    <>
                      <span>•</span>
                      <span className="text-foreground font-medium">{activeConversation.user.patientContext}</span>
                    </>
                  )}
                  <span>•</span>
                  <span className={activeConversation.user.status === 'ONLINE' ? 'text-emerald-600 font-medium' : ''}>
                    {activeConversation.user.status === 'ONLINE' ? 'Active now' : activeConversation.user.lastSeen || 'Offline'}
                  </span>
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {activeConversation.user.patientId && (
                <Link href={`/clinician/patients/${activeConversation.user.patientId}`}>
                  <Button variant="outline" size="sm" className="text-xs gap-1.5 h-8">
                    <Activity className="h-3.5 w-3.5 text-primary" /> Patient Brief
                  </Button>
                </Link>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => alert(`Starting encrypted clinical audio call with ${activeConversation.user.handle}...`)}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="Voice Call"
              >
                <Phone className="h-4 w-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowTelehealth(true)}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                title="Video Consultation"
              >
                <Video className="h-4 w-4" />
              </Button>

              <Button
                variant={showProfileDrawer ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setShowProfileDrawer(!showProfileDrawer)}
                className="h-8 w-8"
                title="User Profile Card"
              >
                <Info className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="text-center my-2">
              <span className="bg-muted text-muted-foreground text-[10px] font-semibold px-3 py-1 rounded-full uppercase tracking-wider">
                End-to-End Encrypted Healthcare Memory Channel
              </span>
            </div>

            {activeConversation.messages.map((msg) => {
              const isSelf = msg.isSelf;

              return (
                <div
                  key={msg.id}
                  className={cn(
                    'flex flex-col max-w-[75%]',
                    isSelf ? 'ml-auto items-end' : 'mr-auto items-start'
                  )}
                >
                  {!isSelf && (
                    <span className="text-[11px] font-semibold text-primary mb-1 ml-1">
                      {msg.senderHandle}
                    </span>
                  )}

                  {/* Message bubble */}
                  <div
                    className={cn(
                      'p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm',
                      isSelf
                        ? 'bg-primary text-primary-foreground rounded-br-none'
                        : 'bg-white text-foreground border border-border rounded-bl-none'
                    )}
                  >
                    <p>{msg.text}</p>

                    {/* Attachment Card if present */}
                    {msg.attachment && (
                      <div
                        className={cn(
                          'mt-2.5 p-2.5 rounded-lg border text-[11px] space-y-1',
                          isSelf
                            ? 'bg-white/10 border-white/20 text-white'
                            : 'bg-muted/50 border-border text-foreground'
                        )}
                      >
                        <div className="flex items-center gap-1.5 font-bold">
                          {msg.attachment.type === 'vitals' && <Activity className="h-3.5 w-3.5" />}
                          {msg.attachment.type === 'medication' && <Pill className="h-3.5 w-3.5 text-rose-500" />}
                          <span>{msg.attachment.title}</span>
                        </div>
                        <p className="opacity-90">{msg.attachment.detail}</p>
                      </div>
                    )}
                  </div>

                  {/* Timestamp & read receipts */}
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-1 px-1">
                    <span>{msg.timestamp}</span>
                    {isSelf && (
                      <span className="text-primary">
                        {msg.status === 'seen' ? (
                          <CheckCheck className="h-3 w-3 inline" />
                        ) : (
                          <Check className="h-3 w-3 inline" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Action Chips */}
          <div className="px-6 py-2 bg-white/80 border-t border-border flex items-center gap-2 overflow-x-auto text-xs">
            <span className="text-muted-foreground text-[11px] font-medium whitespace-nowrap">
              Quick Clinical Actions:
            </span>
            <button
              type="button"
              onClick={() => handleSendQuickAction('vitals')}
              className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors"
            >
              <Activity className="h-3 w-3" /> Request Vitals Log
            </button>
            <button
              type="button"
              onClick={() => handleSendQuickAction('medication')}
              className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors"
            >
              <Pill className="h-3 w-3" /> Medication Check
            </button>
            <button
              type="button"
              onClick={() => handleSendQuickAction('followup')}
              className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors"
            >
              <Calendar className="h-3 w-3" /> Schedule Consult
            </button>
          </div>

          {/* Input Bar */}
          <div className="p-4 bg-white border-t border-border">
            <form onSubmit={handleSendMessage} className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => alert('Attachment upload dialog')}
                className="text-muted-foreground hover:text-foreground p-1.5 rounded-lg hover:bg-muted"
                title="Attach medical document or image"
              >
                <Paperclip className="h-4 w-4" />
              </button>

              <input
                type="text"
                placeholder={`Message ${activeConversation.user.handle}... (press Enter to send)`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 rounded-xl border border-input bg-muted/20 px-4 py-2.5 text-xs outline-none focus:bg-background focus:ring-2 focus:ring-primary"
              />

              <Button type="submit" size="sm" disabled={!inputText.trim()} className="gap-1.5 px-4 h-9">
                <Send className="h-3.5 w-3.5" /> Send
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
          Select a conversation from the left to start messaging.
        </div>
      )}

      {/* RIGHT DRAWER: Instagram-style User Profile Card */}
      {showProfileDrawer && activeConversation && (
        <div className="w-80 border-l border-border bg-white flex flex-col overflow-y-auto animate-fade-in p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">User Profile</h3>
            <button
              onClick={() => setShowProfileDrawer(false)}
              className="text-muted-foreground hover:text-foreground text-sm font-bold"
            >
              ✕
            </button>
          </div>

          {/* Profile Card */}
          <div className="flex flex-col items-center text-center space-y-3">
            {/* Gradient Avatar */}
            <div className="p-[3px] rounded-full bg-gradient-to-tr from-amber-500 via-rose-500 to-primary">
              <div
                className={cn(
                  'h-20 w-20 rounded-full flex items-center justify-center font-extrabold text-xl text-white border-4 border-white',
                  activeConversation.user.avatarBg
                )}
              >
                {activeConversation.user.avatarText}
              </div>
            </div>

            <div>
              <h4 className="font-bold text-base text-foreground">{activeConversation.user.name}</h4>
              <div className="flex items-center justify-center gap-1 mt-0.5">
                <span className="text-xs font-bold text-primary">{activeConversation.user.handle}</span>
                <button
                  onClick={() => copyToClipboard(activeConversation.user.handle)}
                  className="text-muted-foreground hover:text-primary"
                  title="Copy handle"
                >
                  <Copy className="h-3 w-3" />
                </button>
              </div>
              <Badge variant="outline" className="mt-2 text-[10px] font-semibold">
                {activeConversation.user.roleLabel}
              </Badge>
            </div>

            {activeConversation.user.bio && (
              <p className="text-xs text-muted-foreground bg-muted/40 p-3 rounded-xl border border-border text-left">
                {activeConversation.user.bio}
              </p>
            )}
          </div>

          {/* Associated Patient */}
          {activeConversation.user.patientContext && (
            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 space-y-1.5 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-blue-900">
                <Heart className="h-3.5 w-3.5 text-rose-500" />
                <span>Patient Care Circle</span>
              </div>
              <p className="text-blue-800">{activeConversation.user.patientContext}</p>
              {activeConversation.user.patientId && (
                <Link
                  href={`/clinician/patients/${activeConversation.user.patientId}`}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline pt-1"
                >
                  Open health memory brief <ExternalLink className="h-3 w-3" />
                </Link>
              )}
            </div>
          )}

          {/* Contact Details */}
          <div className="space-y-3 text-xs border-t border-border pt-4">
            <h5 className="font-bold text-foreground text-[11px] uppercase tracking-wider">Contact Information</h5>
            <div>
              <p className="text-muted-foreground text-[11px]">Email</p>
              <p className="font-medium text-foreground truncate">{activeConversation.user.email}</p>
            </div>
            {activeConversation.user.phone && (
              <div>
                <p className="text-muted-foreground text-[11px]">Phone</p>
                <p className="font-medium text-foreground">{activeConversation.user.phone}</p>
              </div>
            )}
            <div>
              <p className="text-muted-foreground text-[11px]">Platform User ID</p>
              <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-mono truncate block mt-0.5">
                {activeConversation.user.id}
              </code>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: New Message / User Directory with Handles */}
      {showNewChatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-border max-w-lg w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" /> Start New Direct Message
                </h3>
                <p className="text-xs text-muted-foreground">
                  Select any CareGuardian user by their unique <span className="font-mono text-primary font-semibold">@handle</span>
                </p>
              </div>
              <button
                onClick={() => setShowNewChatModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Search */}
            <div className="p-3 border-b border-border bg-muted/20">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search user by @handle, name, or role..."
                  value={modalSearchQuery}
                  onChange={(e) => setModalSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-input bg-white py-1.5 pl-8 pr-3 text-xs outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>

            {/* User list */}
            <div className="flex-1 overflow-y-auto divide-y divide-border p-2">
              {modalFilteredUsers.map((u) => (
                <div
                  key={u.id}
                  onClick={() => handleStartChatWithUser(u)}
                  className="p-3 flex items-center justify-between hover:bg-muted/50 rounded-xl cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={cn(
                        'h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs text-white flex-shrink-0',
                        u.avatarBg
                      )}
                    >
                      {u.avatarText}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-foreground truncate">{u.name}</span>
                        <span className="text-xs font-bold text-primary truncate">{u.handle}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {u.roleLabel} {u.patientContext && `• ${u.patientContext}`}
                      </p>
                    </div>
                  </div>

                  <Button size="sm" variant="ghost" className="text-xs h-7 text-primary font-semibold">
                    Chat
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Telehealth Video Consultation Modal */}
      {showTelehealth && activeConversation && (
        <TelehealthModal
          isOpen={showTelehealth}
          onClose={() => setShowTelehealth(false)}
          patientName={activeConversation.user.name}
          patientHandle={activeConversation.user.handle}
        />
      )}
    </div>
  );
}
