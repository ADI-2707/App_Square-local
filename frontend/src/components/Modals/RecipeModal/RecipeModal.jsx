import { useState, useEffect } from "react";
import FormLabel from "../../common/FormLabel/FormLabel";
import BaseModal from "../BaseModal/BaseModal";
import { useEntities } from "../../../context/EntityContext/EntityContext";
import { useRecipes } from "../../../context/RecipeContext/RecipeContext";
import { useUiLock } from "../../../context/UiLockContext/UiLockContext";
import api from "../../../Utility/api";
import "./recipeModal.css";

export default function RecipeModal({
  isOpen,
  onClose,
  initialTemplateId = null,
}) {
  const { groups } = useEntities();
  const { addRecipeGroupLocal } = useRecipes();
  const { lockUI, unlockUI, isLocked } = useUiLock();

  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [recipeGroupName, setRecipeGroupName] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (initialTemplateId) {
        setSelectedTemplate(String(initialTemplateId));
      } else {
        setSelectedTemplate("");
      }

      setRecipeGroupName("");
    }
  }, [isOpen, initialTemplateId]);

  const handleCreateRecipeGroup = async () => {
    if (!selectedTemplate || !recipeGroupName.trim()) {
      alert("Select template and enter recipe group name");
      return;
    }

    const payload = {
      name: recipeGroupName.trim(),
      template_group_id: parseInt(selectedTemplate),
    };

    try {
      lockUI("Creating area...");

      const res = await api.post("/recipes/groups", payload);

      addRecipeGroupLocal(selectedTemplate, res.data);

      setRecipeGroupName("");
      setSelectedTemplate("");
      onClose();
    } catch (err) {
      console.error("Recipe Group Error:", err);

      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        "Failed to create area";

      alert(msg);
    } finally {
      unlockUI();
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => {
        if (isLocked) return;
        onClose();
      }}
      title="Create Area"
    >
      <div className="group-form">
        <FormLabel required>Select Template</FormLabel>
        <select
          value={selectedTemplate}
          onChange={(e) => setSelectedTemplate(e.target.value)}
          disabled={!!initialTemplateId || isLocked}
        >
          <option value="">Select Template</option>
          {groups.allIds.map((id) => (
            <option key={id} value={id}>
              {groups.byId[id].name}
            </option>
          ))}
        </select>

        <FormLabel required>Area Name</FormLabel>
        <input
          type="text"
          value={recipeGroupName}
          onChange={(e) => setRecipeGroupName(e.target.value)}
          disabled={isLocked}
        />

        <button onClick={handleCreateRecipeGroup} disabled={isLocked}>
          {isLocked ? "Creating..." : "Create Area"}
        </button>
      </div>
    </BaseModal>
  );
}
