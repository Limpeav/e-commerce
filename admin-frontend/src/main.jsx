import React from "react";
import ReactDOM from "react-dom/client";
import AppProviders from "@shared/app/AppProviders";
import "@shared/index.css";
import "@shared/assets/styles/App.css";
import AdminApp from "./AdminApp";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AppProviders>
      <AdminApp />
    </AppProviders>
  </React.StrictMode>
);
