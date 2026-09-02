import Link from 'next/link';

export default function AboutPage() {
  return (
    <div className="lp-container max-w-2xl pt-6 pb-16">
      <header className="mb-10 border-b border-line pb-8">
        <p className="lp-eyebrow mb-3 text-accent">Om projektet</p>
        <h1 className="lp-heading">Hej, Steven här</h1>
      </header>

      <div className="space-y-6 text-sm leading-relaxed text-bone/80">
        <p>For real, inte Claude Code haha. Jag har ingen anknytning till Linkin Park *över huvud taget*. Detta är endast ett skolprojekt från ett fan.</p>

        <p>
          För att lägga till i varukorg måste du logga in! Databasen är seeded med följande
          användare:
        </p>

        <div className="border border-line bg-elevated p-6">
          <dl className="space-y-3 font-mono text-xs">
            <div>
              <dt className="lp-eyebrow mb-1 text-muted">Customer</dt>
              <dd>anv: customerBob | lösen: customer123</dd>
            </div>

            <div>
              <dt className="lp-eyebrow mb-1 text-muted">Admin</dt>
              <dd>anv: admin | lösen: admin123</dd>
            </div>
          </dl>
        </div>

        <p>
          Om du loggar in som admin och inte är lärare som ska betygsätta detta, please be kind
          och fyll inte min databas med SQL injection virus haha
        </p>

        <p>
          Önskar jag hade mer tid och energi att lägga på detta men jag byggde annat under
          sommaren och nu blev det 5 dagar endast att lägga på detta. Och det är inte nog.
          Ordentlig software som är maintainable byggs inte på en timme och one eller two shot
          prompts i Claude Code. Det byggs med förståelse för systemet och slow and steady
          iteration.
        </p>

        <p>
          GitHub repo:{' '}
          <a
            href="https://github.com/Medieinstitutet/fsu25d-systemutveckling-uppgift-1-min-egna-e-handel-stevenlomon"
            target="_blank"
            rel="noopener noreferrer"
            className="break-all text-accent underline underline-offset-4"
          >
            fsu25d-systemutveckling-uppgift-1-min-egna-e-handel-stevenlomon
          </a>
        </p>

        <p className="pt-4">Much love /Steven</p>
      </div>

      <div className="mt-12 border-t border-line pt-8">
        <Link href="/products" className="lp-btn-ghost">Till produkterna</Link>
      </div>
    </div>
  )
};
