const brands = ["Spice Route", "Urban Bowl", "Crust & Co", "Kettle Kitchen", "Burger Bros", "Mango Lane", "Sushi Lab", "Daily Dose"];
export function TrustedBy() {
  return (
    <section className="relative border-y border-border/50 bg-surface/30 py-12">
      <div className="mx-auto max-w-7xl px-4">
        <p className="text-center text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Driving Growth for Modern Businesses in India & Worldwide
        </p>
        <div className="mt-8 overflow-hidden">
          <div className="flex animate-marquee gap-12 whitespace-nowrap">
            {[...brands, ...brands].map((b, i) => (
              <span key={i} className="font-display text-2xl font-semibold text-muted-foreground/60">
                {b}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
