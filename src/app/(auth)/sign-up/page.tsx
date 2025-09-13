"use client";

import {
  signUpAction,
  verifyOtpAction,
  signInWithGoogleAction,
} from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import Link from "next/link";
import { useState } from "react";
import { Mail, ArrowLeft, User, MapPin } from "lucide-react";

export default function SignUpPage() {
  const [step, setStep] = useState<"form" | "otp">("form");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<Message>({});

  const handleFormSubmit = async (formData: FormData) => {
    const emailValue = formData.get("email")?.toString() || "";
    setEmail(emailValue);
    const result = await signUpAction(formData);
    if (result && "message" in result) {
      setMessage(result);
      if (result.message.includes("check your email")) {
        setStep("otp");
      }
    } else {
      setStep("otp");
    }
  };

  const handleOtpSubmit = async (formData: FormData) => {
    formData.append("email", email);
    formData.append("type", "signup");
    const result = await verifyOtpAction(formData);
    if (result && "message" in result) {
      setMessage(result);
    }
  };

  const handleGoogleSignUp = async () => {
    await signInWithGoogleAction();
  };

  return (
    <>
      <nav className="w-full border-b border-gray-200 bg-white py-2">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link href="/" prefetch className="text-xl font-bold text-blue-600">
            NumSphere.online
          </Link>
          <div className="flex gap-4 items-center">
            <Link
              href="/sign-in"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              Sign In
            </Link>
          </div>
        </div>
      </nav>
      <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8">
        <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
          <div className="space-y-2 text-center mb-6">
            <h1 className="text-3xl font-semibold tracking-tight">
              Join NumSphere
            </h1>
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                className="text-primary font-medium hover:underline transition-all"
                href="/sign-in"
              >
                Sign in
              </Link>
            </p>
          </div>

          {step === "form" ? (
            <div className="space-y-6">
              <form action={handleFormSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-sm font-medium">
                    <User className="w-4 h-4 inline mr-1" />
                    Full Name
                  </Label>
                  <Input
                    id="full_name"
                    name="full_name"
                    type="text"
                    placeholder="John Doe"
                    required
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    className="w-full"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-sm font-medium">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Address
                  </Label>
                  <Textarea
                    id="address"
                    name="address"
                    placeholder="Your address"
                    required
                    className="w-full min-h-[80px]"
                  />
                </div>

                <SubmitButton
                  className="w-full"
                  pendingText="Creating account..."
                >
                  Create Account
                </SubmitButton>
              </form>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">
                    Or continue with
                  </span>
                </div>
              </div>

              <Button
                onClick={handleGoogleSignUp}
                variant="outline"
                className="w-full"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </Button>

              <FormMessage message={message} />
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <Mail className="w-12 h-12 mx-auto text-blue-600 mb-4" />
                <h2 className="text-xl font-semibold mb-2">
                  Verify your email
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  We sent a verification code to <strong>{email}</strong>
                </p>
              </div>

              <form action={handleOtpSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="token" className="text-sm font-medium">
                    Verification Code
                  </Label>
                  <Input
                    id="token"
                    name="token"
                    type="text"
                    placeholder="Enter 6-digit code"
                    required
                    className="w-full text-center text-lg tracking-widest"
                    maxLength={6}
                  />
                </div>

                <SubmitButton className="w-full" pendingText="Verifying...">
                  Verify & Complete Registration
                </SubmitButton>
              </form>

              <Button
                onClick={() => setStep("form")}
                variant="ghost"
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to form
              </Button>

              <FormMessage message={message} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
