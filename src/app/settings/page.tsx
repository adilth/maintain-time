"use client";

import { useEffect, useState } from "react";
import { Profile } from "@/types";
import { loadProfile, saveProfile } from "@/lib/profile";

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile>({ hobbies: [], interests: [], languages: [], youtubers: [] });
  const [newHobby, setNewHobby] = useState("");
  const [newInterest, setNewInterest] = useState("");
  const [newLanguage, setNewLanguage] = useState("");
  const [newYTName, setNewYTName] = useState("");
  const [newYTUrl, setNewYTUrl] = useState("");

  useEffect(() => {
    loadProfile().then(setProfile);
  }, []);

  useEffect(() => {
    if (profile) saveProfile(profile);
  }, [profile]);

  return (
    <div className="p-4 md:p-6 max-w-3xl">
      <h1 className="text-2xl font-semibold mb-4">Settings</h1>
      <div className="grid gap-6">
        <section className="grid gap-2">
          <label className="text-sm text-foreground/70">Name</label>
          <input
            className="border rounded-md px-3 py-2 bg-background"
            value={profile.name ?? ""}
            onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            placeholder="Your name"
          />
        </section>

        <section className="grid gap-2">
          <label className="text-sm text-foreground/70">Work & lifestyle context</label>
          <textarea
            className="border rounded-md px-3 py-2 bg-background min-h-24"
            value={profile.workContext ?? ""}
            onChange={(e) => setProfile({ ...profile, workContext: e.target.value })}
            placeholder="e.g., Full-time developer, remote, gym evenings, learning Rust"
          />
        </section>

        <TagEditor
          label="Hobbies"
          items={profile.hobbies}
          newItem={newHobby}
          setNewItem={setNewHobby}
          onAdd={() => addItem("hobbies", newHobby, profile, setProfile, setNewHobby)}
          onRemove={(i) => removeItem("hobbies", i, profile, setProfile)}
        />

        <TagEditor
          label="Interests"
          items={profile.interests}
          newItem={newInterest}
          setNewItem={setNewInterest}
          onAdd={() => addItem("interests", newInterest, profile, setProfile, setNewInterest)}
          onRemove={(i) => removeItem("interests", i, profile, setProfile)}
        />

        <TagEditor
          label="Programming languages"
          items={profile.languages}
          newItem={newLanguage}
          setNewItem={setNewLanguage}
          onAdd={() => addItem("languages", newLanguage, profile, setProfile, setNewLanguage)}
          onRemove={(i) => removeItem("languages", i, profile, setProfile)}
        />
      </div>
      <section className="grid gap-2 mt-6">
        <label className="text-sm text-foreground/70">YouTubers (name + channel URL)</label>
        <div className="flex gap-2">
          <input
            className="flex-1 border rounded-md px-3 py-2 bg-background"
            value={newYTName}
            onChange={(e) => setNewYTName(e.target.value)}
            placeholder="Channel name"
          />
          <input
            className="flex-1 border rounded-md px-3 py-2 bg-background"
            value={newYTUrl}
            onChange={(e) => setNewYTUrl(e.target.value)}
            placeholder="https://youtube.com/@channel"
          />
          <button
            className="px-3 py-2 rounded-md bg-foreground text-background"
            onClick={() => {
              const name = newYTName.trim();
              const url = newYTUrl.trim();
              if (!name || !url) return;
              const youtubers = [...(profile.youtubers ?? [])];
              youtubers.push({ name, channelUrl: url });
              setProfile({ ...profile, youtubers });
              setNewYTName("");
              setNewYTUrl("");
            }}
          >
            Add
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {(profile.youtubers ?? []).map((yt, idx) => (
            <div key={idx} className="flex items-center justify-between border rounded-md px-3 py-2">
              <div className="min-w-0">
                <div className="font-medium truncate">{yt.name}</div>
                <a href={yt.channelUrl} className="text-sm text-foreground/60 truncate" target="_blank" rel="noreferrer">
                  {yt.channelUrl}
                </a>
              </div>
              <button
                className="text-sm text-foreground/60 hover:underline"
                onClick={() => {
                  const copy = [...(profile.youtubers ?? [])];
                  copy.splice(idx, 1);
                  setProfile({ ...profile, youtubers: copy });
                }}
              >
                remove
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function addItem(
  key: keyof Pick<Profile, "hobbies" | "interests" | "languages">,
  value: string,
  profile: Profile,
  setProfile: (p: Profile) => void,
  clear: (v: string) => void
) {
  const trimmed = value.trim();
  if (!trimmed) return;
  const set = new Set([...(profile[key] ?? []), trimmed]);
  setProfile({ ...profile, [key]: Array.from(set) });
  clear("");
}

function removeItem(
  key: keyof Pick<Profile, "hobbies" | "interests" | "languages">,
  index: number,
  profile: Profile,
  setProfile: (p: Profile) => void
) {
  const copy = [...(profile[key] ?? [])];
  copy.splice(index, 1);
  setProfile({ ...profile, [key]: copy });
}

function TagEditor(props: {
  label: string;
  items: string[];
  newItem: string;
  setNewItem: (v: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}) {
  const { label, items, newItem, setNewItem, onAdd, onRemove } = props;
  return (
    <section className="grid gap-2">
      <label className="text-sm text-foreground/70">{label}</label>
      <div className="flex gap-2">
        <input
          className="flex-1 border rounded-md px-3 py-2 bg-background"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder={`Add ${label.toLowerCase().slice(0, -1)}`}
          onKeyDown={(e) => {
            if (e.key === "Enter") onAdd();
          }}
        />
        <button className="px-3 py-2 rounded-md bg-foreground text-background" onClick={onAdd}>
          Add
        </button>
      </div>
      <div className="flex flex-wrap gap-2">
        {items.map((item, index) => (
          <span key={item} className="px-2 py-1 rounded-full bg-black/5 dark:bg-white/10 text-sm">
            {item}
            <button className="ml-2 text-foreground/60 hover:underline" onClick={() => onRemove(index)}>
              remove
            </button>
          </span>
        ))}
      </div>
    </section>
  );
}


