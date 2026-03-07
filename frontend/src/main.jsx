import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext/AuthContext";
import { EntityProvider } from "./context/EntityContext/EntityContext";
import { RecipeProvider } from "./context/RecipeContext/RecipeContext";
import { WorkspaceProvider } from "./context/WorkspaceContext/WorkspaceContext";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <WorkspaceProvider>
          <EntityProvider>
            <RecipeProvider>
              <App />
            </RecipeProvider>
          </EntityProvider>
        </WorkspaceProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
