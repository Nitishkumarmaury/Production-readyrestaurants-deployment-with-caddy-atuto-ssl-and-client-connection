
export const registrationSteps = [
  { number: 1, title: "Business Information", subtitle: "To help you, tell us about your business" },
  { number: 2, title: "Plan Information", subtitle: "Don't worry you don't have to pay yet" },
];

export const billingCycles = ["Monthly", "Quarterly", "Half-Yearly", "Yearly"];

export const planCountries = [
  { name: "India", flag: "🇮🇳", region: "india" },
  { name: "Outside India", flag: "🌐", region: "outside" },
];

export const plansData = {
  india: [
    {
      id: "starter",
      name: "Starter Plan",
      price: "₹3,999",
      period: "/month",
      description: "Ideal for startups looking to launch quickly with essential features.",
      features: [
        "Customer Website (ReactJS)",
        "Customer PWA Web App",
        "Admin Panel (ReactJS) – 1 Admin User",
        "Coupon & Loyalty System",
        "Basic Driver Management",
        "Basic Reports & Analytics",
      ],
      highlighted: false,
    },
    {
      id: "growth",
      name: "Growth Plan",
      price: "₹7,999",
      period: "/month",
      description: "Best suited for growing businesses that need enhanced control and customer engagement.",
      features: [
        "Everything in Starter Plan",
        "Corporate Panel (ReactJS)",
        "Customer & Corporate PWA Apps",
        "Admin Panel – Up to 5 Admin Users",
        "Integrated Wallet System",
        "Loyalty & Rewards Program",
        "Advanced Driver Tracking & Management",
        "Standard Reports & Insights",
      ],
      highlighted: true,
    },
    {
      id: "scale",
      name: "Scale Plan",
      price: "₹16,999",
      period: "/month",
      description: "Designed for expanding operations with multiple user roles and higher demand.",
      features: [
        "Everything in Growth Plan",
        "Agent Panel (ReactJS)",
        "Fleet Management Panel (ReactJS)",
        "PWA Apps for Customer, Corporate, Agent & Fleet",
        "Admin Panel – Up to 25 Admin Users",
        "Advanced Analytics & Reporting",
        "AI-Powered Chatbot",
      ],
      highlighted: false,
    },
  ],
  outside: [
    {
      id: "starter",
      name: "Starter Plan",
      price: "$49",
      period: "/month",
      description: "Ideal for startups looking to launch quickly with essential features.",
      features: [
        "Customer Website (ReactJS)",
        "Customer PWA Web App",
        "Admin Panel (ReactJS) – 1 Admin User",
        "Coupon & Loyalty System",
        "Basic Driver Management",
        "Basic Reports & Analytics",
      ],
      highlighted: false,
    },
    {
      id: "growth",
      name: "Growth Plan",
      price: "$99",
      period: "/month",
      description: "Best suited for growing businesses that need enhanced control and customer engagement.",
      features: [
        "Everything in Starter Plan",
        "Corporate Panel (ReactJS)",
        "Customer & Corporate PWA Apps",
        "Admin Panel – Up to 5 Admin Users",
        "Integrated Wallet System",
        "Loyalty & Rewards Program",
        "Advanced Driver Tracking & Management",
        "Standard Reports & Insights",
      ],
      highlighted: true,
    },
    {
      id: "scale",
      name: "Scale Plan",
      price: "$249",
      period: "/month",
      description: "Designed for expanding operations with multiple user roles and higher demand.",
      features: [
        "Everything in Growth Plan",
        "Agent Panel (ReactJS)",
        "Fleet Management Panel (ReactJS)",
        "PWA Apps for Customer, Corporate, Agent & Fleet",
        "Admin Panel – Up to 25 Admin Users",
        "Advanced Analytics & Reporting",
        "AI-Powered Chatbot",
      ],
      highlighted: false,
    },
  ],
};
