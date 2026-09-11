"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, AlertTriangle, Search, UserPlus, Activity, Heart, Brain, Wind } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { patientsApi } from '@/lib/api';

// Full mock patient roster — always shown, merged with live API data when available
const MOCK_PATIENTS = [
  { id: '77777777-0000-4000-8000-000000000001', firstName: 'Devaki', lastName: 'Sundaram', conditions: ['HFpEF', 'Type 2 Diabetes', 'Hypertension'], risk: 'High', lastVisit: '2026-09-10', doctor: 'Dr. Vikram Malhotra', age: 72, gender: 'Female', careCircle: 4 },
  { id: '66c67bf7-f6e3-478e-b972-20d7d25b4958', firstName: 'Ravi', lastName: 'Kumar', conditions: ['Penicillin Allergy', 'Post-Surgical Recovery', 'Anaemia'], risk: 'Critical', lastVisit: '2026-09-11', doctor: 'Dr. Vikram Malhotra', age: 67, gender: 'Male', careCircle: 3 },
  { id: '33ec2506-2cfd-437d-8c66-defd67159f29', firstName: 'Sunita', lastName: 'Balasubramanian', conditions: ['COPD Stage II', 'Osteoporosis'], risk: 'Moderate', lastVisit: '2026-09-08', doctor: 'Dr. Priya Sharma', age: 74, gender: 'Female', careCircle: 5 },
  { id: 'eaf97dad-41d4-4e48-a345-5f1d3f0f5380', firstName: 'Lakshmi', lastName: 'Raghavan', conditions: ['Hyperlipidaemia', 'Coronary Artery Disease'], risk: 'High', lastVisit: '2026-09-09', doctor: 'Dr. Vikram Malhotra', age: 70, gender: 'Female', careCircle: 2 },
  { id: 'a9f1ca74-032e-465f-b153-54365602c4ca', firstName: 'Gopalan', lastName: 'Rajan', conditions: ["Parkinson's Disease", 'Depression'], risk: 'High', lastVisit: '2026-09-07', doctor: 'Dr. Priya Sharma', age: 79, gender: 'Male', careCircle: 6 },
  { id: '3489a162-e878-493a-92e3-ad33476afc55', firstName: 'Mohan', lastName: 'Pillai', conditions: ['Atrial Fibrillation', 'CKD Stage 3'], risk: 'Critical', lastVisit: '2026-09-10', doctor: 'Dr. Vikram Malhotra', age: 76, gender: 'Male', careCircle: 4 },
  { id: '2275974a-33b5-4f1d-aa97-79b60c26893e', firstName: 'Kamala', lastName: 'Venkatesh', conditions: ["Alzheimer's (Mild)", 'Hypothyroidism'], risk: 'Moderate', lastVisit: '2026-09-06', doctor: 'Dr. Anand Rao', age: 82, gender: 'Female', careCircle: 7 },
  { id: '5b29040a-ea76-4cf3-9d2c-f63c70fcd419', firstName: 'Krishnamurthy', lastName: 'Swaminathan', conditions: ['Type 2 Diabetes', 'Diabetic Neuropathy'], risk: 'High', lastVisit: '2026-09-05', doctor: 'Dr. Vikram Malhotra', age: 68, gender: 'Male', careCircle: 3 },
  { id: 'f400c4b2-e9be-4223-ac3a-342868fd48d6', firstName: 'Radha', lastName: 'Krishnan', conditions: ['Hypertension', 'Glaucoma'], risk: 'Stable', lastVisit: '2026-09-03', doctor: 'Dr. Priya Sharma', age: 71, gender: 'Female', careCircle: 2 },
  { id: '95007ae1-f846-4543-9446-5bdf68ddfd32', firstName: 'Balaji', lastName: 'Subramaniam', conditions: ['Post-Stroke Recovery', 'Dysphagia'], risk: 'High', lastVisit: '2026-09-08', doctor: 'Dr. Anand Rao', age: 65, gender: 'Male', careCircle: 5 },
  { id: 'd47beac5-3a09-4722-94bf-7cae9f8a081f', firstName: 'Padmanabhan', lastName: 'Nambiar', conditions: ['Rheumatoid Arthritis', 'Anaemia'], risk: 'Moderate', lastVisit: '2026-09-01', doctor: 'Dr. Vikram Malhotra', age: 78, gender: 'Male', careCircle: 3 },
  { id: '12d12b80-9848-4130-89ba-10f6334c6899', firstName: 'Janaki', lastName: 'Srinivasan', conditions: ['Congestive Heart Failure', 'Type 2 Diabetes'], risk: 'Critical', lastVisit: '2026-09-09', doctor: 'Dr. Vikram Malhotra', age: 80, gender: 'Female', careCircle: 6 },
  { id: 'a54594c5-bf6f-4f0b-bcca-b3df6ce952c6', firstName: 'Venkatasubramanian', lastName: 'Iyer', conditions: ['Benign Prostatic Hyperplasia', 'CKD Stage 2'], risk: 'Stable', lastVisit: '2026-08-28', doctor: 'Dr. Anand Rao', age: 83, gender: 'Male', careCircle: 2 },
  { id: 'ea413a16-5149-4dd9-905b-d3f62508e931', firstName: 'Nalini', lastName: 'Chandrasekhar', conditions: ['Breast Cancer (Remission)', 'Lymphoedema'], risk: 'Moderate', lastVisit: '2026-09-04', doctor: 'Dr. Priya Sharma', age: 69, gender: 'Female', careCircle: 4 },
  { id: 'e442022e-1232-4ccb-b5bc-c6b3bbcc67cb', firstName: 'Shanmugam', lastName: 'Palanichamy', conditions: ['COPD Stage III', 'Hypertension', 'Type 2 Diabetes'], risk: 'Critical', lastVisit: '2026-09-10', doctor: 'Dr. Vikram Malhotra', age: 73, gender: 'Male', careCircle: 5 },
  { id: '3a681eb3-f656-48ae-ba48-353c5f0a8a4f', firstName: 'Bhagyalakshmi', lastName: 'Narayanan', conditions: ['Osteoarthritis', 'Depression'], risk: 'Stable', lastVisit: '2026-08-30', doctor: 'Dr. Priya Sharma', age: 66, gender: 'Female', careCircle: 3 },
  { id: '00000000-0000-4000-8000-0000000000ab', firstName: 'Robert', lastName: 'Miller', conditions: ['Dementia (Moderate)', 'Hypertension', 'Falls Risk'], risk: 'High', lastVisit: '2026-09-07', doctor: 'Dr. Anand Rao', age: 85, gender: 'Male', careCircle: 8 },
];

