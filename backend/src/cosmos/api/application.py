from __future__ import annotations

import base64
import binascii
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from dataclasses import replace
from datetime import UTC, datetime

from starlette.applications import Starlette
from starlette.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from starlette.routing import Route

from cosmos import __version__
from cosmos.bootstrap import CosmosRuntime
from cosmos.config import RuntimeSettings
from cosmos.runtime import RuntimeContext
from cosmos.services import RuntimeServiceError, ThemePackageImportError

THEME_RUNTIME_STATE_SCOPE = "cosmos.theme"
THEME_RUNTIME_STATE_KEY = "activation"
EMPTY_THEME_RUNTIME_STATE = {
    "schemaVersion": 1,
    "activeThemeId": None,
    "lastKnownGoodThemeId": None,
}


async def health(_: Request) -> JSONResponse:
    return JSONResponse({"service": "cosmos", "status": "ok", "version": __version__})


async def readiness(request: Request) -> JSONResponse:
    runtime: CosmosRuntime = request.app.state.runtime
    ready = runtime.ready()
    return JSONResponse(
        {"service": "cosmos", "status": "ready" if ready else "not_ready"},
        status_code=200 if ready else 503,
    )


async def cosmos_map(request: Request) -> JSONResponse:
    try:
        return JSONResponse(request.app.state.runtime.cosmos_map.snapshot(_local_owner_context()))
    except RuntimeServiceError as error:
        return _service_error(error)


async def base_snapshot(request: Request) -> JSONResponse:
    try:
        return JSONResponse(request.app.state.runtime.base.snapshot(_local_owner_context()))
    except RuntimeServiceError as error:
        return _service_error(error)


async def theme_runtime_state(request: Request) -> JSONResponse:
    if request.method == "GET":
        value = request.app.state.runtime.runtime_state.get(
            THEME_RUNTIME_STATE_SCOPE,
            THEME_RUNTIME_STATE_KEY,
            EMPTY_THEME_RUNTIME_STATE,
        )
        return JSONResponse(_theme_runtime_state_payload(value))

    try:
        payload = _theme_runtime_state_payload(await _json_object(request), require_ids=True)
        request.app.state.runtime.runtime_state.set(
            THEME_RUNTIME_STATE_SCOPE,
            THEME_RUNTIME_STATE_KEY,
            payload,
            datetime.now(UTC),
        )
        return JSONResponse(payload)
    except RuntimeServiceError as error:
        return _service_error(error)


async def theme_packages(request: Request) -> JSONResponse:
    try:
        service = request.app.state.runtime.theme_packages
        context = _local_owner_context()
        if request.method == "GET":
            return JSONResponse({"items": service.list_installed(context)})
        return JSONResponse(
            service.install_prevalidated(await _json_object(request), context),
            status_code=201,
        )
    except RuntimeServiceError as error:
        return _service_error(error)


async def theme_package_import(request: Request) -> JSONResponse:
    service = request.app.state.runtime.theme_package_import
    try:
        media_type = request.headers.get("content-type", "").partition(";")[0].strip().lower()
        if media_type != "application/zip":
            raise ThemePackageImportError(
                "theme_package_media_type_invalid",
                'Theme Package import requires Content-Type "application/zip".',
            )
        content_length = request.headers.get("content-length")
        if content_length is not None:
            try:
                declared_length = int(content_length)
            except ValueError as error:
                raise ThemePackageImportError(
                    "theme_package_request_invalid",
                    "Theme Package Content-Length is invalid.",
                ) from error
            if declared_length < 0 or declared_length > service.maximum_archive_bytes:
                raise ThemePackageImportError(
                    "theme_package_too_large",
                    "Theme Package archive exceeds the intake limit.",
                )

        chunks: list[bytes] = []
        received = 0
        async for chunk in request.stream():
            received += len(chunk)
            if received > service.maximum_archive_bytes:
                raise ThemePackageImportError(
                    "theme_package_too_large",
                    "Theme Package archive exceeds the intake limit.",
                )
            chunks.append(chunk)
        if received == 0:
            raise ThemePackageImportError(
                "theme_package_request_invalid",
                "Theme Package archive is empty.",
            )
        return JSONResponse(
            service.import_archive(b"".join(chunks), _local_owner_context()),
            status_code=201,
        )
    except ThemePackageImportError as error:
        status_code = 409 if error.code == "theme_package_conflict" else 422
        if error.code in {
            "theme_package_entry_too_large",
            "theme_package_too_large",
            "theme_package_too_many_files",
        }:
            status_code = 413
        return JSONResponse(error.result(), status_code=status_code)


