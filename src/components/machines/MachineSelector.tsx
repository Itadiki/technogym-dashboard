import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import type { MachineSummary } from '../../lib/machines';

interface Props {
  machines: MachineSummary[];
  selected: string | null;
  onSelect: (name: string) => void;
}

export function MachineSelector({ machines, selected, onSelect }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 4, paddingRight: 8 }}
      style={{ marginBottom: 16 }}
    >
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {machines.map((m) => {
          const isSelected = m.name === selected;
          return (
            <TouchableOpacity
              key={m.name}
              onPress={() => onSelect(m.name)}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 999,
                borderWidth: 1.5,
                borderColor: isSelected ? '#3b82f6' : '#4b5563',
                backgroundColor: isSelected ? '#3b82f625' : '#374151',
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: '600', color: isSelected ? '#3b82f6' : '#9ca3af' }}>
                {m.name} ({m.sessions.length})
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}
