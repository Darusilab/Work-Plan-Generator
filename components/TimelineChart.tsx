
import React, { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { type Task } from '../types';

interface TimelineChartProps {
  tasks: Task[];
}

const dayInMillis = 1000 * 60 * 60 * 24;

export const TimelineChart: React.FC<TimelineChartProps> = ({ tasks }) => {
  const { chartData, projectStart, projectEnd, domain } = useMemo(() => {
    if (!tasks || tasks.length === 0) {
      return { chartData: [], projectStart: 0, projectEnd: 0, domain: [0, 0] };
    }

    const sortedTasks = [...tasks].sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    
    const projectStartDate = new Date(sortedTasks[0].startDate);
    const projectEndDate = sortedTasks.reduce((maxDate, task) => {
        const endDate = new Date(task.endDate);
        return endDate > maxDate ? endDate : maxDate;
    }, new Date(0));

    const projectStart = projectStartDate.getTime();
    const projectEnd = projectEndDate.getTime();

    const chartData = sortedTasks.map(task => {
      const start = new Date(task.startDate).getTime();
      const end = new Date(task.endDate).getTime();
      const startOffset = Math.round((start - projectStart) / dayInMillis);
      const duration = Math.max(1, Math.round((end - start) / dayInMillis));
      
      return {
        name: task.name,
        assignee: task.assignee,
        startOffset,
        duration,
        startDate: task.startDate,
        endDate: task.endDate
      };
    });

    const totalDays = Math.round((projectEnd - projectStart) / dayInMillis);

    return { chartData, projectStart, projectEnd, domain: [0, totalDays] };
  }, [tasks]);

  if (!tasks || tasks.length === 0) {
    return <div className="flex items-center justify-center h-full text-slate-500">No tasks to display in timeline.</div>;
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="p-2 bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-md shadow-lg">
          <p className="font-bold text-slate-800 dark:text-slate-100">{`${label}`}</p>
          <p className="text-sm text-slate-600 dark:text-slate-300">{`Assignee: ${data.assignee}`}</p>
          <p className="text-sm text-slate-600 dark:text-slate-300">{`Duration: ${data.startDate} to ${data.endDate}`}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height={tasks.length * 50 + 60}>
      <BarChart
        data={chartData}
        layout="vertical"
        margin={{ top: 20, right: 30, left: 100, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.2} />
        <XAxis 
            type="number" 
            domain={domain} 
            tickFormatter={(tick) => `Day ${tick}`} 
            stroke="currentColor" 
            className="text-xs"
        />
        <YAxis 
            type="category" 
            dataKey="name" 
            width={150} 
            tick={{ fill: 'currentColor', fontSize: 12 }} 
            stroke="currentColor" 
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(100, 116, 139, 0.1)' }}/>
        <Bar dataKey="startOffset" stackId="a" fill="transparent" />
        <Bar dataKey="duration" stackId="a" fill="rgb(79 70 229)" radius={[4, 4, 4, 4]} />
      </BarChart>
    </ResponsiveContainer>
  );
};
