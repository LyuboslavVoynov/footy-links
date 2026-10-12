import Link from "next/link";

export default function Home() {
  return (
    <main className="landing-page">
      <section className="landing-card" aria-labelledby="page-title">
        <p className="eyebrow">A football connection game</p>
        <h1 id="page-title">FOOTBALL LINKS</h1>
        <p className="tagline">
          Get from one footballer to another through the clubs they played for.
        </p>
        <Link href="/game" className="start-button">Start Game</Link>
      </section>
    </main>
  );
}
