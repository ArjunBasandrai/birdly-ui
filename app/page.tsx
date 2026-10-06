import { BirdIdentifier } from "@/components/bird-identifier";

export default function Home() {
  return (
    <main className="page-shell">
      <header className="site-header">
        <a className="wordmark" href="#main-workspace" aria-label="Birdly home">
          Birdly
        </a>
      </header>

      <section className="intro" aria-labelledby="page-title">
        <h1 id="page-title">Identify the bird in your photograph.</h1>
        <p>Upload a photograph, then place the square around one bird.</p>
      </section>

      <BirdIdentifier />
    </main>
  );
}
