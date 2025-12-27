import {
  ANNOTATION_ONTOLOGY,
  getFacetById,
  getAllFacets,
  getSignalsByFacet,
  getAllFacetIds,
  getTotalSignalCount,
  type Facet,
  type Signal,
} from "./annotation-ontology";

describe("Annotation Ontology", () => {
  describe("Structure validation", () => {
    it("should have exactly 11 facets", () => {
      const facets = getAllFacets();
      expect(facets).toHaveLength(11);
    });

    it("should have expected facet IDs", () => {
      const expectedFacetIds = [
        "prosody",
        "lexical_choice",
        "turn_taking",
        "gaze",
        "facial_expression",
        "gesture",
        "posture",
        "affect_regulation",
        "interactional_role",
        "timing_latency",
        "repair_behavior",
      ];

      const actualFacetIds = getAllFacetIds();
      expect(actualFacetIds.sort()).toEqual(expectedFacetIds.sort());
    });

    it("should have 98 total signals", () => {
      const totalSignals = getTotalSignalCount();
      expect(totalSignals).toBe(98);
    });

    it("should have correct signal counts per facet", () => {
      const expectedSignalCounts: Record<string, number> = {
        prosody: 13,
        lexical_choice: 12,
        turn_taking: 10,
        gaze: 8,
        facial_expression: 10,
        gesture: 9,
        posture: 9,
        affect_regulation: 7,
        interactional_role: 7,
        timing_latency: 6,
        repair_behavior: 7,
      };

      Object.entries(expectedSignalCounts).forEach(
        ([facetId, expectedCount]) => {
          const signals = getSignalsByFacet(facetId);
          expect(signals).toHaveLength(expectedCount);
        },
      );
    });
  });

  describe("Data integrity", () => {
    it("should have all facets with required properties", () => {
      const facets = getAllFacets();

      facets.forEach((facet) => {
        expect(facet).toHaveProperty("id");
        expect(facet).toHaveProperty("label");
        expect(facet).toHaveProperty("description");
        expect(facet).toHaveProperty("signals");

        expect(typeof facet.id).toBe("string");
        expect(typeof facet.label).toBe("string");
        expect(typeof facet.description).toBe("string");
        expect(Array.isArray(facet.signals)).toBe(true);

        expect(facet.id.length).toBeGreaterThan(0);
        expect(facet.label.length).toBeGreaterThan(0);
        expect(facet.description.length).toBeGreaterThan(0);
        expect(facet.signals.length).toBeGreaterThan(0);
      });
    });

    it("should have all signals with required properties", () => {
      const facets = getAllFacets();

      facets.forEach((facet) => {
        facet.signals.forEach((signal) => {
          expect(signal).toHaveProperty("id");
          expect(signal).toHaveProperty("label");
          expect(signal).toHaveProperty("description");

          expect(typeof signal.id).toBe("string");
          expect(typeof signal.label).toBe("string");
          expect(typeof signal.description).toBe("string");

          expect(signal.id.length).toBeGreaterThan(0);
          expect(signal.label.length).toBeGreaterThan(0);
          expect(signal.description.length).toBeGreaterThan(0);
        });
      });
    });

    it("should have unique signal IDs within each facet", () => {
      const facets = getAllFacets();

      facets.forEach((facet) => {
        const signalIds = facet.signals.map((s) => s.id);
        const uniqueSignalIds = new Set(signalIds);
        expect(uniqueSignalIds.size).toBe(signalIds.length);
      });
    });

    it("should have unique facet IDs", () => {
      const facetIds = getAllFacetIds();
      const uniqueFacetIds = new Set(facetIds);
      expect(uniqueFacetIds.size).toBe(facetIds.length);
    });
  });

  describe("Helper functions", () => {
    describe("getFacetById", () => {
      it("should return facet for valid ID", () => {
        const facet = getFacetById("prosody");
        expect(facet).toBeDefined();
        expect(facet?.id).toBe("prosody");
        expect(facet?.label).toBe("Prosody");
      });

      it("should return undefined for invalid ID", () => {
        const facet = getFacetById("invalid_facet");
        expect(facet).toBeUndefined();
      });
    });

    describe("getAllFacets", () => {
      it("should return array of all facets", () => {
        const facets = getAllFacets();
        expect(Array.isArray(facets)).toBe(true);
        expect(facets.length).toBe(11);
        expect(facets[0]).toHaveProperty("id");
        expect(facets[0]).toHaveProperty("signals");
      });
    });

    describe("getSignalsByFacet", () => {
      it("should return signals for valid facet ID", () => {
        const signals = getSignalsByFacet("prosody");
        expect(Array.isArray(signals)).toBe(true);
        expect(signals.length).toBe(13);
        expect(signals[0]).toHaveProperty("id");
        expect(signals[0]).toHaveProperty("label");
      });

      it("should return empty array for invalid facet ID", () => {
        const signals = getSignalsByFacet("invalid_facet");
        expect(Array.isArray(signals)).toBe(true);
        expect(signals.length).toBe(0);
      });
    });

    describe("getAllFacetIds", () => {
      it("should return array of all facet IDs", () => {
        const facetIds = getAllFacetIds();
        expect(Array.isArray(facetIds)).toBe(true);
        expect(facetIds.length).toBe(11);
        expect(facetIds).toContain("prosody");
        expect(facetIds).toContain("lexical_choice");
      });
    });

    describe("getTotalSignalCount", () => {
      it("should return correct total signal count", () => {
        const total = getTotalSignalCount();
        expect(total).toBe(98);
      });
    });
  });

  describe("Specific facet validation", () => {
    it("should have prosody facet with 13 signals", () => {
      const facet = getFacetById("prosody");
      expect(facet).toBeDefined();
      expect(facet?.signals.length).toBe(13);
      expect(facet?.description).toContain(
        "Acoustic characteristics of speech",
      );
    });

    it("should have lexical_choice facet with 12 signals", () => {
      const facet = getFacetById("lexical_choice");
      expect(facet).toBeDefined();
      expect(facet?.signals.length).toBe(12);
      expect(facet?.description).toContain("word and phrase selection");
    });

    it("should have turn_taking facet with 10 signals", () => {
      const facet = getFacetById("turn_taking");
      expect(facet).toBeDefined();
      expect(facet?.signals.length).toBe(10);
      expect(facet?.description).toContain("conversational floor access");
    });

    it("should have gaze facet with 8 signals", () => {
      const facet = getFacetById("gaze");
      expect(facet).toBeDefined();
      expect(facet?.signals.length).toBe(8);
      expect(facet?.description).toContain("Eye direction");
    });

    it("should have facial_expression facet with 10 signals", () => {
      const facet = getFacetById("facial_expression");
      expect(facet).toBeDefined();
      expect(facet?.signals.length).toBe(10);
      expect(facet?.description).toContain("facial muscle movements");
    });

    it("should have gesture facet with 9 signals", () => {
      const facet = getFacetById("gesture");
      expect(facet).toBeDefined();
      expect(facet?.signals.length).toBe(9);
      expect(facet?.description).toContain("Hand and arm movements");
    });

    it("should have posture facet with 9 signals", () => {
      const facet = getFacetById("posture");
      expect(facet).toBeDefined();
      expect(facet?.signals.length).toBe(9);
      expect(facet?.description).toContain("Whole-body orientation");
    });

    it("should have affect_regulation facet with 7 signals", () => {
      const facet = getFacetById("affect_regulation");
      expect(facet).toBeDefined();
      expect(facet?.signals.length).toBe(7);
      expect(facet?.description).toContain("modulate or constrain");
    });

    it("should have interactional_role facet with 7 signals", () => {
      const facet = getFacetById("interactional_role");
      expect(facet).toBeDefined();
      expect(facet?.signals.length).toBe(7);
      expect(facet?.description).toContain("conversational structure");
    });

    it("should have timing_latency facet with 6 signals", () => {
      const facet = getFacetById("timing_latency");
      expect(facet).toBeDefined();
      expect(facet?.signals.length).toBe(6);
      expect(facet?.description).toContain("Temporal characteristics");
    });

    it("should have repair_behavior facet with 7 signals", () => {
      const facet = getFacetById("repair_behavior");
      expect(facet).toBeDefined();
      expect(facet?.signals.length).toBe(7);
      expect(facet?.description).toContain("Corrections or restarts");
    });
  });
});
