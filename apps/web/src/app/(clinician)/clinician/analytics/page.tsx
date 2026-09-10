'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  BarChart2,
  TrendingUp,
  TrendingDown,
  Users,
  AlertTriangle,
  Heart,
  Activity,
  Calendar,
  Filter,
  Download,
  ShieldAlert,
  ArrowRight,
  Pill,
  Sparkles,
  CheckCircle2,
  Clock,
  Eye,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';

// Monthly longitudinal drift trends across cohort
const driftTrendData = [
  { month: 'Apr', mobilityScore: 92, cognitiveScore: 94, bpStability: 89, sleepScore: 88 },
  { month: 'May', mobilityScore: 90, cognitiveScore: 93, bpStability: 87, sleepScore: 86 },
  { month: 'Jun', mobilityScore: 88, cognitiveScore: 92, bpStability: 86, sleepScore: 84 },
  { month: 'Jul', mobilityScore: 87, cognitiveScore: 90, bpStability: 84, sleepScore: 82 },
  { month: 'Aug', mobilityScore: 84, cognitiveScore: 88, bpStability: 81, sleepScore: 79 },
  { month: 'Sep', mobilityScore: 82, cognitiveScore: 87, bpStability: 79, sleepScore: 77 },
];

// Care circle weekly observation volume
const careCircleVolumeData = [
  { day: 'Mon', caregiverLogs: 24, clinicianReviews: 12, anomalyTriggers: 3 },
  { day: 'Tue', caregiverLogs: 28, clinicianReviews: 16, anomalyTriggers: 2 },
  { day: 'Wed', caregiverLogs: 34, clinicianReviews: 19, anomalyTriggers: 5 },
  { day: 'Thu', caregiverLogs: 31, clinicianReviews: 14, anomalyTriggers: 4 },
  { day: 'Fri', caregiverLogs: 38, clinicianReviews: 22, anomalyTriggers: 3 },
  { day: 'Sat', caregiverLogs: 42, clinicianReviews: 9, anomalyTriggers: 6 },
  { day: 'Sun', caregiverLogs: 36, clinicianReviews: 8, anomalyTriggers: 2 },
];

// Cohort risk distribution
const riskCohortData = [
  { name: 'Stable Baseline', value: 15, color: '#10b981' },
  { name: 'Low Variance', value: 5, color: '#3b82f6' },
  { name: 'Moderate Drift', value: 3, color: '#f59e0b' },
  { name: 'High Risk / Action', value: 1, color: '#ef4444' },
];

// Patient Risk Matrix table
const patientRiskRows = [
  {
    id: '66c67bf7-f6e3-478e-b972-20d7d25b4958',
    name: 'Ravi Kumar',
    age: 74,
    conditions: 'T2DM, Hypertension',
    driftScore: '-35% (Gait)',
    riskLevel: 'HIGH',
    contradictions: '1 Active (Penicillin)',
    adherence: '74%',
    careCircleActivity: 'High (14 logs/wk)',
  },
  {
    id: 'eaf97dad-41d4-4e48-a345-5f1d3f0f5380',
    name: 'Lakshmi Raghavan',
    age: 68,
    conditions: 'Hypothyroidism, AFib',
    driftScore: '+14 mmHg (BP)',
    riskLevel: 'MODERATE',
    contradictions: '0 Active',
    adherence: '86%',
    careCircleActivity: 'Medium (8 logs/wk)',
  },
  {
    id: '5b29040a-ea76-4cf3-9d2c-f63c70fcd419',
    name: 'Krishnamurthy Swaminathan',
    age: 79,
    conditions: 'Alzheimer’s, T2DM',
    driftScore: '-22% (Speech)',
    riskLevel: 'HIGH',
    contradictions: '0 Active',
    adherence: '92%',
    careCircleActivity: 'Very High (21 logs/wk)',
  },
  {
    id: '33ec2506-2cfd-437d-8c66-defd67159f29',
    name: 'Sunita Balasubramanian',
    age: 71,
    conditions: 'Osteoporosis, RA',
    driftScore: '-4% (Normal)',
    riskLevel: 'STABLE',
    contradictions: '0 Active',
    adherence: '95%',
    careCircleActivity: 'Medium (6 logs/wk)',
  },
  {
    id: '3489a162-e878-493a-92e3-ad33476afc55',
    name: 'Mohan Pillai',
    age: 72,
    conditions: 'Parkinson’s, Depression',
    driftScore: '-8% (Tremor)',
    riskLevel: 'LOW',
    contradictions: '0 Active',
    adherence: '89%',
    careCircleActivity: 'High (11 logs/wk)',
  },
];

