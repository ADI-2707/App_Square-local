import { useState } from "react";
import { NavLink } from "react-router-dom";
import "./sidebar.css";

export default function Sidebar() {
  const [openMenu, setOpenMenu] = useState(null);

  const toggleMenu = (menu) => {
    setOpenMenu(openMenu === menu ? null : menu);
  };

  return (
    <div className="sidebar">
      <div className="sidebar-section">
        <div
          className="sidebar-title"
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
          className="sidebar-title"
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