import { useState } from "react";
import BaseModal from "../BaseModal/BaseModal.jsx";
import "./deviceModal.css";

export default function DeviceModal({ isOpen, onClose, onSave }) {
  const [deviceName, setDeviceName] = useState("");
  const [tags, setTags] = useState([]);
  const [tagName, setTagName] = useState("");

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
  };

  const deleteTag = (index) => {
    setTags((prev) => prev.filter((_, i) => i !== index));
  };

  const startEdit = (index) => {
    setEditingIndex(index);
    setEditValue(tags[index].name);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditValue("");
  };

  const confirmEdit = (index) => {
    if (!editValue.trim()) return;

    if (tagExists(editValue, index)) {
      alert("Tag already exists");
      return;
    }

    const updated = [...tags];
    updated[index].name = editValue.trim();
    setTags(updated);

    setEditingIndex(null);
    setEditValue("");
  };

  const handleSave = () => {
    const payload = {
      device_name: deviceName,
      tags,
    };

    onSave(payload);

    setDeviceName("");
    setTags([]);
    setTagName("");
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
            onChange={(e) => setDeviceName(e.target.value)}
          />
        </div>

        <div className="tag-section">
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
                {editingIndex === index ? (
                  <>
                    <input
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                    />
                    <div className="tag-actions">
                      <button onClick={() => confirmEdit(index)}>✓</button>
                      <button onClick={cancelEdit}>✕</button>
                    </div>
                  </>
                ) : (
                  <>
                    <span>{tag.name}</span>
                    <div className="tag-actions">
                      <button onClick={() => startEdit(index)}>Edit</button>
                      <button onClick={() => deleteTag(index)}>Delete</button>
                    </div>
                  </>
                )}
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