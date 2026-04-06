import { createApp } from "vue";
import { Quasar, Notify, Dialog, Loading } from "quasar";

// Quasar 样式
import "@quasar/extras/material-icons/material-icons.css";
import "quasar/src/css/index.sass";

// 自定义样式
import "./styles/variables.css";
import "./styles/theme-base.css";

import App from "./App.vue";
import { router } from "./router";

const app = createApp(App);

// 使用 Vue Router
app.use(router);

app.use(Quasar, {
  plugins: {
    Notify,
    Dialog,
    Loading,
  },
  config: {
    dark: true, // 默认启用暗黑模式
    notify: {
      position: "top-right",
      timeout: 3000,
      textColor: "white",
      actions: [{ icon: "close", color: "white" }],
    },
  },
});

app.mount("#app");
