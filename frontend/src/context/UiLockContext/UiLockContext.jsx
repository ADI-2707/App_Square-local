import { createContext, useContext, useState } from "react";

const UiLockContext = createContext();

export const UiLockProvider = ({ children }) => {
  const [isLocked, setIsLocked] = useState(false);
  const [message, setMessage] = useState("");

  const lockUI = (msg = "Processing...") => {
    setMessage(msg);
    setIsLocked(true);
  };

  const unlockUI = () => {
    setIsLocked(false);
    setMessage("");
  };

  return (
    <UiLockContext.Provider value={{ isLocked, message, lockUI, unlockUI }}>
      {children}
    </UiLockContext.Provider>
  );
};

export const useUiLock = () => useContext(UiLockContext);