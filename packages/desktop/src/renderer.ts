import "./assets/index.css";
import "@nodebody/ui/index.css";
import { mount } from "@nodebody/ui";
import { workbench } from "./components/workbench";

const root = document.querySelector("#app");

if (!root) throw new Error("Missing #app root");

mount(workbench(), root);
