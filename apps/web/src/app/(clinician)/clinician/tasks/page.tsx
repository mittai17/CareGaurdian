'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  CheckSquare,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Plus,
  Search,
  Filter,
  User,
  ArrowRight,
  Pill,
  Heart,
  FileText,
  AlertCircle,
  MoreVertical,
  Calendar,
  Sparkles,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { patientsApi } from '@/lib/api';
import { cn } from '@/lib/utils';

export interface ClinicalTask {
  id: string;
  title: string;
  description: string;
  patientId: string;
  patientName: string;
  category: 'ALLERGY_CONFLICT' | 'MEDICATION' | 'CARE_CIRCLE' | 'LAB_RESULT' | 'ANOMALY' | 'GENERAL';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  dueDate: string;
  actionUrl?: string;
  assignedTo?: string;
  createdAt: string;
}

const initialTasks: ClinicalTask[] = [
  {
    id: 'task-1',
    title: 'Review allergy conflict: Amoxicillin vs Penicillin allergy',
    description: 'Caregiver reported new prescription for Amoxicillin. Patient has documented severe rash & anaphylactoid allergy to Penicillin.',
    patientId: '66c67bf7-f6e3-478e-b972-20d7d25b4958',
    patientName: 'Ravi Kumar',
    category: 'ALLERGY_CONFLICT',
    priority: 'CRITICAL',
    status: 'PENDING',
    dueDate: '2026-09-11',
    actionUrl: '/clinician/patients/66c67bf7-f6e3-478e-b972-20d7d25b4958/contradictions',
    createdAt: '2026-09-10T14:30:00Z',
  },
  {
    id: 'task-2',
    title: 'Evaluate near-fall episode & sudden walking speed drop',
    description: 'Caregiver Ananya logged near-fall in hallway and note that walking pace is down ~35% over past 48 hours.',
    patientId: '66c67bf7-f6e3-478e-b972-20d7d25b4958',
    patientName: 'Ravi Kumar',
    category: 'ANOMALY',
    priority: 'HIGH',
    status: 'PENDING',
    dueDate: '2026-09-11',
    actionUrl: '/clinician/patients/66c67bf7-f6e3-478e-b972-20d7d25b4958/timeline',
    createdAt: '2026-09-10T18:15:00Z',
  },
  {
    id: 'task-3',
    title: 'Review quarterly blood pressure log & Telmisartan adherence',
    description: 'Patient systolic readings average 148 mmHg. Family notes occasional missed morning doses.',
    patientId: 'eaf97dad-41d4-4e48-a345-5f1d3f0f5380',
    patientName: 'Lakshmi Raghavan',
    category: 'MEDICATION',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    dueDate: '2026-09-12',
    actionUrl: '/clinician/patients/eaf97dad-41d4-4e48-a345-5f1d3f0f5380/medications',
    createdAt: '2026-09-09T11:00:00Z',
  },
  {
    id: 'task-4',
    title: 'Respond to Daughter inquiry on night-time wandering',
    description: 'Suresh Raghavan posted in Care Circle regarding mild disorientation and night wandering observed twice this week.',
    patientId: 'eaf97dad-41d4-4e48-a345-5f1d3f0f5380',
    patientName: 'Lakshmi Raghavan',
    category: 'CARE_CIRCLE',
    priority: 'MEDIUM',
    status: 'PENDING',
    dueDate: '2026-09-12',
    actionUrl: '/clinician/patients/eaf97dad-41d4-4e48-a345-5f1d3f0f5380/care-circle',
    createdAt: '2026-09-10T09:20:00Z',
  },
  {
    id: 'task-5',
    title: 'Analyze DEXA bone density scan and Vitamin D lab panel',
    description: 'T-score -2.8 indicates progressive osteopenia/osteoporosis. Adjust calcium & bisphosphonate regimen.',
    patientId: '33ec2506-2cfd-437d-8c66-defd67159f29',
    patientName: 'Sunita Balasubramanian',
    category: 'LAB_RESULT',
    priority: 'MEDIUM',
    status: 'PENDING',
    dueDate: '2026-09-13',
    actionUrl: '/clinician/patients/33ec2506-2cfd-437d-8c66-defd67159f29/evidence',
    createdAt: '2026-09-08T16:00:00Z',
  },
  {
    id: 'task-6',
    title: 'Annual Comprehensive Geriatric Assessment sign-off',
    description: 'Review updated baseline trajectory memory and finalize quarterly clinical brief.',
    patientId: '3489a162-e878-493a-92e3-ad33476afc55',
    patientName: 'Mohan Pillai',
    category: 'GENERAL',
    priority: 'LOW',
    status: 'COMPLETED',
    dueDate: '2026-09-10',
    actionUrl: '/clinician/patients/3489a162-e878-493a-92e3-ad33476afc55/clinical-brief',
    createdAt: '2026-09-07T10:00:00Z',
  },
];

