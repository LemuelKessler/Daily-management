import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Clock } from 'lucide-react';

/**
 * Exibe um ícone de relógio com tooltip mostrando a última atualização do report.
 * Usa o campo `updated_date` (ou `created_date` como fallback) do report.
 */
export default function LastUpdateBadge({ report, className = '' }) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const iconRef = useRef(null);

  if (!report) return null;

  const dateStr = report.updated_date || report.created_date;
  if (!dateStr) return null;

  const date = new Date(dateStr);
  // Corrige offset: banco salva sem 'Z' (sem indicador UTC), então o browser interpreta como local
  // mas na verdade está em UTC — subtraímos 3h para BRT (UTC-3)
  const corrected = new Date(date.getTime() - 3 * 60 * 60 * 1000);
  const formatted = corrected.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const userEmail = report.created_by || 'Desconhecido';

  const handleMouseEnter = () => {
    if (iconRef.current) {
      const rect = iconRef.current.getBoundingClientRect();
      setPos({
        top: rect.top + window.scrollY - 8,
        left: rect.left + window.scrollX + rect.width / 2,
      });
    }
    setShow(true);
  };

  const handleMouseLeave = () => setShow(false);

  return (
    <span ref={iconRef} className={`inline-flex items-center ${className}`}>
      <Clock
        className="w-3.5 h-3.5 text-muted-foreground/60 cursor-pointer hover:text-primary transition-colors"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      />
      {show && createPortal(
        <div
          style={{
            position: 'absolute',
            top: pos.top,
            left: pos.left,
            transform: 'translate(-50%, -100%)',
            zIndex: 99999,
            pointerEvents: 'none',
          }}
          className="mb-2 min-w-[14rem] bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-2xl leading-relaxed"
        >
          <p className="font-medium text-white/70 mb-1">Última atualização:</p>
          <p className="font-semibold mb-2">{formatted}</p>
          <p className="text-white/60 text-xs">{userEmail}</p>
          <div
            style={{
              position: 'absolute',
              bottom: -4,
              left: '50%',
              transform: 'translateX(-50%)',
              width: 8,
              height: 8,
              background: '#111827',
              clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
            }}
          />
        </div>,
        document.body
      )}
    </span>
  );
}