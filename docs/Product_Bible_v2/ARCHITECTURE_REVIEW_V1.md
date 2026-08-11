# Architecture Review V1

> **Historical record:** Superseded by [`Architecture_Review_V3.md`](../Architecture_Review_V3.md). Findings below describe the earlier corpus and are not current normative requirements or freeze status.

## Review mandate

This report audits the documented Cosmos architecture for internal consistency and Architecture Freeze V1.0 readiness. The Product Bible was treated as the canonical source. Historical brainstorming and implementation code were not used as architectural authority. The review is conservative: findings identify contract, ownership, dependency, terminology, or traceability problems rather than preferences or redesign opportunities.

No Product Bible document was modified, renamed, moved, or deleted. This report is the only created file.

## Preflight verification

- Review root: `docs/Product_Bible_v2`
- Markdown documents discovered before report creation: **67**
- Markdown documents inspected: **67**
- Second-pass full-file readability verification: **67 of 67 passed**
- Product Bible files that could not be read: **None**
- `ARCHITECTURE_REVIEW_PROMPT.md`: **Not found** in the Cosmos working tree or its Git history. It is not counted as a Product Bible document. The explicit audit constraints in the commissioning request governed this review.

## Severity scale

- **Critical**: an existing required architecture path cannot be implemented without violating another canonical contract.
- **Major**: a canonical contract, owner, dependency, or responsibility is contradictory or materially undefined and should be resolved before freeze.
- **Minor**: a localized inconsistency creates ambiguity but does not independently invalidate the architecture.
- **Suggestion**: non-blocking documentation hardening with no architectural change.

## Findings

### AR-C01 — Direct Tool Mode has no valid Tool Instance owner or complete Context path

- **Severity:** Critical
- **Affected document(s):** `00_Foundation/05_Runtime_Model.md`; `01_Runtime/01_Cosmos.md`; `01_Runtime/06_Workspace.md`; `01_Runtime/07_Tool.md`; `01_Runtime/14_Context.md`; `02_Technical_Architecture/07_Workspace_Runtime.md`; `02_Technical_Architecture/08_Tool_Runtime.md`
- **Description:** Direct Tool Mode opens one User Tool beside the Cosmos map without entering a Room or Workspace. Elsewhere, Tool Context is defined through Room and Workspace, and the Workspace Runtime states that Tool Instances belong to Workspaces. No owner, state location, or optional Context path is defined for the direct Tool Instance.
- **Reason:** Both working modes are canonical. Implementing Direct Tool Mode currently requires either inventing an implicit Workspace or violating the Tool Instance ownership and Context contracts.
- **Minimal recommendation:** Use the existing Tool Runtime and Context model to state explicitly which existing component owns a Direct Tool Mode instance and that Room/Workspace Context segments are absent in this mode. Do not introduce another Runtime system.

### AR-M01 — Relationship endpoints, ownership, and Version 1 types conflict

- **Severity:** Major
- **Affected document(s):** `00_Foundation/03_Domain.md`; `00_Foundation/04_Architecture.md`; `01_Runtime/08_Object.md`; `01_Runtime/09_Node.md`; `01_Runtime/10_Relationship.md`; `01_Runtime/11_Knowledge.md`; `01_Runtime/13_Resource.md`; `03_Bundled_Extensions/User_Tools/03_Archive.md`; `03_Bundled_Extensions/User_Tools/04_Blueprint_Builder.md`; `07_System_Tools/01_Knowledge_Processor.md`; `07_System_Tools/04_Repository_Analyzer.md`
- **Description:** The foundation allows Relationships between Objects and Knowledge. The Relationship document limits Relationships to Objects and says Objects own them. The Knowledge document additionally permits Knowledge–Knowledge, Knowledge–Object, and Knowledge–Resource Relationships. Archive and System Tool documents use specialized current types such as `depends on`, `duplicates`, and `references`, while Version 1 defines only `Related`.
- **Reason:** Endpoint cardinality, ownership, persistence, service validation, and the supported Version 1 type set cannot all be derived consistently.
- **Minimal recommendation:** Select the already documented Version 1 Relationship contract, then align endpoint statements, ownership language, and examples to it. Mark non-Version-1 types explicitly as future examples rather than current outputs.

### AR-M02 — Entity architecture is not integrated into the foundational architecture

