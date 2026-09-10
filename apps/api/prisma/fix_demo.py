#!/usr/bin/env python3
"""Remove all demo-data references from patient pages."""
import re
import os

base = r'apps/web/src/app/(clinician)/clinician/patients/[patientId]'

# Simple string replacements
string_repls = [
    ("import { demoYearTimeline, demoYearDetail } from '@/lib/demo-data'; // Fallback\n", ''),
    ("import { demoMissingInfo, demoYearTimeline } from '@/lib/demo-data'; // Fallback\n", ''),
    ("import { demoContradictions, demoYearTimeline } from '@/lib/demo-data'; // Fallback\n", ''),
    ("import { demoMedications, demoYearTimeline } from '@/lib/demo-data'; // Fallback\n", ''),
    ("import { demoBaseline, demoYearTimeline } from '@/lib/demo-data'; // Fallback\n", ''),
    ("import { demoYearDetail, demoCareCircle, demoYearTimeline } from '@/lib/demo-data'; // Fallback\n", ''),
    ("import { demoEpisodes, demoYearTimeline } from '@/lib/demo-data'; // Fallback\n", ''),
    ("import { demoYearTimeline, demoBaseline } from '@/lib/demo-data'; // Fallback\n", ''),
    ("import { demoYearDetail, demoYearTimeline } from '@/lib/demo-data'; // Fallback\n", ''),
    ("import { demoWhatChanged, demoYearTimeline } from '@/lib/demo-data'; // fallback only\n", ''),
    ("import {\n  demoYearTimeline, demoYearDetail\n} from '@/lib/demo-data';\n", ''),
    ("  const timeline = demoYearTimeline;\n", ''),
    ("  const timeline = demoYearTimeline; // Fallback structure for now\n", ''),
    ("    currentYearStatus: demoYearTimeline.years.find(y => y.year === demoYearTimeline.currentYear)?.status,\n",
     "    currentYearStatus: 'ACTIVE',\n"),
    ("          reports: demoYearDetail[2026]?.careCircleReports || [],\n", '          reports: [],\n'),
    ("  const feed = demoYearDetail[2026]?.careCircleReports || [];\n", '  const feed = [];\n'),
    ("  const displayMembers = members.length > 0 ? members : demoCareCircle;\n", '  const displayMembers = members;\n'),
    ("          timeline: demoYearTimeline,\n", '          timeline: null,\n'),
    ("          yearDetail: demoYearDetail\n", '          yearDetail: {},\n'),
    ("          episodes: demoEpisodes,\n", '          episodes: [],\n'),
    ("          gaps: missingResp?.data || demoMissingInfo,\n", '          gaps: missingResp?.data || [],\n'),
    ("          contradictions: contradictionsResp?.data || demoContradictions,\n", '          contradictions: contradictionsResp?.data || [],\n'),
    ("          meds: medsResp || demoMedications,\n", '          meds: medsResp || [],\n'),
    ("          baseline: baselineResp?.data || demoBaseline,\n", '          baseline: baselineResp?.data || null,\n'),
    (u"\U0001F52C Demo \u2014 Synthetic Data", ''),
    ("  const changes = demoWhatChanged; // Fallback structure for now\n", ''),
]

changed = []
for root, dirs, files in os.walk(base):
    for fname in files:
        if fname.endswith('.tsx') or fname.endswith('.ts'):
            fp = os.path.join(root, fname)
            with open(fp, 'r', encoding='utf-8') as f:
                content = f.read()
            original = content
            for old, new in string_repls:
                content = content.replace(old, new)
            if content != original:
                with open(fp, 'w', encoding='utf-8') as f:
                    f.write(content)
                changed.append(fname)

print('Fixed:', changed)
print('Total files changed:', len(changed))

# Also fix the clinician overview page
clin_page = 'apps/web/src/app/(clinician)/clinician/page.tsx'
with open(clin_page, 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace("  const primaryPatientId = patients[0]?.id || 'demo-patient-001';", 
                           "  const primaryPatientId = patients[0]?.id;")
content = content.replace("patientId: 'demo-patient-002'", "patientId: patients[1]?.id || ''")
content = content.replace("patientId: 'demo-patient-001'", "patientId: patients[0]?.id || ''")
with open(clin_page, 'w', encoding='utf-8') as f:
    f.write(content)
print('Also fixed clinician page')
