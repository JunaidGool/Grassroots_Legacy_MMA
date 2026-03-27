"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function AdminLoginPage() {
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) return;

    setLoading(true);
    const success = await login(pin);
    setLoading(false);

    if (success) {
      toast("Welcome, Admin", "success");
      router.push("/admin/register");
    } else {
      toast("Invalid PIN", "error");
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 gold-gradient rounded-full flex items-center justify-center text-dark-900 font-heading font-bold text-xl mx-auto mb-4">
            GL
          </div>
          <h1 className="text-2xl font-heading font-bold text-foreground">
            Admin Access
          </h1>
          <p className="text-sm text-muted mt-1">
            Enter the event PIN to continue
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="Enter PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            autoFocus
            className="text-center text-2xl tracking-[0.5em] font-heading"
          />
          <Button type="submit" className="w-full" loading={loading}>
            Unlock
          </Button>
        </form>
      </div>
    </div>
  );
}
