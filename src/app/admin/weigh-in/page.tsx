"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/hooks/useToast";
import { getMaxWeight } from "@/lib/weight-classes";
import type { Fighter } from "@/types/fighter";

const AGE_FILTER_OPTIONS = [
  { value: "", label: "All Categories" },
  { value: "Youth C", label: "Youth C" },
  { value: "Youth B", label: "Youth B" },
  { value: "Youth A", label: "Youth A" },
  { value: "Adult Jnr", label: "Adult Jnr" },
  { value: "Adults", label: "Adults" },
];

export default function WeighInPage() {
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const { toast } = useToast();

  const fetchFighters = async () => {
    try {
      const res = await fetch("/api/fighters");
      const json = await res.json();
      if (json.success) setFighters(json.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFighters();
  }, []);

  // Only show medically cleared fighters
  const cleared = fighters.filter((f) => f.medical === "cleared");
  const filtered = filter ? cleared.filter((f) => f.ageCat === filter) : cleared;
  const weighedCount = cleared.filter((f) => f.weighedIn).length;
  const progress = cleared.length > 0 ? (weighedCount / cleared.length) * 100 : 0;

  const handleWeighIn = async (fighter: Fighter) => {
    const input = prompt(
      `Enter weigh-in weight for ${fighter.name} (kg):`,
      String(fighter.weight)
    );
    if (!input) return;

    const weight = parseFloat(input);
    if (isNaN(weight) || weight < 20 || weight > 200) {
      toast("Invalid weight", "error");
      return;
    }

    try {
      const res = await fetch("/api/weigh-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fighterId: fighter.id, weight }),
      });
      const json = await res.json();
      if (json.success) {
        setFighters((prev) =>
          prev.map((f) =>
            f.id === fighter.id ? { ...f, weighedIn: true, weighInKg: weight } : f
          )
        );
        toast(`${fighter.name} weighed in at ${weight}kg`, "success");
      } else {
        toast(json.error || "Weigh-in failed", "error");
      }
    } catch {
      toast("Weigh-in failed", "error");
    }
  };

  const handleClearWeighIn = async (fighter: Fighter) => {
    try {
      const res = await fetch(`/api/fighters/${fighter.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weighedIn: false, weighInKg: null }),
      });
      const json = await res.json();
      if (json.success) {
        setFighters((prev) =>
          prev.map((f) =>
            f.id === fighter.id ? { ...f, weighedIn: false, weighInKg: null } : f
          )
        );
        toast(`${fighter.name} weigh-in cleared`, "info");
      }
    } catch {
      toast("Failed to clear weigh-in", "error");
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <CardSkeleton />
        {[...Array(4)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-heading font-bold text-foreground">
        Weigh-In
      </h1>

      {/* Progress bar */}
      <Card>
        <CardContent className="py-3">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted">
              {weighedCount} of {cleared.length} cleared fighters weighed in
            </span>
            <span className="text-gold-400 font-heading font-bold">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
            <div
              className="h-full gold-gradient rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <Select
        options={AGE_FILTER_OPTIONS}
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-48 h-10"
      />

      {filtered.length === 0 ? (
        <EmptyState
          title="No Cleared Fighters"
          description="Only medically cleared fighters appear here."
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((f, i) => {
            const maxWeight = getMaxWeight(f.gender, f.ageCat, f.weightClass);
            const isOverweight = f.weighInKg && maxWeight ? f.weighInKg > maxWeight : false;

            return (
              <Card
                key={f.id}
                className="stagger-item"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <CardContent className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        f.weighedIn
                          ? isOverweight
                            ? "bg-danger/20 border-2 border-danger/50"
                            : "bg-success/20 border-2 border-success/50"
                          : "bg-dark-600"
                      }`}
                    >
                      <span
                        className={`text-xs font-heading font-bold ${
                          f.weighedIn
                            ? isOverweight
                              ? "text-red-400"
                              : "text-green-400"
                            : "text-dark-200"
                        }`}
                      >
                        {f.name.split(" ").map((n) => n[0]).join("")}
                      </span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-semibold text-sm text-foreground truncate">
                        {f.name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5 text-xs">
                        <Badge variant="gold">{f.weightClass}</Badge>
                        <span className="text-muted">
                          Reg: {f.weight}kg
                        </span>
                        {maxWeight && (
                          <span className="text-muted">Max: {maxWeight}kg</span>
                        )}
                        {f.weighedIn && f.weighInKg && (
                          <Badge variant={isOverweight ? "red" : "green"}>
                            Actual: {f.weighInKg}kg
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Button
                      variant={f.weighedIn ? "ghost" : "secondary"}
                      size="sm"
                      className="h-10 shrink-0"
                      onClick={() =>
                        f.weighedIn ? handleClearWeighIn(f) : handleWeighIn(f)
                      }
                    >
                      {f.weighedIn ? "Clear" : "Weigh In"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
