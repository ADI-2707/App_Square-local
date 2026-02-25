import { createContext, useContext, useState } from "react";
import api from "../../Utility/api";

const RecipeContext = createContext();

export function RecipeProvider({ children }) {
  const [recipeGroups, setRecipeGroups] = useState({});
  const [recipes, setRecipes] = useState({});
  const [activeRecipe, setActiveRecipe] = useState(null);

  const loadRecipeGroups = async (templateGroupId, search = "") => {
    const res = await api.get(`/recipes/groups/${templateGroupId}`, {
      params: { search },
    });

    setRecipeGroups((prev) => ({
      ...prev,
      [templateGroupId]: res.data,
    }));
  };

  const loadRecipesPaginated = async (recipeGroupId, page = 1) => {
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
  };

  const getFullRecipe = async (recipeId) => {
    const res = await api.get(`/recipes/${recipeId}/full`);
    return res.data;
  };

  const openRecipeInWorkspace = async (recipe) => {
    try {
      const fullRecipe = await getFullRecipe(recipe.id);
      setActiveRecipe(fullRecipe);
    } catch (error) {
      console.error("Failed to load full recipe:", error);
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
    await api.delete(`/recipes/${recipeId}`);

    setRecipes((prev) => {
      const groupData = prev[recipeGroupId] || {};
      const updatedPages = {};

      Object.keys(groupData).forEach((page) => {
        updatedPages[page] = groupData[page].filter(
          (recipe) => recipe.id !== recipeId,
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
  };

  const deleteRecipeGroup = async (recipeGroupId, templateGroupId) => {
    await api.delete(`/recipes/groups/${recipeGroupId}`);

    setRecipeGroups((prev) => ({
      ...prev,
      [templateGroupId]: (prev[templateGroupId] || []).filter(
        (group) => group.id !== recipeGroupId,
      ),
    }));

    setRecipes((prev) => {
      const updated = { ...prev };
      delete updated[recipeGroupId];
      return updated;
    });
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