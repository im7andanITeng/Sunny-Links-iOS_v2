import { supabase } from "@/integrations/supabase/client";

export type Player = { id: string; name: string; tag: string; levels_passed: number };

const KEY = "sunny-links-player";

export function loadPlayer(): Player {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Player;
  } catch { /* ignore */ }
  const p: Player = { id: crypto.randomUUID(), name: "Golfer", tag: "", levels_passed: 0 };
  localStorage.setItem(KEY, JSON.stringify(p));
  return p;
}

export async function savePlayer(p: Player) {
  localStorage.setItem(KEY, JSON.stringify(p));
  await supabase.from("players").upsert({
    id: p.id, name: p.name.trim() || "Golfer", tag: p.tag.trim(), levels_passed: p.levels_passed,
    updated_at: new Date().toISOString(),
  });
}

export async function fetchLeaderboard(): Promise<Player[]> {
  const { data } = await supabase
    .from("players").select("id,name,tag,levels_passed")
    .order("levels_passed", { ascending: false }).order("updated_at", { ascending: true }).limit(50);
  return data ?? [];
}
