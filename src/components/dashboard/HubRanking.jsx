import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Medal } from 'lucide-react';

export default function HubRanking({ reports }) {
  if (!reports || reports.length === 0) return null;

  const sorted = [...reports]
    .filter(r => r.processado > 0)
    .sort((a, b) => {
      const ratioA = a.processado > 0 ? a.volume_expedido / a.processado : 0;
      const ratioB = b.processado > 0 ? b.volume_expedido / b.processado : 0;
      return ratioB - ratioA;
    })
    .slice(0, 5);

  if (sorted.length === 0) return null;

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <Card className="border-border/60">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-inter font-bold flex items-center gap-2">
          <Trophy className="w-4 h-4 text-primary" />
          Ranking do Dia (% Expedido / Processado)
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {sorted.map((r, i) => {
            const ratio = r.processado > 0 ? ((r.volume_expedido / r.processado) * 100).toFixed(1) : '0';
            return (
              <div key={r.hub_name} className="flex items-center justify-between text-sm font-inter">
                <div className="flex items-center gap-2">
                  <span className="text-base">{medals[i] || `${i + 1}º`}</span>
                  <span className="font-medium">{r.hub_name}</span>
                </div>
                <span className={`font-bold ${parseFloat(ratio) >= 90 ? 'text-green-600' : parseFloat(ratio) >= 70 ? 'text-amber-500' : 'text-destructive'}`}>
                  {ratio}%
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}