async def theme_builder_projects(request: Request) -> JSONResponse:
    try:
        service = request.app.state.runtime.theme_builder
        context = _local_owner_context()
        if request.method == "GET":
            return JSONResponse({"items": service.list(context)})
        payload = await _json_object(request)
        return JSONResponse(
            service.create(
                name=_string(payload, "name"),
                description=_optional_string(payload, "description"),
                author=_optional_string(payload, "author"),
                context=context,
            ),
            status_code=201,
        )
    except RuntimeServiceError as error:
        return _service_error(error)


async def theme_builder_project(request: Request) -> JSONResponse:
    try:
        service = request.app.state.runtime.theme_builder
        context = _local_owner_context()
        project_id = request.path_params["builder_project_id"]
        if request.method == "GET":
            return JSONResponse(service.get(project_id, context))
        payload = await _json_object(request)
        metadata = payload.get("metadata")
        if not isinstance(metadata, dict):
            raise RuntimeServiceError("validation_failed", "metadata must be an object.")
        expected_revision = payload.get("expectedRevision")
        if isinstance(expected_revision, bool) or not isinstance(expected_revision, int):
            raise RuntimeServiceError(
                "validation_failed",
                "expectedRevision must be an integer.",
            )
        return JSONResponse(
            service.save_draft(
                project_id,
                expected_revision=expected_revision,
                name=_string(metadata, "name"),
                description=_optional_string(metadata, "description"),
                author=_optional_string(metadata, "author"),
                asset_refs=_array(payload, "assetRefs"),
                artifacts=payload.get("artifacts"),
                context=context,
            )
        )
    except RuntimeServiceError as error:
        return _service_error(error)


async def theme_builder_export(request: Request) -> Response:
    try:
        content, filename = request.app.state.runtime.theme_builder.export_package(
            request.path_params["builder_project_id"],
            _local_owner_context(),
        )
        return Response(
            content,
            media_type="application/zip",
            headers={
                "Content-Disposition": f'attachment; filename="{filename}"',
                "Cache-Control": "no-store",
                "X-Content-Type-Options": "nosniff",
            },
        )
    except RuntimeServiceError as error:
        return _service_error(error)


async def update_camera(request: Request) -> JSONResponse:
    try:
        payload = await _json_object(request)
        value = request.app.state.runtime.cosmos_map.update_camera(
            _number(payload, "x"),
            _number(payload, "y"),
            _number(payload, "zoom"),
            _local_owner_context(),
        )
        return JSONResponse(value)
    except RuntimeServiceError as error:
        return _service_error(error)


async def update_selection(request: Request) -> JSONResponse:
    try:
        payload = await _json_object(request)
        object_id = payload.get("objectId")
        if object_id is not None and not isinstance(object_id, str):
            raise RuntimeServiceError("validation_failed", "objectId must be a string or null.")
        selected = request.app.state.runtime.cosmos_map.select(
            object_id,
            _local_owner_context(),
        )
        return JSONResponse({"objectId": selected})
    except RuntimeServiceError as error:
        return _service_error(error)


async def move_node(request: Request) -> JSONResponse:
    try:
        payload = await _json_object(request)
        node = request.app.state.runtime.cosmos_map.move_node(
            request.path_params["object_id"],
            _number(payload, "x"),
            _number(payload, "y"),
            _local_owner_context(),
        )
        return JSONResponse(
            {
                "objectId": node.identity.object_id,
                "x": node.properties["position_x"],
                "y": node.properties["position_y"],
            }
        )
    except RuntimeServiceError as error:
        return _service_error(error)