- **Severity:** Major
- **Affected document(s):** `00_Foundation/03_Domain.md`; `00_Foundation/04_Architecture.md`; `00_Foundation/05_Runtime_Model.md`; `02_Technical_Architecture/02_Registry_System.md`; `02_Technical_Architecture/03_Runtime_Services.md`; `02_Technical_Architecture/05_Persistence.md`; all documents under `04_Entities/`
- **Description:** Entities are defined as first-class persistent Runtime presences with identity, roles, behavior, permissions, state, relationships, and lifecycle. The foundational Domain, Architecture hierarchy, Registry categories, Runtime Service catalog, and persistence ownership examples do not place or own Entity definitions or Entity state.
- **Reason:** The Entity documents depend on Core contracts but do not show how Entity identity, configuration, registration, mutation, and persistence pass through those contracts.
- **Minimal recommendation:** Integrate the existing Entity concept into the existing foundation, shared Registry contract, Runtime Service boundary, and Persistence ownership model. Do not add a parallel Core layer.

### AR-M03 — Capability Bundles form an unintegrated parallel Extension architecture

- **Severity:** Major
- **Affected document(s):** `02_Technical_Architecture/01_Extension_System.md`; `02_Technical_Architecture/02_Registry_System.md`; `02_Technical_Architecture/14_Extension_Validation.md`; all documents under `05_Capability_Bundles/`; `06_Companion/01_Companion.md`
- **Description:** Capability Bundle is declared a first-class Extension category with its own Runtime, Registry, validation, dependency resolution, lifecycle, state, and permissions. Capability Bundles are absent from the Extension category list and shared Registry list, and their documents do not establish that Bundle Registry and Bundle Validation are category-specific implementations of the shared contracts.
- **Reason:** The current text permits two independent discovery, registration, validation, and lifecycle architectures despite the rule that Extensions share one architecture.
- **Minimal recommendation:** Add Capability Bundle to the existing Extension and Registry taxonomies and explicitly subordinate Bundle Runtime, Registry, and validation behavior to those shared contracts.

### AR-M04 — Bundle Validation contradicts mandatory Extension test execution

- **Severity:** Major
- **Affected document(s):** `02_Technical_Architecture/14_Extension_Validation.md`; `05_Capability_Bundles/04_Bundle_Validation.md`
- **Description:** Extension Validation requires isolated automated tests for every code-bearing Extension. Bundle Validation says validation never executes Bundle logic and its pipeline contains no isolated test stage, even though Capability Bundles are Extensions.
- **Reason:** A code-bearing Bundle can be either required or forbidden to execute validation tests depending on which canonical document is followed.
- **Minimal recommendation:** State that shared Extension Validation remains mandatory and define Bundle Validation only as the Bundle-specific checks within that existing pipeline.

### AR-M05 — Journeyman uses Capability Bundles outside their defined Entity ownership

- **Severity:** Major
- **Affected document(s):** `05_Capability_Bundles/01_Capability_Bundles.md`; `05_Capability_Bundles/02_Bundle_Runtime.md`; `07_System_Tools/03_Journeyman.md`
- **Description:** Capability Bundles are defined as abilities assigned to Runtime Entities; each Bundle Instance belongs to one Entity and is validated against an Entity Role. Journeyman is documented as a System Tool/Runtime Worker, yet it gains its skills through Capability Bundles without being defined as an Entity or having an Entity Role.
- **Reason:** Bundle assignment, compatibility validation, instance ownership, state, and permission derivation for Journeyman are undefined.
- **Minimal recommendation:** Choose one already documented classification: either restrict Capability Bundles to Entities and describe Journeyman skills through its existing System Tool contract, or explicitly place Journeyman under the existing Entity contract. Do not create a third Bundle consumer model.

### AR-M06 — Provider selection has two authoritative owners

- **Severity:** Major
- **Affected document(s):** `06_Companion/03_Brain.md`; `06_Companion/04_Providers.md`; `06_Companion/07_Settings.md`; `07_System_Tools/07_Provider_Runtime.md`
- **Description:** Brain and Providers state that the Brain selects a Provider. Provider Runtime states that Provider selection, capability matching, availability, privacy, failover, and routing are Provider Runtime responsibilities and that consumers communicate only with Provider Runtime.
- **Reason:** Selection policy and failure handling can diverge if both Brain and Provider Runtime are authoritative.
- **Minimal recommendation:** Keep Provider Runtime as the existing infrastructure owner; describe Brain as supplying requirements and preferences and consuming the selected Provider result.

