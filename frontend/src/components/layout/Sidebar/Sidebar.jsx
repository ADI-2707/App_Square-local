import { useState, useEffect } from "react";
import { useEntities } from "../../../context/EntityContext/EntityContext";
import { useRecipes } from "../../../context/RecipeContext/RecipeContext";
import "./sidebar.css";

export default function Sidebar({ onOpenModal }) {
  const { groups, devices, tags, loadGroups, loadDevices, loadTags } =
    useEntities();

  const { user } = useAuth();

  const {
    recipeGroups,
    recipes,
    loadRecipeGroups,
    loadRecipesPaginated,
    getFullRecipe,
    openRecipeInWorkspace,
    deleteRecipe,
  } = useRecipes();

  const [openSections, setOpenSections] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({});
  const [expandedDevices, setExpandedDevices] = useState({});
  const [expandedRecipeGroups, setExpandedRecipeGroups] = useState({});
  const [loadedRecipeTemplates, setLoadedRecipeTemplates] = useState({});

  useEffect(() => {
    loadGroups();
  }, []);

  const toggleSection = (sectionName) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionName]: !prev[sectionName],
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

  const toggleDevice = async (deviceId) => {
    if (!expandedDevices[deviceId]) {
      await loadTags(deviceId);
    }

    setExpandedDevices((prev) => ({
      ...prev,
      [deviceId]: !prev[deviceId],
    }));
  };

  const handleTemplateClickForRecipes = async (templateId) => {
    if (!loadedRecipeTemplates[templateId]) {
      await loadRecipeGroups(templateId);
      setLoadedRecipeTemplates((prev) => ({
        ...prev,
        [templateId]: true,
      }));
    }
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
    } catch (err) {
      console.error("Failed to open recipe:", err);
      alert("Failed to load recipe");
    }
  };

  const handleRightClick = (e, recipe, recipeGroupId) => {
    e.preventDefault();

    if (user?.role !== "admin") return;

    setContextMenu({
      x: e.pageX,
      y: e.pageY,
      recipe,
      recipeGroupId,
    });
  };

  const handleDelete = async () => {
    if (!contextMenu) return;

    const confirmed = window.confirm(
      `Delete recipe "${contextMenu.recipe.name}"?`,
    );

    if (!confirmed) return;

    try {
      await deleteRecipe(
        contextMenu.recipe.id,
        contextMenu.recipe.recipe_group_id,
      );
    } catch (err) {
      alert("Delete failed");
    }

    setContextMenu(null);
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
          onClick={() => toggleSection("templates")}
        >
          {openSections.templates ? "▾" : "▸"} Templates
        </div>

        {openSections.templates && (
          <div className="sidebar-submenu">
            <button onClick={() => onOpenModal("createGroup")}>
              Create Template
            </button>

            {groups.allIds.length === 0 && (
              <div className="tree-empty">No Templates Yet</div>
            )}

            {groups.allIds.map((groupId) => {
              const group = groups.byId[groupId];
              const deviceIds = devices.byGroupId[groupId] || [];

              return (
                <div key={groupId}>
                  <div
                    className="tree-item group-item"
                    onClick={() => toggleGroup(groupId)}
                  >
                    {expandedGroups[groupId] ? "▾" : "▸"} {group.name}
                  </div>

                  {expandedGroups[groupId] &&
                    deviceIds.map((deviceId) => {
                      const device = devices.byId[deviceId];
                      const tagIds = tags.byDeviceId[deviceId] || [];

                      return (
                        <div key={deviceId} className="tree-device">
                          <div
                            className="tree-item device-item"
                            onClick={() => toggleDevice(deviceId)}
                          >
                            {expandedDevices[deviceId] ? "▾" : "▸"}{" "}
                            {device.name}
                          </div>

                          {expandedDevices[deviceId] &&
                            tagIds.map((tagId) => {
                              const tag = tags.byId[tagId];

                              return (
                                <div key={tagId} className="tree-item tag-item">
                                  {tag.name}
                                </div>
                              );
                            })}
                        </div>
                      );
                    })}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="sidebar-section">
        <div className="sidebar-title" onClick={() => toggleSection("recipes")}>
          {openSections.recipes ? "▾" : "▸"} Recipes
        </div>

        {openSections.recipes && (
          <div className="sidebar-submenu">
            <button onClick={() => onOpenModal("createRecipe")}>
              Create Recipe
            </button>

            {groups.allIds.length === 0 && (
              <div className="tree-empty">No Templates Available</div>
            )}

            {groups.allIds.map((templateId) => {
              const template = groups.byId[templateId];
              const rGroups = recipeGroups[templateId] || [];

              return (
                <div key={`template-recipes-${templateId}`}>
                  <div
                    className="tree-item group-item"
                    onClick={() => handleTemplateClickForRecipes(templateId)}
                  >
                    ▸ {template.name}
                  </div>

                  {rGroups.map((rGroup) => {
                    const recipeList = recipes[rGroup.id]?.[1] || [];

                    return (
                      <div key={`rgroup-${rGroup.id}`} className="tree-device">
                        <div
                          className="tree-item device-item"
                          onClick={() => toggleRecipeGroup(rGroup)}
                        >
                          {expandedRecipeGroups[rGroup.id] ? "▾" : "▸"}{" "}
                          {rGroup.name}
                        </div>

                        {expandedRecipeGroups[rGroup.id] &&
                          recipeList.map((recipe) => (
                            <div
                              key={recipe.id}
                              className="tree-item tag-item recipe-item"
                              onClick={() => handleOpenRecipe(recipe)}
                              onContextMenu={(e) =>
                                handleRightClick(e, recipe, rGroup.id)
                              }
                            >
                              • {recipe.name}
                            </div>
                          ))}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>
      {contextMenu && (
        <div
          className="context-menu"
          style={{
            top: contextMenu.y,
            left: contextMenu.x,
          }}
          onMouseLeave={() => setContextMenu(null)}
        >
          <div className="context-item" onClick={handleDelete}>
            Delete
          </div>
        </div>
      )}
    </div>
  );
}
