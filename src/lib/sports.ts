import {
  Bike,
  Dumbbell,
  Footprints,
  Goal,
  PersonStanding,
  Trophy,
  Volleyball,
  Waves,
  type LucideIcon,
} from "lucide-react";

export const SPORT_IDS = [
  "musculacao",
  "corrida",
  "ciclismo",
  "futebol",
  "basquete",
  "natacao",
  "calistenia",
  "outros",
] as const;

export type SportId = (typeof SPORT_IDS)[number];

export type ActivityField = "distance" | "sets" | "reps";

export interface SportConfig {
  id: SportId;
  label: string;
  icon: LucideIcon;
  fields: ActivityField[];
  /** Fields shown but optional for this sport. */
  optional?: ActivityField[];
}

export const SPORTS: Record<SportId, SportConfig> = {
  musculacao: { id: "musculacao", label: "Musculação", icon: Dumbbell, fields: ["sets", "reps"] },
  corrida: { id: "corrida", label: "Corrida", icon: Footprints, fields: ["distance"] },
  ciclismo: { id: "ciclismo", label: "Ciclismo", icon: Bike, fields: ["distance"] },
  futebol: { id: "futebol", label: "Futebol", icon: Goal, fields: [] },
  basquete: { id: "basquete", label: "Basquete", icon: Volleyball, fields: [] },
  natacao: { id: "natacao", label: "Natação", icon: Waves, fields: ["distance"] },
  calistenia: {
    id: "calistenia",
    label: "Calistenia",
    icon: PersonStanding,
    fields: ["sets", "reps"],
  },
  outros: {
    id: "outros",
    label: "Outros esportes",
    icon: Trophy,
    fields: ["distance"],
    optional: ["distance"],
  },
};

export const SPORT_LIST = SPORT_IDS.map((id) => SPORTS[id]);

export function isSportId(value: unknown): value is SportId {
  return typeof value === "string" && (SPORT_IDS as readonly string[]).includes(value);
}

export function getSport(id: string | null | undefined): SportConfig {
  return isSportId(id) ? SPORTS[id] : SPORTS.outros;
}

/** Which extra fields the activity form should show for a sport. */
export function fieldsForSport(id: SportId): ActivityField[] {
  return SPORTS[id].fields;
}

export function isFieldRequired(id: SportId, field: ActivityField): boolean {
  const cfg = SPORTS[id];
  return cfg.fields.includes(field) && !(cfg.optional ?? []).includes(field);
}

export interface ActivityInput {
  sport: SportId | "";
  title: string;
  description: string;
  durationMinutes: string;
  date: string;
  distanceKm: string;
  sets: string;
  reps: string;
}

export interface ActivityPayload {
  sport: SportId;
  title: string;
  description: string | null;
  duration_minutes: number;
  activity_date: string;
  distance_km: number | null;
  sets: number | null;
  reps: number | null;
}

export type ActivityErrors = Partial<Record<keyof ActivityInput, string>>;

function toNumber(v: string): number | null {
  const t = v.trim().replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
}

/**
 * Validates the activity form and returns a DB payload containing only the
 * fields that apply to the chosen sport (irrelevant fields are dropped).
 */
export function validateActivity(
  input: ActivityInput,
  today: string = new Date().toISOString().slice(0, 10),
): { ok: true; payload: ActivityPayload } | { ok: false; errors: ActivityErrors } {
  const errors: ActivityErrors = {};
  if (!isSportId(input.sport)) errors.sport = "Escolha uma modalidade.";

  const title = input.title.trim();
  if (!title) errors.title = "Dê um título à atividade.";
  else if (title.length > 100) errors.title = "Máximo de 100 caracteres.";

  const description = input.description.trim();
  if (description.length > 1000) errors.description = "Máximo de 1000 caracteres.";

  const duration = toNumber(input.durationMinutes);
  if (duration === null) errors.durationMinutes = "Informe a duração.";
  else if (!Number.isInteger(duration) || duration < 1 || duration > 1440)
    errors.durationMinutes = "Use minutos inteiros entre 1 e 1440.";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date)) errors.date = "Informe a data.";
  else if (input.date > today) errors.date = "A data não pode estar no futuro.";

  let distance: number | null = null;
  let sets: number | null = null;
  let reps: number | null = null;

  if (isSportId(input.sport)) {
    const sport = input.sport;
    const fields = fieldsForSport(sport);

    if (fields.includes("distance")) {
      const d = toNumber(input.distanceKm);
      if (d === null) {
        if (isFieldRequired(sport, "distance")) errors.distanceKm = "Informe a distância.";
      } else if (Number.isNaN(d) || d <= 0 || d > 1000) {
        errors.distanceKm = "Distância entre 0,01 e 1000 km.";
      } else distance = Math.round(d * 100) / 100;
    }
    if (fields.includes("sets")) {
      const s = toNumber(input.sets);
      if (s === null) errors.sets = "Informe as séries.";
      else if (!Number.isInteger(s) || s < 1 || s > 100) errors.sets = "Entre 1 e 100 séries.";
      else sets = s;
    }
    if (fields.includes("reps")) {
      const r = toNumber(input.reps);
      if (r === null) errors.reps = "Informe as repetições.";
      else if (!Number.isInteger(r) || r < 1 || r > 1000) errors.reps = "Entre 1 e 1000 repetições.";
      else reps = r;
    }
  }

  if (Object.keys(errors).length > 0) return { ok: false, errors };

  return {
    ok: true,
    payload: {
      sport: input.sport as SportId,
      title,
      description: description || null,
      duration_minutes: duration as number,
      activity_date: input.date,
      distance_km: distance,
      sets,
      reps,
    },
  };
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}min` : `${h}h`;
}

export function formatDistance(km: number): string {
  return `${km.toLocaleString("pt-BR", { maximumFractionDigits: 2 })} km`;
}
