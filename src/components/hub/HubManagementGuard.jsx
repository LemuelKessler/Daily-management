import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Lock, Eye, EyeOff } from 'lucide-react';

const CREDS = { user: 'acessoadm', pass: '26330629Lg@' };

export default function HubManagementGuard({ children }) {
  const [authed, setAuthed] = useState(false);
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    if (user === CREDS.user && pass === CREDS.pass) {
      setAuthed(true);
      setError('');
    } else {
      setError('Usuário ou senha inválidos.');
    }
  };

  if (authed) return children;

  return (
    <div className="max-w-sm mx-auto mt-20">
      <Card className="border-border/60 shadow-lg">
        <CardHeader className="text-center">
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Lock className="w-7 h-7 text-primary" />
          </div>
          <CardTitle className="font-inter text-lg">Área Restrita</CardTitle>
          <p className="text-sm text-muted-foreground font-inter">Gestão de Hubs — acesso autorizado apenas</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label className="text-xs font-inter">Usuário</Label>
              <Input value={user} onChange={e => setUser(e.target.value)} placeholder="Usuário" autoComplete="username" />
            </div>
            <div>
              <Label className="text-xs font-inter">Senha</Label>
              <div className="relative">
                <Input
                  type={showPass ? 'text' : 'password'}
                  value={pass}
                  onChange={e => setPass(e.target.value)}
                  placeholder="Senha"
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {error && <p className="text-xs text-destructive font-inter">{error}</p>}
            <Button type="submit" className="w-full">Entrar</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}