import { useState, useEffect } from "react";
import BaseModal from "../BaseModal/BaseModal";
import { useEntities } from "../../../context/EntityContext/EntityContext";
import { useRecipes } from "../../../context/RecipeContext/RecipeContext";

export default function ViewRecipeModal({ isOpen, onClose }) {
  const { groups } = useEntities();
  const {
    recipeGroups,
    recipes,
    loadRecipeGroups,
    loadRecipesPaginated,
    getFullRecipe
  } = useRecipes();

  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedGroup, setSelectedGroup] = useState(null);
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
      setPage(1);
    }
  }, [selectedTemplate, debouncedSearch]);

  useEffect(() => {
    if (selectedGroup) {
      loadRecipesPaginated(selectedGroup.id, page);
    }
  }, [selectedGroup, page]);

  const handleSelectRecipe = async (recipeId) => {
    const fullRecipe = await getFullRecipe(recipeId);
    alert(`Selected Recipe: ${fullRecipe.name}`);
    onClose();
  };

  const currentRecipes = selectedGroup
    ? recipes[selectedGroup.id]?.[page] || []
    : [];

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="View Recipes">
      <div className="group-form">
        <label>Select Template Group</label>
        <select
          value={selectedTemplate}
          onChange={(e) => setSelectedTemplate(e.target.value)}
        >
          <option value="">Select Template</option>
          {groups.allIds.map(id => (
            <option key={id} value={id}>
              {groups.byId[id].name}
            </option>
          ))}
        </select>

        <label>Search Recipe Group</label>
        <input
          type="text"
          placeholder="Search group..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {selectedTemplate && (
          <>
            <h4>Recipe Groups</h4>
            {(recipeGroups[selectedTemplate] || []).map(group => (
              <div
                key={group.id}
                className="tree-item"
                onClick={() => {
                  setSelectedGroup(group);
                  setPage(1);
                }}
                style={{ cursor: "pointer", padding: "5px" }}
              >
                ▸ {group.name}
              </div>
            ))}
          </>
        )}

        {selectedGroup && (
          <>
            <h4>Recipes (Latest 10)</h4>
            {currentRecipes.map(recipe => (
              <div
                key={recipe.id}
                className="tree-item"
                style={{ cursor: "pointer", paddingLeft: "15px" }}
                onClick={() => handleSelectRecipe(recipe.id)}
              >
                • {recipe.name}
              </div>
            ))}

            <div style={{ marginTop: "10px" }}>
              <button
                disabled={page === 1}
                onClick={() => setPage(prev => prev - 1)}
              >
                Prev
              </button>

              <span style={{ margin: "0 10px" }}>Page {page}</span>

              <button
                onClick={() => setPage(prev => prev + 1)}
              >
                Next
              </button>
            </div>
          </>
        )}
      </div>
    </BaseModal>
  );
}