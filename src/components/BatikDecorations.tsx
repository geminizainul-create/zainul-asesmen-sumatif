import React from 'react';

/**
 * Authentic Indonesian Batik Kawung Motif SVG Icon
 * Symbol of wisdom, purity, balance, and cultural heritage.
 */
export const BatikKawungIcon: React.FC<{ className?: string; size?: number }> = ({
  className = 'w-4 h-4',
  size = 18,
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    {/* Center core */}
    <circle cx="12" cy="12" r="1.8" fill="currentColor" fillOpacity="0.9" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.5" />
    {/* Four intersecting Kawung petals */}
    <ellipse cx="12" cy="6.5" rx="3.5" ry="5.5" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.85" />
    <ellipse cx="12" cy="17.5" rx="3.5" ry="5.5" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.85" />
    <ellipse cx="6.5" cy="12" rx="5.5" ry="3.5" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.85" />
    <ellipse cx="17.5" cy="12" rx="5.5" ry="3.5" stroke="currentColor" strokeWidth="1.2" strokeOpacity="0.85" />
    {/* Inner seed dots */}
    <circle cx="12" cy="6.5" r="0.8" fill="currentColor" />
    <circle cx="12" cy="17.5" r="0.8" fill="currentColor" />
    <circle cx="6.5" cy="12" r="0.8" fill="currentColor" />
    <circle cx="17.5" cy="12" r="0.8" fill="currentColor" />
    {/* Diagonal corner accents */}
    <circle cx="5" cy="5" r="1" fill="currentColor" fillOpacity="0.4" />
    <circle cx="19" cy="5" r="1" fill="currentColor" fillOpacity="0.4" />
    <circle cx="5" cy="19" r="1" fill="currentColor" fillOpacity="0.4" />
    <circle cx="19" cy="19" r="1" fill="currentColor" fillOpacity="0.4" />
  </svg>
);

/**
 * Traditional Indonesian Batik Ribbon Accent (Horizontal Band)
 * Features repeating Batik Kawung & Parang motifs with subtle gradient.
 */
export const BatikHeaderRibbon: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`w-full overflow-hidden flex items-center justify-center opacity-70 pointer-events-none ${className}`}>
    <svg
      className="w-full max-w-2xl h-5 text-amber-400/60"
      viewBox="0 0 700 20"
      preserveAspectRatio="none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="batikRibbonGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#818cf8" stopOpacity="0" />
          <stop offset="20%" stopColor="#818cf8" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#fbbf24" stopOpacity="0.9" />
          <stop offset="80%" stopColor="#818cf8" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#818cf8" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Central axis line */}
      <line x1="20" y1="10" x2="680" y2="10" stroke="url(#batikRibbonGrad)" strokeWidth="0.8" />
      {/* Repeating Kawung florets along the ribbon */}
      {[50, 100, 150, 200, 250, 300, 350, 400, 450, 500, 550, 600, 650].map((x) => (
        <g key={x} transform={`translate(${x}, 10)`}>
          <ellipse cx="0" cy="-4" rx="2.5" ry="4" stroke="url(#batikRibbonGrad)" strokeWidth="0.8" />
          <ellipse cx="0" cy="4" rx="2.5" ry="4" stroke="url(#batikRibbonGrad)" strokeWidth="0.8" />
          <ellipse cx="-4" cy="0" rx="4" ry="2.5" stroke="url(#batikRibbonGrad)" strokeWidth="0.8" />
          <ellipse cx="4" cy="0" rx="4" ry="2.5" stroke="url(#batikRibbonGrad)" strokeWidth="0.8" />
          <circle cx="0" cy="0" r="1.2" fill="#fbbf24" fillOpacity="0.8" />
        </g>
      ))}
    </svg>
  </div>
);

/**
 * Batik Divider with center medallion
 */
export const BatikDivider: React.FC<{ className?: string }> = ({ className = 'my-6' }) => (
  <div className={`relative flex items-center justify-center ${className}`}>
    <div className="grow border-t border-indigo-500/20" />
    <div className="mx-3 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-900/80 border border-amber-500/30 text-amber-400/80 text-[10px] font-medium tracking-widest uppercase">
      <BatikKawungIcon size={12} className="text-amber-400" />
      <span className="hidden sm:inline">Corak Batik Nusantara</span>
      <BatikKawungIcon size={12} className="text-amber-400" />
    </div>
    <div className="grow border-t border-indigo-500/20" />
  </div>
);

/**
 * Corner Batik filigree flourish for cards
 */
export const BatikCornerFlourish: React.FC<{
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  className?: string;
}> = ({ position = 'top-right', className = '' }) => {
  const getPositionClass = () => {
    switch (position) {
      case 'top-left':
        return 'top-0 left-0';
      case 'bottom-right':
        return 'bottom-0 right-0 rotate-180';
      case 'bottom-left':
        return 'bottom-0 left-0 -rotate-90';
      case 'top-right':
      default:
        return 'top-0 right-0';
    }
  };

  return (
    <div
      className={`absolute ${getPositionClass()} w-20 h-20 pointer-events-none opacity-20 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full text-indigo-400"
      >
        <path
          d="M100 0 C70 0, 50 20, 50 50 C50 80, 20 100, 0 100"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="2 3"
        />
        {/* Kawung motif clusters */}
        <g transform="translate(75, 25)">
          <ellipse cx="0" cy="-8" rx="5" ry="9" stroke="currentColor" strokeWidth="1.2" />
          <ellipse cx="0" cy="8" rx="5" ry="9" stroke="currentColor" strokeWidth="1.2" />
          <ellipse cx="-8" cy="0" rx="9" ry="5" stroke="currentColor" strokeWidth="1.2" />
          <ellipse cx="8" cy="0" rx="9" ry="5" stroke="currentColor" strokeWidth="1.2" />
          <circle cx="0" cy="0" r="2.5" fill="#fbbf24" />
        </g>
        <g transform="translate(45, 55)">
          <ellipse cx="0" cy="-5" rx="3" ry="6" stroke="currentColor" strokeWidth="1" />
          <ellipse cx="0" cy="5" rx="3" ry="6" stroke="currentColor" strokeWidth="1" />
          <ellipse cx="-5" cy="0" rx="6" ry="3" stroke="currentColor" strokeWidth="1" />
          <ellipse cx="5" cy="0" rx="6" ry="3" stroke="currentColor" strokeWidth="1" />
          <circle cx="0" cy="0" r="1.5" fill="#fbbf24" />
        </g>
      </svg>
    </div>
  );
};
