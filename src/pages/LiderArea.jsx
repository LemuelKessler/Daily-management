import React, { useState } from 'react';
import LiderLogin from './LiderLogin';
import LiderReports from './LiderReports';

export default function LiderArea() {
  const [autenticado, setAutenticado] = useState(false);

  if (!autenticado) {
    return <LiderLogin onLogin={() => setAutenticado(true)} />;
  }

  return <LiderReports onLogout={() => setAutenticado(false)} />;
}