async def companion_message(request: Request) -> JSONResponse:
    try:
        payload = await _json_object(request)
        message = payload.get("message")
        if not isinstance(message, str):
            raise RuntimeServiceError("validation_failed", "Conversation message must be a string.")
        context = _companion_context(request, payload)
        reply = request.app.state.runtime.companion.reply(message, context)
        return JSONResponse({"message": reply.message, "mode": reply.mode})
    except RuntimeServiceError as error:
        return _service_error(error)


async def object_details(request: Request) -> JSONResponse:
    try:
        service = request.app.state.runtime.object_interactions
        object_id = request.path_params["object_id"]
        context = _object_context(request, object_id)
        if request.method == "GET":
            return JSONResponse(service.inspect(object_id, context))
        return JSONResponse(service.update(object_id, await _json_object(request), context))
    except RuntimeServiceError as error:
        return _service_error(error)


async def object_actions(request: Request) -> JSONResponse:
    try:
        return JSONResponse(
            request.app.state.runtime.object_interactions.actions(
                request.path_params["object_id"],
                _object_context(request, request.path_params["object_id"]),
            )
        )
    except RuntimeServiceError as error:
        return _service_error(error)


async def notifications(request: Request) -> JSONResponse:
    try:
        return JSONResponse(request.app.state.runtime.notifications.list(_local_owner_context()))
    except RuntimeServiceError as error:
        return _service_error(error)


async def notification(request: Request) -> JSONResponse:
    try:
        payload = await _json_object(request)
        read = payload.get("read")
        if not isinstance(read, bool):
            raise RuntimeServiceError("validation_failed", "read must be a boolean.")
        return JSONResponse(
            request.app.state.runtime.notifications.mark_read(
                request.path_params["notification_id"],
                read,
                _local_owner_context(),
            )
        )
    except RuntimeServiceError as error:
        return _service_error(error)


async def workspace_definition(request: Request) -> JSONResponse:
    try:
        return JSONResponse(
            request.app.state.runtime.workspaces.definition(
                request.path_params["workspace_id"], _local_owner_context()
            )
        )
    except RuntimeServiceError as error:
        return _service_error(error)


async def open_workspace(request: Request) -> JSONResponse:
    try:
        payload = await _json_object(request)
        value = request.app.state.runtime.workspaces.open(
            request.path_params["workspace_id"],
            _string(payload, "roomId"),
            _local_owner_context(),
        )
        return JSONResponse(value, status_code=201)
    except RuntimeServiceError as error:
        return _service_error(error)


async def workspace_session(request: Request) -> JSONResponse:
    try:
        session_id = request.path_params["session_id"]
        owner = _local_owner_context()
        if request.method == "GET":
            return JSONResponse(request.app.state.runtime.workspaces.get(session_id, owner))
        if request.method == "DELETE":
            return JSONResponse(request.app.state.runtime.workspaces.close(session_id, owner))
        payload = await _json_object(request)
        state = payload.get("restorableState")
        if not isinstance(state, dict):
            raise RuntimeServiceError("validation_failed", "restorableState must be an object.")
        return JSONResponse(request.app.state.runtime.workspaces.save_state(session_id, state, owner))
    except RuntimeServiceError as error:
        return _service_error(error)


async def focus_workspace(request: Request) -> JSONResponse:
    try:
        return JSONResponse(
            request.app.state.runtime.workspaces.focus(
                request.path_params["session_id"], _local_owner_context()
            )
        )
    except RuntimeServiceError as error:
        return _service_error(error)


async def open_workspace_tool(request: Request) -> JSONResponse:
    try:
        payload = await _json_object(request)
        bounds = payload.get("bounds")
        if not isinstance(bounds, dict):
            raise RuntimeServiceError("validation_failed", "bounds must be an object.")
        value = request.app.state.runtime.workspaces.open_tool(
            request.path_params["session_id"],
            _string(payload, "toolDefinitionId"),
            bounds,
            _local_owner_context(),
        )
        return JSONResponse(value, status_code=201)
    except RuntimeServiceError as error:
        return _service_error(error)


