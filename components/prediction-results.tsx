import type { Prediction } from "@/lib/predictions";

export type RequestState = "idle" | "loading" | "success" | "error";

type PredictionResultsProps = {
  predictions: Prediction[];
  requestState: RequestState;
};

export function PredictionResults({
  predictions,
  requestState,
}: PredictionResultsProps) {
  const hasPredictions = predictions.length > 0;

  return (
    <section
      className="results"
      aria-labelledby="results-title"
      aria-live="polite"
      aria-busy={requestState === "loading"}
    >
      <div className="results-heading">
        <h2 id="results-title">Results</h2>
        {requestState === "success" && hasPredictions && (
          <span>Top {predictions.length}</span>
        )}
      </div>

      {requestState === "idle" && (
        <p className="results-placeholder">
          Your likely species matches will appear here after identification.
        </p>
      )}

      {requestState === "loading" && (
        <p className="results-placeholder" role="status">
          Identifying…
        </p>
      )}

      {requestState === "success" && !hasPredictions && (
        <div className="empty-results" role="status">
          <p className="empty-results-title">No confident match found.</p>
          <p className="empty-results-help">
            Try a clearer photograph or place a tighter crop around the bird.
          </p>
        </div>
      )}

      {requestState === "success" && hasPredictions && (
        <ol
          className="prediction-list"
          aria-label={`${predictions.length} ${predictions.length === 1 ? "prediction" : "predictions"}`}
        >
          {predictions.map((prediction, index) => {
            const confidence = Math.max(
              0,
              Math.min(100, prediction.score * 100),
            );
            const displayedConfidence = confidence.toFixed(1);

            return (
              <li
                className={
                  index === 0 ? "prediction prediction-primary" : "prediction"
                }
                key={prediction.taxon_id}
              >
                <div>
                  <span className="rank" aria-hidden="true">
                    {index + 1}
                  </span>
                  <span className="species-name">
                    {prediction.species_name}
                  </span>
                </div>
                <span
                  className="confidence"
                  aria-label={`${displayedConfidence} percent confidence`}
                >
                  {displayedConfidence}%
                </span>
                <span className="confidence-track" aria-hidden="true">
                  <span style={{ width: `${confidence}%` }} />
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
