import { useState } from "react";
import BaseModal from "../BaseModal/BaseModal.jsx";
import EditIcon from "../../../assets/icons/EditIcon";
import DeleteIcon from "../../../assets/icons/DeleteIcon";
import CheckIcon from "../../../assets/icons/CheckIcon";
import CloseIcon from "../../../assets/icons/CloseIcon";
import "./deviceModal.css";

export default function DeviceModal({ isOpen, onClose, onSave }) {
  const [deviceName, setDeviceName] = useState("");
  const [tags, setTags] = useState([]);
  const [tagName, setTagName] = useState("");
  const [errors, setErrors] = useState({});

  const [editingIndex, setEditingIndex] = useState(null);
  const [editValue, setEditValue] = useState("");

  const tagExists = (name, excludeIndex = null) => {
    const normalized = name.trim().toLowerCase();
    return tags.some(
      (t, i) =>
        i !== excludeIndex &&
        t.name.toLowerCase() === normalized
    );
  };

  const addTag = () => {
    if (!tagName.trim()) return;

    if (tagExists(tagName)) {
      alert("Tag already exists");
      return;
    }

    setTags((prev) => [...prev, { name: tagName.trim() }]);
    setTagName("");
    if (errors.tags) {
      setErrors((prev) => ({ ...prev, tags: false }));
    }
  };

  const handleSave = () => {
    const newErrors = {};

    if (!deviceName.trim()) {
      newErrors.deviceName = true;
    }

    if (tags.length === 0) {
      newErrors.tags = true;
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      alert("Please fix highlighted fields before saving.");
      return;
    }

    const payload = {
      device_name: deviceName.trim(),
      tags,
    };

    onSave(payload);

    setDeviceName("");
    setTags([]);
    setTagName("");
    setErrors({});
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Create Device">
      <div className="device-form">
        <div className="form-field">
          <label>Device Name</label>
          <input
            type="text"
            value={deviceName}
            className={errors.deviceName ? "error-field" : ""}
            onChange={(e) => {
              setDeviceName(e.target.value);
              if (errors.deviceName) {
                setErrors((prev) => ({ ...prev, deviceName: false }));
              }
            }}
          />
        </div>

        <div
          className={`tag-section ${
            errors.tags ? "error-field" : ""
          }`}
        >
          <div className="tag-panel-header">
            <h4>Tags</h4>
          </div>

          <div className="tag-input-row">
            <input
              type="text"
              placeholder="Tag Name"
              value={tagName}
              onChange={(e) => setTagName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTag()}
            />
            <button onClick={addTag}>Add</button>
          </div>

          <ul className="tag-list">
            {tags.map((tag, index) => (
              <li key={index} className="tag-row">
                <span className="tag-name">{tag.name}</span>
              </li>
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