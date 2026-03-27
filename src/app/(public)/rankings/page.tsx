"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Select } from "@/components/ui/Select";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { RankedFighter } from "@/lib/rankings";
import type { AgeCategory } from "@/types/fighter";

const AGE_CATEGORIES: { value: string; label: string }[] = [
  { value: "", label: "All Categories" },
  { value: "Youth C", label: "Youth C (12-13)" },
  { value: "Youth B", label: "Youth B (14-15)" },
  { value: "Youth A", label: "Youth A (16-17)" },
  { value: "Adult Jnr", label: "Adult Jnr (18-20)" },
  { value: "Adults", label: "Adults (21+)" },
];

export default function RankingsPage() {
  const [rankings, setRankings] = useState<RankedFighter[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    async function fetchRankings() {
      try {
        const res = await fetch("/api/rankings");
        const json = await res.json();
        if (json.success) setRankings(json.data);
      } finally {
        setLoading(false);
      }
    }
    fetchRankings();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  const filtered = filter
    ? rankings.filter((r) => r.fighter.ageCat === (filter as AgeCategory))
    : rankings;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-heading font-bold text-foreground">
          Rankings
        </h1>
        <Select
          options={AGE_CATEGORIES}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="w-48 h-10"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No Rankings Yet"
          description="Score fights to see rankings."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((r, i) => (
            <Card
              key={r.fighter.id}
              gold={r.titleEligible}
              className={`stagger-item ${r.titleEligible ? "animate-pulse-gold" : ""}`}
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <CardContent className="py-3 px-4">
                <div className="flex items-center gap-4">
                  {/* Rank */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-heading font-bold text-lg ${
                      r.rank <= 2
                        ? "gold-gradient text-dark-900"
                        : "bg-dark-600 text-muted"
                    }`}
                  >
                    {r.rank}
                  </div>

                  {/* Fighter info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-heading font-semibold text-foreground truncate">
                        {r.fighter.name}
                      </p>
                      {r.titleEligible && (
                        <Badge variant="gold">Title Eligible</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="neutral">{r.fighter.ageCat}</Badge>
                      <Badge variant="neutral">{r.fighter.weightClass}</Badge>
                      <span className="text-xs text-muted">{r.fighter.gym}</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="text-right shrink-0">
                    <p className="text-xl font-heading font-bold text-gold-400">
                      {r.totalPoints}
                    </p>
                    <p className="text-xs text-muted">
                      {r.wins}W-{r.losses}L-{r.draws}D · {r.bouts} bout{r.bouts !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Scoring Legend */}
      <Card>
        <CardContent className="py-3 text-xs text-muted space-y-1">
          <p><strong className="text-dark-200">Scoring:</strong> SUB 5pts · TKO 4pts · UD 3pts · SD 2pts · Draw 2pts each · NC 0pts · Loser 1pt</p>
          <p><strong className="text-dark-200">Bonuses:</strong> Fight of the Night +1 both · Performance of the Night +2 winner</p>
          <p><strong className="text-dark-200">Title Eligible:</strong> 2+ bouts AND ranked top 2 in division</p>
        </CardContent>
      </Card>
    </div>
  );
}