### AR-M07 — Context assembly authority and Context artifacts are duplicated

- **Severity:** Major
- **Affected document(s):** `00_Foundation/05_Runtime_Model.md`; `01_Runtime/14_Context.md`; `02_Technical_Architecture/03_Runtime_Services.md`; `02_Technical_Architecture/08_Tool_Runtime.md`; `02_Technical_Architecture/11_Job_Runtime.md`; `06_Companion/02_Conversation.md`; `06_Companion/03_Brain.md`; `07_System_Tools/03_Journeyman.md`; `07_System_Tools/05_Context_Builder.md`; `07_System_Tools/06_Prompt_Builder.md`
- **Description:** The Runtime composes and injects Runtime Context; long-running operations receive immutable Context Snapshots. Context Builder separately assembles a temporary Context Package and says consumers never assemble Context. Brain and Journeyman nevertheless say they assemble or gather Context themselves, while Conversation says Brain receives it from Entity Runtime.
- **Reason:** It is unclear which component authoritatively selects data, applies permission filtering, validates completeness, and produces the immutable input for Services, Jobs, Bundles, and Providers.
- **Minimal recommendation:** Define `Runtime Context`, `Context Snapshot`, and `Context Package` as explicit views or stages of the existing Context model, and make all consumers use the single existing Context Builder/Runtime path rather than assembling independently.

### AR-M08 — Multi-Project Workspace scope is lost in downstream Context contracts

- **Severity:** Major
- **Affected document(s):** `00_Foundation/04_Architecture.md`; `00_Foundation/05_Runtime_Model.md`; `01_Runtime/14_Context.md`; `02_Technical_Architecture/06_Project_Runtime.md`; `02_Technical_Architecture/07_Workspace_Runtime.md`; `02_Technical_Architecture/08_Tool_Runtime.md`; `03_Bundled_Extensions/User_Tools/02_Review.md`
- **Description:** The foundation and Context document allow a Workspace to carry zero, one, or multiple Project scopes. Workspace Runtime, Tool Runtime, Project Runtime inheritance, and Review items generally use a singular `active Project` or `affected Project` with no stated mapping to assigned scopes.
- **Reason:** Cross-project Workspaces are an existing Version 1 capability, but service queries, permissions, events, Tool Context, and Review ownership cannot derive their cardinality consistently.
- **Minimal recommendation:** Standardize the existing Context fields as assigned Project scopes plus an optional focused/primary Project where needed, and use that contract in downstream documents.

### AR-M09 — Repository work is both demand-driven and continuous

- **Severity:** Major
- **Affected document(s):** `01_Runtime/03_Project_Structure.md`; `02_Technical_Architecture/06_Project_Runtime.md`; `02_Technical_Architecture/10_Repository_Runtime.md`; `02_Technical_Architecture/13_Recovery.md`; `07_System_Tools/03_Journeyman.md`; `07_System_Tools/04_Repository_Analyzer.md`; `ARCHITECTURE_AUDIT.md`
- **Description:** Project Structure and Repository Runtime require explicit or pre-task validation and reject continuous expensive rescanning. The same Repository Runtime says Journeyman “continuously translates,” Repository Analyzer continuously understands, detects, and re-analyzes changes, and Recovery revalidates repositories at startup without defining whether that is only a lightweight availability check.
- **Reason:** Implementations cannot distinguish permitted lightweight signals from prohibited analysis, translation, mapping updates, or repository synchronization.
- **Minimal recommendation:** Preserve the existing demand-driven rule. Limit continuous behavior to the already documented lightweight change signals and health checks; require explicit or affected-task triggers for analysis, translation, and mapping mutation.

### AR-M10 — Entity permission enforcement bypasses the Service-only authority

- **Severity:** Major
- **Affected document(s):** `02_Technical_Architecture/03_Runtime_Services.md`; `02_Technical_Architecture/12_Permission_System.md`; `04_Entities/02_Entity_Runtime.md`; `04_Entities/05_Entity_Interaction.md`; `04_Entities/06_Entity_Permissions.md`; `05_Capability_Bundles/02_Bundle_Runtime.md`
- **Description:** The Permission System says permissions are enforced only by Runtime Services. Entity Permissions places Entity Runtime and Permission System before the Runtime Service and says invalid requests never reach Services. Entity Interaction also claims permission validation as its responsibility.
- **Reason:** Preflight capability checks and authoritative authorization are conflated, allowing an Entity path to become a parallel enforcement boundary.
- **Minimal recommendation:** Retain optional Entity/Bundle preflight checks for user feedback, but state that Runtime Services always perform the authoritative permission decision before any Runtime action.

