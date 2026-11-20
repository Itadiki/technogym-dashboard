import type { Activity } from '../types/domain';
import { formatDate } from './utils';

// Technogym stores the machine name in a metric key such as
// "Rm1ArtisCircuit_ArmCurl" on Biostrength / Artis strength machines.
const MACHINE_KEY_PREFIX = 'Rm1ArtisCircuit_';

export interface MachineSession {
  id: string;
  date: Date;
  dayKey: string;
  sets: Array<{ reps: number; weightKg: number }>;
  isTest: boolean; // short strength test (single set of <= 4 reps)
  topWeightKg: number; // heaviest set weight in the session
  totalReps: number;
  volumeKg: number; // sum of reps x weight
  estimated1RmKg?: number;
}

export interface MachineSummary {
  name: string;
  sessions: MachineSession[]; // oldest first
  trainingSessions: MachineSession[]; // tests excluded
  lastWorkingWeightKg?: number;
  firstWorkingWeightKg?: number;
  bestWorkingWeightKg?: number;
  lastTest1RmKg?: number;
  daysSinceWeightIncrease?: number;
}

export function prettifyMachineName(raw: string): string {
  return raw
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .trim();
}

function machineNameFromMetrics(metrics: Record<string, number>): string | null {
  for (const key of Object.keys(metrics)) {
    if (key.startsWith(MACHINE_KEY_PREFIX)) {
      return prettifyMachineName(key.slice(MACHINE_KEY_PREFIX.length));
    }
  }
  return null;
}

function activityPhId(a: Activity): string | undefined {
  return a.sets?.[0]?.phId;
}

/** Round to 0.5 kg so tiny machine rounding differences (19.9 vs 20.0) don't count as changes. */
function roundKg(v: number): number {
  return Math.round(v * 2) / 2;
}

export function buildMachineSummaries(activities: Activity[]): MachineSummary[] {
  const strength = activities.filter((a) => a.type === 'strength');

  // Learn phId -> machine name from any activity that carries the name metric.
  const nameByPhId: Record<string, string> = {};
  for (const a of strength) {
    const name = machineNameFromMetrics(a.metrics);
    const phId = activityPhId(a);
    if (name && phId) nameByPhId[phId] = name;
  }

  const byMachine: Record<string, MachineSession[]> = {};
  for (const a of strength) {
    const phId = activityPhId(a);
    const name =
      machineNameFromMetrics(a.metrics) ?? (phId ? nameByPhId[phId] : undefined);
    if (!name) continue;

    const sets = (a.sets ?? [])
      .filter((s) => (s.weightKg ?? 0) > 0 && (s.reps ?? 0) > 0)
      .map((s) => ({ reps: Math.round(s.reps ?? 0), weightKg: roundKg(s.weightKg ?? 0) }));
    if (sets.length === 0) continue;

    const totalReps = sets.reduce((t, s) => t + s.reps, 0);
    const session: MachineSession = {
      id: a.id,
      date: a.date,
      dayKey: formatDate(a.date),
      sets,
      isTest: sets.length === 1 && sets[0].reps <= 4,
      topWeightKg: Math.max(...sets.map((s) => s.weightKg)),
      totalReps,
      volumeKg: Math.round(sets.reduce((t, s) => t + s.reps * s.weightKg, 0)),
      estimated1RmKg: a.metrics['Rm1'] ? Math.round(a.metrics['Rm1'] * 10) / 10 : undefined,
    };
    (byMachine[name] ??= []).push(session);
  }

  return Object.entries(byMachine)
    .map(([name, list]) => {
      const sessions = list.sort((x, y) => x.date.getTime() - y.date.getTime());
      // Ignore warm-up style sessions with very light loads (e.g. 4-10 kg setup sets)
      const maxTop = Math.max(...sessions.map((s) => s.topWeightKg));
      const trainingSessions = sessions.filter(
        (s) => !s.isTest && s.topWeightKg >= maxTop * 0.3
      );
      const tests = sessions.filter((s) => s.isTest && s.topWeightKg >= maxTop * 0.3);

      const last = trainingSessions[trainingSessions.length - 1];
      let daysSinceWeightIncrease: number | undefined;
      if (last) {
        // walk back while the same working weight was used
        let since = last;
        for (let i = trainingSessions.length - 2; i >= 0; i--) {
          if (trainingSessions[i].topWeightKg === last.topWeightKg) since = trainingSessions[i];
          else break;
        }
        daysSinceWeightIncrease = Math.round(
          (last.date.getTime() - since.date.getTime()) / 86400000
        );
      }

      return {
        name,
        sessions,
        trainingSessions,
        lastWorkingWeightKg: last?.topWeightKg,
        firstWorkingWeightKg: trainingSessions[0]?.topWeightKg,
        bestWorkingWeightKg: trainingSessions.length
          ? Math.max(...trainingSessions.map((s) => s.topWeightKg))
          : undefined,
        lastTest1RmKg: tests.length ? tests[tests.length - 1].estimated1RmKg : undefined,
        daysSinceWeightIncrease,
      };
    })
    .sort((x, y) => y.sessions.length - x.sessions.length);
}

/** One point per training day: the heaviest working weight used that day. */
export function dailyWorkingWeights(m: MachineSummary): Array<{ date: Date; value: number }> {
  const byDay: Record<string, { date: Date; value: number }> = {};
  for (const s of m.trainingSessions) {
    const cur = byDay[s.dayKey];
    if (!cur || s.topWeightKg > cur.value) byDay[s.dayKey] = { date: s.date, value: s.topWeightKg };
  }
  return Object.values(byDay).sort((a, b) => a.date.getTime() - b.date.getTime());
}

export function formatSets(s: MachineSession): string {
  const allSame = s.sets.every((x) => x.reps === s.sets[0].reps && x.weightKg === s.sets[0].weightKg);
  if (allSame) return `${s.sets.length} × ${s.sets[0].reps} @ ${s.sets[0].weightKg} kg`;
  return s.sets.map((x) => `${x.reps}@${x.weightKg}`).join(' · ') + ' kg';
}