async def workspace_tool(request: Request) -> JSONResponse:
    try:
        session_id = request.path_params["session_id"]
        instance_id = request.path_params["instance_id"]
        owner = _local_owner_context()
        if request.method == "DELETE":
            return JSONResponse(
                request.app.state.runtime.workspaces.close_tool(session_id, instance_id, owner)
            )
        payload = await _json_object(request)
        return JSONResponse(
            request.app.state.runtime.workspaces.update_tool(session_id, instance_id, payload, owner)
        )
    except RuntimeServiceError as error:
        return _service_error(error)


async def tool_definitions(request: Request) -> JSONResponse:
    try:
        required_capabilities = frozenset(
            value.strip()
            for value in request.query_params.getlist("capability")
            if value.strip()
        )
        return JSONResponse(
            request.app.state.runtime.tools.definitions(
                _local_owner_context(), required_capabilities=required_capabilities
            )
        )
    except RuntimeServiceError as error:
        return _service_error(error)


async def asset_catalog(request: Request) -> JSONResponse:
    try:
        service = request.app.state.runtime.resources
        context = _local_owner_context()
        if request.method == "GET":
            return JSONResponse({"items": service.list_asset_catalog(context)})
        payload = await _json_object(request)
        original_base64 = _string(payload, "originalBytesBase64")
        try:
            original_bytes = base64.b64decode(original_base64, validate=True)
        except (binascii.Error, ValueError) as error:
            raise RuntimeServiceError(
                "validation_failed",
                "originalBytesBase64 must contain valid base64-encoded original bytes.",
            ) from error
        result = service.promote_visual_asset(
            payload.get("visualAsset"),
            payload.get("catalogEntry"),
            original_bytes,
            context,
        )
        return JSONResponse(result, status_code=201)
    except RuntimeServiceError as error:
        return _service_error(error)


async def visual_asset_content(request: Request) -> Response:
    try:
        content, mime_type, digest = request.app.state.runtime.resources.read_visual_asset(
            request.path_params["asset_id"],
            request.path_params["version"],
            _local_owner_context(),
        )
        return Response(
            content,
            media_type=mime_type,
            headers={
                "Cache-Control": "private, max-age=31536000, immutable",
                "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
                "ETag": f'"sha256-{digest}"',
                "X-Content-Type-Options": "nosniff",
            },
        )
    except RuntimeServiceError as error:
        return _service_error(error)


async def project_resource_projection(request: Request) -> JSONResponse:
    try:
        runtime = request.app.state.runtime
        project_id = request.path_params["project_id"]
        context = _project_context(runtime, project_id)
        from cosmos.services.project_resource_projection import project_resource_projection as project_resources

        return JSONResponse(project_resources(runtime.resources.tree(context)))
    except RuntimeServiceError as error:
        return _service_error(error)


async def project_files(request: Request) -> JSONResponse:
    try:
        context = _workspace_context(request)
        runtime = request.app.state.runtime
        if request.method == "GET":
            return JSONResponse(runtime.resources.tree(context, request.query_params.get("q", "")))
        payload = await _json_object(request)
        return JSONResponse(
            runtime.resources.create(_string(payload, "path"), _text(payload, "content"), context),
            status_code=201,
        )
    except RuntimeServiceError as error:
        return _service_error(error)


async def project_file(request: Request) -> JSONResponse:
    try:
        context = _workspace_context(request)
        runtime = request.app.state.runtime
        if request.method == "GET":
            return JSONResponse(runtime.resources.read(_query_path(request), context))
        if request.method == "DELETE":
            return JSONResponse(runtime.resources.delete(_query_path(request), context))
        payload = await _json_object(request)
        return JSONResponse(
            runtime.resources.edit(
                _string(payload, "path"),
                _text(payload, "content"),
                _string(payload, "expectedHash"),
                context,
            )
        )
    except RuntimeServiceError as error:
        return _service_error(error)


async def move_project_file(request: Request) -> JSONResponse:
    try:
        payload = await _json_object(request)
        return JSONResponse(
            request.app.state.runtime.resources.move(
                _string(payload, "sourcePath"),
                _string(payload, "destinationPath"),
                _workspace_context(request),
            )
        )
    except RuntimeServiceError as error:
        return _service_error(error)


