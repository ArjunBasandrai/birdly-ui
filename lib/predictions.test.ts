import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parsePredictions, type Prediction } from "@/lib/predictions";

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
        {
          taxon_id: 6,
          common_name: "Gray Catbird",
          scientific_name: "Dumetella carolinensis",
          score: 0.01,
        },
      ]),
      null,
    );
  });

  it("rejects an invalid prediction record", () => {
    assert.equal(parsePredictions([{ common_name: "American Robin" }]), null);
  });
});
