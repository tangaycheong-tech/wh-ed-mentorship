"use client";
import { useEffect, useState, useRef, useCallback } from "react";

interface TrainingModule {
  id: string;
  slug: string;
  title: string;
  description: string;
  module_order: number;
  duration_minutes: number;
  slides_url: string | null;
  audio_url: string | null;
  video_url: string | null;
  notebooklm_guide: string | null;
  created_at: string;
  updated_at: string;
  pre_read_content: string | null;
  speaker_notes: string | null;
  trainer_notes: string | null;
}

// HTML table template for the "Insert Timeline Table" button
const TIMELINE_TABLE = `<table style="width:100%; border-collapse:collapse; margin:1rem 0;">
  <thead>
    <tr style="background:#2563eb; color:white;">
      <th style="padding:10px; text-align:left; border:1px solid #e5e7eb; font-size:14px;">Time</th>
      <th style="padding:10px; text-align:left; border:1px solid #e5e7eb; font-size:14px;">Activity</th>
      <th style="padding:10px; text-align:left; border:1px solid #e5e7eb; font-size:14px;">Notes</th>
    </tr>
  </thead>
  <tbody>
    <tr style="background:#f9fafb;">
      <td style="padding:10px; border:1px solid #e5e7eb; font-size:14px;">0-5 min</td>
      <td style="padding:10px; border:1px solid #e5e7eb; font-size:14px;"></td>
      <td style="padding:10px; border:1px solid #e5e7eb; font-size:14px;"></td>
    </tr>
    <tr>
      <td style="padding:10px; border:1px solid #e5e7eb; font-size:14px;"></td>
      <td style="padding:10px; border:1px solid #e5e7eb; font-size:14px;"></td>
      <td style="padding:10px; border:1px solid #e5e7eb; font-size:14px;"></td>
    </tr>
  </tbody>
</table>`;

// Simple markdown-to-HTML preview renderer
function renderMarkdown(md: string): string {
  if (!md) return "";
  const lines = md.split("\n");
  const parts: string[] = [];
  let inTable = false;
  let tableRows: string[][] = [];

  const inline = (t: string) =>
    t
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/`(.+?)`/g, '<code class="bg-slate-100 px-1 py-0.5 rounded text-xs text-rose-600">$1</code>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-teal-600 underline" target="_blank">$1</a>')
      .replace(/<table/g, '<table style="width:100%;border-collapse:collapse;"')
      .replace(/<th/g, '<th style="padding:8px;border:1px solid #e5e7eb;background:#f1f5f9;font-size:13px;"')
      .replace(/<td/g, '<td style="padding:8px;border:1px solid #e5e7eb;font-size:13px;"');

  const flushTable = () => {
    if (tableRows.length < 2) { tableRows = []; inTable = false; return; }
    const header = tableRows[0];
    const body = tableRows.slice(2); // skip separator row
    let h = "<table style='width:100%;border-collapse:collapse;'><thead><tr>";
    header.forEach(c => { h += `<th style='padding:8px;border:1px solid #e5e7eb;background:#f1f5f9;font-size:13px;'>${inline(c.trim())}</th>`; });
    h += "</tr></thead><tbody>";
    body.forEach((row, ri) => {
      h += `<tr style='background:${ri % 2 === 0 ? "#fff" : "#f9fafb"};'>`;
      row.forEach(c => { h += `<td style='padding:8px;border:1px solid #e5e7eb;font-size:13px;'>${inline(c.trim())}</td>`; });
      h += "</tr>";
    });
    h += "</tbody></table>";
    parts.push(h);
    tableRows = [];
    inTable = false;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const nextLine = lines[i + 1] ?? "";

    // Pipe table detection
    if (line.startsWith("|") && line.endsWith("|")) {
      inTable = true;
      tableRows.push(line.slice(1, -1).split("|"));
      // Check if next line is separator
      if (nextLine.startsWith("|") && /^\|[\s\-:|]+\|$/.test(nextLine)) {
        tableRows.push(["separator"]);
        i++; // skip separator
      }
      continue;
    } else if (inTable) {
      flushTable();
    }

    if (/^### (.+)/.test(line)) {
      parts.push(`<h4 class='text-sm font-semibold text-slate-700 mt-4 mb-1'>${inline(line.replace(/^### /, ""))}</h4>`);
    } else if (/^## (.+)/.test(line)) {
      parts.push(`<h3 class='text-base font-semibold text-slate-800 mt-4 mb-2'>${inline(line.replace(/^## /, ""))}</h3>`);
    } else if (/^# (.+)/.test(line)) {
      parts.push(`<h2 class='text-lg font-bold text-slate-800 mt-4 mb-2'>${inline(line.replace(/^# /, ""))}</h2>`);
    } else if (/^[-*] (.+)/.test(line)) {
      parts.push(`<li class='ml-4 list-disc text-slate-600 text-sm'>${inline(line.replace(/^[-*] /, ""))}</li>`);
    } else if (/^\d+\. (.+)/.test(line)) {
      parts.push(`<li class='ml-4 list-decimal text-slate-600 text-sm'>${inline(line.replace(/^\d+\. /, ""))}</li>`);
    } else if (line.trim() === "") {
      parts.push("<br/>");
    } else {
      parts.push(`<p class='text-sm text-slate-600 mb-1'>${inline(line)}</p>`);
    }
  }

  if (inTable) flushTable();
  return parts.join("");
}

