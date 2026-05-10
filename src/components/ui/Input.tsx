"use client";

import type { InputHTMLAttributes } from "react";

export function Input({ className = "", ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-2xl border-2 border-[#f4c48d] bg-[#fff8ee] px-4 py-3 text-base text-[#6b3a13] placeholder:text-[#d39a64] outline-none transition focus:border-[#ef9b42] focus:ring-4 focus:ring-[#ffd6a8]/60 ${className}`}
      {...props}
    />
  );
}
