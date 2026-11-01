import { Link } from "react-router-dom";
import "./Insights.css";

const RESEARCH = [
  {
    number: "01",
    category: "GLOBAL FOOD SYSTEMS",
    title: "The scale of food waste is a systems problem.",
    summary: "UNEP estimates that 1.05 billion tonnes of food were wasted in 2022 across households, food service, and retail. Better measurement helps communities target the points where edible food can still be recovered.",
    source: "UN Environment Programme · Food Waste Index Report 2024",
    href: "https://www.unep.org/resources/publication/food-waste-index-report-2024",
    image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1000&q=85",
    alt: "Freshly prepared meal laid out on a shared table",
  },
  {
    number: "02",
    category: "LOSS VS. WASTE",
    title: "Food can be lost long before it reaches a plate.",
    summary: "FAO distinguishes food loss along production and supply chains from food waste at retail and consumption. That distinction matters: each stage needs different partners, timing, and prevention strategies.",
    source: "Food and Agriculture Organization · Food Loss and Waste",
    href: "https://www.fao.org/platform-food-loss-waste/en/",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1000&q=85",
    alt: "A colorful bowl of fresh vegetables and grains",
  },
  {
    number: "03",
    category: "MEASUREMENT",
    title: "A credible rescue story starts with a scale.",
    summary: "The Food Loss and Waste Standard provides a consistent way to define, measure, and report what food is removed from the supply chain and where it goes. Actual weights and clear boundaries beat impressive but untraceable totals.",
    source: "World Resources Institute · FLW Standard",
    href: "https://www.wri.org/initiatives/food-loss-and-waste-protocol",
    image: "https://images.unsplash.com/photo-1593113598332-cd288d649433?auto=format&fit=crop&w=1000&q=85",
    alt: "Community food distribution volunteers preparing supplies",
  },
];

export default function Insights() {
  return (
    <main className="insights-page">
      <section className="insights-hero">
        <div className="fr-container insights-hero__grid">
          <div className="insights-hero__copy">
            <span className="fr-eyebrow">Research · practice · community</span>
            <h1>Good intentions need good information.</h1>
            <p>Field notes on food recovery, safe redistribution, and the evidence shaping a more useful food system.</p>
            <a className="insights-hero__source" href="https://www.unep.org/resources/publication/food-waste-index-report-2024" target="_blank" rel="noreferrer">
              Featured source: UNEP Food Waste Index 2024 <span aria-hidden="true">↗</span>
            </a>
          </div>
          <figure className="insights-hero__image">
            <img src="https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&w=1200&q=88" alt="Volunteers sharing food with their community" fetchpriority="high" />
            <figcaption>Recovery works when local people can act in time.</figcaption>
          </figure>
        </div>
      </section>

      <section className="insights-library">
        <div className="fr-container">
          <div className="insights-library__heading">
            <div><span className="fr-eyebrow">The reading room</span><h2>Research worth carrying forward.</h2></div>
            <p>Original summaries, linked to the organizations and reports they come from.</p>
          </div>

          <div className="insights-grid">
            {RESEARCH.map((item) => (
              <article className="insight-card" key={item.number}>
                <div className="insight-card__image"><img src={item.image} alt={item.alt} loading="lazy" /><span>{item.number}</span></div>
                <div className="insight-card__body">
                  <span className="insight-card__category">{item.category}</span>
                  <h3>{item.title}</h3>
                  <p>{item.summary}</p>
                  <div className="insight-card__source">{item.source}</div>
                  <a href={item.href} target="_blank" rel="noreferrer">Read the source <span aria-hidden="true">↗</span></a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="insights-note">
        <div className="fr-container insights-note__inner">
          <span className="insights-note__number">A NOTE ON IMPACT</span>
          <div><h2>Count what arrived. Be honest about what is estimated.</h2><p>FoodBridge records completed deliveries in kilograms. Meal and emissions equivalents are estimates based on platform conversion factors, not independently verified measurements.</p></div>
          <Link to="/impact" className="fr-btn fr-btn--light">See impact metrics</Link>
        </div>
      </section>
    </main>
  );
}