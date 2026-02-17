import { useState } from "react";
import Navbar from "../Navbar/Navbar";
import Sidebar from "../Sidebar/Sidebar";
import GroupModal from "../../Modals/GroupModal/GroupModal";
import DeviceModal from "../../Modals/DeviceModal/DeviceModal";
import "./layout.css";

export default function Layout() {
  const [activeModal, setActiveModal] = useState(null);

  const closeModal = () => setActiveModal(null);

  return (
    <div className="layout-container">
      <Navbar />

      <Sidebar onOpenModal={setActiveModal} />

      <div className="layout-content">
        <h2>Welcome to APP SQUARE</h2>
      </div>

      <GroupModal
        isOpen={activeModal === "createGroup"}
        onClose={closeModal}
      />

      <DeviceModal
        isOpen={activeModal === "createDevice"}
        onClose={closeModal}
        onSave={(data) => console.log("Device:", data)}
      />
    </div>
  );
}