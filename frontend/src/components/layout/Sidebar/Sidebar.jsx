import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useEntities } from "../../../context/EntityContext/EntityContext";
import { useRecipes } from "../../../context/RecipeContext/RecipeContext";
import { useAuth } from "../../../context/AuthContext/AuthContext";
import { useWorkspace } from "../../../context/WorkspaceContext/WorkspaceContext";
import { useUiLock } from "../../../context/UiLockContext/UiLockContext";
import { getIcon } from "../../../Utility/iconMapper";
import AddRecipeModal from "../../Modals/AddRecipeModal/AddRecipeModal";
import ViewTemplateModal from "../../Modals/ViewTemplateModal/ViewTemplateModal";
import ViewRecipeModal from "../../Modals/ViewRecipeModal/ViewRecipeModal";
import "./sidebar.css";

export default function Sidebar({
  onOpenModal,
  disabled = false,
  isCollapsed,
  setIsCollapsed,
}) {
  const {
    groups,
    devices,
    loadGroups,
    loadDevices,
    deleteTemplate,
    getFullTemplate,
    getDeviceWithTags,
    getRecipeDeviceWithTags,
    deleteDevice,
  } = useEntities();

  const {
    recipeGroups,
    recipes,
    loadRecipeGroups,
    loadRecipesPaginated,
    openRecipeInWorkspace,
    getFullRecipe,
    deleteRecipe,
    deleteRecipeGroup,
    activeRecipe,
    recentRecipeGroups,
    recentRecipesByGroup,
    markRecipeGroupRecent,
    markRecipeRecent,
  } = useRecipes();

  const { workspace, openWorkspace } = useWorkspace();
  const { lockUI, unlockUI } = useUiLock();
  const { role } = useAuth();
  const canManageTemplates = role === "admin";
  const canManageRecipes = role === "admin" || role === "operator";

  const [contextMenu, setContextMenu] = useState(null);
  const [addRecipeModal, setAddRecipeModal] = useState(null);

  const [openSections, setOpenSections] = useState(() => {
    const saved = localStorage.getItem("sidebar_open_sections");
    return saved ? JSON.parse(saved) : { templates: false, recipes: false };
  });

  const prevOpenSectionsRef = useRef(openSections);

  const [expandedGroups, setExpandedGroups] = useState(() => {
    const saved = localStorage.getItem("sidebar_expanded_groups");
    return saved ? JSON.parse(saved) : {};
  });

  const [expandedRecipeGroups, setExpandedRecipeGroups] = useState(() => {
    const saved = localStorage.getItem("sidebar_expanded_recipe_groups");
    return saved ? JSON.parse(saved) : {};
  });

  const [expandedRecipes, setExpandedRecipes] = useState(() => {
    const saved = localStorage.getItem("sidebar_expanded_recipes");
    return saved ? JSON.parse(saved) : {};
  });

  const [viewAllTemplatesModal, setViewAllTemplatesModal] = useState(false);
  const [activeRecipeId, setActiveRecipeId] = useState(null);
  const [activeDeviceId, setActiveDeviceId] = useState(null);
  const [recentTemplates, setRecentTemplates] = useState([]);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [viewAllRecipesModal, setViewAllRecipesModal] = useState(false);
  const [tooltip, setTooltip] = useState(null);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem("sidebar_open_sections", JSON.stringify(openSections));
  }, [openSections]);

  useEffect(() => {
    localStorage.setItem("sidebar_expanded_groups", JSON.stringify(expandedGroups));
  }, [expandedGroups]);

  useEffect(() => {
    localStorage.setItem("sidebar_expanded_recipe_groups", JSON.stringify(expandedRecipeGroups));
  }, [expandedRecipeGroups]);

  useEffect(() => {
    localStorage.setItem("sidebar_expanded_recipes", JSON.stringify(expandedRecipes));
  }, [expandedRecipes]);

  const hasTemplates = groups.allIds.length > 0;

  const recentTemplateIds = useMemo(() => {
    const all = groups.allIds;

    const uniqueRecent = recentTemplates.filter((id) => all.includes(id));
    const remaining = all.filter((id) => !uniqueRecent.includes(id));

    return [...uniqueRecent, ...remaining].slice(0, 10);
  }, [recentTemplates, groups.allIds]);

  const toggleSidebar = () => {
    setIsCollapsed((prev) => !prev);
  };

  const updateRecentTemplates = (templateId) => {
    setRecentTemplates((prev) => {
      const filtered = prev.filter((id) => id !== templateId);
      return [templateId, ...filtered].slice(0, 10);
    });
  };

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

    result.sort((a, b) => {
      const aIndex = recentRecipeGroups.indexOf(a.id);
      const bIndex = recentRecipeGroups.indexOf(b.id);

      if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
      if (aIndex !== -1) return -1;
      if (bIndex !== -1) return 1;

      return a.name.localeCompare(b.name);
    });

    return result;
  }, [recipeGroups, groups.byId, recentRecipeGroups]);

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (!groups.allIds.length) return;

    try {
      const saved = localStorage.getItem("recentTemplates");

      if (saved) {
        const parsed = JSON.parse(saved);

        const valid = parsed.filter((id) => groups.allIds.includes(id));

        setRecentTemplates(valid);
      } else {
        setRecentTemplates([]);
      }
    } catch {
      setRecentTemplates([]);
    } finally {
      setHasLoaded(true);
    }
  }, [groups.allIds]);

  useEffect(() => {
    if (!hasLoaded) return;

    localStorage.setItem("recentTemplates", JSON.stringify(recentTemplates));
  }, [recentTemplates, hasLoaded]);

  useEffect(() => {
    if (!openSections.recipes) return;

    groups.allIds.forEach((templateId) => {
      if (!recipeGroups[templateId]) {
        loadRecipeGroups(templateId);
      }
    });
  }, [openSections.recipes, groups.allIds, recipeGroups, loadRecipeGroups]);

  useEffect(() => {
    if (!groups.allIds.length) return;

    Object.keys(expandedGroups).forEach((groupId) => {
      if (expandedGroups[groupId] && !devices.byGroupId[groupId]) {
        loadDevices(groupId);
      }
    });
  }, [groups.allIds, expandedGroups, devices.byGroupId, loadDevices]);

  useEffect(() => {
    if (!openSections.recipes || !flattenedRecipeGroups.length) return;

    flattenedRecipeGroups.forEach((group) => {
      if (expandedRecipeGroups[group.id] && !recipes[group.id]) {
        loadRecipesPaginated(group.id, 1);
      }
    });
  }, [
    openSections.recipes,
    flattenedRecipeGroups,
    expandedRecipeGroups,
    recipes,
    loadRecipesPaginated,
  ]);

  useEffect(() => {
    if (!openSections.recipes || !flattenedRecipeGroups.length) return;

    Object.keys(expandedRecipes).forEach((recipeId) => {
      if (expandedRecipes[recipeId]) {
        const group = flattenedRecipeGroups.find((g) =>
          (recipes[g.id]?.[1] || []).some((r) => r.id === recipeId),
        );
        if (group && !devices.byGroupId[group.templateId]) {
          loadDevices(group.templateId);
        }
      }
    });
  }, [
    openSections.recipes,
    flattenedRecipeGroups,
    expandedRecipes,
    recipes,
    devices.byGroupId,
    loadDevices,
  ]);

  useEffect(() => {
    const handleGlobalClick = (e) => {
      if (!e.target.closest(".context-menu")) {
        setContextMenu(null);
      }
    };

    window.addEventListener("click", handleGlobalClick);
    return () => window.removeEventListener("click", handleGlobalClick);
  }, []);

  useEffect(() => {
    if (workspace?.type === "template" && workspace?.data?.id) {
      updateRecentTemplates(workspace.data.id);

      setActiveDeviceId(null);
      setActiveRecipeId(null);
    }
  }, [workspace]);

  useEffect(() => {
    if (isCollapsed) {
      prevOpenSectionsRef.current = openSections;

      setOpenSections({
        templates: false,
        recipes: false,
      });
    } else {
      setOpenSections(prevOpenSectionsRef.current);
    }
  }, [isCollapsed]);

  const toggleSection = (section) => {
    if (disabled) return;

    if (section === "recipes" && !hasTemplates) return;

    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const toggleGroup = async (groupId) => {
    if (disabled) return;

    if (!expandedGroups[groupId]) {
      await loadDevices(groupId);
    }

    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const toggleRecipeGroup = async (group) => {
    if (disabled) return;

    if (!expandedRecipeGroups[group.id]) {
      await loadRecipesPaginated(group.id, 1);
    }

    setExpandedRecipeGroups((prev) => ({
      ...prev,
      [group.id]: !prev[group.id],
    }));
  };

  const toggleRecipe = async (recipe, templateId, e) => {
    if (disabled) return;
    if (e) e.stopPropagation();

    if (!expandedRecipes[recipe.id]) {
      await loadDevices(templateId);
    }

    setExpandedRecipes((prev) => ({
      ...prev,
      [recipe.id]: !prev[recipe.id],
    }));
  };

  const handleOpenRecipe = async (recipe) => {
    if (disabled) return;

    try {
      const fullRecipe = await openRecipeInWorkspace(recipe);

      openWorkspace("recipe", fullRecipe);

      setActiveRecipeId(recipe.id);
      setActiveDeviceId(null);

      markRecipeRecent(recipe.recipe_group_id, recipe.id);

      if (fullRecipe.changes && fullRecipe.changes.length > 0) {
        const lines = fullRecipe.changes.map((c) => `• ${c.label}`).join("\n");
        alert(`⚠ Template Updates Detected:\n\n${lines}`);
      }
    } catch (error) {
      console.error(error);
      alert("Failed to load recipe");
    }
  };

  const handleViewTemplate = async () => {
    if (disabled) return;

    try {
      const template = await getFullTemplate(contextMenu.templateId);
      openWorkspace("template", template);

      updateRecentTemplates(contextMenu.templateId);
      setActiveDeviceId(null);
      setActiveRecipeId(null);
    } catch {
      alert("Failed to load template");
    }

    setContextMenu(null);
  };

  const handleViewDevice = async () => {
    if (disabled) return;

    try {
      const recipeId =
        contextMenu.source === "recipe" ? contextMenu.recipeId : null;
      const recipeName =
        contextMenu.source === "recipe" ? contextMenu.recipeName : null;

      await handleOpenEquipment(
        contextMenu.deviceId,
        contextMenu.deviceName,
        recipeId,
        recipeName,
      );
    } catch {
      alert("Failed to load equipment");
    }

    setContextMenu(null);
  };

  const handleOpenEquipment = async (
    deviceId,
    deviceName,
    recipeId = null,
    recipeName = null,
  ) => {
    if (disabled) return;

    try {
      let device;
      if (recipeId) {
        device = await getRecipeDeviceWithTags(recipeId, deviceId);
      } else {
        device = await getDeviceWithTags(deviceId);
      }

      openWorkspace("device", {
        id: deviceId,
        name: deviceName,
        devices: [device],
        recipeId: recipeId,
        recipeName: recipeName,
      });

      setActiveDeviceId(deviceId);
      setActiveRecipeId(null);
    } catch {
      alert("Failed to load equipment");
    }
  };

  const handleRightClick = (e, payload) => {
    if (disabled) return;

    e.preventDefault();

    setContextMenu({
      x: e.pageX,
      y: e.pageY,
      source: "template",
      ...payload,
    });
  };

  const handleSectionClick = (section) => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setOpenSections((prev) => ({
        ...prev,
        [section]: true,
      }));
    } else {
      toggleSection(section);
    }
  };

  const handleDelete = async () => {
    if (disabled || !contextMenu) return;

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

          if (
            workspace?.type === "template" &&
            workspace?.data?.id === contextMenu.templateId
          ) {
            openWorkspace(null, null);
          }

          if (
            workspace?.type === "device" &&
            workspace?.data?.template_group_id === contextMenu.templateId
          ) {
            openWorkspace(null, null);
          }

          break;
        }

        case "device": {
          const confirmed = window.confirm(
            `Delete equipment "${contextMenu.deviceName}"?\n\nThis will also update all linked recipes.`,
          );
          if (!confirmed) return;

          try {
            lockUI("Deleting equipment...");

            await deleteDevice(contextMenu.deviceId, contextMenu.templateId);

            if (
              workspace?.type === "template" &&
              workspace?.data?.id === contextMenu.templateId
            ) {
              const updatedTemplate = await getFullTemplate(
                contextMenu.templateId,
              );
              openWorkspace("template", updatedTemplate);
            }

            if (
              workspace?.type === "device" &&
              workspace?.data?.id === contextMenu.deviceId
            ) {
              openWorkspace(null, null);
            }

            if (
              workspace?.type === "recipe" &&
              activeRecipe &&
              activeRecipe.template_group_id === contextMenu.templateId
            ) {
              const fullRecipe = await openRecipeInWorkspace(activeRecipe);
              openWorkspace("recipe", fullRecipe);
            }
          } finally {
            unlockUI();
          }

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
      <div
        className={`sidebar ${isCollapsed ? "collapsed" : ""} ${
          disabled ? "sidebar-disabled" : ""
        }`}
      >
        <div className="sidebar-header">
          <img
            src="/app.svg"
            alt="App Logo"
            className="sidebar-logo"
            onClick={() => {
              if (isCollapsed) toggleSidebar();
            }}
            style={{ cursor: "pointer" }}
          />

          {!isCollapsed && (
            <>
              <div className="sidebar-appname">APP SQUARE</div>
              <div className="sidebar-toggle" onClick={toggleSidebar}>
                <img
                  src="/icons/sidebar-toggle.svg"
                  className={`toggle-icon ${isCollapsed ? "collapsed" : ""}`}
                />
              </div>
            </>
          )}
        </div>

        <div className="sidebar-content-scroll">
          <div className="sidebar-section">
            <div
              className="sidebar-title sidebar-tooltip-wrapper"
              onClick={() => handleSectionClick("templates")}
              onMouseEnter={(e) => {
                if (isCollapsed) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTooltip({
                    label: "Templates",
                    x: rect.right + 10,
                    y: rect.top + rect.height / 2,
                  });
                }
              }}
              onMouseLeave={() => setTooltip(null)}
            >
              <div className="sidebar-title-content">
                <span className="arrow">
                  {openSections.templates ? "▾" : "▸"}
                </span>

                <img src={getIcon("template")} className="sidebar-icon" />

                {!isCollapsed && <span>Templates</span>}
              </div>
            </div>

            {openSections.templates && (
              <>
                <div className="sidebar-submenu">
                  <div className="template-tree-scroll">
                    {recentTemplateIds.map((groupId) => {
                      const group = groups.byId[groupId];
                      const deviceIds = devices.byGroupId[groupId] || [];

                      return (
                        <div key={groupId} className="tree-node">
                          <div
                            className={`tree-item expandable ${
                              workspace?.type === "template" &&
                              workspace?.data?.id === groupId
                                ? "active-item"
                                : ""
                            }`}
                            onClick={() => toggleGroup(groupId)}
                            onContextMenu={(e) =>
                              handleRightClick(e, {
                                type: "template",
                                templateId: groupId,
                                templateName: group.name,
                              })
                            }
                          >
                            <div className="tree-item-content">
                              <span className="arrow">
                                {expandedGroups[groupId] ? "▾" : "▸"}
                              </span>

                              <img
                                src={getIcon("template")}
                                className="sidebar-icon"
                              />

                              {!isCollapsed && <span>{group.name}</span>}
                            </div>
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
                                          ? "active-item"
                                          : ""
                                      }`}
                                      onContextMenu={(e) =>
                                        handleRightClick(e, {
                                          type: "device",
                                          deviceId: device.id,
                                          deviceName: device.name,
                                          templateId: groupId,
                                          source: "template",
                                        })
                                      }
                                    >
                                      <div className="tree-item-content">
                                        <img
                                          src={getIcon("device")}
                                          className="sidebar-icon"
                                        />

                                        {!isCollapsed && (
                                          <span>{device.name}</span>
                                        )}
                                      </div>
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
                </div>
                <div className="sidebar-section-footer">
                  <button
                    className="sidebar-footer-action-btn"
                    onClick={() => onOpenModal("createGroup")}
                    disabled={disabled || !canManageTemplates}
                  >
                    + Template
                  </button>
                  <button
                    className="view-all-btn"
                    onClick={() => setViewAllTemplatesModal(true)}
                  >
                    View All
                  </button>
                </div>
              </>
            )}
          </div>

          <div className="sidebar-section">
            <div
              className={`sidebar-title sidebar-tooltip-wrapper ${
                !hasTemplates ? "disabled-section" : ""
              }`}
              onClick={() => hasTemplates && handleSectionClick("recipes")}
              onMouseEnter={(e) => {
                if (isCollapsed) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTooltip({
                    label: "Recipes",
                    x: rect.right + 10,
                    y: rect.top + rect.height / 2,
                  });
                }
              }}
              onMouseLeave={() => setTooltip(null)}
            >
              <div className="sidebar-title-content">
                <span className="arrow">
                  {openSections.recipes ? "▾" : "▸"}
                </span>

                <img src="/icons/recipe.svg" className="sidebar-icon" />

                {!isCollapsed && <span>Recipes</span>}
              </div>
            </div>

            {openSections.recipes && hasTemplates && (
              <>
                <div className="sidebar-submenu">
                  <div className="template-tree-scroll">
                    {flattenedRecipeGroups.map((rGroup) => {
                      const recipeList = recipes[rGroup.id]?.[1] || [];
                      const recentRecipeIds =
                        recentRecipesByGroup[rGroup.id] || [];
                      const sortedRecipeList = [...recipeList].sort((a, b) => {
                        const aIndex = recentRecipeIds.indexOf(a.id);
                        const bIndex = recentRecipeIds.indexOf(b.id);

                        if (aIndex !== -1 && bIndex !== -1)
                          return aIndex - bIndex;
                        if (aIndex !== -1) return -1;
                        if (bIndex !== -1) return 1;

                        return a.name.localeCompare(b.name);
                      });

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
                            <div className="tree-item-content">
                              <span className="arrow">
                                {expandedRecipeGroups[rGroup.id] ? "▾" : "▸"}
                              </span>

                              <img
                                src={getIcon("area")}
                                className="sidebar-icon"
                              />

                              {!isCollapsed && (
                                <span>
                                  {rGroup.name}
                                  <span className="template-label">
                                    ({rGroup.templateName})
                                  </span>
                                </span>
                              )}
                            </div>
                          </div>

                          {expandedRecipeGroups[rGroup.id] && (
                            <div className="tree-children">
                              {sortedRecipeList.length > 0 ? (
                                sortedRecipeList.map((recipe) => {
                                  const deviceIds =
                                    devices.byGroupId[rGroup.templateId] || [];

                                  return (
                                    <div key={recipe.id} className="tree-node">
                                      <div
                                        className={`tree-item expandable ${
                                          activeRecipeId === recipe.id
                                            ? "active-item"
                                            : ""
                                        }`}
                                        onClick={() => handleOpenRecipe(recipe)}
                                        onContextMenu={(e) =>
                                          handleRightClick(e, {
                                            type: "recipe",
                                            recipe,
                                            recipeGroupId: rGroup.id,
                                            source: "recipe",
                                          })
                                        }
                                      >
                                        <div className="tree-item-content">
                                          <span
                                            className="arrow"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleRecipe(
                                                recipe,
                                                rGroup.templateId,
                                              );
                                            }}
                                          >
                                            {expandedRecipes[recipe.id]
                                              ? "▾"
                                              : "▸"}
                                          </span>

                                          <img
                                            src="/icons/recipe.svg"
                                            className="sidebar-icon"
                                          />
                                          {!isCollapsed && (
                                            <span>{recipe.name}</span>
                                          )}
                                        </div>
                                      </div>

                                      {expandedRecipes[recipe.id] && (
                                        <div className="tree-children">
                                          {deviceIds.length > 0 ? (
                                            deviceIds.map((deviceId) => {
                                              const device = devices.byId[deviceId];
                                              return (
                                                <div
                                                  key={deviceId}
                                                  className="tree-node"
                                                >
                                                  <div
                                                    className={`tree-item leaf ${
                                                      activeDeviceId === deviceId
                                                        ? "active-item"
                                                        : ""
                                                    }`}
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      handleOpenEquipment(
                                                        deviceId,
                                                        device.name,
                                                        recipe.id,
                                                        recipe.name,
                                                      );
                                                    }}
                                                    onContextMenu={(e) =>
                                                      handleRightClick(e, {
                                                        type: "device",
                                                        deviceId: device.id,
                                                        deviceName: device.name,
                                                        templateId:
                                                          rGroup.templateId,
                                                        source: "recipe",
                                                        recipeId: recipe.id,
                                                        recipeName: recipe.name,
                                                      })
                                                    }
                                                  >
                                                    <div className="tree-item-content">
                                                      <img
                                                        src={getIcon("device")}
                                                        className="sidebar-icon"
                                                      />
                                                      {!isCollapsed && (
                                                        <span>{device.name}</span>
                                                      )}
                                                    </div>
                                                  </div>
                                                </div>
                                              );
                                            })
                                          ) : (
                                            <div className="tree-empty">
                                              No equipment
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  );
                                })
                              ) : (
                                <div className="tree-empty-centered">
                                  No recipes available
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="sidebar-section-footer">
                  <button
                    className="sidebar-footer-action-btn"
                    onClick={() => onOpenModal("createArea")}
                    disabled={disabled || !canManageRecipes}
                  >
                    + Area
                  </button>
                  <button
                    className="view-all-btn"
                    onClick={() => setViewAllRecipesModal(true)}
                  >
                    View All
                  </button>
                </div>
              </>
            )}
          </div>
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
                  !canManageRecipes ? "disabled-item" : ""
                }`}
                onClick={() => canManageRecipes && handleDelete()}
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
                    !canManageRecipes ? "disabled-item" : ""
                  }`}
                  onClick={() => canManageRecipes && handleDelete()}
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
                    !canManageTemplates ? "disabled-item" : ""
                  }`}
                  onClick={() => canManageTemplates && handleDelete()}
                >
                  Delete Template
                </div>
              </>
            )}

            {contextMenu.type === "device" && (
              <>
                <div className="context-item" onClick={handleViewDevice}>
                  View Equipment
                </div>

                {contextMenu.source === "template" && (
                  <div
                    className={`context-item ${
                      !canManageTemplates ? "disabled-item" : ""
                    }`}
                    onClick={() => canManageTemplates && handleDelete()}
                  >
                    Delete Equipment
                  </div>
                )}
              </>
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

      {viewAllTemplatesModal && (
        <ViewTemplateModal
          isOpen={true}
          onClose={() => setViewAllTemplatesModal(false)}
        />
      )}

      {viewAllRecipesModal && (
        <ViewRecipeModal
          isOpen={true}
          onClose={() => setViewAllRecipesModal(false)}
          onOpenRecipe={handleOpenRecipe}
        />
      )}
      {tooltip &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: tooltip.y,
              left: tooltip.x,
              transform: "translateY(-50%)",
              background: "var(--color-tooltip-bg)",
              color: "var(--color-tooltip-text)",
              padding: "6px 10px",
              fontSize: "12px",
              borderRadius: "4px",
              whiteSpace: "nowrap",
              zIndex: 9999,
              pointerEvents: "none",
            }}
          >
            {tooltip.label}
          </div>,
          document.body,
        )}
    </>
  );
}
