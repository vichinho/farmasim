"use client";

import { cn } from "@/lib/utils";

type Props = {
  workspace: string;
  documentVisible: boolean;
  trayVisible: boolean;
};

export function Case001IllustratedScene({ workspace, documentVisible, trayVisible }: Props) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#eef1f6]">
      <svg
        aria-label="Farmacia ambulatoria interactiva"
        className="h-full w-full"
        role="img"
        viewBox="0 0 1200 700"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fbfaf8" />
            <stop offset="100%" stopColor="#eceff3" />
          </linearGradient>
          <linearGradient id="counter" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#d8dde4" />
          </linearGradient>
          <linearGradient id="cabinet" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#788493" />
            <stop offset="100%" stopColor="#566171" />
          </linearGradient>
          <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#283144" floodOpacity="0.16" />
          </filter>
          <filter id="glow" x="-60%" y="-60%" width="220%" height="220%">
            <feDropShadow dx="0" dy="0" stdDeviation="8" floodColor="#7c3aed" floodOpacity="0.45" />
          </filter>
        </defs>

        <rect width="1200" height="470" fill="url(#wall)" />
        <path d="M0 470H1200V700H0Z" fill="#e4e8ee" />
        {Array.from({ length: 15 }).map((_, i) => (
          <path key={`floor-v-${i}`} d={`M${i * 88 - 120} 470L${i * 125 - 280} 700`} stroke="#d0d5dd" strokeWidth="1" />
        ))}
        {Array.from({ length: 5 }).map((_, i) => (
          <path key={`floor-h-${i}`} d={`M0 ${500 + i * 48}H1200`} stroke="#d0d5dd" strokeWidth="1" />
        ))}

        <g opacity="0.98">
          <rect x="18" y="70" width="100" height="180" rx="7" fill="#6d4bb5" />
          <rect x="48" y="90" width="40" height="12" rx="2" fill="#fff" />
          <rect x="62" y="76" width="12" height="40" rx="2" fill="#fff" />
          <text x="68" y="142" fill="#fff" fontSize="13" fontWeight="800" textAnchor="middle">SEGURIDAD</text>
          <text x="68" y="159" fill="#fff" fontSize="13" fontWeight="800" textAnchor="middle">DEL PACIENTE</text>
          <text x="34" y="190" fill="#fff" fontSize="12">✓ Verifica</text>
          <text x="34" y="211" fill="#fff" fontSize="12">✓ Confirma</text>
          <text x="34" y="232" fill="#fff" fontSize="12">✓ Comunica</text>
        </g>

        <g>
          <rect x="150" y="58" width="190" height="300" rx="6" fill="#abc7d1" stroke="#8fa1aa" strokeWidth="7" />
          <path d="M170 70L310 340" stroke="#dbe8ec" strokeWidth="4" opacity="0.55" />
          <rect x="372" y="100" width="90" height="210" rx="5" fill="#65707b" stroke="#4f5964" strokeWidth="6" />
          <rect x="388" y="135" width="58" height="42" rx="4" fill="#d9dde1" />
          <text x="417" y="154" fill="#66707d" fontSize="10" fontWeight="800" textAnchor="middle">ÁREA</text>
          <text x="417" y="168" fill="#66707d" fontSize="10" fontWeight="800" textAnchor="middle">RESTRINGIDA</text>
        </g>

        <g filter="url(#softShadow)">
          <rect x="650" y="40" width="485" height="355" rx="8" fill="url(#cabinet)" />
          <rect x="660" y="52" width="205" height="215" rx="4" fill="#667281" />
          <rect x="885" y="52" width="240" height="215" rx="4" fill="#626e7c" />
          {[0, 1, 2, 3].map((row) => (
            <line key={`shelf-left-${row}`} x1="665" y1={90 + row * 48} x2="860" y2={90 + row * 48} stroke="#b6bec7" strokeWidth="4" />
          ))}
          {[0, 1, 2, 3].map((row) => (
            <line key={`shelf-right-${row}`} x1="890" y1={90 + row * 48} x2="1120" y2={90 + row * 48} stroke="#b6bec7" strokeWidth="4" />
          ))}
          {Array.from({ length: 28 }).map((_, index) => {
            const leftSection = index < 14;
            const local = leftSection ? index : index - 14;
            const x = (leftSection ? 678 : 902) + (local % 7) * 27;
            const y = 64 + Math.floor(local / 7) * 94;
            const fills = ["#f6f2ff", "#fff5db", "#e8f7f1", "#edf4ff", "#f8e9e9"];
            return <rect key={`box-${index}`} x={x} y={y} width="20" height="27" rx="2" fill={fills[index % fills.length]} stroke="#d4d8df" />;
          })}
          {Array.from({ length: 12 }).map((_, index) => {
            const x = 670 + (index % 6) * 76;
            const y = 286 + Math.floor(index / 6) * 48;
            return (
              <g key={`drawer-${index}`}>
                <rect x={x} y={y} width="65" height="38" rx="4" fill="#6f7a89" stroke="#9099a6" />
                <rect x={x + 21} y={y + 10} width="23" height="5" rx="2" fill="#c8ced6" />
              </g>
            );
          })}
        </g>

        <g filter="url(#softShadow)">
          <path d="M40 438H625L595 564H20Z" fill="url(#counter)" stroke="#bcc4ce" strokeWidth="2" />
          <path d="M525 490H1150L1122 625H500Z" fill="url(#counter)" stroke="#bcc4ce" strokeWidth="2" />
          <rect x="850" y="595" width="235" height="102" rx="5" fill="#626d7c" />
          <rect x="875" y="612" width="190" height="10" rx="5" fill="#aeb6c0" />
          <rect x="875" y="642" width="190" height="10" rx="5" fill="#aeb6c0" />
        </g>

        <g transform="translate(310 355)" filter="url(#softShadow)">
          <rect x="0" y="0" width="128" height="92" rx="8" fill="#202938" />
          <rect x="9" y="9" width="110" height="68" rx="4" fill="#dce7f2" />
          <rect x="57" y="92" width="14" height="34" rx="4" fill="#515d6b" />
          <rect x="28" y="122" width="72" height="9" rx="4" fill="#3e4856" />
          <path d="M-30 145H100" stroke="#28313e" strokeWidth="12" strokeLinecap="round" />
        </g>

        <PersonPatient x={130} y={305} active={workspace === "service"} />
        <PersonStaff x={505} y={250} active={workspace === "service" || workspace === "system"} />
        <PersonStaff x={995} y={275} active={workspace === "preparation"} tray={trayVisible} />

        <g transform="translate(870 525)" opacity={trayVisible ? 1 : 0.55}>
          <rect width="175" height="44" rx="8" fill="#7652b9" stroke="#5f3da1" strokeWidth="4" />
          <rect x="18" y="-20" width="30" height="30" rx="5" fill="#f1efe8" stroke="#c8c4bb" />
          <rect x="65" y="-30" width="30" height="40" rx="8" fill="#704327" />
          <rect x="112" y="-22" width="34" height="32" rx="4" fill="#eff5f3" stroke="#cbd6d1" />
        </g>

        {documentVisible ? (
          <g transform="translate(165 515) rotate(-4)">
            <rect width="135" height="72" rx="5" fill="#fff" stroke="#cbd1dc" strokeWidth="2" />
            <rect x="12" y="12" width="35" height="46" rx="3" fill="#eef1f5" />
            <line x1="58" y1="20" x2="120" y2="20" stroke="#969faf" strokeWidth="4" />
            <line x1="58" y1="34" x2="112" y2="34" stroke="#b1b8c4" strokeWidth="3" />
            <line x1="58" y1="47" x2="105" y2="47" stroke="#b1b8c4" strokeWidth="3" />
          </g>
        ) : null}
      </svg>

      <Hotspot className="left-[11%] top-[58%]" label="Paciente" active={workspace === "service"} icon="●" />
      <Hotspot className="left-[34%] top-[60%]" label="Computador" active={workspace === "system"} icon="▣" />
      <Hotspot className="left-[70%] top-[21%]" label="Gavetas / almacenamiento" active={workspace === "storage"} icon="▤" />
      <Hotspot className="left-[84%] top-[62%]" label="Bandeja" active={workspace === "preparation" || workspace === "verification"} icon="▥" />
      <Hotspot className="left-[48%] top-[22%]" label="TENS 1 · Recepción" active={workspace === "service" || workspace === "system"} icon="●" />
      <Hotspot className="left-[79%] top-[39%]" label="TENS 2 · Bandeja" active={workspace === "preparation"} icon="●" />
    </div>
  );
}