async def archive(request: Request) -> JSONResponse:
    try:
        return JSONResponse(
            request.app.state.runtime.knowledge.list(
                _workspace_context(request), request.query_params.get("q", "")
            )
        )
    except RuntimeServiceError as error:
        return _service_error(error)


async def archive_object(request: Request) -> JSONResponse:
    try:
        context = _workspace_context(request)
        runtime = request.app.state.runtime
        knowledge_id = request.path_params["object_id"]
        if request.method == "GET":
            return JSONResponse(runtime.knowledge.get(knowledge_id, context))
        payload = await _json_object(request)
        return JSONResponse(
            runtime.knowledge.edit(
                knowledge_id,
                title=_string(payload, "title"),
                content=_text(payload, "content"),
                summary=_text(payload, "summary"),
                context=context,
            )
        )
    except RuntimeServiceError as error:
        return _service_error(error)


async def capture_drafts(request: Request) -> JSONResponse:
    try:
        return JSONResponse(request.app.state.runtime.knowledge.list_drafts(_workspace_context(request)))
    except RuntimeServiceError as error:
        return _service_error(error)


async def capture_draft(request: Request) -> JSONResponse:
    try:
        context = _workspace_context(request)
        service = request.app.state.runtime.knowledge
        draft_id = request.path_params["draft_id"]
        if request.method == "DELETE":
            service.delete_draft(draft_id, context)
            return JSONResponse({"draftId": draft_id, "deleted": True})
        payload = await _json_object(request)
        return JSONResponse(
            service.save_draft(
                draft_id,
                mode=_string(payload, "mode"),
                content=_text(payload, "content"),
                attachments=_array(payload, "attachments"),
                context=context,
            )
        )
    except RuntimeServiceError as error:
        return _service_error(error)


async def submit_capture(request: Request) -> JSONResponse:
    try:
        payload = await _json_object(request)
        draft_id = payload.get("draftId")
        return JSONResponse(
            request.app.state.runtime.knowledge.submit_capture(
                mode=_string(payload, "mode"),
                content=_text(payload, "content"),
                attachments=_array(payload, "attachments"),
                draft_id=draft_id if isinstance(draft_id, str) else None,
                context=_workspace_context(request),
            ),
            status_code=201,
        )
    except RuntimeServiceError as error:
        return _service_error(error)


async def reviews(request: Request) -> JSONResponse:
    try:
        include_resolved = request.query_params.get("includeResolved", "false").casefold() == "true"
        return JSONResponse(
            request.app.state.runtime.reviews.list(
                _workspace_context(request), include_resolved=include_resolved
            )
        )
    except RuntimeServiceError as error:
        return _service_error(error)


async def review_item(request: Request) -> JSONResponse:
    try:
        return JSONResponse(
            request.app.state.runtime.reviews.get(
                request.path_params["review_id"], _workspace_context(request)
            )
        )
    except RuntimeServiceError as error:
        return _service_error(error)


async def review_decision(request: Request) -> JSONResponse:
    try:
        payload = await _json_object(request)
        return JSONResponse(
            request.app.state.runtime.reviews.decide(
                request.path_params["review_id"],
                action=_string(payload, "action"),
                note=_text(payload, "note"),
                context=_workspace_context(request),
            )
        )
    except RuntimeServiceError as error:
        return _service_error(error)


async def journeyman_tasks(request: Request) -> JSONResponse:
    try:
        context = _workspace_context(request)
        service = request.app.state.runtime.journeyman
        if request.method == "GET":
            return JSONResponse(service.list(context))
        payload = await _json_object(request)
        return JSONResponse(service.create_task(_string(payload, "objective"), context), status_code=201)
    except RuntimeServiceError as error:
        return _service_error(error)


async def journeyman_task(request: Request) -> JSONResponse:
    try:
        context = _workspace_context(request)
        service = request.app.state.runtime.journeyman
        task_id = request.path_params["task_id"]
        return JSONResponse(
            service.cancel(task_id, context) if request.method == "DELETE" else service.get(task_id, context)
        )
    except RuntimeServiceError as error:
        return _service_error(error)


