"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/hooks/useToast";
import { detectWeightClass } from "@/lib/weight-classes";
import type { Gender, AgeCategory, MedicalStatus } from "@/types/fighter";

const GENDER_OPTIONS = [
  { value: "M", label: "Male" },
  { value: "F", label: "Female" },
];

const AGE_CAT_OPTIONS = [
  { value: "Youth C", label: "Youth C (12-13)" },
  { value: "Youth B", label: "Youth B (14-15)" },
  { value: "Youth A", label: "Youth A (16-17)" },
  { value: "Adult Jnr", label: "Adult Jnr (18-20)" },
  { value: "Adults", label: "Adults (21+)" },
];

const MEDICAL_OPTIONS = [
  { value: "pending", label: "Pending" },
  { value: "cleared", label: "Cleared" },
  { value: "declined", label: "Declined" },
];

interface FormData {
  name: string;
  nickname: string;
  age: string;
  gender: Gender | "";
  ageCat: AgeCategory | "";
  weight: string;
  priorFights: string;
  gym: string;
  phone: string;
  medical: MedicalStatus;
}

const initialForm: FormData = {
  name: "",
  nickname: "",
  age: "",
  gender: "",
  ageCat: "",
  weight: "",
  priorFights: "0",
  gym: "",
  phone: "",
  medical: "pending",
};

export default function RegisterPage() {
  const [form, setForm] = useState<FormData>(initialForm);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const weightClass =
    form.gender && form.ageCat && form.weight
      ? detectWeightClass(
          form.gender as Gender,
          form.ageCat as AgeCategory,
          parseFloat(form.weight)
        )
      : null;

  const update = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name || !form.gender || !form.ageCat || !form.weight || !form.gym) {
      toast("Please fill in all required fields", "error");
      return;
    }

    if (!weightClass) {
      toast("Weight is out of range for this division", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/fighters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          nickname: form.nickname,
          age: parseInt(form.age),
          gender: form.gender,
          ageCat: form.ageCat,
          weight: parseFloat(form.weight),
          weightClass,
          priorFights: parseInt(form.priorFights) || 0,
          gym: form.gym,
          phone: form.phone,
          medical: form.medical,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast(`${form.name} registered — ${weightClass}`, "success");
        setForm(initialForm);
      } else {
        toast(json.error || "Registration failed", "error");
      }
    } catch {
      toast("Registration failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-heading font-bold text-foreground mb-6">
        Register Fighter
      </h1>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader>
            <h2 className="text-sm font-heading font-semibold text-dark-200 uppercase tracking-wider">
              Personal Details
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Full Name *"
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              required
            />
            <Input
              label="Nickname"
              value={form.nickname}
              onChange={(e) => update("nickname", e.target.value)}
              placeholder="e.g. The Storm"
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Age *"
                type="number"
                min={12}
                max={55}
                value={form.age}
                onChange={(e) => update("age", e.target.value)}
                required
              />
              <Select
                label="Gender *"
                options={GENDER_OPTIONS}
                placeholder="Select"
                value={form.gender}
                onChange={(e) => update("gender", e.target.value)}
                required
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-heading font-semibold text-dark-200 uppercase tracking-wider">
              Fight Details
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              label="Age Category *"
              options={AGE_CAT_OPTIONS}
              placeholder="Select category"
              value={form.ageCat}
              onChange={(e) => update("ageCat", e.target.value)}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Weight (kg) *"
                type="number"
                step="0.1"
                min={20}
                max={200}
                value={form.weight}
                onChange={(e) => update("weight", e.target.value)}
                required
              />
              <Input
                label="Prior Fights (0-5) *"
                type="number"
                min={0}
                max={5}
                value={form.priorFights}
                onChange={(e) => update("priorFights", e.target.value)}
                required
              />
            </div>

            {/* Auto-detected weight class */}
            <div>
              <label className="text-sm font-medium text-dark-200 mb-1.5 block">
                Weight Class
              </label>
              <div className="h-[52px] px-4 rounded-lg bg-dark-800 border border-border flex items-center">
                {weightClass ? (
                  <Badge variant="gold">{weightClass}</Badge>
                ) : form.weight && form.gender && form.ageCat ? (
                  <Badge variant="red">Out of range</Badge>
                ) : (
                  <span className="text-muted text-sm">
                    Enter weight, gender & category
                  </span>
                )}
              </div>
            </div>

            <Input
              label="Gym / Academy *"
              value={form.gym}
              onChange={(e) => update("gym", e.target.value)}
              required
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-sm font-heading font-semibold text-dark-200 uppercase tracking-wider">
              Additional Info
            </h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Contact Number"
              type="tel"
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
            <Select
              label="Medical Clearance"
              options={MEDICAL_OPTIONS}
              value={form.medical}
              onChange={(e) => update("medical", e.target.value)}
            />
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" loading={loading}>
          Register Fighter
        </Button>
      </form>
    </div>
  );
}
