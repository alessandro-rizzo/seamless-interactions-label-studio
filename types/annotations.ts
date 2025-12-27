/**
 * TypeScript type definitions for category annotations
 */

/**
 * Category annotation data structure for API payloads
 * Contains selected signal IDs for each of the 11 facets
 */
export interface CategoryAnnotations {
  prosody: string[];
  lexical_choice: string[];
  turn_taking: string[];
  gaze: string[];
  facial_expression: string[];
  gesture: string[];
  posture: string[];
  affect_regulation: string[];
  interactional_role: string[];
  timing_latency: string[];
  repair_behavior: string[];
}

/**
 * Extended annotation payload for API requests
 * Includes all existing fields plus optional category annotations
 */
export interface AnnotationPayload {
  videoId: string;
  vendorId: number;
  sessionId: number;
  interactionId: number;
  speaker1Id: string;
  speaker2Id: string;
  speaker1Label: string;
  speaker2Label: string;
  speaker1Confidence: number;
  speaker2Confidence: number;
  speaker1Comments: string;
  speaker2Comments: string;
  speaker1Categories?: CategoryAnnotations;
  speaker2Categories?: CategoryAnnotations;
  labelingTimeMs: number;
}

/**
 * Helper type for form state management
 * Maps facet IDs to arrays of selected signal IDs
 */
export type CategoryState = Record<string, string[]>;

/**
 * Helper function to create empty category annotations
 */
export function createEmptyCategoryAnnotations(): CategoryAnnotations {
  return {
    prosody: [],
    lexical_choice: [],
    turn_taking: [],
    gaze: [],
    facial_expression: [],
    gesture: [],
    posture: [],
    affect_regulation: [],
    interactional_role: [],
    timing_latency: [],
    repair_behavior: [],
  };
}

/**
 * Helper function to check if category annotations are empty
 */
export function isCategoryAnnotationsEmpty(
  categories?: CategoryAnnotations,
): boolean {
  if (!categories) return true;

  return Object.values(categories).every((signals) => signals.length === 0);
}

/**
 * Helper function to get count of selected signals across all facets
 */
export function getSelectedSignalCount(
  categories?: CategoryAnnotations,
): number {
  if (!categories) return 0;

  return Object.values(categories).reduce(
    (total, signals) => total + signals.length,
    0,
  );
}