def create_app(
    settings: RuntimeSettings | None = None,
    runtime: CosmosRuntime | None = None,
) -> Starlette:
    active_settings = settings or RuntimeSettings.from_environment()
    active_runtime = runtime or CosmosRuntime.build(active_settings)

    @asynccontextmanager
    async def lifespan(app: Starlette) -> AsyncIterator[None]:
        active_runtime.initialize()
        app.state.runtime = active_runtime
        try:
            yield
        finally:
            active_runtime.shutdown()

    app = Starlette(
        debug=False,
        routes=[
            Route("/health", health),
            Route("/ready", readiness),
            Route("/cosmos/map", cosmos_map),
            Route("/base", base_snapshot),
            Route("/runtime-state/theme", theme_runtime_state, methods=["GET", "PUT"]),
            Route("/theme-packages", theme_packages, methods=["GET", "POST"]),
            Route("/theme-packages/import", theme_package_import, methods=["POST"]),
            Route("/theme-builder/projects", theme_builder_projects, methods=["GET", "POST"]),
            Route(
                "/theme-builder/projects/{builder_project_id:str}",
                theme_builder_project,
                methods=["GET", "PUT"],
            ),
            Route(
                "/theme-builder/projects/{builder_project_id:str}/export",
                theme_builder_export,
                methods=["GET"],
            ),
            Route("/cosmos/camera", update_camera, methods=["PUT"]),
            Route("/cosmos/selection", update_selection, methods=["PUT"]),
            Route("/objects/{object_id:str}/position", move_node, methods=["PUT"]),
            Route("/objects/{object_id:str}", object_details, methods=["GET", "PUT"]),
            Route("/objects/{object_id:str}/actions", object_actions),
            Route("/companion/messages", companion_message, methods=["POST"]),
            Route("/notifications", notifications),
            Route("/notifications/{notification_id:str}", notification, methods=["PUT"]),
            Route("/tools", tool_definitions),
            Route("/asset-catalog", asset_catalog, methods=["GET", "POST"]),
            Route(
                "/asset-catalog/visual-assets/{asset_id:str}/versions/{version:str}/content",
                visual_asset_content,
            ),
            Route("/workspaces/{workspace_id:str}", workspace_definition),
            Route("/workspaces/{workspace_id:str}/sessions", open_workspace, methods=["POST"]),
            Route(
                "/workspace-sessions/{session_id:str}",
                workspace_session,
                methods=["GET", "PUT", "DELETE"],
            ),
            Route(
                "/workspace-sessions/{session_id:str}/focus",
                focus_workspace,
                methods=["POST"],
            ),
            Route(
                "/workspace-sessions/{session_id:str}/tools",
                open_workspace_tool,
                methods=["POST"],
            ),
            Route(
                "/workspace-sessions/{session_id:str}/tools/{instance_id:str}",
                workspace_tool,
                methods=["PUT", "DELETE"],
            ),
            Route(
                "/projects/{project_id:str}/resource-projection",
                project_resource_projection,
                methods=["GET"],
            ),
            Route(
                "/workspace-sessions/{session_id:str}/files",
                project_files,
                methods=["GET", "POST"],
            ),
            Route(
                "/workspace-sessions/{session_id:str}/files/content",
                project_file,
                methods=["GET", "PUT", "DELETE"],
            ),
            Route(
                "/workspace-sessions/{session_id:str}/files/move",
                move_project_file,
                methods=["POST"],
            ),
            Route("/workspace-sessions/{session_id:str}/archive", archive),
            Route(
                "/workspace-sessions/{session_id:str}/archive/{object_id:str}",
                archive_object,
                methods=["GET", "PUT"],
            ),
            Route("/workspace-sessions/{session_id:str}/capture/drafts", capture_drafts),
            Route(
                "/workspace-sessions/{session_id:str}/capture/drafts/{draft_id:str}",
                capture_draft,
                methods=["PUT", "DELETE"],
            ),
            Route(
                "/workspace-sessions/{session_id:str}/capture/submissions",
                submit_capture,
                methods=["POST"],
            ),
            Route("/workspace-sessions/{session_id:str}/reviews", reviews),
            Route("/workspace-sessions/{session_id:str}/reviews/{review_id:str}", review_item),
            Route(
                "/workspace-sessions/{session_id:str}/reviews/{review_id:str}/decisions",
                review_decision,
                methods=["POST"],
            ),
            Route(
                "/workspace-sessions/{session_id:str}/journeyman/tasks",
                journeyman_tasks,
                methods=["GET", "POST"],
            ),
            Route(
                "/workspace-sessions/{session_id:str}/journeyman/tasks/{task_id:str}",
                journeyman_task,
                methods=["GET", "DELETE"],
            ),
        ],
        lifespan=lifespan,
    )
    app.state.runtime = active_runtime

    if active_settings.cors_origins:
        app.add_middleware(
            CORSMiddleware,
            allow_origins=list(active_settings.cors_origins),
            allow_methods=["GET", "POST", "PUT", "DELETE"],
            allow_headers=["*"],
        )

    return app


