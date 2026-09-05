import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import SignIn from "./pages/SignIn";
import Profile from "./pages/Profile";
import CreateListing from "./pages/CreateListing";
import MyApartments from "./pages/MyApartments";
import ApartmentDetails from "./pages/ApartmentDetails";

export default function Main() {
  return (
    <main className="main">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sign-in" element={<SignIn />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/create-listing" element={<CreateListing />} />
        <Route path="/my-apartments" element={<MyApartments />} />
        <Route path="/apartments/:id" element={<ApartmentDetails />} />
      </Routes>
    </main>
  );
}

