import { createContext, useContext, useState } from "react";
import api from "../../Utility/api";

const RecipeContext = createContext();

export function RecipeProvider({ children }) {

  const [recipeGroups, setRecipeGroups] = useState({});
  const [recipes, setRecipes] = useState({});

  const loadRecipeGroups = async (templateGroupId) => {
    if (recipeGroups[templateGroupId]) return;

    const res = await api.get(`/recipes/groups/${templateGroupId}`);

    setRecipeGroups(prev => ({
      ...prev,
      [templateGroupId]: res.data
    }));
  };

  const loadRecipes = async (recipeGroupId) => {
    if (recipes[recipeGroupId]) return;

    const res = await api.get(`/recipes/group/${recipeGroupId}`);

    setRecipes(prev => ({
      ...prev,
      [recipeGroupId]: res.data
    }));
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
      [recipeGroupId]: [
        ...(prev[recipeGroupId] || []),
        recipe
      ]
    }));
  };

  return (
    <RecipeContext.Provider
      value={{
        recipeGroups,
        recipes,
        loadRecipeGroups,
        loadRecipes,
        addRecipeGroupLocal,
        addRecipeLocal
      }}
    >
      {children}
    </RecipeContext.Provider>
  );
}

export const useRecipes = () => useContext(RecipeContext);