"use client";

import { cn } from "@/lib/utils";

type Props = {
  workspace: string;
  documentVisible: boolean;
  trayVisible: boolean;
};

const packagePalette = ["#f4f0ff", "#fff5dc", "#e8f7ef", "#eef5ff", "#fdeaea", "#e7f7fa"];

export function Case001IllustratedScene({ workspace, documentVisible, trayVisible }: Props) {
  return (
    <div className="absolute inset-0 overflow-hidden bg-[#eeeaf4]">
      <svg
        aria-label="Farmacia ambulatoria interactiva"
        className="h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        role="img"
        viewBox="0 0 1200 700"
      >
        <defs>
          <linearGradient id="wall-v3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#faf8f5" />
            <stop offset="65%" stopColor="#f3f0ef" />
            <stop offset="100%" stopColor="#e9eaee" />
          </linearGradient>
          <linearGradient id="glass-v3" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#dff5f8" stopOpacity=".9" />
            <stop offset="100%" stopColor="#a9c7d2" stopOpacity=".86" />
          </linearGradient>
          <linearGradient id="cabinet-v3" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#646d7a" />
            <stop offset="100%" stopColor="#454d59" />
          </linearGradient>
          <linearGradient id="scrubs-v3" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#8b63d4" />
            <stop offset="100%" stopColor="#6742aa" />
          </linearGradient>
          <linearGradient id="counter-v3" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e1e2e6" />
          </linearGradient>
          <filter id="shadow-v3" x="-30%" y="-30%" width="160%" height="170%">
            <feDropShadow dx="0" dy="12" stdDeviation="12" floodColor="#293245" floodOpacity=".18" />
          </filter>
          <filter id="glow-v3" x="-80%" y="-80%" width="260%" height="260%">
            <feDropShadow dx="0" dy="0" stdDeviation="9" floodColor="#7c3aed" floodOpacity=".48" />
          </filter>
        </defs>

        <rect width="1200" height="500" fill="url(#wall-v3)" />
        <rect y="500" width="1200" height="200" fill="#e6e8ec" />
        {Array.from({ length: 7 }).map((_, i) => (
          <path key={`floor-h-${i}`} d={`M0 ${510 + i * 38}H1200`} stroke="#cdd2d9" strokeWidth="1" />
        ))}
        {Array.from({ length: 16 }).map((_, i) => (
          <path key={`floor-v-${i}`} d={`M${i * 90 - 140} 500L${i * 122 - 300} 700`} stroke="#cdd2d9" strokeWidth="1" />
        ))}

        <g filter="url(#shadow-v3)">
          <rect x="24" y="62" width="110" height="188" rx="10" fill="#6041a0" />
          <rect x="61" y="78" width="38" height="11" rx="2" fill="#fff" />
          <rect x="74" y="65" width="12" height="38" rx="2" fill="#fff" />
          <text x="79" y="132" fill="#fff" fontSize="13" fontWeight="800" textAnchor="middle">SEGURIDAD</text>
          <text x="79" y="151" fill="#fff" fontSize="13" fontWeight="800" textAnchor="middle">DEL PACIENTE</text>
          <text x="43" y="181" fill="#fff" fontSize="11">✓ Verifica</text>
          <text x="43" y="203" fill="#fff" fontSize="11">✓ Confirma</text>
          <text x="43" y="225" fill="#fff" fontSize="11">✓ Comunica</text>
        </g>

        <g filter="url(#shadow-v3)">
          <rect x="166" y="60" width="205" height="327" rx="9" fill="url(#glass-v3)" stroke="#80909b" strokeWidth="8" />
          <path d="M190 72L342 364" stroke="#eefbff" strokeWidth="5" opacity=".46" />
          <rect x="391" y="113" width="101" height="224" rx="7" fill="#58616d" stroke="#444c57" strokeWidth="7" />
          <rect x="411" y="146" width="61" height="50" rx="5" fill="#dfe3e7" />
          <text x="441" y="166" fill="#59626f" fontSize="10" fontWeight="800" textAnchor="middle">ÁREA</text>
          <text x="441" y="181" fill="#59626f" fontSize="10" fontWeight="800" textAnchor="middle">RESTRINGIDA</text>
          <circle cx="475" cy="226" r="6" fill="#bfc5cd" />
        </g>

        <g filter="url(#shadow-v3)">
          <rect x="635" y="45" width="520" height="390" rx="10" fill="url(#cabinet-v3)" />
          <rect x="650" y="60" width="233" height="245" rx="6" fill="#555e6b" />
          <rect x="900" y="60" width="240" height="245" rx="6" fill="#505967" />
          {[0, 1, 2, 3].map((row) => (
            <line key={`ls-${row}`} x1="659" y1={108 + row * 57} x2="875" y2={108 + row * 57} stroke="#aeb6c0" strokeWidth="4" />
          ))}
          {[0, 1, 2, 3].map((row) => (
            <line key={`rs-${row}`} x1="909" y1={108 + row * 57} x2="1131" y2={108 + row * 57} stroke="#aeb6c0" strokeWidth="4" />
          ))}
          {Array.from({ length: 52 }).map((_, index) => {
            const sectionOffset = index < 26 ? 0 : 250;
            const local = index < 26 ? index : index - 26;
            const x = 666 + sectionOffset + (local % 9) * 23;
            const y = 73 + Math.floor(local / 9) * 57;
            const h = 24 + (index % 3) * 4;
            return (
              <g key={`medbox-${index}`}>
                <rect x={x} y={y + 31 - h} width="17" height={h} rx="2" fill={packagePalette[index % packagePalette.length]} stroke="#d4d8de" />
                <rect x={x + 2} y={y + 8} width="13" height="3" rx="1" fill={index % 2 ? "#7f5bc2" : "#5aa6a0"} opacity=".72" />
              </g>
            );
          })}
          {Array.from({ length: 12 }).map((_, index) => {
            const x = 653 + (index % 6) * 80;
            const y = 325 + Math.floor(index / 6) * 49;
            return (
              <g key={`drawer-${index}`}>
                <rect x={x} y={y} width="69" height="40" rx="5" fill="#606a78" stroke="#828c99" />
                <rect x={x + 23} y={y + 10} width="24" height="5" rx="2" fill="#c3c9d0" />
              </g>
            );
          })}
        </g>

        <g filter="url(#shadow-v3)">
          <path d="M18 452H650L620 574H0Z" fill="url(#counter-v3)" stroke="#b9c0c9" strokeWidth="2" />
          <path d="M535 493H1188L1161 632H505Z" fill="url(#counter-v3)" stroke="#b9c0c9" strokeWidth="2" />
          <rect x="838" y="605" width="262" height="88" rx="7" fill="#5a6371" />
          <rect x="867" y="623" width="205" height="9" rx="4" fill="#adb5c0" />
          <rect x="867" y="652" width="205" height="9" rx="4" fill="#adb5c0" />
        </g>

        <g transform="translate(300 347)" filter="url(#shadow-v3)">
          <rect width="147" height="104" rx="9" fill="#1f2734" />
          <rect x="10" y="10" width="127" height="77" rx="5" fill="#dae7f1" />
          <rect x="14" y="14" width="119" height="69" rx="4" fill="#e9eef8" />
          <rect x="66" y="104" width="15" height="36" rx="4" fill="#4c5664" />
          <rect x="36" y="136" width="76" height="10" rx="5" fill="#343e4b" />
          <path d="M-36 158H112" stroke="#303947" strokeWidth="12" strokeLinecap="round" />
          <circle cx="74" cy="49" r="14" fill="#7752ba" opacity=".14" />
        </g>

        <PersonPatient x={120} y={330} active={workspace === "service"} />
        <PersonStaff x={515} y={267} active={workspace === "service" || workspace === "system"} />
        <PersonStaff x={1010} y={300} active={workspace === "preparation"} tray={trayVisible} />

        <g transform="translate(865 538)" opacity={trayVisible ? 1 : .72} filter="url(#shadow-v3)">
          <rect width="184" height="46" rx="9" fill="#7956ba" stroke="#6443a5" strokeWidth="4" />
          <Package x={19} y={-29} w={37} h={35} color="#eff7ee" accent="#5e9e59" />
          <Package x={69} y={-35} w={36} h={41} color="#fff0e8" accent="#d36d51" />
          <rect x="126" y="-33" width="28" height="39" rx="8" fill="#755039" />
          <rect x="129" y="-42" width="22" height="12" rx="3" fill="#f3f1e8" />
        </g>

        {documentVisible ? (
          <g transform="translate(150 529) rotate(-5)" filter="url(#shadow-v3)">
            <rect width="145" height="82" rx="7" fill="#fff" stroke="#cbd1da" strokeWidth="2" />
            <rect x="12" y="13" width="37" height="50" rx="4" fill="#eef1f5" />
            <circle cx="31" cy="31" r="9" fill="#e5b08d" />
            <path d="M21 50Q31 40 41 50V58H21Z" fill="#627486" />
            <line x1="61" y1="22" x2="129" y2="22" stroke="#8f98a8" strokeWidth="4" />
            <line x1="61" y1="37" x2="119" y2="37" stroke="#b0b7c2" strokeWidth="3" />
            <line x1="61" y1="51" x2="111" y2="51" stroke="#b0b7c2" strokeWidth="3" />
          </g>
        ) : null}
      </svg>

      <Hotspot className="left-[10.5%] top-[59%]" label="Paciente" active={workspace === "service"} />
      <Hotspot className="left-[34%] top-[60%]" label="Computador" active={workspace === "system"} />
      <Hotspot className="left-[70%] top-[22%]" label="Gavetas / almacenamiento" active={workspace === "storage"} />
      <Hotspot className="left-[83%] top-[63%]" label="Bandeja" active={workspace === "preparation" || workspace === "verification"} />
      <Hotspot className="left-[49%] top-[24%]" label="TENS 1 · Recepción" active={workspace === "service" || workspace === "system"} />
      <Hotspot className="left-[80%] top-[42%]" label="TENS 2 · Preparación" active={workspace === "preparation"} />
    </div>
  );
}