const priorityConfig = {
  CRITICAL: { label: 'Critical', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
  HIGH: { label: 'High', bg: 'bg-orange-50 text-orange-700 border-orange-200' },
  MEDIUM: { label: 'Medium', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
  LOW: { label: 'Low', bg: 'bg-slate-50 text-slate-700 border-slate-200' },
};

const categoryConfig = {
  ALLERGY_CONFLICT: { label: 'Allergy Conflict', icon: AlertTriangle, color: 'text-rose-600' },
  MEDICATION: { label: 'Medication', icon: Pill, color: 'text-blue-600' },
  CARE_CIRCLE: { label: 'Care Circle', icon: Heart, color: 'text-emerald-600' },
  LAB_RESULT: { label: 'Lab Result', icon: FileText, color: 'text-purple-600' },
  ANOMALY: { label: 'Baseline Anomaly', icon: AlertCircle, color: 'text-orange-600' },
  GENERAL: { label: 'General Review', icon: CheckSquare, color: 'text-slate-600' },
};

export default function ClinicianTasksPage() {
  const [tasks, setTasks] = useState<ClinicalTask[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('baseline_clinician_tasks');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return initialTasks;
  });

  const [patients, setPatients] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('PENDING_AND_ACTIVE');
  const [showAddModal, setShowAddModal] = useState(false);

  // New task form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPatientId, setNewPatientId] = useState('');
  const [newPatientName, setNewPatientName] = useState('');
  const [newCategory, setNewCategory] = useState<ClinicalTask['category']>('MEDICATION');
  const [newPriority, setNewPriority] = useState<ClinicalTask['priority']>('HIGH');
  const [newDueDate, setNewDueDate] = useState('2026-09-12');

  // Load patients from API
  useEffect(() => {
    patientsApi
      .list()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPatients(data);
          const first = data[0];
          setNewPatientId(first.id);
          setNewPatientName(first.fullName || first.name || 'Lakshmi Raghavan');
        }
      })
      .catch((err) => console.warn('Patients API failed:', err));
  }, []);

  // Sync to local storage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('baseline_clinician_tasks', JSON.stringify(tasks));
    }
  }, [tasks]);

  const toggleTaskStatus = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextStatus = t.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
  };

  const setTaskProgress = (id: string, status: ClinicalTask['status']) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  };

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newTask: ClinicalTask = {
      id: `task-${Date.now()}`,
      title: newTitle.trim(),
      description: newDescription.trim(),
      patientId: newPatientId || 'unknown',
      patientName: newPatientName || 'Lakshmi Raghavan',
      category: newCategory,
      priority: newPriority,
      status: 'PENDING',
      dueDate: newDueDate,
      actionUrl: newPatientId ? `/clinician/patients/${newPatientId}` : '/clinician/patients',
      createdAt: new Date().toISOString(),
    };

    setTasks((prev) => [newTask, ...prev]);
    setShowAddModal(false);
    setNewTitle('');
    setNewDescription('');
  };

  // Metrics
  const pendingCount = tasks.filter((t) => t.status === 'PENDING').length;
  const inProgressCount = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
  const criticalCount = tasks.filter((t) => t.priority === 'CRITICAL' && t.status !== 'COMPLETED').length;
  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          task.title.toLowerCase().includes(q) ||
          task.description.toLowerCase().includes(q) ||
          task.patientName.toLowerCase().includes(q);
        if (!matches) return false;
      }

      // Status filter
      if (selectedStatus === 'PENDING_AND_ACTIVE') {
        if (task.status === 'COMPLETED') return false;
      } else if (selectedStatus !== 'ALL') {
        if (task.status !== selectedStatus) return false;
      }

      // Category filter
      if (selectedCategory !== 'ALL' && task.category !== selectedCategory) {
        return false;
      }

      // Priority filter
      if (selectedPriority !== 'ALL' && task.priority !== selectedPriority) {
        return false;
      }

      return true;
    });
  }, [tasks, searchQuery, selectedStatus, selectedCategory, selectedPriority]);

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Clinical Tasks</h1>
            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-xs font-semibold">
              Action Items
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Prioritized clinical decision tasks, medication contradictions, and care circle action items.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            New Clinical Task
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Pending Action</p>
                <p className="text-2xl font-bold text-foreground mt-0.5">{pendingCount}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Clock className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Critical Urgency</p>
                <p className="text-2xl font-bold text-rose-600 mt-0.5">{criticalCount}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-amber-600 mt-0.5">{inProgressCount}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <RefreshCw className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground">Resolved Tasks</p>
                <p className="text-2xl font-bold text-emerald-600 mt-0.5">{completedCount}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="border-border">
        <CardContent className="py-3 px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by task title, description, or patient..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-input bg-background py-1.5 pl-9 pr-3 text-xs outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Select Dropdowns */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {/* Status */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="PENDING_AND_ACTIVE">Active & Pending</option>
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending Only</option>
                <option value="IN_PROGRESS">In Progress Only</option>
                <option value="COMPLETED">Completed Only</option>
              </select>

              {/* Priority */}
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="ALL">All Priorities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>

              {/* Category */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="h-8 rounded-md border border-input bg-background px-2.5 py-1 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="ALL">All Categories</option>
                <option value="ALLERGY_CONFLICT">Allergy Conflicts</option>
                <option value="MEDICATION">Medication Reviews</option>
                <option value="CARE_CIRCLE">Care Circle</option>
                <option value="ANOMALY">Baseline Anomalies</option>
                <option value="LAB_RESULT">Lab Results</option>
                <option value="GENERAL">General</option>
              </select>

              {(selectedStatus !== 'PENDING_AND_ACTIVE' || selectedPriority !== 'ALL' || selectedCategory !== 'ALL' || searchQuery) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedStatus('PENDING_AND_ACTIVE');
                    setSelectedPriority('ALL');
                    setSelectedCategory('ALL');
                    setSearchQuery('');
                  }}
                  className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className="h-3 w-3 mr-1" /> Reset
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <Card className="border-border">
            <CardContent className="p-12 text-center text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-500 mb-3" />
              <p className="text-base font-semibold text-foreground">No tasks match your filter criteria</p>
              <p className="text-xs mt-1">All clinical action items are up to date or filtered out.</p>
            </CardContent>
          </Card>
        ) : (
          filteredTasks.map((task) => {
            const priority = priorityConfig[task.priority];
            const cat = categoryConfig[task.category] || categoryConfig.GENERAL;
            const CatIcon = cat.icon;
            const isDone = task.status === 'COMPLETED';

            return (
              <Card
                key={task.id}
                className={cn(
                  'border-border transition-all duration-200 hover:shadow-md',
                  isDone && 'opacity-60 bg-muted/30'
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => toggleTaskStatus(task.id)}
                      className={cn(
                        'mt-1 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded border transition-colors',
                        isDone
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-input hover:border-primary'
                      )}
                    >
                      {isDone && <CheckCircle2 className="h-4 w-4" />}
                    </button>

                    {/* Task Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={cn('text-sm font-semibold text-foreground', isDone && 'line-through text-muted-foreground')}>
                          {task.title}
                        </span>

                        <Badge variant="outline" className={cn('text-[11px] px-2 py-0.5 font-semibold', priority.bg)}>
                          {priority.label}
                        </Badge>

                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          <CatIcon className={cn('h-3 w-3', cat.color)} />
                          {cat.label}
                        </span>

                        <span
                          className={cn(
                            'text-[11px] font-medium px-2 py-0.5 rounded',
                            task.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : task.status === 'IN_PROGRESS'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-blue-100 text-blue-800'
                          )}
                        >
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {task.description}
                      </p>

                      <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5 font-medium text-foreground">
                          <User className="h-3.5 w-3.5 text-primary" />
                          <span>{task.patientName}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Due {task.dueDate}</span>
                        </div>

                        {task.actionUrl && (
                          <Link
                            href={task.actionUrl}
                            className="inline-flex items-center gap-1 text-primary hover:underline font-medium ml-auto"
                          >
                            Open patient brief <ArrowRight className="h-3 w-3" />
                          </Link>
                        )}
                      </div>
                    </div>

                    {/* Quick status cycle button */}
                    <div className="flex items-center gap-1">
                      {task.status === 'PENDING' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setTaskProgress(task.id, 'IN_PROGRESS')}
                          className="text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50 h-7 px-2"
                        >
                          Start
                        </Button>
                      )}
                      {task.status === 'IN_PROGRESS' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setTaskProgress(task.id, 'COMPLETED')}
                          className="text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 h-7 px-2"
                        >
                          Resolve
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteTask(task.id)}
                        className="h-7 w-7 text-muted-foreground hover:text-rose-600"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* New Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl border border-border max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-primary" /> Create New Clinical Task
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-muted-foreground hover:text-foreground text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Follow up on blood glucose variation"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Patient
                  </label>
                  <select
                    value={newPatientName}
                    onChange={(e) => {
                      setNewPatientName(e.target.value);
                      const p = patients.find(
                        (item) => (item.fullName || item.name) === e.target.value
                      );
                      if (p) setNewPatientId(p.id);
                    }}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="Lakshmi Raghavan">Lakshmi Raghavan</option>
                    <option value="Mohan Pillai">Mohan Pillai</option>
                    <option value="Kamala Venkatesh">Kamala Venkatesh</option>
                    <option value="Ravi Kumar">Ravi Kumar</option>
                    <option value="Sunita Balasubramanian">Sunita Balasubramanian</option>
                    <option value="Krishnamurthy Swaminathan">Krishnamurthy Swaminathan</option>
                    <option value="Padmanabhan Nambiar">Padmanabhan Nambiar</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="ALLERGY_CONFLICT">Allergy Conflict</option>
                    <option value="MEDICATION">Medication Adherence</option>
                    <option value="CARE_CIRCLE">Care Circle Action</option>
                    <option value="ANOMALY">Baseline Anomaly</option>
                    <option value="LAB_RESULT">Lab Result Follow-up</option>
                    <option value="GENERAL">General Review</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Priority Level
                  </label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="CRITICAL">Critical (Immediate action)</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    required
                    value={newDueDate}
                    onChange={(e) => setNewDueDate(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">
                  Clinical Context / Notes
                </label>
                <textarea
                  rows={3}
                  placeholder="Details for medical audit or care team..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  Save Clinical Task
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