def _local_owner_context(
    project_scope_ids: tuple[str, ...] = (), focused_project_id: str | None = None
) -> RuntimeContext:
    return RuntimeContext(
        project_scope_ids=project_scope_ids,
        focused_project_id=focused_project_id,
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
        ),
    )


async def _json_object(request: Request) -> dict[str, object]:
    try:
        payload = await request.json()
    except ValueError as error:
        raise RuntimeServiceError("validation_failed", "Request body must contain valid JSON.") from error
    if not isinstance(payload, dict):
        raise RuntimeServiceError("validation_failed", "Request body must be a JSON object.")
    return payload


def _number(payload: dict[str, object], key: str) -> float:
    value = payload.get(key)
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise RuntimeServiceError("validation_failed", f"{key} must be a number.")
    return float(value)


def _theme_runtime_state_payload(
    value: object,
    *,
    require_ids: bool = False,
) -> dict[str, int | str | None]:
    if not isinstance(value, dict) or value.get("schemaVersion") != 1:
        if require_ids:
            raise RuntimeServiceError("validation_failed", "Theme Runtime state must use schemaVersion 1.")
        return dict(EMPTY_THEME_RUNTIME_STATE)

    active_theme_id = value.get("activeThemeId")
    last_known_good_theme_id = value.get("lastKnownGoodThemeId")
    valid_active = isinstance(active_theme_id, str) and bool(active_theme_id.strip())
    valid_last_known_good = isinstance(last_known_good_theme_id, str) and bool(
        last_known_good_theme_id.strip()
    )
    if require_ids and (not valid_active or not valid_last_known_good):
        raise RuntimeServiceError(
            "validation_failed",
            "Theme Runtime state requires activeThemeId and lastKnownGoodThemeId.",
        )

    return {
        "schemaVersion": 1,
        "activeThemeId": active_theme_id if valid_active else None,
        "lastKnownGoodThemeId": last_known_good_theme_id if valid_last_known_good else None,
    }


def _string(payload: dict[str, object], key: str) -> str:
    value = payload.get(key)
    if not isinstance(value, str) or not value.strip():
        raise RuntimeServiceError("validation_failed", f"{key} must be a non-empty string.")
    return value


def _text(payload: dict[str, object], key: str) -> str:
    value = payload.get(key)
    if not isinstance(value, str):
        raise RuntimeServiceError("validation_failed", f"{key} must be a string.")
    return value


def _optional_string(payload: dict[str, object], key: str) -> str:
    value = payload.get(key, "")
    if not isinstance(value, str):
        raise RuntimeServiceError("validation_failed", f"{key} must be a string.")
    return value


def _array(payload: dict[str, object], key: str) -> list:
    value = payload.get(key, [])
    if not isinstance(value, list):
        raise RuntimeServiceError("validation_failed", f"{key} must be an array.")
    return value


def _workspace_context(request: Request) -> RuntimeContext:
    return request.app.state.runtime.workspaces.context(
        request.path_params["session_id"], _local_owner_context()
    )


