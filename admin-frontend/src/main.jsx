import React from "react";
import ReactDOM from "react-dom/client";
import AdminProviders from "./AdminProviders";
import "@shared/index.css";
import "@shared/assets/styles/App.css";
import AdminApp from "./AdminApp";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AdminProviders>
      <AdminApp />
    </AdminProviders>
  </React.StrictMode>
);
