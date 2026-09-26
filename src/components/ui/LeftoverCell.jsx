import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';

const fmt = (n) => (n ?? 0).toLocaleString('pt-BR');

export default function LeftoverCell({ value, obs, warn }) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const iconRef = useRef(null);

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
    <span className={`inline-flex items-center gap-1 ${warn ? 'text-amber-600 font-semibold' : ''}`}>
      {fmt(value)}
      {obs && (
        <>
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
              className="mb-2 min-w-[12rem] max-w-xs bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-2xl whitespace-pre-wrap break-words leading-relaxed"
            >
              {obs}
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
        </>
      )}
    </span>
  );
}