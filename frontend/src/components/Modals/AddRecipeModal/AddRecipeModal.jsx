import { useEffect, useState } from "react";
import BaseModal from "../BaseModal/BaseModal";
import { useRecipes } from "../../../context/RecipeContext/RecipeContext";
import api from "../../../Utility/api";
import "../RecipeModal/recipeModal.css";

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
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) return;

    setRecipeName("");
    setSelectedDevices([]);
    setErrors({});

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

    if (errors.devices) {
      setErrors((prev) => ({ ...prev, devices: false }));
    }
  };

  const selectAll = () => {
    setSelectedDevices(templateDevices.map((d) => d.id));
    if (errors.devices) {
      setErrors((prev) => ({ ...prev, devices: false }));
    }
  };

  const clearAll = () => {
    setSelectedDevices([]);
  };

  const handleCreate = async () => {
    const newErrors = {};

    if (!recipeName.trim()) {
      newErrors.recipeName = true;
    }

    if (selectedDevices.length === 0) {
      newErrors.devices = true;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      alert("Please fix highlighted fields before saving.");
      return;
    }

    try {
      const res = await api.post("/recipes", {
        name: recipeName.trim(),
        recipe_group_id: recipeGroupId,
        selected_device_ids: selectedDevices,
      });

      addRecipeLocal(recipeGroupId, res.data);
      setErrors({});
      onClose();
    } catch (err) {
      alert(err.response?.data?.detail || "Failed to create recipe");
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Add Recipe">
      <div className="group-form">
        <label>Recipe Name</label>
        <input
          type="text"
          value={recipeName}
          className={errors.recipeName ? "error-field" : ""}
          onChange={(e) => {
            setRecipeName(e.target.value);
            if (errors.recipeName) {
              setErrors((prev) => ({
                ...prev,
                recipeName: false,
              }));
            }
          }}
        />

        <label>Select Devices</label>

        <div
          className={`device-selection ${
            errors.devices ? "error-field" : ""
          }`}
        >
          <div className="device-actions">
            <button type="button" onClick={selectAll}>
              Select All
            </button>
            <button type="button" onClick={clearAll}>
              Clear
            </button>
            <span>
              Selected: {selectedDevices.length} /{" "}
              {templateDevices.length}
            </span>
          </div>

          {templateDevices.map((device) => (
            <div key={device.id} className="device-row">
              <span className="device-name">
                {device.name}
              </span>

              <input
                type="checkbox"
                checked={selectedDevices.includes(device.id)}
                onChange={() => toggleDevice(device.id)}
                className="device-checkbox"
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