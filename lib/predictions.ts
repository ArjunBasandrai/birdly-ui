export const MAXIMUM_PREDICTIONS = 5;

export type Prediction = {
  taxon_id: number;
  common_name: string;
  scientific_name: string;
  score: number;
};

function isPrediction(value: unknown): value is Prediction {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const prediction = value as Partial<Prediction>;
  return (
    typeof prediction.taxon_id === "number" &&
    typeof prediction.common_name === "string" &&
    typeof prediction.scientific_name === "string" &&
    typeof prediction.score === "number" &&
    Number.isFinite(prediction.score)
  );
}

export function parsePredictions(value: unknown): Prediction[] | null {
  if (
    !Array.isArray(value) ||
    value.length > MAXIMUM_PREDICTIONS ||
    !value.every(isPrediction)
  ) {
    return null;
  }

  return value;
}
