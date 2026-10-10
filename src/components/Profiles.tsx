"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AVATARS, MAX_CHILDREN, type Avatar } from "@/lib/profiles";
import { GRADES, type Grade } from "@/lib/questions";
import { useProgress, type Profile } from "./Progress";

/** The current child's avatar in the header; opens a menu to switch child. */
export function ProfileSwitcher() {
  const { profiles, active, switchProfile, ready } = useProgress();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === "Escape" : !box.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  if (!ready) return null;
  return (
    <div className="who" ref={box}>
      <button className="who-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu" aria-label={`Practicing as ${active.name}. Switch child`}>
        <span className="who-av" aria-hidden="true">{active.avatar}</span>
        <span className="who-name">{active.name}</span>
      </button>
      {open && (
        <div className="who-menu" role="menu">
          <p className="eyebrow">Who’s practicing?</p>
          {profiles.map((p) => (
            <button
              key={p.id}
              role="menuitemradio"
              aria-checked={p.id === active.id}
              className={p.id === active.id ? "who-item on" : "who-item"}
              onClick={() => {
                switchProfile(p.id);
                setOpen(false);
              }}
            >
              <span className="who-av" aria-hidden="true">{p.avatar}</span>
              <span>
                <b>{p.name}</b>
                <small>Grade {p.progress.grade}</small>
              </span>
            </button>
          ))}
          <Link className="who-manage" href="/parents#children" role="menuitem" onClick={() => setOpen(false)}>
            {profiles.length < MAX_CHILDREN ? "Add or edit children" : "Edit children"}
          </Link>
        </div>
      )}
    </div>
  );
}

