"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { useAuth } from "@/hooks/useAuth";
import type { DashboardStats } from "@/types/api";
import type { EventConfig } from "@/types/config";
import type { Matchup } from "@/types/matchup";
import type { Fighter } from "@/types/fighter";
import type { Score } from "@/types/score";
import { OUTCOME_LABELS } from "@/types/score";
import Image from "next/image";
import Link from "next/link";

interface DashboardData {
  stats: DashboardStats;
  config: Omit<EventConfig, "ADMIN_PIN">;
  matchups: Matchup[];
  fighters: Fighter[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [scores, setScores] = useState<Score[]>([]);
  const [loading, setLoading] = useState(true);
  const { isAdmin } = useAuth();

  useEffect(() => {
    async function fetchData() {
      try {
        const [dashRes, scoresRes] = await Promise.all([
          fetch("/api/dashboard"),
          fetch("/api/scores"),
        ]);
        const dashJson = await dashRes.json();
        const scoresJson = await scoresRes.json();
        if (dashJson.success) setData(dashJson.data);
        if (scoresJson.success) setScores(scoresJson.data);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <div className="grid grid-cols-2 gap-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { stats, config, matchups, fighters } = data;
  const fighterMap = new Map(fighters.map((f) => [f.id, f]));
  const scoreMap = new Map(scores.map((s) => [s.matchupId, s]));

  const statCards = [
    { label: "Fighters", value: stats.totalFighters, color: "text-gold-400" },
    { label: "Weighed In", value: stats.weighedIn, color: "text-green-400" },
    { label: "Bouts", value: stats.totalBouts, color: "text-blue-400" },
    { label: "Scored", value: stats.scored, color: "text-purple-400" },
  ];

  return (
    <div className="space-y-6">
      {/* Event Header */}
      <div className="text-center space-y-3">
        <Image
          src="/logo/grass_roots_logo.jpeg"
          alt="Grassroots Legacy MMA"
          width={120}
          height={120}
          className="rounded-full ring-2 ring-gold-500/50 mx-auto shadow-lg shadow-gold-500/10"
          priority
        />
        <h1 className="text-3xl sm:text-4xl font-heading font-bold gold-gradient-text">
          {config.EVENT_NAME}
        </h1>
        <div className="flex items-center justify-center gap-3 text-sm text-muted">
          <span>{config.EVENT_DATE}</span>
          <span className="text-dark-400">|</span>
          <span>{config.EVENT_LOCATION}</span>
        </div>
      </div>

      {/* Video Embed */}
      {config.YT_URL ? (
        <div className="aspect-video rounded-xl overflow-hidden bg-dark-800">
          <iframe
            src={config.YT_URL}
            className="w-full h-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        <Card className="aspect-video flex items-center justify-center">
          <div className="text-center text-muted">
            <svg className="w-12 h-12 mx-auto mb-2 opacity-30" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7z" />
            </svg>
            <p className="text-sm">Promo video coming soon</p>
          </div>
        </Card>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {statCards.map((stat, i) => (
          <Card key={stat.label} className="stagger-item" style={{ animationDelay: `${i * 80}ms` }}>
            <CardContent className="text-center py-4">
              <p className={`text-3xl font-heading font-bold ${stat.color}`}>
                {stat.value}
              </p>
              <p className="text-xs text-muted mt-1 uppercase tracking-wider">
                {stat.label}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Fight Card Preview */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-heading font-semibold text-foreground">
            Fight Card
          </h2>
          <Link
            href="/fight-card"
            className="text-sm text-gold-400 hover:text-gold-300 transition-colors"
          >
            View Full Card
          </Link>
        </div>

        {matchups.length === 0 ? (
          <Card>
            <CardContent>
              <p className="text-sm text-muted text-center">No bouts yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {matchups
              .sort((a, b) => a.boutNumber - b.boutNumber)
              .map((m, i) => {
                const red = fighterMap.get(m.fighter1);
                const blue = fighterMap.get(m.fighter2);
                const score = scoreMap.get(m.id);

                return (
                  <Card
                    key={m.id}
                    className="stagger-item"
                    style={{ animationDelay: `${i * 60}ms` }}
                  >
                    <CardContent className="py-3 px-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-heading font-bold text-muted w-6">
                            #{m.boutNumber}
                          </span>
                          <div className="text-sm">
                            <span className="text-red-400 font-medium">
                              {red?.name ?? "TBD"}
                            </span>
                            <span className="text-muted mx-2">vs</span>
                            <span className="text-blue-400 font-medium">
                              {blue?.name ?? "TBD"}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="neutral">
                            {m.weightClass}
                          </Badge>
                          {score ? (
                            <Badge variant="gold">
                              {OUTCOME_LABELS[score.outcome]}
                            </Badge>
                          ) : (
                            <Badge variant="neutral">Pending</Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
          </div>
        )}
      </div>

      {/* Admin Login Prompt */}
      {!isAdmin && (
        <Card className="border-dashed">
          <CardContent className="text-center py-6">
            <p className="text-sm text-muted mb-3">
              Event admin? Log in to manage fighters, matchups, and scoring.
            </p>
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg gold-gradient text-dark-900 font-medium text-sm hover:brightness-110 transition-all"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0110 0v4" />
              </svg>
              Admin Login
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
