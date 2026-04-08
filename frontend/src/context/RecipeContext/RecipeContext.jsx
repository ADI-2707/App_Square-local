import { createContext, useContext, useState } from "react";
import api from "../../Utility/api";

const RecipeContext = createContext();

export function RecipeProvider({ children }) {
  const [recipeGroups, setRecipeGroups] = useState({});
  const [recipes, setRecipes] = useState({});
  const [activeRecipe, setActiveRecipe] = useState(null);

  const loadRecipeGroups = async (templateGroupId, search = "") => {
    try {
      const res = await api.get(`/recipes/groups/${templateGroupId}`, {
        params: { search },
      });

      setRecipeGroups((prev) => ({
        ...prev,
        [templateGroupId]: res.data,
      }));

    } catch (err) {
      console.error("Failed to load recipe groups:", err);
      alert(err?.response?.data?.detail || "Failed to load recipe groups");
    }
  };

  const loadRecipesPaginated = async (recipeGroupId, page = 1) => {
    try {
      const res = await api.get(`/recipes/group/${recipeGroupId}`, {
        params: { page, limit: 10 },
      });

      setRecipes((prev) => ({
        ...prev,
        [recipeGroupId]: {
          ...(prev[recipeGroupId] || {}),
          [page]: res.data,
        },
      }));

    } catch (err) {
      console.error("Failed to load recipes:", err);
      alert(err?.response?.data?.detail || "Failed to load recipes");
    }
  };

  const getFullRecipe = async (recipeId) => {
    try {
      const res = await api.get(`/recipes/${recipeId}/full`);
      return res.data;

    } catch (err) {
      console.error("Failed to load full recipe:", err);
      alert(err?.response?.data?.detail || "Failed to load recipe");
      throw err;
    }
  };

  const openRecipeInWorkspace = async (recipe) => {
    try {
      const fullRecipe = await getFullRecipe(recipe.id);

      if (fullRecipe.removed_devices?.length > 0) {
        alert(
          `Template updated:\nRemoved devices: ${fullRecipe.removed_devices.join(", ")}`
        );
      }

      setActiveRecipe(fullRecipe);
      return fullRecipe;

    } catch (error) {
      console.error("Failed to open recipe:", error);
      throw error;
    }
  };

  const clearActiveRecipe = () => {
    setActiveRecipe(null);
  };

  const addRecipeGroupLocal = (templateGroupId, group) => {
    setRecipeGroups((prev) => ({
      ...prev,
      [templateGroupId]: [...(prev[templateGroupId] || []), group],
    }));
  };

  const addRecipeLocal = (recipeGroupId, recipe) => {
    setRecipes((prev) => ({
      ...prev,
      [recipeGroupId]: {
        ...(prev[recipeGroupId] || {}),
        1: [recipe, ...(prev[recipeGroupId]?.[1] || [])],
      },
    }));
  };

  const deleteRecipe = async (recipeId, recipeGroupId) => {
    try {
      await api.delete(`/recipes/${recipeId}`);

      setRecipes((prev) => {
        const groupData = prev[recipeGroupId] || {};
        const updatedPages = {};

        Object.keys(groupData).forEach((page) => {
          updatedPages[page] = groupData[page].filter(
            (recipe) => recipe.id !== recipeId
          );
        });

        return {
          ...prev,
          [recipeGroupId]: updatedPages,
        };
      });

      if (activeRecipe?.id === recipeId) {
        setActiveRecipe(null);
      }

    } catch (err) {
      console.error("Failed to delete recipe:", err);
      alert(err?.response?.data?.detail || "Failed to delete recipe");
    }
  };

  const deleteRecipeGroup = async (recipeGroupId, templateGroupId) => {
    try {
      await api.delete(`/recipes/groups/${recipeGroupId}`);

      setRecipeGroups((prev) => ({
        ...prev,
        [templateGroupId]: (prev[templateGroupId] || []).filter(
          (group) => group.id !== recipeGroupId
        ),
      }));

      setRecipes((prev) => {
        const updated = { ...prev };
        delete updated[recipeGroupId];
        return updated;
      });

    } catch (err) {
      console.error("Failed to delete recipe group:", err);
      alert(err?.response?.data?.detail || "Failed to delete recipe group");
    }
  };

  return (
    <RecipeContext.Provider
      value={{
        recipeGroups,
        recipes,
        activeRecipe,
        loadRecipeGroups,
        loadRecipesPaginated,
        getFullRecipe,
        openRecipeInWorkspace,
        clearActiveRecipe,
        addRecipeGroupLocal,
        addRecipeLocal,
        deleteRecipe,
        deleteRecipeGroup,
      }}
    >
      {children}
    </RecipeContext.Provider>
  );
}

export const useRecipes = () => useContext(RecipeContext);