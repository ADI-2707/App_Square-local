import { useState, useEffect } from "react";
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
  const { addRecipeGroupLocal, addRecipeLocal } = useRecipes();
  const { lockUI, unlockUI, isLocked } = useUiLock();

  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [recipeGroupName, setRecipeGroupName] = useState("");
  const [recipeName, setRecipeName] = useState("");
  const [createdGroupId, setCreatedGroupId] = useState(null);

  const [templateDevices, setTemplateDevices] = useState([]);
  const [selectedDevices, setSelectedDevices] = useState([]);

  useEffect(() => {
    if (isOpen) {
      if (initialTemplateId) {
        setSelectedTemplate(String(initialTemplateId));
      } else {
        setSelectedTemplate("");
      }

      setRecipeGroupName("");
      setRecipeName("");
      setCreatedGroupId(null);
      setTemplateDevices([]);
      setSelectedDevices([]);
    }
  }, [isOpen, initialTemplateId]);

  useEffect(() => {
    if (!selectedTemplate) {
      setTemplateDevices([]);
      setSelectedDevices([]);
      return;
    }

    const fetchDevices = async () => {
      try {
        const res = await api.get(`/templates/${selectedTemplate}/devices`);
        setTemplateDevices(res.data);
        setSelectedDevices([]);
      } catch (err) {
        console.error("Failed to fetch template equipments:", err);
        setTemplateDevices([]);
      }
    };

    fetchDevices();
  }, [selectedTemplate]);

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

      setCreatedGroupId(res.data.id);
      addRecipeGroupLocal(selectedTemplate, res.data);
    } catch (err) {
      console.error("Recipe Group Error:", err);
      alert("Failed to create recipe group");
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
      title="Create Recipe"
    >
      <div className="group-form">
        <label>Select Template</label>
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

        <label>Area Name</label>
        <input
          type="text"
          value={recipeGroupName}
          onChange={(e) => setRecipeGroupName(e.target.value)}
          disabled={isLocked}
        />

        <button onClick={handleCreateRecipeGroup}>Create Area</button>
      </div>
    </BaseModal>
  );
}