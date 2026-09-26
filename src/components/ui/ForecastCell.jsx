import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';

const fmt = (n) => (n ?? 0).toLocaleString('pt-BR');

export default function ForecastCell({ volumeRecebido, forecast }) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const iconRef = useRef(null);

  // Só mostra o ícone se houver forecast preenchido
  if (forecast == null || forecast === 0) return <span>{fmt(volumeRecebido)}</span>;

  const diff = forecast > 0 ? ((volumeRecebido - forecast) / forecast) * 100 : null;
  const diffPositive = diff != null && diff >= 0;

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
    <span className="inline-flex items-center gap-1">
      {fmt(volumeRecebido)}
      <span ref={iconRef} className="relative inline-block">
        <Info
          className="w-3.5 h-3.5 text-muted-foreground cursor-pointer hover:text-primary transition-colors"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        />
      </span>
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
          className="mb-2 min-w-[13rem] bg-gray-900 text-white text-xs rounded-lg px-3 py-2.5 shadow-2xl leading-relaxed"
        >
          <div className="flex justify-between gap-4 mb-1">
            <span className="text-gray-400">Forecast</span>
            <span className="font-semibold">{fmt(forecast)}</span>
          </div>
          <div className="flex justify-between gap-4 mb-1">
            <span className="text-gray-400">Recebido</span>
            <span className="font-semibold">{fmt(volumeRecebido)}</span>
          </div>
          {diff != null && (
            <div className="flex justify-between gap-4 border-t border-gray-700 pt-1 mt-1">
              <span className="text-gray-400">Diferença</span>
              <span className={`font-bold ${diffPositive ? 'text-green-400' : 'text-red-400'}`}>
                {diffPositive ? '+' : ''}{diff.toFixed(1)}%
              </span>
            </div>
          )}
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