### AR-M11 — Event structure and delivery guarantees contradict the Event Model

- **Severity:** Major
- **Affected document(s):** `02_Technical_Architecture/04_Event_Model.md`; `07_System_Tools/09_Event_Dispatcher.md`
- **Description:** Event Model requires Runtime Context, Origin Service, affected Objects, and metadata; Event Dispatcher defines publisher, Runtime Scope, payload, and metadata. Event Dispatcher guarantees no duplicate delivery, while Event Model requires idempotent subscribers because duplicate delivery may occur. Dispatcher also says subscribers never know the publisher while placing publisher in every Event.
- **Reason:** Producers and consumers cannot implement one stable Event schema or delivery contract.
- **Minimal recommendation:** Make Event Dispatcher implement the existing Event Model verbatim: one payload schema, one duplicate-delivery guarantee, and one rule for publisher/origin visibility.

### AR-M12 — Job lifecycle, priority, and scope have competing contracts

- **Severity:** Major
- **Affected document(s):** `00_Foundation/05_Runtime_Model.md`; `02_Technical_Architecture/11_Job_Runtime.md`; `07_System_Tools/10_Job_Scheduler.md`
- **Description:** Job Runtime defines `Created → Queued → Scheduled → Running → terminal` and priorities `User initiated`, `Interactive`, `Background`, and `Maintenance`. Job Scheduler defines additional `Waiting`, `Assigned`, and `Validating` states and priorities `Critical`, `High`, `Normal`, and `Background`. It also says every task becomes a Job, while the foundation limits Jobs to long-running work and keeps ordinary state changes in synchronous Service transactions.
- **Reason:** Persistence, recovery, Events, cancellation, UI progress, and Service delegation depend on one state machine and one priority vocabulary.
- **Minimal recommendation:** Treat Job Scheduler as the scheduler within the existing Job Runtime and align its state and priority terms to that canonical contract; retain Jobs for long-running work only.

### AR-M13 — Blueprint taxonomy and mutation ownership are unresolved

- **Severity:** Major
- **Affected document(s):** `02_Technical_Architecture/01_Extension_System.md`; `02_Technical_Architecture/02_Registry_System.md`; `02_Technical_Architecture/03_Runtime_Services.md`; `03_Bundled_Extensions/User_Tools/01_Capture.md`; `03_Bundled_Extensions/User_Tools/04_Blueprint_Builder.md`; `03_Bundled_Extensions/User_Tools/05_Workspace_Builder.md`; `05_Capability_Bundles/02_Bundle_Runtime.md`; `07_System_Tools/01_Knowledge_Processor.md`
- **Description:** The shared Registry distinguishes Object Blueprints, Capture Templates, and Workspace Blueprints. Extension System groups Object and Capture definitions under generic `Blueprints`. Capture provides Templates and also creates Blueprints; Blueprint Builder owns Object Blueprint creation; Workspace Builder saves Workspace Blueprints. No canonical Service owner or complete Registry mutation path is defined, and `Entity Blueprint` appears once without definition.
- **Reason:** Creation, validation, versioning, scope, persistence, and activation can be implemented differently by each Tool.
- **Minimal recommendation:** Use the three existing canonical categories consistently, remove the undefined `Entity Blueprint` reference unless it maps to an existing category, and route mutations through the existing Runtime Service and Registry contracts.

### AR-M14 — The boundary of Knowledge is contradictory

- **Severity:** Major
- **Affected document(s):** `00_Foundation/03_Domain.md`; `01_Runtime/11_Knowledge.md`; `01_Runtime/13_Resource.md`; `03_Bundled_Extensions/User_Tools/03_Archive.md`; `04_Entities/05_Entity_Interaction.md`; `06_Companion/02_Conversation.md`; `07_System_Tools/01_Knowledge_Processor.md`; `07_System_Tools/04_Repository_Analyzer.md`
- **Description:** The Domain separates Knowledge from Resources and defines Knowledge as meaningful informational records. Archive says “Everything becomes Knowledge.” Entity Interaction says recorded interaction history is not Knowledge. Conversation makes history temporary although chat conversations are named Knowledge sources. Repository Analyzer says Objects and Relationships become Knowledge even though they are separate domain entities.
- **Reason:** Storage ownership, retention, versioning, search, source traceability, and deletion behavior depend on a stable inclusion boundary.
- **Minimal recommendation:** Preserve the foundation’s existing separation: domain entities and Resources remain distinct, while durable informational records about them may become Knowledge. State explicitly when conversation and interaction records are temporary versus promoted to Knowledge.

