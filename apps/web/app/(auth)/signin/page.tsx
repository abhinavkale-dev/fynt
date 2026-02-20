"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { signIn } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthLayout, OAuthButton, Divider, AuthInput, PrimaryButton, FooterDisclaimer, } from "@/components/auth/AuthLayout";
export default function SignInPage() {
    const router = useRouter();
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    async function handleGoogleSignIn() {
        setError(null);
        setIsLoading(true);
        try {
            const res = await signIn.social({
                provider: "google",
                callbackURL: "/home",
            });
            if (res?.error) {
                setError(res.error.message || "Google sign-in failed.");
            }
        }
        catch {
            setError("Google sign-in failed. Please try again.");
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
            const res = await signIn.email({
                email: formData.get("email") as string,
                password: formData.get("password") as string,
            });
            if (res.error) {
                setError(res.error.message || "Invalid email or password.");
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
            Sign in to your account
          </text>
        </svg>} subtitle="Enter your credentials to access your workflows" marketingTitle={<svg viewBox="0 0 420 48" className="w-full max-w-lg h-auto" xmlns="http://www.w3.org/2000/svg">
          <text x="0" y="36" fontFamily="var(--font-serif)" fontSize="36" fill="white" fontWeight="400">
            Welcome back to Fynt
          </text>
        </svg>} marketingDescription={[
            "Pick up where you left off. Your workflows, integrations, and automations are waiting for you.",
            "Fynt is a graph-based workflow engine with node-level retries, checkpointing, and crash-safe execution built for production systems.",
            "Connect Slack, GitHub, databases, and AI models into one seamless automation platform.",
        ]}>
      
      <div className="space-y-3 mb-2">
        <OAuthButton provider="google" onClick={handleGoogleSignIn}/>
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

        <AuthInput label="Email" type="email" name="email" placeholder="your@email.com" required/>

        <div className="space-y-2">
          <AuthInput label="Password" type="password" name="password" placeholder="Enter your password" required/>
          <div className="flex justify-end">
            <button type="button" className="text-sm text-[#F04D26] hover:text-[#E63D00] transition-colors">
              Forgot password?
            </button>
          </div>
        </div>

        <PrimaryButton type="submit" isLoading={isLoading}>
          Continue
        </PrimaryButton>
      </form>

      
      <div className="mt-6 text-center">
        <span className="text-[#6B7280] text-sm">
          Don&apos;t have an account?{" "}
        </span>
        <Link href="/signup" className="text-[#F04D26] hover:text-[#E63D00] text-sm font-medium transition-colors">
          Sign up
        </Link>
      </div>

      <FooterDisclaimer />
    </AuthLayout>);
}
