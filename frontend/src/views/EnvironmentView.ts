import { defineAsyncComponent, defineComponent, h } from "vue";
import { useRoute } from "vue-router";

const CosmosPresenterView = defineAsyncComponent(() => import("./CosmosPresenterView.vue"));
const BasePresenterView = defineAsyncComponent(() => import("./BasePresenterView.vue"));
const WorkspaceView = defineAsyncComponent(() => import("./WorkspaceView.vue"));

export default defineComponent({
  name: "EnvironmentView",
  setup() {
    const route = useRoute();
    return () => {
      if (route.meta.environment === "cosmos") return h(CosmosPresenterView);
      if (route.meta.environment === "base" || route.meta.environment === "room") {
        return h(BasePresenterView);
      }
      if (route.meta.environment === "workspace") {
        return h(WorkspaceView);
      }
      return h("section", {
        class: "environment-view",
        "data-environment": route.meta.environment,
        "aria-label": `${route.meta.title} environment`,
      });
    };
  },
});
