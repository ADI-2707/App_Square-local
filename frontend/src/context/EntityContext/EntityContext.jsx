import { createContext, useContext, useState } from "react";
import api from "../../Utility/api";

const EntityContext = createContext();

export function EntityProvider({ children }) {
  const [groups, setGroups] = useState({
    byId: {},
    allIds: [],
  });

  const [devices, setDevices] = useState({
    byId: {},
    byGroupId: {},
  });

  const [tags, setTags] = useState({
    byId: {},
    byDeviceId: {},
  });

  const [activeTemplate, setActiveTemplate] = useState(null);

  const loadGroups = async () => {
    if (groups.allIds.length > 0) return;

    try {
      const res = await api.get("/templates/groups");

      const byId = {};
      const allIds = [];

      res.data.forEach((group) => {
        byId[group.id] = group;
        allIds.push(group.id);
      });

      setGroups({ byId, allIds });
    } catch (err) {
      console.error("Failed to load templates:", err);
      alert(err?.response?.data?.detail || "Failed to load templates");
    }
  };

  const loadDevices = async (groupId) => {
    if (devices.byGroupId[groupId]) return;

    try {
      const res = await api.get(`/templates/groups/${groupId}/devices`);

      const newById = { ...devices.byId };
      const newByGroupId = { ...devices.byGroupId };

      newByGroupId[groupId] = [];

      res.data.forEach((device) => {
        newById[device.id] = device;
        newByGroupId[groupId].push(device.id);
      });

      setDevices({
        byId: newById,
        byGroupId: newByGroupId,
      });
    } catch (err) {
      console.error("Failed to load devices:", err);
      alert(err?.response?.data?.detail || "Failed to load devices");
    }
  };

  const loadTags = async (deviceId) => {
    if (tags.byDeviceId[deviceId]) return;

    try {
      const res = await api.get(`/templates/devices/${deviceId}/tags`);

      const newById = { ...tags.byId };
      const newByDeviceId = { ...tags.byDeviceId };

      newByDeviceId[deviceId] = [];

      res.data.forEach((tag) => {
        newById[tag.id] = tag;
        newByDeviceId[deviceId].push(tag.id);
      });

      setTags({
        byId: newById,
        byDeviceId: newByDeviceId,
      });
    } catch (err) {
      console.error("Failed to load tags:", err);
      alert(err?.response?.data?.detail || "Failed to load tags");
    }
  };

  const getFullTemplate = async (templateId) => {
    try {
      const res = await api.get(`/templates/${templateId}/full`);
      return res.data;
    } catch (err) {
      console.error("Failed to load full template:", err);
      alert(err?.response?.data?.detail || "Failed to load template");
      throw err;
    }
  };

  const getDeviceWithTags = async (deviceId) => {
    try {
      const res = await api.get(`/templates/devices/${deviceId}/full`);
      return res.data;
    } catch (err) {
      console.error("Failed to load device:", err);
      alert(err?.response?.data?.detail || "Failed to load device");
      throw err;
    }
  };

  const openTemplateInWorkspace = (template) => {
    setActiveTemplate(template);
  };

  const clearActiveTemplate = () => {
    setActiveTemplate(null);
  };

  const addFullTemplateGroup = (groupData) => {
    const { id: groupId, name, devices: deviceList = [] } = groupData;

    setGroups((prev) => ({
      byId: {
        ...prev.byId,
        [groupId]: { id: groupId, name },
      },
      allIds: [...prev.allIds, groupId],
    }));

    deviceList.forEach((device) => {
      const deviceId = device.id;

      setDevices((prev) => ({
        byId: {
          ...prev.byId,
          [deviceId]: device,
        },
        byGroupId: {
          ...prev.byGroupId,
          [groupId]: [...(prev.byGroupId[groupId] || []), deviceId],
        },
      }));

      device.tags?.forEach((tag) => {
        const tagId = tag.id;

        setTags((prev) => ({
          byId: {
            ...prev.byId,
            [tagId]: tag,
          },
          byDeviceId: {
            ...prev.byDeviceId,
            [deviceId]: [...(prev.byDeviceId[deviceId] || []), tagId],
          },
        }));
      });
    });
  };

  const deleteTemplate = async (groupId) => {
    try {
      await api.delete(`/templates/${groupId}`);

      setGroups((prev) => ({
        byId: Object.fromEntries(
          Object.entries(prev.byId).filter(([id]) => Number(id) !== groupId),
        ),
        allIds: prev.allIds.filter((id) => id !== groupId),
      }));
    } catch (err) {
      console.error("Failed to delete template:", err);
      alert(err?.response?.data?.detail || "Failed to delete template");
    }
  };

  const deleteDevice = async (deviceId, templateId) => {
    try {
      await api.delete(`/templates/devices/${deviceId}`);

      setDevices((prev) => {
        const newById = { ...prev.byId };
        delete newById[deviceId];

        const newByGroupId = {
          ...prev.byGroupId,
          [templateId]: prev.byGroupId[templateId].filter(
            (id) => id !== deviceId,
          ),
        };

        return {
          byId: newById,
          byGroupId: newByGroupId,
        };
      });
    } catch (err) {
      console.error("Failed to delete device:", err);
      alert(err?.response?.data?.detail || "Failed to delete device");
    }
  };

  return (
    <EntityContext.Provider
      value={{
        groups,
        devices,
        tags,
        activeTemplate,
        loadGroups,
        loadDevices,
        loadTags,
        getFullTemplate,
        getDeviceWithTags,
        openTemplateInWorkspace,
        clearActiveTemplate,
        addFullTemplateGroup,
        deleteTemplate,
        deleteDevice,
      }}
    >
      {children}
    </EntityContext.Provider>
  );
}

export const useEntities = () => useContext(EntityContext);
