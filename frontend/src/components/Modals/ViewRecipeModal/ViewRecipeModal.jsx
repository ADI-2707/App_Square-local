import { useEffect, useState, useRef } from "react";
import BaseModal from "../BaseModal/BaseModal";
import "../ViewTemplateModal/viewTemplateModal.css";
import api from "../../../Utility/api";
import { useWorkspace } from "../../../context/WorkspaceContext/WorkspaceContext";

export default function ViewRecipeModal({ isOpen, onClose, onOpenRecipe }) {
  const { workspace } = useWorkspace();

  const [recipes, setRecipes] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [currentPage, setCurrentPage] = useState(1);
  const [direction, setDirection] = useState("next");
  const [animating, setAnimating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const requestIdRef = useRef(0);

  const ITEMS_PER_PAGE = 8;

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  const fetchRecipes = async (requestId) => {
    try {
      const res = await api.get("/recipes", {
        params: {
          search,
          page: currentPage,
          limit: ITEMS_PER_PAGE,
        },
      });

      if (requestId !== requestIdRef.current) return;

      setRecipes(res.data.data);
      setTotal(res.data.total);
    } catch {
      if (requestId === requestIdRef.current) {
        alert("Failed to load recipes");
      }
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handler = setTimeout(() => {
      const requestId = ++requestIdRef.current;

      setLoading(true);
      fetchRecipes(requestId);
    }, 300);

    return () => clearTimeout(handler);
  }, [search, currentPage, isOpen]);

  useEffect(() => {
    if (!loading && animating) {
      setAnimating(false);
    }
  }, [loading]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKey = (e) => {
      if (e.key === "ArrowDown") {
        setSelectedIndex((prev) =>
          prev === -1 ? 0 : Math.min(prev + 1, recipes.length - 1),
        );
      }

      if (e.key === "ArrowUp") {
        setSelectedIndex((prev) => (prev === -1 ? -1 : Math.max(prev - 1, 0)));
      }

      if (e.key === "Enter") {
        if (selectedIndex === -1) return;
        const selected = recipes[selectedIndex];
        if (selected) {
          onOpenRecipe(selected);
          onClose();
        }
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isOpen, recipes, selectedIndex]);

  useEffect(() => {
    if (!isOpen) return;

    if (workspace?.type === "recipe") {
      const index = recipes.findIndex((r) => r.id === workspace.data?.id);

      setSelectedIndex(index !== -1 ? index : -1);
    } else {
      setSelectedIndex(-1);
    }
  }, [isOpen, recipes, workspace]);

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="All Recipes">
      <div className="view-modal">
        <div className="view-search">
          <input
            type="text"
            placeholder="Search recipes..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
              setSelectedIndex(-1);
            }}
          />
        </div>

        <div
          className={`view-list-wrapper ${
            animating ? `slide-${direction}` : ""
          }`}
        >
          <div className="view-list">
            {loading ? (
              Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
                <div key={index} className="view-item placeholder">
                  <div className="skeleton-line" />
                </div>
              ))
            ) : recipes.length === 0 ? (
              <div className="empty">No recipes found</div>
            ) : (
              Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => {
                const recipe = recipes[index];

                if (!recipe) {
                  return (
                    <div key={index} className="view-item placeholder">
                      <div className="skeleton-line" />
                    </div>
                  );
                }

                return (
                  <div
                    key={recipe.id}
                    className={`view-item ${
                      selectedIndex === index ? "selected" : ""
                    }`}
                    onClick={() => {
                      setSelectedIndex(index);
                      onOpenRecipe(recipe);
                      onClose();
                    }}
                  >
                    <span className="recipe-name">
                      {recipe.name}
                      {recipe.area_name && (
                        <span className="area-tag">[{recipe.area_name}]</span>
                      )}
                    </span>

                    <div className="tooltip">
                      {recipe.template_name || "Template"}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {totalPages > 1 && (
          <div className="modal-actions">
            <button
              disabled={currentPage === 1}
              onClick={() => {
                setDirection("prev");
                setAnimating(true);
                setCurrentPage((p) => p - 1);
                setSelectedIndex(-1);
              }}
            >
              Prev
            </button>

            <span>
              Page {currentPage} / {totalPages}
            </span>

            <button
              disabled={currentPage === totalPages}
              onClick={() => {
                setDirection("next");
                setAnimating(true);
                setCurrentPage((p) => p + 1);
                setSelectedIndex(-1);
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </BaseModal>
  );
}