function Package({ x, y, w, h, color, accent }: { x: number; y: number; w: number; h: number; color: string; accent: string }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="4" fill={color} stroke="#d3d6db" />
      <rect x={x + 4} y={y + 7} width={w - 8} height="5" rx="2" fill={accent} opacity=".78" />
      <rect x={x + 4} y={y + 16} width={w * .55} height="3" rx="1.5" fill="#abb2bc" />
    </g>
  );
}

function PersonPatient({ x, y, active }: { x: number; y: number; active: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`} filter={active ? "url(#glow-v3)" : undefined}>
      <ellipse cx="8" cy="142" rx="78" ry="17" fill="#6f7782" opacity=".17" />
      <path d="M-47 70Q-62 104-55 151H58Q62 105 45 69Q28 42 2 42Q-27 42-47 70Z" fill="#356f43" />
      <path d="M-32 82Q-20 65 0 64Q24 65 40 83L33 151H-41Z" fill="#397d49" />
      <circle cx="0" cy="3" r="44" fill="#e8b28d" />
      <path d="M-43 7Q-41-48 3-48Q46-48 45 8Q24-12 1-18Q-22-18-43 7Z" fill="#402b27" />
      <path d="M-42 -1Q-59 40-43 80" stroke="#402b27" strokeWidth="15" strokeLinecap="round" />
      <path d="M42 -1Q59 40 43 80" stroke="#402b27" strokeWidth="15" strokeLinecap="round" />
      <circle cx="-15" cy="7" r="3" fill="#342724" />
      <circle cx="15" cy="7" r="3" fill="#342724" />
      <path d="M-10 22Q0 29 10 22" fill="none" stroke="#9e5f50" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M-33 82Q-50 102-60 127" fill="none" stroke="#e8b28d" strokeWidth="13" strokeLinecap="round" />
      <path d="M37 82Q50 101 58 126" fill="none" stroke="#e8b28d" strokeWidth="13" strokeLinecap="round" />
    </g>
  );
}

function PersonStaff({ x, y, active, tray = false }: { x: number; y: number; active: boolean; tray?: boolean }) {
  return (
    <g transform={`translate(${x} ${y})`} filter={active ? "url(#glow-v3)" : undefined}>
      <ellipse cx="0" cy="151" rx="79" ry="17" fill="#717985" opacity=".16" />
      <path d="M-50 67Q-62 103-54 153H54Q62 103 50 67Q30 39 0 39Q-30 39-50 67Z" fill="url(#scrubs-v3)" />
      <path d="M-18 48L0 67L19 48L31 65L0 91L-30 65Z" fill="#6d49b0" opacity=".8" />
      <circle cx="0" cy="1" r="42" fill="#e8b28d" />
      <path d="M-41 3Q-35-48 10-45Q49-40 42 12Q27-11 5-18Q-18-22-41 3Z" fill="#412b27" />
      <path d="M28 -31Q58-10 50 21" stroke="#412b27" strokeWidth="13" strokeLinecap="round" />
      <circle cx="-14" cy="6" r="3" fill="#342724" />
      <circle cx="14" cy="6" r="3" fill="#342724" />
      <path d="M-9 21Q0 27 9 21" fill="none" stroke="#9e5f50" strokeWidth="2.5" strokeLinecap="round" />
      <rect x="14" y="72" width="24" height="29" rx="3" fill="#fff" opacity=".94" />
      <rect x="18" y="77" width="16" height="4" rx="2" fill="#8061be" />
      {tray ? (
        <g transform="translate(-75 107)">
          <rect width="150" height="24" rx="7" fill="#4f9ccc" />
          <Package x={16} y={-27} w={29} h={31} color="#f4f1e7" accent="#62a264" />
          <Package x={59} y={-34} w={29} h={38} color="#fff0e8" accent="#d46d50" />
          <rect x="105" y="-31" width="27" height="35" rx="8" fill="#745039" />
        </g>
      ) : null}
    </g>
  );
}

function Hotspot({ className, label, active }: { className: string; label: string; active: boolean }) {
  return (
    <div className={cn("absolute z-20 -translate-x-1/2", className)}>
      <span className={cn("mx-auto block size-4 rounded-full border-[3px] border-white shadow transition", active ? "animate-pulse bg-violet-600 ring-4 ring-violet-300/60" : "bg-violet-400")} />
      <span className={cn("mt-1 block whitespace-nowrap rounded-xl border bg-white/95 px-3 py-1.5 text-[0.64rem] font-black shadow-md", active ? "border-violet-400 text-violet-700" : "border-violet-100 text-slate-600")}>{label}</span>
    </div>
  );
}
