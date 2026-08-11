"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  ShieldAlert,
  Phone,
  Plus,
  Trash2,
  Siren,
  Share2,
  Ban,
  FileWarning,
  CheckCircle2,
  Clock,
  XCircle,
  Users,
  Lock,
  IdCard,
  Car,
  Camera,
  Mail,
  Upload,
  X,
  KeyRound,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useCurrentUser } from "@/hooks/use-current-user";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { TrustMeter } from "@/components/safety/trust-badge";
import { SosButton } from "@/components/safety/sos-button";

interface Verification {
  id: string;
  type: string;
  status: string;
  reference: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string | null;
}

const VERIFICATION_TYPES = [
  {
    type: "NIN",
    label: "NIN",
    description: "National Identification Number (11 digits)",
    icon: IdCard,
    placeholder: "12345678901",
    inputLabel: "Enter your 11-digit NIN",
    inputType: "number",
    helper: "Found on your NIMC slip. We verify it against the NIMC database.",
  },
  {
    type: "DRIVERS_LICENSE",
    label: "Driver's License",
    description: "Valid Nigerian driver's license number",
    icon: Car,
    placeholder: "DL123456AB",
    inputLabel: "Enter your driver's license number",
    inputType: "text",
    helper: "Found on your FRSC-issued license. Format: DL + digits + letters.",
  },
  {
    type: "VEHICLE_PLATE",
    label: "Vehicle Plate",
    description: "Confirmed vehicle registration number",
    icon: Car,
    placeholder: "ABC-123-XY",
    inputLabel: "Enter your vehicle plate number",
    inputType: "text",
    helper: "Your car's plate number as registered with FRSC.",
  },
  {
    type: "SELFIE",
    label: "Selfie ID",
    description: "Live selfie matching your ID photo",
    icon: Camera,
    placeholder: "",
    inputLabel: "Upload a clear selfie holding your ID",
    inputType: "file",
    helper: "Take a selfie holding your NIN slip or driver's license. JPG/PNG, max 5MB.",
  },
  {
    type: "PHONE",
    label: "Phone Number",
    description: "Verify via OTP SMS",
    icon: Phone,
    placeholder: "+2348030000000",
    inputLabel: "Enter your phone number",
    inputType: "tel",
    helper: "We'll send a 6-digit code via SMS. Standard rates apply.",
  },
  {
    type: "EMAIL",
    label: "Email Address",
    description: "Verify via confirmation link",
    icon: Mail,
    placeholder: "you@email.com",
    inputLabel: "Enter your email address",
    inputType: "email",
    helper: "We'll send a verification link to this address.",
  },
];

