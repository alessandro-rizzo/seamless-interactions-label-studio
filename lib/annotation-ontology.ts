/**
 * Annotation Ontology v1.1
 *
 * Closed coding system for behavioral signal annotation.
 * This ontology defines 11 facets with 98 total signals for annotating
 * multimodal interaction behaviors.
 */

export interface Signal {
  id: string;
  label: string;
  description: string;
}

export interface Facet {
  id: string;
  label: string;
  description: string;
  signals: Signal[];
}

/**
 * Complete annotation ontology with all facets and signals
 */
export const ANNOTATION_ONTOLOGY: Record<string, Facet> = {
  prosody: {
    id: "prosody",
    label: "Prosody",
    description:
      "Acoustic characteristics of speech independent of word choice.",
    signals: [
      {
        id: "low_pitch_variance",
        label: "Low pitch variance",
        description:
          "Pitch remains within a narrow frequency range across a turn.",
      },
      {
        id: "high_pitch_variance",
        label: "High pitch variance",
        description:
          "Noticeable pitch modulation within a turn, including rises and falls.",
      },
      {
        id: "rising_terminal",
        label: "Rising terminal",
        description: "Utterance ends with an upward pitch movement.",
      },
      {
        id: "falling_terminal",
        label: "Falling terminal",
        description: "Utterance ends with a downward pitch movement.",
      },
      {
        id: "flat_intonation",
        label: "Flat intonation",
        description:
          "Minimal pitch movement across the utterance, including terminal position.",
      },
      {
        id: "speech_rate_fast",
        label: "Speech rate fast",
        description:
          "Words produced at a higher-than-baseline tempo for the speaker.",
      },
      {
        id: "speech_rate_slow",
        label: "Speech rate slow",
        description:
          "Words produced at a lower-than-baseline tempo for the speaker.",
      },
      {
        id: "clipped_phrasing",
        label: "Clipped phrasing",
        description: "Syllables or words shortened or cut off abruptly.",
      },
      {
        id: "elongated_vowels",
        label: "Elongated vowels",
        description: "Vowel sounds audibly extended beyond typical duration.",
      },
      {
        id: "volume_increase",
        label: "Volume increase",
        description: "Audible rise in loudness within or across turns.",
      },
      {
        id: "volume_decrease",
        label: "Volume decrease",
        description: "Audible reduction in loudness within or across turns.",
      },
      {
        id: "creaky_voice",
        label: "Creaky voice",
        description:
          "Low-frequency, irregular vocal fold vibration (vocal fry).",
      },
      {
        id: "breathy_voice",
        label: "Breathy voice",
        description: "Audible airflow accompanying phonation.",
      },
    ],
  },
  lexical_choice: {
    id: "lexical_choice",
    label: "Lexical Choice",
    description: "Patterns in word and phrase selection.",
    signals: [
      {
        id: "hedging_terms",
        label: "Hedging terms",
        description:
          'Use of words that soften commitment (e.g. "maybe", "kind of").',
      },
      {
        id: "certainty_terms",
        label: "Certainty terms",
        description:
          'Use of words expressing confidence or finality (e.g. "definitely", "clearly").',
      },
      {
        id: "intensifiers",
        label: "Intensifiers",
        description: 'Words amplifying emphasis (e.g. "very", "extremely").',
      },
      {
        id: "mitigators",
        label: "Mitigators",
        description:
          'Words reducing force or imposition (e.g. "just", "a bit").',
      },
      {
        id: "self_references",
        label: "Self-references",
        description: 'First-person references (e.g. "I", "me", "my").',
      },
      {
        id: "other_references",
        label: "Other-references",
        description: 'References to interlocutor(s) (e.g. "you", "they").',
      },
      {
        id: "abstract_language",
        label: "Abstract language",
        description:
          "Use of generalized or conceptual terms rather than concrete entities.",
      },
      {
        id: "concrete_language",
        label: "Concrete language",
        description: "Use of specific, tangible, or directly referable terms.",
      },
      {
        id: "modal_verbs",
        label: "Modal verbs",
        description:
          'Use of modals expressing possibility, obligation, or ability (e.g. "might", "should").',
      },
      {
        id: "politeness_markers",
        label: "Politeness markers",
        description: 'Use of politeness forms (e.g. "please", "thank you").',
      },
      {
        id: "informal_register",
        label: "Informal register",
        description: "Colloquial vocabulary or contractions.",
      },
      {
        id: "formal_register",
        label: "Formal register",
        description: "Structured or institutional vocabulary and syntax.",
      },
    ],
  },
  turn_taking: {
    id: "turn_taking",
    label: "Turn Taking",
    description: "How conversational floor access is managed.",
    signals: [
      {
        id: "interruptions",
        label: "Interruptions",
        description:
          "Speaker begins while another speaker is mid-turn, cutting them off.",
      },
      {
        id: "overlaps",
        label: "Overlaps",
        description: "Simultaneous speech without clear interruption intent.",
      },
      {
        id: "rapid_backchannels",
        label: "Rapid backchannels",
        description:
          "Short acknowledgements produced quickly after or during turns.",
      },
      {
        id: "delayed_backchannels",
        label: "Delayed backchannels",
        description: "Acknowledgements produced after a noticeable delay.",
      },
      {
        id: "long_turns",
        label: "Long turns",
        description:
          "Turns significantly longer than interlocutor's or speaker's baseline.",
      },
      {
        id: "short_turns",
        label: "Short turns",
        description: "Turns noticeably brief or minimal.",
      },
      {
        id: "floor_holding",
        label: "Floor holding",
        description:
          "Behaviours preventing turn transfer (e.g. continued speech, fillers).",
      },
      {
        id: "floor_yielding",
        label: "Floor yielding",
        description: "Clear cues inviting the other speaker to take the floor.",
      },
      {
        id: "competitive_entry",
        label: "Competitive entry",
        description:
          "Entering the floor at transition-relevant points with assertive timing.",
      },
      {
        id: "smooth_transition",
        label: "Smooth transition",
        description: "Turn exchanges without overlap, interruption, or delay.",
      },
    ],
  },
  gaze: {
    id: "gaze",
    label: "Gaze",
    description: "Eye direction and movement relative to interlocutors.",
    signals: [
      {
        id: "direct_gaze",
        label: "Direct gaze",
        description: "Eyes oriented toward interlocutor's face.",
      },
      {
        id: "gaze_aversion",
        label: "Gaze aversion",
        description: "Eyes oriented away from interlocutor during interaction.",
      },
      {
        id: "gaze_shift_frequency_high",
        label: "Gaze shift frequency high",
        description: "Frequent changes in gaze direction within a short time.",
      },
      {
        id: "gaze_shift_frequency_low",
        label: "Gaze shift frequency low",
        description: "Sustained gaze direction with few shifts.",
      },
      {
        id: "downward_gaze",
        label: "Downward gaze",
        description: "Eyes oriented downward relative to head position.",
      },
      {
        id: "side_glance",
        label: "Side glance",
        description: "Brief lateral gaze movement without head turn.",
      },
      {
        id: "gaze_following",
        label: "Gaze following",
        description: "Gaze tracks another speaker's movement or focus.",
      },
      {
        id: "gaze_fixation",
        label: "Gaze fixation",
        description: "Prolonged gaze on a single point or target.",
      },
    ],
  },
  facial_expression: {
    id: "facial_expression",
    label: "Facial Expression",
    description: "Visible facial muscle movements, without inferred emotion.",
    signals: [
      {
        id: "smile",
        label: "Smile",
        description: "Sustained upward movement of lip corners.",
      },
      {
        id: "micro_smile",
        label: "Micro-smile",
        description: "Brief, subtle lip corner elevation.",
      },
      {
        id: "brow_raise",
        label: "Brow raise",
        description: "Upward movement of eyebrows.",
      },
      {
        id: "brow_furrow",
        label: "Brow furrow",
        description: "Inward or downward movement of eyebrows.",
      },
      {
        id: "jaw_tension",
        label: "Jaw tension",
        description: "Visible tightening or clenching of jaw muscles.",
      },
      {
        id: "lip_press",
        label: "Lip press",
        description: "Lips pressed firmly together.",
      },
      {
        id: "lip_purse",
        label: "Lip purse",
        description: "Lips drawn inward or forward.",
      },
      {
        id: "asymmetrical_expression",
        label: "Asymmetrical expression",
        description: "Uneven facial movement across sides.",
      },
      {
        id: "neutral_face",
        label: "Neutral face",
        description: "Minimal facial muscle movement.",
      },
      {
        id: "expression_freeze",
        label: "Expression freeze",
        description: "Facial expression held unusually still across time.",
      },
    ],
  },
  gesture: {
    id: "gesture",
    label: "Gesture",
    description: "Hand and arm movements accompanying interaction.",
    signals: [
      {
        id: "expansive_gesture",
        label: "Expansive gesture",
        description: "Broad movements extending away from the body.",
      },
      {
        id: "restricted_gesture",
        label: "Restricted gesture",
        description: "Small or minimal hand movements close to the body.",
      },
      {
        id: "illustrative_gesture",
        label: "Illustrative gesture",
        description: "Movements that visually depict speech content.",
      },
      {
        id: "beat_gesture",
        label: "Beat gesture",
        description: "Rhythmic movements aligned with speech timing.",
      },
      {
        id: "self_touch",
        label: "Self-touch",
        description: "Hands contacting one's own body.",
      },
      {
        id: "object_manipulation",
        label: "Object manipulation",
        description: "Handling or fidgeting with objects.",
      },
      {
        id: "gesture_synchrony_high",
        label: "Gesture synchrony high",
        description: "Gestures closely aligned with speech rhythm.",
      },
      {
        id: "gesture_synchrony_low",
        label: "Gesture synchrony low",
        description: "Gestures weakly or inconsistently aligned with speech.",
      },
      {
        id: "mirroring",
        label: "Mirroring",
        description: "Gesture patterns resembling interlocutor's gestures.",
      },
    ],
  },
  posture: {
    id: "posture",
    label: "Posture",
    description: "Whole-body orientation and stability.",
    signals: [
      {
        id: "forward_lean",
        label: "Forward lean",
        description: "Upper body inclined toward interlocutor.",
      },
      {
        id: "backward_lean",
        label: "Backward lean",
        description: "Upper body inclined away from interlocutor.",
      },
      {
        id: "upright_posture",
        label: "Upright posture",
        description: "Spine aligned vertically with minimal slouch.",
      },
      {
        id: "collapsed_posture",
        label: "Collapsed posture",
        description: "Slouched or compressed torso position.",
      },
      {
        id: "postural_shift_frequency_high",
        label: "Postural shift frequency high",
        description: "Frequent changes in body position.",
      },
      {
        id: "postural_shift_frequency_low",
        label: "Postural shift frequency low",
        description: "Sustained body position with minimal movement.",
      },
      {
        id: "body_orientation_direct",
        label: "Body orientation direct",
        description: "Torso facing interlocutor.",
      },
      {
        id: "body_orientation_angled",
        label: "Body orientation angled",
        description: "Torso oriented partially away.",
      },
      {
        id: "stillness",
        label: "Stillness",
        description: "Minimal whole-body movement across time.",
      },
    ],
  },
  affect_regulation: {
    id: "affect_regulation",
    label: "Affect Regulation",
    description: "Behaviours that modulate or constrain expressive output.",
    signals: [
      {
        id: "self_soothing_touch",
        label: "Self-soothing touch",
        description: "Repetitive touch actions (e.g. rubbing hands, neck).",
      },
      {
        id: "suppressed_expression",
        label: "Suppressed expression",
        description: "Visible inhibition of facial or vocal expression.",
      },
      {
        id: "forced_smile",
        label: "Forced smile",
        description: "Smile not accompanied by other facial movements.",
      },
      {
        id: "affect_dampening",
        label: "Affect dampening",
        description: "Reduction in expressive intensity over time.",
      },
      {
        id: "affect_amplification",
        label: "Affect amplification",
        description: "Increase in expressive intensity over time.",
      },
      {
        id: "respiratory_control_visible",
        label: "Respiratory control visible",
        description:
          "Audible or visible breath control (e.g. sighs, breath holds).",
      },
      {
        id: "tension_release",
        label: "Tension release",
        description: "Visible relaxation following sustained tension.",
      },
    ],
  },
  interactional_role: {
    id: "interactional_role",
    label: "Interactional Role",
    description: "Behavioural positioning within conversational structure.",
    signals: [
      {
        id: "initiative_taking",
        label: "Initiative taking",
        description: "Initiating topics or actions without prompt.",
      },
      {
        id: "responsive_following",
        label: "Responsive following",
        description: "Primarily responding rather than initiating.",
      },
      {
        id: "topic_introduction",
        label: "Topic introduction",
        description: "Introducing new subject matter.",
      },
      {
        id: "topic_maintenance",
        label: "Topic maintenance",
        description: "Sustaining or elaborating current topic.",
      },
      {
        id: "topic_shift",
        label: "Topic shift",
        description: "Redirecting conversation to a new topic.",
      },
      {
        id: "alignment_behavior",
        label: "Alignment behavior",
        description: "Behaviours matching interlocutor's framing or stance.",
      },
      {
        id: "counter_alignment",
        label: "Counter-alignment",
        description: "Behaviours diverging from interlocutor's framing.",
      },
    ],
  },
  timing_latency: {
    id: "timing_latency",
    label: "Timing & Latency",
    description: "Temporal characteristics of response timing.",
    signals: [
      {
        id: "response_latency_short",
        label: "Response latency short",
        description: "Minimal delay between turn completion and response.",
      },
      {
        id: "response_latency_long",
        label: "Response latency long",
        description: "Noticeable pause before responding.",
      },
      {
        id: "latency_variability_high",
        label: "Latency variability high",
        description: "Inconsistent response timing across turns.",
      },
      {
        id: "latency_variability_low",
        label: "Latency variability low",
        description: "Consistent response timing across turns.",
      },
      {
        id: "pause_before_response",
        label: "Pause before response",
        description: "Silent pause preceding speech onset.",
      },
      {
        id: "pause_mid_turn",
        label: "Pause mid-turn",
        description: "Silent pause occurring within a turn.",
      },
    ],
  },
  repair_behavior: {
    id: "repair_behavior",
    label: "Repair Behavior",
    description: "Corrections or restarts during interaction.",
    signals: [
      {
        id: "self_correction",
        label: "Self-correction",
        description: "Speaker revises their own speech content.",
      },
      {
        id: "false_start",
        label: "False start",
        description: "Abandoned utterance before completion.",
      },
      {
        id: "rephrasing",
        label: "Rephrasing",
        description: "Same idea restated with different wording.",
      },
      {
        id: "filled_pause",
        label: "Filled pause",
        description: 'Vocal fillers (e.g. "um", "uh").',
      },
      {
        id: "unfilled_pause",
        label: "Unfilled pause",
        description: "Silent gap without vocalisation.",
      },
      {
        id: "backtracking",
        label: "Backtracking",
        description: "Returning to earlier conversational point.",
      },
      {
        id: "clarification_request",
        label: "Clarification request",
        description: "Explicit request for clarification.",
      },
    ],
  },
};

/**
 * Helper function to get a facet by ID
 */
export function getFacetById(id: string): Facet | undefined {
  return ANNOTATION_ONTOLOGY[id];
}

/**
 * Helper function to get all facets as an array
 */
export function getAllFacets(): Facet[] {
  return Object.values(ANNOTATION_ONTOLOGY);
}

/**
 * Helper function to get all signals for a specific facet
 */
export function getSignalsByFacet(facetId: string): Signal[] {
  const facet = getFacetById(facetId);
  return facet ? facet.signals : [];
}

/**
 * Helper function to get all facet IDs
 */
export function getAllFacetIds(): string[] {
  return Object.keys(ANNOTATION_ONTOLOGY);
}

/**
 * Helper function to get the total signal count
 */
export function getTotalSignalCount(): number {
  return getAllFacets().reduce(
    (total, facet) => total + facet.signals.length,
    0,
  );
}
