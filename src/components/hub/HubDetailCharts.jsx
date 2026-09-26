import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, parseISO } from 'date-fns';

export default function HubDetailCharts({ data }) {
  if (!data || data.length === 0) {
    return (
      <Card className="border-border/60">
        <CardContent className="py-10 text-center text-muted-foreground font-inter">
          Sem dados no período selecionado
        </CardContent>
      </Card>
    );
  }

  const chartData = data.map(d => ({
    ...d,
    label: format(parseISO(d.date), 'dd/MM'),
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-inter font-bold">Volume Diário</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="volume_recebido" name="Recebido" fill="hsl(var(--chart-1))" radius={[4,4,0,0]} />
              <Bar dataKey="processado" name="Processado" fill="hsl(var(--chart-2))" radius={[4,4,0,0]} />
              <Bar dataKey="volume_expedido" name="Expedido" fill="hsl(var(--chart-3))" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-inter font-bold">PHD Evolução</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} unit="%" />
              <Tooltip contentStyle={{ borderRadius: 12, fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="phd_inbound" name="PHD In" stroke="hsl(var(--chart-4))" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="phd_outbound" name="PHD Out" stroke="hsl(var(--chart-5))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}