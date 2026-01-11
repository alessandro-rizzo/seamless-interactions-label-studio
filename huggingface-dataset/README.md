---
license: cc-by-nc-4.0
task_categories:
  - video-classification
  - feature-extraction
language:
  - en
tags:
  - multimodal
  - interaction
  - behavioral-signals
  - annotation
  - human-communication
  - prosody
  - gesture
  - gaze
  - turn-taking
size_categories:
  - 1K<n<10K
---

# SeamlessInteractions Annotation Dataset

**Version:** v1.0.0
**Maintainer:** Alessandro Rizzo
**Contact (commercial licensing):** l.alessandrorizzo@gmail.com

## Summary

Human-annotated behavioral signal dataset for dyadic video interactions from the [Seamless Interaction Dataset](https://github.com/facebookresearch/seamless_interaction). Contains fine-grained multimodal annotations across 11 behavioral facets (98 total signals) including prosody, gaze, gesture, turn-taking, and more.

Each annotation captures:
- **Morph classification** for each speaker (Morph A / Morph B)
- **Confidence scores** (1-5 scale) per speaker
- **Behavioral signals** across 11 facets per speaker
- **Annotator comments** and labeling metadata

## Dataset Description

### What's in the Dataset

| Property | Value |
|----------|-------|
| **Modality** | Video annotations (behavioral signals) |
| **Total Annotations** | 1,233 |
| **Speakers per Annotation** | 2 |
| **Behavioral Facets** | 11 |
| **Total Signals** | 98 |
| **Format** | CSV / JSON |

### Annotation Ontology

The dataset uses a closed coding system with 11 behavioral facets:

| Facet | Signals | Description |
|-------|---------|-------------|
| **Prosody** | 13 | Acoustic characteristics of speech (pitch, rate, volume) |
| **Lexical Choice** | 12 | Word and phrase selection patterns |
| **Turn Taking** | 10 | Conversational floor access management |
| **Gaze** | 8 | Eye direction and movement |
| **Facial Expression** | 10 | Visible facial muscle movements |
| **Gesture** | 9 | Hand and arm movements |
| **Posture** | 9 | Whole-body orientation and stability |
| **Affect Regulation** | 7 | Behaviours that modulate expressive output |
| **Interactional Role** | 7 | Positioning within conversational structure |
| **Timing & Latency** | 6 | Temporal characteristics of responses |
| **Repair Behavior** | 7 | Corrections and restarts during interaction |

See `schema.json` for complete signal definitions.

## Intended Use

### Permitted (Non-Commercial) Uses

- Academic research and publication
- Benchmarking, evaluation, and reproducible experiments
- Derivative annotations or improvements shared under CC BY-NC 4.0
- Educational purposes and coursework
- Non-profit research initiatives

### Not Permitted Without Separate Agreement

- Commercial product development
- Internal commercial R&D in for-profit organisations
- Training or tuning models for commercial services
- Revenue-generating applications or services
- Commercial API integration

## License

This dataset is licensed under [Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)](https://creativecommons.org/licenses/by-nc/4.0/).

You may **share** and **adapt** the dataset for **non-commercial purposes only**, provided you give appropriate attribution.

### Commercial Use

**Commercial use requires a separate license from the Licensor.**

To obtain a commercial license, contact: **l.alessandrorizzo@gmail.com**

Commercial use includes but is not limited to:
- Model training for commercial products or services
- Internal R&D at for-profit entities
- Integration into paid products, SaaS, or APIs
- Use in revenue-generating systems

## Attribution

If you use this dataset, please cite:

```
SeamlessInteractions Annotation Dataset (v1.0.0), 2026. Alessandro Rizzo.
Licensed under CC BY-NC 4.0.
```

**BibTeX:**
```bibtex
@dataset{seamless_interactions_annotations_2026,
  author       = {Rizzo, Alessandro},
  title        = {SeamlessInteractions Annotation Dataset},
  year         = {2026},
  version      = {v1.0.0},
  license      = {CC BY-NC 4.0},
  url          = {https://huggingface.co/datasets/YOUR-USERNAME/seamless-interactions-annotations}
}
```

## Data Fields

### Core Fields

| Field | Type | Description |
|-------|------|-------------|
| `id` | string | Unique annotation identifier (CUID) |
| `videoId` | string | Video identifier (V{vendor}_S{session}_I{interaction}) |
| `vendorId` | integer | Vendor ID from source dataset |
| `sessionId` | integer | Session ID from source dataset |
| `interactionId` | integer | Interaction ID from source dataset |

### Speaker Identification

| Field | Type | Description |
|-------|------|-------------|
| `speaker1Id` | string | Participant 1 identifier |
| `speaker2Id` | string | Participant 2 identifier |
| `speaker1Label` | string | Morph classification ("Morph A" or "Morph B") |
| `speaker2Label` | string | Morph classification ("Morph A" or "Morph B") |
| `speaker1Confidence` | integer | Confidence score (1-5 scale) |
| `speaker2Confidence` | integer | Confidence score (1-5 scale) |
| `speaker1Comments` | string | Annotator notes for speaker 1 |
| `speaker2Comments` | string | Annotator notes for speaker 2 |

### Behavioral Signals (Per Speaker)

Each speaker has 11 behavioral signal fields (multi-select, semicolon-separated in CSV):

- `speaker{N}Prosody` - Prosodic signals observed
- `speaker{N}LexicalChoice` - Lexical choice signals observed
- `speaker{N}TurnTaking` - Turn-taking signals observed
- `speaker{N}Gaze` - Gaze signals observed
- `speaker{N}FacialExpression` - Facial expression signals observed
- `speaker{N}Gesture` - Gesture signals observed
- `speaker{N}Posture` - Posture signals observed
- `speaker{N}AffectRegulation` - Affect regulation signals observed
- `speaker{N}InteractionalRole` - Interactional role signals observed
- `speaker{N}TimingLatency` - Timing/latency signals observed
- `speaker{N}RepairBehavior` - Repair behavior signals observed

### Metadata

| Field | Type | Description |
|-------|------|-------------|
| `labelingTimeMs` | integer | Time spent annotating (milliseconds) |
| `createdAt` | datetime | Annotation creation timestamp (ISO 8601) |
| `updatedAt` | datetime | Last update timestamp (ISO 8601) |
| `userEmail` | string | Annotator email |
| `username` | string | Annotator username |

## Versioning

Stable releases are tagged using semantic versioning.

**To load a specific version:**
```python
from datasets import load_dataset

ds = load_dataset(
    "YOUR-USERNAME/seamless-interactions-annotations",
    revision="v1.0.0"
)
```

**For the latest version:**
```python
ds = load_dataset(
    "YOUR-USERNAME/seamless-interactions-annotations",
    revision="main"
)
```

## Provenance and Rights

- **Annotations:** Created by Alessandro Rizzo and collaborators, released under CC BY-NC 4.0
- **Underlying Videos:** From the [Seamless Interaction Dataset](https://github.com/facebookresearch/seamless_interaction) by Meta AI (separate license applies)

**Note:** This dataset contains annotations only. The underlying video data must be obtained separately from the original Seamless Interaction Dataset under its own license terms.

## Ethical Considerations

- Annotations describe observable behavioral signals, not inferred emotional states
- The ontology uses descriptive, non-pathologising terminology
- Annotator identifiers are included for reproducibility; contact the maintainer if you need anonymised versions

## Limitations

- Annotations reflect individual annotator judgments and may contain subjective interpretations
- The "Morph A/B" classification is specific to the Seamless Interaction Dataset's experimental design
- Behavioral signal annotations require video viewing for full context
- This dataset does not include the source videos (obtain separately)

## Changelog

- **v1.0.0** - Initial release (1,233 annotations)

## Contact

- **Commercial licensing:** l.alessandrorizzo@gmail.com
- **Research inquiries:** l.alessandrorizzo@gmail.com

---

**SeamlessInteractions** is a trademark of Alessandro Rizzo.
