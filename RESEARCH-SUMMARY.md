# Seamless Interactions Annotation System: Research Summary

## 1. Overview

This document describes the annotation system and data structure for behavioral coding of dyadic face-to-face interactions from the **Seamless Interaction Dataset**. The annotated data is designed for training binary classifiers to detect specific behavioral signals across 11 conversational facets.

### 1.1 Source Dataset

**Seamless Interaction Dataset** (Meta AI Research, 2024-2025)

- 4,000+ hours of face-to-face interaction footage
- 4,000+ participants in diverse contexts
- Two primary categories:
  - **Improvised**: Scenario-based interactions with professional actors
  - **Naturalistic**: Prompted conversations between non-actors
- Multimodal data: Audio (.wav), video (.mp4), motion features (.npz), metadata (.json)

**File Naming Convention**: `V{vendor}_S{session}_I{interaction}_P{participant}`

- Example: `V00_S0644_I00000129_P0799`
- Each interaction has two participants (participant pair)
- Vendor ID indicates data collection site
- Session and interaction IDs group related recordings

### 1.2 Annotation Task

Human annotators label **predefined behavioral signals** observed in each speaker during dyadic interactions. The annotation follows a **closed coding** approach with a structured ontology of 98 distinct behavioral signals organized into 11 facets of conversational behavior.

---

## 2. Annotation System Architecture

### 2.1 Web-Based Labeling Tool

Custom Next.js application with:

- **Synchronized dual-video player**: Side-by-side viewing of both speakers
- **Morph label assignment**: Primary classification (Morph A vs Morph B)
- **Confidence rating**: 5-point scale per speaker
- **Category annotation interface**: Multi-select dropdowns for 11 behavioral facets
- **Grounded theory memos**: Free-text observations per speaker
- **User authentication**: Google OAuth with session tracking

### 2.2 Annotation Workflow

1. **Video Selection**: Annotator selects an unannotated interaction from the video list
2. **Video Review**: Watches both speakers simultaneously with playback controls
3. **Morph Labeling**: Assigns primary category (Morph A or Morph B) to each speaker
4. **Confidence Rating**: Rates confidence in morph assignment (1-5 scale)
5. **Behavioral Coding**: Selects observed signals from 11 facets (multi-select per facet)
6. **Qualitative Notes**: Adds grounded theory memos with contextual observations
7. **Session Extrapolation** (Optional): Applies morph labels to all unlabeled videos in the same session
8. **Submission**: Saves annotation with automatic timestamping and user tracking

**Data Integrity Features**:

- Form validation (both speakers must be labeled)
- Automatic timing tracking (milliseconds spent labeling)
- Edit/delete capabilities for annotation revision
- User-specific annotation history
- Annotation type tracking (manual vs. extrapolated)

### 2.3 Annotation Types

The system distinguishes between two types of annotations:

**Manual Annotations**:
- Annotator watched the video and labeled it directly
- Contains timing data (`labelingTimeMs > 0`)
- Can include behavioral signals and qualitative memos
- Marked with green badge in UI

**Extrapolated Annotations**:
- System inferred labels from another video in the same session
- No timing data (`labelingTimeMs = 0`)
- Contains only morph labels and confidence scores (no behavioral signals or comments)
- Marked with blue badge in UI
- Created via session-wide extrapolation feature

**Annotation Type Logic**:
- Type is automatically determined by `labelingTimeMs` field
- Manual annotation of an extrapolated video converts it to manual type
- Speaker ID mapping ensures correct label assignment when speakers appear in different positions across videos

---

## 3. Annotation Ontology

### 3.1 Behavioral Coding Framework

The ontology comprises **11 facets** with **98 total signals** based on established frameworks in conversation analysis, interpersonal communication, and multimodal interaction research.

#### Facet Structure

Each facet includes:

- **Facet ID**: Snake_case identifier
- **Label**: Human-readable name
- **Description**: Theoretical definition and scope
- **Signals**: List of observable behavioral indicators

### 3.2 Complete Facet Taxonomy

#### **1. Prosody** (13 signals)

_Acoustic characteristics of speech independent of word choice_

Signals include:

- Low/high pitch variance
- Rising/falling terminal contours
- Stressed/unstressed syllables
- Fast/slow speech rate
- Long/short pauses
- Creaky/breathy voice quality
- Volume variations (loud/soft)

#### **2. Lexical Choice** (12 signals)

