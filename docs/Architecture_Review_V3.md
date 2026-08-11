# Architecture Review V3

## Review mandate

This review synchronizes `Product_Bible_V2` and `Experience_V1` into one Version 1 architecture contract.

The Product Bible remains authoritative for implementation. Experience remains authoritative for user-facing behavior. The approved architecture principles in the synchronization mission are the decision basis for every finding below.

All 107 Markdown documents present in both collections were included in the review corpus. Historical audit and review files were inspected as historical evidence, then explicitly marked non-normative. The synchronization changed 56 existing documents and created this report.

Every finding in this report has been applied. No finding introduces a new Version 1 feature or a parallel Runtime system.

---

## Foundation Findings

### AV3-F01 — Universal Object identity was narrower in the Product Bible than in Experience

- **ID:** AV3-F01
- **Status:** Applied
- **Affected documents:** `Product_Bible_V2/00_Foundation/02_Principles.md`; `Product_Bible_V2/00_Foundation/03_Domain.md`; `Product_Bible_V2/00_Foundation/04_Architecture.md`; `Product_Bible_V2/01_Runtime/01_Cosmos.md`; `Product_Bible_V2/01_Runtime/02_Project.md`; `Product_Bible_V2/01_Runtime/04_Base.md`; `Product_Bible_V2/01_Runtime/05_Room.md`; `Product_Bible_V2/01_Runtime/06_Workspace.md`; `Product_Bible_V2/01_Runtime/07_Tool.md`; `Product_Bible_V2/01_Runtime/08_Object.md`; `Product_Bible_V2/01_Runtime/09_Node.md`; `Product_Bible_V2/04_Entities/01_Entity.md`; `Experience_V1/experience/01_Cosmos/07_Object_Model.md`
- **Problem:** Experience defined Projects, Nodes, Workspaces, Windows, Tools, Themes, Templates and Entities as Objects, while the Product Bible limited Object to a Project-owned semantic item with a separate object type.
- **Reason:** Two identity systems would require implementation-specific wrappers, duplicate IDs and special persistence rules.
- **Required change:** Make Object the universal identity and state envelope. Express domain responsibilities through System Tags, Property Schemas and Properties while retaining their existing responsibility boundaries.
- **Expected result:** Every independently addressable visible or interactive element uses one Object contract without erasing Project, Workspace, Tool, Theme or Entity semantics.

### AV3-F02 — The canonical Object structure was missing from the implementation contract

- **ID:** AV3-F02
- **Status:** Applied
- **Affected documents:** `Product_Bible_V2/00_Foundation/02_Principles.md`; `Product_Bible_V2/00_Foundation/03_Domain.md`; `Product_Bible_V2/00_Foundation/04_Architecture.md`; `Product_Bible_V2/01_Runtime/08_Object.md`; `Product_Bible_V2/01_Runtime/12_Tag.md`; `Product_Bible_V2/02_Technical_Architecture/03_Runtime_Services.md`; `Product_Bible_V2/03_Bundled_Extensions/User_Tools/04_Blueprint_Builder.md`; `Experience_V1/experience/01_Cosmos/07_Object_Model.md`
- **Problem:** Experience defined `Identity → System Tags → Property Schemas → Properties → User Tags`, but the Product Bible had no equivalent schema-composition and completeness contract.
- **Reason:** Implementers could create exclusive classes, optional schema fragments or Objects with missing state.
- **Required change:** Define additive schema composition from System Tags, require every active Property, and make Object Service the authoritative mutation and validation boundary.
- **Expected result:** Object validity is deterministic and every active capability has complete explicit state.

### AV3-F03 — Theme definitions were not consistently subordinate to Object identity

- **ID:** AV3-F03
- **Status:** Applied
- **Affected documents:** `Product_Bible_V2/00_Foundation/03_Domain.md`; `Product_Bible_V2/01_Runtime/08_Object.md`; `Product_Bible_V2/01_Runtime/09_Node.md`; `Product_Bible_V2/07_System_Tools/08_Theme_Runtime.md`; `Experience_V1/experience/04_Themes/00_Overview.md`; `Experience_V1/experience/04_Themes/01_Theme_Architecture.md`; `Experience_V1/experience/04_Themes/02_Theme_Components.md`
- **Problem:** Some wording allowed Themes or Theme collections to appear to define visual Objects, classification or behavior.
- **Reason:** Theme activation must not change identity, schemas, capabilities, interaction or business behavior.
- **Required change:** Make Themes and Theme Components independent Objects that supply appearance references only. Keep registration in Extension System and Theme Registry, not Theme Runtime.
- **Expected result:** Any Theme can replace appearance without changing the represented Object or Runtime contract.

