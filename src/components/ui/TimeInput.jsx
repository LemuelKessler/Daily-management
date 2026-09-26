import React from 'react';
import { Input } from '@/components/ui/input';

/**
 * Campo de horário no formato HH:MM.
 * - Formata automaticamente enquanto digita (insere ":" após 2 dígitos)
 * - Bloqueia tudo que não seja número
 * - Limita a 5 caracteres (HH:MM)
 */
export default function TimeInput({ value, onChange, disabled, placeholder = 'HH:MM' }) {
  const handleChange = (e) => {
    let raw = e.target.value.replace(/[^0-9]/g, ''); // só dígitos
    if (raw.length > 4) raw = raw.slice(0, 4);

    let formatted = raw;
    if (raw.length >= 3) {
      formatted = raw.slice(0, 2) + ':' + raw.slice(2);
    }

    onChange(formatted);
  };

  return (
    <Input
      value={value}
      onChange={handleChange}
      placeholder={placeholder}
      maxLength={5}
      inputMode="numeric"
      disabled={disabled}
    />
  );
}