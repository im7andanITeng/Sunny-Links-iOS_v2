import { useEffect, useState } from "react";
import GolfGame from "./GolfGame";
import menuBg from "@/assets/menu-bg.jpg";
import { fetchLeaderboard, loadPlayer, savePlayer, type Player } from "@/game/player";

type Screen = "menu" | "play" | "board" | "profile";

export default function GolfApp() {
  const [screen, setScreen] = useState<Screen>("menu");
  const [player, setPlayer] = useState<Player | null>(null);

  useEffect(() => { const p = loadPlayer(); setPlayer(p); void savePlayer(p); }, []);

  const onLevelComplete = (n: number) => {
    setPlayer((p) => {
      if (!p || n <= p.levels_passed) return p;
      const np = { ...p, levels_passed: n };
      void savePlayer(np);
      return np;
    });
  };

  if (screen === "play") return <GolfGame onLevelComplete={onLevelComplete} onMenu={() => setScreen("menu")} />;

  return (
    <div className="menu-root" style={{ backgroundImage: `url(${menuBg})` }}>
      {screen === "menu" && (
        <div className="menu-card">
          <h1 className="menu-title">Sunny Links</h1>
          <p className="menu-sub">Mini Golf</p>
          {player && <p className="menu-hello">Hi, {player.name}{player.tag && <span className="menu-tag">{player.tag}</span>}</p>}
          <button className="menu-btn menu-btn-play" onClick={() => setScreen("play")}>Play</button>
          <button className="menu-btn" onClick={() => setScreen("board")}>Leaderboard</button>
          <button className="menu-btn" onClick={() => setScreen("profile")}>Profile</button>
        </div>
      )}
      {screen === "board" && <Leaderboard me={player?.id} onBack={() => setScreen("menu")} />}
      {screen === "profile" && player && (
        <Profile player={player} onSave={(p) => { setPlayer(p); void savePlayer(p); setScreen("menu"); }} onBack={() => setScreen("menu")} />
      )}
    </div>
  );
}

function Leaderboard({ me, onBack }: { me: string | undefined; onBack: () => void }) {
  const [rows, setRows] = useState<Player[] | null>(null);
  useEffect(() => { fetchLeaderboard().then(setRows); }, []);
  return (
    <div className="menu-card menu-wide">
      <h2 className="menu-h2">Leaderboard</h2>
      <p className="menu-sub">Levels passed</p>
      {!rows ? <p>Loading…</p> : rows.length === 0 ? <p>No players yet.</p> : (
        <table className="golf-table">
          <thead><tr><th>#</th><th>Player</th><th>Levels</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} className={r.id === me ? "menu-me" : ""}>
                <td>{i + 1}</td>
                <td>{r.name}{r.tag && <span className="menu-tag">{r.tag}</span>}</td>
                <td>{r.levels_passed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <button className="menu-btn" onClick={onBack}>← Back</button>
    </div>
  );
}

function Profile({ player, onSave, onBack }: { player: Player; onSave: (p: Player) => void; onBack: () => void }) {
  const [name, setName] = useState(player.name);
  const [tag, setTag] = useState(player.tag);
  return (
    <div className="menu-card">
      <h2 className="menu-h2">Profile</h2>
      <label className="menu-field">Name
        <input aria-label="Name" maxLength={24} value={name} onChange={(e) => setName(e.target.value)} />
      </label>
      <label className="menu-field">Name tag
        <input aria-label="Name tag" maxLength={24} value={tag} placeholder="Anything you like" onChange={(e) => setTag(e.target.value)} />
      </label>
      <p className="menu-sub">Levels passed: {player.levels_passed}</p>
      <button className="menu-btn menu-btn-play" onClick={() => onSave({ ...player, name: name.trim() || "Golfer", tag: tag.trim() })}>Save</button>
      <button className="menu-btn" onClick={onBack}>← Back</button>
    </div>
  );
}
