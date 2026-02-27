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

  const loadGroups = async () => {
    if (groups.allIds.length > 0) return;

    const res = await api.get("/templates/groups");

    const byId = {};
    const allIds = [];

    res.data.forEach((group) => {
      byId[group.id] = group;
      allIds.push(group.id);
    });

    setGroups({ byId, allIds });
  };

  const loadDevices = async (groupId) => {
    if (devices.byGroupId[groupId]) return;

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
  };

  const loadTags = async (deviceId) => {
    if (tags.byDeviceId[deviceId]) return;

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
    await api.delete(`/templates/${groupId}`);

    setGroups((prev) => ({
      byId: Object.fromEntries(
        Object.entries(prev.byId).filter(([id]) => Number(id) !== groupId),
      ),
      allIds: prev.allIds.filter((id) => id !== groupId),
    }));
  };

  return (
    <EntityContext.Provider
      value={{
        groups,
        devices,
        tags,
        loadGroups,
        loadDevices,
        loadTags,
        addFullTemplateGroup,
        deleteTemplate,
      }}
    >
      {children}
    </EntityContext.Provider>
  );
}

export const useEntities = () => useContext(EntityContext);
