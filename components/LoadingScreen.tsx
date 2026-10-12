'use client';

import React from 'react';
import { Gamepad2, Database, Sparkles } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  submessage?: string;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Cargando biblioteca de videojuegos...',
  submessage = 'Sincronizando partidas, podios y backlog desde MongoDB...',
}) => {
  return (
    <div className="min-h-[85vh] flex flex-col items-center justify-center px-4 relative overflow-hidden select-none">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#6967EB]/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-[#00CAFA]/10 blur-[90px] rounded-full pointer-events-none" />

      {/* Central Animated Badge Container */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-md w-full">
        {/* Glowing Icon Badge with Spinning Outer Ring */}
        <div className="relative mb-6 flex items-center justify-center">
          {/* Pulsing Backlight */}
          <div className="absolute inset-0 bg-[#00CAFA]/20 rounded-3xl blur-xl animate-pulse" />

          {/* Rotating Outer Dashed/Gradient Accent */}
          <div className="absolute -inset-2.5 rounded-3xl border border-[#00CAFA]/30 border-dashed animate-spin [animation-duration:12s]" />

          {/* Main Card Icon */}
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-[#272041] via-[#1E1834] to-[#141124] border border-[#352C56] shadow-[0_0_35px_rgba(0,202,250,0.25)] flex items-center justify-center">
            <Gamepad2 className="w-10 h-10 text-[#00CAFA] transition-transform hover:scale-110 drop-shadow-[0_0_10px_rgba(0,202,250,0.5)]" />
            <Sparkles className="w-4 h-4 text-[#FFBE0B] absolute -top-1.5 -right-1.5 animate-bounce [animation-duration:2.5s]" />
          </div>
        </div>

        {/* Brand Name & Slogan */}
        <div className="mb-6">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white font-sans">
            gamelog<span className="text-[#00CAFA]">.gg</span>
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-[#9D96B8] mt-1.5 flex items-center justify-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00CAFA]" />
            Track like a tryhard
            <span className="w-1.5 h-1.5 rounded-full bg-[#00CAFA]" />
          </p>
        </div>

        {/* Indeterminate Progress Bar */}
        <div className="w-64 sm:w-80 mb-5">
          <div className="h-1.5 w-full bg-[#1E1834] rounded-full border border-[#352C56] overflow-hidden relative shadow-inner">
            <div className="h-full w-2/5 bg-gradient-to-r from-[#6967EB] via-[#00CAFA] to-[#6967EB] rounded-full animate-loader-bar shadow-[0_0_12px_#00CAFA]" />
          </div>
        </div>

        {/* Status Messages */}
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-white tracking-wide">
            {message}
          </p>
          <p className="text-xs text-[#9D96B8] max-w-xs mx-auto">
            {submessage}
          </p>
        </div>

        {/* MongoDB Syncing Pill */}
        <div className="mt-8 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#1E1834]/80 border border-[#352C56] backdrop-blur-sm shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#10B981] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#10B981]" />
          </span>
          <Database className="w-3.5 h-3.5 text-[#00CAFA]" />
          <span className="text-[11px] font-mono font-medium text-[#CBD5E1]">
            MongoDB Atlas Connected
          </span>
        </div>
      </div>
    </div>
  );
};