_Word and phrase selection patterns indicating stance and epistemic positioning_

Signals include:

- Hedging terms ("maybe", "sort of")
- Certainty terms ("definitely", "obviously")
- Formal/informal register
- Technical terminology
- Vague language ("thing", "stuff")
- Personal pronouns (I/we/you)
- Modal verbs (can/should/must)
- Discourse markers ("well", "so", "like")

#### **3. Turn Taking** (10 signals)

_Conversational floor access and management_

Signals include:

- Clean turn transitions
- Overlapping speech
- Interruptions
- Backchannel responses ("mm-hmm", "yeah")
- Latching (immediate continuation)
- Long gaps between turns
- Turn completion signals
- Floor holding strategies

#### **4. Gaze** (8 signals)

_Eye direction and visual attention patterns_

Signals include:

- Mutual gaze (eye contact)
- Gaze at partner/away from partner
- Gaze aversion during speech
- Gaze shifts at turn boundaries
- Sustained looking while listening/speaking

#### **5. Facial Expression** (10 signals)

_Visible facial muscle movements conveying emotional and social information_

Signals include:

- Smiling/laughter
- Frowning/brow lowering
- Eyebrow raises
- Lip compression/pursing
- Nose wrinkling
- Eye widening/narrowing
- Jaw tension
- Asymmetric expressions

#### **6. Gesture** (9 signals)

_Hand and arm movements accompanying or replacing speech_

Signals include:

- Iconic gestures (depicting referent)
- Deictic gestures (pointing)
- Beat gestures (rhythmic)
- Metaphoric gestures (abstract concepts)
- Emblematic gestures (conventional signs)
- Hand adaptors (self-touching)
- Palm-up/palm-down orientation

#### **7. Posture** (9 signals)

_Whole-body orientation and positioning_

Signals include:

- Leaning forward/backward
- Open/closed body position
- Postural shifts/stillness
- Head orientation (toward/away)
- Arm crossing
- Torso orientation
- Symmetrical/asymmetrical stance

#### **8. Affect Regulation** (7 signals)

_Behaviors that modulate or constrain expressive output_

Signals include:

- Dampened affect display
- Suppressed laughter/smile
- Controlled emotional expression
- Exaggerated affect
- Flat affect (minimal expression)
- Emotional leakage
- Self-soothing behaviors

#### **9. Interactional Role** (7 signals)

_Behavioral positioning within conversational structure_

Signals include:

- Initiating topics
- Storytelling/narrative production
- Active listening displays
- Summarizing/clarifying
- Questioning behavior
- Supportive responses
- Dominant/submissive positioning

#### **10. Timing & Latency** (6 signals)

_Temporal characteristics of response patterns_

Signals include:

- Fast response latency (immediate)
- Slow response latency (delayed)
- Rhythm matching
- Synchronous movement
- Asynchronous timing
- Acceleration/deceleration of tempo

#### **11. Repair Behavior** (7 signals)

_Corrections or restarts in ongoing speech_

Signals include:

- Self-repair (self-correction)
- Other-repair (correcting partner)
- Word search behaviors
- False starts
- Repetition for clarity
- Reformulation
- Trouble source indicators

### 3.3 Signal Selection Process

Annotators use **multi-select dropdowns** for each facet:

- Can select 0 to N signals per facet (no minimum required)
- Signal descriptions visible inline during selection
- Signals are **non-mutually exclusive** (multiple can co-occur)
- Independent selection for each speaker

---

## 4. Exported Data Structure

### 4.1 Export Format Options

Annotations can be exported in two formats:

1. **JSON**: Nested structure with metadata and arrays
2. **CSV**: Flattened structure with semicolon-delimited arrays

Both formats include embedded watermarks for IP protection (see Section 5).

### 4.2 Data Fields

#### **Core Annotation Fields**

| Field           | Type    | Description                                                 |
| --------------- | ------- | ----------------------------------------------------------- |
| `id`            | string  | Unique annotation ID (database primary key)                 |
| `videoId`       | string  | File ID from Seamless dataset (e.g., "V00_S0644_I00000129") |
| `vendorId`      | integer | Data collection site identifier (0-N)                       |
| `sessionId`     | integer | Recording session number                                    |
| `interactionId` | integer | Interaction within session                                  |
| `speaker1Id`    | string  | Participant ID for speaker 1 (P-number)                     |
| `speaker2Id`    | string  | Participant ID for speaker 2 (P-number)                     |

