import React from "react";
import ReactDOM from "react-dom";
import Content from "./Content";

const host = document.createElement("div");
const shadowRoot = host.attachShadow({ mode: "open" });
document.body.appendChild(host);

ReactDOM.render(
  <React.StrictMode>
    <Content />
  </React.StrictMode>,
  shadowRoot
);
