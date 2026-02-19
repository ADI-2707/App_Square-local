import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BrowserRouter } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext/AuthContext";
import { EntityProvider } from "./context/EntityContext/EntityContext";
import { RecipeProvider } from "./context/RecipeContext/RecipeContext";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <EntityProvider>
          <RecipeProvider>
            <App />
          </RecipeProvider>
        </EntityProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);