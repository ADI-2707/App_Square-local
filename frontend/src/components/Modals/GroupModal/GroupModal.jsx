import { useState } from "react";
import { useEntities } from "../../../context/EntityContext/EntityContext";
import { useUiLock } from "../../../context/UiLockContext/UiLockContext";
import BaseModal from "../BaseModal/BaseModal";
import DeviceModal from "../DeviceModal/DeviceModal";
import EditIcon from "../../../assets/icons/EditIcon";
import DeleteIcon from "../../../assets/icons/DeleteIcon";
import api from "../../../Utility/api";
import "./groupModal.css";

export default function GroupModal({ isOpen, onClose }) {
  const { addFullTemplateGroup } = useEntities();
  const { lockUI, unlockUI, isLocked } = useUiLock();

  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");

  const [devices, setDevices] = useState([]);

  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingDevice, setEditingDevice] = useState(null);

  const [errors, setErrors] = useState({});

  const addDevice = (deviceData) => {
    setDevices((prev) => [...prev, deviceData]);
  };

  const updateDevice = (deviceData) => {
    const updated = [...devices];
    updated[editingIndex] = deviceData;
    setDevices(updated);
    setEditingIndex(null);
  };

  const deleteDevice = (index) => {
    setDevices((prev) => prev.filter((_, i) => i !== index));
  };

  const openAddDevice = () => {
    setEditingIndex(null);
    setEditingDevice(null);
    setIsDeviceModalOpen(true);
  };

  const openEditDevice = (index) => {
    setEditingIndex(index);
    setEditingDevice(devices[index]);
    setIsDeviceModalOpen(true);
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
      lockUI("Creating template...");

      const response = await api.post("/templates/full", payload);

      addFullTemplateGroup(response.data);

      setGroupName("");
      setDescription("");
      setDevices([]);
      setErrors({});
      setEditingIndex(null);

      onClose();
    } catch (error) {
      console.error(error);
      alert("Failed to save group");
    } finally {
      unlockUI();
    }
  };

  return (
    <>
      <BaseModal
        isOpen={isOpen}
        onClose={onClose}
        title="Create Recipe Template Group"
      >
        <div className="group-form">
          <div className="form-field">
            <label>Recipe Template Name</label>
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
            className={`device-section ${errors.devices ? "error-field" : ""}`}
          >
            <div className="group-device-header">
              <h4>Devices</h4>

              <button onClick={openAddDevice}>+ Add Device</button>
            </div>

            <ul>
              {devices.map((device, index) => (
                <li key={index} className="device-row">
                  <div className="device-info">
                    {device.device_name} ({device.tags.length} tags)
                  </div>

                  <div className="device-actions">
                    <button
                      className="icon-btn edit"
                      onClick={() => openEditDevice(index)}
                    >
                      <EditIcon />
                    </button>

                    <button
                      className="icon-btn delete"
                      onClick={() => deleteDevice(index)}
                    >
                      <DeleteIcon />
                    </button>
                  </div>
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
        onSave={editingIndex !== null ? updateDevice : addDevice}
        initialDevice={editingDevice}
      />
    </>
  );
}
