import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Heart, Grid, Users, Contact, FileText, Mail, Calendar, CheckSquare, BarChart2,
  Settings, HelpCircle, Search, Bell, AlertTriangle, ChevronRight, ChevronLeft,
  ChevronDown, Activity, Pill, User
} from 'lucide-react';
import { usePatient } from '../hooks/usePatient';
import { useYearTimeline } from '../hooks/useYearTimeline';
import { useChanges } from '../hooks/useChanges';
import { useObservations } from '../hooks/useObservations';
import { useCareCircle } from '../hooks/useCareCircle';
import { useBrief } from '../hooks/useBrief';
import { useWhatChanged } from '../hooks/useWhatChanged';
import { formatDate } from '../lib/format';

const TABS = [
  'Overview',
  'Timeline',
  'Health Graph',
  'Medications',
  'Observations',
  'Reports',
  'Care Circle',
  'Clinical Notes',
  'Documents',
];

const statusColors: Record<string, string> = {
  GOOD: '#10b981', // green
  STABLE: '#84cc16', // light green
  WATCH: '#eab308', // yellow
  CONCERN: '#f97316', // orange
  CRITICAL: '#ef4444', // red
};

export default function PatientDesktopUI() {
  const { id = '' } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState('Timeline');
  const [selectedYear, setSelectedYear] = useState<number | null>(null);

  const patientQuery = usePatient(id);
  const ytQuery = useYearTimeline(id);
  const ccQuery = useCareCircle(id);
  const changesQuery = useChanges(id);
  const whatChangedQuery = useWhatChanged(id);
  const briefQuery = useBrief(id);

  const patient = patientQuery.data;
  const years = ytQuery.data?.years || [];
  
  useEffect(() => {
    if (ytQuery.data?.currentYear && selectedYear === null) {
      setSelectedYear(ytQuery.data.currentYear);
    } else if (years.length > 0 && selectedYear === null) {
      setSelectedYear(years[years.length - 1].year);
    }
  }, [ytQuery.data, selectedYear, years]);

  if (patientQuery.isLoading || ytQuery.isLoading) {
    return <div className="h-screen flex items-center justify-center text-slate-500">Loading...</div>;
  }
  
  if (!patient) {
    return <div className="h-screen flex items-center justify-center text-slate-500">Patient not found</div>;
  }

  const sortedYears = [...years].sort((a, b) => a.year - b.year);
  const yearData = years.find(y => y.year === selectedYear) || years[years.length - 1];

  const Sidebar = () => (
    <div className="hidden lg:flex w-[260px] bg-slate-50 border-r border-slate-200 flex-col h-screen overflow-hidden">
      <div className="p-6 flex items-center gap-3 shrink-0">
        <Heart className="w-7 h-7 text-blue-900 fill-blue-900" />
        <span className="text-xl font-extrabold text-slate-900 tracking-tight">Baseline</span>
      </div>
      <div className="flex-1 px-4 overflow-y-auto">
        {[
          { icon: Grid, label: 'Dashboard' },
          { icon: Users, label: 'Patients', active: true },
          { icon: Contact, label: 'Care Circle' },
          { icon: FileText, label: 'Reports' },
          { icon: Mail, label: 'Messages', badge: 3 },
          { icon: Calendar, label: 'Calendar' },
          { icon: CheckSquare, label: 'Tasks' },
          { icon: BarChart2, label: 'Analytics' },
        ].map((item, i) => (
          <button
            key={i}
            className={`w-full flex items-center justify-between p-3 rounded-xl mb-1 transition-colors ${item.active ? 'bg-blue-50' : 'hover:bg-slate-100'}`}
          >
            <div className="flex items-center gap-3">
              <item.icon className={`w-5 h-5 ${item.active ? 'text-blue-600' : 'text-slate-500'}`} />
              <span className={`text-[15px] font-medium ${item.active ? 'text-blue-700' : 'text-slate-600'}`}>{item.label}</span>
            </div>
            {item.badge && (
              <div className="bg-red-500 rounded-full w-5 h-5 flex items-center justify-center">
                <span className="text-[11px] font-bold text-white">{item.badge}</span>
              </div>
            )}
          </button>
        ))}
      </div>
      <div className="p-4 border-t border-slate-200 shrink-0">
        <button className="w-full flex items-center gap-3 p-3 mb-1 rounded-xl hover:bg-slate-100 transition-colors">
          <Settings className="w-5 h-5 text-slate-500" />
          <span className="text-[15px] font-medium text-slate-600">Settings</span>
        </button>
        <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-100 transition-colors mb-4">
          <HelpCircle className="w-5 h-5 text-slate-500" />
          <span className="text-[15px] font-medium text-slate-600">Help & Support</span>
        </button>
        <div className="flex items-center gap-3 p-2">
          <div className="w-10 h-10 bg-slate-300 rounded-full overflow-hidden flex shrink-0">
            <div className="w-full h-full bg-slate-700 flex items-center justify-center">
              <span className="text-white font-bold text-sm">PS</span>
            </div>
          </div>
          <div className="text-left flex-1 min-w-0">
            <div className="text-sm font-bold text-slate-900 truncate">Dr. Priya Sharma</div>
            <div className="text-xs text-slate-500 truncate">Clinician</div>
            <div className="text-[10px] text-slate-400 truncate">Riverside Care Center</div>
          </div>
        </div>
      </div>
    </div>
  );

  const TopNav = () => (
    <div className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between shrink-0">
      <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 w-[400px]">
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="text"
          className="flex-1 ml-3 text-sm text-slate-800 bg-transparent outline-none"
          placeholder="Search patients, people, reports..."
        />
      </div>
      <div className="flex items-center gap-4">
        <button className="relative p-2 hover:bg-slate-100 rounded-full transition-colors">
          <Bell className="w-6 h-6 text-slate-500" />
          <div className="absolute top-1 right-1 bg-red-500 w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
            <span className="text-[9px] font-bold text-white">3</span>
          </div>
        </button>
        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
          <span className="text-sm font-bold text-slate-600">PS</span>
        </div>
      </div>
    </div>
  );

  const PatientHeader = () => (
    <div className="px-8 pt-8 pb-4 shrink-0 bg-white">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-5">
          <div className="w-24 h-24 rounded-full bg-teal-600 flex items-center justify-center border-4 border-white shadow-sm overflow-hidden shrink-0">
            <span className="text-4xl font-bold text-white uppercase">{patient.firstName[0]}{patient.lastName[0]}</span>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight m-0">{patient.firstName} {patient.lastName}</h1>
            <div className="flex items-center gap-3 mt-1 mb-2">
              <span className="text-sm text-slate-700">{patient.dateOfBirth ? `${new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} years` : 'Age unknown'}</span>
              <span className="text-slate-300">|</span>
              <span className="text-sm text-slate-700">{patient.gender ? patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1) : 'Male'}</span>
              <span className="text-slate-300">|</span>
              <span className="text-sm text-slate-500">Patient ID: {patient.id.substring(0,8)}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-emerald-500 px-3 py-0.5 rounded-full">
                <span className="text-xs font-bold text-white leading-none">Active</span>
              </div>
              <span className="text-xs text-slate-500">Last updated: {formatDate(patient.updatedAt)}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-6">
          <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm min-w-[280px]">
            <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
            <div className="flex-1">
              <div className="text-sm font-bold text-red-700">Changes detected</div>
              <div className="text-xs text-red-600">{changesQuery.data?.length || 0} meaningful changes</div>
            </div>
            <ChevronRight className="w-4 h-4 text-red-500" />
          </div>
          
          <div className="flex gap-8">
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Primary Doctor</div>
              <div className="text-sm font-medium text-slate-800">Dr. Priya Sharma</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">Active Care Circle</div>
              <div className="text-sm font-medium text-slate-800">{ccQuery.data?.length || 0} people</div>
            </div>
          </div>
          
          <div className="flex items-start gap-2 ml-4">
            <button className="bg-blue-600 px-6 py-2 rounded-lg shadow-sm hover:bg-blue-700 transition-colors">
              <span className="text-sm font-bold text-white">Actions</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const TabBar = () => (
    <div className="border-b border-slate-200 px-8 shrink-0 bg-white">
      <div className="flex overflow-x-auto hide-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`mr-8 pb-3 pt-2 border-b-2 whitespace-nowrap transition-colors ${activeTab === tab ? 'border-blue-600 text-blue-700 font-medium' : 'border-transparent text-slate-500 hover:text-slate-700 font-medium'}`}
          >
            <span className="text-[15px]">{tab}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const ConnectedTimeline = () => (
    <div className="mb-8 relative mt-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 m-0">Health Timeline</h2>
          <p className="text-sm text-slate-500 mt-1 m-0">A year-by-year view of key health events, changes, and overall status.</p>
        </div>
        <div className="flex items-center gap-4">
          {Object.entries(statusColors).map(([label, color]) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs font-medium text-slate-600">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center bg-white hover:bg-slate-50 shrink-0">
          <ChevronLeft className="w-4 h-4 text-slate-500" />
        </button>
        
        <div className="flex-1 flex relative h-28 items-center justify-between px-6 overflow-hidden">
          <div className="absolute top-[42px] left-12 right-12 h-[2px] bg-slate-200 z-0" />
          
          {sortedYears.map((item) => {
            const isSelected = item.year === selectedYear;
            const color = statusColors[item.status] || '#94a3b8';
            return (
              <button
                key={item.year}
                onClick={() => setSelectedYear(item.year)}
                className={`z-10 flex flex-col items-center justify-start h-full pt-6 w-24 rounded-xl transition-all ${isSelected ? 'border border-blue-600 bg-blue-50/50' : 'hover:bg-slate-50'}`}
              >
                <div className="w-4 h-4 rounded-full mb-3" style={{ backgroundColor: color, boxShadow: `0 2px 4px ${color}60` }} />
                <span className={`text-base font-bold leading-none ${isSelected ? 'text-slate-900' : 'text-slate-600'}`}>{item.year}</span>
                <span className="text-xs font-semibold mb-2 mt-1" style={{ color }}>{item.label || item.status}</span>
                <span className="text-[10px] text-slate-500 text-center leading-[14px] px-1 line-clamp-2">{item.summary}</span>
              </button>
            );
          })}
        </div>
        
        <button className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center bg-white hover:bg-slate-50 shrink-0">
          <ChevronRight className="w-4 h-4 text-slate-500" />
        </button>
      </div>
    </div>
  );

  const TimelineContent = () => {
    if (!yearData) return <div className="p-8">No data for this year</div>;
    
    const prevYear = yearData.year - 1;
    const nextYear = yearData.year + 1;
    const ccMembers = ccQuery.data || [];
    
    return (
      <div className="flex flex-col px-8 py-6 max-w-[1600px] mx-auto w-full">
        <ConnectedTimeline />
        
        <div className="flex gap-6">
          <div className="flex-[0.45] flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 rounded-full" style={{ backgroundColor: statusColors[yearData.status] }} />
                <span className="text-3xl font-extrabold text-slate-900">{yearData.year}</span>
                <div className="px-3 py-1 rounded-full ml-1" style={{ backgroundColor: `${statusColors[yearData.status]}20` }}>
                  <span className="text-xs font-bold" style={{ color: statusColors[yearData.status] }}>{yearData.label || yearData.status}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">&lt; {prevYear}</button>
                <button className="text-sm font-semibold text-slate-600 px-3 py-1.5 rounded-lg hover:bg-slate-100 transition-colors">{nextYear} &gt;</button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { title: 'Missed Medications', val: yearData.metrics.missedMedications, icon: Pill, bgClass: 'bg-red-50/50', borderClass: 'border-red-100', iconBg: 'bg-red-100', iconColor: 'text-red-500' },
                { title: 'Functional Changes', val: yearData.metrics.functionalChanges, icon: Activity, bgClass: 'bg-orange-50/50', borderClass: 'border-orange-100', iconBg: 'bg-orange-100', iconColor: 'text-orange-500' },
                { title: 'Cognitive Changes', val: yearData.metrics.cognitiveChanges, icon: Activity, bgClass: 'bg-indigo-50/50', borderClass: 'border-indigo-100', iconBg: 'bg-indigo-100', iconColor: 'text-indigo-500' },
                { title: 'Hospitalizations', val: yearData.metrics.hospitalizations, icon: Activity, bgClass: 'bg-emerald-50/50', borderClass: 'border-emerald-100', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-500' }
              ].map((m, i) => (
                <div key={i} className={`${m.bgClass} border ${m.borderClass} rounded-xl p-4 flex flex-col justify-center`}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`${m.iconBg} w-6 h-6 rounded-full flex items-center justify-center`}>
                      <m.icon className={`w-3.5 h-3.5 ${m.iconColor}`} />
                    </div>
                    <span className="text-[11px] font-semibold text-slate-600 uppercase tracking-wide">{m.title}</span>
                  </div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-xl font-bold text-slate-900">{m.val}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-slate-900 m-0">Events in {selectedYear}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">Filter by:</span>
                  <button className="border border-slate-200 rounded-lg px-3 py-1.5 flex items-center gap-2 bg-white hover:bg-slate-50">
                    <span className="text-xs font-medium text-slate-700">All Events</span>
                    <ChevronDown className="w-3 h-3 text-slate-500" />
                  </button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute left-[85px] top-4 bottom-4 w-px bg-slate-200 z-0" />
                {yearData.events.slice(0, 10).map((ev) => {
                  let IconCmp = Activity;
                  let bg = 'bg-slate-50';
                  let color = 'text-slate-400';
                  let dot = 'bg-slate-300';
                  if (ev.type.includes('MEDICATION')) { IconCmp = Pill; bg = 'bg-red-50'; color = 'text-red-500'; dot = 'bg-red-400'; }
                  if (ev.type.includes('COGNITIVE')) { IconCmp = Activity; bg = 'bg-indigo-50'; color = 'text-indigo-500'; dot = 'bg-indigo-400'; }
                  if (ev.type.includes('FUNCTIONAL')) { IconCmp = Activity; bg = 'bg-orange-50'; color = 'text-orange-500'; dot = 'bg-orange-400'; }
                  if (ev.type.includes('HOSPITAL')) { IconCmp = Activity; bg = 'bg-rose-50'; color = 'text-rose-500'; dot = 'bg-rose-400'; }
                  
                  return (
                    <div key={ev.id} className="flex items-start mb-2 group">
                      <div className="w-[85px] pt-3 pr-4 text-right shrink-0">
                        <span className="text-[11px] font-medium text-slate-500">{formatDate(ev.timestamp).split(',')[0]}</span>
                      </div>
                      <div className="relative z-10 pt-4 px-1 shrink-0">
                        <div className={`w-2.5 h-2.5 rounded-full border-2 border-white ${dot} relative -left-1`} />
                      </div>
                      <div className="flex-1 ml-4 my-1 p-3 bg-white border border-slate-200 rounded-xl shadow-sm flex items-center hover:bg-slate-50 transition-colors cursor-pointer group-hover:border-blue-200">
                        <div className={`w-8 h-8 rounded-full ${bg} flex items-center justify-center mr-3 shrink-0`}>
                          <IconCmp className={`w-3.5 h-3.5 ${color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[13px] font-bold text-slate-800 truncate">{ev.type.replace(/_/g, ' ')}</div>
                          {ev.description && <div className="text-[11px] text-slate-500 mt-0.5 truncate">{ev.description}</div>}
                        </div>
                        <div className="bg-slate-100 px-2.5 py-1 rounded-full ml-2 shrink-0">
                          <span className="text-[10px] font-medium text-slate-600 uppercase tracking-wide">{ev.sourceType}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex-[0.3] flex flex-col gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-3 mt-0">Year Summary</h3>
              <p className="text-[13px] text-slate-600 leading-relaxed mb-5 m-0">
                {yearData.summary}
              </p>
              {yearData.reasons.length > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-bold text-red-800">Key Takeaways</span>
                  </div>
                  <ul className="pl-5 m-0 space-y-1.5 text-[12px] text-slate-700 list-disc marker:text-red-300">
                    {yearData.reasons.map((r, idx) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
              <button className="w-full bg-blue-600 hover:bg-blue-700 py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-colors text-white">
                <FileText className="w-4 h-4" />
                <span className="text-sm font-bold">Generate Clinical Summary</span>
              </button>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-4 mt-0">Care Circle Reports</h3>
              <div className="flex flex-col gap-4">
                {ccMembers.length === 0 ? <span className="text-sm text-slate-500">No active members found.</span> : ccMembers.map((p, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <User className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-slate-800 truncate">{p.name} <span className="text-slate-400 font-normal">({p.relationshipType})</span></div>
                    </div>
                    <span className="text-[11px] text-slate-500 w-12 text-right shrink-0">{p.observationCount} rep</span>
                    <div className="w-16 h-2 bg-slate-100 rounded-full overflow-hidden shrink-0">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${Math.min(100, p.observationCount * 5)}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex-[0.25] flex flex-col gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h3 className="text-base font-bold text-slate-900 mb-4 mt-0">Yearly Overview</h3>
              <div className="flex flex-col gap-1">
                {[...years].sort((a,b)=>b.year-a.year).map((y, i) => (
                  <button key={i} className="flex items-center py-2 hover:bg-slate-50 rounded-lg px-2 w-full text-left transition-colors">
                    <div className="w-2.5 h-2.5 rounded-full mr-3 shrink-0" style={{ backgroundColor: statusColors[y.status] }} />
                    <span className="text-[13px] font-bold text-slate-800 w-10 shrink-0">{y.year}</span>
                    <span className="text-[11px] text-slate-500 flex-1 ml-2 truncate">{y.label || y.status}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-slate-900">Compare Years</span>
                <ChevronDown className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex items-center gap-2 mb-4">
                <button className="flex-1 border border-slate-200 rounded-lg px-3 py-2 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors">
                  <span className="text-xs font-semibold text-slate-700">{prevYear}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
                <span className="text-xs font-medium text-slate-400">vs</span>
                <button className="flex-1 border border-slate-200 rounded-lg px-3 py-2 flex items-center justify-between bg-slate-50 hover:bg-slate-100 transition-colors">
                  <span className="text-xs font-semibold text-slate-700">{yearData.year}</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>
              </div>
              <button className="w-full bg-blue-50 py-2.5 rounded-xl flex items-center justify-center gap-2 border border-blue-100 hover:bg-blue-100 transition-colors text-blue-700">
                <BarChart2 className="w-4 h-4" />
                <span className="text-[13px] font-bold">Compare Side by Side</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const OverviewContent = () => {
    return (
      <div className="p-8 flex flex-col items-center justify-center h-64 text-slate-500">
        Overview content loading components... (Feature stubs omitted for brevity)
      </div>
    );
  };

  return (
    <div className="flex h-screen w-full bg-slate-50 overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <TopNav />
        <div className="flex-1 flex flex-col overflow-y-auto">
          <PatientHeader />
          <TabBar />
          <div className="flex-1">
            {activeTab === 'Timeline' && <TimelineContent />}
            {activeTab === 'Overview' && <OverviewContent />}
            {activeTab !== 'Timeline' && activeTab !== 'Overview' && (
              <div className="flex-1 flex items-center justify-center p-12 text-slate-400">
                Content for {activeTab} is linked via API endpoints.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
