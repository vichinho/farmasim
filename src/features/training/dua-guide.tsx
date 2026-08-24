"use client";

import Image from "next/image";
import { useId, useState } from "react";

import { duaHintAvailabilityLabel } from "@/features/training/dua-guidance";

import styles from "./dua-guide.module.css";

const DUA_IMAGE = "/images/mascot/dua-guide.png";

type DuaGuideProps = {
  hint: string;
  hintUsed: boolean;
  introOpen: boolean;
  onCloseIntro: () => void;
  onUseHint: () => void;
  visible: boolean;
};

export function DuaGuide({ hint, hintUsed, introOpen, onCloseIntro, onUseHint, visible }: DuaGuideProps) {
  const [hintOpen, setHintOpen] = useState(false);
  const hintId = useId();

  function openHint() {
    if (!hintUsed) onUseHint();
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
              <p className={styles.introDescription} id={`${hintId}-intro-description`}>Te acompañaré durante este caso. Si necesitas orientación, puedes pedirme una pista sin que te entregue directamente la respuesta.</p>
              <p className={styles.introRule}>Tienes una sola pista para este caso. Podrás volver a leerla después de usarla.</p>
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
                  <span>Única pista del caso</span>
                </div>
                <button aria-label="Cerrar consejo de Dua" className={styles.closeButton} onClick={() => setHintOpen(false)} type="button">×</button>
              </div>
              <div className={styles.hintBody}>
                <p className={styles.hintText}>{hint}</p>
                <p className={styles.hintFooter}>Esta pista ya quedó utilizada. Puedes volver a leerla, pero Dua no revelará otra durante este caso.</p>
              </div>
            </section>
          ) : (
            <button aria-controls={hintId} aria-expanded="false" className={styles.trigger} onClick={openHint} type="button">
              <Image alt="" aria-hidden="true" className={styles.triggerArt} height={1374} sizes="46px" src={DUA_IMAGE} width={1145} />
              <span className={styles.triggerCopy}>
                <span className={styles.triggerName}>{hintUsed ? "Revisar pista" : "Pedir consejo a Dua"}</span>
                <span className={styles.triggerStatus}>{duaHintAvailabilityLabel(hintUsed)}</span>
              </span>
            </button>
          )}
        </div>
      ) : null}
    </>
  );
}

export function DuaResultCard({ hintUsed }: { hintUsed: boolean }) {
  return (
    <aside className={styles.resultCard} aria-label="Mensaje final de Dua">
      <Image alt="" aria-hidden="true" className={styles.resultArt} height={1374} sizes="69px" src={DUA_IMAGE} width={1145} />
      <div>
        <p className={styles.resultTitle}>Dua te acompaña en el cierre</p>
        <p className={styles.resultText}>{hintUsed
          ? "Usaste tu pista para orientar la revisión. Ahora compara ese consejo con el resultado completo del caso."
          : "Completaste el caso sin usar tu pista. Aun así, revisa cada criterio para consolidar lo aprendido."}</p>
      </div>
    </aside>
  );
}
