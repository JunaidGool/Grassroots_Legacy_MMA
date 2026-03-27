"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { useToast } from "@/hooks/useToast";
import type { Fighter } from "@/types/fighter";

const AGE_FILTER_OPTIONS = [
  { value: "", label: "All Categories" },
  { value: "Youth C", label: "Youth C" },
  { value: "Youth B", label: "Youth B" },
  { value: "Youth A", label: "Youth A" },
  { value: "Adult Jnr", label: "Adult Jnr" },
  { value: "Adults", label: "Adults" },
];

export default function FightersPage() {
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Fighter | null>(null);
  const [deleting, setDeleting] = useState(false);
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

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/fighters/${deleteTarget.id}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast(`${deleteTarget.name} removed`, "success");
        setFighters((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      } else {
        toast(json.error || "Failed to remove", "error");
      }
    } catch {
      toast("Failed to remove fighter", "error");
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const filtered = fighters.filter((f) => {
    if (filter && f.ageCat !== filter) return false;
    if (search.length >= 2) {
      const q = search.toLowerCase();
      if (!f.name.toLowerCase().includes(q) && !f.nickname.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const medicalVariant = (status: string) =>
    status === "cleared" ? "green" : status === "declined" ? "red" : "neutral";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-heading font-bold text-foreground">
          Fighters ({fighters.length})
        </h1>
      </div>

      <div className="flex gap-3 flex-wrap">
        <Input
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[200px] h-10"
        />
        <Select
          options={AGE_FILTER_OPTIONS}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-40 h-10"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No Fighters Found"
          description={filter || search ? "Try adjusting your filters." : "Register fighters to see them here."}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((f, i) => (
            <Card
              key={f.id}
              className="stagger-item"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-dark-600 flex items-center justify-center shrink-0">
                    <span className="text-xs font-heading font-bold text-dark-200">
                      {f.name.split(" ").map((n) => n[0]).join("")}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-semibold text-sm text-foreground truncate">
                      {f.name}
                      {f.nickname && (
                        <span className="text-muted font-normal text-xs">
                          {" "}&quot;{f.nickname}&quot;
                        </span>
                      )}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <Badge variant="neutral">{f.ageCat}</Badge>
                      <Badge variant="gold">{f.weightClass}</Badge>
                      <Badge variant="neutral">{f.weight}kg</Badge>
                      <Badge variant="neutral">{f.gym}</Badge>
                      <Badge variant={medicalVariant(f.medical)}>{f.medical}</Badge>
                      {f.weighedIn && (
                        <Badge variant="green">Weighed: {f.weighInKg}kg</Badge>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted">{f.priorFights} prior</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-1 h-8 text-xs text-danger hover:text-red-300"
                      onClick={() => setDeleteTarget(f)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove Fighter"
        message={`Remove ${deleteTarget?.name}? This will also delete their matchups and scores.`}
        loading={deleting}
      />
    </div>
  );
}
