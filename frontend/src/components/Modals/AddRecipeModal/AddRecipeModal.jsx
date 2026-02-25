import { useEffect, useState } from "react";
import BaseModal from "../BaseModal/BaseModal";
import { useRecipes } from "../../../context/RecipeContext/RecipeContext";
import api from "../../../Utility/api";
import "./addRecipeModal.css";

export default function AddRecipeModal({
  isOpen,
  onClose,
  recipeGroupId,
  templateGroupId,
}) {
  const { addRecipeLocal } = useRecipes();

  const [recipeName, setRecipeName] = useState("");
  const [templateDevices, setTemplateDevices] = useState([]);
  const [selectedDevices, setSelectedDevices] = useState([]);

  useEffect(() => {
    if (!isOpen) return;

    setRecipeName("");
    setSelectedDevices([]);

    const fetchDevices = async () => {
      try {
        const res = await api.get(
          `/templates/${templateGroupId}/devices`
        );
        setTemplateDevices(res.data);
      } catch (err) {
        console.error("Device load failed:", err);
      }
    };

    fetchDevices();
  }, [isOpen, templateGroupId]);

  const toggleDevice = (id) => {
    if (selectedDevices.includes(id)) {
      setSelectedDevices(selectedDevices.filter((d) => d !== id));
    } else {
      setSelectedDevices([...selectedDevices, id]);
    }
  };

  const selectAll = () => {
    setSelectedDevices(templateDevices.map((d) => d.id));
  };

  const clearAll = () => {
    setSelectedDevices([]);
  };

  const handleCreate = async () => {
    if (!recipeName.trim()) {
      alert("Enter recipe name");
      return;
    }

    if (selectedDevices.length === 0) {
      alert("Select at least one device");
      return;
    }

    try {
      const res = await api.post("/recipes", {
        name: recipeName.trim(),
        recipe_group_id: recipeGroupId,
        selected_device_ids: selectedDevices,
      });

      addRecipeLocal(recipeGroupId, res.data);
      onClose();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to create recipe");
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Add Recipe">
      <div className="add-recipe-form">

        <label>Recipe Name</label>
        <input
          type="text"
          value={recipeName}
          onChange={(e) => setRecipeName(e.target.value)}
        />

        <label>Select Devices</label>

        <div className="device-selection">
          <div className="device-actions">
            <button type="button" onClick={selectAll}>Select All</button>
            <button type="button" onClick={clearAll}>Clear</button>
            <span>
              Selected: {selectedDevices.length} / {templateDevices.length}
            </span>
          </div>

          {templateDevices.map((device) => (
            <div key={device.id} className="device-row">
              <span>{device.name}</span>
              <input
                type="checkbox"
                checked={selectedDevices.includes(device.id)}
                onChange={() => toggleDevice(device.id)}
              />
            </div>
          ))}
        </div>

        <button onClick={handleCreate}>
          Save Recipe
        </button>

      </div>
    </BaseModal>
  );
}