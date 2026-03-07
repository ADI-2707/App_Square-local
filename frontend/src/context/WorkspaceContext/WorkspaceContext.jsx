import { createContext, useContext, useState } from "react";

const WorkspaceContext = createContext();

export function WorkspaceProvider({ children }) {

  const [workspace, setWorkspace] = useState(null);

  const openWorkspace = (type, data) => {
    setWorkspace({
      type,
      data
    });
  };

  const clearWorkspace = () => {
    setWorkspace(null);
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspace,
        openWorkspace,
        clearWorkspace
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export const useWorkspace = () => useContext(WorkspaceContext);