import { View, Text } from 'react-native';
import { formatSets, type MachineSummary } from '../../lib/machines';
import { formatDayMonth } from '../../lib/utils';

export function MachineSessionList({ machine, limit = 15 }: { machine: MachineSummary; limit?: number }) {
  const recent = [...machine.sessions].reverse().slice(0, limit);
  return (
    <View>
      {recent.map((s, i) => {
        const prev = recent[i + 1];
        const up = prev && !s.isTest && !prev.isTest && s.topWeightKg > prev.topWeightKg;
        return (
          <View
            key={s.id}
            className="flex-row items-center py-2"
            style={{ borderBottomWidth: i === recent.length - 1 ? 0 : 1, borderBottomColor: '#374151' }}
          >
            <Text className="text-xs text-gray-400" style={{ width: 82 }}>
              {formatDayMonth(s.date)}
            </Text>
            <Text className="text-sm text-gray-100 flex-1">
              {s.isTest ? `Strength test · ${s.sets[0].weightKg} kg` : formatSets(s)}
            </Text>
            {up && <Text style={{ color: '#22c55e', fontSize: 12, fontWeight: '700' }}>▲</Text>}
            {s.isTest && <Text style={{ color: '#f59e0b', fontSize: 11, fontWeight: '700' }}>TEST</Text>}
          </View>
        );
      })}
    </View>
  );
}