#### **Primary Labels (Morphs)**

| Field                | Type    | Description                                    |
| -------------------- | ------- | ---------------------------------------------- |
| `speaker1Label`      | string  | Primary classification: "Morph A" or "Morph B" |
| `speaker2Label`      | string  | Primary classification: "Morph A" or "Morph B" |
| `speaker1Confidence` | integer | Confidence rating (1-5 scale)                  |
| `speaker2Confidence` | integer | Confidence rating (1-5 scale)                  |

#### **Qualitative Observations**

| Field              | Type   | Description                     |
| ------------------ | ------ | ------------------------------- |
| `speaker1Comments` | string | Free-text grounded theory memos |
| `speaker2Comments` | string | Free-text grounded theory memos |

#### **Category Annotations (22 fields total)**

For each speaker (1 and 2) and each facet:

| Speaker 1 Facets            | Speaker 2 Facets            | Type     | Description                            |
| --------------------------- | --------------------------- | -------- | -------------------------------------- |
| `speaker1Prosody`           | `speaker2Prosody`           | string[] | Selected prosody signal IDs            |
| `speaker1LexicalChoice`     | `speaker2LexicalChoice`     | string[] | Selected lexical choice signal IDs     |
| `speaker1TurnTaking`        | `speaker2TurnTaking`        | string[] | Selected turn-taking signal IDs        |
| `speaker1Gaze`              | `speaker2Gaze`              | string[] | Selected gaze signal IDs               |
| `speaker1FacialExpression`  | `speaker2FacialExpression`  | string[] | Selected facial expression signal IDs  |
| `speaker1Gesture`           | `speaker2Gesture`           | string[] | Selected gesture signal IDs            |
| `speaker1Posture`           | `speaker2Posture`           | string[] | Selected posture signal IDs            |
| `speaker1AffectRegulation`  | `speaker2AffectRegulation`  | string[] | Selected affect regulation signal IDs  |
| `speaker1InteractionalRole` | `speaker2InteractionalRole` | string[] | Selected interactional role signal IDs |
| `speaker1TimingLatency`     | `speaker2TimingLatency`     | string[] | Selected timing/latency signal IDs     |
| `speaker1RepairBehavior`    | `speaker2RepairBehavior`    | string[] | Selected repair behavior signal IDs    |

**Signal ID Format**: Snake_case identifiers (e.g., `"low_pitch_variance"`, `"hedging_terms"`)

**Array Format**:

- JSON: Native arrays `["signal1", "signal2"]`
- CSV: Semicolon-delimited strings `"signal1; signal2"`

#### **Metadata Fields**

| Field            | Type    | Description                                                   |
| ---------------- | ------- | ------------------------------------------------------------- |
| `annotationType` | string  | Type of annotation: "manual" or "extrapolated"                |
| `labelingTimeMs` | integer | Time spent on annotation (milliseconds, 0 for extrapolated)   |
| `createdAt`      | ISO8601 | Timestamp of annotation creation                              |
| `updatedAt`      | ISO8601 | Timestamp of last modification                                |
| `userEmail`      | string  | Annotator email address                                       |
| `username`       | string  | Annotator username (part before @)                            |

### 4.3 Example Data Record (JSON)

