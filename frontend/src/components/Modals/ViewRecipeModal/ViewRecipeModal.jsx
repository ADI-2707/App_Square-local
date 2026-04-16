import { useEffect, useState } from "react";
import BaseModal from "../BaseModal/BaseModal";
import api from "../../../Utility/api";
import "./ViewRecipeModal.css";

export default function ViewRecipeModal({ isOpen, onClose, onOpenRecipe }) {
  const [recipes, setRecipes] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const limit = 8;

  const fetchRecipes = async () => {
    try {
      const res = await api.get("/recipes", {
        params: {
          search,
          page,
          limit,
        },
      });

      setRecipes(res.data.data);
      setTotal(res.data.total);
    } catch (err) {
      console.error("Failed to fetch recipes", err);
    }
  };

  useEffect(() => {
    if (isOpen) fetchRecipes();
  }, [isOpen, search, page]);

  const totalPages = Math.ceil(total / limit);

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="View Recipes">
      <div className="view-recipe-container">
        <input
          type="text"
          placeholder="Search recipes..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="search-input"
        />

        <div className="recipe-list">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="recipe-item"
              onClick={() => {
                onOpenRecipe(recipe);
                onClose();
              }}
            >
              {recipe.name}
            </div>
          ))}

          {recipes.length === 0 && (
            <div className="empty-state">No recipes found</div>
          )}
        </div>

        <div className="pagination">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Prev
          </button>

          <span>
            Page {page} / {totalPages || 1}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </BaseModal>
  );
}