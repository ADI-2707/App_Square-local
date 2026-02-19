import { useRecipes } from "../../../context/RecipeContext/RecipeContext";

export default function Layout() {
  const [activeModal, setActiveModal] = useState(null);
  const { activeRecipe } = useRecipes(); // ⭐ NEW

  const closeModal = () => {
    setActiveModal(null);
  };

  return (
    <div className="layout-container">
      <Navbar />
      <Sidebar onOpenModal={setActiveModal} />

      <div className="layout-content">
        {!activeRecipe ? (
          <h2>Welcome to APP SQUARE</h2>
        ) : (
          <div className="recipe-workspace">
            <h2>Active Recipe: {activeRecipe.name}</h2>

            <table className="recipe-table">
              <thead>
                <tr>
                  <th>Device</th>
                  <th>Tag</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {activeRecipe.devices?.map(device =>
                  device.tag_values?.map(tag => (
                    <tr key={tag.id}>
                      <td>{device.device_name}</td>
                      <td>{tag.tag_name}</td>
                      <td>{tag.value}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
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
        isOpen={activeModal === "viewRecipe"}
        onClose={closeModal}
      />
    </div>
  );
}