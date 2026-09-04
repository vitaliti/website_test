import "./Home.css";
import { useState } from "react";
import SelectFilter from "../sub_components/SelectFilter";
import InputFilter from "../sub_components/InputFilter";

export default function Home() {
  const [bedrooms, setBedrooms] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [budget, setBudget] = useState("");

  return (
    <div className="home">
      <h1>Find your apartment in Sofia.</h1>
      <p>Search rentals across the city — no account needed.</p>

      <div className="filters">
        <InputFilter
          label="Budget"
          placeholder="e.g 600"
          value={budget}
          onChange={setBudget}>
        </InputFilter>

        <SelectFilter
          label="Bedrooms"
          value={bedrooms}
          onChange={setBedrooms}
          options={[
            {value: "", label: "Any"},
            {value: "1", label: "1 bedroom"},
            {value: "2", label: "2 bedrooms"},
            {value: "3", label: "3 bedrooms"},
            {value: "4", label: "4+ bedrooms"}
          ]}
        />

        <SelectFilter
          label="Neighbourhoods"
          value={neighborhood}
          onChange={setNeighborhood}
          options={[
            {value: "", label: "Any"},
            {value: "lozenec", label: "Lozenec"},
            {value: "vitosha", label: "Vitosha"}
          ]}
        />

        <div className="filter">
          <span>Neghbourhood</span>
          <input placeholder="e.g 600" />
        </div>

        <div className="filter">
          <span>Furnished</span>
          <input placeholder="e.g Yes" />
        </div>

        <div className="filter">
          <span>floor</span>
          <input placeholder="e.g 1" />
        </div>

        {/* <button>Search</button> */}
      </div>

    </div>
  );
}

