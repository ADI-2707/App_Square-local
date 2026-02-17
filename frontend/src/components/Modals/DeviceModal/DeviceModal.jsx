import { useState } from "react";
import BaseModal from "../BaseModal/BaseModal.jsx";
import "./deviceModal.css";

export default function DeviceModal({ isOpen, onClose, onSave }) {
  const [deviceName, setDeviceName] = useState("");
  const [tags, setTags] = useState([]);
  const [tagName, setTagName] = useState("");

  const addTag = () => {
    if (!tagName.trim()) return;

    setTags([...tags, { name: tagName }]);
    setTagName("");
  };

  const handleSave = () => {
    const payload = {
      device_name: deviceName,
      tags,
    };

    onSave(payload);
    setDeviceName("");
    setTags([]);
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Device"
    >
      <div className="device-form">
        <label>Device Name</label>
        <input
          type="text"
          value={deviceName}
          onChange={(e) => setDeviceName(e.target.value)}
        />

        <div className="tag-section">
          <h4>Tags</h4>

          <div className="tag-input">
            <input
              type="text"
              placeholder="Tag Name"
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
            />
            <button onClick={addTag}>Add</button>
          </div>

          <ul>
            {tags.map((tag, index) => (
              <li key={index}>{tag.name}</li>
            ))}
          </ul>
        </div>

        <div className="modal-actions">
          <button onClick={handleSave}>Save Device</button>
        </div>
      </div>
    </BaseModal>
  );
}