```json
{
  "id": "cm71g8h0k00022jtzaxn9y1xc",
  "videoId": "V00_S0644_I00000129",
  "vendorId": 0,
  "sessionId": 644,
  "interactionId": 129,
  "speaker1Id": "P0799",
  "speaker2Id": "P0800",
  "speaker1Label": "Morph A",
  "speaker2Label": "Morph B",
  "speaker1Confidence": 4,
  "speaker2Confidence": 5,
  "speaker1Comments": "Speaker shows high certainty with technical language and minimal hedging. Maintains strong eye contact during assertions.",
  "speaker2Comments": "More tentative language with frequent hedging ('maybe', 'I think'). Gaze aversion during uncertain moments.",
  "speaker1Prosody": ["high_pitch_variance", "stressed_syllables"],
  "speaker1LexicalChoice": ["certainty_terms", "technical_terminology"],
  "speaker1TurnTaking": ["clean_transitions", "floor_holding"],
  "speaker1Gaze": ["mutual_gaze", "sustained_looking_speaking"],
  "speaker1FacialExpression": ["smiling"],
  "speaker1Gesture": ["iconic_gestures", "beat_gestures"],
  "speaker1Posture": ["leaning_forward", "open_body"],
  "speaker1AffectRegulation": [],
  "speaker1InteractionalRole": ["initiating_topics", "dominant_positioning"],
  "speaker1TimingLatency": ["fast_response"],
  "speaker1RepairBehavior": [],
  "speaker2Prosody": ["low_pitch_variance", "falling_terminal"],
  "speaker2LexicalChoice": ["hedging_terms", "vague_language"],
  "speaker2TurnTaking": ["overlapping_speech", "backchannels"],
  "speaker2Gaze": ["gaze_aversion_speaking"],
  "speaker2FacialExpression": ["frowning", "lip_compression"],
  "speaker2Gesture": ["hand_adaptors"],
  "speaker2Posture": ["leaning_backward", "closed_body"],
  "speaker2AffectRegulation": ["dampened_affect"],
  "speaker2InteractionalRole": ["active_listening", "submissive_positioning"],
  "speaker2TimingLatency": ["slow_response"],
  "speaker2RepairBehavior": ["self_repair", "word_search"],
  "annotationType": "manual",
  "labelingTimeMs": 127543,
  "createdAt": "2025-01-15T10:30:45.123Z",
  "updatedAt": "2025-01-15T10:32:52.666Z",
  "userEmail": "annotator@example.com",
  "username": "annotator"
}
```

### 4.4 Example Extrapolated Annotation (JSON)

An extrapolated annotation has the same structure but with key differences:

```json
{
  "id": "cm71g8h0k00032jtzaxn9y2xd",
  "videoId": "V00_S0644_I00000131",
  "vendorId": 0,
  "sessionId": 644,
  "interactionId": 131,
  "speaker1Id": "P0799",
  "speaker2Id": "P0800",
  "speaker1Label": "Morph A",
  "speaker2Label": "Morph B",
  "speaker1Confidence": 4,
  "speaker2Confidence": 5,
  "speaker1Comments": "",
  "speaker2Comments": "",
  "speaker1Prosody": [],
  "speaker1LexicalChoice": [],
  "speaker1TurnTaking": [],
  "speaker1Gaze": [],
  "speaker1FacialExpression": [],
  "speaker1Gesture": [],
  "speaker1Posture": [],
  "speaker1AffectRegulation": [],
  "speaker1InteractionalRole": [],
  "speaker1TimingLatency": [],
  "speaker1RepairBehavior": [],
  "speaker2Prosody": [],
  "speaker2LexicalChoice": [],
  "speaker2TurnTaking": [],
  "speaker2Gaze": [],
  "speaker2FacialExpression": [],
  "speaker2Gesture": [],
  "speaker2Posture": [],
  "speaker2AffectRegulation": [],
  "speaker2InteractionalRole": [],
  "speaker2TimingLatency": [],
  "speaker2RepairBehavior": [],
  "annotationType": "extrapolated",
  "labelingTimeMs": 0,
  "createdAt": "2025-01-15T10:32:52.888Z",
  "updatedAt": "2025-01-15T10:32:52.888Z",
  "userEmail": "annotator@example.com",
  "username": "annotator"
}
```

**Key Differences**:
- `annotationType`: "extrapolated"
- `labelingTimeMs`: 0 (no direct observation)
- All behavioral signal arrays are empty
- Comments are empty strings
- Only morph labels and confidence scores are preserved

---

## 5. Session-Wide Extrapolation

### 5.1 Rationale

In the Seamless Interaction Dataset, videos are grouped into **sessions** where the same two participants engage in multiple interactions. Within a session, speakers typically maintain consistent behavioral patterns and morphological characteristics. Session-wide extrapolation leverages this structure to accelerate bulk labeling while maintaining data quality.

**Use Cases**:
- Rapid initial labeling of large datasets
- Preliminary classification for subsequent detailed coding
- Identifying sessions requiring full manual review
- Bootstrapping training datasets for machine learning models

### 5.2 Extrapolation Mechanism

**Session Definition**: Videos share a session when they have identical `vendorId` and `sessionId` values.

**Process**:
1. Annotator manually labels one video in a session (creates manual annotation)
2. Optionally checks "Apply to entire session" before saving
3. System identifies all other unlabeled videos in the same session
4. Creates extrapolated annotations with:
   - **Preserved**: Morph labels, confidence scores
   - **Omitted**: Comments, behavioral signals, timing data
   - **Type**: Marked as "extrapolated"

