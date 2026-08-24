"use client";

import Image from "next/image";
import { useId, useState } from "react";

import { DUA_HINT_LIMIT, duaHintAvailabilityLabel } from "@/features/training/dua-guidance";

import styles from "./dua-guide.module.css";

const DUA_IMAGE = "/images/mascot/dua-guide.png";

type DuaGuideProps = {
  hints: readonly string[];
  hintsUsed: number;
  introOpen: boolean;
  onCloseIntro: () => void;
  onUseHint: () => void;
  visible: boolean;
};

export function DuaGuide({ hints, hintsUsed, introOpen, onCloseIntro, onUseHint, visible }: DuaGuideProps) {
  const [hintOpen, setHintOpen] = useState(false);
  const hintId = useId();
  const remainingHints = Math.max(0, hints.length - hintsUsed);
  const currentHintIndex = Math.max(0, Math.min(hintsUsed - 1, hints.length - 1));

  function openHint() {
    if (remainingHints > 0) onUseHint();
    setHintOpen(true);
  }

  return (
    <>
      {introOpen ? (
        <div className={styles.introOverlay} role="presentation">
          <section aria-describedby={`${hintId}-intro-description`} aria-labelledby={`${hintId}-intro-title`} aria-modal="true" className={styles.introCard} role="dialog">
            <Image
              alt="Dua, la gata blanca asistente de FarmaVerse"
              className={styles.introArt}
              height={1374}
              loading="eager"
              sizes="(max-width: 640px) 105px, 280px"
              src={DUA_IMAGE}
              width={1145}
            />
            <div className={styles.introCopy}>
              <p className={styles.eyebrow}>Tu acompañante</p>
              <h2 className={styles.introTitle} id={`${hintId}-intro-title`}>Hola, soy Dua</h2>
              <p className={styles.introDescription} id={`${hintId}-intro-description`}>Te acompañaré durante este caso. Si necesitas orientación, puedes pedirme ayuda sin que te entregue directamente la respuesta.</p>
              <p className={styles.introRule}>Tienes tres pistas progresivas para este caso. Tú decides cuándo utilizar cada una.</p>
              <button autoFocus className={styles.primaryButton} onClick={onCloseIntro} type="button">Comenzar con Dua</button>
            </div>
          </section>
        </div>
      ) : null}

      {visible && !introOpen ? (
        <div className={styles.dock}>
          {hintOpen ? (
            <section aria-label="Consejo de Dua" aria-live="polite" className={styles.hintCard} id={hintId} role="region">
              <div className={styles.hintHeader}>
                <Image alt="" aria-hidden="true" className={styles.hintArt} height={1374} sizes="64px" src={DUA_IMAGE} width={1145} />
                <div className={styles.hintHeading}>
                  <strong>Consejo de Dua</strong>
                  <span>Pista {Math.max(1, hintsUsed)} de {DUA_HINT_LIMIT}</span>
                </div>
                <button aria-label="Cerrar consejo de Dua" className={styles.closeButton} onClick={() => setHintOpen(false)} type="button">×</button>
              </div>
              <div className={styles.hintBody}>
                <p className={styles.hintText}>{hints[currentHintIndex]}</p>
                <p className={styles.hintFooter}>{remainingHints > 0
                  ? `Te ${remainingHints === 1 ? "queda" : "quedan"} ${remainingHints} ${remainingHints === 1 ? "pista" : "pistas"} para este caso.`
                  : "Ya utilizaste las tres pistas de este caso. Puedes volver a leer esta última orientación."}</p>
                {remainingHints > 0 ? <button className={styles.nextHintButton} onClick={onUseHint} type="button">Usar otra pista ({remainingHints})</button> : null}
              </div>
            </section>
          ) : (
            <button aria-controls={hintId} aria-expanded="false" className={styles.trigger} onClick={openHint} type="button">
              <Image alt="" aria-hidden="true" className={styles.triggerArt} height={1374} sizes="46px" src={DUA_IMAGE} width={1145} />
              <span className={styles.triggerCopy}>
                <span className={styles.triggerName}>{remainingHints === 0 ? "Revisar última pista" : "Pedir consejo a Dua"}</span>
                <span className={styles.triggerStatus}>{duaHintAvailabilityLabel(hintsUsed)}</span>
              </span>
            </button>
          )}
        </div>
      ) : null}
    </>
  );
}

export function DuaResultCard({ hintsUsed }: { hintsUsed: number }) {
  return (
    <aside className={styles.resultCard} aria-label="Mensaje final de Dua">
      <Image alt="" aria-hidden="true" className={styles.resultArt} height={1374} sizes="69px" src={DUA_IMAGE} width={1145} />
      <div>
        <p className={styles.resultTitle}>Dua te acompaña en el cierre</p>
        <p className={styles.resultText}>{hintsUsed > 0
          ? `Utilizaste ${hintsUsed} ${hintsUsed === 1 ? "pista" : "pistas"} durante el caso. Ahora compara esa orientación con el resultado completo.`
          : "Completaste el caso sin usar pistas. Aun así, revisa cada criterio para consolidar lo aprendido."}</p>
      </div>
    </aside>
  );
}
