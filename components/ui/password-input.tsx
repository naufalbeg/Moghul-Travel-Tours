"use client";

import { useState, type InputHTMLAttributes } from "react";

/** Password field with a Show/Hide toggle, styled like the login mockup. */
export function PasswordInput({
  className = "",
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input {...props} type={visible ? "text" : "password"} className={`${className} pr-20`} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        disabled={props.disabled}
        aria-pressed={visible}
        aria-label={visible ? "Hide password" : "Show password"}
        className="absolute inset-y-0 right-1.5 my-auto h-10 rounded-md px-2.5 text-[13px] font-semibold text-primary disabled:text-muted"
      >
        {visible ? "Hide" : "Show"}
      </button>
    </div>
  );
}
