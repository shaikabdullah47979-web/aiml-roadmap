import React from 'react';
import { Cpu, Layers, Network, Sparkles, BookOpen, Brain, GitBranch, ShieldCheck } from 'lucide-react';

export const IsometricHeroGraphic: React.FC = () => {
  return (
    <div className="relative w-full max-w-[500px] h-[420px] mx-auto perspective-1500 flex items-center justify-center select-none">
      {/* Background Glowing Orb */}
      <div className="absolute w-72 h-72 bg-gradient-to-tr from-brand-600/30 to-purple-600/30 rounded-full blur-3xl animate-pulse-glow" />

      {/* Main 3D Container (Rotated in Isometric Perspective) */}
      <div 
        className="relative preserve-3d w-full h-full flex items-center justify-center"
        style={{
          transform: 'rotateX(20deg) rotateY(-18deg) rotateZ(4deg)',
        }}
      >
        {/* Isometric Grid Base Plate */}
        <div 
          className="absolute w-80 h-80 rounded-3xl border border-indigo-200/50 bg-gradient-to-br from-indigo-50/80 via-white/40 to-indigo-100/30 backdrop-blur-md shadow-2xl shadow-indigo-500/10"
          style={{
            transform: 'translateZ(-40px)',
          }}
        >
          {/* Grid lines inside base plate */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#e0e7ff_1px,transparent_1px),linear-gradient(to_bottom,#e0e7ff_1px,transparent_1px)] bg-[size:24px_24px] opacity-40 rounded-3xl" />
        </div>

        {/* Floating Layer 1: Core Neural Processing Plate */}
        <div 
          className="absolute w-64 h-64 rounded-2xl border border-white/80 bg-white/70 backdrop-blur-xl shadow-xl shadow-slate-900/10 p-5 flex flex-col justify-between animate-float"
          style={{
            transform: 'translateZ(10px)',
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-brand-600 text-white flex items-center justify-center shadow-md shadow-brand-500/30">
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-slate-900">Neural Roadmap</div>
                <div className="text-[10px] text-slate-500 font-medium">Core AI Architecture</div>
              </div>
            </div>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          {/* Mini Neural Nodes Diagram */}
          <div className="grid grid-cols-4 gap-2 py-3">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
              <div 
                key={sem} 
                className="h-10 rounded-lg bg-slate-50 border border-slate-200/70 flex flex-col items-center justify-center text-[10px] font-bold text-slate-700 hover:border-brand-400 hover:bg-brand-50 transition-colors"
              >
                <span>S{sem}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-100 font-medium">
            <span>Semesters 1 to 8</span>
            <span className="text-brand-600 font-semibold">Active</span>
          </div>
        </div>

        {/* Floating Card 2: 3D Top Left Isometric Badge (Machine Learning) */}
        <div 
          className="absolute -top-4 -left-6 px-4 py-3 rounded-2xl bg-white/90 border border-white/90 shadow-xl shadow-slate-900/10 backdrop-blur-xl flex items-center gap-3 animate-float-delayed"
          style={{
            transform: 'translateZ(60px)',
          }}
        >
          <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-sm">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">Machine Learning</div>
            <div className="text-[10px] text-slate-500">Supervised & Deep Learning</div>
          </div>
        </div>

        {/* Floating Card 3: 3D Bottom Right Isometric Badge (Question Bank & Notes) */}
        <div 
          className="absolute -bottom-6 -right-6 px-4 py-3 rounded-2xl bg-white/90 border border-white/90 shadow-xl shadow-slate-900/10 backdrop-blur-xl flex items-center gap-3 animate-float-reverse"
          style={{
            transform: 'translateZ(75px)',
          }}
        >
          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shadow-sm">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-900">Curated Repository</div>
            <div className="text-[10px] text-slate-500">Verified Notes & Q&A</div>
          </div>
        </div>

        {/* Floating Mini Satellite Badge: HOD Verified */}
        <div 
          className="absolute -right-2 top-10 px-3 py-1.5 rounded-full bg-slate-900 text-white text-[11px] font-semibold shadow-xl flex items-center gap-1.5 animate-float"
          style={{
            transform: 'translateZ(90px)',
          }}
        >
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>HOD Verified</span>
        </div>
      </div>
    </div>
  );
};

