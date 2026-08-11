from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from enum import StrEnum

from cosmos.config import RuntimeSettings
from cosmos.persistence import (
    AssetCatalogRepository,
    CaptureDraftRepository,
    JobRepository,
    KnowledgeVersionRepository,
    ObjectRepository,
    RelationshipRepository,
    RuntimeStateRepository,
    SQLitePersistence,
    ThemePackageRepository,
)
from cosmos.runtime import (
    CommandToolAdapter,
    DesktopToolAdapter,
    EventDispatcher,
    NativeToolAdapter,
    ProviderRuntime,
    Registry,
    RuntimeContext,
    ServiceToolAdapter,
    ToolAdapterRegistry,
    ToolRuntime,
    WebToolAdapter,
)
from cosmos.services import (
    BaseService,
    CompanionService,
    CoreToolCatalog,
    CosmosMapService,
    JobService,
    JourneymanService,
    KnowledgeService,
    NotificationService,
    ObjectInteractionService,
    ObjectService,
    ProjectService,
    RelationshipService,
    ResourceService,
    ReviewService,
    TagService,
    ThemeBuilderService,
    ThemePackageImportService,
    ThemePackageService,
    ToolService,
    WorkspaceService,
    create_version_one_object_contract,
)


class StartupPhase(StrEnum):
    CREATED = "created"
    INITIALIZING_PERSISTENCE = "initializing_persistence"
    VALIDATING_RUNTIME = "validating_runtime"
    READY = "ready"
    FAILED = "failed"
    STOPPED = "stopped"


@dataclass(frozen=True, slots=True)
class StartupReport:
    phase: StartupPhase
    started_at: datetime | None = None
    completed_at: datetime | None = None
    failure: str | None = None


