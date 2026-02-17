import { useState } from "react";
import BaseModal from "../BaseModal/BaseModal";
import DeviceModal from "../DeviceModal/DeviceModal";
import "./groupModal.css";
import api from "../../../Utility/api";

export default function GroupModal({ isOpen, onClose, onSave }) {
  const [groupName, setGroupName] = useState("");
  const [description, setDescription] = useState("");
  const [devices, setDevices] = useState([]);
  const [isDeviceModalOpen, setIsDeviceModalOpen] = useState(false);

  const addDevice = (deviceData) => {
    setDevices([...devices, deviceData]);
  };

  const handleSave = async () => {
    const payload = {
      name: groupName,
      devices: devices.map((device) => ({
        name: device.device_name,
        type: "generic",
        tags: device.tags.map((tag) => ({
          name: tag.name,
        })),
      })),
    };

    try {
      await api.post("/templates/full", payload);

      setGroupName("");
      setDescription("");
      setDevices([]);

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
          <label>Group Name</label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
          />

          <label>Description</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />

          <div className="device-section">
            <div className="device-header">
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
            <button onClick={handleSave}>Save Group</button>
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
