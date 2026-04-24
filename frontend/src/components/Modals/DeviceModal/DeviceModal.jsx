import { useEffect, useState } from "react";
import FormLabel from "../../common/FormLabel/FormLabel";
import BaseModal from "../BaseModal/BaseModal.jsx";
import EditIcon from "../../../assets/icons/EditIcon";
import DeleteIcon from "../../../assets/icons/DeleteIcon";
import CloseIcon from "../../../assets/icons/CloseIcon";
import { useEntities } from "../../../context/EntityContext/EntityContext";
import "./deviceModal.css";

export default function DeviceModal({
  isOpen,
  onClose,
  onSave,
  initialDevice,
}) {
  const { searchTemplateTags } = useEntities();
  const [deviceName, setDeviceName] = useState("");
  const [tags, setTags] = useState([]);
  const [tagQuery, setTagQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [errors, setErrors] = useState({});

  const [editingIndex, setEditingIndex] = useState(null);
  const [editQuery, setEditQuery] = useState("");
  const [editingResults, setEditingResults] = useState([]);
  const [isSearchingEdit, setIsSearchingEdit] = useState(false);

  useEffect(() => {
    if (initialDevice) {
      setDeviceName(initialDevice.device_name);
      setTags(initialDevice.tags);
    } else {
      setDeviceName("");
      setTags([]);
    }
  }, [initialDevice, isOpen]);

  useEffect(() => {
    if (!isOpen || editingIndex !== null) return;

    const trimmedQuery = tagQuery.trim();

    if (!trimmedQuery) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setIsSearching(true);
        const results = await searchTemplateTags(trimmedQuery);
        setSearchResults(results);
      } catch (error) {
        console.error("Failed to fetch tag suggestions:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [isOpen, tagQuery, editingIndex, searchTemplateTags]);

  useEffect(() => {
    if (!isOpen || editingIndex === null) return;

    const trimmedQuery = editQuery.trim();

    if (!trimmedQuery) {
      setEditingResults([]);
      setIsSearchingEdit(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        setIsSearchingEdit(true);
        const results = await searchTemplateTags(trimmedQuery);
        setEditingResults(results);
      } catch (error) {
        console.error("Failed to fetch tag suggestions:", error);
        setEditingResults([]);
      } finally {
        setIsSearchingEdit(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [isOpen, editQuery, editingIndex, searchTemplateTags]);

  const tagExists = (name, excludeIndex = null) => {
    const normalized = name.trim().toLowerCase();
    return tags.some(
      (t, i) =>
        i !== excludeIndex && t.name.trim().toLowerCase() === normalized,
    );
  };

  const addTag = (tagOption) => {
    const tagName = tagOption?.tag_name?.trim();

    if (!tagName) return;

    if (tagExists(tagName)) {
      alert("Tag already exists");
      return;
    }

    setTags((prev) => [
      ...prev,
      {
        name: tagName,
        lookup_value: tagOption.lookup_value,
      },
    ]);
    setTagQuery("");
    setSearchResults([]);

    if (errors.tags) {
      setErrors((prev) => ({ ...prev, tags: false }));
    }
  };

  const deleteTag = (index) => {
    setTags((prev) => prev.filter((_, i) => i !== index));
  };

  const startEdit = (index) => {
    setEditingIndex(index);
    setEditQuery(tags[index].name);
    setEditingResults([]);
  };

  const cancelEdit = () => {
    setEditingIndex(null);
    setEditQuery("");
    setEditingResults([]);
  };

  const confirmEdit = (index, tagOption) => {
    const tagName = tagOption?.tag_name?.trim();

    if (!tagName) return;

    if (tagExists(tagName, index)) {
      alert("Tag already exists");
      return;
    }

    const updated = [...tags];
    updated[index] = {
      ...updated[index],
      name: tagName,
      lookup_value: tagOption.lookup_value,
    };
    setTags(updated);

    setEditingIndex(null);
    setEditQuery("");
    setEditingResults([]);
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
    setTagQuery("");
    setSearchResults([]);
    setEditingIndex(null);
    setEditQuery("");
    setEditingResults([]);
    setErrors({});

    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialDevice ? "Edit Equipment" : "Create Equipment"}
    >
      <div className="device-form">
        <div className="form-field">
          <FormLabel required>Equipment Name</FormLabel>
          <input
            type="text"
            value={deviceName}
            className={errors.deviceName ? "error-field" : ""}
            onChange={(e) => {
              setDeviceName(e.target.value);
              if (errors.deviceName) {
                setErrors((prev) => ({
                  ...prev,
                  deviceName: false,
                }));
              }
            }}
          />
        </div>

        <div className={`tag-section ${errors.tags ? "error-field" : ""}`}>
          <div className="tag-panel-header">
            <h4>
              Tags <span className="required-star">*</span>
            </h4>
          </div>

          <div className="tag-autocomplete">
            <div className="tag-input-row">
              <input
                type="text"
                placeholder="Search tag name"
                value={tagQuery}
                onChange={(e) => setTagQuery(e.target.value)}
              />
            </div>

            {(isSearching || searchResults.length > 0 || tagQuery.trim()) && (
              <ul className="tag-search-results tag-search-results-floating">
                {isSearching ? (
                  <li className="tag-search-item muted">Searching...</li>
                ) : searchResults.length > 0 ? (
                  searchResults.map((tagOption) => (
                    <li key={tagOption.lookup_value} className="tag-search-item">
                      <button type="button" onClick={() => addTag(tagOption)}>
                        {tagOption.tag_name}
                      </button>
                    </li>
                  ))
                ) : (
                  <li className="tag-search-item muted">
                    No matching tags found
                  </li>
                )}
              </ul>
            )}
          </div>

          <ul className="tag-list">
            {tags.map((tag, index) => (
              <li key={index} className="tag-row">
                {editingIndex === index ? (
                  <div className="tag-row-editor">
                    <input
                      className="edit-input"
                      value={editQuery}
                      onChange={(e) => setEditQuery(e.target.value)}
                    />

                    <div className="tag-actions">
                      <button className="icon-btn cancel" onClick={cancelEdit}>
                        <CloseIcon />
                      </button>
                    </div>

                    {(isSearchingEdit || editingResults.length > 0 || editQuery.trim()) && (
                      <ul className="tag-search-results edit-results">
                        {isSearchingEdit ? (
                          <li className="tag-search-item muted">Searching...</li>
                        ) : editingResults.length > 0 ? (
                          editingResults.map((tagOption) => (
                            <li
                              key={tagOption.lookup_value}
                              className="tag-search-item"
                            >
                              <button
                                type="button"
                                onClick={() => confirmEdit(index, tagOption)}
                              >
                                {tagOption.tag_name}
                              </button>
                            </li>
                          ))
                        ) : (
                          <li className="tag-search-item muted">
                            No matching tags found
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                ) : (
                  <>
                    <span className="tag-name">{tag.name}</span>

                    <div className="tag-actions">
                      <button
                        className="icon-btn edit"
                        onClick={() => startEdit(index)}
                      >
                        <EditIcon />
                      </button>

                      <button
                        className="icon-btn delete"
                        onClick={() => deleteTag(index)}
                      >
                        <DeleteIcon />
                      </button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="modal-actions">
          <button onClick={handleSave}>Save Equipment</button>
        </div>
      </div>
    </BaseModal>
  );
}
