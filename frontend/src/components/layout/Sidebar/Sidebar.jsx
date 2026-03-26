import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";

import { useEntities } from "../../../context/EntityContext/EntityContext";
import { useRecipes } from "../../../context/RecipeContext/RecipeContext";
import { useAuth } from "../../../context/AuthContext/AuthContext";
import { useWorkspace } from "../../../context/WorkspaceContext/WorkspaceContext";

import AddRecipeModal from "../../Modals/AddRecipeModal/AddRecipeModal";

import "./sidebar.css";

export default function Sidebar({ onOpenModal }) {
  const {
    groups,
    devices,
    loadGroups,
    loadDevices,
    deleteTemplate,
    getFullTemplate,
    getDeviceWithTags,
  } = useEntities();

  const {
    recipeGroups,
    recipes,
    loadRecipeGroups,
    loadRecipesPaginated,
    getFullRecipe,
    deleteRecipe,
    deleteRecipeGroup,
  } = useRecipes();

  const { openWorkspace } = useWorkspace();
  const { role } = useAuth();

  const [contextMenu, setContextMenu] = useState(null);
  const [addRecipeModal, setAddRecipeModal] = useState(null);

  const [openSections, setOpenSections] = useState({
    templates: false,
    recipes: false,
  });

  const [expandedGroups, setExpandedGroups] = useState({});
  const [expandedRecipeGroups, setExpandedRecipeGroups] = useState({});

  const [activeRecipeId, setActiveRecipeId] = useState(null);
  const [activeDeviceId, setActiveDeviceId] = useState(null);

  const hasTemplates = groups.allIds.length > 0;

  const flattenedRecipeGroups = useMemo(() => {
    const result = [];

    Object.entries(recipeGroups).forEach(([templateId, groupsArr]) => {
      const template = groups.byId[templateId];

      groupsArr.forEach((group) => {
        result.push({
          ...group,
          templateId,
          templateName: template?.name || "Unknown",
        });
      });
    });

    result.sort((a, b) => a.name.localeCompare(b.name));

    return result;
  }, [recipeGroups, groups.byId]);

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (!openSections.recipes) return;

    groups.allIds.forEach((templateId) => {
      if (!recipeGroups[templateId]) {
        loadRecipeGroups(templateId);
      }
    });
  }, [openSections.recipes, groups.allIds]);

  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (!e.target.closest(".context-menu")) {
        setContextMenu(null);
      }
    };

    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, []);

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
      openWorkspace("recipe", fullRecipe);

      setActiveRecipeId(recipe.id);
    } catch {
      alert("Failed to load recipe");
    }
  };

  const handleViewTemplate = async () => {
    try {
      const template = await getFullTemplate(contextMenu.templateId);
      openWorkspace("template", template);
    } catch {
      alert("Failed to load template");
    }

    setContextMenu(null);
  };

  const handleViewDevice = async () => {
    try {
      const device = await getDeviceWithTags(contextMenu.deviceId);

      openWorkspace("device", {
        id: contextMenu.deviceId,
        name: contextMenu.deviceName,
        devices: [device],
      });

      setActiveDeviceId(contextMenu.deviceId);

      setExpandedGroups((prev) => ({
        ...prev,
        [contextMenu.templateId]: true,
      }));
    } catch {
      alert("Failed to load device");
    }

    setContextMenu(null);
  };

  const handleRightClick = (e, payload) => {
    e.preventDefault();

    setContextMenu({
      x: e.pageX,
      y: e.pageY,
      ...payload,
    });
  };

  const handleDelete = async () => {
    if (!contextMenu) return;

    try {
      switch (contextMenu.type) {
        case "recipe": {
          const confirmed = window.confirm(
            `Delete recipe "${contextMenu.recipe.name}"?`,
          );
          if (!confirmed) return;
          await deleteRecipe(contextMenu.recipe.id, contextMenu.recipeGroupId);
          break;
        }

        case "recipeGroup": {
          const confirmed = window.confirm(
            `Delete area "${contextMenu.recipeGroup.name}"?`,
          );
          if (!confirmed) return;
          await deleteRecipeGroup(
            contextMenu.recipeGroup.id,
            contextMenu.templateId,
          );
          break;
        }

        case "template": {
          const confirmed = window.confirm(
            `Delete template "${contextMenu.templateName}"?`,
          );
          if (!confirmed) return;
          await deleteTemplate(contextMenu.templateId);
          break;
        }

        default:
          break;
      }
    } catch (error) {
      alert(error.response?.data?.detail || "Delete failed");
    }

    setContextMenu(null);
  };

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
              <button
                className={`sidebar-action-btn ${
                  role !== "admin" ? "disabled-btn" : ""
                }`}
                onClick={() => role === "admin" && onOpenModal("createGroup")}
              >
                + Create Recipe Template
              </button>

              {groups.allIds.map((groupId) => {
                const group = groups.byId[groupId];
                const deviceIds = devices.byGroupId[groupId] || [];

                return (
                  <div key={groupId} className="tree-node">
                    <div
                      className="tree-item expandable"
                      onClick={() => toggleGroup(groupId)}
                      onContextMenu={(e) =>
                        handleRightClick(e, {
                          type: "template",
                          templateId: groupId,
                          templateName: group.name,
                          templateId: groupId,
                        })
                      }
                    >
                      {expandedGroups[groupId] ? "▾" : "▸"} {group.name}
                    </div>

                    {expandedGroups[groupId] && (
                      <div className="tree-children">
                        {deviceIds.map((deviceId) => {
                          const device = devices.byId[deviceId];

                          return (
                            <div key={deviceId} className="tree-node">
                              <div
                                className={`tree-item leaf ${
                                  activeDeviceId === device.id
                                    ? "active-device"
                                    : ""
                                }`}
                                onContextMenu={(e) =>
                                  handleRightClick(e, {
                                    type: "device",
                                    deviceId: device.id,
                                    deviceName: device.name,
                                  })
                                }
                              >
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
              <button
                className="sidebar-action-btn"
                onClick={() => onOpenModal("createRecipe")}
              >
                + Create Recipe
              </button>

              {flattenedRecipeGroups.map((rGroup) => {
                const recipeList = recipes[rGroup.id]?.[1] || [];

                return (
                  <div key={rGroup.id} className="tree-node">
                    <div
                      className="tree-item expandable"
                      onClick={() => toggleRecipeGroup(rGroup)}
                      onContextMenu={(e) =>
                        handleRightClick(e, {
                          type: "recipeGroup",
                          recipeGroup: rGroup,
                          templateId: rGroup.templateId,
                        })
                      }
                    >
                      {expandedRecipeGroups[rGroup.id] ? "▾" : "▸"}{" "}
                      {rGroup.name}{" "}
                      <span className="template-label">
                        ({rGroup.templateName})
                      </span>
                    </div>

                    {expandedRecipeGroups[rGroup.id] && (
                      <div className="tree-children">
                        {recipeList.length > 0 ? (
                          recipeList.map((recipe) => (
                            <div key={recipe.id} className="tree-node">
                              <div
                                className={`tree-item leaf ${
                                  activeRecipeId === recipe.id
                                    ? "active-recipe"
                                    : ""
                                }`}
                                onClick={() => handleOpenRecipe(recipe)}
                                onContextMenu={(e) =>
                                  handleRightClick(e, {
                                    type: "recipe",
                                    recipe,
                                    recipeGroupId: rGroup.id,
                                  })
                                }
                              >
                                {recipe.name}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="tree-empty">No recipes</div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {contextMenu &&
        createPortal(
          <div
            className="context-menu"
            style={{ top: contextMenu.y, left: contextMenu.x }}
          >
            {contextMenu.type === "recipe" && (
              <div
                className={`context-item ${
                  role !== "admin" ? "disabled-item" : ""
                }`}
                onClick={() => role === "admin" && handleDelete()}
              >
                Delete Recipe
              </div>
            )}

            {contextMenu.type === "recipeGroup" && (
              <>
                <div
                  className="context-item"
                  onClick={() => {
                    setAddRecipeModal({
                      recipeGroupId: contextMenu.recipeGroup.id,
                      templateGroupId: contextMenu.templateId,
                    });
                    setContextMenu(null);
                  }}
                >
                  Add Recipe
                </div>

                <div
                  className={`context-item ${
                    role !== "admin" ? "disabled-item" : ""
                  }`}
                  onClick={() => role === "admin" && handleDelete()}
                >
                  Delete Area
                </div>
              </>
            )}

            {contextMenu.type === "template" && (
              <>
                <div className="context-item" onClick={handleViewTemplate}>
                  View Template
                </div>

                <div
                  className={`context-item ${
                    role !== "admin" ? "disabled-item" : ""
                  }`}
                  onClick={() => role === "admin" && handleDelete()}
                >
                  Delete Template
                </div>
              </>
            )}

            {contextMenu.type === "device" && (
              <div className="context-item" onClick={handleViewDevice}>
                View Device
              </div>
            )}
          </div>,
          document.body,
        )}

      {addRecipeModal && (
        <AddRecipeModal
          isOpen={true}
          recipeGroupId={addRecipeModal.recipeGroupId}
          templateGroupId={addRecipeModal.templateGroupId}
          onClose={() => setAddRecipeModal(null)}
        />
      )}
    </>
  );
}
