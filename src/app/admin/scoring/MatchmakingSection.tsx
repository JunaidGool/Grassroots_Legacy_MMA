"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/hooks/useToast";
import type { Fighter } from "@/types/fighter";
import type { Matchup } from "@/types/matchup";

interface MatchmakingSectionProps {
  fighters: Fighter[];
  matchups: Matchup[];
  onMatchupsChange: () => void;
}

export function MatchmakingSection({
  fighters,
  matchups,
  onMatchupsChange,
}: MatchmakingSectionProps) {
  const [redCorner, setRedCorner] = useState("");
  const [blueCorner, setBlueCorner] = useState("");
  const [autoLoading, setAutoLoading] = useState(false);
  const [manualLoading, setManualLoading] = useState(false);
  const { toast } = useToast();

  // Get matched fighter IDs
  const matchedIds = new Set<string>();
  for (const m of matchups) {
    matchedIds.add(m.fighter1);
    matchedIds.add(m.fighter2);
  }

  // Eligible fighters for matchmaking
  const eligible = fighters.filter(
    (f) => f.medical === "cleared" && !matchedIds.has(f.id)
  );

  const redFighter = fighters.find((f) => f.id === redCorner);

  // Blue corner options: same division as red corner
  const blueOptions = redFighter
    ? eligible
        .filter(
          (f) =>
            f.id !== redCorner &&
            f.gender === redFighter.gender &&
            f.ageCat === redFighter.ageCat &&
            f.weightClass === redFighter.weightClass
        )
        .map((f) => ({ value: f.id, label: `${f.name} (${f.gym})` }))
    : [];

  const handleAutoMatch = async () => {
    setAutoLoading(true);
    try {
      const res = await fetch("/api/matchups/auto", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        toast(`${json.data.count} matchup(s) created`, "success");
        onMatchupsChange();
      } else {
        toast(json.error || "Auto-match failed", "error");
      }
    } catch {
      toast("Auto-match failed", "error");
    } finally {
      setAutoLoading(false);
    }
  };

  const handleManualMatch = async () => {
    if (!redCorner || !blueCorner || !redFighter) return;

    setManualLoading(true);
    try {
      const nextBout = matchups.length > 0
        ? Math.max(...matchups.map((m) => m.boutNumber)) + 1
        : 1;

      const res = await fetch("/api/matchups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fighter1: redCorner,
          fighter2: blueCorner,
          ageCat: redFighter.ageCat,
          weightClass: redFighter.weightClass,
          gender: redFighter.gender,
          boutNumber: nextBout,
        }),
      });

      const json = await res.json();
      if (json.success) {
        toast("Matchup created", "success");
        setRedCorner("");
        setBlueCorner("");
        onMatchupsChange();
      } else {
        toast(json.error || "Failed to create matchup", "error");
      }
    } catch {
      toast("Failed to create matchup", "error");
    } finally {
      setManualLoading(false);
    }
  };

  const handleReorder = async (matchupId: string, direction: "up" | "down") => {
    const orderedMatchups = [...matchups].sort((a, b) => a.boutNumber - b.boutNumber);
    const idx = orderedMatchups.findIndex((m) => m.id === matchupId);
    if (idx < 0) return;

    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= orderedMatchups.length) return;

    const newOrder = orderedMatchups.map((m) => m.id);
    [newOrder[idx], newOrder[swapIdx]] = [newOrder[swapIdx], newOrder[idx]];

    try {
      await fetch("/api/matchups/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: newOrder }),
      });
      onMatchupsChange();
    } catch {
      toast("Reorder failed", "error");
    }
  };

  const handleDeleteMatchup = async (matchupId: string) => {
    if (!confirm("Remove this matchup?")) return;
    try {
      const res = await fetch(`/api/matchups/${matchupId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        toast("Matchup removed", "success");
        onMatchupsChange();
      }
    } catch {
      toast("Failed to remove matchup", "error");
    }
  };

  const fighterMap = new Map(fighters.map((f) => [f.id, f]));
  const sortedMatchups = [...matchups].sort((a, b) => a.boutNumber - b.boutNumber);

  return (
    <div className="space-y-4">
      {/* Auto Match */}
      <Card>
        <CardHeader>
          <h2 className="text-sm font-heading font-semibold text-dark-200 uppercase tracking-wider">
            Matchmaking
          </h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">
              {eligible.length} unmatched cleared fighter(s)
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleAutoMatch}
              loading={autoLoading}
              disabled={eligible.length < 2}
            >
              Auto Match
            </Button>
          </div>

          {/* Manual Match */}
          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted mb-3 uppercase tracking-wider">
              Manual Match
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Red Corner"
                options={eligible.map((f) => ({
                  value: f.id,
                  label: `${f.name} (${f.weightClass})`,
                }))}
                placeholder="Select fighter"
                value={redCorner}
                onChange={(e) => {
                  setRedCorner(e.target.value);
                  setBlueCorner("");
                }}
              />
              <Select
                label="Blue Corner"
                options={blueOptions}
                placeholder={redCorner ? "Select opponent" : "Select red first"}
                value={blueCorner}
                onChange={(e) => setBlueCorner(e.target.value)}
                disabled={!redCorner}
              />
            </div>
            <Button
              className="w-full mt-3"
              size="sm"
              onClick={handleManualMatch}
              loading={manualLoading}
              disabled={!redCorner || !blueCorner}
            >
              Create Matchup
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Fight Card Order */}
      {sortedMatchups.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="text-sm font-heading font-semibold text-dark-200 uppercase tracking-wider">
              Fight Card Order
            </h2>
          </CardHeader>
          <CardContent className="space-y-1">
            {sortedMatchups.map((m, idx) => {
              const red = fighterMap.get(m.fighter1);
              const blue = fighterMap.get(m.fighter2);

              return (
                <div
                  key={m.id}
                  className="flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-dark-700/50"
                >
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => handleReorder(m.id, "up")}
                      disabled={idx === 0}
                      className="text-xs text-muted hover:text-foreground disabled:opacity-30 leading-none"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => handleReorder(m.id, "down")}
                      disabled={idx === sortedMatchups.length - 1}
                      className="text-xs text-muted hover:text-foreground disabled:opacity-30 leading-none"
                    >
                      ▼
                    </button>
                  </div>

                  <span className="text-xs font-heading font-bold text-muted w-6">
                    #{m.boutNumber}
                  </span>

                  <div className="flex-1 text-sm">
                    <span className="text-red-400">{red?.name ?? "?"}</span>
                    <span className="text-muted mx-1">vs</span>
                    <span className="text-blue-400">{blue?.name ?? "?"}</span>
                  </div>

                  <Badge variant="neutral">{m.weightClass}</Badge>

                  <button
                    onClick={() => handleDeleteMatchup(m.id)}
                    className="text-xs text-danger hover:text-red-300 ml-2"
                    title="Remove matchup"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