### AV3-F04 — Extensibility concepts were split between universal and special-case systems

- **ID:** AV3-F04
- **Status:** Applied
- **Affected documents:** `Product_Bible_V2/00_Foundation/04_Architecture.md`; `Product_Bible_V2/01_Runtime/02_Project.md`; `Product_Bible_V2/01_Runtime/03_Project_Structure.md`; `Product_Bible_V2/01_Runtime/08_Object.md`; `Product_Bible_V2/02_Technical_Architecture/01_Extension_System.md`; `Experience_V1/experience/07_Extensibility/00_Overview.md`; `Experience_V1/experience/07_Extensibility/05_Extension_Points.md`; `Experience_V1/experience/07_Extensibility/Future_Extensibility.md`
- **Problem:** Product growth could be interpreted as requiring new Extension categories even when Objects, Tags, schemas, Prepared Structures or Extension Points already solved it.
- **Reason:** Parallel growth systems increase Core complexity and weaken universal reasoning.
- **Required change:** Establish the escalation order: reuse Objects, System Tags, Property Schemas, complete Properties, Prepared Structures and Extension Points before adding an executable Extension category.
- **Expected result:** Future growth extends the frozen foundation rather than bypassing it.

---

## Major Findings

### AV3-M01 — Node and Connection identity conflicted with the universal Object Model

- **ID:** AV3-M01
- **Status:** Applied
- **Affected documents:** `Product_Bible_V2/00_Foundation/03_Domain.md`; `Product_Bible_V2/01_Runtime/01_Cosmos.md`; `Product_Bible_V2/01_Runtime/08_Object.md`; `Product_Bible_V2/01_Runtime/09_Node.md`; `Product_Bible_V2/01_Runtime/10_Relationship.md`; `Experience_V1/experience/01_Cosmos/03_Nodes.md`; `Experience_V1/experience/01_Cosmos/04_Connections.md`
- **Problem:** Product Bible described Nodes as non-Object wrappers and Connections as Relationships, while Experience used Node Objects and also distinguished structural and semantic Connections.
- **Reason:** This created duplicate identity and reopened competing Version 1 Relationship types.
- **Required change:** Define Node as an Object role. Define Connection as an Object representation of structural placement, an accepted `Related` Relationship or a non-persistent discovery candidate. Keep `Related` as the only persistent Version 1 Relationship type.
- **Expected result:** Visual provenance is explicit without changing the Relationship schema or duplicating Object identity.

### AV3-M02 — User Tag automation contradicted user ownership

- **ID:** AV3-M02
- **Status:** Applied
- **Affected documents:** `Product_Bible_V2/00_Foundation/03_Domain.md`; `Product_Bible_V2/01_Runtime/08_Object.md`; `Product_Bible_V2/01_Runtime/11_Knowledge.md`; `Product_Bible_V2/01_Runtime/12_Tag.md`; `Product_Bible_V2/03_Bundled_Extensions/User_Tools/01_Capture.md`; `Product_Bible_V2/03_Bundled_Extensions/User_Tools/04_Blueprint_Builder.md`; `Experience_V1/experience/01_Cosmos/07_Object_Model.md`; `Experience_V1/experience/03_Shell/05_Focus.md`
- **Problem:** Experience automatically created a canonical User Tag from every Object name, while Product Bible said Cosmos never silently changes User Tags. Context inheritance also blurred suggestions and persisted tags.
- **Reason:** A system-created User Tag is not user-defined meaning and creates hidden mutation rules.
- **Required change:** Keep names in Identity metadata. Apply structural System Tags automatically. Treat inherited or generated User Tags as Context or suggestions unless the user explicitly applies them or chooses an explicitly tagged creation action.
- **Expected result:** User Tags remain user-owned while search, grouping and discovery still work.

### AV3-M03 — Workspace and Focus documents collapsed additive multi-Project Context into one Project

