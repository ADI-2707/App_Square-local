import { createContext, useContext, useState } from "react";
import api from "../../Utility/api";

const RecipeContext = createContext();

export function RecipeProvider({ children }) {
  const [recipeGroups, setRecipeGroups] = useState({});
  const [recipes, setRecipes] = useState({});
  const [fullRecipeCache, setFullRecipeCache] = useState({});

  const loadRecipeGroups = async (templateGroupId, search = "") => {
    const res = await api.get(`/recipes/groups/${templateGroupId}`);
    let data = res.data;

    if (search) {
      data = data.filter(g =>
        g.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    setRecipeGroups(prev => ({
      ...prev,
      [templateGroupId]: data
    }));
  };

  const loadRecipesPaginated = async (recipeGroupId, page = 1) => {
    const res = await api.get(
      `/recipes/group/${recipeGroupId}?page=${page}&limit=10`
    );

    setRecipes(prev => ({
      ...prev,
      [recipeGroupId]: {
        ...(prev[recipeGroupId] || {}),
        [page]: res.data
      }
    }));
  };

  const getFullRecipe = async (recipeId) => {
    if (fullRecipeCache[recipeId]) {
      return fullRecipeCache[recipeId];
    }

    const res = await api.get(`/recipes/${recipeId}/full`);

    setFullRecipeCache(prev => ({
      ...prev,
      [recipeId]: res.data
    }));

    return res.data;
  };

  const addRecipeGroupLocal = (templateGroupId, group) => {
    setRecipeGroups(prev => ({
      ...prev,
      [templateGroupId]: [
        ...(prev[templateGroupId] || []),
        group
      ]
    }));
  };

  const addRecipeLocal = (recipeGroupId, recipe) => {
    setRecipes(prev => ({
      ...prev,
      [recipeGroupId]: {
        ...(prev[recipeGroupId] || {}),
        1: [
          recipe,
          ...((prev[recipeGroupId]?.[1]) || [])
        ]
      }
    }));
  };

  return (
    <RecipeContext.Provider
      value={{
        recipeGroups,
        recipes,
        loadRecipeGroups,
        loadRecipesPaginated,
        getFullRecipe,
        addRecipeGroupLocal,
        addRecipeLocal
      }}
    >
      {children}
    </RecipeContext.Provider>
  );
}

export const useRecipes = () => useContext(RecipeContext);