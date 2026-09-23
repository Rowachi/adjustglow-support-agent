import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, EnvelopeSimple, FilePdf, Info } from "@phosphor-icons/react/dist/ssr";
import { Logo } from "@/components/Logo";

export const metadata: Metadata = {
  title: "Personuppgiftsbiträdesavtal (DPA): Adjustglow",
  description:
    "Adjustglows standardavtal för personuppgiftsbehandling (DPA) enligt GDPR artikel 28, tillgängligt att läsa direkt eller ladda ner som PDF.",
  alternates: {
    canonical: "/personuppgiftsbitradesavtal",
  },
};

const VERSION = "1.0";
const LAST_UPDATED = "22 september 2026";

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

function Field({ children }: { children: React.ReactNode }) {
  return <span className="rounded-md bg-surface-2 px-1.5 py-0.5 font-mono text-[0.85em] text-accent-bright">{children}</span>;
}

const SECTIONS: Section[] = [
  {
    id: "parter",
    number: "01",
    title: "Parter",
    body: (
      <>
        <p>Detta personuppgiftsbiträdesavtal (&quot;Avtalet&quot;) ingås mellan:</p>
        <ul className="mt-3 flex flex-col gap-2">
          <li className="rounded-xl border border-line-bright bg-surface p-4 text-[0.95rem] text-ink-soft">
            <span className="font-semibold text-ink">Adjustglow</span> (&quot;Adjustglow&quot; eller
            &quot;Biträdet&quot;), <Field>[BOLAGETS FULLSTÄNDIGA NAMN]</Field>, org.nr{" "}
            <Field>[ORGANISATIONSNUMMER]</Field>, <Field>[ADRESS]</Field>; och
          </li>
          <li className="rounded-xl border border-line-bright bg-surface p-4 text-[0.95rem] text-ink-soft">
            <span className="font-semibold text-ink">Kunden</span> (&quot;Kunden&quot; eller &quot;den
            Personuppgiftsansvarige&quot;), <Field>[KUNDENS NAMN]</Field>, org.nr <Field>[NUMMER]</Field>,
          </li>
        </ul>
        <p className="mt-3">
          tillsammans &quot;Parterna&quot;. Avtalet utgör en bilaga till och en integrerad del av det avtal om
          tjänster som Parterna ingått (&quot;Huvudavtalet&quot;), eller gäller separat om inget särskilt
          huvudavtal föreligger. Version {VERSION}, gäller från och med <Field>[DATUM]</Field>.
        </p>
      </>
    ),
  },
  {
    id: "definitioner",
    number: "02",
    title: "Definitioner",
    body: (
      <>
        <p>
          Begrepp som &quot;personuppgifter&quot;, &quot;behandling&quot;, &quot;personuppgiftsansvarig&quot;,
          &quot;personuppgiftsbiträde&quot;, &quot;registrerad&quot; och &quot;personuppgiftsincident&quot; har
          samma betydelse som i Europaparlamentets och rådets förordning (EU) 2016/679 (&quot;GDPR&quot;).
        </p>
        <p className="mt-3">
          &quot;Underbiträde&quot; avser ett annat personuppgiftsbiträde som Adjustglow anlitar för att utföra
          specifik behandling för Kundens räkning.
        </p>
      </>
    ),
  },
  {
    id: "foremal-och-roller",
    number: "03",
    title: "Föremål och roller",
    body: (
      <>
        <p>
          Adjustglow behandlar personuppgifter för Kundens räkning i samband med den kundservice,
          recensionsinsamling och/eller relaterade tjänster som beskrivs i Huvudavtalet. Kunden är
          personuppgiftsansvarig och Adjustglow är personuppgiftsbiträde för denna behandling.
        </p>
        <p className="mt-3">
          Adjustglow behandlar uppgifterna enbart enligt Kundens dokumenterade instruktioner, inklusive vad
          gäller överföring av personuppgifter till tredjeland, om inte Adjustglow är skyldigt att behandla
          uppgifterna på annat sätt enligt unionsrätten eller svensk rätt. I sådant fall ska Adjustglow
          informera Kunden om det rättsliga kravet innan behandlingen sker, om inte lagen förbjuder detta av
          hänsyn till ett viktigt allmänintresse.
        </p>
        <p className="mt-3">
          Anser Adjustglow att en instruktion från Kunden strider mot GDPR eller annan tillämplig
          dataskyddslagstiftning ska Adjustglow omedelbart informera Kunden om detta.
        </p>
      </>
    ),
  },
  {
    id: "behandlingens-omfattning",
    number: "04",
    title: "Behandlingens omfattning",
    body: (
      <div className="flex flex-col gap-4">
        <div className="rounded-xl border border-line-bright bg-surface p-4">
          <h4 className="font-display text-[1.05rem] font-semibold text-ink">Ändamål</h4>
          <p className="mt-1.5 text-[0.95rem] leading-relaxed text-ink-soft">
            Att tillhandahålla utkontrakterad kundservice (livechatt, e-post och/eller telefon) och/eller
            insamling och publicering av kundrecensioner, å Kundens vägnar.
          </p>
        </div>
        <div className="rounded-xl border border-line-bright bg-surface p-4">
          <h4 className="font-display text-[1.05rem] font-semibold text-ink">Behandlingens art</h4>
          <p className="mt-1.5 text-[0.95rem] leading-relaxed text-ink-soft">
            Mottagande, besvarande, dokumentation och eskalering av kundärenden, samt insamling, lagring och
            publicering av recensioner och vidarebefordran av dessa till tredjepartstjänster (t.ex. Google och
            Trustpilot) i enlighet med den registrerades samtycke.
          </p>
        </div>
        <div className="rounded-xl border border-line-bright bg-surface p-4">
          <h4 className="font-display text-[1.05rem] font-semibold text-ink">Kategorier av registrerade</h4>
          <p className="mt-1.5 text-[0.95rem] leading-relaxed text-ink-soft">
            Kundens kunder och andra slutanvändare som kontaktar Adjustglow eller lämnar en recension via de
            tjänster Adjustglow tillhandahåller åt Kunden.
          </p>
        </div>
        <div className="rounded-xl border border-line-bright bg-surface p-4">
          <h4 className="font-display text-[1.05rem] font-semibold text-ink">Kategorier av personuppgifter</h4>
          <p className="mt-1.5 text-[0.95rem] leading-relaxed text-ink-soft">
            Namn, kontaktuppgifter (e-post, telefon), innehållet i kundens ärende eller meddelande, eventuell
            order- eller köpinformation som Kunden delar med Adjustglow för att kunna besvara ärendet, samt
            recensionstext och betyg. Adjustglow förutsätter att Kunden inte delar särskilda kategorier av
            personuppgifter (känsliga uppgifter) utan att detta särskilt avtalats.
          </p>
        </div>
        <div className="rounded-xl border border-line-bright bg-surface p-4">
          <h4 className="font-display text-[1.05rem] font-semibold text-ink">Behandlingens varaktighet</h4>
          <p className="mt-1.5 text-[0.95rem] leading-relaxed text-ink-soft">
            Så länge Huvudavtalet gäller, och därefter till dess uppgifterna raderas eller återlämnas enligt
            avsnitt 12.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "sakerhetsatgarder",
    number: "05",
    title: "Säkerhetsåtgärder",
    body: (
      <>
        <p>
          Adjustglow ska vidta lämpliga tekniska och organisatoriska åtgärder enligt artikel 32 GDPR, med
          beaktande av den senaste utvecklingen, kostnaderna för genomförande samt behandlingens art, omfattning
          och ändamål, för att säkerställa en säkerhetsnivå som är lämplig i förhållande till risken. Detta
          omfattar bland annat:
        </p>
        <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
          {[
            "Kryptering av data under överföring (HTTPS/TLS)",
            "Åtkomst begränsad till personal som behöver den för sina arbetsuppgifter",
            "Loggning och regelbunden granskning av åtkomst",
            "Rutiner för att återställa tillgänglighet till personuppgifter vid en incident",
          ].map((item) => (
            <li
              key={item}
              className="rounded-xl border border-line-bright bg-surface px-4 py-3 text-[0.92rem] leading-relaxed text-ink-soft"
            >
              {item}
            </li>
          ))}
        </ul>
      </>
    ),
  },
  {
    id: "sekretess",
    number: "06",
    title: "Sekretess",
    body: (
      <p>
        Adjustglow ska säkerställa att alla personer som har tillgång till personuppgifterna, inklusive anställda
        och konsulter, är bundna av en lämplig sekretesskyldighet, antingen genom avtal eller enligt lag, och att
        åtkomst begränsas till dem som behöver uppgifterna för att fullgöra Huvudavtalet.
      </p>
    ),
  },
  {
    id: "underbitraden",
    number: "07",
    title: "Underbiträden",
    body: (
      <>
        <p>
          Kunden ger Adjustglow ett generellt förhandsgodkännande att anlita underbiträden för att fullgöra
          Huvudavtalet. Vid Avtalets ingående används följande underbiträden:
        </p>
        <ul className="mt-3 flex flex-col gap-2">
          <li className="rounded-xl border border-line-bright bg-surface p-4 text-[0.95rem] text-ink-soft">
            <span className="font-semibold text-ink">Render</span> &ndash; hosting av webbplats och
            backend-tjänster.
          </li>
          <li className="rounded-xl border border-line-bright bg-surface p-4 text-[0.95rem] text-ink-soft">
            <span className="font-semibold text-ink">Anthropic</span> &ndash; språkmodell som genererar svar i
            supportkonversationer.
          </li>
        </ul>
        <p className="mt-3">
          Adjustglow ska ingå ett skriftligt avtal med varje underbiträde som ålägger underbiträdet samma
          dataskyddsskyldigheter som följer av detta Avtal. Adjustglow ska informera Kunden om varje avsedd
          ändring avseende tillägg eller byte av underbiträden minst <Field>[30]</Field> dagar i förväg. Invänder
          Kunden inom <Field>[15]</Field> dagar från underrättelsen ska Parterna i god tro diskutera en lösning;
          kvarstår invändningen har Kunden rätt att säga upp den del av tjänsten som berörs. Adjustglow ansvarar
          gentemot Kunden fullt ut för ett underbiträdes uppfyllande av sina dataskyddsskyldigheter.
        </p>
      </>
    ),
  },
  {
    id: "tredjeland",
    number: "08",
    title: "Överföring till tredjeland",
    body: (
      <p>
        I den mån behandling enligt detta Avtal innebär överföring av personuppgifter till ett land utanför
        EU/EES ska Adjustglow säkerställa att en giltig överföringsmekanism enligt kapitel V GDPR tillämpas,
        till exempel EU-kommissionens standardavtalsklausuler (SCC), innan överföringen sker. Vid Avtalets
        ingående sker sådan överföring till underbiträdena Render och Anthropic (båda USA), med stöd av SCC
        eller en motsvarande godkänd skyddsåtgärd i respektive underbiträdes egna avtal.
      </p>
    ),
  },
  {
    id: "bistand-till-kunden",
    number: "09",
    title: "Bistånd till Kunden",
    body: (
      <>
        <p>
          Adjustglow ska, med beaktande av behandlingens art, genom lämpliga tekniska och organisatoriska
          åtgärder bistå Kunden med att uppfylla Kundens skyldighet att besvara registrerades begäran om att
          utöva sina rättigheter enligt kapitel III GDPR (till exempel tillgång, rättelse och radering).
        </p>
        <p className="mt-3">
          Adjustglow ska även bistå Kunden med att uppfylla skyldigheterna enligt artiklarna 32&ndash;36 GDPR
          (säkerhet, incidentrapportering, konsekvensbedömningar och förhandssamråd), med beaktande av
          behandlingens art och den information som är tillgänglig för Adjustglow.
        </p>
      </>
    ),
  },
  {
    id: "personuppgiftsincidenter",
    number: "10",
    title: "Personuppgiftsincidenter",
    body: (
      <p>
        Upptäcker Adjustglow en personuppgiftsincident som rör de uppgifter som behandlas enligt detta Avtal ska
        Adjustglow underrätta Kunden utan onödigt dröjsmål, dock senast inom <Field>[24]</Field> timmar efter att
        incidenten upptäckts. Underrättelsen ska, i den mån informationen finns tillgänglig, innehålla en
        beskrivning av incidentens art, de kategorier och det ungefärliga antal registrerade och
        personuppgiftsposter som berörs, sannolika konsekvenser samt de åtgärder som vidtagits eller planeras
        för att hantera incidenten.
      </p>
    ),
  },
  {
    id: "granskning-och-revision",
    number: "11",
    title: "Granskning och revision",
    body: (
      <p>
        Adjustglow ska ge Kunden tillgång till den information som är nödvändig för att visa att skyldigheterna
        i artikel 28 GDPR och i detta Avtal efterlevs, samt möjliggöra och bidra till granskningar, inklusive
        inspektioner, som genomförs av Kunden eller en revisor som Kunden anlitat. En sådan granskning ska
        aviseras skriftligen minst <Field>[30]</Field> dagar i förväg, genomföras under ordinarie kontorstid och
        på ett sätt som inte i onödan stör Adjustglows verksamhet eller andra kunders uppgifter. Kunden svarar
        för sina egna kostnader för granskningen, om den inte visar på en väsentlig avvikelse.
      </p>
    ),
  },
  {
    id: "radering-och-aterlamnande",
    number: "12",
    title: "Radering och återlämnande",
    body: (
      <p>
        Vid Huvudavtalets upphörande ska Adjustglow, enligt Kundens val, radera eller återlämna samtliga
        personuppgifter som behandlats enligt detta Avtal och radera befintliga kopior, om inte fortsatt
        lagring krävs enligt unionsrätten eller svensk rätt. Radering eller återlämnande ska ske inom{" "}
        <Field>[30]</Field> dagar från Huvudavtalets upphörande.
      </p>
    ),
  },
  {
    id: "ansvar",
    number: "13",
    title: "Ansvar",
    body: (
      <p>
        Parternas ansvar gentemot varandra och gentemot registrerade regleras av GDPR:s ansvarsbestämmelser
        (artikel 82) samt av Huvudavtalets ansvarsbegränsningar, i den mån dessa är förenliga med tvingande
        dataskyddsrätt. Ingenting i detta Avtal begränsar en registrerads lagstadgade rättigheter.
      </p>
    ),
  },
  {
    id: "giltighet",
    number: "14",
    title: "Giltighet, ändringar och tillämplig lag",
    body: (
      <>
        <p>
          Avtalet gäller så länge Adjustglow behandlar personuppgifter för Kundens räkning enligt Huvudavtalet.
          Adjustglow får uppdatera detta Avtal för att spegla ändringar i lagstiftning eller myndighetspraxis
          och underrättar Kunden om väsentliga ändringar.
        </p>
        <p className="mt-3">
          Svensk rätt ska tillämpas på detta Avtal. Tvist med anledning av Avtalet ska slutligt avgöras av{" "}
          <Field>Stockholms tingsrätt</Field> som första instans, om Parterna inte skriftligen kommit överens om
          annat (till exempel skiljeförfarande).
        </p>
      </>
    ),
  },
];

export default function PersonuppgiftsbitradesavtalPage() {
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
          Juridik
        </span>

        <h1 className="mt-5 text-[2rem] leading-tight font-semibold text-ink md:text-[2.6rem]">
          Personuppgiftsbiträdesavtal
        </h1>
        <p className="mt-4 max-w-[62ch] text-[1.02rem] leading-relaxed text-ink-soft">
          Adjustglows standardavtal (DPA) för hur vi behandlar era kunders personuppgifter när ni anlitar oss,
          enligt GDPR artikel 28. Läs det direkt här eller ladda ner det som PDF, ingen formulär krävs.
        </p>
        <p className="mt-3 text-sm text-ink-faint">
          Version {VERSION} &middot; Senast uppdaterad: {LAST_UPDATED}
        </p>

        <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-line-bright bg-surface p-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-[46ch] text-sm leading-relaxed text-ink-soft">
            Ladda ner hela avtalet som PDF, för er juridik- eller upphandlingsavdelning.
          </p>
          <a
            href="/personuppgiftsbitradesavtal.pdf"
            download
            className="inline-flex flex-none items-center justify-center gap-2 whitespace-nowrap rounded-full bg-accent px-6 py-3 text-sm font-semibold text-accent-ink transition-transform hover:-translate-y-px active:translate-y-0 active:scale-[0.98]"
          >
            <FilePdf size={17} weight="bold" />
            Ladda ner PDF
          </a>
        </div>

        <Note>
          Det här är Adjustglows generella avtalsmall. Fält som <Field>[KUNDENS NAMN]</Field> och{" "}
          <Field>[NUMMER]</Field> fylls i per kund när avtalet undertecknas. Adjustglows egna bolagsuppgifter
          (organisationsnummer och adress) publiceras här inom kort, se markerade fält nedan.
        </Note>

        <nav aria-label="Innehåll" className="mt-10 rounded-2xl border border-line-bright bg-surface p-5 md:p-6">
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
            Frågor om avtalet, eller redo att gå vidare med er upphandling?
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