**Speaker ID Mapping**:
- Critical implementation: Morph labels are mapped by **speaker ID**, not video position
- Ensures correct assignment when speakers appear in different positions (participant1 vs participant2) across videos
- Example: If Speaker P0799 is labeled "Morph A" in Video 1 (position 1), they receive "Morph A" in Video 2 even if appearing in position 2

### 5.3 Data Quality Considerations

**Advantages**:
- Efficient bulk labeling for large sessions
- Preserves primary classification across related interactions
- Reduces annotator fatigue for repetitive sessions
- Enables rapid dataset preparation

**Limitations**:
- Assumes behavioral consistency within sessions (may not hold for all contexts)
- Loses timing and observational detail
- Does not capture interaction-specific behavioral signals
- May propagate errors across session if initial annotation is incorrect

**Best Practices**:
1. Use extrapolation for preliminary classification only
2. Manually review extrapolated annotations for critical analyses
3. Filter by `annotationType` to separate manual from extrapolated data in statistical analyses
4. Re-annotate extrapolated videos when fine-grained behavioral coding is required

### 5.4 Converting Extrapolated to Manual Annotations

Extrapolated annotations automatically convert to manual type when:
- User opens the video and re-saves the annotation
- New `labelingTimeMs > 0` is recorded
- Behavioral signals or comments are added

This allows iterative refinement where researchers first extrapolate across sessions, then selectively upgrade key videos to full manual annotations.

---

## 6. Linking to Seamless Interaction Dataset

### 6.1 Video ID Mapping

Each annotation includes a `videoId` field that directly maps to the Seamless Interaction Dataset file naming convention:

**Format**: `V{vendor}_S{session}_I{interaction}_P{participant}`

**Decomposition**:

- `videoId`: "V00_S0644_I00000129" (in annotation)
- Corresponds to two participant files in Seamless dataset:
  - Speaker 1: `V00_S0644_I00000129_P0799.mp4` (from `speaker1Id`)
  - Speaker 2: `V00_S0644_I00000129_P0800.mp4` (from `speaker2Id`)

### 6.2 Retrieving Original Media

To access source videos and multimodal features:

```python
from seamless_interaction.fs import SeamlessInteractionFS

fs = SeamlessInteractionFS()

# From annotation export
video_id = "V00_S0644_I00000129"
speaker1_id = "P0799"
speaker2_id = "P0800"

# Download both participants
file_id_1 = f"{video_id}_{speaker1_id}"  # V00_S0644_I00000129_P0799
file_id_2 = f"{video_id}_{speaker2_id}"  # V00_S0644_I00000129_P0800

fs.gather_file_id_data_from_s3(file_id_1)  # Downloads .mp4, .wav, .json, .npz
fs.gather_file_id_data_from_s3(file_id_2)
```

### 6.3 Available Multimodal Features

For each annotated interaction, the Seamless dataset provides:

**Video** (.mp4):

- 1920×1080 resolution
- 30 fps
- H.264 encoding
- Frontal view of single participant

**Audio** (.wav):

- 48 kHz sampling rate
- Mono channel
- Individual participant microphone

**Motion Features** (.npz):

- SMPL-H body pose parameters
- Hand pose (left/right)
- Facial landmarks
- 3D body keypoints
- Head pose (rotation, translation)

**Metadata** (.json):

- Interaction prompt information
- Participant demographics (if available)
- Recording session details

---

## 7. Methodological Considerations

### 7.1 Ecological Validity

**Strengths**:

- Real face-to-face interactions (not lab-elicited)
- Diverse participant pool (4,000+ individuals)
- Natural conversational dynamics
- Both improvised (actor) and naturalistic (non-actor) contexts

**Limitations**:

- Recording setup may influence behavior (camera awareness)
- Prompted interactions (not fully spontaneous)
- Limited to dyadic format (no group interactions)

### 7.2 Annotation Framework

**Theoretical Grounding**:

- Prosody: Conversation analysis, phonetics
- Lexical choice: Discourse analysis, linguistic anthropology
- Turn-taking: Conversation analysis (Sacks, Schegloff, Jefferson)
- Gaze: Kendon's gaze model, mutual gaze research
- Facial expression: FACS (Facial Action Coding System)
- Gesture: McNeill's gesture typology, Kendon's continuum
- Posture: Proxemics, kinesics research
- Affect regulation: Emotion regulation theory
- Interactional role: Interpersonal Circumplex (IPC), rapport research
- Timing/latency: Coordination dynamics, entrainment research
- Repair behavior: Conversation analysis repair organization

