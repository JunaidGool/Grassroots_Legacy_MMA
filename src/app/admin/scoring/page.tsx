"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import { Modal } from "@/components/ui/Modal";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { MatchmakingSection } from "./MatchmakingSection";
import { useToast } from "@/hooks/useToast";
import type { Matchup } from "@/types/matchup";
import type { Fighter } from "@/types/fighter";
import type { Score, OutcomeType } from "@/types/score";
import { OUTCOME_LABELS, OUTCOME_POINTS } from "@/types/score";

const OUTCOME_OPTIONS = Object.entries(OUTCOME_LABELS).map(([value, label]) => ({
  value,
  label,
}));

export default function ScoringPage() {
  const [matchups, setMatchups] = useState<Matchup[]>([]);
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoring, setScoring] = useState<Matchup | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // Score form state
  const [outcome, setOutcome] = useState<OutcomeType | "">("");
  const [winnerId, setWinnerId] = useState("");
  const [fotn, setFotn] = useState(false);
  const [potn, setPotn] = useState(false);

  const fetchData = async () => {
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
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fighterMap = new Map(fighters.map((f) => [f.id, f]));
  const scoreMap = new Map(scores.map((s) => [s.matchupId, s]));
  const sorted = [...matchups].sort((a, b) => a.boutNumber - b.boutNumber);

  const openScoring = (m: Matchup) => {
    const existing = scoreMap.get(m.id);
    if (existing) {
      setOutcome(existing.outcome);
      setWinnerId(existing.winnerId);
      setFotn(existing.fotn);
      setPotn(existing.potn);
    } else {
      setOutcome("");
      setWinnerId("");
      setFotn(false);
      setPotn(false);
    }
    setScoring(m);
  };

  const handleSubmitScore = async () => {
    if (!scoring || !outcome) return;

    const needsWinner = outcome !== "draw" && outcome !== "nc";
    if (needsWinner && !winnerId) {
      toast("Select a winner", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/scores", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matchupId: scoring.id,
          outcome,
          winnerId: needsWinner ? winnerId : "",
          fotn,
          potn,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setScores((prev) => {
          const idx = prev.findIndex((s) => s.matchupId === scoring.id);
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = json.data;
            return next;
          }
          return [...prev, json.data];
        });
        toast("Score submitted", "success");
        setScoring(null);
      } else {
        toast(json.error || "Scoring failed", "error");
      }
    } catch {
      toast("Scoring failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // Preview points
  const previewPoints = () => {
    if (!outcome || !scoring) return null;
    const pts = OUTCOME_POINTS[outcome as OutcomeType];
    if (!pts) return null;

    let redPts: number, bluePts: number;
    if (outcome === "draw" || outcome === "nc") {
      redPts = pts.winner;
      bluePts = pts.loser;
    } else {
      redPts = winnerId === scoring.fighter1 ? pts.winner : pts.loser;
      bluePts = winnerId === scoring.fighter2 ? pts.winner : pts.loser;
    }
    if (fotn) { redPts += 1; bluePts += 1; }
    if (potn && winnerId) {
      if (winnerId === scoring.fighter1) redPts += 2;
      if (winnerId === scoring.fighter2) bluePts += 2;
    }
    return { redPts, bluePts };
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-heading font-bold text-foreground">
        Scoring & Matchmaking
      </h1>

      {/* Matchmaking Section */}
      <MatchmakingSection
        fighters={fighters}
        matchups={matchups}
        onMatchupsChange={fetchData}
      />

      {/* Scoring Section */}
      {sorted.length === 0 ? (
        <EmptyState
          title="No Bouts"
          description="Create matchups first to start scoring."
        />
      ) : (
        <div className="space-y-2">
          {sorted.map((m, i) => {
            const red = fighterMap.get(m.fighter1);
            const blue = fighterMap.get(m.fighter2);
            const score = scoreMap.get(m.id);

            return (
              <Card
                key={m.id}
                gold={!!score}
                className="stagger-item"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <CardContent className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-heading font-bold text-muted w-6">
                        #{m.boutNumber}
                      </span>
                      <div>
                        <div className="text-sm">
                          <span className="text-red-400 font-medium">
                            {red?.name ?? "TBD"}
                          </span>
                          <span className="text-muted mx-2">vs</span>
                          <span className="text-blue-400 font-medium">
                            {blue?.name ?? "TBD"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Badge variant="neutral">{m.weightClass}</Badge>
                          {score && (
                            <>
                              <Badge variant="gold">
                                {OUTCOME_LABELS[score.outcome]}
                              </Badge>
                              <span className="text-xs text-muted">
                                {score.redPts}-{score.bluePts}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button
                      variant={score ? "ghost" : "primary"}
                      size="sm"
                      className="h-10"
                      onClick={() => openScoring(m)}
                    >
                      {score ? "Edit" : "Score"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* How Scoring & Rankings Work */}
      <Card>
        <CardContent className="py-5 px-5 space-y-5">
          <h2 className="text-lg font-heading font-bold text-foreground uppercase tracking-wider">
            How Scoring & Rankings Work
          </h2>

          {/* Points Table */}
          <div>
            <h3 className="text-sm font-heading font-semibold text-dark-200 uppercase tracking-wider mb-2">
              Points per Bout
            </h3>
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-dark-700">
                    <th className="text-left py-2 px-3 text-dark-200 font-heading font-semibold text-xs uppercase tracking-wider">Outcome</th>
                    <th className="text-center py-2 px-3 text-dark-200 font-heading font-semibold text-xs uppercase tracking-wider">Winner</th>
                    <th className="text-center py-2 px-3 text-dark-200 font-heading font-semibold text-xs uppercase tracking-wider">Loser</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  <tr className="hover:bg-dark-700/40">
                    <td className="py-2 px-3 text-foreground">Submission</td>
                    <td className="py-2 px-3 text-center text-gold-400 font-bold">5</td>
                    <td className="py-2 px-3 text-center text-muted">1</td>
                  </tr>
                  <tr className="hover:bg-dark-700/40">
                    <td className="py-2 px-3 text-foreground">TKO / KO</td>
                    <td className="py-2 px-3 text-center text-gold-400 font-bold">4</td>
                    <td className="py-2 px-3 text-center text-muted">1</td>
                  </tr>
                  <tr className="hover:bg-dark-700/40">
                    <td className="py-2 px-3 text-foreground">Unanimous Decision</td>
                    <td className="py-2 px-3 text-center text-gold-400 font-bold">3</td>
                    <td className="py-2 px-3 text-center text-muted">1</td>
                  </tr>
                  <tr className="hover:bg-dark-700/40">
                    <td className="py-2 px-3 text-foreground">Split Decision</td>
                    <td className="py-2 px-3 text-center text-gold-400 font-bold">2</td>
                    <td className="py-2 px-3 text-center text-muted">1</td>
                  </tr>
                  <tr className="hover:bg-dark-700/40">
                    <td className="py-2 px-3 text-foreground">Draw</td>
                    <td className="py-2 px-3 text-center text-muted" colSpan={2}>2 each</td>
                  </tr>
                  <tr className="hover:bg-dark-700/40">
                    <td className="py-2 px-3 text-foreground">No Contest</td>
                    <td className="py-2 px-3 text-center text-muted" colSpan={2}>0 each</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted mt-2">
              Every fighter who competes earns at least 1 point, even in a loss. Finishes (SUB, TKO) are rewarded more than decisions.
            </p>
          </div>

          {/* Bonuses */}
          <div>
            <h3 className="text-sm font-heading font-semibold text-dark-200 uppercase tracking-wider mb-2">
              Bonus Awards
            </h3>
            <div className="space-y-2">
              <div className="flex items-start gap-3 bg-dark-700/40 rounded-lg p-3">
                <span className="text-gold-400 font-bold text-lg leading-none mt-0.5">+1</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Fight of the Night</p>
                  <p className="text-xs text-muted">Both fighters receive +1 bonus point. Awarded to the most exciting bout on the card.</p>
                </div>
              </div>
              <div className="flex items-start gap-3 bg-dark-700/40 rounded-lg p-3">
                <span className="text-gold-400 font-bold text-lg leading-none mt-0.5">+2</span>
                <div>
                  <p className="text-sm font-semibold text-foreground">Performance of the Night</p>
                  <p className="text-xs text-muted">The winner receives +2 bonus points. Awarded for a standout individual performance.</p>
                </div>
              </div>
            </div>
            <p className="text-xs text-muted mt-2">
              A single bout can receive both awards. Maximum possible points in one fight: 5 (SUB) + 1 (FOTN) + 2 (POTN) = <strong className="text-gold-400">8 points</strong>.
            </p>
          </div>

          {/* Rankings */}
          <div>
            <h3 className="text-sm font-heading font-semibold text-dark-200 uppercase tracking-wider mb-2">
              How Rankings Are Determined
            </h3>
            <p className="text-sm text-muted mb-2">
              Fighters are ranked within their division (age category + weight class + gender) using these tiebreakers in order:
            </p>
            <ol className="list-decimal list-inside text-sm text-muted space-y-1 pl-1">
              <li><strong className="text-foreground">Total points</strong> — accumulated across all scored bouts</li>
              <li><strong className="text-foreground">Average points per bout</strong> — rewards consistency at any number of fights</li>
              <li><strong className="text-foreground">Number of finishes</strong> — wins by Submission or TKO/KO</li>
              <li><strong className="text-foreground">Prior fight experience</strong> — fighters with more amateur experience rank higher</li>
            </ol>
          </div>

          {/* Title Eligibility */}
          <div>
            <h3 className="text-sm font-heading font-semibold text-dark-200 uppercase tracking-wider mb-2">
              Title Eligibility
            </h3>
            <p className="text-sm text-muted">
              A fighter becomes <span className="text-gold-400 font-semibold">Title Eligible</span> when they meet <strong className="text-foreground">both</strong> conditions:
            </p>
            <ul className="list-disc list-inside text-sm text-muted space-y-1 mt-1 pl-1">
              <li>Competed in <strong className="text-foreground">2 or more</strong> scored bouts</li>
              <li>Ranked in the <strong className="text-foreground">top 2</strong> of their division</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Score Modal */}
      {scoring && (
        <Modal
          open={!!scoring}
          onClose={() => setScoring(null)}
          title={`Score Bout #${scoring.boutNumber}`}
        >
          <div className="space-y-4">
            <div className="text-center text-sm mb-2">
              <span className="text-red-400 font-medium">
                {fighterMap.get(scoring.fighter1)?.name}
              </span>
              <span className="text-muted mx-2">vs</span>
              <span className="text-blue-400 font-medium">
                {fighterMap.get(scoring.fighter2)?.name}
              </span>
            </div>

            <Select
              label="Outcome *"
              options={OUTCOME_OPTIONS}
              placeholder="Select outcome"
              value={outcome}
              onChange={(e) => {
                setOutcome(e.target.value as OutcomeType);
                if (e.target.value === "draw" || e.target.value === "nc") {
                  setWinnerId("");
                }
              }}
            />

            {outcome && outcome !== "draw" && outcome !== "nc" && (
              <Select
                label="Winner *"
                options={[
                  {
                    value: scoring.fighter1,
                    label: `${fighterMap.get(scoring.fighter1)?.name} (Red)`,
                  },
                  {
                    value: scoring.fighter2,
                    label: `${fighterMap.get(scoring.fighter2)?.name} (Blue)`,
                  },
                ]}
                placeholder="Select winner"
                value={winnerId}
                onChange={(e) => setWinnerId(e.target.value)}
              />
            )}

            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={fotn}
                  onChange={(e) => setFotn(e.target.checked)}
                  className="w-5 h-5 rounded bg-dark-700 border-border text-gold-500 focus:ring-gold-500"
                />
                <span className="text-sm text-foreground">
                  Fight of the Night (+1 both)
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={potn}
                  onChange={(e) => setPotn(e.target.checked)}
                  className="w-5 h-5 rounded bg-dark-700 border-border text-gold-500 focus:ring-gold-500"
                />
                <span className="text-sm text-foreground">
                  Performance of the Night (+2 winner)
                </span>
              </label>
            </div>

            {/* Points Preview */}
            {outcome && (
              <div className="bg-dark-700 rounded-lg p-3">
                <p className="text-xs text-muted mb-2 uppercase tracking-wider">
                  Points Preview
                </p>
                <div className="flex items-center justify-center gap-6 text-lg font-heading font-bold">
                  <span className="text-red-400">
                    {previewPoints()?.redPts ?? 0} pts
                  </span>
                  <span className="text-muted">-</span>
                  <span className="text-blue-400">
                    {previewPoints()?.bluePts ?? 0} pts
                  </span>
                </div>
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleSubmitScore}
              loading={submitting}
              disabled={!outcome}
            >
              Submit Score
            </Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
