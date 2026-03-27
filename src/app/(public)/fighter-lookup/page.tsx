"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import type { Fighter } from "@/types/fighter";
import type { Matchup } from "@/types/matchup";
import type { Score } from "@/types/score";
import { OUTCOME_LABELS } from "@/types/score";

export default function FighterLookupPage() {
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Fighter | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [fRes, mRes, sRes] = await Promise.all([
          fetch("/api/fighters"),
          fetch("/api/matchups"),
          fetch("/api/scores"),
        ]);
        const [fJson, mJson, sJson] = await Promise.all([
          fRes.json(),
          mRes.json(),
          sRes.json(),
        ]);
        if (fJson.success) setFighters(fJson.data);
        if (mJson.success) setMatchups(mJson.data);
        if (sJson.success) setScores(sJson.data);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const filtered = useMemo(() => {
    if (query.length < 2) return [];
    const q = query.toLowerCase();
    return fighters.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.nickname.toLowerCase().includes(q)
    );
  }, [fighters, query]);

  const fighterMap = new Map(fighters.map((f) => [f.id, f]));

  // Get fight history for selected fighter
  const getFightHistory = (fighterId: string) => {
    return matchups
      .filter((m) => m.fighter1 === fighterId || m.fighter2 === fighterId)
      .map((m) => {
        const score = scores.find((s) => s.matchupId === m.id);
        const isRed = m.fighter1 === fighterId;
        const opponentId = isRed ? m.fighter2 : m.fighter1;
        const opponent = fighterMap.get(opponentId);
        const corner = isRed ? "Red" : "Blue";
        const pts = score ? (isRed ? score.redPts : score.bluePts) : 0;

        let result = "Pending";
        if (score) {
          if (score.outcome === "draw") result = "Draw";
          else if (score.outcome === "nc") result = "NC";
          else if (score.winnerId === fighterId) result = "Win";
          else result = "Loss";
        }

        return { matchup: m, score, opponent, corner, result, pts };
      })
      .sort((a, b) => a.matchup.boutNumber - b.matchup.boutNumber);
  };

  // Compute W-L-D for a fighter
  const getRecord = (fighterId: string) => {
    let wins = 0, losses = 0, draws = 0;
    for (const score of scores) {
      if (score.redId !== fighterId && score.blueId !== fighterId) continue;
      if (score.outcome === "draw") draws++;
      else if (score.outcome === "nc") continue;
      else if (score.winnerId === fighterId) wins++;
      else losses++;
    }
    return { wins, losses, draws };
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <CardSkeleton />
        <div className="grid grid-cols-2 gap-3">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-heading font-bold text-foreground">
        Fighter Lookup
      </h1>

      <Input
        placeholder="Search by name or nickname (min 2 chars)..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="text-lg"
      />

      {query.length > 0 && query.length < 2 && (
        <p className="text-sm text-muted">Type at least 2 characters to search.</p>
      )}

      {query.length >= 2 && filtered.length === 0 && (
        <EmptyState title="No Fighters Found" description={`No results for "${query}"`} />
      )}

      {filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((f, i) => {
            const record = getRecord(f.id);
            return (
              <Card
                key={f.id}
                className="cursor-pointer hover:border-gold-500/50 transition-colors stagger-item"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <CardContent
                  className="py-3 px-4"
                  onClick={() => setSelected(f)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gold-500/20 border border-gold-500/30 flex items-center justify-center">
                      <span className="text-sm font-heading font-bold text-gold-400">
                        {f.name.split(" ").map((n) => n[0]).join("")}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-heading font-semibold text-foreground truncate">
                        {f.name}
                        {f.nickname && (
                          <span className="text-muted font-normal">
                            {" "}&quot;{f.nickname}&quot;
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted">{f.gym}</span>
                        <Badge variant="neutral">{f.weightClass}</Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-heading font-bold text-foreground">
                        {record.wins}-{record.losses}-{record.draws}
                      </p>
                      <p className="text-xs text-muted">W-L-D</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Fighter Detail Modal */}
      {selected && (
        <Modal
          open={!!selected}
          onClose={() => setSelected(null)}
          title="Fighter Profile"
        >
          <FighterProfile
            fighter={selected}
            record={getRecord(selected.id)}
            history={getFightHistory(selected.id)}
          />
        </Modal>
      )}
    </div>
  );
}

function FighterProfile({
  fighter,
  record,
  history,
}: {
  fighter: Fighter;
  record: { wins: number; losses: number; draws: number };
  history: {
    matchup: Matchup;
    score: Score | undefined;
    opponent: Fighter | undefined;
    corner: string;
    result: string;
    pts: number;
  }[];
}) {
  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-gold-500/20 border-2 border-gold-500/40 flex items-center justify-center mx-auto mb-3">
          <span className="text-xl font-heading font-bold text-gold-400">
            {fighter.name.split(" ").map((n) => n[0]).join("")}
          </span>
        </div>
        <h3 className="text-xl font-heading font-bold text-foreground">
          {fighter.name}
        </h3>
        {fighter.nickname && (
          <p className="text-sm text-gold-400">&quot;{fighter.nickname}&quot;</p>
        )}
        <p className="text-sm text-muted mt-1">{fighter.gym}</p>
      </div>

      {/* Record */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-dark-700 rounded-lg py-3">
          <p className="text-2xl font-heading font-bold text-green-400">{record.wins}</p>
          <p className="text-xs text-muted">Wins</p>
        </div>
        <div className="bg-dark-700 rounded-lg py-3">
          <p className="text-2xl font-heading font-bold text-red-400">{record.losses}</p>
          <p className="text-xs text-muted">Losses</p>
        </div>
        <div className="bg-dark-700 rounded-lg py-3">
          <p className="text-2xl font-heading font-bold text-muted">{record.draws}</p>
          <p className="text-xs text-muted">Draws</p>
        </div>
      </div>

      {/* Info Grid */}
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div className="bg-dark-700 rounded-lg px-3 py-2">
          <span className="text-muted">Age:</span>{" "}
          <span className="text-foreground">{fighter.age}</span>
        </div>
        <div className="bg-dark-700 rounded-lg px-3 py-2">
          <span className="text-muted">Weight:</span>{" "}
          <span className="text-foreground">{fighter.weight}kg</span>
        </div>
        <div className="bg-dark-700 rounded-lg px-3 py-2">
          <span className="text-muted">Category:</span>{" "}
          <span className="text-foreground">{fighter.ageCat}</span>
        </div>
        <div className="bg-dark-700 rounded-lg px-3 py-2">
          <span className="text-muted">Class:</span>{" "}
          <span className="text-foreground">{fighter.weightClass}</span>
        </div>
        <div className="bg-dark-700 rounded-lg px-3 py-2">
          <span className="text-muted">Gender:</span>{" "}
          <span className="text-foreground">{fighter.gender === "M" ? "Male" : "Female"}</span>
        </div>
        <div className="bg-dark-700 rounded-lg px-3 py-2">
          <span className="text-muted">Prior:</span>{" "}
          <span className="text-foreground">{fighter.priorFights} fights</span>
        </div>
      </div>

      {/* Bout History */}
      {history.length > 0 && (
        <div>
          <h4 className="text-sm font-heading font-semibold text-dark-200 mb-2">
            Bout History
          </h4>
          <div className="space-y-2">
            {history.map((h) => (
              <div
                key={h.matchup.id}
                className="flex items-center justify-between bg-dark-700 rounded-lg px-3 py-2 text-sm"
              >
                <div>
                  <span className="text-muted">vs </span>
                  <span className="text-foreground font-medium">
                    {h.opponent?.name ?? "Unknown"}
                  </span>
                  <span className="text-muted text-xs ml-2">
                    ({h.corner} corner)
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {h.score && (
                    <>
                      {h.score.fotn && <Badge variant="gold">FOTN</Badge>}
                      {h.score.potn && h.score.winnerId === fighter.id && (
                        <Badge variant="gold">POTN</Badge>
                      )}
                    </>
                  )}
                  <Badge
                    variant={
                      h.result === "Win"
                        ? "green"
                        : h.result === "Loss"
                          ? "red"
                          : h.result === "Draw"
                            ? "neutral"
                            : "neutral"
                    }
                  >
                    {h.result}
                  </Badge>
                  {h.score && (
                    <span className="text-xs text-gold-400 font-heading font-bold">
                      {h.pts}pts
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
