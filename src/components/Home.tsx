import "./Home.css";

export default function Home(): JSX.Element {
  return (
    <div className="home">
      <h1>What do you need today?</h1>
      <p>Pick a category to find local help nearby - or offer your own skills to the neighbourhood.</p>

      <div className="search">
        <input type="search" placeholder="What are you looking for?" />
        <button>Search</button>
      </div>

    </div>
  );
}