### AR-M15 — Persistent Workspace definition and temporary Workspace session are conflated

- **Severity:** Major
- **Affected document(s):** `01_Runtime/04_Base.md`; `01_Runtime/06_Workspace.md`; `02_Technical_Architecture/05_Persistence.md`; `02_Technical_Architecture/07_Workspace_Runtime.md`; `03_Bundled_Extensions/User_Tools/05_Workspace_Builder.md`
- **Description:** Workspace is a user-owned configurable environment with immutable identity, persistent layout, and reusable definitions. Workspace Runtime says “A Workspace is temporary,” gives it a session lifecycle, and also persists and restores it.
- **Reason:** Deleting a definition, closing a session, restoring state, Blueprint instantiation, and ownership cannot be distinguished reliably.
- **Minimal recommendation:** Keep the existing Workspace definition and name the already implied active Workspace session as the temporary lifecycle object within Workspace Runtime.

### AR-M16 — Core Runtime infrastructure is classified as System Tools

- **Severity:** Major
- **Affected document(s):** `00_Foundation/03_Domain.md`; `01_Runtime/07_Tool.md`; `02_Technical_Architecture/01_Extension_System.md`; all documents under `07_System_Tools/`
- **Description:** System Tools are defined as replaceable background capabilities following the Tool contract. The `07_System_Tools` section includes Provider Runtime, Theme Runtime, Event Dispatcher, and Job Scheduler, which provide mandatory infrastructure used to load or execute Extensions and Tools. Tool also says every capability is implemented as a Tool, while Capability Bundles, Providers, Services, and Integrations are separate capability forms.
- **Reason:** If mandatory Core coordination is a System Tool Extension, disabling or failing that Tool can prevent the Extension and Tool runtimes that must load it, creating dependency inversion and potential cycles.
- **Minimal recommendation:** Classify each existing document consistently as either a System Tool using Core contracts or an internal component of an already documented Core Runtime. Narrow “every capability is a Tool” to the Tool capabilities actually covered by the Tool contract.

### AR-M17 — Multiple undefined Runtime and Service dependencies bypass documented owners

- **Severity:** Major
- **Affected document(s):** `02_Technical_Architecture/03_Runtime_Services.md`; `04_Entities/01_Entity.md`; `05_Capability_Bundles/02_Bundle_Runtime.md`; `06_Companion/03_Brain.md`; all documents under `07_System_Tools/`
- **Description:** Dependencies include Object Runtime, Tag Runtime, Relationship Runtime, Context Runtime, Review Runtime, Analysis Runtime, Configuration Runtime, Security Runtime, UI Runtime, Resource Runtime, and Extension Runtime without matching canonical definitions. Review Service, Provider Service, Notification Service, and Repository Service also appear outside the documented Service catalog and sometimes alongside a same-purpose `Runtime`.
- **Reason:** These names can be implemented as new parallel systems even though existing Object, Tag, Relationship, Resource, Permission, Registry, Context, Persistence, and Runtime Service contracts already cover most responsibilities.
- **Minimal recommendation:** Replace undefined dependency names with the existing canonical Service or Runtime names wherever they already cover the responsibility. For genuinely required Services already referenced, add them to the existing Runtime Service catalog rather than adding new Runtime systems.

### AR-M18 — Runtime Translation and Journeyman have duplicate identity and ownership

- **Severity:** Major
- **Affected document(s):** `00_Foundation/03_Domain.md`; `01_Runtime/03_Project_Structure.md`; `01_Runtime/07_Tool.md`; `02_Technical_Architecture/01_Extension_System.md`; `02_Technical_Architecture/02_Registry_System.md`; `02_Technical_Architecture/10_Repository_Runtime.md`; `07_System_Tools/03_Journeyman.md`
- **Description:** Runtime Translation is named as a System Tool and Registry dependency (`cosmos.system-tool.runtime-translation`), while Project Structure and Repository Runtime assign translation ownership to Journeyman. Journeyman is separately documented as the autonomous Runtime Worker/System Tool.
- **Reason:** The documents do not establish whether Runtime Translation is Journeyman, a Journeyman capability, or a separate Tool, leaving duplicate ownership and dependency identity.
- **Minimal recommendation:** Select one of the already documented identities and use it consistently in examples, Registry IDs, dependencies, and ownership statements.

