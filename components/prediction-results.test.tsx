import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";

import { PredictionResults } from "@/components/prediction-results";
import type { Prediction } from "@/lib/predictions";

const predictions: Prediction[] = [
  {
    taxon_id: 1,
    common_name: "American Robin",
    scientific_name: "Turdus migratorius",
    score: 0.742,
  },
  {
    taxon_id: 2,
    common_name: "Varied Thrush",
    scientific_name: "Ixoreus naevius",
    score: 0.131,
  },
  {
    taxon_id: 3,
    common_name: "Eastern Bluebird",
    scientific_name: "Sialia sialis",
    score: 0.064,
  },
  {
    taxon_id: 4,
    common_name: "Hermit Thrush",
    scientific_name: "Catharus guttatus",
    score: 0.038,
  },
  {
    taxon_id: 5,
    common_name: "Wood Thrush",
    scientific_name: "Hylocichla mustelina",
    score: 0.025,
  },
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
        assert.ok(markup.includes(prediction.common_name));
        assert.ok(markup.includes(prediction.scientific_name));
        assert.ok(
          markup.includes(
            `${(prediction.score * 100).toFixed(1)} percent confidence`,
          ),
        );
      }

      for (const prediction of predictions.slice(count)) {
        assert.ok(!markup.includes(prediction.common_name));
        assert.ok(!markup.includes(prediction.scientific_name));
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

  it("shows the common name above the scientific name", () => {
    const markup = renderToStaticMarkup(
      <PredictionResults
        predictions={predictions.slice(0, 1)}
        requestState="success"
      />,
    );

    assert.match(markup, /class="species-name">American Robin</);
    assert.match(markup, /class="scientific-name">Turdus migratorius<\/span>/);
    assert.ok(
      markup.indexOf("American Robin") < markup.indexOf("Turdus migratorius"),
    );
  });

  it("does not repeat a fallback name", () => {
    const fallbackName = "Poecile atricapillus";
    const markup = renderToStaticMarkup(
      <PredictionResults
        predictions={[
          {
            taxon_id: 6,
            common_name: fallbackName,
            scientific_name: fallbackName,
            score: 0.91,
          },
        ]}
        requestState="success"
      />,
    );

    assert.equal(markup.split(fallbackName).length - 1, 1);
    assert.doesNotMatch(markup, /scientific-name/);
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
