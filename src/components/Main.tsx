import { Routes, Route } from "react-router-dom";
import "./Main.css";
import Home from "./pages/Home";

export default function Main() {
  return (
    <main className="main">
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </main>
  );
}