### AR-m01 — `System Services` conflicts with canonical `Runtime Services`

- **Severity:** Minor
- **Affected document(s):** `00_Foundation/04_Architecture.md`; `00_Foundation/05_Runtime_Model.md`; `02_Technical_Architecture/03_Runtime_Services.md`
- **Description:** The architecture hierarchy names `System Services`, while all Runtime contracts use `Runtime Services`; `System Tools` is also a separate canonical term.
- **Reason:** The unexplained term can be mistaken for either Runtime Services or System Tools.
- **Minimal recommendation:** Use `Runtime Services` in the hierarchy unless `System Services` is explicitly declared an alias.

### AR-m02 — Capture submission wording assigns Service and Job responsibilities to the Tool

- **Severity:** Minor
- **Affected document(s):** `00_Foundation/05_Runtime_Model.md`; `02_Technical_Architecture/03_Runtime_Services.md`; `02_Technical_Architecture/11_Job_Runtime.md`; `03_Bundled_Extensions/User_Tools/01_Capture.md`
- **Description:** Capture submission is described as storing Knowledge, publishing `CaptureCreated`, and scheduling a Job. The canonical action path says the Tool sends a Command, the Service persists and publishes, and Runtime Services exclusively create Jobs.
- **Reason:** The sequence is correct in outcome but assigns steps to the wrong owner.
- **Minimal recommendation:** Rewrite the sequence as Capture submitting a Command to Knowledge Service, followed by Service persistence, Event publication, and Job creation.

### AR-m03 — Six documents have unclosed Markdown code fences

- **Severity:** Minor
- **Affected document(s):** `02_Technical_Architecture/02_Registry_System.md`; `04_Entities/02_Entity_Runtime.md`; `04_Entities/06_Entity_Permissions.md`; `05_Capability_Bundles/01_Capability_Bundles.md`; `05_Capability_Bundles/02_Bundle_Runtime.md`; `07_System_Tools/03_Journeyman.md`
- **Description:** Each document opens one fenced block and never closes it, causing most subsequent headings and normative text to render as code.
- **Reason:** Canonical responsibilities and principles are hidden from normal Markdown structure and are harder for humans and tooling to interpret reliably.
- **Minimal recommendation:** Close each existing example fence immediately after the intended diagram. Do not change the text or architecture.

### AR-m04 — Knowledge Processor has three competing “entry point” owners

- **Severity:** Minor
- **Affected document(s):** `02_Technical_Architecture/09_Knowledge_Runtime.md`; `03_Bundled_Extensions/User_Tools/01_Capture.md`; `07_System_Tools/01_Knowledge_Processor.md`
- **Description:** Capture is the primary entry point for new Knowledge; Knowledge Runtime receives and stores Knowledge; Knowledge Processor calls itself the primary entry point into Knowledge Runtime even though every source becomes Knowledge before processing.
- **Reason:** The phrase obscures the established boundary between ingestion/storage and asynchronous enrichment.
- **Minimal recommendation:** Describe Knowledge Processor as the primary processing stage after Knowledge has entered the Runtime.

### AR-m05 — Event wording lets Events create Jobs

- **Severity:** Minor
- **Affected document(s):** `02_Technical_Architecture/04_Event_Model.md`; `02_Technical_Architecture/11_Job_Runtime.md`; `07_System_Tools/10_Job_Scheduler.md`
- **Description:** Event Model says some Events create Jobs, and Job Scheduler says Events naturally create work. Elsewhere Events only announce completed facts and Runtime Services exclusively create Jobs.
- **Reason:** Literal implementation would give Events command semantics.
- **Minimal recommendation:** State that subscribers react to Events by requesting the appropriate Runtime Service to create a Job.

### AR-m06 — Project Resource containment conflicts with external Resource ownership