function PersonPatient({ x, y, active }: { x: number; y: number; active: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`} filter={active ? "url(#glow)" : undefined}>
      <ellipse cx="0" cy="115" rx="74" ry="18" fill="#8b95a3" opacity="0.18" />
      <path d="M-44 64Q-54 88-48 132H48Q54 88 44 64Q30 40 0 40Q-30 40-44 64Z" fill="#3b7f4c" />
      <circle cx="0" cy="3" r="42" fill="#e8b48f" />
      <path d="M-40 4Q-35-48 5-45Q42-43 41 6Q27-10 8-17Q-15-24-40 4Z" fill="#432d27" />
      <path d="M-41 -2Q-58 38-40 70" stroke="#432d27" strokeWidth="14" strokeLinecap="round" />
      <path d="M41 -2Q58 38 40 70" stroke="#432d27" strokeWidth="14" strokeLinecap="round" />
      <circle cx="-14" cy="5" r="3" fill="#3a2c29" />
      <circle cx="14" cy="5" r="3" fill="#3a2c29" />
      <path d="M-8 20Q0 25 8 20" stroke="#9d5a4e" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M-48 93Q-25 108 0 108Q26 108 48 93" stroke="#2e673c" strokeWidth="8" fill="none" />
    </g>
  );
}

function PersonStaff({ x, y, active, tray = false }: { x: number; y: number; active: boolean; tray?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`} filter={active ? "url(#glow)" : undefined}>
      <ellipse cx="0" cy="135" rx="72" ry="17" fill="#8b95a3" opacity="0.16" />
      <path d="M-44 60Q-56 88-48 140H48Q56 88 44 60Q28 38 0 38Q-28 38-44 60Z" fill="#7550b7" />
      <circle cx="0" cy="2" r="39" fill="#e8b48f" />
      <path d="M-37 0Q-30-47 10-43Q45-38 38 8Q25-10 6-16Q-15-22-37 0Z" fill="#432d27" />
      <path d="M30 -28Q56-10 50 15" stroke="#432d27" strokeWidth="12" strokeLinecap="round" />
      <circle cx="-13" cy="4" r="3" fill="#3a2c29" />
      <circle cx="13" cy="4" r="3" fill="#3a2c29" />
      <path d="M-8 18Q0 23 8 18" stroke="#9d5a4e" strokeWidth="2" fill="none" strokeLinecap="round" />
      <rect x="13" y="66" width="22" height="26" rx="3" fill="#fff" opacity="0.92" />
      {tray ? (
        <g transform="translate(-67 98)">
          <rect width="134" height="22" rx="6" fill="#4ca7d8" />
          <rect x="18" y="-24" width="24" height="28" rx="4" fill="#f5f2e9" />
          <rect x="58" y="-32" width="24" height="36" rx="7" fill="#65402a" />
          <rect x="96" y="-26" width="26" height="30" rx="4" fill="#eef4ef" />
        </g>
      ) : null}
    </g>
  );
}

function Hotspot({ className, label, active, icon }: { className: string; label: string; active: boolean; icon: string }) {
  return (
    <div className={cn("absolute z-20 -translate-x-1/2", className)}>
      <div className={cn("mx-auto grid size-5 place-items-center rounded-full border-4 border-white text-[7px] text-white shadow", active ? "animate-pulse bg-violet-600 ring-4 ring-violet-300/50" : "bg-violet-500")}>{icon}</div>
      <div className={cn("mt-2 whitespace-nowrap rounded-xl border bg-white/95 px-3 py-2 text-[0.64rem] font-black shadow-lg backdrop-blur", active ? "border-violet-300 text-violet-700" : "border-slate-200 text-slate-600")}>{label}</div>
    </div>
  );
}
