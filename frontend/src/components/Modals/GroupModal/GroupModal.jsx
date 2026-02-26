import { useState } from "react";
import { useEntities } from "../../../context/EntityContext/EntityContext";
import BaseModal from "../BaseModal/BaseModal";
import DeviceModal from "../DeviceModal/DeviceModal";
import api from "../../../Utility/api";
import "./groupModal.css";

export default function GroupModal({ isOpen, onClose }) {
  const { addFullTemplateGroup } = useEntities();

  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [devices, setDevices] = useState([]);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [errors, setErrors] = useState({});

  const addDevice = (deviceData) => {
    setDevices((prev) => [...prev, deviceData]);
  };

  const handleSave = async () => {
    const newErrors = {};

    if (!groupName.trim()) {
      newErrors.groupName = true;
    }

    if (devices.length === 0) {
      newErrors.devices = true;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      alert("Please fix highlighted fields before saving.");
      return;
    }

    const payload = {
      name: groupName.trim(),
      devices: devices.map((device) => ({
        name: device.device_name,
        type: "generic",
        tags: device.tags.map((tag) => ({
          name: tag.name,
        })),
      })),
    };

    try {
      const response = await api.post("/templates/full", payload);

      addFullTemplateGroup(response.data);

      setGroupName("");
      setDescription("");
      setDevices([]);
      setErrors({});
      onClose();
    } catch (error) {
      console.error(error);
      alert("Failed to save group");
    }
  };

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title="Create Template Group"
      >
        <div className="group-form">
          <div className="form-field">
            <label>Template Name</label>
            <input
              type="text"
              value={groupName}
              className={errors.groupName ? "error-field" : ""}
              onChange={(e) => {
                setGroupName(e.target.value);
                if (errors.groupName) {
                  setErrors((prev) => ({ ...prev, groupName: false }));
                }
              }}
            />
          </div>

          <div className="form-field">
            <label>Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div
            className={`device-section ${
              errors.devices ? "error-field" : ""
            }`}
          >
            <div className="group-device-header">
              <h4>Devices</h4>
              <button onClick={() => setIsDeviceModalOpen(true)}>
                + Add Device
              </button>
            </div>

            <ul>
              {devices.map((device, index) => (
                <li key={index}>
                  {device.device_name} ({device.tags.length} tags)
                </li>
              ))}
            </ul>
          </div>

          <div className="modal-actions">
            <button onClick={handleSave}>Save Template</button>
          </div>
        </div>
      </BaseModal>

      <DeviceModal
        isOpen={isDeviceModalOpen}
        onClose={() => setIsDeviceModalOpen(false)}
        onSave={addDevice}
      />
    </>
  );
}