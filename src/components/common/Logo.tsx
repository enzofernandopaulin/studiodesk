import React from 'react';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'full' | 'compact' | 'badge' | 'icon';
  theme?: 'dark' | 'light' | 'blue';
  className?: string;
  showTagline?: boolean;
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  variant = 'compact',
  theme = 'light',
  className = '',
  showTagline = false,
  onClick,
}) => {
  // Brand Guidelines:
  // #66acd7 (Azul da logo)
  // #2F6F9C (Azul corporativo / escuro)
  // #111111 / #000000 (Preto profundo)
  // #FFFFFF (Branco)
  // #8B5CF6 (Roxo sutil)
  // Fontes: Anton (Títulos e chamadas), Inter (Interface), Paytone One / Chau Philomene (Logo mark)
  
  const isDarkBg = theme === 'dark';
  const isBlueBg = theme === 'blue';
  
  const textColor = isDarkBg 
    ? 'text-white' 
    : isBlueBg 
      ? 'text-[#000000]' 
      : 'text-[#111111]';

  const subtitleColor = isDarkBg
    ? 'text-[#66acd7]'
    : isBlueBg
      ? 'text-[#000000]'
      : 'text-[#2F6F9C]';

  // Size scale mappings
  const scaleMap = {
    xs: {
      stu: 'text-lg',
      d: 'text-2xl',
      ioEsk: 'text-[10px]',
      height: '18px',
      tagline: 'text-[8px]',
    },
    sm: {
      stu: 'text-xl',
      d: 'text-2xl sm:text-3xl',
      ioEsk: 'text-xs',
      height: '22px',
      tagline: 'text-[9px]',
    },
    md: {
      stu: 'text-2xl sm:text-3xl',
      d: 'text-3xl sm:text-4xl',
      ioEsk: 'text-sm sm:text-base',
      height: '28px',
      tagline: 'text-[10px]',
    },
    lg: {
      stu: 'text-4xl sm:text-5xl',
      d: 'text-5xl sm:text-6xl',
      ioEsk: 'text-xl sm:text-2xl',
      height: '42px',
      tagline: 'text-xs sm:text-sm',
    },
    xl: {
      stu: 'text-5xl sm:text-6xl',
      d: 'text-6xl sm:text-7xl',
      ioEsk: 'text-2xl sm:text-3xl',
      height: '52px',
      tagline: 'text-sm sm:text-base',
    },
  };

  const currentScale = scaleMap[size];

  if (variant === 'icon') {
    return (
      <div 
        onClick={onClick}
        className={`relative inline-flex items-center justify-center font-black select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
      >
        <div className="w-9 h-9 rounded-xl bg-[#66acd7] flex items-center justify-center shadow-xs border border-[#2F6F9C]/30">
          <span className="font-['Paytone_One',sans-serif] text-xl text-[#000000] font-black tracking-tighter">
            SD
          </span>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={onClick}
      className={`inline-flex flex-col select-none ${onClick ? 'cursor-pointer group' : ''} ${className}`}
      id="brand-logo"
    >
      {/* StudioDesk Graphic Typographic Mark */}
      <div className="flex items-center gap-1.5 leading-none">
        <div className="flex items-center">
          {/* Stylized Logo text with interlocking tall D */}
          <div className="flex items-baseline font-['Paytone_One',sans-serif]">
            {/* "Stu" */}
            <span className={`${currentScale.stu} font-black tracking-tight ${textColor} transition-colors`}>
              Stu
            </span>
            
            {/* The iconic stacked "Dio / esk" lockup with tall D */}
            <div className="relative inline-flex flex-col justify-center ml-[-1px] mr-0.5">
              <div className="flex items-baseline">
                {/* Tall D */}
                <span className={`${currentScale.d} font-black leading-none transform -translate-y-[2px] ${textColor} transition-colors`}>
                  D
                </span>
                
                {/* Stacked "io" and "esk" */}
                <div 
                  className="flex flex-col -ml-0.5 justify-between leading-none" 
                  style={{ height: currentScale.height }}
                >
                  <span className={`${currentScale.ioEsk} font-black tracking-tight leading-none ${textColor} transition-colors`}>
                    io
                  </span>
                  <span className={`${currentScale.ioEsk} font-black tracking-tight leading-none -mt-1 ${textColor} transition-colors`}>
                    esk
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Small cyan/blue badge dot */}
        <span className="w-2 h-2 rounded-full bg-[#66acd7] mb-1" />
      </div>

      {/* Subtitle / Tagline: CRM KANBAN PARA AGÊNCIAS CRIATIVAS */}
      {(showTagline || variant === 'full') && (
        <span 
          className={`font-display ${currentScale.tagline} font-black uppercase tracking-[0.14em] mt-1 ${subtitleColor}`}
        >
          CRM KANBAN PARA AGÊNCIAS CRIATIVAS
        </span>
      )}
    </div>
  );
};
