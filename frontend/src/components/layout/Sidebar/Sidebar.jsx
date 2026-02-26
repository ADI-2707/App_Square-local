import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useEntities } from "../../../context/EntityContext/EntityContext";
import { useRecipes } from "../../../context/RecipeContext/RecipeContext";
import { useAuth } from "../../../context/AuthContext/AuthContext";
import AddRecipeModal from "../../Modals/AddRecipeModal/AddRecipeModal";
import RecipeModal from "../../Modals/RecipeModal/RecipeModal";
import "./sidebar.css";

export default function Sidebar({ onOpenModal }) {
  const { groups, devices, loadGroups, loadDevices } = useEntities();
  const { role } = useAuth();

  const {
    recipeGroups,
    recipes,
    loadRecipeGroups,
    loadRecipesPaginated,
    getFullRecipe,
    openRecipeInWorkspace,
    deleteRecipe,
    deleteRecipeGroup,
  } = useRecipes();

  const [contextMenu, setContextMenu] = useState(null);
  const [addRecipeModal, setAddRecipeModal] = useState(null);
  const [addAreaModal, setAddAreaModal] = useState(null);

  const [openSections, setOpenSections] = useState({
    templates: false,
    recipes: false,
  });

  const [expandedGroups, setExpandedGroups] = useState({});
  const [expandedRecipeGroups, setExpandedRecipeGroups] = useState({});
  const [expandedTemplatesForRecipes, setExpandedTemplatesForRecipes] =
    useState({});

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (openSections.recipes) {
      groups.allIds.forEach((templateId) => {
        if (!recipeGroups[templateId]) {
          loadRecipeGroups(templateId);
        }
      });
    }
  }, [openSections.recipes, groups.allIds]);

  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (!e.target.closest(".context-menu")) {
        setContextMenu(null);
      }
    };

    window.addEventListener("click", handleGlobalClick);
    return () => {
      window.removeEventListener("click", handleGlobalClick);
    };
  }, []);

  const hasTemplates = groups.allIds.length > 0;

  const toggleSection = (section) => {
    if (section === "recipes" && !hasTemplates) return;

    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleGroup = async (groupId) => {
    if (!expandedGroups[groupId]) {
      await loadDevices(groupId);
    }

    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const toggleTemplateForRecipes = (templateId) => {
    setExpandedTemplatesForRecipes((prev) => ({
      ...prev,
      [templateId]: !prev[templateId],
    }));
  };

  const toggleRecipeGroup = async (group) => {
    if (!expandedRecipeGroups[group.id]) {
      await loadRecipesPaginated(group.id, 1);
    }

    setExpandedRecipeGroups((prev) => ({
      ...prev,
      [group.id]: !prev[group.id],
    }));
  };

  const handleOpenRecipe = async (recipe) => {
    try {
      const fullRecipe = await getFullRecipe(recipe.id);
      openRecipeInWorkspace(fullRecipe);
    } catch {
      alert("Failed to load recipe");
    }
  };

  const handleRightClick = (e, recipe, recipeGroupId) => {
    e.preventDefault();
    if (role !== "admin") return;

    setContextMenu({
      x: e.pageX,
      y: e.pageY,
      type: "recipe",
      recipe,
      recipeGroupId,
    });
  };

  const handleDelete = async () => {
    if (!contextMenu) return;

    try {
      if (contextMenu.type === "recipe") {
        const confirmed = window.confirm(
          `Delete recipe "${contextMenu.recipe.name}"?`
        );
        if (!confirmed) return;

        await deleteRecipe(contextMenu.recipe.id, contextMenu.recipeGroupId);
      }

      if (contextMenu.type === "recipeGroup") {
        const confirmed = window.confirm(
          `Delete recipe group "${contextMenu.recipeGroup.name}"?`
        );
        if (!confirmed) return;

        await deleteRecipeGroup(
          contextMenu.recipeGroup.id,
          contextMenu.templateId
        );
      }
    } catch (error) {
      alert(error.response?.data?.detail || "Delete failed");
    }

    setContextMenu(null);
  };

  const templatesWithRecipeGroups = groups.allIds.filter(
    (templateId) =>
      recipeGroups[templateId] &&
      recipeGroups[templateId].length > 0
  );

  return (
    <>
      <div className="sidebar">
        <div className="sidebar-header">
          <img src="/app.svg" alt="App Logo" className="sidebar-logo" />
          <div className="sidebar-appname">APP SQUARE</div>
        </div>

        <div className="sidebar-section">
          <div
            className="sidebar-title"
            onClick={() => toggleSection("templates")}
          >
            {openSections.templates ? "▾" : "▸"} Templates
          </div>

          {openSections.templates && (
            <div className="sidebar-submenu">
              <button onClick={() => onOpenModal("createGroup")}>
                Create Template
              </button>

              {groups.allIds.map((groupId) => {
                const group = groups.byId[groupId];
                const deviceIds = devices.byGroupId[groupId] || [];

                return (
                  <div key={groupId} className="tree-node">
                    <div
                      className="tree-item expandable"
                      onClick={() => toggleGroup(groupId)}
                    >
                      {expandedGroups[groupId] ? "▾" : "▸"} {group.name}
                    </div>

                    {expandedGroups[groupId] && (
                      <div className="tree-children">
                        {deviceIds.map((deviceId) => {
                          const device = devices.byId[deviceId];
                          return (
                            <div key={deviceId} className="tree-node">
                              <div className="tree-item leaf">
                                {device.name}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="sidebar-section">
          <div
            className={`sidebar-title ${
              !hasTemplates ? "disabled-section" : ""
            }`}
            onClick={() => hasTemplates && toggleSection("recipes")}
          >
            {openSections.recipes ? "▾" : "▸"} Recipes
          </div>

          {openSections.recipes && hasTemplates && (
            <div className="sidebar-submenu">
              <button onClick={() => onOpenModal("createRecipe")}>
                Create Recipe
              </button>

              {templatesWithRecipeGroups.map((templateId) => {
                const template = groups.byId[templateId];
                const rGroups = recipeGroups[templateId] || [];

                return (
                  <div key={templateId} className="tree-node">
                    <div
                      className="tree-item expandable"
                      onClick={() => toggleTemplateForRecipes(templateId)}
                    >
                      {expandedTemplatesForRecipes[templateId]
                        ? "▾"
                        : "▸"}{" "}
                      {template.name}
                    </div>

                    {expandedTemplatesForRecipes[templateId] && (
                      <div className="tree-children">
                        {rGroups.map((rGroup) => {
                          const recipeList =
                            recipes[rGroup.id]?.[1] || [];

                          return (
                            <div key={rGroup.id} className="tree-node">
                              <div
                                className="tree-item expandable"
                                onClick={() => toggleRecipeGroup(rGroup)}
                              >
                                {expandedRecipeGroups[rGroup.id]
                                  ? "▾"
                                  : "▸"}{" "}
                                {rGroup.name}
                              </div>

                              {expandedRecipeGroups[rGroup.id] && (
                                <div className="tree-children">
                                  {recipeList.map((recipe) => (
                                    <div
                                      key={recipe.id}
                                      className="tree-node"
                                    >
                                      <div
                                        className="tree-item leaf"
                                        onClick={() =>
                                          handleOpenRecipe(recipe)
                                        }
                                      >
                                        {recipe.name}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}