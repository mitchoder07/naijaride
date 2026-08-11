"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  Lock,
  X,
  ShieldCheck,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatNGN } from "@/lib/api";

type Step = "form" | "processing" | "success";

export function PaystackModal({
  open,
  amount,
  customerEmail,
  onClose,
  onSuccess,
}: {
  open: boolean;
  amount: number;
  customerEmail?: string;
  onClose: () => void;
  onSuccess: (reference: string) => void;
}) {
  const [step, setStep] = useState<Step>("form");
  const [card, setCard] = useState("");
  const [exp, setExp] = useState("");
  const [cvv, setCvv] = useState("");
  const [email, setEmail] = useState(customerEmail ?? "");
  const [reference, setReference] = useState("");

  useEffect(() => {
    if (!open) return;
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      setStep("form");
      setCard("");
      setExp("");
      setCvv("");
      setEmail(customerEmail ?? "");
      setReference("");
    });
    return () => {
      active = false;
    };
  }, [open, customerEmail]);

  const formatCardNumber = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };
  const formatExpiry = (v: string) => {
    const digits = v.replace(/\D/g, "").slice(0, 4);
    if (digits.length <= 2) return digits;
    return digits.slice(0, 2) + "/" + digits.slice(2);
  };

  const handlePay = async () => {
    setStep("processing");
    // Simulate Paystack round-trip — 1.5s
    await new Promise((r) => setTimeout(r, 1500));
    const ref = `PS-mock-${Date.now()}`;
    setReference(ref);
    setStep("success");
    setTimeout(() => {
      onSuccess(ref);
    }, 1100);
  };

  const valid =
    card.replace(/\s/g, "").length >= 12 &&
    exp.length === 5 &&
    cvv.length >= 3 &&
    (!email || /.+@.+\..+/.test(email));

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          if (step === "processing") return;
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
        <DialogHeader className="p-5 pb-0">
          <DialogTitle className="flex items-center gap-2">
            <div className="size-7 rounded-md bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
              P
            </div>
            Paystack
          </DialogTitle>
          <DialogDescription className="text-xs">
            You&apos;re paying{" "}
            <span className="font-semibold text-foreground">
              {formatNGN(amount)}
            </span>{" "}
            for your ride.
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="p-5 space-y-4"
            >
              <div className="space-y-1.5">
                <Label htmlFor="ps-email" className="text-xs">
                  Email (optional)
                </Label>
                <Input
                  id="ps-email"
                  type="email"
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ps-card" className="text-xs">
                  Card number
                </Label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                  <Input
                    id="ps-card"
                    placeholder="0000 0000 0000 0000"
                    className="pl-9 font-mono"
                    value={card}
                    onChange={(e) =>
                      setCard(formatCardNumber(e.target.value))
                    }
                    inputMode="numeric"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ps-exp" className="text-xs">
                    Expiry
                  </Label>
                  <Input
                    id="ps-exp"
                    placeholder="MM/YY"
                    className="font-mono"
                    value={exp}
                    onChange={(e) => setExp(formatExpiry(e.target.value))}
                    inputMode="numeric"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ps-cvv" className="text-xs">
                    CVV
                  </Label>
                  <Input
                    id="ps-cvv"
                    placeholder="123"
                    type="password"
                    className="font-mono"
                    value={cvv}
                    onChange={(e) =>
                      setCvv(
                        e.target.value.replace(/\D/g, "").slice(0, 4),
                      )
                    }
                    inputMode="numeric"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-accent/40 rounded-lg p-2.5">
                <ShieldCheck className="size-4 text-primary" />
                <span>
                  Demo mode — any card details are accepted. No real
                  payment is processed.
                </span>
              </div>
              <Button
                onClick={handlePay}
                disabled={!valid}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90 gap-2 h-11"
              >
                <Lock className="size-4" />
                Pay {formatNGN(amount)}
              </Button>
            </motion.div>
          )}

          {step === "processing" && (
            <motion.div
              key="processing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-10 flex flex-col items-center text-center space-y-3"
            >
              <Loader2 className="size-10 animate-spin text-primary" />
              <p className="font-medium">Processing payment...</p>
              <p className="text-xs text-muted-foreground max-w-[250px]">
                We&apos;re securely confirming your payment with Paystack.
              </p>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="p-10 flex flex-col items-center text-center space-y-3"
            >
              <div className="size-14 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 className="size-8 text-green-600" />
              </div>
              <p className="font-semibold">Payment successful</p>
              <p className="text-xs text-muted-foreground">
                Reference:{" "}
                <span className="font-mono text-foreground">{reference}</span>
              </p>
              <p className="text-xs text-muted-foreground">
                Your booking is now confirmed.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
