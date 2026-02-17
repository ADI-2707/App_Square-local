import { useState } from "react";
import "./sidebar.css";

export default function Sidebar({ onOpenModal }) {
  const [openMenu, setOpenMenu] = useState(null);

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <img src="/app.svg" alt="App Logo" className="sidebar-logo" />
        <div className="sidebar-appname">APP SQUARE</div>
      </div>

      <div className="sidebar-section">
        <div
          className="sidebar-title"
          onClick={() => toggleMenu("templates")}
        >
          Templates
        </div>

        {openMenu === "templates" && (
          <div className="sidebar-submenu">
            <button onClick={() => onOpenModal("createGroup")}>
              Create Template Group
            </button>
          </div>
        )}
      </div>

      <div className="sidebar-section">
        <div
          className="sidebar-title"
          onClick={() => toggleMenu("recipes")}
        >
          Recipe Management
        </div>

        {openMenu === "recipes" && (
          <div className="sidebar-submenu">
            <button onClick={() => alert("Recipe Modal Coming Next")}>
              Create Recipe
            </button>
          </div>
        )}
      </div>
    </div>
  );
}