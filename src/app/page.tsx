import Image from "next/image";
import Link from "next/link";

import styles from "./home.module.css";

const featureItems = [
  {
    description: "Simulaciones basadas en escenarios de práctica.",
    icon: "book",
    title: "Aprendizaje interactivo",
  },
  {
    description: "Practica decisiones en un entorno demostrativo.",
    icon: "shield",
    title: "Entorno seguro",
  },
  {
    description: "Observa tu avance y recibe feedback al finalizar.",
    icon: "chart",
    title: "Resultados medibles",
  },
  {
    description: "Una experiencia guiada para avanzar paso a paso.",
    icon: "users",
    title: "Para distintos niveles",
  },
] as const;

const simulationCards = [
  {
    description:
      "Practica cómo iniciar una atención, recopilar antecedentes y responder de forma ordenada.",
    number: "01",
    title: "Atención y comunicación",
  },
  {
    description:
      "Recorre situaciones ficticias relacionadas con medicamentos y decisiones dentro de la farmacia.",
    number: "02",
    title: "Dispensación guiada",
  },
  {
    description:
      "Compara alternativas, recibe retroalimentación y entiende cómo tus decisiones cambian el escenario.",
    number: "03",
    title: "Toma de decisiones",
  },
];

type FeatureIconName = (typeof featureItems)[number]["icon"];

function FeatureIcon({ name }: { name: FeatureIconName }) {
  const paths: Record<FeatureIconName, React.ReactNode> = {
    book: (
      <>
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22.5m0-17v17" />
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20" />
      </>
    ),
    chart: <path d="M4 20V10m5 10V4m5 16v-7m5 7V7" />,
    shield: <path d="M12 3 5 6v5c0 4.5 2.8 8.6 7 10 4.2-1.4 7-5.5 7-10V6z" />,
    users: (
      <>
        <path d="M16 21a6 6 0 0 0-12 0" />
        <circle cx="10" cy="8" r="4" />
        <path d="M18 10a3 3 0 1 0-1.2-5.7M19 21a5 5 0 0 0-3-4.6" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      fill="none"
      focusable="false"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.8"
      viewBox="0 0 24 24"
    >
      {paths[name]}
    </svg>
  );
}

function Brand() {
  return (
    <span className={styles.brand}>
      <span aria-hidden="true" className={styles.brandMark}>
        <span />
      </span>
      <span>
        Farma<span className={styles.brandAccent}>Verse</span>
      </span>
    </span>
  );
}

export default function Home() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link aria-label="FarmaVerse, ir al inicio" href="#inicio">
          <Brand />
        </Link>

        <nav aria-label="Navegación principal" className={styles.nav}>
          <Link className={styles.navActive} href="#inicio">
            Inicio
          </Link>
          <Link href="#simulaciones">Simulaciones</Link>
          <Link href="#beneficios">Beneficios</Link>
          <Link href="#como-funciona">Cómo funciona</Link>
          <Link href="/privacidad">Privacidad</Link>
        </nav>

        <div className={styles.headerActions}>
          <Link className={styles.loginLink} href="/login">
            Iniciar sesión
          </Link>
          <Link className={styles.primaryButton} href="/login">
            Comenzar
          </Link>
        </div>
      </header>

      <section className={styles.hero} id="inicio">
        <div className={styles.sceneWrap} aria-hidden="true">
          <Image
            alt=""
            className={styles.sceneImage}
            fill
            priority
            sizes="(max-width: 940px) 100vw, 64vw"
            src="/images/farmasim/case001-scene.jpg"
          />
          <div className={styles.sceneWash} />
        </div>

        <div className={styles.heroGrid}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>
              <span className={styles.eyebrowDot} />
              APRENDE. PRACTICA. TRANSFORMA.
            </p>

            <h1 className={styles.title}>
              Simula el mundo farmacéutico.
              <span className={styles.titleAccent}>Domina tu futuro.</span>
            </h1>

            <p className={styles.lead}>
              FarmaVerse es una plataforma de simulación interactiva diseñada para
              practicar habilidades y tomar decisiones mediante experiencias
              ficticias inspiradas en situaciones del entorno farmacéutico.
            </p>

            <div className={styles.ctaRow}>
              <Link className={styles.primaryButton} href="/login">
                Comenzar ahora <span className={styles.arrow}>→</span>
              </Link>
              <Link className={styles.secondaryButton} href="#simulaciones">
                Explorar simulaciones <span className={styles.playIcon} />
              </Link>
            </div>
          </div>
        </div>

        <div className={styles.floatingCard}>
          <p className={styles.cardKicker}>Vista demo · progreso del escenario</p>
          <div className={styles.cardValueRow}>
            <div>
              <p className={styles.cardValue}>60%</p>
              <p className={styles.cardMeta}>Paso 2 de 4</p>
            </div>
            <svg
              aria-hidden="true"
              className={styles.sparkline}
              fill="none"
              viewBox="0 0 112 40"
            >
              <defs>
                <linearGradient id="spark" x1="0" x2="1">
                  <stop offset="0" stopColor="#a792ff" />
                  <stop offset="1" stopColor="#6d45f5" />
                </linearGradient>
              </defs>
              <path
                d="M3 34c10-7 12-5 20-13 8-9 12 4 21-5 8-8 13 7 22-1 9-8 13-13 21-7 8 6 12-2 22-5"
                stroke="url(#spark)"
                strokeLinecap="round"
                strokeWidth="2.2"
              />
            </svg>
          </div>
        </div>

        <div className={styles.featureBar} id="beneficios">
          {featureItems.map((item) => (
            <article className={styles.featureItem} key={item.title}>
              <div className={styles.featureIcon}>
                <FeatureIcon name={item.icon} />
              </div>
              <div>
                <h2 className={styles.featureTitle}>{item.title}</h2>
                <p className={styles.featureText}>{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.simulations} id="simulaciones">
        <p className={styles.sectionEyebrow}>EXPERIENCIAS QUE INSPIRAN</p>
        <div className={styles.sectionHeadingRow}>
          <h2 className={styles.sectionTitle}>Simulaciones destacadas</h2>
          <p className={styles.sectionDescription} id="como-funciona">
            Escenarios breves y guiados para practicar una decisión a la vez,
            recibir feedback y continuar avanzando.
          </p>
        </div>

        <div className={styles.simulationGrid}>
          {simulationCards.map((card) => (
            <article className={styles.simulationCard} key={card.number}>
              <span className={styles.simulationNumber}>{card.number}</span>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </article>
          ))}
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <Brand />
          <p>Prototipo de capacitación con contenido demostrativo.</p>
          <div className={styles.footerLinks}>
            <Link href="/privacidad">Privacidad</Link>
            <Link href="/login">Ingresar</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
