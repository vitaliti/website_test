import "./Home.css";

export default function Home() {
  return (
    <div className="home">
      <h1>Find your apartment in Sofia.</h1>
      <p>Search rentals across the city — no account needed.</p>

      <div className="search">
        <input type="search" placeholder="What are you looking for?" />
        <button>Search</button>
      </div>

    </div>
  );
}

