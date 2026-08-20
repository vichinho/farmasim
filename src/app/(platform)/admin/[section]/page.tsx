import { notFound } from "next/navigation";

import { AdminModulePage } from "@/features/admin/admin-module-page";

type Props = { params: Promise<{ section: string }> };

type ModuleDefinition = {
  description: string;
  eyebrow: string;
  nextSteps: string[];
  title: string;
};

const modules: Record<string, ModuleDefinition> = {
  usuarios: {
    eyebrow: "Gestión de personas",
    title: "Usuarios",
    description: "Administración global de TENS, supervisores y administradores, manteniendo separados los roles de cuenta de los roles operativos TENS 1/TENS 2.",
    nextSteps: ["Listado global con búsqueda y filtros por rol.", "Estado de capacitación y establecimiento principal.", "Creación, activación y desactivación controlada de cuentas."],
  },
  establecimientos: {
    eyebrow: "Organización",
    title: "Establecimientos",
    description: "Vista central de la red asistencial y sus membresías para administrar el alcance organizacional de FarmaVerse.",
    nextSteps: ["Ficha por establecimiento y estado activo.", "Supervisores y TENS vinculados.", "Indicadores de actividad y capacitación por centro."],
  },
  escenarios: {
    eyebrow: "Capacitación",
    title: "Escenarios",
    description: "Centro administrativo para el catálogo de simulaciones y la futura incorporación progresiva del banco de 48 escenarios.",
    nextSteps: ["Catálogo por competencia, modo y dificultad.", "Estado borrador / activo / archivado.", "Validación estructural antes de publicar un escenario."],
  },
  capsulas: {
    eyebrow: "Contenido educativo",
    title: "Cápsulas",
    description: "Supervisión global de cápsulas educativas, estados de publicación y distribución por establecimiento.",
    nextSteps: ["Listado global y filtros por estado/establecimiento.", "Revisión de autoría, publicación y versión.", "Trazabilidad de asignaciones y finalización."],
  },
  analitica: {
    eyebrow: "Inteligencia",
    title: "Analítica",
    description: "Indicadores consolidados para comprender uso, avance y desempeño de capacitación a nivel global.",
    nextSteps: ["Actividad por periodo y establecimiento.", "Competencias dominadas, en progreso y en refuerzo.", "Alertas interceptadas y tendencias del entrenamiento."],
  },
  auditoria: {
    eyebrow: "Gobernanza",
    title: "Auditoría",
    description: "Trazabilidad administrativa para revisar acciones relevantes sin mezclar estos datos con incidentes clínicos reales.",
    nextSteps: ["Registro cronológico de acciones administrativas.", "Filtros por actor, establecimiento y tipo de acción.", "Detalle de cambios en cápsulas y asignaciones."],
  },
  configuracion: {
    eyebrow: "Sistema",
    title: "Configuración",
    description: "Preferencias administrativas globales y parámetros futuros de la plataforma, separadas de la operación diaria.",
    nextSteps: ["Parámetros de capacitación y experiencia.", "Políticas administrativas visibles para el equipo.", "Estado de integraciones y configuración general."],
  },
};

export default async function AdminSectionPage({ params }: Props) {
  const { section } = await params;
  const moduleDefinition = modules[section];
  if (!moduleDefinition) notFound();

  return <AdminModulePage {...moduleDefinition} />;
}