@dataclass(slots=True)
class CosmosRuntime:
    settings: RuntimeSettings
    persistence: SQLitePersistence
    registry: Registry
    events: EventDispatcher
    providers: ProviderRuntime
    objects: ObjectService
    tags: TagService
    object_interactions: ObjectInteractionService
    notifications: NotificationService
    projects: ProjectService
    relationships: RelationshipService
    runtime_state: RuntimeStateRepository
    theme_packages: ThemePackageService
    theme_package_import: ThemePackageImportService
    theme_builder: ThemeBuilderService
    companion: CompanionService
    base: BaseService
    tools: ToolService
    workspaces: WorkspaceService
    cosmos_map: CosmosMapService
    core_tools: CoreToolCatalog
    jobs: JobService
    resources: ResourceService
    knowledge: KnowledgeService
    reviews: ReviewService
    journeyman: JourneymanService
    startup: StartupReport = StartupReport(phase=StartupPhase.CREATED)

    @classmethod
    def build(cls, settings: RuntimeSettings) -> CosmosRuntime:
        registry = Registry()
        persistence = SQLitePersistence(settings.database_path)
        events = EventDispatcher()
        providers = ProviderRuntime(registry)
        objects = ObjectService(
            create_version_one_object_contract(),
            ObjectRepository(persistence),
            events,
        )
        projects = ProjectService(settings.runtime_path, persistence, objects, events)
        relationships = RelationshipService(RelationshipRepository(persistence), objects, events)
        tags = TagService(objects, events)
        object_interactions = ObjectInteractionService(objects, tags, relationships)
        notifications = NotificationService(objects)
        notifications.connect(events)
        companion = CompanionService(objects)
        base = BaseService(objects, companion)
        runtime_state = RuntimeStateRepository(persistence)
        theme_package_repository = ThemePackageRepository(persistence)
        asset_catalog_repository = AssetCatalogRepository(persistence)
        theme_packages = ThemePackageService(persistence, theme_package_repository)
        theme_package_import = ThemePackageImportService(
            persistence,
            theme_package_repository,
            asset_catalog_repository,
            settings.runtime_path,
        )
        resources = ResourceService(
            projects,
            objects,
            events,
            persistence,
            asset_catalog_repository,
            settings.runtime_path,
        )
        theme_builder = ThemeBuilderService(objects, resources)
        tool_adapters = ToolAdapterRegistry()
        tool_adapters.register(NativeToolAdapter())
        tool_adapters.register(WebToolAdapter())
        tool_adapters.register(ServiceToolAdapter())
        tool_adapters.register(CommandToolAdapter())
        tool_adapters.register(DesktopToolAdapter())
        tools = ToolService(objects, ToolRuntime(objects.contract), events, registry, tool_adapters)
        workspaces = WorkspaceService(objects, runtime_state, tools, events)
        jobs = JobService(JobRepository(persistence), events)
        knowledge = KnowledgeService(
            persistence,
            objects,
            KnowledgeVersionRepository(persistence),
            CaptureDraftRepository(persistence),
            jobs,
        )
        return cls(
            settings=settings,
            persistence=persistence,
            registry=registry,
            events=events,
            providers=providers,
            objects=objects,
            tags=tags,
            object_interactions=object_interactions,
            notifications=notifications,
            projects=projects,
            relationships=relationships,
            runtime_state=runtime_state,
            theme_packages=theme_packages,
            theme_package_import=theme_package_import,
            theme_builder=theme_builder,
            companion=companion,
            base=base,
            tools=tools,
            workspaces=workspaces,
            cosmos_map=CosmosMapService(
                objects,
                relationships,
                runtime_state,
                companion,
            ),
            core_tools=CoreToolCatalog(objects, registry),
            jobs=jobs,
            resources=resources,
            knowledge=knowledge,
            reviews=ReviewService(objects),
            journeyman=JourneymanService(objects, providers, jobs),
        )

    def initialize(self) -> None:
        if self.startup.phase is StartupPhase.READY:
            return

        started_at = datetime.now(UTC)
        try:
            self.startup = StartupReport(
                phase=StartupPhase.INITIALIZING_PERSISTENCE,
                started_at=started_at,
            )
            self.settings.runtime_path.mkdir(parents=True, exist_ok=True)
            self.persistence.initialize()

            self.startup = StartupReport(
                phase=StartupPhase.VALIDATING_RUNTIME,
                started_at=started_at,
            )
            if not self.persistence.is_ready():
                raise RuntimeError("Persistence did not become ready during startup.")

            system_context = RuntimeContext(
                permissions=frozenset(
                    {
                        "objects.read",
                        "objects.write",
                        "tags.read",
                        "tags.write",
                        "projects.read",
                        "projects.write",
                        "relationships.read",
                        "relationships.write",
                        "runtime_state.read",
                        "runtime_state.write",
                        "tools.read",
                        "tools.write",
                        "workspaces.read",
                        "workspaces.write",
                        "resources.read",
                        "resources.write",
                        "knowledge.read",
                        "knowledge.write",
                        "drafts.read",
                        "drafts.write",
                        "reviews.read",
                        "reviews.write",
                        "jobs.read",
                        "jobs.write",
                        "journeyman.read",
                        "journeyman.write",
                        "notifications.read",
                        "notifications.write",
                    }
                )
            )
            self.projects.ensure_version_one_system_projects(system_context)
            self.core_tools.ensure_version_one(system_context)
            self.companion.ensure_default(system_context)
            self.base.ensure_default(system_context)
            self.jobs.initialize()

            self.startup = StartupReport(
                phase=StartupPhase.READY,
                started_at=started_at,
                completed_at=datetime.now(UTC),
            )
        except Exception as error:
            self.startup = StartupReport(
                phase=StartupPhase.FAILED,
                started_at=started_at,
                completed_at=datetime.now(UTC),
                failure=str(error),
            )
            raise

    def shutdown(self) -> None:
        self.jobs.shutdown()
        self.startup = StartupReport(
            phase=StartupPhase.STOPPED,
            started_at=self.startup.started_at,
            completed_at=datetime.now(UTC),
        )

    def ready(self) -> bool:
        return self.startup.phase is StartupPhase.READY and self.persistence.is_ready()
