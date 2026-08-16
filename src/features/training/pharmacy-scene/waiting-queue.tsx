import { cn } from "@/lib/utils";

export function WaitingQueue({ activeTurn }: { activeTurn: string }) {
  const turns = ["A-01", "A-02", "A-03", "A-04"];
  const activeIndex = Math.max(0, turns.indexOf(activeTurn));
  const nextTurns = turns.slice(activeIndex + 1, activeIndex + 3);

  return (
    <div aria-label={`Turno actual ${activeTurn}. Próximos turnos: ${nextTurns.join(", ") || "ninguno"}.`} className="absolute inset-0 overflow-hidden">
      <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,#eef4ed_0%,#dce8dd_68%,#c5d4ca_100%)]" />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 h-[58%] bg-[linear-gradient(90deg,transparent_0_12%,rgb(255_255_255/.62)_12%_13%,transparent_13%_87%,rgb(255_255_255/.62)_87%_88%,transparent_88%)]" />
      <div aria-hidden="true" className="absolute left-[6%] top-[12%] h-[58%] w-[19%] rounded-t-[2.5rem] border-[5px] border-emerald-950/65 bg-[#cad9d0] shadow-inner">
        <div className="absolute inset-x-[13%] bottom-0 h-[74%] rounded-t-[1.8rem] bg-[#8aa696]" />
        <div className="absolute bottom-[12%] left-1/2 h-[42%] w-1 -translate-x-1/2 bg-emerald-950/25" />
      </div>
      <div aria-hidden="true" className="absolute right-[5%] top-[14%] h-[52%] w-[22%] rounded-2xl border-4 border-white/70 bg-white/45 p-3 shadow-sm">
        <div className="h-2 w-2/3 rounded bg-emerald-700/50" />
        <div className="mt-3 h-1.5 w-full rounded bg-slate-500/20" />
        <div className="mt-2 h-1.5 w-5/6 rounded bg-slate-500/20" />
        <div className="mt-2 h-1.5 w-3/4 rounded bg-slate-500/20" />
      </div>

      <div aria-hidden="true" className="absolute bottom-[8%] left-[2%] flex items-end gap-3 opacity-45 blur-[0.2px]">
        <QueuePerson coat="bg-slate-600" hair="bg-stone-700" scale="scale-75" />
        <QueuePerson coat="bg-rose-800" hair="bg-stone-500" scale="scale-90" />
      </div>
      <div aria-hidden="true" className="absolute bottom-[7%] right-[1%] flex items-end gap-2 opacity-35">
        <QueuePerson coat="bg-teal-800" hair="bg-slate-700" scale="scale-75" />
        <QueuePerson coat="bg-amber-800" hair="bg-stone-600" scale="scale-90" />
      </div>

      <div className="absolute left-[3%] top-[3%] z-10 overflow-hidden rounded-xl border-2 border-slate-950 bg-slate-900 shadow-[0_5px_14px_rgb(19_33_60/.25)]">
        <p className="border-b border-slate-600 px-3 py-1 text-[0.5rem] font-black tracking-[0.16em] text-slate-300">TURNO</p>
        <p className="px-3 py-2 font-mono text-lg font-black tracking-widest text-amber-300 sm:text-2xl">{activeTurn}</p>
        {nextTurns.length > 0 ? (
          <div className="flex border-t border-slate-600 bg-slate-800">
            {nextTurns.map((turn) => (
              <span className="flex-1 px-2 py-1 text-center font-mono text-[0.55rem] font-bold text-slate-300" key={turn}>{turn}</span>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function QueuePerson({ coat, hair, scale }: { coat: string; hair: string; scale: string }) {
  return (
    <div className={cn("relative h-24 w-14 origin-bottom", scale)}>
      <div className={cn("absolute left-1/2 top-0 size-9 -translate-x-1/2 rounded-full", hair)} />
      <div className={cn("absolute inset-x-0 bottom-0 h-[68%] rounded-t-3xl", coat)} />
    </div>
  );
}
