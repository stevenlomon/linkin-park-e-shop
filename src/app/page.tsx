import Link from 'next/link'

export default function HomePage() {
  return (
    <>
      {/* Hero. Butiken kör en stor svart yta med enbart typografi — vi gör samma sak
          tills vi har riktiga kampanjbilder att lägga in */}
      <section className="border-b border-line">
        <div className="lp-container flex min-h-[60vh] flex-col items-center justify-center gap-6 py-20 text-center">
          <p className="lp-eyebrow text-accent">From Zero World Tour 24/26</p>

          <h1 className="text-5xl font-bold uppercase leading-[0.95] tracking-tight sm:text-7xl">
            Linkin Park
            <span className="mt-2 block text-accent">Merchandise</span>
          </h1>

          <p className="max-w-xl text-sm text-muted">
            Officiella t-shirts, hoodies och samlarobjekt. Nya släpp från turnén,
            tillgängliga online.
          </p>

          <Link href="/products" className="lp-btn-primary mt-4">
            Handla nu
          </Link>
        </div>
      </section>

      {/* Tre kategoripuffar. Statiska tills vi hämtar riktiga kategorier härifrån */}
      <section className="lp-container grid gap-px bg-line py-px sm:grid-cols-3">
        {[
          { title: 'Tour Merchandise', text: 'Från turnén 2024–2026' },
          { title: 'Pop-up Range', text: 'Begränsade upplagor' },
          { title: 'Musik', text: 'Vinyl och CD' },
        ].map((item) => (
          <div key={item.title} className="bg-ink p-10 text-center">
            <h2 className="lp-eyebrow mb-2">{item.title}</h2>
            <p className="text-sm text-muted">{item.text}</p>
          </div>
        ))}
      </section>
    </>
  )
};
