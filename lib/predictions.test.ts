import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parsePredictions, type Prediction } from "@/lib/predictions";

const predictions: Prediction[] = [
  { species_name: "American Robin", taxon_id: 1, score: 0.742 },
  { species_name: "Varied Thrush", taxon_id: 2, score: 0.131 },
  { species_name: "Eastern Bluebird", taxon_id: 3, score: 0.064 },
  { species_name: "Hermit Thrush", taxon_id: 4, score: 0.038 },
  { species_name: "Wood Thrush", taxon_id: 5, score: 0.025 },
];

describe("parsePredictions", () => {
  for (const count of [0, 1, 2, 3, 4, 5]) {
    it(`accepts a valid response with ${count} predictions`, () => {
      const response = predictions.slice(0, count);

      assert.equal(parsePredictions(response), response);
    });
  }

  it("rejects responses with more than five predictions", () => {
    assert.equal(
      parsePredictions([
        ...predictions,
        { species_name: "Gray Catbird", taxon_id: 6, score: 0.01 },
      ]),
      null,
    );
  });

  it("rejects an invalid prediction record", () => {
    assert.equal(parsePredictions([{ species_name: "American Robin" }]), null);
  });
});
