import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext/AuthContext";
import { EntityProvider } from "./context/EntityContext/EntityContext";
import { RecipeProvider } from "./context/RecipeContext/RecipeContext";
import { WorkspaceProvider } from "./context/WorkspaceContext/WorkspaceContext";
import { UiLockProvider } from "./context/UiLockContext/UiLockContext";

import "./styles/tokens/colors.css";
import "./styles/tokens/typography.css";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <WorkspaceProvider>
          <EntityProvider>
            <RecipeProvider>
              <UiLockProvider>
                <App />
              </UiLockProvider>
            </RecipeProvider>
          </EntityProvider>
        </WorkspaceProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