def _project_context(runtime: CosmosRuntime, project_id: str) -> RuntimeContext:
    context = _cosmos_context(runtime)
    if project_id not in context.project_scope_ids:
        raise RuntimeServiceError("object_not_found", "Project is outside the active Cosmos scope.")
    project = runtime.objects.get(project_id, context)
    if "Project" not in project.system_tags:
        raise RuntimeServiceError("validation_failed", "Requested Object is not a Project.")
    return replace(context, focused_project_id=project_id, object_id=project_id)


def _object_context(request: Request, object_id: str) -> RuntimeContext:
    session_id = request.query_params.get("workspaceSessionId")
    context = (
        request.app.state.runtime.workspaces.context(session_id, _local_owner_context())
        if session_id
        else _cosmos_context(request.app.state.runtime)
    )
    return _with_object_context(request.app.state.runtime, context, object_id)


def _companion_context(request: Request, payload: dict[str, object]) -> RuntimeContext:
    runtime: CosmosRuntime = request.app.state.runtime
    session_id = payload.get("workspaceSessionId")
    room_id = payload.get("roomId")
    object_id = payload.get("objectId")
    if session_id is not None and not isinstance(session_id, str):
        raise RuntimeServiceError("validation_failed", "workspaceSessionId must be a string.")
    if room_id is not None and not isinstance(room_id, str):
        raise RuntimeServiceError("validation_failed", "roomId must be a string.")
    if object_id is not None and not isinstance(object_id, str):
        raise RuntimeServiceError("validation_failed", "objectId must be a string.")
    if session_id and room_id:
        raise RuntimeServiceError(
            "validation_failed",
            "Conversation Context cannot combine independent Room and Workspace paths.",
        )

    owner = _local_owner_context()
    if session_id:
        context = runtime.workspaces.context(session_id, owner)
    elif room_id:
        room = runtime.objects.get(room_id, owner)
        if "Room" not in room.system_tags:
            raise RuntimeServiceError("validation_failed", "Conversation roomId must reference a Room.")
        context = replace(
            owner,
            room_id=room_id,
            system_tags=owner.system_tags | room.system_tags,
            user_tags=owner.user_tags | room.user_tags,
        )
    else:
        context = _cosmos_context(runtime)
    return _with_object_context(runtime, context, object_id) if object_id else context


def _cosmos_context(runtime: CosmosRuntime) -> RuntimeContext:
    owner = _local_owner_context()
    snapshot = runtime.cosmos_map.snapshot(owner)
    focused = snapshot["focusedProjectId"]
    scopes = tuple(
        str(project["objectId"])
        for project in snapshot["projects"]
        if isinstance(project, dict) and isinstance(project.get("objectId"), str)
    )
    context = _local_owner_context(scopes, focused if isinstance(focused, str) else None)
    selected = snapshot["selectedObjectId"]
    return _with_object_context(runtime, context, selected) if isinstance(selected, str) else context


def _with_object_context(
    runtime: CosmosRuntime,
    context: RuntimeContext,
    object_id: str,
) -> RuntimeContext:
    value = runtime.objects.get(object_id, context)
    if (
        value.primary_project_id
        and context.project_scope_ids
        and value.primary_project_id not in context.project_scope_ids
    ):
        raise RuntimeServiceError("object_not_found", "Object is outside the active Project scope.")
    return replace(
        context,
        object_id=object_id,
        system_tags=context.system_tags | value.system_tags,
        user_tags=context.user_tags | value.user_tags,
    )


def _query_path(request: Request) -> str:
    value = request.query_params.get("path")
    if not value:
        raise RuntimeServiceError("validation_failed", "path query parameter is required.")
    return value


def _service_error(error: RuntimeServiceError) -> JSONResponse:
    if error.code == "permission_denied":
        status = 403
    elif error.code == "asset_storage_failed":
        status = 503
    elif error.code.endswith("_not_found"):
        status = 404
    elif (
        error.code.endswith("_exists") or error.code.endswith("_conflict") or error.code == "review_resolved"
    ):
        status = 409
    else:
        status = 422
    return JSONResponse({"code": error.code, "message": str(error)}, status_code=status)