- **Severity:** Minor
- **Affected document(s):** `00_Foundation/03_Domain.md`; `00_Foundation/04_Architecture.md`; `01_Runtime/02_Project.md`; `01_Runtime/13_Resource.md`; `02_Technical_Architecture/05_Persistence.md`
- **Description:** Project is said to contain and organize Resources, while the architecture hierarchy uses Resource Mappings and Resource/Persistence documents state that native repositories or external sources own Resources.
- **Reason:** “Contains” can be read as persistent ownership rather than semantic inclusion by reference.
- **Minimal recommendation:** Use `Resource mappings` or `Resource references` in Project ownership lists.

### AR-m07 — Entity Behaviour is both deterministic and probabilistic

- **Severity:** Minor
- **Affected document(s):** `04_Entities/02_Entity_Runtime.md`; `04_Entities/04_Entity_Behaviour.md`; `06_Companion/05_Personality.md`
- **Description:** Behaviour Rules are repeatedly required to be deterministic, but every Rule may contain probability and randomness is explicitly used for natural variation.
- **Reason:** Reproducibility, testing, recovery, and event replay cannot interpret “deterministic” consistently.
- **Minimal recommendation:** Clarify whether determinism applies to validation/state transitions while selection may be probabilistic, or remove the conflicting claim.

### AR-m08 — Personality and emotion responsibility wording crosses the Behaviour boundary

- **Severity:** Minor
- **Affected document(s):** `04_Entities/04_Entity_Behaviour.md`; `04_Entities/05_Entity_Interaction.md`; `06_Companion/05_Personality.md`; `06_Companion/06_Avatars.md`
- **Description:** Personality lists idle behavior and reaction intensity as responsibilities; Behaviour owns rule selection and execution; Interaction says emotion never changes Runtime behavior even though Emotional Behaviour and Personality influence behavior frequency and selection.
- **Reason:** Configuration influence and execution ownership are not consistently separated.
- **Minimal recommendation:** Keep Behaviour as the existing execution owner and describe Personality/emotion only as inputs to permitted presentation and rule parameters.

### AR-m09 — The prior audit has no canonical status and contains stale completion claims

- **Severity:** Minor
- **Affected document(s):** `ARCHITECTURE_AUDIT.md`; all documents under `04_Entities/`, `05_Capability_Bundles/`, `06_Companion/`, and `07_System_Tools/`
- **Description:** `ARCHITECTURE_AUDIT.md` says no remaining issue blocks the next documents and says those documents “should” be defined next, although they now exist and introduce unresolved contracts. It has no date, version, scope, or superseded status.
- **Reason:** Because every document in the Product Bible is canonical, the historical readiness statement can be mistaken for a current architecture verdict.
- **Minimal recommendation:** Mark the earlier audit with its historical scope/version and make this V1 review the current freeze-readiness result.

### AR-S01 — Add navigable cross-references for canonical contracts

- **Severity:** Suggestion
- **Affected document(s):** All reviewed Product Bible documents
- **Description:** Automated inspection found no Markdown links between Product Bible documents. Many documents name dependencies but do not link to their defining contract.
- **Reason:** Explicit links would make owner and dependency verification easier and reduce future drift; the absence of links is not itself an architecture contradiction.
- **Minimal recommendation:** Add links only where a document relies on another document’s canonical definition, especially for Services, Events, Jobs, Context, Registries, and persistence ownership.

### AR-S02 — Repair corrupted diagram glyphs without changing semantics

- **Severity:** Suggestion
- **Affected document(s):** Multiple documents throughout the Product Bible containing sequences such as `â†“` and `â”€`
- **Description:** Text diagrams contain mojibake in place of arrows and box-drawing characters.
- **Reason:** The intended flow is usually inferable, but corrupted diagrams weaken readability and automated parsing.
- **Minimal recommendation:** Normalize file encoding and replace only the corrupted glyphs; preserve wording and architecture.

## Architecture Freeze assessment

The documented architecture is **not ready for Architecture Freeze V1.0**.

The foundation is coherent around Projects, Objects, Knowledge, Resources, Tools, Runtime Services, Events, Jobs, permissions, and external repository ownership. The freeze blocker is not a need for redesign. It is that later documents do not consistently reuse those contracts. Direct Tool Mode currently has no valid instance owner, and several later subsystems introduce competing owners, schemas, lifecycle states, or undefined Runtime dependencies.

Freeze readiness can be reached through documentation reconciliation using the concepts already present. No new Runtime system is recommended by this audit.

## Reviewed-file inventory