- **ID:** AV3-M03
- **Status:** Applied
- **Affected documents:** `Experience_V1/experience/02_Base/04_Workspaces.md`; `Experience_V1/experience/03_Shell/05_Focus.md`; `Product_Bible_V2/01_Runtime/02_Project.md`; `Product_Bible_V2/01_Runtime/14_Context.md`; `Product_Bible_V2/02_Technical_Architecture/06_Project_Runtime.md`
- **Problem:** Experience described one assigned Project becoming the complete Context, while Product Bible supports zero, one or multiple assigned Project scopes plus optional focus.
- **Reason:** Cross-Project Workspaces and Direct Tool Mode would lose valid scopes or require a second selection model.
- **Required change:** Make Workspace scope plural and additive. Define Focus as optional emphasis/defaults that never replace assigned scopes.
- **Expected result:** Every Tool, including Journeyman, receives one canonical additive Context model.

### AV3-M04 — Prepared Structures had no Product Bible creation, persistence or recovery contract

- **ID:** AV3-M04
- **Status:** Applied
- **Affected documents:** `Product_Bible_V2/01_Runtime/02_Project.md`; `Product_Bible_V2/01_Runtime/03_Project_Structure.md`; `Product_Bible_V2/01_Runtime/08_Object.md`; `Product_Bible_V2/02_Technical_Architecture/03_Runtime_Services.md`; `Product_Bible_V2/02_Technical_Architecture/05_Persistence.md`; `Product_Bible_V2/02_Technical_Architecture/06_Project_Runtime.md`; `Experience_V1/experience/07_Extensibility/01_Automatic_Project_Structure.md`; `Experience_V1/experience/07_Extensibility/03_Prepared_Structures.md`; `Experience_V1/experience/07_Extensibility/05_Extension_Points.md`
- **Problem:** Experience required physical Prepared Structures and prohibited Ghost Structures, but Product Bible did not define creation sequencing, authoritative records, loading or failure behavior.
- **Reason:** UI and providers could advertise paths that did not exist, or native repository ownership could be overwritten accidentally.
- **Required change:** Define the six prepared Project-managed areas (`Knowledge`, `Files`, `Themes`, `Workspaces`, `Templates`, `Extensions`), stage and persist them through Project Service/Persistence, expose them only after physical success, and reconcile failures through Recovery.
- **Expected result:** Empty prepared locations are real and predictable, while native Resource trees remain independent.

### AV3-M05 — Structure Templates overlapped Object Blueprints and lacked an implementation owner

- **ID:** AV3-M05
- **Status:** Applied
- **Affected documents:** `Product_Bible_V2/01_Runtime/03_Project_Structure.md`; `Product_Bible_V2/02_Technical_Architecture/01_Extension_System.md`; `Product_Bible_V2/02_Technical_Architecture/02_Registry_System.md`; `Product_Bible_V2/02_Technical_Architecture/03_Runtime_Services.md`; `Product_Bible_V2/03_Bundled_Extensions/User_Tools/04_Blueprint_Builder.md`; `Product_Bible_V2/07_System_Tools/02_Analysis_Engine.md`; `Experience_V1/experience/07_Extensibility/04_Structure_Templates.md`
- **Problem:** Experience defined independent Structure Template Objects, while Product Bible only had Blueprint registries and allowed Object Blueprints to imply child structure.
- **Reason:** Implementers could add a fourth registry, store grouped templates or make one definition own both schema and hierarchy.
- **Required change:** Keep Object Blueprints responsible for one Object's tags, schema and complete defaults. Keep Structure Templates as independent `Template + Structure` Objects with parent-child template references, managed by Object Service and collected through Tags.
- **Expected result:** Reusable hierarchy and reusable Object schema are distinct without a parallel template subsystem.

### AV3-M06 — System Projects were absent from the implementation contract and Journeyman implied an extra Project model

