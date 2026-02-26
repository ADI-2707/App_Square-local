import { useState, useEffect } from "react";
import BaseModal from "../BaseModal/BaseModal";
import { useEntities } from "../../../context/EntityContext/EntityContext";
import { useRecipes } from "../../../context/RecipeContext/RecipeContext";
import api from "../../../Utility/api";
import "./recipeModal.css";

export default function RecipeModal({ isOpen, onClose, initialTemplateId = null, }) {
  const { groups } = useEntities();
  const { addRecipeGroupLocal, addRecipeLocal } = useRecipes();

  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [recipeGroupName, setRecipeGroupName] = useState("");
  const [recipeName, setRecipeName] = useState("");
  const [createdGroupId, setCreatedGroupId] = useState(null);

  const [templateDevices, setTemplateDevices] = useState([]);
  const [selectedDevices, setSelectedDevices] = useState([]);

  useEffect(() => {
    if (isOpen) {
      setSelectedTemplate("");
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
        console.error("Failed to fetch template devices:", err);
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
      const res = await api.post("/recipes/groups", payload);

      setCreatedGroupId(res.data.id);
      addRecipeGroupLocal(selectedTemplate, res.data);
    } catch (err) {
      console.error("Recipe Group Error:", err);
      alert("Failed to create recipe group");
    }
  };

  const handleCreateRecipe = async () => {
    if (!createdGroupId || !recipeName.trim()) {
      alert("Create recipe group and enter recipe name");
      return;
    }

    if (selectedDevices.length === 0) {
      alert("Select at least one device");
      return;
    }

    try {
      const res = await api.post("/recipes", {
        name: recipeName.trim(),
        recipe_group_id: createdGroupId,
        selected_device_ids: selectedDevices,
      });

      addRecipeLocal(createdGroupId, res.data);
      onClose();
    } catch (err) {
      console.error("Recipe Creation Error:", err);
      alert("Failed to create recipe");
    }
  };

  const toggleDevice = (deviceId) => {
    if (selectedDevices.includes(deviceId)) {
      setSelectedDevices(selectedDevices.filter((id) => id !== deviceId));
    } else {
      setSelectedDevices([...selectedDevices, deviceId]);
    }
  };

  const selectAllDevices = () => {
    setSelectedDevices(templateDevices.map((d) => d.id));
  };

  const clearDevices = () => {
    setSelectedDevices([]);
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Create Recipe">
      <div className="group-form">
        <label>Select Template</label>
        <select
          value={selectedTemplate}
          onChange={(e) => setSelectedTemplate(e.target.value)}
        >
          <option value="">Select Template</option>
          {groups.allIds.map((id) => (
            <option key={id} value={id}>
              {groups.byId[id].name}
            </option>
          ))}
        </select>

        {templateDevices.length > 0 && (
          <>
            <label>Select Devices</label>

            <div className="device-selection">
              <div className="device-actions">
                <button type="button" onClick={selectAllDevices}>
                  Select All
                </button>
                <button type="button" onClick={clearDevices}>
                  Clear
                </button>
                <span className="device-count">
                  Selected: {selectedDevices.length} / {templateDevices.length}
                </span>
              </div>

              {templateDevices.map((device) => (
                <div key={device.id} className="device-row">
                  <span className="device-name">{device.name}</span>

                  <input
                    type="checkbox"
                    checked={selectedDevices.includes(device.id)}
                    onChange={() => toggleDevice(device.id)}
                    className="device-checkbox"
                  />
                </div>
              ))}
            </div>
          </>
        )}

        <label>Area Name</label>
        <input
          type="text"
          value={recipeGroupName}
          onChange={(e) => setRecipeGroupName(e.target.value)}
        />

        <button onClick={handleCreateRecipeGroup}>Create Area</button>

        {createdGroupId && (
          <>
            <label>Recipe Name</label>
            <input
              type="text"
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
            />

            <button onClick={handleCreateRecipe}>Save Recipe</button>
          </>
        )}
      </div>
    </BaseModal>
  );
}
