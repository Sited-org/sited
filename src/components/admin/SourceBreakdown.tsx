import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import type { Lead } from '@/hooks/useLeads';

interface SourceBreakdownProps {
  leads: Lead[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(221, 83%, 53%)', 'hsl(262, 83%, 58%)'];

const projectTypeLabels: Record<string, string> = {
  website: 'Website',
  app: 'App',
  ai: 'AI Integration',
};

export function SourceBreakdown({ leads }: SourceBreakdownProps) {
  const data = useMemo(() => {
    const counts: Record<string, number> = {};
    
    leads.forEach(lead => {
      const type = lead.project_type;
      counts[type] = (counts[type] || 0) + 1;
    });
    
    return Object.entries(counts).map(([type, count]) => ({
      name: projectTypeLabels[type] || type,
      value: count,
    }));
  }, [leads]);

  if (data.length === 0) {
    return (
      <div className="h-[250px] flex items-center justify-center text-muted-foreground">
        No data available
      </div>
    );
  }

  return (
    <div className="h-[250px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={5}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '8px',
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