export default function AdminTrainingPage() {
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>("");
  const [moduleData, setModuleData] = useState<TrainingModule | null>(null);
  const [form, setForm] = useState({ pre_read_content: "", speaker_notes: "", trainer_notes: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewField, setPreviewField] = useState<"pre_read_content" | "speaker_notes" | "trainer_notes">("trainer_notes");

  const trainerRef = useRef<HTMLTextAreaElement>(null);
  const speakerRef = useRef<HTMLTextAreaElement>(null);
  const preReadRef = useRef<HTMLTextAreaElement>(null);

  // Load module list
  const loadModules = useCallback(() => {
    fetch("/api/admin/training")
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) setModules(d);
        else if (d.success) setModules(d.data ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => { loadModules(); }, [loadModules]);

  // Load full content when slug changes
  useEffect(() => {
    if (!selectedSlug) { setModuleData(null); setForm({ pre_read_content: "", speaker_notes: "", trainer_notes: "" }); return; }
    setLoading(true);
    fetch(`/api/admin/training/${selectedSlug}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data) {
          setModuleData(d.data);
          setForm({
            pre_read_content: d.data.pre_read_content ?? "",
            speaker_notes: d.data.speaker_notes ?? "",
            trainer_notes: d.data.trainer_notes ?? "",
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedSlug]);

  const save = async () => {
    if (!selectedSlug) return;
    setSaving(true);
    setStatus(null);
    const res = await fetch(`/api/admin/training/${selectedSlug}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (data.success) {
      setStatus({ type: "success", text: "Saved! The HTML tables will render correctly on the Trainer page." });
    } else {
      setStatus({ type: "error", text: data.error ?? "Save failed." });
    }
    setSaving(false);
  };

  const insertTable = (field: "pre_read_content" | "speaker_notes" | "trainer_notes") => {
    const refs: Record<string, React.RefObject<HTMLTextAreaElement | null>> = {
      pre_read_content: preReadRef,
      speaker_notes: speakerRef,
      trainer_notes: trainerRef,
    };
    const ta = refs[field]?.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const current = form[field];
    const before = current.slice(0, start);
    const after = current.slice(end);
    const needsNewline = before.length > 0 && !before.endsWith("\n");
    const insert = (needsNewline ? "\n\n" : "") + TIMELINE_TABLE + "\n\n";
    const newText = before + insert + after;
    setForm({ ...form, [field]: newText });
    setTimeout(() => {
      const pos = (needsNewline ? before + "\n\n" : before).length + TIMELINE_TABLE.length + 2;
      ta.focus();
      ta.selectionStart = pos;
      ta.selectionEnd = pos;
    }, 0);
  };

  if (loading && modules.length === 0) return <div className="text-slate-500 p-8">Loading...</div>;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Training Module Editor</h2>
          <p className="text-sm text-slate-500 mt-1">Edit pre-read, speaker notes, and trainer teaching guide content for each module.</p>
        </div>
        <div className="flex gap-2">
          {selectedSlug && (
            <button
              onClick={() => { setShowPreview(!showPreview); setPreviewField("trainer_notes"); }}
              className="bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg hover:bg-indigo-200 text-sm font-medium"
            >
              {showPreview ? "Edit" : "Preview"}
            </button>
          )}
          <button
            onClick={save}
            disabled={!selectedSlug || saving}
            className="bg-teal-600 text-white px-5 py-2 rounded-lg hover:bg-teal-700 text-sm font-medium disabled:opacity-40"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Status */}
      {status && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm font-medium ${status.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
          {status.text}
        </div>
      )}

      {/* Module Selector */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-6">
        <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Select Module</label>
        <select
          value={selectedSlug}
          onChange={e => { setSelectedSlug(e.target.value); setStatus(null); setShowPreview(false); }}
          className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm bg-white font-medium text-slate-800"
        >
          <option value="">— Choose a module —</option>
          {modules.map(m => (
            <option key={m.slug} value={m.slug}>
              Module {m.module_order}: {m.title} ({m.duration_minutes ?? "?"} min)
            </option>
          ))}
        </select>
      </div>

      {!selectedSlug ? (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-400 text-sm">
          Select a module above to edit its content.
        </div>
      ) : showPreview ? (
        /* Preview Mode */
        <div className="space-y-5">
          {(["trainer_notes", "speaker_notes", "pre_read_content"] as const).map(field => (
            form[field] && (
              <div key={field} className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-xs font-semibold text-slate-500 uppercase">
                    {field === "trainer_notes" ? "Trainer Teaching Guide" : field === "speaker_notes" ? "Speaker Notes" : "Pre-Read Content (Mentee)"}
                  </h3>
                  <button
                    onClick={() => { setPreviewField(field); setShowPreview(false); }}
                    className="text-xs text-teal-600 hover:text-teal-800 font-medium"
                  >
                    Edit
                  </button>
                </div>
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(form[field]) }}
                />
              </div>
            )
          ))}
          {loading && <div className="text-slate-400 text-sm p-4">Loading preview...</div>}
        </div>
      ) : (
        /* Edit Mode */
        <div className="space-y-5">
          {/* Module title display */}
          {moduleData && (
            <div className="bg-slate-700 text-white rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-300 uppercase font-semibold">Editing</p>
                <p className="text-lg font-bold">{moduleData.title}</p>
                <p className="text-sm text-slate-400">Module {moduleData.module_order} · {moduleData.duration_minutes} min · <span className="font-mono text-xs">{moduleData.slug}</span></p>
              </div>
              <div className="text-right text-xs text-slate-400">
                Updated<br/>{new Date(moduleData.updated_at).toLocaleDateString()}
              </div>
            </div>
          )}

          {/* Pre-Read Content */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-slate-500 uppercase">Pre-Read Content (What Mentees See)</label>
              <button onClick={() => insertTable("pre_read_content")} className="text-xs text-teal-600 hover:text-teal-800 font-medium">+ Insert Table</button>
            </div>
            <p className="text-xs text-slate-400 mb-3">Markdown supported. This appears on the mentee training page. HTML tables will render correctly.</p>
            <textarea
              ref={preReadRef}
              value={form.pre_read_content}
              onChange={e => setForm({ ...form, pre_read_content: e.target.value })}
              rows={10}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-700 resize-y"
              placeholder="## Pre-Module Self-Study&#10;&#10;Enter content in markdown... Use HTML tables for comparison tables."
            />
            <p className="text-xs text-slate-400 mt-1 text-right">{form.pre_read_content.length} characters</p>
          </div>

          {/* Speaker Notes */}
          <div className="bg-white border border-slate-200 rounded-xl p-5">
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-semibold text-slate-500 uppercase">Speaker Notes (Facilitator Guide)</label>
              <button onClick={() => insertTable("speaker_notes")} className="text-xs text-teal-600 hover:text-teal-800 font-medium">+ Insert Table</button>
            </div>
            <p className="text-xs text-slate-400 mb-3">Notes for the session facilitator. Timing cues, key points to emphasise, discussion prompts.</p>
            <textarea
              ref={speakerRef}
              value={form.speaker_notes}
              onChange={e => setForm({ ...form, speaker_notes: e.target.value })}
              rows={8}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-700 resize-y"
              placeholder="## Session Facilitation Notes&#10;&#10;Key talking points and timing..."
            />
            <p className="text-xs text-slate-400 mt-1 text-right">{form.speaker_notes.length} characters</p>
          </div>

          {/* Trainer Teaching Guide */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
            <div className="flex justify-between items-center mb-3">
              <div>
                <label className="text-xs font-semibold text-amber-700 uppercase">Trainer Teaching Guide</label>
                <p className="text-xs text-amber-500 mt-0.5">This is what trainers see on the /teach/ page. HTML tables render correctly here.</p>
              </div>
              <button
                onClick={() => insertTable("trainer_notes")}
                className="bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700 text-xs font-semibold"
              >
                + Insert Timeline Table
              </button>
            </div>
            <textarea
              ref={trainerRef}
              value={form.trainer_notes}
              onChange={e => setForm({ ...form, trainer_notes: e.target.value })}
              rows={16}
              className="w-full border border-amber-300 rounded-lg px-3 py-2 text-sm font-mono text-slate-700 resize-y bg-white"
              placeholder="## Trainer Guide: [Module Title]&#10;&#10;### Session Plan&#10;&#10;[Click 'Insert Timeline Table' above to add the session timing table]"
            />
            <div className="flex justify-between items-center mt-1">
              <p className="text-xs text-amber-600">HTML tables supported — click "Insert Timeline Table" above</p>
              <p className="text-xs text-slate-400">{form.trainer_notes.length} characters</p>
            </div>
          </div>

          {/* Preview toggle */}
          <div className="text-center">
            <button
              onClick={() => { setShowPreview(true); setPreviewField("trainer_notes"); }}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              👁 Preview all sections as rendered HTML →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}