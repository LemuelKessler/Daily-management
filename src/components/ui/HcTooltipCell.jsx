import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Info } from 'lucide-react';

/**
 * Exibe o HC com ícone ⓘ que ao passar o mouse mostra detalhamento:
 * Colaboradores, Diaristas, Sinergia Recebida, HC Total, Absenteísmo e % Absenteísmo
 */
export default function HcTooltipCell({ report }) {
  const [show, setShow] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const iconRef = useRef(null);

  const hc = report?.hc ?? '-';
  const colaboradores = report?.colaboradores ?? null;
  const diaristas = report?.diaristas ?? null;
  const sinergia = report?.sinergia_recebida ?? null;
  const sinergiaEnviada = report?.sinergia_enviada ?? null;
  const absenteismo = report?.absenteismo ?? null;
  const hcNum = Number(report?.hc) || 0;
  const absPercent = hcNum > 0 && absenteismo != null
    ? ((Number(absenteismo) / hcNum) * 100).toFixed(1)
    : null;

  const hasDetail = colaboradores != null || diaristas != null || sinergia != null || absenteismo != null || sinergiaEnviada != null;

  const handleMouseEnter = () => {
    if (!hasDetail) return;
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
    <span className="inline-flex items-center justify-center gap-1">
      <span className="text-lg font-inter font-bold">{hc !== '-' ? hc : '-'}</span>
      {hasDetail && (
        <span ref={iconRef}>
          <Info
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
              className="mb-2 min-w-[15rem] bg-gray-900 text-white text-xs rounded-lg px-3 py-2.5 shadow-2xl leading-relaxed"
            >
              <p className="font-semibold text-white/80 mb-2 border-b border-white/10 pb-1.5">Composição do HC</p>
              <div className="space-y-1">
                {colaboradores != null && (
                  <div className="flex justify-between gap-4">
                    <span className="text-white/60">Colaboradores</span>
                    <span className="font-semibold">{colaboradores}</span>
                  </div>
                )}
                {diaristas != null && (
                  <div className="flex justify-between gap-4">
                    <span className="text-white/60">Diaristas</span>
                    <span className="font-semibold">{diaristas}</span>
                  </div>
                )}
                {sinergia != null && (
                  <div className="flex justify-between gap-4">
                    <span className="text-white/60">Sinergia Recebida</span>
                    <span className="font-semibold">{sinergia}</span>
                  </div>
                )}
                {sinergiaEnviada != null && (
                  <div className="flex justify-between gap-4">
                    <span className="text-white/60">Sinergia Enviada</span>
                    <span className="font-semibold">{sinergiaEnviada}</span>
                  </div>
                )}
                <div className="flex justify-between gap-4 border-t border-white/10 pt-1.5 mt-1.5">
                  <span className="text-white/80 font-medium">HC Total</span>
                  <span className="font-bold text-white">{hcNum}</span>
                </div>
                {absenteismo != null && (
                  <>
                    <div className="flex justify-between gap-4">
                      <span className="text-white/60">Absenteísmo</span>
                      <span className="font-semibold">{absenteismo}</span>
                    </div>
                    {absPercent != null && (
                      <div className="flex justify-between gap-4">
                        <span className="text-white/60">% Absenteísmo</span>
                        <span className="font-semibold text-amber-300">{absPercent}%</span>
                      </div>
                    )}
                  </>
                )}
              </div>
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
      )}
    </span>
  );
}