- **ID:** AV3-M06
- **Status:** Applied
- **Affected documents:** `Product_Bible_V2/00_Foundation/03_Domain.md`; `Product_Bible_V2/01_Runtime/02_Project.md`; `Product_Bible_V2/02_Technical_Architecture/01_Extension_System.md`; `Product_Bible_V2/02_Technical_Architecture/02_Registry_System.md`; `Product_Bible_V2/07_System_Tools/03_Journeyman.md`; `Experience_V1/experience/07_Extensibility/02_System_Projects.md`; `Experience_V1/experience/07_Extensibility/06_Journeyman_Extensibility.md`
- **Problem:** Experience treated System Projects as normal tagged Projects but Product Bible did not define them; Journeyman wording could imply a fourth Version 1 System Project.
- **Reason:** A special Project registry, lifecycle or Context path could be implemented.
- **Required change:** Define `Project + System` as the only distinction. Keep the Version 1 list at Knowledge Workspace, Creation Workspace and Graphics Workspace. Host Journeyman in Creation Workspace.
- **Expected result:** System capabilities extend Cosmos through the same Project model without expanding Version 1 scope.

### AV3-M07 — Journeyman was described as both the experience and the implementation engine

- **ID:** AV3-M07
- **Status:** Applied
- **Affected documents:** `Product_Bible_V2/01_Runtime/03_Project_Structure.md`; `Product_Bible_V2/01_Runtime/13_Resource.md`; `Product_Bible_V2/02_Technical_Architecture/06_Project_Runtime.md`; `Product_Bible_V2/02_Technical_Architecture/10_Repository_Runtime.md`; `Product_Bible_V2/02_Technical_Architecture/15_Codex_Execution_Rules.md`; `Product_Bible_V2/07_System_Tools/03_Journeyman.md`; `Product_Bible_V2/07_System_Tools/04_Repository_Analyzer.md`; `Experience_V1/experience/07_Extensibility/06_Journeyman_Extensibility.md`
- **Problem:** Experience made Journeyman provider-neutral with Codex behind it, while Product Bible called Journeyman the autonomous worker that directly implemented changes.
- **Reason:** Provider selection, execution, task ownership and mutation authority would be coupled to one UI experience.
- **Required change:** Make Journeyman an independent Cosmos Tool and the development-task interaction and orchestration layer, Provider Runtime the concrete Provider owner, Codex the first Version 1 development Provider, and Runtime Services the durable Cosmos mutation owners. Keep the Companion an independent Entity rather than a Journeyman identity or avatar.
- **Expected result:** Providers can change without changing the Journeyman Tool, the Companion remains independently evolvable, and neither concept bypasses Runtime contracts.

### AV3-M08 — Entity identity and Relationship eligibility conflicted with universal Objects

- **ID:** AV3-M08
- **Status:** Applied
- **Affected documents:** `Product_Bible_V2/00_Foundation/03_Domain.md`; `Product_Bible_V2/01_Runtime/08_Object.md`; `Product_Bible_V2/04_Entities/01_Entity.md`; `Product_Bible_V2/04_Entities/02_Entity_Runtime.md`; `Product_Bible_V2/04_Entities/05_Entity_Interaction.md`
- **Problem:** Entity used a separate immutable Entity identity and documents stated that Entities could not be Relationship endpoints because only Objects could.
- **Reason:** Under the universal Object Model, an independently interactive Entity must be an Object and cannot maintain a competing ID.
- **Required change:** Use the immutable Object ID as Entity ID. Permit explicitly accepted `Related` Relationships involving Entity Objects while keeping familiarity and interaction history separate and non-automatic.
- **Expected result:** Entity presence reuses universal identity without turning social state into hidden Relationships.

### AV3-M09 — Reusable definition identity could diverge from Registry identity

- **ID:** AV3-M09
- **Status:** Applied
- **Affected documents:** `Product_Bible_V2/01_Runtime/08_Object.md`; `Product_Bible_V2/02_Technical_Architecture/01_Extension_System.md`; `Product_Bible_V2/02_Technical_Architecture/02_Registry_System.md`; `Product_Bible_V2/02_Technical_Architecture/03_Runtime_Services.md`; `Experience_V1/experience/04_Themes/01_Theme_Architecture.md`; `Experience_V1/experience/07_Extensibility/04_Structure_Templates.md`
- **Problem:** Experience made Themes and Templates Objects, while Product registries assigned definition IDs without relating them to Object identity.
- **Reason:** One user-visible definition could receive an Object ID and a competing Registry identity.
- **Required change:** Treat user-addressable definitions as Objects. Registry entries index validated category payloads and versions without creating a second identity. Normal Structure Templates and System Projects use Object/Tag queries and receive no registry category.
- **Expected result:** Discovery is specialized where necessary while identity remains universal.

