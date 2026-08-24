import { Routes, Route } from "react-router-dom";
import "./Body.css";
import Home from "./Home";

export default function Body() {
  return (
    <main className="body">
      <Routes>
        <Route path="/" element={<Home />} />
        {/* <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} /> */}
      </Routes>
    </main>
  );
}

