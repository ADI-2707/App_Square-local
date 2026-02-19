import { useState } from "react";
import Navbar from "../Navbar/Navbar";
import Sidebar from "../Sidebar/Sidebar";
import GroupModal from "../../Modals/GroupModal/GroupModal";
import RecipeModal from "../../Modals/RecipeModal/RecipeModal";
import ViewRecipeModal from "../../Modals/ViewRecipeModal/ViewRecipeModal";
import "./layout.css";

export default function Layout() {
  const [activeModal, setActiveModal] = useState(null);

  const closeModal = () => {
    setActiveModal(null);
  };

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

      <RecipeModal
        isOpen={activeModal === "createRecipe"}
        onClose={closeModal}
      />

      <ViewRecipeModal
        isOpen={activeModal === "viewRecipes"}
        onClose={closeModal}
      />
    </div>
  );
}