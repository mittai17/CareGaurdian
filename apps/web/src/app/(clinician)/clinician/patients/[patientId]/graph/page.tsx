'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { PatientHeader } from '@/components/patient/patient-header';
import { patientsApi } from '@/lib/api';
import { MOCK_PATIENTS_MAP } from '@/lib/mock-patients';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Share2, Network, Heart, Pill, Brain, Activity, ShieldAlert, Sparkles, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react';

export default function PatientHealthGraphPage() {
  const params = useParams();
  const patientId = params.patientId as string;
  const [patient, setPatient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await patientsApi.getById(patientId);
        setPatient(res?.data || res || null);
      } catch (e) {
        console.error('Failed to load patient:', e);
        setPatient(MOCK_PATIENTS_MAP[patientId] ?? null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [patientId]);

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Patient not found.
      </div>
    );
  }

  const nodes = [
    { id: 'patient', label: `${patient.firstName} ${patient.lastName}`, type: 'patient', color: 'bg-primary text-white border-primary', x: 350, y: 180, icon: Heart, desc: 'Central Patient Identity' },
    { id: 'cond1', label: 'Heart Failure (HFpEF)', type: 'condition', color: 'bg-rose-100 text-rose-800 border-rose-300', x: 180, y: 80, icon: Activity, desc: 'Active primary cardiac condition' },
    { id: 'cond2', label: 'Type 2 Diabetes', type: 'condition', color: 'bg-amber-100 text-amber-800 border-amber-300', x: 520, y: 80, icon: Activity, desc: 'Active metabolic condition' },
    { id: 'med1', label: 'Furosemide 40mg', type: 'medication', color: 'bg-blue-100 text-blue-800 border-blue-300', x: 140, y: 280, icon: Pill, desc: 'Diuretic for fluid overload' },
    { id: 'med2', label: 'Empagliflozin 10mg', type: 'medication', color: 'bg-blue-100 text-blue-800 border-blue-300', x: 350, y: 320, icon: Pill, desc: 'SGLT2 inhibitor for heart failure' },
    { id: 'med3', label: 'Spironolactone 25mg', type: 'medication', color: 'bg-blue-100 text-blue-800 border-blue-300', x: 560, y: 280, icon: Pill, desc: 'Aldosterone antagonist' },
    { id: 'obs1', label: 'Weight Spike +3.4kg', type: 'observation', color: 'bg-red-100 text-red-900 border-red-400 font-bold', x: 120, y: 180, icon: ShieldAlert, desc: 'Detected anomaly in telemetry' },
    { id: 'care1', label: 'Caregiver: Karthik', type: 'caregiver', color: 'bg-emerald-100 text-emerald-800 border-emerald-300', x: 550, y: 180, icon: Brain, desc: 'Primary daily observer' },
  ];

  const links = [
    { from: 'patient', to: 'cond1', label: 'diagnosed with' },
    { from: 'patient', to: 'cond2', label: 'diagnosed with' },
    { from: 'cond1', to: 'med1', label: 'managed by' },
    { from: 'cond1', to: 'med2', label: 'prescribed' },
    { from: 'cond1', to: 'obs1', label: 'triggers' },
    { from: 'cond2', to: 'med2', label: 'treated by' },
    { from: 'cond1', to: 'med3', label: 'prescribed' },
    { from: 'patient', to: 'care1', label: 'supported by' },
    { from: 'care1', to: 'obs1', label: 'reported' },
  ];

  return (
    <div>
      <PatientHeader patient={patient} />
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <Network className="w-6 h-6 text-primary" />
              Longitudinal Health Graph
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              AI-synthesized entity relationships connecting diseases, medications, anomalies, and caregiver reports.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelectedNode(null)} className="gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" />
              Reset View
            </Button>
            <Button size="sm" className="gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Run Graph Inference
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Interactive Graph Canvas */}
          <Card className="lg:col-span-2 overflow-hidden border">
            <CardHeader className="py-3 px-5 border-b bg-slate-50/50 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Semantic Entity Graph</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-400 mr-1" /> Conditions
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-400 mx-1" /> Medications
                <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 mx-1" /> Care Circle
              </div>
            </CardHeader>
            <CardContent className="p-0 relative bg-slate-900/5 min-h-[420px] flex items-center justify-center">
              <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 700 400">
                {links.map((link, idx) => {
                  const src = nodes.find(n => n.id === link.from);
                  const dst = nodes.find(n => n.id === link.to);
                  if (!src || !dst) return null;
                  return (
                    <g key={idx}>
                      <line
                        x1={src.x}
                        y1={src.y}
                        x2={dst.x}
                        y2={dst.y}
                        stroke="#94a3b8"
                        strokeWidth="1.5"
                        strokeDasharray={link.label === 'triggers' || link.label === 'reported' ? '4,4' : undefined}
                      />
                    </g>
                  );
                })}
              </svg>

              <div className="relative w-full h-[400px]">
                {nodes.map((node) => {
                  const Icon = node.icon;
                  const isSelected = selectedNode?.id === node.id;
                  return (
                    <button
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      style={{ left: `${node.x}px`, top: `${node.y}px`, transform: 'translate(-50%, -50%)' }}
                      className={`absolute px-3 py-2 rounded-xl border shadow-sm transition-all duration-150 flex items-center gap-2 cursor-pointer ${node.color} ${
                        isSelected ? 'ring-4 ring-primary/40 scale-105 z-20 shadow-md' : 'hover:scale-105 z-10'
                      }`}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-xs font-semibold whitespace-nowrap">{node.label}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Node Inspector */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-primary" />
                  Entity Inspector
                </CardTitle>
                <CardDescription>
                  Click any node in the graph to inspect knowledge provenance and causal pathways.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {selectedNode ? (
                  <div className="space-y-4">
                    <div>
                      <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Entity Type</span>
                      <p className="text-sm font-bold capitalize mt-0.5">{selectedNode.type}</p>
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Identifier / Name</span>
                      <p className="text-sm font-semibold mt-0.5">{selectedNode.label}</p>
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Clinical Significance</span>
                      <p className="text-xs text-muted-foreground mt-1 bg-slate-50 p-2.5 rounded-lg border">
                        {selectedNode.desc}
                      </p>
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Related Links</span>
                      <div className="space-y-1 mt-1.5">
                        {links
                          .filter(l => l.from === selectedNode.id || l.to === selectedNode.id)
                          .map((l, i) => (
                            <div key={i} className="text-xs p-1.5 rounded bg-white border flex items-center justify-between">
                              <span className="font-mono text-muted-foreground text-[11px]">{l.label}</span>
                              <span className="font-medium text-foreground">{l.from === selectedNode.id ? l.to : l.from}</span>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground text-xs">
                    Select any entity in the graph (e.g. <span className="text-foreground font-medium">Weight Spike</span> or <span className="text-foreground font-medium">Furosemide</span>) to view clinical relationships.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">AI Graph Confidence</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 pt-1 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ontology Alignment:</span>
                  <span className="font-semibold text-emerald-600">99.2% (SNOMED-CT)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Causal Association:</span>
                  <span className="font-semibold text-primary">High Confidence</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Care Circle Validation:</span>
                  <span className="font-semibold text-slate-900">Confirmed (Karthik S.)</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
