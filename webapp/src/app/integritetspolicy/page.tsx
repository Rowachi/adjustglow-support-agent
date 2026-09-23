import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, EnvelopeSimple, Info } from "@phosphor-icons/react/dist/ssr";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Integritetspolicy: Adjustglow",
  description:
    "Hur Adjustglow samlar in, använder och skyddar personuppgifter på adjustglow.com och i våra tjänster.",
  alternates: {
    canonical: "/integritetspolicy",
  },
};

const LAST_UPDATED = "23 september 2026";

type Section = {
  id: string;
  number: string;
  title: string;
  body: React.ReactNode;
};

function Note({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-5 flex gap-3 rounded-xl border border-accent-dim/60 bg-accent-dim/10 p-4">
      <Info size={18} weight="fill" className="mt-0.5 flex-none text-accent-bright" />
      <p className="text-[0.92rem] leading-relaxed text-ink-soft">{children}</p>
    </div>
  );
}

const SECTIONS: Section[] = [
  {
    id: "personuppgiftsansvarig",
    number: "01",
    title: "Personuppgiftsansvarig",
    body: (
      <>
        <p>
          Adjustglow (&quot;Adjustglow&quot;, &quot;vi&quot;, &quot;oss&quot;) är personuppgiftsansvarig för de
          personuppgifter som behandlas i samband med webbplatsen adjustglow.com och de kontakter ni har med oss
          via den. Ni når oss enklast på{" "}
          <a href="mailto:hello@adjustglow.com" className="text-accent-bright underline underline-offset-2">
            hello@adjustglow.com
          </a>
          .
        </p>
        <Note>
          Adjustglows fullständiga bolagsuppgifter (organisationsnummer och registrerad adress) publiceras här
          inom kort. Fram tills dess är e-post det snabbaste sättet att nå oss i alla frågor om denna policy.
        </Note>
      </>
    ),
  },
  {
    id: "tva-roller",
    number: "02",
    title: "Två olika roller",
    body: (
      <>
        <p>
          Adjustglow agerar i två skilda roller, och vilken som gäller styr vilka regler som tillämpas på en viss
          behandling:
        </p>
        <ul className="mt-3 flex flex-col gap-3">
          <li className="rounded-xl border border-line-bright bg-surface p-4">
            <span className="font-semibold text-ink">Personuppgiftsansvarig.</span> När vi behandlar uppgifter om
            besökare på adjustglow.com, personer som kontaktar oss eller bokar en demo, och jobbsökande, bestämmer
            vi själva ändamål och medel. Den här policyn beskriver den behandlingen.
          </li>
          <li className="rounded-xl border border-line-bright bg-surface p-4">
            <span className="font-semibold text-ink">Personuppgiftsbiträde.</span> När ett företag anlitar
            Adjustglow för att sköta kundservice eller recensionsinsamling åt dem, behandlar vi deras kunders
            uppgifter enbart enligt deras instruktioner. Den behandlingen regleras i stället av ett separat
            personuppgiftsbiträdesavtal (DPA) som vi tecknar med varje kund, inte av den här policyn. Hör av er
            till{" "}
            <a href="mailto:hello@adjustglow.com" className="text-accent-bright underline underline-offset-2">
              hello@adjustglow.com
            </a>{" "}
            om ni vill ha en kopia.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "vilka-uppgifter",
    number: "03",
    title: "Vilka uppgifter vi behandlar och varför",
    body: (
      <>
        <p>Vi samlar bara in det vi faktiskt behöver för att driva webbplatsen och svara på era förfrågningar.</p>

        <div className="mt-4 flex flex-col gap-4">
          <div className="rounded-xl border border-line-bright bg-surface p-4">
            <h4 className="font-display text-[1.05rem] font-semibold text-ink">E-post och demoförfrågningar</h4>
            <p className="mt-1.5 text-[0.95rem] leading-relaxed text-ink-soft">
              Om ni mejlar oss eller ber om en demo behandlar vi de uppgifter ni själva lämnar, som namn,
              e-postadress och innehållet i meddelandet, för att kunna svara och följa upp. Rättslig grund:
              berättigat intresse av att besvara er förfrågan, eller åtgärder inför ett avtal om ni är på väg att
              bli kund. Vi sparar konversationen i upp till 24 månader efter senaste kontakt, om vi inte behöver
              spara den längre på grund av ett pågående kundförhållande eller en rättslig skyldighet.
            </p>
          </div>

          <div className="rounded-xl border border-line-bright bg-surface p-4">
            <h4 className="font-display text-[1.05rem] font-semibold text-ink">Chattwidgeten på adjustglow.com</h4>
            <p className="mt-1.5 text-[0.95rem] leading-relaxed text-ink-soft">
              Meddelanden ni skickar i chattbubblan på webbplatsen skickas till vår support-backend för att
              generera ett svar. Rättslig grund: berättigat intresse av att kunna svara på frågor i realtid.
              Konversationer sparas i vår databas (Neon, servrar inom EU) så att vi kan följa upp ärenden och
              förbättra svaren. Vill ni att en konversation raderas, kontakta oss så tar vi bort den.
            </p>
          </div>

          <div className="rounded-xl border border-line-bright bg-surface p-4">
            <h4 className="font-display text-[1.05rem] font-semibold text-ink">Besök på webbplatsen</h4>
            <p className="mt-1.5 text-[0.95rem] leading-relaxed text-ink-soft">
              Vår hostingleverantör loggar tekniska uppgifter som IP-adress, webbläsartyp och tidpunkt för
              besöket, för drift, felsökning och säkerhet. Rättslig grund: berättigat intresse av en fungerande
              och säker webbplats. Dessa loggar sparas under en begränsad tid hos leverantören och används inte
              för profilering eller marknadsföring.
            </p>
          </div>

          <div className="rounded-xl border border-line-bright bg-surface p-4">
            <h4 className="font-display text-[1.05rem] font-semibold text-ink">Jobbansökningar</h4>
            <p className="mt-1.5 text-[0.95rem] leading-relaxed text-ink-soft">
              Skickar ni en spontanansökan eller söker en annonserad tjänst behandlar vi uppgifterna i er
              ansökan för att bedöma den. Rättslig grund: åtgärder inför ett eventuellt anställningsavtal. Går
              ansökan inte vidare raderar vi den normalt inom 6 månader, om ni inte samtycker till att vi sparar
              den längre för framtida tjänster.
            </p>
          </div>
        </div>
      </>
    ),
  },
  {
    id: "recensioner",
    number: "04",
    title: "Recensioner",
    body: (
      <p>
        En del av Adjustglows tjänst går ut på att fråga en kund, efter ett supportärende eller en tapp mot ett
        fysiskt NFC/QR-kort, om hen vill lämna ett omdöme. Väljer kunden att göra det behandlar vi betyg,
        omdömestext och förnamn (om det anges) för att spara omdömet åt det företag det gäller. Rättslig grund:
        samtycke, som ges av den som lämnar omdömet i det ögonblicket. Vi publicerar aldrig något i kundens namn
        på Google, Trustpilot eller någon annan tjänst. Kunden kan själv välja att dela sitt omdöme där: då
        kopierar vi texten och öppnar tjänstens sida, och kunden publicerar från sitt eget konto enligt den
        tjänstens egna villkor. Vi registrerar bara att knappen användes, inte vad som publicerades.
      </p>
    ),
  },
  {
    id: "cookies",
    number: "05",
    title: "Cookies",
    body: (
      <>
        <p>
          adjustglow.com använder i dagsläget inga analys- eller marknadsföringscookies. Webbplatsen kan sätta
          enstaka strikt nödvändiga cookies som krävs för grundläggande funktion (till exempel för att komma ihåg
          ett formulärval under ett besök); dessa kräver inte samtycke enligt lagen om elektronisk kommunikation.
        </p>
        <p className="mt-3">
          Om vi i framtiden lägger till besöksstatistik eller andra icke-nödvändiga cookies uppdaterar vi den här
          sidan med en fullständig kakförteckning och lägger till ett samtyckesbanner innan de börjar användas, i
          linje med Post- och telestyrelsens (PTS) krav.
        </p>
      </>
    ),
  },
  {
    id: "mottagare",
    number: "06",
    title: "Mottagare av uppgifter",
    body: (
      <>
        <p>Vi säljer aldrig personuppgifter. Vi delar uppgifter enbart med de leverantörer som hjälper oss driva tjänsten, som personuppgiftsbiträden under skriftliga avtal:</p>
        <ul className="mt-3 flex flex-col gap-2">
          <li className="rounded-xl border border-line-bright bg-surface p-4 text-[0.95rem] text-ink-soft">
            <span className="font-semibold text-ink">Render</span> &ndash; hosting av webbplatsen och
            support-backend.
          </li>
          <li className="rounded-xl border border-line-bright bg-surface p-4 text-[0.95rem] text-ink-soft">
            <span className="font-semibold text-ink">Anthropic</span> &ndash; språkmodellen som driver
            chattwidgeten och supportagenten, används för att generera svar på inkommande meddelanden.
          </li>
          <li className="rounded-xl border border-line-bright bg-surface p-4 text-[0.95rem] text-ink-soft">
            <span className="font-semibold text-ink">Neon</span> &ndash; databas där konversationer, bokningar och
            omdömen lagras, på servrar i Frankfurt (EU).
          </li>
          <li className="rounded-xl border border-line-bright bg-surface p-4 text-[0.95rem] text-ink-soft">
            <span className="font-semibold text-ink">Google och Trustpilot</span> &ndash; vi skickar inga uppgifter
            dit. Om ni själva väljer att dela ett omdöme där publicerar ni det från ert eget konto, se avsnitt 4.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "tredjeland",
    number: "07",
    title: "Överföring till tredjeland",
    body: (
      <p>
        Render, Anthropic och Neon, som nämns ovan, är amerikanska leverantörer. Neon lagrar våra uppgifter
        inom EU, medan Render och Anthropic kan behandla uppgifter på servrar utanför EU/EES. Sådan överföring sker med stöd av EU-kommissionens standardavtalsklausuler (SCC) eller en
        annan godkänd överföringsmekanism enligt kapitel V i GDPR, som är den skyddsmekanism dessa leverantörer
        tillhandahåller i sina egna avtal. Kontakta oss om ni vill veta mer om vilka skyddsåtgärder som gäller för
        en specifik leverantör.
      </p>
    ),
  },
  {
    id: "sakerhet",
    number: "08",
    title: "Säkerhet",
    body: (
      <p>
        Trafik till och från adjustglow.com och våra tjänster krypteras med HTTPS/TLS. Åtkomst till system som
        innehåller personuppgifter begränsas till de i teamet som behöver den för att utföra sitt arbete, och vi
        förlitar oss på våra leverantörers egna säkerhetsåtgärder för hosting och databehandling. Ingen metod för
        överföring eller lagring är helt riskfri, men vi arbetar löpande för att hålla en rimlig
        säkerhetsnivå i förhållande till risken.
      </p>
    ),
  },
  {
    id: "rattigheter",
    number: "09",
    title: "Dina rättigheter",
    body: (
      <>
        <p>Enligt GDPR har ni rätt att:</p>
        <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {[
            "Få information om och tillgång till era uppgifter (registerutdrag)",
            "Få felaktiga uppgifter rättade",
            "Begära radering av era uppgifter",
            "Begära att behandlingen begränsas",
            "Invända mot en behandling som grundar sig på berättigat intresse",
            "Få ut era uppgifter i ett strukturerat format (dataportabilitet)",
            "När som helst återkalla ett lämnat samtycke",
          ].map((right) => (
            <li
              key={right}
              className="rounded-xl border border-line-bright bg-surface px-4 py-3 text-[0.92rem] leading-relaxed text-ink-soft"
            >
              {right}
            </li>
          ))}
        </ul>
        <p className="mt-4">
          Vill ni utöva någon av dessa rättigheter, mejla{" "}
          <a href="mailto:hello@adjustglow.com" className="text-accent-bright underline underline-offset-2">
            hello@adjustglow.com
          </a>
          . Vi svarar normalt inom en månad, i enlighet med GDPR artikel 12.
        </p>
        <p className="mt-3">
          Är ni inte nöjda med hur vi hanterar era personuppgifter har ni rätt att klaga hos{" "}
          <a
            href="https://www.imy.se"
            target="_blank"
            rel="noreferrer"
            className="text-accent-bright underline underline-offset-2"
          >
            Integritetsskyddsmyndigheten (IMY)
          </a>
          , tillsynsmyndighet för dataskydd i Sverige. Klagomål som rör just cookies hanteras av{" "}
          <a
            href="https://pts.se"
            target="_blank"
            rel="noreferrer"
            className="text-accent-bright underline underline-offset-2"
          >
            Post- och telestyrelsen (PTS)
          </a>
          .
        </p>
      </>
    ),
  },
  {
    id: "andringar",
    number: "10",
    title: "Ändringar",
    body: (
      <p>
        Vi kan uppdatera den här policyn, till exempel när vi lägger till en ny funktion eller byter leverantör.
        Väsentliga ändringar meddelas på den här sidan tillsammans med ett nytt datum för &quot;Senast
        uppdaterad&quot; ovan. Vi rekommenderar att ni läser igenom policyn då och då.
      </p>
    ),
  },
];

export default function IntegritetspolicyPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <div className="flex items-center justify-between border-b border-line px-5 py-4 md:px-8">
        <Logo />
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-ink-soft transition-colors hover:text-ink"
        >
          <ArrowLeft size={16} weight="bold" />
          Tillbaka till sajten
        </Link>
      </div>

      <main className="mx-auto w-full max-w-[840px] flex-1 px-5 py-14 md:px-8 md:py-20">
        <span className="inline-flex items-center gap-2 rounded-full border border-line-bright bg-surface px-3.5 py-1.5 text-[0.8rem] font-medium text-ink-soft">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          Integritet
        </span>

        <h1 className="mt-5 text-[2rem] leading-tight font-semibold text-ink md:text-[2.6rem]">
          Integritetspolicy
        </h1>
        <p className="mt-4 max-w-[62ch] text-[1.02rem] leading-relaxed text-ink-soft">
          Så här samlar vi in, använder och skyddar personuppgifter på adjustglow.com och i vår kontakt med er.
        </p>
        <p className="mt-3 text-sm text-ink-faint">Senast uppdaterad: {LAST_UPDATED}</p>

        <nav
          aria-label="Innehåll"
          className="mt-10 rounded-2xl border border-line-bright bg-surface p-5 md:p-6"
        >
          <h2 className="text-xs font-semibold uppercase tracking-[0.06em] text-ink-faint">Innehåll</h2>
          <ol className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className="flex items-baseline gap-2.5 py-1 text-[0.92rem] text-ink-soft transition-colors hover:text-ink"
                >
                  <span className="font-display text-[0.85rem] text-ink-faint">{section.number}</span>
                  {section.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="mt-14 flex flex-col gap-14">
          {SECTIONS.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24 border-t border-line pt-10">
              <div className="flex items-baseline gap-4">
                <span className="font-display text-[1.6rem] text-ink-faint">{section.number}</span>
                <h2 className="font-display text-[1.4rem] font-semibold text-ink md:text-[1.6rem]">
                  {section.title}
                </h2>
              </div>
              <div className="mt-4 max-w-[68ch] text-[0.98rem] leading-relaxed text-ink-soft [&_p+p]:mt-3">
                {section.body}
              </div>
            </section>
          ))}
        </div>

        <div className="mt-16 flex flex-col gap-4 rounded-2xl border border-line-bright bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-[46ch] text-sm leading-relaxed text-ink-soft">
            Har ni frågor om den här policyn eller hur vi hanterar era uppgifter?
          </p>
          <a
            href="mailto:hello@adjustglow.com"
            className="inline-flex flex-none items-center justify-center gap-2 whitespace-nowrap rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-ink transition-transform hover:-translate-y-px active:translate-y-0 active:scale-[0.98]"
          >
            <EnvelopeSimple size={16} weight="bold" />
            hello@adjustglow.com
          </a>
        </div>
      </main>
    </div>
  );
}