export default function ClinicianAnalyticsPage() {
  const [mounted, setMounted] = useState(false);
  const [timeframe, setTimeframe] = useState('90D');
  const [riskFilter, setRiskFilter] = useState('ALL');

  useEffect(() => {
    setMounted(true);
  }, []);

  const filteredPatients = patientRiskRows.filter((p) => {
    if (riskFilter !== 'ALL' && p.riskLevel !== riskFilter) return false;
    return true;
  });

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Population Health Analytics</h1>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs font-semibold">
              Predictive Health Memory
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Cohort trajectory drift modeling, Care Circle engagement volume, and multi-condition anomaly intelligence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Timeframe selector */}
          <div className="flex items-center bg-muted/60 p-1 rounded-lg border border-border text-xs font-semibold">
            {['30D', '90D', '6M', '1Y'].map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={cn(
                  'px-3 py-1 rounded-md transition-colors',
                  timeframe === t ? 'bg-white shadow-sm text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => alert('Exporting population health cohort analytics CSV...')}
            className="text-xs gap-1.5 h-8 shadow-sm"
          >
            <Download className="h-3.5 w-3.5" /> Export Data
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Active Patients Cohort</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <p className="text-2xl font-bold text-foreground">24</p>
                  <span className="text-[11px] font-semibold text-emerald-600 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-0.5" /> +12% YoY
                  </span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Baseline Anomaly Alerts</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <p className="text-2xl font-bold text-rose-600">6</p>
                  <span className="text-[11px] font-semibold text-rose-600 flex items-center">
                    <AlertTriangle className="h-3 w-3 mr-0.5" /> 2 Critical
                  </span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <ShieldAlert className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Med Adherence Index</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <p className="text-2xl font-bold text-foreground">88.4%</p>
                  <span className="text-[11px] font-semibold text-emerald-600 flex items-center">
                    <TrendingUp className="h-3 w-3 mr-0.5" /> +3.2%
                  </span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Pill className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Care Circle Observations</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <p className="text-2xl font-bold text-foreground">233</p>
                  <span className="text-[11px] font-semibold text-blue-600 flex items-center">
                    41 Connected
                  </span>
                </div>
              </div>
              <div className="h-10 w-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Heart className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Longitudinal Drift Trends (AreaChart) - 2 Columns */}
        <Card className="border-border lg:col-span-2">
          <CardHeader className="py-4 px-5 border-b border-border flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-sm font-bold flex items-center gap-2">
                <Activity className="h-4 w-4 text-primary" /> Longitudinal Cohort Health Vectors
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                Composite stability index across mobility, cognitive markers, blood pressure, and sleep.
              </p>
            </div>
            <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded">
              Baseline Index (0-100)
            </span>
          </CardHeader>
          <CardContent className="p-5">
            <div className="h-[280px] w-full">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={driftTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="mobilityGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                      </linearGradient>
                      <linearGradient id="cognitiveGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis domain={[70, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Area type="monotone" dataKey="mobilityScore" name="Gait & Mobility" stroke="#3b82f6" fill="url(#mobilityGrad)" strokeWidth={2} />
                    <Area type="monotone" dataKey="cognitiveScore" name="Cognitive Stability" stroke="#10b981" fill="url(#cognitiveGrad)" strokeWidth={2} />
                    <Line type="monotone" dataKey="bpStability" name="Blood Pressure Stability" stroke="#f59e0b" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="sleepScore" name="Sleep Continuity" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="3 3" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground">Loading chart...</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cohort Risk Distribution (Donut Chart) - 1 Column */}
        <Card className="border-border">
          <CardHeader className="py-4 px-5 border-b border-border">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Risk & Drift Segmentation
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Current patient distribution across AI risk tiers.
            </p>
          </CardHeader>
          <CardContent className="p-5 flex flex-col items-center">
            <div className="h-[200px] w-full">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskCohortData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={75}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {riskCohortData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-muted-foreground">Loading chart...</div>
              )}
            </div>

            <div className="w-full space-y-1.5 text-xs pt-3 border-t border-border">
              {riskCohortData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-bold text-foreground">{item.value} patients</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Care Circle Weekly Activity (BarChart) */}
      <Card className="border-border">
        <CardHeader className="py-4 px-5 border-b border-border flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Heart className="h-4 w-4 text-rose-500" /> Care Circle Weekly Activity Volume
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Daily volume of caregiver observation logs, clinician reviews, and triggered anomaly warnings.
            </p>
          </div>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
            Last 7 Days (Aggregate)
          </span>
        </CardHeader>
        <CardContent className="p-5">
          <div className="h-[230px] w-full">
            {mounted ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={careCircleVolumeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '8px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                  <Bar dataKey="caregiverLogs" name="Caregiver Observations" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="clinicianReviews" name="Clinician Reviews" fill="#10b981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="anomalyTriggers" name="Anomaly Flags" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-muted-foreground">Loading chart...</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Patient Trajectory Risk Matrix Table */}
      <Card className="border-border">
        <CardHeader className="py-4 px-5 border-b border-border flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-primary" /> Patient Trajectory & Anomaly Matrix
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">
              Individual trajectory drift scores, active medication contradictions, and care circle logging velocity.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="ALL">All Risk Tiers</option>
              <option value="HIGH">High Risk</option>
              <option value="MODERATE">Moderate</option>
              <option value="LOW">Low</option>
              <option value="STABLE">Stable</option>
            </select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="bg-muted/30 border-b border-border text-muted-foreground font-semibold">
                <tr>
                  <th className="py-3 px-5 text-left">Patient</th>
                  <th className="py-3 px-4 text-left">Primary Conditions</th>
                  <th className="py-3 px-4 text-left">30-Day Drift</th>
                  <th className="py-3 px-4 text-left">Risk Tier</th>
                  <th className="py-3 px-4 text-left">Contradictions</th>
                  <th className="py-3 px-4 text-left">Med Adherence</th>
                  <th className="py-3 px-4 text-left">Care Circle Velocity</th>
                  <th className="py-3 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredPatients.map((row) => (
                  <tr key={row.id} className="hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-5 font-bold text-foreground">
                      <div>{row.name}</div>
                      <span className="text-[10px] text-muted-foreground font-normal">Age {row.age}</span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{row.conditions}</td>
                    <td className="py-3 px-4 font-semibold text-foreground">{row.driftScore}</td>
                    <td className="py-3 px-4">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px] font-semibold',
                          row.riskLevel === 'HIGH' && 'bg-rose-50 text-rose-700 border-rose-200',
                          row.riskLevel === 'MODERATE' && 'bg-amber-50 text-amber-700 border-amber-200',
                          row.riskLevel === 'LOW' && 'bg-blue-50 text-blue-700 border-blue-200',
                          row.riskLevel === 'STABLE' && 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        )}
                      >
                        {row.riskLevel}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <span className={row.contradictions.includes('Active') ? 'text-rose-600 font-bold' : 'text-muted-foreground'}>
                        {row.contradictions}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-semibold text-foreground">{row.adherence}</td>
                    <td className="py-3 px-4 text-muted-foreground">{row.careCircleActivity}</td>
                    <td className="py-3 px-5 text-right">
                      <Link href={`/clinician/patients/${row.id}`}>
                        <Button variant="ghost" size="sm" className="text-xs h-7 text-primary gap-1">
                          View Brief <ArrowRight className="h-3 w-3" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