**Coding Approach**:

- **Closed coding**: Predefined categories (deductive)
- **Grounded theory memos**: Open-ended observations (inductive supplement)
- **Multi-dimensional**: Independent facet selection (non-exclusive)

---

## 8. Contact and Support

**Primary Contact**: Alessandro Rizzo
**Dataset Source**: [Seamless Interaction Dataset](https://ai.meta.com/research/seamless-interaction/)
**Reference Paper**: _Seamless Interaction: Dyadic Audiovisual Motion Modeling and Large-Scale Dataset_ (Meta AI Research, 2024)

### 8.1 Recommended Citation

If using this annotated data in publications:

```
@misc{seamless_interaction_annotations_2025,
  author = {Rizzo, Alessandro},
  title = {Behavioral Annotation System for Seamless Interaction Dataset},
  year = {2025},
  note = {Custom annotation ontology with 98 behavioral signals across 11 conversational facets}
}

@misc{seamless_interaction_dataset_2024,
  author = {Meta AI Research},
  title = {Seamless Interaction Dataset},
  year = {2024},
  howpublished = {\url{https://ai.meta.com/research/seamless-interaction/}}
}
```

### 8.2 Data Sharing Agreement

All exports include embedded watermarks for intellectual property protection. Unauthorized distribution, modification, or use beyond agreed scope is prohibited. Each export includes a unique tracking identifier for data provenance.

---

## Appendix A: Signal ID Reference

Complete listing of all 98 signal IDs by facet (for reference during feature encoding):

**Prosody** (13):
`low_pitch_variance`, `high_pitch_variance`, `rising_terminal`, `falling_terminal`, `stressed_syllables`, `unstressed_syllables`, `fast_speech_rate`, `slow_speech_rate`, `long_pauses`, `short_pauses`, `creaky_voice`, `breathy_voice`, `loud_volume`, `soft_volume`

**Lexical Choice** (12):
`hedging_terms`, `certainty_terms`, `formal_register`, `informal_register`, `technical_terminology`, `vague_language`, `personal_pronouns_i`, `personal_pronouns_we`, `personal_pronouns_you`, `modal_verbs`, `discourse_markers`

**Turn Taking** (10):
`clean_transitions`, `overlapping_speech`, `interruptions`, `backchannels`, `latching`, `long_gaps`, `turn_completion_signals`, `floor_holding`

**Gaze** (8):
`mutual_gaze`, `gaze_at_partner`, `gaze_away`, `gaze_aversion_speaking`, `gaze_shifts_turn_boundary`, `sustained_looking_listening`, `sustained_looking_speaking`

**Facial Expression** (10):
`smiling`, `laughter`, `frowning`, `brow_lowering`, `eyebrow_raises`, `lip_compression`, `nose_wrinkling`, `eye_widening`, `eye_narrowing`, `jaw_tension`, `asymmetric_expressions`

**Gesture** (9):
`iconic_gestures`, `deictic_gestures`, `beat_gestures`, `metaphoric_gestures`, `emblematic_gestures`, `hand_adaptors`, `palm_up`, `palm_down`

**Posture** (9):
`leaning_forward`, `leaning_backward`, `open_body`, `closed_body`, `postural_shifts`, `postural_stillness`, `head_toward`, `head_away`, `arm_crossing`, `torso_orientation`, `symmetrical_stance`, `asymmetrical_stance`

**Affect Regulation** (7):
`dampened_affect`, `suppressed_smile`, `controlled_expression`, `exaggerated_affect`, `flat_affect`, `emotional_leakage`, `self_soothing`

**Interactional Role** (7):
`initiating_topics`, `storytelling`, `active_listening`, `summarizing`, `questioning`, `supportive_responses`, `dominant_positioning`, `submissive_positioning`

**Timing & Latency** (6):
`fast_response`, `slow_response`, `rhythm_matching`, `synchronous_movement`, `asynchronous_timing`, `tempo_changes`

**Repair Behavior** (7):
`self_repair`, `other_repair`, `word_search`, `false_starts`, `repetition_clarity`, `reformulation`, `trouble_indicators`