---

## Minor Findings

### AV3-m01 — Object type and class terminology remained in active contracts

- **ID:** AV3-m01
- **Status:** Applied
- **Affected documents:** `Product_Bible_V2/01_Runtime/02_Project.md`; `Product_Bible_V2/01_Runtime/08_Object.md`; `Product_Bible_V2/03_Bundled_Extensions/User_Tools/04_Blueprint_Builder.md`; `Product_Bible_V2/03_Bundled_Extensions/User_Tools/05_Workspace_Builder.md`; `Product_Bible_V2/07_System_Tools/02_Analysis_Engine.md`; `Product_Bible_V2/07_System_Tools/04_Repository_Analyzer.md`; `Experience_V1/experience/01_Cosmos/07_Object_Model.md`; `Experience_V1/experience/07_Extensibility/05_Extension_Points.md`
- **Problem:** Active prose still requested new Object types or classes.
- **Reason:** The terminology invites exclusive class hierarchies instead of tag composition.
- **Required change:** Replace type/class language with Object roles, System Tag combinations and Property Schemas where it describes Cosmos architecture.
- **Expected result:** Terminology directs implementation toward the universal model while source-code class analysis remains unaffected.

### AV3-m02 — Blueprint actions and analysis output omitted their category

- **ID:** AV3-m02
- **Status:** Applied
- **Affected documents:** `Product_Bible_V2/03_Bundled_Extensions/User_Tools/02_Review.md`; `Product_Bible_V2/07_System_Tools/02_Analysis_Engine.md`; `Product_Bible_V2/07_System_Tools/04_Repository_Analyzer.md`
- **Problem:** Generic “create Blueprint” and “active Blueprint” wording could not select a Service owner or schema.
- **Reason:** Product Bible retains three distinct definition categories with different owners.
- **Required change:** Require Object Blueprint, Capture Template or Workspace Blueprint at action boundaries and distinguish Structure Templates explicitly.
- **Expected result:** Commands, validation and Registry lookups are deterministic.

### AV3-m03 — Local contract wording still permitted duplicate authorities

- **ID:** AV3-m03
- **Status:** Applied
- **Affected documents:** `Product_Bible_V2/02_Technical_Architecture/08_Tool_Runtime.md`; `Product_Bible_V2/04_Entities/01_Entity.md`; `Product_Bible_V2/04_Entities/02_Entity_Runtime.md`; `Product_Bible_V2/04_Entities/03_Entity_Roles.md`; `Product_Bible_V2/04_Entities/05_Entity_Interaction.md`; `Product_Bible_V2/06_Companion/05_Personality.md`; `Product_Bible_V2/07_System_Tools/08_Theme_Runtime.md`
- **Problem:** Tool Runtime permission “validation,” mixed `Behavior`/`Behaviour` contract labels, two highest Entity priorities, and Theme Runtime registration wording allowed duplicate owners or API names.
- **Reason:** These localized ambiguities can still generate incompatible implementation symbols or enforcement paths.
- **Required change:** Mark Tool checks as non-authoritative preflight, use the `Behaviour` contract name and `Critical` highest priority, and keep Theme registration in Extension System/Theme Registry.
- **Expected result:** Each contract has one name and one authoritative owner.

### AV3-m04 — Prepared area names differed between Experience documents

- **ID:** AV3-m04
- **Status:** Applied
- **Affected documents:** `Experience_V1/experience/07_Extensibility/00_Overview.md`; `Experience_V1/experience/07_Extensibility/01_Automatic_Project_Structure.md`; `Experience_V1/experience/07_Extensibility/02_System_Projects.md`; `Experience_V1/experience/07_Extensibility/03_Prepared_Structures.md`; `Product_Bible_V2/01_Runtime/02_Project.md`; `Product_Bible_V2/01_Runtime/03_Project_Structure.md`
- **Problem:** The same prepared foundation alternated between `Theme`/`Themes` and `Extension Points`/`Extensions`.
- **Reason:** Physical creation requires one manifest vocabulary.
- **Required change:** Standardize the six Project-managed prepared areas as `Knowledge`, `Files`, `Themes`, `Workspaces`, `Templates`, `Extensions`; Extension Points live within the appropriate prepared structures.
- **Expected result:** Project creation and documentation refer to the same physical foundation.

