import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";

export default function Profile() {
  const navigate = useNavigate();

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Logout failed:", error);
      return;
    }

    navigate("/");
  }

  return (
    <main>
      <h1>Your Profile</h1>

      <button onClick={() => navigate("/create-listing")}>
        Create Listing
      </button>

      <button onClick={handleLogout}>
        Log out
      </button>
    </main>
  );
}
