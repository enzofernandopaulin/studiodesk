import React from 'react';
import { Logo } from './Logo';
import { X, Check, Copy } from 'lucide-react';
import { useState } from 'react';

interface BrandCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BrandCardModal: React.FC<BrandCardModalProps> = ({ isOpen, onClose }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const copyToClipboard = (hex: string) => {
    navigator.clipboard.writeText(hex);
    setCopiedCode(hex);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const brandColors = [
    { hex: '#66acd7', name: 'Azul da Logo', desc: 'Principal elemento de identidade e destaque.', textDark: true },
    { hex: '#2F6F9C', name: 'Azul Corporativo', desc: 'Acentos, botões de ação e títulos médios.', textDark: false },
    { hex: '#111111', name: 'Preto Profundo', desc: 'Estrutura visual e base da interface.', textDark: false },
    { hex: '#FFFFFF', name: 'Branco Puro', desc: 'Superfícies de cartões e contrastes.', textDark: true, border: true },
    { hex: '#F5F7F9', name: 'Cinza Fundo', desc: 'Fundo suave e neutro de todo o sistema.', textDark: true, border: true },
    { hex: '#DDE3E8', name: 'Cinza Borda', desc: 'Linhas divisórias, tabelas e contornos.', textDark: true },
    { hex: '#6B7280', name: 'Cinza Texto', desc: 'Descrições secundárias, metadados e legendas.', textDark: false },
    { hex: '#8B5CF6', name: 'Roxo Sutil', desc: 'Cor complementar, representando criatividade e inovação.', textDark: false },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white rounded-3xl border border-[#DDE3E8] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
        {/* Header Header Blue Banner */}
        <div className="bg-[#66acd7] p-8 text-center relative border-b border-[#2F6F9C]/30 flex flex-col items-center justify-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/10 hover:bg-black/20 text-[#000000] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Large Logo */}
          <Logo size="lg" theme="blue" showTagline variant="full" />
        </div>

        {/* Brand Guidelines Content */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Main Title */}
          <div className="text-center space-y-1">
            <h3 className="font-display text-2xl font-black uppercase text-[#111111] tracking-tight">
              Identidade Visual & Diretrizes
            </h3>
            <p className="text-xs text-[#6B7280]">
              Especificações oficiais de cores, tipografia e hierarquia visual do StudioDesk.
            </p>
          </div>

          {/* Colors Palette Grid */}
          <div className="space-y-3">
            <h4 className="font-display text-sm font-black uppercase text-[#111111] tracking-wider">
              Cores Principais
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {brandColors.map(c => (
                <div
                  key={c.hex}
                  onClick={() => copyToClipboard(c.hex)}
                  className={`p-3 rounded-2xl cursor-pointer transition-all hover:scale-[1.02] shadow-2xs space-y-2 ${c.border ? 'border border-[#DDE3E8]' : ''}`}
                  style={{ backgroundColor: c.hex }}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-mono font-bold ${c.textDark ? 'text-[#000000]' : 'text-white'}`}>
                      {c.hex}
                    </span>
                    {copiedCode === c.hex ? (
                      <Check className={`w-3.5 h-3.5 ${c.textDark ? 'text-[#000000]' : 'text-white'}`} />
                    ) : (
                      <Copy className={`w-3 h-3 opacity-60 hover:opacity-100 ${c.textDark ? 'text-[#000000]' : 'text-white'}`} />
                    )}
                  </div>
                  <div>
                    <h5 className={`text-xs font-bold ${c.textDark ? 'text-[#000000]' : 'text-white'}`}>
                      {c.name}
                    </h5>
                    <p className={`text-[9px] line-clamp-2 leading-tight ${c.textDark ? 'text-[#000000]/80' : 'text-white/80'}`}>
                      {c.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Typography Grid */}
          <div className="space-y-3 pt-4 border-t border-[#DDE3E8]">
            <h4 className="font-display text-sm font-black uppercase text-[#111111] tracking-wider">
              Fontes Principais
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-[#F5F7F9] rounded-2xl border border-[#DDE3E8] space-y-1">
                <span className="font-display text-2xl font-black text-[#111111] uppercase tracking-wide block">
                  Anton
                </span>
                <p className="text-xs text-[#6B7280]">
                  Utilizada em títulos, chamadas e elementos de maior impacto visual.
                </p>
              </div>

              <div className="p-4 bg-[#F5F7F9] rounded-2xl border border-[#DDE3E8] space-y-1">
                <span className="text-xl font-bold text-[#111111] font-sans block">
                  Inter
                </span>
                <p className="text-xs text-[#6B7280]">
                  Aplicada na interface, textos e informações, garantindo alta legibilidade.
                </p>
              </div>
            </div>
          </div>

          {/* Directives Summary */}
          <div className="p-4 bg-blue-50/50 rounded-2xl border border-[#66acd7]/30 text-xs space-y-1.5 text-[#111111]">
            <p className="font-bold text-[#2F6F9C] flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>Regras de Aplicação no Sistema:</span>
            </p>
            <ul className="space-y-1 text-[#6B7280] text-[11px] list-disc list-inside">
              <li><strong>Preto profundo (#111111):</strong> estrutura visual e base da interface.</li>
              <li><strong>Azul da logo (#66acd7 / #2F6F9C):</strong> principal elemento de identidade e destaque.</li>
              <li><strong>Roxo sutil (#8B5CF6):</strong> cor complementar, representando criatividade e inovação.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
