import { useState, useEffect } from "react";
import BaseModal from "../BaseModal/BaseModal";
import { useEntities } from "../../../context/EntityContext/EntityContext";
import { useRecipes } from "../../../context/RecipeContext/RecipeContext";
import "./viewRecipeModal.css";

export default function ViewRecipeModal({ isOpen, onClose }) {
  const { groups } = useEntities();
  const {
    recipeGroups,
    recipes,
    loadRecipeGroups,
    loadRecipesPaginated,
    getFullRecipe,
  } = useRecipes();

  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [fullRecipeData, setFullRecipeData] = useState(null);

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (selectedTemplate) {
      loadRecipeGroups(selectedTemplate, debouncedSearch);
      setSelectedGroup(null);
      setSelectedRecipe(null);
      setFullRecipeData(null);
      setPage(1);
    }
  }, [selectedTemplate, debouncedSearch]);

  useEffect(() => {
    if (selectedGroup) {
      loadRecipesPaginated(selectedGroup.id, page);
      setSelectedRecipe(null);
      setFullRecipeData(null);
    }
  }, [selectedGroup, page]);

  const handleSelectRecipe = async (recipe) => {
    try {
      setSelectedRecipe(recipe);
      const full = await getFullRecipe(recipe.id);
      setFullRecipeData(full);
    } catch (err) {
      console.error("Failed to load full recipe:", err);
    }
  };

  const currentRecipes = selectedGroup
    ? recipes[selectedGroup.id]?.[page] || []
    : [];

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="View Recipes">
      <div className="view-recipe-container">

        <div className="view-recipe-selector">
          <div className="form-group">
            <label className="modal-label">Select Template Group</label>
            <select
              className="modal-select"
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
            >
              <option value="">Select Template</option>
              {groups.allIds.map((id) => (
                <option key={id} value={id}>
                  {groups.byId[id].name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="modal-label">
              Search Recipe Group (Debounced)
            </label>
            <input
              className="modal-input"
              type="text"
              placeholder="Search by recipe group name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {selectedTemplate && (
            <div className="recipe-groups-section">
              <h4 className="section-title">Recipe Groups</h4>
              {(recipeGroups[selectedTemplate] || []).length === 0 && (
                <div className="empty-text">No recipe groups found</div>
              )}

              {(recipeGroups[selectedTemplate] || []).map((group) => (
                <div
                  key={group.id}
                  className={`list-item ${
                    selectedGroup?.id === group.id ? "active" : ""
                  }`}
                  onClick={() => {
                    setSelectedGroup(group);
                    setPage(1);
                  }}
                >
                  ▸ {group.name}
                </div>
              ))}
            </div>
          )}

          {selectedGroup && (
            <div className="recipes-section">
              <h4 className="section-title">Recipes (Latest 10)</h4>

              {currentRecipes.length === 0 && (
                <div className="empty-text">No recipes available</div>
              )}

              {currentRecipes.map((recipe) => (
                <div
                  key={recipe.id}
                  className={`list-item nested ${
                    selectedRecipe?.id === recipe.id ? "active" : ""
                  }`}
                  onClick={() => handleSelectRecipe(recipe)}
                >
                  • {recipe.name}
                </div>
              ))}

              <div className="pagination">
                <button
                  className="pagination-btn"
                  disabled={page === 1}
                  onClick={() => setPage((prev) => prev - 1)}
                >
                  Prev
                </button>

                <span className="page-indicator">Page {page}</span>

                <button
                  className="pagination-btn"
                  onClick={() => setPage((prev) => prev + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="view-recipe-tree">
          <h4 className="section-title">
            {selectedRecipe
              ? `Recipe Structure: ${selectedRecipe.name}`
              : "Select a recipe to preview structure"}
          </h4>

          {!fullRecipeData && (
            <div className="empty-text">
              Full recipe tree will appear here (Devices → Tags → Values)
            </div>
          )}

          {fullRecipeData && (
            <div className="tree-container">
              {fullRecipeData.devices?.map((device) => (
                <div key={device.id} className="tree-device">
                  <div className="tree-item device">
                    ▸ {device.device_name}
                  </div>

                  <div className="tree-tags">
                    {device.tag_values?.map((tag) => (
                      <div key={tag.id} className="tree-item tag">
                        └ {tag.tag_name} :{" "}
                        <span className="tag-value">{tag.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </BaseModal>
  );
}