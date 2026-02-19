import { useState } from "react";
import BaseModal from "../BaseModal/BaseModal";
import { useEntities } from "../../../context/EntityContext/EntityContext";
import { useRecipes } from "../../../context/RecipeContext/RecipeContext";
import api from "../../../Utility/api";
import "./recipeModal.css";

export default function RecipeModal({ isOpen, onClose }) {

  const { groups } = useEntities();
  const { addRecipeGroupLocal, addRecipeLocal } = useRecipes();

  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [recipeGroupName, setRecipeGroupName] = useState("");
  const [recipeName, setRecipeName] = useState("");
  const [createdGroupId, setCreatedGroupId] = useState(null);

  const handleCreateRecipeGroup = async () => {
  if (!selectedTemplate || !recipeGroupName) {
    alert("Select template and enter recipe group name");
    return;
  }

  const payload = {
    name: recipeGroupName,
    template_group_id: parseInt(selectedTemplate),
  };

  try {
    const res = await api.post("/recipes/groups", payload);
    
    setCreatedGroupId(res.data.id);
    addRecipeGroupLocal(selectedTemplate, res.data);
  } catch (err) {
    console.error("❌ Recipe Group Error:", err);
    alert("Failed to create recipe group");
  }
};


  const handleCreateRecipe = async () => {
    if (!createdGroupId || !recipeName) {
      alert("Create recipe group first");
      return;
    }

    try {
      const res = await api.post("/recipes", {
        name: recipeName,
        recipe_group_id: createdGroupId,
      });

      addRecipeLocal(createdGroupId, res.data);
      onClose();
      setRecipeName("");
      setRecipeGroupName("");
      setSelectedTemplate("");
      setCreatedGroupId(null);
    } catch (err) {
      console.error(err);
      alert("Failed to create recipe");
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Recipe"
    >
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

        <label>Recipe Group Name</label>
        <input
          type="text"
          value={recipeGroupName}
          onChange={(e) => setRecipeGroupName(e.target.value)}
        />

        <button onClick={handleCreateRecipeGroup}>
          Create Recipe Group
        </button>

        {createdGroupId && (
          <>
            <label>Recipe Name</label>
            <input
              type="text"
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
            />

            <button onClick={handleCreateRecipe}>
              Save Recipe
            </button>
          </>
        )}
      </div>
    </BaseModal>
  );
}