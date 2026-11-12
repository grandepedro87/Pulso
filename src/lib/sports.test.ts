import { describe, expect, it } from "vitest";
import { fieldsForSport, validateActivity, type ActivityInput } from "./sports";

const base: ActivityInput = {
  sport: "corrida",
  title: "Treino",
  description: "",
  durationMinutes: "30",
  date: "2026-01-10",
  distanceKm: "",
  sets: "",
  reps: "",
};
const today = "2026-01-15";

describe("campos por modalidade", () => {
  it("musculação pede séries e repetições, sem distância", () => {
    expect(fieldsForSport("musculacao")).toEqual(["sets", "reps"]);
  });
  it("corrida pede distância, sem séries", () => {
    expect(fieldsForSport("corrida")).toEqual(["distance"]);
  });
  it("futebol não pede distância nem séries", () => {
    expect(fieldsForSport("futebol")).toEqual([]);
  });
});

describe("validateActivity", () => {
  it("exige distância na corrida", () => {
    const r = validateActivity({ ...base, distanceKm: "" }, today);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.errors.distanceKm).toBeDefined();
  });

  it("descarta séries enviadas para corrida", () => {
    const r = validateActivity({ ...base, distanceKm: "5,5", sets: "4", reps: "10" }, today);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.payload.distance_km).toBe(5.5);
      expect(r.payload.sets).toBeNull();
      expect(r.payload.reps).toBeNull();
    }
  });

  it("descarta distância enviada para musculação", () => {
    const r = validateActivity(
      { ...base, sport: "musculacao", distanceKm: "3", sets: "4", reps: "12" },
      today,
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.payload.distance_km).toBeNull();
      expect(r.payload.sets).toBe(4);
      expect(r.payload.reps).toBe(12);
    }
  });

  it("distância é opcional em outros esportes", () => {
    const r = validateActivity({ ...base, sport: "outros" }, today);
    expect(r.ok).toBe(true);
  });

  it("rejeita data no futuro", () => {
    const r = validateActivity({ ...base, distanceKm: "5", date: "2026-02-01" }, today);
    expect(r.ok).toBe(false);
  });

  it("rejeita duração acima de 1440 minutos", () => {
    const r = validateActivity({ ...base, distanceKm: "5", durationMinutes: "1500" }, today);
    expect(r.ok).toBe(false);
  });
});
