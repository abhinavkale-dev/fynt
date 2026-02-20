"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { signIn, signUp } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthLayout, OAuthButton, Divider, AuthInput, PrimaryButton, FooterDisclaimer, } from "@/components/auth/AuthLayout";
export default function SignUpPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    async function handleGoogleSignUp() {
        setError(null);
        setIsLoading(true);
        try {
            const res = await signIn.social({
                provider: "google",
                callbackURL: "/home",
            });
            if (res?.error) {
                setError(res.error.message || "Google sign-up failed.");
            }
        }
        catch {
            setError("Google sign-up failed. Please try again.");
        }
        finally {
            setIsLoading(false);
        }
    }
    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError(null);
        setIsLoading(true);
        const formData = new FormData(e.currentTarget);
        try {
            const res = await signUp.email({
                name: formData.get("name") as string,
                email: formData.get("email") as string,
                password: formData.get("password") as string,
            });
            if (res.error) {
                setError(res.error.message || "Something went wrong.");
            }
            else {
                router.push("/home");
            }
        }
        catch {
            setError("Something went wrong. Please try again.");
        }
        finally {
            setIsLoading(false);
        }
    }
    return (<AuthLayout title={<svg viewBox="0 0 400 48" className="w-full max-w-md h-auto" xmlns="http://www.w3.org/2000/svg">
          <text x="0" y="36" fontFamily="var(--font-serif)" fontSize="36" fill="white" fontWeight="400">
            Create your account
          </text>
        </svg>} subtitle="Start building powerful workflow automations" marketingTitle={<svg viewBox="0 0 380 48" className="w-full max-w-lg h-auto" xmlns="http://www.w3.org/2000/svg">
          <text x="0" y="36" fontFamily="var(--font-serif)" fontSize="36" fill="white" fontWeight="400">
            Welcome to Fynt
          </text>
        </svg>} marketingDescription={[
            "Join thousands of teams automating their workflows with Fynt's graph-based engine.",
            "Build production-ready automations with node-level retries, checkpointing, and crash-safe execution.",
            "Connect your favorite tools including Slack, GitHub, databases, internal APIs, and leading AI models.",
        ]}>
      
      <div className="space-y-3 mb-2">
        <OAuthButton provider="google" onClick={handleGoogleSignUp}/>
      </div>

      <Divider />

      
      <form onSubmit={handleSubmit} className="space-y-5">
        <AnimatePresence>
          {error && (<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2, ease: "easeOut" }} className="overflow-hidden">
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            </motion.div>)}
        </AnimatePresence>

        <AuthInput label="Full Name" type="text" name="name" placeholder="Enter your full name" required/>

        <AuthInput label="Email" type="email" name="email" placeholder="your@email.com" required/>

        <div className="space-y-1">
          <AuthInput label="Password" type="password" name="password" placeholder="Create a password" required minLength={8}/>
          <p className="text-xs text-[#6B7280] pl-1">
            Must be at least 8 characters
          </p>
        </div>

        <PrimaryButton type="submit" isLoading={isLoading}>
          Create Account
        </PrimaryButton>
      </form>

      
      <div className="mt-6 text-center">
        <span className="text-[#6B7280] text-sm">
          Already have an account?{" "}
        </span>
        <Link href="/signin" className="text-[#F04D26] hover:text-[#E63D00] text-sm font-medium transition-colors">
          Sign in
        </Link>
      </div>

      <FooterDisclaimer />
    </AuthLayout>);
}
