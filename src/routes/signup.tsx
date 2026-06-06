import { createFileRoute } from "@tanstack/react-router";
import { SignUp } from "@/components/auth/SignUp";
import { z } from "zod";

const signupSearchSchema = z.object({
  mode: z.enum(["signup", "signin"]).optional(),
});

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Sign Up — Ready Deliveries" },
      { name: "description", content: "Create your Ready Deliveries account and get started in 2 minutes." },
    ],
  }),
  validateSearch: (search) => signupSearchSchema.parse(search),
  component: SignUpPage,
});

function SignUpPage() {
  return <SignUp />;
}
