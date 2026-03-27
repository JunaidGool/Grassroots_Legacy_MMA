"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Matchup } from "@/types/matchup";
import type { Fighter } from "@/types/fighter";
import type { Score } from "@/types/score";
import { OUTCOME_LABELS } from "@/types/score";
import { ROUND_STRUCTURE } from "@/lib/weight-classes";

export default function FightCardPage() {
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [mRes, fRes, sRes] = await Promise.all([
          fetch("/api/matchups"),
          fetch("/api/fighters"),
          fetch("/api/scores"),
        ]);
        const [mJson, fJson, sJson] = await Promise.all([
          mRes.json(),
          fRes.json(),
          sRes.json(),
        ]);
        if (mJson.success) setMatchups(mJson.data);
        if (fJson.success) setFighters(fJson.data);
        if (sJson.success) setScores(sJson.data);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  const fighterMap = new Map(fighters.map((f) => [f.id, f]));
  const scoreMap = new Map(scores.map((s) => [s.matchupId, s]));
  const sorted = [...matchups].sort((a, b) => a.boutNumber - b.boutNumber);

  if (sorted.length === 0) {
    return (
      <EmptyState
        title="No Bouts Scheduled"
        description="The fight card will appear here once matchups are created."
      />
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold text-foreground">
        Fight Card
      </h1>

      <div className="space-y-4">
        {sorted.map((m, i) => {
          const red = fighterMap.get(m.fighter1);
          const blue = fighterMap.get(m.fighter2);
          const score = scoreMap.get(m.id);
          const isScored = !!score;
          const rounds = ROUND_STRUCTURE[m.ageCat] ?? "3 × 3 min";

          return (
            <Card
              key={m.id}
              accent={!isScored}
              gold={isScored}
              className="stagger-item overflow-hidden"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <CardContent className="p-0">
                {/* Header bar */}
                <div className="flex items-center justify-between px-4 py-2 bg-dark-700/50">
                  <span className="text-xs font-heading font-bold text-muted">
                    BOUT #{m.boutNumber}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="neutral">{m.ageCat}</Badge>
                    <Badge variant="gold">{m.weightClass}</Badge>
                    <span className="text-xs text-muted">{rounds}</span>
                  </div>
                </div>

                {/* Fighter matchup */}
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-4">
                  {/* Red corner */}
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-red-500/20 border-2 border-red-500/50 flex items-center justify-center mx-auto mb-2">
                      <span className="text-sm font-heading font-bold text-red-400">
                        {red?.name?.split(" ").map((n) => n[0]).join("") ?? "?"}
                      </span>
                    </div>
                    <p className="font-heading font-semibold text-sm text-foreground">
                      {red?.name ?? "TBD"}
                    </p>
                    {red?.nickname && (
                      <p className="text-xs text-muted">&quot;{red.nickname}&quot;</p>
                    )}
                    <p className="text-xs text-dark-300 mt-0.5">{red?.gym}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {red?.priorFights ?? 0} prior fights
                    </p>
                  </div>

                  {/* VS */}
                  <div className="flex flex-col items-center">
                    <span className="text-lg font-heading font-bold text-muted">
                      VS
                    </span>
                  </div>

                  {/* Blue corner */}
                  <div className="text-center">
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 border-2 border-blue-500/50 flex items-center justify-center mx-auto mb-2">
                      <span className="text-sm font-heading font-bold text-blue-400">
                        {blue?.name?.split(" ").map((n) => n[0]).join("") ?? "?"}
                      </span>
                    </div>
                    <p className="font-heading font-semibold text-sm text-foreground">
                      {blue?.name ?? "TBD"}
                    </p>
                    {blue?.nickname && (
                      <p className="text-xs text-muted">&quot;{blue.nickname}&quot;</p>
                    )}
                    <p className="text-xs text-dark-300 mt-0.5">{blue?.gym}</p>
                    <p className="text-xs text-muted mt-0.5">
                      {blue?.priorFights ?? 0} prior fights
                    </p>
                  </div>
                </div>

                {/* Score result */}
                {isScored && (
                  <div className="px-4 py-3 bg-gold-500/5 border-t border-gold-500/20">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant="gold">
                          {OUTCOME_LABELS[score.outcome]}
                        </Badge>
                        {score.fotn && <Badge variant="gold">FOTN</Badge>}
                        {score.potn && <Badge variant="gold">POTN</Badge>}
                      </div>
                      <div className="flex items-center gap-3 text-xs font-heading font-bold">
                        <span className="text-red-400">{score.redPts} pts</span>
                        <span className="text-muted">-</span>
                        <span className="text-blue-400">{score.bluePts} pts</span>
                      </div>
                    </div>
                    {score.winnerId && (
                      <p className="text-xs text-gold-400 mt-1 font-medium">
                        Winner: {fighterMap.get(score.winnerId)?.name}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