---

## Suggestions

### AV3-S01 — Preserve earlier reviews without allowing stale freeze conclusions to remain current

- **ID:** AV3-S01
- **Status:** Applied
- **Affected documents:** `Product_Bible_V2/ARCHITECTURE_AUDIT.md`; `Product_Bible_V2/ARCHITECTURE_REVIEW_V1.md`; `Product_Bible_V2/ARCHITECTURE_REVIEW_V2.md`; `Experience_V1/REVIEW_REPORT.md`
- **Problem:** Earlier reports contained obsolete contradiction and readiness statements but remained inside the reviewed collections.
- **Reason:** Deleting history loses evidence; leaving it unqualified creates false current authority.
- **Required change:** Add explicit historical/superseded notices linking to this V3 review.
- **Expected result:** Historical reasoning remains available without contradicting the current freeze.

### AV3-S02 — Repair malformed Markdown before implementation handoff

- **ID:** AV3-S02
- **Status:** Applied
- **Affected documents:** `Product_Bible_V2/02_Technical_Architecture/02_Registry_System.md`; `Product_Bible_V2/04_Entities/02_Entity_Runtime.md`; `Product_Bible_V2/04_Entities/06_Entity_Permissions.md`; `Product_Bible_V2/05_Capability_Bundles/01_Capability_Bundles.md`; `Product_Bible_V2/05_Capability_Bundles/02_Bundle_Runtime.md`; `Product_Bible_V2/07_System_Tools/03_Journeyman.md`
- **Problem:** Unclosed code fences hid normative prose and headings inside code blocks.
- **Reason:** Renderers and implementation tooling could not reliably distinguish examples from requirements.
- **Required change:** Close every fence at the intended example boundary and rebuild the Journeyman document with valid structure.
- **Expected result:** All Markdown files have balanced fenced-code delimiters and normative prose renders normally.

---

## Consistency verification

- Markdown documents reviewed: **107 of 107**
- Product Bible documents reviewed: **69 of 69**
- Experience documents reviewed: **38 of 38**
- Existing documents changed: **56**
- Unreadable Markdown files: **0**
- Files with unbalanced fenced-code delimiters after synchronization: **0**
- Active Product Bible uses of obsolete `Object type`/`Object types`: **0**
- Active contract uses of `Behavior Profile`, `Behavior Rules` or `Behavior configuration`: **0**
- Active generic `create Blueprint` or `active Blueprint` action boundaries: **0**
- Persistent Version 1 Relationship types: **1 (`Related`)**
- Version 1 System Project classes: **0**
- Structure Template registries or grouped-template record types: **0**
- Ghost Prepared Structures permitted: **0**

## Architecture freeze decision

### Approved Version 1 product clarifications

The following product decisions are part of the Version 1 freeze:

- Workspace Environment Windows have fixed placement and fixed size. Tool Windows are movable, resizable and closable. Version 1 provides no minimize, maximize / restore, docking or snapping.
- Journeyman is an independent Cosmos Tool for planning, orchestration and development assistance. Each instance uses its own Tool Window inside a Workspace.
- The Companion is an independent Cosmos Entity with its own visual identity and progression. It is not Journeyman and never represents Journeyman visually.
- Archive supports direct inline editing in the same Object View. Separate edit windows are outside Version 1.
- Files may create, edit, rename, move and delete files only inside the active Cosmos Project's authorized physical roots. It never manages arbitrary user files outside that Project.

These clarifications preserve the existing Runtime ownership model: Tools use Runtime Services, the Companion uses Entity Runtime, Resource Service authorizes project-file mutations, and Provider Runtime remains the concrete development Provider owner.

---

**READY FOR VERSION 1 IMPLEMENTATION**

Product Bible and Experience now describe one architecture: universal Object identity, System-Tag-composed roles, complete Property Schemas, user-owned Tags, presentation-only Themes, physical Prepared Structures, independent Structure Template Objects, normal tagged System Projects, an independent provider-neutral Journeyman Tool with Codex as the first development Provider, and a separate Companion Entity.

No remaining contradiction found in this review requires architectural reinterpretation before Version 1 implementation.
