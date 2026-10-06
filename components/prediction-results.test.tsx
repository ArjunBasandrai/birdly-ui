import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { PredictionResults } from "@/components/prediction-results";
import type { Prediction } from "@/lib/predictions";

const predictions: Prediction[] = [
  { species_name: "American Robin", taxon_id: 1, score: 0.742 },
  { species_name: "Varied Thrush", taxon_id: 2, score: 0.131 },
  { species_name: "Eastern Bluebird", taxon_id: 3, score: 0.064 },
  { species_name: "Hermit Thrush", taxon_id: 4, score: 0.038 },
  { species_name: "Wood Thrush", taxon_id: 5, score: 0.025 },
];

describe("PredictionResults", () => {
  it("renders an empty successful response as a no-match state", () => {
    const markup = renderToStaticMarkup(
      <PredictionResults predictions={[]} requestState="success" />,
    );

    assert.match(markup, /No confident match found\./);
    assert.match(
      markup,
      /Try a clearer photograph or place a tighter crop around the bird\./,
    );
    assert.match(markup, /role="status"/);
    assert.doesNotMatch(markup, /Top 0/);
    assert.doesNotMatch(markup, /prediction-list/);
  });

  for (const count of [1, 2, 3, 4, 5]) {
    it(`renders exactly ${count} returned predictions`, () => {
      const returnedPredictions = predictions.slice(0, count);
      const markup = renderToStaticMarkup(
        <PredictionResults
          predictions={returnedPredictions}
          requestState="success"
        />,
      );

      assert.equal(
        (markup.match(/<li class="prediction/g) ?? []).length,
        count,
      );
      assert.match(markup, new RegExp(`Top ${count}`));
      assert.ok(
        markup.includes(
          `aria-label="${count} ${count === 1 ? "prediction" : "predictions"}"`,
        ),
      );
      assert.equal((markup.match(/prediction-primary/g) ?? []).length, 1);

      for (const prediction of returnedPredictions) {
        assert.ok(markup.includes(prediction.species_name));
        assert.ok(
          markup.includes(
            `${(prediction.score * 100).toFixed(1)} percent confidence`,
          ),
        );
      }

      for (const prediction of predictions.slice(count)) {
        assert.ok(!markup.includes(prediction.species_name));
      }
    });
  }

  it("keeps confidence text and its accessible label consistent", () => {
    const markup = renderToStaticMarkup(
      <PredictionResults
        predictions={predictions.slice(0, 1)}
        requestState="success"
      />,
    );

    assert.match(markup, /aria-label="74\.2 percent confidence"/);
    assert.match(markup, /74\.2%/);
  });

  it("does not describe the idle state as a fixed-length result", () => {
    const markup = renderToStaticMarkup(
      <PredictionResults predictions={[]} requestState="idle" />,
    );

    assert.match(
      markup,
      /Your likely species matches will appear here after identification\./,
    );
    assert.doesNotMatch(markup, /five/);
  });
});
