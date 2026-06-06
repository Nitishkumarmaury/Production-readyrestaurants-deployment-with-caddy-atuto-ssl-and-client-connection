import { createFileRoute } from "@tanstack/react-router";
import { RegisterBusiness } from "@/components/auth/RegisterBusiness";

export const Route = createFileRoute("/register-business")({
  head: () => ({
    meta: [
      { title: "Register Business — Ready Deliveries" },
      { name: "description", content: "Register your business on Ready Deliveries. Enter basic details, pick a plan and continue." },
    ],
  }),
  component: RegisterBusinessPage,
});

function RegisterBusinessPage() {
  return <RegisterBusiness />;
}
