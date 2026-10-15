"use client";

import { useLayoutEffect, useRef, type ClipboardEvent, type KeyboardEvent } from "react";
import { FieldError, fieldClass } from "@/components/admin/field";
import { CloseIcon } from "@/components/ui/icons";

// Bullets and numbers people paste in from Word or WhatsApp ("• ", "- ", "1. ").
const PASTED_MARKER = /^\s*(?:[•●▪◦*–-]|\d+[.)])\s+/;

/**
 * A list of points (highlights, inclusions…): one box per point that grows
 * as you type, so a point can run over several lines. Enter starts a new
 * point, Backspace at the start of a point joins it to the one above, and
 * pasting several lines makes one point per line.
 */
export function PointListField({
  id,
  label,
  hint,
  items,
  onChange,
  max,
  placeholder,
  errors,
}: {
  id: string;
  label: string;
  hint?: string;
  items: string[];
  onChange: (items: string[]) => void;
  max: number;
  placeholder?: string;
  /** Validation errors keyed "<id>" or "<id>.<n>", n counting only the non-blank points. */
  errors: Record<string, string>;
}) {
  const rows = items.length > 0 ? items : [""];
  const boxes = useRef<(HTMLTextAreaElement | null)[]>([]);
  const focusNext = useRef<{ index: number; caret: number } | null>(null);
  const filled = rows.filter((r) => r.trim()).length;
  const full = rows.length >= max;

  useLayoutEffect(() => {
    // Browsers without `field-sizing: content` (Firefox) grow the boxes here.
    if (!CSS.supports("field-sizing", "content")) {
      for (const box of boxes.current) {
        if (!box) continue;
        box.style.height = "auto";
        box.style.height = `${box.scrollHeight + box.offsetHeight - box.clientHeight}px`;
      }
    }
    const target = focusNext.current;
    if (target) {
      focusNext.current = null;
      const box = boxes.current[target.index];
      box?.focus();
      box?.setSelectionRange(target.caret, target.caret);
    }
  });

  function change(next: string[], focus?: { index: number; caret: number }) {
    if (focus) focusNext.current = focus;
    onChange(next);
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>, i: number) {
    if (e.nativeEvent.isComposing) return;
    const box = e.currentTarget;
    const { selectionStart: start, selectionEnd: end, value } = box;
    const collapsed = start === end;

    if (e.key === "Enter") {
      e.preventDefault(); // a point is always one paragraph
      if (full) return;
      const next = [...rows];
      next.splice(i, 1, value.slice(0, start).trimEnd(), value.slice(end).trimStart());
      change(next, { index: i + 1, caret: 0 });
    } else if (e.key === "Backspace" && collapsed && start === 0 && i > 0) {
      e.preventDefault();
      const above = rows[i - 1];
      const joined = above && value ? `${above} ${value}` : above + value;
      const next = [...rows];
      next.splice(i - 1, 2, joined);
      change(next, { index: i - 1, caret: above.length });
    } else if (e.key === "Delete" && collapsed && start === value.length && i < rows.length - 1) {
      e.preventDefault();
      const below = rows[i + 1];
      const next = [...rows];
      next.splice(i, 2, value && below ? `${value} ${below}` : value + below);
      change(next, { index: i, caret: value.length });
    } else if (e.key === "ArrowUp" && collapsed && start === 0 && i > 0) {
      e.preventDefault();
      change(rows, { index: i - 1, caret: rows[i - 1].length });
    } else if (e.key === "ArrowDown" && collapsed && start === value.length && i < rows.length - 1) {
      e.preventDefault();
      change(rows, { index: i + 1, caret: 0 });
    }
  }

  function onPaste(e: ClipboardEvent<HTMLTextAreaElement>, i: number) {
    const lines = e.clipboardData
      .getData("text")
      .split(/\r?\n/)
      .map((l) => l.replace(PASTED_MARKER, "").trim())
      .filter(Boolean);
    if (lines.length < 2) return; // ordinary paste
    e.preventDefault();
    const { selectionStart: start, selectionEnd: end, value } = e.currentTarget;
    const before = value.slice(0, start).trimEnd();
    const after = value.slice(end).trimStart();
    if (before) lines[0] = `${before} ${lines[0]}`;
    const last = lines.length - 1;
    const caret = lines[last].length;
    if (after) lines[last] = `${lines[last]} ${after}`;
    const next = [...rows];
    next.splice(i, 1, ...lines);
    // Never drop pasted text — going over the limit shows an error instead.
    change(next, { index: i + last, caret });
  }

  function remove(i: number) {
    const next = rows.filter((_, j) => j !== i);
    change(next.length > 0 ? next : [""], { index: Math.max(0, i - 1), caret: (next[i - 1] ?? "").length });
  }

  function add() {
    change([...rows, ""], { index: rows.length, caret: 0 });
  }

  // Map validation errors (indexed among non-blank points) back to the rows.
  let sent = -1;
  const rowError = rows.map((r) => (r.trim() ? errors[`${id}.${++sent}`] : undefined));
  const listError = errors[id];
  const over = filled > max;

  return (
    <fieldset aria-describedby={`${id}-hint`}>
      <legend className="mb-2 block text-sm font-semibold">{label}</legend>
      <p id={`${id}-hint`} className="-mt-1 mb-2.5 text-[13px] text-muted">
        {hint && `${hint} `}Press Enter to start a new point — a point can be as long as you need.
      </p>

      <ol className="space-y-2">
        {rows.map((row, i) => (
          <li key={i}>
            <div className="flex items-start gap-2">
              <span aria-hidden="true" className="w-6 shrink-0 pt-3.5 text-right text-[14px] font-semibold text-muted">
                {i + 1}.
              </span>
              <label htmlFor={i === 0 ? id : `${id}-${i}`} className="sr-only">
                {label} — point {i + 1}
              </label>
              <textarea
                ref={(el) => {
                  boxes.current[i] = el;
                }}
                id={i === 0 ? id : `${id}-${i}`}
                value={row}
                rows={1}
                onChange={(e) => {
                  const next = [...rows];
                  next[i] = e.target.value.replace(/\s*\r?\n\s*/g, " ");
                  onChange(next);
                }}
                onKeyDown={(e) => onKeyDown(e, i)}
                onPaste={(e) => onPaste(e, i)}
                placeholder={i === 0 ? placeholder : undefined}
                aria-invalid={Boolean(rowError[i])}
                aria-describedby={rowError[i] ? `${id}-${i}-error` : undefined}
                className={`${fieldClass(rowError[i])} min-h-[3.1rem] resize-none overflow-hidden leading-snug field-sizing-content`}
              />
              <button
                type="button"
                onClick={() => remove(i)}
                aria-label={`Remove point ${i + 1}`}
                title="Remove this point"
                className="grid size-11 shrink-0 place-items-center rounded-lg text-muted hover:bg-danger-pale hover:text-danger"
              >
                <CloseIcon className="size-4" />
              </button>
            </div>
            <div className="pl-8">
              <FieldError id={`${id}-${i}-error`} message={rowError[i]} />
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-2.5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 pl-8">
        <button
          type="button"
          onClick={add}
          disabled={full}
          className="min-h-11 rounded-lg border-[1.5px] border-dashed border-line px-4 text-[14.5px] font-semibold text-primary hover:border-primary disabled:cursor-not-allowed disabled:text-muted disabled:hover:border-line"
        >
          + Add a point
        </button>
        <span className={`text-[13px] ${over ? "font-semibold text-danger" : "text-muted"}`}>
          {over
            ? `${filled} of ${max} — remove ${filled - max}`
            : full
              ? `${max} of ${max} — that's the limit`
              : `${filled} of ${max}`}
        </span>
      </div>
      <div className="pl-8">
        <FieldError id={`${id}-error`} message={listError} />
      </div>
    </fieldset>
  );
}
