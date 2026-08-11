"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Car,
  Mail,
  Lock,
  User,
  Phone,
  ArrowRight,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Zap,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useNavigation } from "@/lib/store";
import { api } from "@/lib/api";
import { LogoEmblem } from "@/components/logo";

const signinSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
});

const signupSchema = z.object({
  name: z.string().min(2, "Tell us your name"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(6, "At least 6 characters"),
  phone: z.string().optional(),
  role: z.enum(["PASSENGER", "DRIVER", "BOTH"]),
});

type SigninValues = z.infer<typeof signinSchema>;
type SignupValues = z.infer<typeof signupSchema>;

export function AuthView({ initialMode }: { initialMode: "signin" | "signup" }) {
  const [mode, setMode] = useState<"signin" | "signup">(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<null | "PASSENGER" | "DRIVER" | "ADMIN">(null);
  const { navigate } = useNavigation();

  const signinForm = useForm<SigninValues>({
    resolver: zodResolver(signinSchema),
    defaultValues: { email: "", password: "" },
  });

  const signupForm = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      phone: "",
      role: "PASSENGER",
    },
  });

  const doSignin = async (email: string, password: string) => {
    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });
    return res;
  };

  const handleSignin = async (values: SigninValues) => {
    setLoading(true);
    try {
      const res = await doSignin(values.email, values.password);
      if (!res || res.error) {
        toast.error("Invalid email or password");
      } else {
        toast.success("Welcome back!");
        // Full reload to dashboard so session is fresh
        window.location.href = "/?view=dashboard";
      }
    } catch (err) {
      toast.error("Something went wrong. Try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (values: SignupValues) => {
    setLoading(true);
    try {
      await api.post(`/api/auth/register`, {
        name: values.name,
        email: values.email,
        password: values.password,
        phone: values.phone,
        role: values.role,
      });
      const res = await doSignin(values.email, values.password);
      if (!res || res.error) {
        toast.error("Account created. Please sign in.");
        setMode("signin");
        signinForm.setValue("email", values.email);
      } else {
        toast.success(`Welcome, ${values.name.split(" ")[0]}!`);
        window.location.href = "/?view=dashboard";
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to create account";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemo = async (which: "PASSENGER" | "DRIVER" | "ADMIN") => {
    setDemoLoading(which);
    try {
      // Ensure demo accounts exist
      const accounts = await api.get<{
        passenger: { email: string; password: string };
        driver: { email: string; password: string };
        femaleDriver?: { email: string; password: string };
        admin: { email: string; password: string };
      }>(`/api/demo/accounts`);

      const creds =
        which === "PASSENGER"
          ? accounts.passenger
          : which === "DRIVER"
            ? accounts.driver
            : accounts.admin;

      const res = await doSignin(creds.email, creds.password);
      if (!res || res.error) {
        toast.error("Demo account failed to sign in. Try again.");
      } else {
        const label =
          which === "PASSENGER"
            ? "passenger"
            : which === "DRIVER"
              ? "driver"
              : "admin";
        toast.success(`Signed in as demo ${label}!`);
        // Full reload to ensure session is fresh — pick destination based on role
        const dest = which === "ADMIN" ? "admin" : "dashboard";
        window.location.href = `/?view=${dest}`;
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to start demo session");
    } finally {
      setDemoLoading(null);
    }
  };

  return (
    <main className="container mx-auto px-4 py-10 md:py-14 flex items-center justify-center">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="mb-4"
          >
            <LogoEmblem size={84} />
          </motion.div>
          <h1 className="text-3xl font-display font-bold tracking-tight">
            {mode === "signin" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5">
            {mode === "signin"
              ? "Sign in to manage trips and bookings"
              : "Start sharing rides across Nigeria"}
          </p>
        </div>

        <Card className="border-2 card-stamp">
          <CardContent className="p-6">
            {/* Tab toggle */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-muted rounded-full mb-6">
              <button
                onClick={() => setMode("signin")}
                className={`text-sm py-2 rounded-full font-medium transition ${
                  mode === "signin"
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                Sign in
              </button>
              <button
                onClick={() => setMode("signup")}
                className={`text-sm py-2 rounded-full font-medium transition ${
                  mode === "signup"
                    ? "bg-foreground text-background shadow-sm"
                    : "text-muted-foreground"
                }`}
              >
                Sign up
              </button>
            </div>

            <AnimatePresence mode="wait">
              {mode === "signin" ? (
                <motion.div
                  key="signin"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.18 }}
                >
                  <Form {...signinForm}>
                    <form
                      onSubmit={signinForm.handleSubmit(handleSignin)}
                      className="space-y-4"
                    >
                      <FormField
                        control={signinForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                  type="email"
                                  placeholder="you@email.com"
                                  className="pl-9 rounded-full"
                                  autoComplete="email"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={signinForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                  type={showPassword ? "text" : "password"}
                                  placeholder="•••••••"
                                  className="pl-9 pr-9 rounded-full"
                                  autoComplete="current-password"
                                  {...field}
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowPassword((v) => !v)
                                  }
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                  aria-label="Toggle password visibility"
                                >
                                  {showPassword ? (
                                    <EyeOff className="size-4" />
                                  ) : (
                                    <Eye className="size-4" />
                                  )}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2 rounded-full font-semibold h-11"
                      >
                        {loading ? "Signing in..." : "Sign in"}
                        {!loading && <ArrowRight className="size-4" />}
                      </Button>
                    </form>
                  </Form>
                </motion.div>
              ) : (
                <motion.div
                  key="signup"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.18 }}
                >
                  <Form {...signupForm}>
                    <form
                      onSubmit={signupForm.handleSubmit(handleSignup)}
                      className="space-y-4"
                    >
                      <FormField
                        control={signupForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full name</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                  placeholder="Ade Thompson"
                                  className="pl-9 rounded-full"
                                  autoComplete="name"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={signupForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                  type="email"
                                  placeholder="you@email.com"
                                  className="pl-9 rounded-full"
                                  autoComplete="email"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={signupForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone (optional)</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                  placeholder="+234..."
                                  className="pl-9 rounded-full"
                                  autoComplete="tel"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={signupForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                  type={showPassword ? "text" : "password"}
                                  placeholder="At least 6 characters"
                                  className="pl-9 pr-9 rounded-full"
                                  autoComplete="new-password"
                                  {...field}
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    setShowPassword((v) => !v)
                                  }
                                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                                  aria-label="Toggle password visibility"
                                >
                                  {showPassword ? (
                                    <EyeOff className="size-4" />
                                  ) : (
                                    <Eye className="size-4" />
                                  )}
                                </button>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={signupForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>I want to</FormLabel>
                            <FormControl>
                              <RadioGroup
                                value={field.value}
                                onValueChange={field.onChange}
                                className="grid grid-cols-3 gap-2"
                              >
                                {[
                                  {
                                    value: "PASSENGER",
                                    label: "Find rides",
                                  },
                                  {
                                    value: "DRIVER",
                                    label: "Offer rides",
                                  },
                                  {
                                    value: "BOTH",
                                    label: "Both",
                                  },
                                ].map((opt) => (
                                  <label
                                    key={opt.value}
                                    htmlFor={opt.value}
                                    className="flex items-center gap-2 p-3 rounded-xl border-2 border-border cursor-pointer hover:bg-accent hover:border-primary/40 transition text-sm has-[:checked]:border-primary has-[:checked]:bg-primary/5 has-[:checked]:text-primary font-medium"
                                  >
                                    <RadioGroupItem
                                      value={opt.value}
                                      id={opt.value}
                                    />
                                    {opt.label}
                                  </label>
                                ))}
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2 rounded-full font-semibold h-11"
                      >
                        {loading ? "Creating account..." : "Create account"}
                        {!loading && <ArrowRight className="size-4" />}
                      </Button>
                      <p className="text-xs text-muted-foreground text-center">
                        By signing up, you agree to NaijaRide&apos;s community
                        guidelines.
                      </p>
                    </form>
                  </Form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Try Demo block */}
            <div className="mt-6 pt-6 border-t-2 border-border/30">
              <div className="flex items-center gap-2 mb-3">
                <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                  <Sparkles className="size-3.5" />
                </div>
                <p className="text-sm font-semibold">
                  Try NaijaRide as a demo user
                </p>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                One click — no signup required. Demo data is preloaded.
              </p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!!demoLoading}
                  onClick={() => handleDemo("PASSENGER")}
                  className="gap-1 rounded-full text-xs"
                >
                  {demoLoading === "PASSENGER" ? (
                    <span className="size-3 rounded-full border-2 border-foreground/30 border-t-foreground animate-spin" />
                  ) : (
                    <Star className="size-3.5" />
                  )}
                  Passenger
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!!demoLoading}
                  onClick={() => handleDemo("DRIVER")}
                  className="gap-1 rounded-full text-xs"
                >
                  {demoLoading === "DRIVER" ? (
                    <span className="size-3 rounded-full border-2 border-foreground/30 border-t-foreground animate-spin" />
                  ) : (
                    <Car className="size-3.5" />
                  )}
                  Driver
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!!demoLoading}
                  onClick={() => handleDemo("ADMIN")}
                  className="gap-1 rounded-full text-xs"
                >
                  {demoLoading === "ADMIN" ? (
                    <span className="size-3 rounded-full border-2 border-foreground/30 border-t-foreground animate-spin" />
                  ) : (
                    <ShieldCheck className="size-3.5" />
                  )}
                  Admin
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground/70 mt-2 flex items-center gap-1">
                <Zap className="size-3" />
                Pre-loaded: 2 demo trips from the demo driver.
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground mt-6">
          {mode === "signin" ? (
            <>
              New here?{" "}
              <button
                onClick={() => setMode("signup")}
                className="text-primary font-semibold hover:underline"
              >
                Create an account
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => setMode("signin")}
                className="text-primary font-semibold hover:underline"
              >
                Sign in
              </button>
            </>
          )}
        </p>
      </div>
    </main>
  );
}