const RISK_CONFIG = {
  Critical: { badge: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500', ring: 'ring-red-200' },
  High:     { badge: 'bg-orange-100 text-orange-700 border-orange-200', dot: 'bg-orange-500', ring: 'ring-orange-200' },
  Moderate: { badge: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500', ring: 'ring-amber-100' },
  Stable:   { badge: 'bg-emerald-100 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500', ring: 'ring-emerald-100' },
};

const CONDITION_ICONS: Record<string, React.ElementType> = {
  'HFpEF': Heart, 'Congestive Heart Failure': Heart, 'Coronary Artery Disease': Heart, 'Atrial Fibrillation': Heart,
  'COPD Stage II': Wind, 'COPD Stage III': Wind,
  "Alzheimer's (Mild)": Brain, "Parkinson's Disease": Brain, 'Dementia (Moderate)': Brain, 'Post-Stroke Recovery': Brain,
};

const AVATAR_COLORS = [
  'bg-violet-500', 'bg-blue-500', 'bg-teal-500', 'bg-rose-500',
  'bg-amber-500', 'bg-indigo-500', 'bg-pink-500', 'bg-cyan-500',
  'bg-green-600', 'bg-purple-500', 'bg-sky-500', 'bg-orange-500',
];

export default function PatientsPage() {
  const [patients, setPatients] = useState(MOCK_PATIENTS); // start with mock data immediately
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState('All');

  useEffect(() => {
    // Try to merge with live DB data; fall back to mock silently on auth error
    patientsApi.list()
      .then((data: any[]) => {
        if (Array.isArray(data) && data.length > 0) {
          // Merge: iterate over MOCK_PATIENTS and update with live data if available
          const merged = MOCK_PATIENTS.map(mock => {
            const live = data.find(p => p.id === mock.id);
            return live 
              ? { ...mock, firstName: live.firstName ?? mock.firstName, lastName: live.lastName ?? mock.lastName }
              : mock;
          });
          
          // Append any live patients that aren't in the mock roster
          const newLive = data
            .filter(p => !MOCK_PATIENTS.some(m => m.id === p.id))
            .map(p => ({
              ...p, conditions: ['General Care'], risk: 'Stable', lastVisit: new Date().toISOString().split('T')[0], doctor: 'Dr. Vikram Malhotra', age: 70, gender: p.gender || 'Unknown', careCircle: 2 
            }));

          setPatients([...merged, ...newLive] as typeof MOCK_PATIENTS);
        }
      })
      .catch(() => { /* keep mock data */ });
  }, []);

  const filtered = patients.filter((p) => {
    const name = `${p.firstName} ${p.lastName}`.toLowerCase();
    const matchSearch = name.includes(search.toLowerCase()) ||
      p.conditions.some((c) => c.toLowerCase().includes(search.toLowerCase()));
    const matchRisk = filterRisk === 'All' || p.risk === filterRisk;
    return matchSearch && matchRisk;
  });

  const criticalCount = patients.filter(p => p.risk === 'Critical').length;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Patient Registry</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {patients.length} patients ·{' '}
            <span className="text-red-600 font-semibold">{criticalCount} critical</span>
          </p>
        </div>
        <Button className="gap-1.5">
          <UserPlus className="w-4 h-4" /> Add Patient
        </Button>
      </div>

      {/* Search + Filter */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search name or condition..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full rounded-lg border border-input bg-white pl-9 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['All', 'Critical', 'High', 'Moderate', 'Stable'].map(r => (
            <button
              key={r}
              onClick={() => setFilterRisk(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                filterRisk === r
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-muted-foreground border-input hover:border-primary/40'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Patient Cards */}
      <div className="grid gap-3">
        {filtered.map((p, i) => {
          const risk = (p.risk ?? 'Stable') as keyof typeof RISK_CONFIG;
          const cfg = RISK_CONFIG[risk];
          const ConditionIcon = CONDITION_ICONS[p.conditions?.[0]] ?? Activity;
          const avatarColor = AVATAR_COLORS[i % AVATAR_COLORS.length];

          return (
            <Link key={p.id} href={`/clinician/patients/${p.id}`}>
              <Card className={`cursor-pointer hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 ring-1 ${cfg.ring}`}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-4">
                    {/* Avatar + Name */}
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`h-12 w-12 rounded-full ${avatarColor} flex items-center justify-center text-white font-bold text-sm flex-shrink-0`}>
                        {p.firstName[0]}{p.lastName[0]}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h2 className="font-semibold text-foreground">{p.firstName} {p.lastName}</h2>
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${cfg.badge}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
                            {risk}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {p.age} yrs · {p.gender} · {p.doctor}
                        </p>
                      </div>
                    </div>

                    {/* Conditions */}
                    <div className="hidden md:flex items-center gap-1.5 flex-wrap flex-1 justify-center">
                      {p.conditions.slice(0, 3).map((c) => {
                        const Icon = CONDITION_ICONS[c] ?? Activity;
                        return (
                          <span key={c} className="inline-flex items-center gap-1 text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full border border-slate-200">
                            <Icon className="w-3 h-3" /> {c}
                          </span>
                        );
                      })}
                      {p.conditions.length > 3 && (
                        <span className="text-[11px] text-muted-foreground">+{p.conditions.length - 3} more</span>
                      )}
                    </div>

                    {/* Meta */}
                    <div className="flex items-center gap-5 flex-shrink-0">
                      <div className="text-center hidden sm:block">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Last Visit</p>
                        <p className="text-sm font-medium">
                          {new Date(p.lastVisit).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                        </p>
                      </div>
                      <div className="text-center hidden sm:block">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Care Circle</p>
                        <p className="text-sm font-medium">{p.careCircle} people</p>
                      </div>
                      {(risk === 'Critical' || risk === 'High') && (
                        <div className="hidden lg:flex items-center gap-1 rounded-full bg-orange-50 border border-orange-200 px-2.5 py-1">
                          <AlertTriangle className="h-3.5 w-3.5 text-orange-500" />
                          <span className="text-[11px] font-semibold text-orange-700">Needs Attention</span>
                        </div>
                      )}
                      <Button variant="ghost" size="sm" className="gap-1 text-xs">
                        Open <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground text-sm">
            No patients match your search.
          </div>
        )}
      </div>
    </div>
  );
}
