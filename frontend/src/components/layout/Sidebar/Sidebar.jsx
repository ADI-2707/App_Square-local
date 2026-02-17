import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import "./sidebar.css";

export default function Sidebar() {
  const location = useLocation();

  const isTemplatesActive = location.pathname.startsWith("/templates");
  const isRecipesActive = location.pathname.startsWith("/recipes");

  const [openMenu, setOpenMenu] = useState(null);

  useEffect(() => {
    if (isTemplatesActive) setOpenMenu("templates");
    else if (isRecipesActive) setOpenMenu("recipes");
  }, [location.pathname]);

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
          className={`sidebar-title ${isTemplatesActive ? "active-section" : ""}`}
          onClick={() => toggleMenu("templates")}
        >
          Templates
        </div>

        {openMenu === "templates" && (
          <div className="sidebar-submenu">
            <NavLink to="/templates/list">Template List</NavLink>
            <NavLink to="/templates/groups">Template Groups</NavLink>
          </div>
        )}
      </div>

      <div className="sidebar-section">
        <div
          className={`sidebar-title ${isRecipesActive ? "active-section" : ""}`}
          onClick={() => toggleMenu("recipes")}
        >
          Recipe Management
        </div>

        {openMenu === "recipes" && (
          <div className="sidebar-submenu">
            <NavLink to="/recipes/list">Recipe List</NavLink>
            <NavLink to="/recipes/create">Create Recipe</NavLink>
          </div>
        )}
      </div>
    </div>
  );
}