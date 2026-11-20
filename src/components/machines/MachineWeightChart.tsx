import { View, Text, useWindowDimensions } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { dailyWorkingWeights, type MachineSummary } from '../../lib/machines';
import { formatDayMonth } from '../../lib/utils';

export function MachineWeightChart({ machine }: { machine: MachineSummary }) {
  const { width } = useWindowDimensions();
  const WIDTH = width - 64;
  const points = dailyWorkingWeights(machine);

  if (points.length === 0) {
    return (
      <View className="h-40 items-center justify-center">
        <Text className="text-gray-500 text-sm">No training sets for this machine</Text>
      </View>
    );
  }

  const values = points.map((p) => p.value);
  const n = values.length;
  const sMax = Math.max(...values);
  const sMin = Math.min(...values);
  const range = sMax - sMin || sMax * 0.1;
  const chartMax = sMax + Math.max(range * 0.4, sMax * 0.08);
  const pointSpacing = WIDTH / Math.max(n - 1, 1);
  const labelEvery = Math.ceil(32 / pointSpacing);

  const lineData = points.map((p, i) => {
    const prev = i > 0 ? values[i - 1] : undefined;
    const changed = prev === undefined || p.value !== prev;
    const showVal = (changed && i % labelEvery === 0) || i === n - 1;
    return {
      value: p.value,
      label: i === 0 || i === n - 1 ? formatDayMonth(p.date) : '',
      dataPointLabelComponent: showVal
        ? () => (
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#e5e7eb', marginBottom: 2 }}>
              {p.value}
            </Text>
          )
        : undefined,
      dataPointLabelShiftY: -22,
      dataPointLabelShiftX: i === 0 ? 4 : i === n - 1 ? -24 : -8,
    };
  });

  return (
    <View style={{ paddingTop: 28 }}>
      <LineChart
        key={`${machine.name}-${n}`}
        data={lineData}
        width={WIDTH}
        height={200}
        stepChart
        color="#22c55e"
        dataPointsColor="#22c55e"
        dataPointsRadius={n > 30 ? 2 : 4}
        thickness={2}
        maxValue={chartMax}
        yAxisThickness={0}
        xAxisThickness={1}
        xAxisColor="#374151"
        yAxisTextStyle={{ color: '#9ca3af', fontSize: 11 }}
        xAxisLabelTextStyle={{ color: '#9ca3af', fontSize: 10 }}
        rulesColor="#1f2937"
        noOfSections={4}
        isAnimated
      />
    </View>
  );
}
