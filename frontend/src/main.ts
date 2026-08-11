import { createApp } from "vue";

import App from "./App.vue";
import { createCosmosRouter } from "./router";
import { createCosmosFrontendRuntime, createCosmosRuntimePlugin } from "./runtime/plugin";
import "./styles/main.css";

const runtime = createCosmosFrontendRuntime();
const router = createCosmosRouter({ transitions: runtime.transitions });

createApp(App).use(createCosmosRuntimePlugin({ runtime })).use(router).mount("#app");