/** Full-screen "Who's practicing?" picker, shown once per visit when several children share the device. */
export function WhoIsPracticing() {
  const { needsPick, profiles, switchProfile } = useProgress();
  if (!needsPick) return null;
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="who-title">
      <div className="panel who-pick">
        <h2 id="who-title" className="center">Who’s practicing?</h2>
        <div className="who-grid">
          {profiles.map((p) => (
            <button key={p.id} className="who-card" onClick={() => switchProfile(p.id)}>
              <span className="who-av big" aria-hidden="true">{p.avatar}</span>
              <b>{p.name}</b>
              <small>Grade {p.progress.grade}</small>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** A grown-up check before managing children: a times-table fact young children can't answer yet. */
export function ParentGate({ children, intro }: { children: ReactNode; intro: string }) {
  const [q, setQ] = useState<[number, number] | null>(null);
  const [answer, setAnswer] = useState("");
  const [open, setOpen] = useState(false);
  const [wrong, setWrong] = useState(false);

  if (open) return <>{children}</>;
  const ask = () => {
    setQ([6 + Math.floor(Math.random() * 4), 6 + Math.floor(Math.random() * 4)]);
    setAnswer("");
    setWrong(false);
  };
  if (!q) {
    return (
      <div className="stack" style={{ gap: 8 }}>
        <p className="muted">{intro}</p>
        <button className="btn ghost self-start" onClick={ask}>I’m a grown-up</button>
      </div>
    );
  }
  return (
    <form
      className="gate"
      onSubmit={(e) => {
        e.preventDefault();
        if (Number(answer) === q[0] * q[1]) setOpen(true);
        else {
          ask();
          setWrong(true);
        }
      }}
    >
      <label htmlFor="gate-a">Grown-ups only: what is {q[0]} × {q[1]}?</label>
      <div className="gate-row">
        <input id="gate-a" type="text" inputMode="numeric" autoComplete="off" value={answer} onChange={(e) => setAnswer(e.target.value)} autoFocus />
        <button className="btn" type="submit">Continue</button>
      </div>
      {wrong && <p className="notice bad">Not quite. Here is another one.</p>}
    </form>
  );
}

/** Add, rename or remove children. Lives on the Parents page behind the grown-up check. */
export function ManageChildren() {
  const { profiles, addProfile, updateProfile, removeProfile, switchProfile } = useProgress();
  const [name, setName] = useState("");
  // Default to an avatar no sibling has yet, so children can tell their profiles apart.
  const [picked, setAvatar] = useState<Avatar | null>(null);
  const avatar = picked ?? AVATARS.find((a) => !profiles.some((p) => p.avatar === a)) ?? AVATARS[0];
  const [grade, setGrade] = useState<Grade>(3);
  const full = profiles.length >= MAX_CHILDREN;

  return (
    <div className="stack" style={{ gap: 16 }}>
      <ul className="kids">
        {profiles.map((p) => (
          <ChildRow key={p.id} p={p} canRemove={profiles.length > 1} onSave={updateProfile} onRemove={removeProfile} />
        ))}
      </ul>
      {full ? (
        <p className="muted small">You can add up to {MAX_CHILDREN} children.</p>
      ) : (
        <form
          className="addkid"
          onSubmit={(e) => {
            e.preventDefault();
            const id = addProfile(name, avatar, grade);
            if (id) {
              setName("");
              setAvatar(null);
              switchProfile(id);
            }
          }}
        >
          <h3>Add a child</h3>
          <label htmlFor="kid-name">First name or nickname</label>
          <input id="kid-name" type="text" maxLength={20} value={name} onChange={(e) => setName(e.target.value)} autoComplete="off" />
          <AvatarPick value={avatar} onChange={setAvatar} />
          <label htmlFor="kid-grade">Grade</label>
          <select id="kid-grade" value={grade} onChange={(e) => setGrade(Number(e.target.value) as Grade)}>
            {GRADES.map((g) => <option key={g} value={g}>Grade {g}</option>)}
          </select>
          <button className="btn self-start" type="submit" disabled={!name.trim()}>Add child</button>
        </form>
      )}
    </div>
  );
}

function ChildRow({ p, canRemove, onSave, onRemove }: {
  p: Profile;
  canRemove: boolean;
  onSave: (id: string, change: { name?: string; avatar?: Avatar }) => void;
  onRemove: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(p.name);
  const [avatar, setAvatar] = useState<Avatar>(p.avatar);
  if (!editing) {
    return (
      <li className="kid">
        <span className="who-av" aria-hidden="true">{p.avatar}</span>
        <span className="kid-name"><b>{p.name}</b><small>Grade {p.progress.grade}</small></span>
        <button className="linkbtn" onClick={() => setEditing(true)}>Edit</button>
        {canRemove && (
          <button
            className="linkbtn bad"
            onClick={() => window.confirm(`Delete ${p.name}'s profile and all their progress? This can't be undone.`) && onRemove(p.id)}
          >
            Delete
          </button>
        )}
      </li>
    );
  }
  return (
    <li className="kid editing">
      <form
        className="addkid"
        onSubmit={(e) => {
          e.preventDefault();
          onSave(p.id, { name, avatar });
          setEditing(false);
        }}
      >
        <label htmlFor={`n-${p.id}`}>Name</label>
        <input id={`n-${p.id}`} type="text" maxLength={20} value={name} onChange={(e) => setName(e.target.value)} />
        <AvatarPick value={avatar} onChange={setAvatar} />
        <div className="gate-row">
          <button className="btn" type="submit" disabled={!name.trim()}>Save</button>
          <button className="btn ghost" type="button" onClick={() => setEditing(false)}>Cancel</button>
        </div>
      </form>
    </li>
  );
}

function AvatarPick({ value, onChange }: { value: Avatar; onChange: (a: Avatar) => void }) {
  return (
    <fieldset className="avpick">
      <legend>Avatar</legend>
      {AVATARS.map((a) => (
        <button key={a} type="button" className={a === value ? "on" : undefined} aria-pressed={a === value} onClick={() => onChange(a)}>
          {a}
        </button>
      ))}
    </fieldset>
  );
}
