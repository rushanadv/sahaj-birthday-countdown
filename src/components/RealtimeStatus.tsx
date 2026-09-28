import React from 'react';
import { ConnectionState } from '../types';

interface RealtimeStatusProps {
  status: ConnectionState;
  className?: string;
}

export const RealtimeStatus: React.FC<RealtimeStatusProps> = ({ status, className = '' }) => {
  const getBadgeConfig = () => {
    switch (status) {
      case 'live':
        return {
          dotBg: 'bg-emerald-400',
          pingBg: 'bg-emerald-400',
          text: 'text-emerald-400',
          border: 'border-emerald-500/20 bg-emerald-950/30',
          label: 'LIVE · SUPABASE',
        };
      case 'reconnecting':
        return {
          dotBg: 'bg-amber-400',
          pingBg: 'bg-amber-400',
          text: 'text-amber-400',
          border: 'border-amber-500/20 bg-amber-950/30',
          label: 'RECONNECTING...',
        };
      case 'offline':
      default:
        return {
          dotBg: 'bg-rose-400',
          pingBg: 'bg-rose-400',
          text: 'text-rose-400',
          border: 'border-rose-500/20 bg-rose-950/30',
          label: 'OFFLINE',
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <div
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold tracking-wider uppercase border backdrop-blur-md transition-all duration-300 ${config.border} ${config.text} ${className}`}
      title={`Connection state: ${status}`}
    >
      <span className="relative flex h-2 w-2">
        {status === 'live' && (
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${config.pingBg}`} />
        )}
        <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dotBg}`} />
      </span>
      <span>{config.label}</span>
    </div>
  );
};
