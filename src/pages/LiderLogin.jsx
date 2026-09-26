import React, { useState } from 'react';
import { Package, Lock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

export default function LiderLogin({ onLogin }) {
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (user === 'lidershopee' && pass === 'shopee@2026') {
      onLogin();
    } else {
      setError('Usuário ou senha incorretos.');
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-2xl font-inter font-extrabold text-foreground">Shopee Report</h1>
          <p className="text-sm text-muted-foreground font-inter mt-1">Área do Líder</p>
        </div>
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-inter flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" /> Acesso Restrito
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label className="text-xs font-inter">Usuário</Label>
                <Input value={user} onChange={e => { setUser(e.target.value); setError(''); }} placeholder="Usuário" autoComplete="username" />
              </div>
              <div>
                <Label className="text-xs font-inter">Senha</Label>
                <Input type="password" value={pass} onChange={e => { setPass(e.target.value); setError(''); }} placeholder="Senha" autoComplete="current-password" />
              </div>
              {error && <p className="text-xs text-destructive font-inter">{error}</p>}
              <Button type="submit" className="w-full font-inter font-semibold">Entrar</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}