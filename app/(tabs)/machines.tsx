import { useEffect, useState } from 'react';
import { ScrollView, View, Text } from 'react-native';
import { SectionHeader } from '../../src/components/ui/SectionHeader';
import { StatCard } from '../../src/components/ui/StatCard';
import { FilterBar } from '../../src/components/filters/FilterBar';
import { MachineSelector } from '../../src/components/machines/MachineSelector';
import { MachineWeightChart } from '../../src/components/machines/MachineWeightChart';
import { MachineSessionList } from '../../src/components/machines/MachineSessionList';
import { useMachineSummaries } from '../../src/hooks/useFilteredData';

export default function MachinesScreen() {
  const machines = useMachineSummaries();
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (!selected || !machines.some((m) => m.name === selected)) {
      setSelected(machines[0]?.name ?? null);
    }
  }, [machines]);

  const machine = machines.find((m) => m.name === selected);

  return (
    <ScrollView className="flex-1 bg-gray-900" contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <FilterBar showTypes={false} showGranularity={false} />

      {machines.length === 0 ? (
        <View className="bg-gray-800 rounded-2xl p-4">
          <Text className="text-gray-400 text-sm">
            No machine data found. Strength machines (Biostrength / Artis) are detected from the export.
          </Text>
        </View>
      ) : (
        <>
          <MachineSelector machines={machines} selected={selected} onSelect={setSelected} />

          {machine && (
            <>
              <View className="flex-row mb-4" style={{ marginHorizontal: -4 }}>
                <StatCard label="Current weight" value={machine.lastWorkingWeightKg ?? '–'} unit="kg" color="#22c55e" />
                <StatCard
                  label="Start → now"
                  value={
                    machine.firstWorkingWeightKg !== undefined && machine.lastWorkingWeightKg !== undefined
                      ? `${machine.lastWorkingWeightKg - machine.firstWorkingWeightKg >= 0 ? '+' : ''}${Math.round((machine.lastWorkingWeightKg - machine.firstWorkingWeightKg) * 10) / 10}`
                      : '–'
                  }
                  unit="kg"
                  color="#3b82f6"
                />
              </View>
              <View className="flex-row mb-4" style={{ marginHorizontal: -4 }}>
                <StatCard label="Days at this weight" value={machine.daysSinceWeightIncrease ?? '–'} color="#f59e0b" />
                <StatCard label="Last test (1RM)" value={machine.lastTest1RmKg ?? '–'} unit={machine.lastTest1RmKg ? 'kg' : undefined} color="#a855f7" />
              </View>

              <View className="bg-gray-800 rounded-2xl p-4 mb-4">
                <SectionHeader title={`${machine.name} – working weight`} subtitle="Heaviest set per training day (tests excluded)" />
                <MachineWeightChart machine={machine} />
              </View>

              <View className="bg-gray-800 rounded-2xl p-4 mb-4">
                <SectionHeader title="Recent sessions" subtitle="▲ = heavier than the previous session" />
                <MachineSessionList machine={machine} />
              </View>
            </>
          )}
        </>
      )}
    </ScrollView>
  );
}