All paths are relative to `docs/Product_Bible_v2`.

1. `00_Foundation/01_Vision.md`
2. `00_Foundation/02_Principles.md`
3. `00_Foundation/03_Domain.md`
4. `00_Foundation/04_Architecture.md`
5. `00_Foundation/05_Runtime_Model.md`
6. `01_Runtime/01_Cosmos.md`
7. `01_Runtime/02_Project.md`
8. `01_Runtime/03_Project_Structure.md`
9. `01_Runtime/04_Base.md`
10. `01_Runtime/05_Room.md`
11. `01_Runtime/06_Workspace.md`
12. `01_Runtime/07_Tool.md`
13. `01_Runtime/08_Object.md`
14. `01_Runtime/09_Node.md`
15. `01_Runtime/10_Relationship.md`
16. `01_Runtime/11_Knowledge.md`
17. `01_Runtime/12_Tag.md`
18. `01_Runtime/13_Resource.md`
19. `01_Runtime/14_Context.md`
20. `02_Technical_Architecture/01_Extension_System.md`
21. `02_Technical_Architecture/02_Registry_System.md`
22. `02_Technical_Architecture/03_Runtime_Services.md`
23. `02_Technical_Architecture/04_Event_Model.md`
24. `02_Technical_Architecture/05_Persistence.md`
25. `02_Technical_Architecture/06_Project_Runtime.md`
26. `02_Technical_Architecture/07_Workspace_Runtime.md`
27. `02_Technical_Architecture/08_Tool_Runtime.md`
28. `02_Technical_Architecture/09_Knowledge_Runtime.md`
29. `02_Technical_Architecture/10_Repository_Runtime.md`
30. `02_Technical_Architecture/11_Job_Runtime.md`
31. `02_Technical_Architecture/12_Permission_System.md`
32. `02_Technical_Architecture/13_Recovery.md`
33. `02_Technical_Architecture/14_Extension_Validation.md`
34. `02_Technical_Architecture/15_Codex_Execution_Rules.md`
35. `03_Bundled_Extensions/User_Tools/01_Capture.md`
36. `03_Bundled_Extensions/User_Tools/02_Review.md`
37. `03_Bundled_Extensions/User_Tools/03_Archive.md`
38. `03_Bundled_Extensions/User_Tools/04_Blueprint_Builder.md`
39. `03_Bundled_Extensions/User_Tools/05_Workspace_Builder.md`
40. `04_Entities/01_Entity.md`
41. `04_Entities/02_Entity_Runtime.md`
42. `04_Entities/03_Entity_Roles.md`
43. `04_Entities/04_Entity_Behaviour.md`
44. `04_Entities/05_Entity_Interaction.md`
45. `04_Entities/06_Entity_Permissions.md`
46. `05_Capability_Bundles/01_Capability_Bundles.md`
47. `05_Capability_Bundles/02_Bundle_Runtime.md`
48. `05_Capability_Bundles/03_Bundle_Registry.md`
49. `05_Capability_Bundles/04_Bundle_Validation.md`
50. `06_Companion/01_Companion.md`
51. `06_Companion/02_Conversation.md`
52. `06_Companion/03_Brain.md`
53. `06_Companion/04_Providers.md`
54. `06_Companion/05_Personality.md`
55. `06_Companion/06_Avatars.md`
56. `06_Companion/07_Settings.md`
57. `07_System_Tools/01_Knowledge_Processor.md`
58. `07_System_Tools/02_Analysis_Engine.md`
59. `07_System_Tools/03_Journeyman.md`
60. `07_System_Tools/04_Repository_Analyzer.md`
61. `07_System_Tools/05_Context_Builder.md`
62. `07_System_Tools/06_Prompt_Builder.md`
63. `07_System_Tools/07_Provider_Runtime.md`
64. `07_System_Tools/08_Theme_Runtime.md`
65. `07_System_Tools/09_Event_Dispatcher.md`
66. `07_System_Tools/10_Job_Scheduler.md`
67. `ARCHITECTURE_AUDIT.md`

## Final totals

- **Total documents reviewed:** 67
- **Total findings:** 30
- **Critical findings:** 1
- **Major findings:** 18
- **Minor findings:** 9
- **Suggestions:** 2
- **Overall Architecture Freeze recommendation:** **DO NOT FREEZE — reconcile the existing canonical contracts and repeat the freeze audit.**