export function SafetyView() {
  const { user } = useCurrentUser();
  const qc = useQueryClient();
  const [contactForm, setContactForm] = useState({ name: "", phone: "", relationship: "" });
  const [addingContact, setAddingContact] = useState(false);
  const [verifyModal, setVerifyModal] = useState<{ type: string } | null>(null);
  const [verifyValue, setVerifyValue] = useState("");
  const [verifyOtp, setVerifyOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [submittingVerify, setSubmittingVerify] = useState(false);

  const { data: verifData } = useQuery({
    queryKey: ["verifications"],
    queryFn: () => api.get<{ verifications: Verification[] }>(`/api/safety/verifications`),
  });
  const { data: contactsData } = useQuery({
    queryKey: ["emergency-contacts"],
    queryFn: () => api.get<{ contacts: EmergencyContact[] }>(`/api/safety/contacts`),
  });

  const verifications = verifData?.verifications ?? [];
  const contacts = contactsData?.contacts ?? [];

  const openVerifyModal = (type: string) => {
    setVerifyModal({ type });
    setVerifyValue("");
    setVerifyOtp("");
    setOtpSent(false);
  };

  const sendOtp = async () => {
    if (!verifyValue || verifyValue.length < 7) {
      toast.error("Enter a valid phone number first");
      return;
    }
    setSubmittingVerify(true);
    try {
      // Mock OTP send — in production, integrate Termii/Twilio
      await new Promise((r) => setTimeout(r, 800));
      setOtpSent(true);
      toast.success(`OTP sent to ${verifyValue}. Use 123456 for demo.`);
    } catch (err) {
      toast.error("Failed to send OTP");
      console.error(err);
    } finally {
      setSubmittingVerify(false);
    }
  };

  const submitVerification = async () => {
    if (!verifyModal) return;
    const config = VERIFICATION_TYPES.find((v) => v.type === verifyModal.type);
    if (!config) return;

    if (!verifyValue && config.inputType !== "file") {
      toast.error(`Please enter your ${config.label.toLowerCase()}`);
      return;
    }

    // For phone OTP, verify the OTP code
    if (verifyModal.type === "PHONE" && !otpSent) {
      await sendOtp();
      return;
    }
    if (verifyModal.type === "PHONE" && otpSent && verifyOtp !== "123456") {
      toast.error("Invalid OTP code. Use 123456 for demo.");
      return;
    }

    setSubmittingVerify(true);
    try {
      // For selfie, simulate file upload (mock document URL)
      const documentUrl =
        config.inputType === "file" ? `mock://selfie-${Date.now()}.jpg` : undefined;

      await api.post(`/api/safety/verifications`, {
        type: verifyModal.type,
        reference: verifyValue,
        documentUrl,
      });

      const autoApproved = verifyModal.type === "PHONE" || verifyModal.type === "EMAIL";
      toast.success(
        autoApproved
          ? `${config.label} verified successfully!`
          : `${config.label} submitted for review. We'll verify within 24 hours.`,
      );
      qc.invalidateQueries({ queryKey: ["verifications"] });
      qc.invalidateQueries({ queryKey: ["session"] });
      setVerifyModal(null);
      setVerifyValue("");
      setVerifyOtp("");
      setOtpSent(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to submit verification";
      toast.error(msg);
      console.error(err);
    } finally {
      setSubmittingVerify(false);
    }
  };

  const addContact = async () => {
    if (!contactForm.name || !contactForm.phone) {
      toast.error("Name and phone are required");
      return;
    }
    setAddingContact(true);
    try {
      await api.post(`/api/safety/contacts`, contactForm);
      toast.success(`${contactForm.name} added to your emergency contacts`);
      setContactForm({ name: "", phone: "", relationship: "" });
      qc.invalidateQueries({ queryKey: ["emergency-contacts"] });
    } catch (err) {
      toast.error("Failed to add contact");
      console.error(err);
    } finally {
      setAddingContact(false);
    }
  };

  const deleteContact = async (id: string) => {
    try {
      await api.del(`/api/safety/contacts/${id}`);
      toast.success("Contact removed");
      qc.invalidateQueries({ queryKey: ["emergency-contacts"] });
    } catch (err) {
      toast.error("Failed to remove contact");
      console.error(err);
    }
  };

  const statusIcon = (status: string) => {
    if (status === "APPROVED") return <CheckCircle2 className="size-4 text-chart-2" />;
    if (status === "PENDING") return <Clock className="size-4 text-chart-3" />;
    if (status === "REJECTED") return <XCircle className="size-4 text-destructive" />;
    return <Clock className="size-4 text-muted-foreground" />;
  };

  const statusLabel = (status: string) => {
    if (status === "APPROVED") return "Verified";
    if (status === "PENDING") return "Under review";
    if (status === "REJECTED") return "Rejected";
    return status;
  };

  const currentConfig = verifyModal
    ? VERIFICATION_TYPES.find((v) => v.type === verifyModal.type)
    : null;

  return (
    <main className="container mx-auto px-4 py-8 md:py-10 relative">
      <header className="mb-8">
        <Badge variant="secondary" className="mb-3 gap-1.5">
          <ShieldCheck className="size-3.5" />
          SAFETY CENTER
        </Badge>
        <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tight">
          Your safety toolkit
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-lg">
          Verify your identity, manage emergency contacts, share live trips, and trigger SOS alerts.
          Built for safety on Nigerian roads.
        </p>
      </header>

      {/* Trust score + SOS */}
      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        <Card className="lg:col-span-2 border-2">
          <CardContent className="p-6">
            <TrustMeter score={user?.trustScore ?? 0} verified={!!user?.isVerified} />
            <div className="mt-4 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-2xl font-display font-bold text-chart-2 tabular-nums">
                  {verifications.filter((v) => v.status === "APPROVED").length}
                </p>
                <p className="text-xs text-muted-foreground">Verified</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-2xl font-display font-bold text-chart-3 tabular-nums">
                  {verifications.filter((v) => v.status === "PENDING").length}
                </p>
                <p className="text-xs text-muted-foreground">Pending</p>
              </div>
              <div className="rounded-xl bg-muted/50 p-3">
                <p className="text-2xl font-display font-bold tabular-nums">{contacts.length}</p>
                <p className="text-xs text-muted-foreground">Contacts</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-destructive/30 bg-destructive/5">
          <CardContent className="p-6 flex flex-col items-center text-center">
            <div className="size-14 rounded-2xl bg-destructive/15 text-destructive flex items-center justify-center mb-3">
              <Siren className="size-7" />
            </div>
            <h3 className="font-display font-bold text-lg">Emergency SOS</h3>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Tap the SOS button (bottom-right) to alert your contacts + NaijaRide safety team with your live location.
            </p>
            <Button
              variant="destructive"
              className="w-full rounded-full gap-2"
              onClick={() => toast.info("Use the floating red button at bottom-right of any screen.")}
            >
              <Siren className="size-4" />
              How SOS works
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Verification grid */}
      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-display font-bold flex items-center gap-2">
              <ShieldCheck className="size-5 text-primary" />
              Identity verification
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Verified users get more bookings and higher trust scores. Complete all 6 to reach 100.
            </p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {VERIFICATION_TYPES.map((v) => {
            const existing = verifications.find((x) => x.type === v.type);
            const status = existing?.status;
            return (
              <Card key={v.type} className="border-2 hover:border-primary/30 transition-all">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <v.icon className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{v.label}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{v.description}</p>
                      </div>
                    </div>
                    {status && <span className="shrink-0">{statusIcon(status)}</span>}
                  </div>

                  {status === "APPROVED" ? (
                    <div className="space-y-1">
                      <Badge className="bg-chart-2/15 text-chart-2 w-full justify-center gap-1">
                        <CheckCircle2 className="size-3" /> Verified
                      </Badge>
                      {existing?.reference && (
                        <p className="text-[10px] text-muted-foreground truncate text-center">
                          {existing.reference}
                        </p>
                      )}
                    </div>
                  ) : status === "PENDING" ? (
                    <Badge className="bg-chart-3/15 text-chart-3 w-full justify-center gap-1">
                      <Clock className="size-3" /> Under review
                    </Badge>
                  ) : status === "REJECTED" ? (
                    <div className="space-y-1.5">
                      <Badge className="bg-destructive/15 text-destructive w-full justify-center gap-1">
                        <XCircle className="size-3" /> Rejected
                      </Badge>
                      {existing?.rejectionReason && (
                        <p className="text-[10px] text-destructive">{existing.rejectionReason}</p>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        className="w-full rounded-full text-xs"
                        onClick={() => openVerifyModal(v.type)}
                      >
                        Try again
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full rounded-full text-xs gap-1.5"
                      onClick={() => openVerifyModal(v.type)}
                    >
                      <ShieldCheck className="size-3.5" />
                      Verify now
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Emergency contacts */}
      <section className="mb-10">
        <h2 className="text-xl font-display font-bold flex items-center gap-2 mb-4">
          <Phone className="size-5 text-primary" />
          Emergency contacts
        </h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <Card className="border-2">
            <CardContent className="p-5 space-y-3">
              <h3 className="font-semibold">Add a contact</h3>
              <p className="text-xs text-muted-foreground">
                These people will be alerted when you trigger SOS.
              </p>
              <div className="space-y-2">
                <div>
                  <Label className="text-xs">Name</Label>
                  <Input
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    placeholder="e.g. Tunde Brother"
                    className="rounded-full"
                  />
                </div>
                <div>
                  <Label className="text-xs">Phone</Label>
                  <Input
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    placeholder="+2348030000000"
                    className="rounded-full"
                  />
                </div>
                <div>
                  <Label className="text-xs">Relationship (optional)</Label>
                  <Input
                    value={contactForm.relationship}
                    onChange={(e) => setContactForm({ ...contactForm, relationship: e.target.value })}
                    placeholder="Brother / Wife / Friend"
                    className="rounded-full"
                  />
                </div>
              </div>
              <Button
                onClick={addContact}
                disabled={addingContact}
                className="w-full rounded-full gap-1.5"
              >
                <Plus className="size-4" />
                {addingContact ? "Adding…" : "Add contact"}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-2">
            <CardContent className="p-5">
              <h3 className="font-semibold mb-3">Your contacts ({contacts.length})</h3>
              {contacts.length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  <Users className="size-10 mx-auto mb-2 opacity-40" />
                  No contacts yet. Add at least one trusted person.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-warm pr-2">
                  {contacts.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-border/60"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-sm truncate">{c.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {c.phone}{c.relationship ? ` · ${c.relationship}` : ""}
                        </p>
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="rounded-full text-muted-foreground hover:text-destructive shrink-0"
                        onClick={() => deleteContact(c.id)}
                        aria-label="Remove contact"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Safety features grid */}
      <section>
        <h2 className="text-xl font-display font-bold mb-4">More safety features</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border-2">
            <CardContent className="p-5 space-y-2">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Share2 className="size-5" />
              </div>
              <h3 className="font-semibold">Live trip sharing</h3>
              <p className="text-xs text-muted-foreground">
                Generate a link for loved ones to track your trip in real time. Auto-expires after 24h.
              </p>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardContent className="p-5 space-y-2">
              <div className="size-10 rounded-xl bg-chart-2/10 text-chart-2 flex items-center justify-center">
                <Users className="size-5" />
              </div>
              <h3 className="font-semibold">Female-only rides</h3>
              <p className="text-xs text-muted-foreground">
                Female drivers can offer female-only trips. Female passengers get priority matching.
              </p>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardContent className="p-5 space-y-2">
              <div className="size-10 rounded-xl bg-chart-3/10 text-chart-3 flex items-center justify-center">
                <Ban className="size-5" />
              </div>
              <h3 className="font-semibold">Block &amp; report</h3>
              <p className="text-xs text-muted-foreground">
                Block any user from matching or messaging you. Report suspicious behaviour for admin review.
              </p>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardContent className="p-5 space-y-2">
              <div className="size-10 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center">
                <FileWarning className="size-5" />
              </div>
              <h3 className="font-semibold">Incident reports</h3>
              <p className="text-xs text-muted-foreground">
                File detailed reports. Suspected kidnapping auto-escalates to severity 5 with immediate admin alert.
              </p>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardContent className="p-5 space-y-2">
              <div className="size-10 rounded-xl bg-chart-4/10 text-chart-4 flex items-center justify-center">
                <Lock className="size-5" />
              </div>
              <h3 className="font-semibold">Encrypted messaging</h3>
              <p className="text-xs text-muted-foreground">
                In-app chat only — your phone number is never shared with the other party until you choose.
              </p>
            </CardContent>
          </Card>
          <Card className="border-2">
            <CardContent className="p-5 space-y-2">
              <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <ShieldCheck className="size-5" />
              </div>
              <h3 className="font-semibold">Verified-only matching</h3>
              <p className="text-xs text-muted-foreground">
                Filter search to show only NIN-verified drivers. Off by default, on for female-only trips.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <SosButton />

      {/* Verification modal */}
      <Dialog open={!!verifyModal} onOpenChange={(o) => !o && setVerifyModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {currentConfig && (
                <>
                  <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <currentConfig.icon className="size-5" />
                  </div>
                  Verify {currentConfig.label}
                </>
              )}
            </DialogTitle>
            <DialogDescription>{currentConfig?.helper}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {currentConfig?.inputType === "file" ? (
              <div className="space-y-2">
                <Label>{currentConfig.inputLabel}</Label>
                <div className="border-2 border-dashed border-border/60 rounded-2xl p-6 text-center hover:border-primary/40 transition cursor-pointer">
                  <Upload className="size-8 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm font-medium">Click to upload or drag a photo</p>
                  <p className="text-xs text-muted-foreground mt-1">JPG, PNG, max 5MB</p>
                  <input
                    type="file"
                    accept="image/*"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setVerifyValue(file.name);
                        toast.success(`Selected: ${file.name}`);
                      }
                    }}
                  />
                </div>
                {verifyValue && (
                  <p className="text-xs text-chart-2 flex items-center gap-1">
                    <CheckCircle2 className="size-3" />
                    {verifyValue}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label>{currentConfig?.inputLabel}</Label>
                <Input
                  type={currentConfig?.inputType}
                  value={verifyValue}
                  onChange={(e) => setVerifyValue(e.target.value)}
                  placeholder={currentConfig?.placeholder}
                  className="rounded-full"
                />
                {verifyModal?.type === "PHONE" && (
                  <p className="text-[11px] text-muted-foreground">
                    Demo: any phone number works. OTP is always <span className="font-mono font-bold">123456</span>.
                  </p>
                )}
              </div>
            )}

            {verifyModal?.type === "PHONE" && otpSent && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-2 overflow-hidden"
              >
                <Label>Enter OTP code</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={verifyOtp}
                  onChange={(e) => setVerifyOtp(e.target.value.replace(/\D/g, ""))}
                  placeholder="123456"
                  className="rounded-full font-mono text-center tracking-[0.5em]"
                />
                <button
                  type="button"
                  onClick={sendOtp}
                  className="text-xs text-primary hover:underline"
                >
                  Resend code
                </button>
              </motion.div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              className="rounded-full"
              onClick={() => setVerifyModal(null)}
              disabled={submittingVerify}
            >
              Cancel
            </Button>
            <Button
              className="rounded-full gap-1.5"
              onClick={submitVerification}
              disabled={submittingVerify}
            >
              {submittingVerify ? (
                <span className="size-4 rounded-full border-2 border-primary-foreground/30 border-t-primary-foreground animate-spin" />
              ) : verifyModal?.type === "PHONE" && !otpSent ? (
                <KeyRound className="size-4" />
              ) : (
                <ShieldCheck className="size-4" />
              )}
              {submittingVerify
                ? "Verifying…"
                : verifyModal?.type === "PHONE" && !otpSent
                  ? "Send OTP"
                  : "Submit verification"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
