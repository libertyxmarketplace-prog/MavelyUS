import React, { useState } from 'react';
import { ChevronDown, Check, Shield, FileText, UserCheck, HelpCircle } from 'lucide-react';

export function TiltedShowcase() {
  const [activeCard, setActiveCard] = useState('support');

  return (
    <div className="w-full flex flex-col items-center gap-6">
      {/* Panel Switcher Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-lg bg-[#0d1017] border border-[#1e2433]">
        <button
          onClick={() => setActiveCard('support')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
            activeCard === 'support' 
              ? 'bg-[#182030] text-[#38bdf8] border border-[#2b3954] shadow-[0_0_12px_rgba(46,144,250,0.18)]' 
              : 'text-[#64748b] hover:text-[#94a3b8]'
          }`}
        >
          Support Desk
        </button>
        <button
          onClick={() => setActiveCard('assistance')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
            activeCard === 'assistance' 
              ? 'bg-[#182030] text-[#38bdf8] border border-[#2b3954] shadow-[0_0_12px_rgba(46,144,250,0.18)]' 
              : 'text-[#64748b] hover:text-[#94a3b8]'
          }`}
        >
          Assistance Portal
        </button>
        <button
          onClick={() => setActiveCard('applications')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
            activeCard === 'applications' 
              ? 'bg-[#182030] text-[#38bdf8] border border-[#2b3954] shadow-[0_0_12px_rgba(46,144,250,0.18)]' 
              : 'text-[#64748b] hover:text-[#94a3b8]'
          }`}
        >
          Staff Applications
        </button>
        <button
          onClick={() => setActiveCard('promotion')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
            activeCard === 'promotion' 
              ? 'bg-[#182030] text-[#38bdf8] border border-[#2b3954] shadow-[0_0_12px_rgba(46,144,250,0.18)]' 
              : 'text-[#64748b] hover:text-[#94a3b8]'
          }`}
        >
          Promotion Notice
        </button>
      </div>

      {/* 2D/3D Tilted Container with subtle blue precision glow */}
      <div 
        style={{
          perspective: '1200px',
          width: '100%',
          maxWidth: '680px',
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <div 
          style={{
            transform: 'rotateX(4deg) rotateY(-2deg)',
            transition: 'transform 0.4s ease, box-shadow 0.4s ease',
            width: '100%',
            filter: 'drop-shadow(0 18px 30px rgba(0,0,0,0.7)) drop-shadow(0 0 25px rgba(46,144,250,0.12))'
          }}
          className="rounded-xl overflow-hidden border border-[#202738] bg-[#2b2d31]"
        >
          {/* Panel 1: Orlando Support (Image 2) */}
          {activeCard === 'support' && (
            <div className="p-5 flex flex-col gap-3 font-sans text-left select-none">
              {/* Custom Header Banner */}
              <div 
                className="w-full h-36 rounded-lg relative overflow-hidden flex flex-col justify-end p-4 border border-[#3b82f6]/30"
                style={{
                  background: 'linear-gradient(135deg, #0284c7 0%, #1e3a8a 70%, #0f172a 100%)',
                  boxShadow: 'inset 0 0 30px rgba(0,0,0,0.4)'
                }}
              >
                <div className="text-[10px] tracking-wider uppercase font-bold text-sky-200 border border-sky-300/40 px-2 py-0.5 rounded w-max mb-1">
                  ORLANDO
                </div>
                <div className="text-3xl font-extrabold text-white tracking-tight leading-none drop-shadow">
                  SUPPORT
                </div>
                <div className="text-xs text-sky-200/90 font-medium tracking-wide mt-1">
                  🌴 More Than A City, It's A Lifestyle
                </div>
              </div>

              {/* Embed Content */}
              <div className="text-lg font-bold text-white tracking-tight mt-1">
                Orlando Support
              </div>

              <div className="border-l-4 border-[#3b82f6] pl-3 py-1 text-[13px] text-[#dbdee1] leading-relaxed">
                If you require support, we ask you to <strong className="text-white">open a ticket and our team will be ready to help</strong>. Choose the category that matches your issue below and a private channel will be opened for you. Any trolling or rule violations will result in instant moderation towards your account.
              </div>

              <div className="flex items-center justify-between text-xs text-[#949ba4] pt-1">
                <span>Please review ticket guidelines before opening.</span>
                <span className="px-3 py-1 rounded bg-[#5865f2] text-white font-medium text-[11px]">
                  Rules
                </span>
              </div>

              {/* Action Buttons Mock */}
              <div className="flex items-center gap-2 pt-1">
                <span className="px-3.5 py-1.5 rounded bg-[#383a40] text-[#dbdee1] font-semibold text-xs border border-[#44464d]">
                  General
                </span>
                <span className="px-3.5 py-1.5 rounded bg-[#383a40] text-[#dbdee1] font-semibold text-xs border border-[#44464d]">
                  Management
                </span>
              </div>

              {/* Bottom blue progress line */}
              <div className="w-full h-1.5 rounded-full bg-[#0284c7] mt-2" />
            </div>
          )}

          {/* Panel 2: Assistance Support (Image 3) */}
          {activeCard === 'assistance' && (
            <div className="p-5 flex flex-col gap-3 font-sans text-left select-none">
              {/* Fiery Banner */}
              <div 
                className="w-full h-36 rounded-lg relative overflow-hidden flex flex-col justify-end p-4 border border-orange-500/30"
                style={{
                  background: 'radial-gradient(ellipse at top, #7c2d12 0%, #1c1917 80%, #0c0a09 100%)',
                  boxShadow: 'inset 0 0 30px rgba(0,0,0,0.6)'
                }}
              >
                <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 tracking-wider">
                  ASSISTANCE
                </div>
                <div className="text-[11px] font-mono tracking-widest uppercase text-orange-300 mt-0.5">
                  — ALABAMA STATE ROLEPLAY —
                </div>
              </div>

              <div className="text-lg font-bold text-white tracking-tight mt-1">
                Assistance Support
              </div>

              <div className="border-l-4 border-orange-500 pl-3 py-1 text-[13px] text-[#dbdee1] leading-relaxed">
                Need assistance? <strong className="text-white">Liberty County Roleplay</strong> is here to help you resolve any issues or answer questions. To ensure your inquiry is handled quickly, please select a support category from the menu below.
              </div>

              <div className="text-xs text-[#949ba4] flex items-center gap-2 py-1 border-y border-[#35373c]">
                <span>Operational Status:</span>
                <span className="text-[#10b981] font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#10b981]" /> Online
                </span>
                <span className="text-[#949ba4]">Staff are actively responding to inquiries.</span>
              </div>

              <div className="text-xs text-[#dbdee1] space-y-1 leading-relaxed">
                <div><strong className="text-white">General Support:</strong> Community questions, general inquiries, and store assistance.</div>
                <div><strong className="text-white">Internal Affairs:</strong> Staff reports, community concerns, and supervisor review.</div>
                <div><strong className="text-white">High Rank Support:</strong> Executive matters, IA+ reports, and administrative management.</div>
                <div><strong className="text-white">Partnership:</strong> Server partnerships, mutual advertising, paid promotions, and staff transfers.</div>
              </div>

              {/* Dropdown select box mock */}
              <div className="w-full h-10 px-3.5 rounded bg-[#1e1f22] border border-[#383a40] flex items-center justify-between text-xs text-[#949ba4] mt-1">
                <span>Select a support category...</span>
                <ChevronDown className="w-4 h-4 text-[#949ba4]" />
              </div>
            </div>
          )}

          {/* Panel 3: Staff Applications (Image 4) */}
          {activeCard === 'applications' && (
            <div className="p-5 flex flex-col gap-3 font-sans text-left select-none">
              {/* Fiery Applications Banner */}
              <div 
                className="w-full h-36 rounded-lg relative overflow-hidden flex flex-col justify-end p-4 border border-orange-500/30"
                style={{
                  background: 'radial-gradient(ellipse at top, #7c2d12 0%, #1c1917 80%, #0c0a09 100%)',
                  boxShadow: 'inset 0 0 30px rgba(0,0,0,0.6)'
                }}
              >
                <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 tracking-wider">
                  APPLICATIONS
                </div>
                <div className="text-[11px] font-mono tracking-widest uppercase text-orange-300 mt-0.5">
                  — ALABAMA STATE ROLEPLAY —
                </div>
              </div>

              <div className="text-lg font-bold text-white tracking-tight mt-1">
                Alabama State Roleplay Staff Applications
              </div>

              <div className="border-l-4 border-orange-500 pl-3 py-1 text-[13px] text-[#dbdee1] leading-relaxed">
                Interested in joining the <strong className="text-white">Alabama State Roleplay</strong> staff team? We are looking for mature, active, and dedicated members who are committed to keeping the community professional and welcoming.
              </div>

              <div className="text-xs text-[#dbdee1] space-y-1">
                <div className="font-semibold text-white">Available Positions:</div>
                <div>• <strong className="text-white">In-Game Staff:</strong> Patrol the ER:LC private server, enforce roleplay rules, answer mod calls, and monitor safe zones.</div>
              </div>

              <div className="text-xs text-[#dbdee1] space-y-1">
                <div className="font-semibold text-white">Requirements:</div>
                <div>• Must be at least 14 years old</div>
                <div>• Must stay active each week in the ER:LC server or Discord</div>
                <div>• Must have a working microphone and clip recording software</div>
              </div>

              {/* Codebox Anti-AI Notice */}
              <div className="p-3 rounded bg-[#1e1f22] border border-red-500/30 font-mono text-[11px] text-amber-400 leading-relaxed">
                <div className="text-red-400 font-bold mb-1">⛔ AI-GENERATED APPLICATIONS ARE NOT ACCEPTED</div>
                <div>Any section of your application written, edited, or expanded with AI results in an immediate and permanent blacklist — no warning, no appeal, no exceptions.</div>
              </div>

              {/* Dropdown select box mock */}
              <div className="w-full h-10 px-3.5 rounded bg-[#1e1f22] border border-[#383a40] flex items-center justify-between text-xs text-[#949ba4]">
                <span>Select an application position...</span>
                <ChevronDown className="w-4 h-4 text-[#949ba4]" />
              </div>
            </div>
          )}

          {/* Panel 4: Staff Promotion Notice (Image 5) */}
          {activeCard === 'promotion' && (
            <div className="p-5 flex flex-col gap-3 font-sans text-left select-none">
              {/* Fiery Promotion Banner */}
              <div 
                className="w-full h-36 rounded-lg relative overflow-hidden flex flex-col justify-end p-4 border border-orange-500/30"
                style={{
                  background: 'radial-gradient(ellipse at top, #7c2d12 0%, #1c1917 80%, #0c0a09 100%)',
                  boxShadow: 'inset 0 0 30px rgba(0,0,0,0.6)'
                }}
              >
                <div className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-red-500 tracking-wider">
                  PROMOTION
                </div>
                <div className="text-[11px] font-mono tracking-widest uppercase text-orange-300 mt-0.5">
                  — ALABAMA STATE ROLEPLAY —
                </div>
              </div>

              <div className="text-lg font-bold text-white tracking-tight mt-1">
                Staff Promotion Notice
              </div>

              <div className="border-l-4 border-orange-500 pl-3 py-1 text-[13px] text-[#dbdee1] leading-relaxed">
                Congratulations to <span className="text-[#818cf8] font-semibold bg-[#5865f2]/20 px-1 rounded">@IAS | blakelybr3</span> on their advancement in <strong className="text-white">Alabama State Roleplay</strong>! We appreciate your commitment and service.
              </div>

              <div className="text-xs text-[#dbdee1] space-y-1.5 pt-1">
                <div><strong className="text-white">Staff Member:</strong> <span className="text-[#818cf8] font-semibold bg-[#5865f2]/20 px-1 rounded">@IAS | blakelybr3</span></div>
                <div><strong className="text-white">Previous Rank:</strong> Community Member</div>
                <div><strong className="text-white">New Rank:</strong> Internal Affairs Supervisor</div>
                <div><strong className="text-white">Approved By:</strong> <span className="text-[#818cf8] font-semibold bg-[#5865f2]/20 px-1 rounded">@D | ♡ Rose♡ | notroseplays_34</span></div>
              </div>

              <div className="border-t border-[#35373c] pt-2">
                <div className="text-xs font-semibold text-white">Reason & Commendation</div>
                <div className="border-l-2 border-zinc-600 pl-2 text-xs text-[#949ba4] mt-1">
                  Very trusted! Has worked with me and for me previously. Welcome to the staff team!
                </div>
              </div>

              <div className="flex items-center justify-between pt-1 text-[11px] text-[#64748b]">
                <span className="px-3 py-1 rounded bg-[#383a40] text-[#dbdee1] font-semibold text-xs border border-[#44464d]">
                  Promotion Approved
                </span>
                <span>Official Promotion • Today at 3:31 PM</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default TiltedShowcase;
