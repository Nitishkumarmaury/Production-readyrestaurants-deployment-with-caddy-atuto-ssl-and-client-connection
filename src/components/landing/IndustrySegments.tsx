import { motion } from "framer-motion";
import { IMAGES } from "@/lib/images";

const segments = [
  {
    title: "Food",
    image: IMAGES.Food,
  },
  {
    title: "Groceries",
    image: IMAGES.Groceries,
  },
  {
    title: "Electronics",
    image: IMAGES.Electronics,
  },
  {
    title: "Clothing",
    image: IMAGES.Clothing,
  },
  {
    title: "Pharmacy",
    image: IMAGES.Pharmacy,
  },
];

export function IndustrySegments() {
  return (
    <section id="solutions" className="relative py-24 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-3xl text-center mb-16">
          <h2 className="font-display text-4xl font-bold md:text-5xl tracking-tight">
            Built for <span className="text-primary">Multiple Delivery</span> Businesses
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            A multi-industry delivery platform built to help businesses launch quickly and scale effortlessly.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-8 md:gap-16">
          {segments.map((segment, i) => (
            <motion.div
              key={segment.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center"
            >
              <div className={`relative h-32 w-32 md:h-40 md:w-40 rounded-full flex items-center justify-center overflow-hidden`}>
                {/* Image container */}
                <div className="relative h-24 w-24 md:h-32 md:w-32 rounded-full overflow-hidden shadow-2xl">
                  <img
                    src={segment.image}
                    alt={segment.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
              <span className="mt-6 font-display text-lg font-medium text-foreground/80">
                {segment.title}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
