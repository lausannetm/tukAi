"use client";

import { Button } from "primereact/button";
import { IconField } from "primereact/iconfield";
import { InputIcon } from "primereact/inputicon";
import { InputText } from "primereact/inputtext";
import { Message } from "primereact/message";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import type { AiServiceSuggestResponse } from "@/lib/types";

const AI_SUGGESTION_STORAGE_KEY = "aiSearchSuggestion";

function readSuggestResponse(data: unknown): AiServiceSuggestResponse | null {
  if (typeof data !== "object" || data === null) {
    return null;
  }
  const o = data as Record<string, unknown>;
  if (!("reason" in o) || typeof o.reason !== "string") {
    return null;
  }
  if (!("service" in o)) {
    return null;
  }
  const service = o.service;
  if (service !== null) {
    if (typeof service !== "object") {
      return null;
    }
    const row = service as Record<string, unknown>;
    if (typeof row.id !== "string") {
      return null;
    }
  }
  return {
    service: service as AiServiceSuggestResponse["service"],
    reason: o.reason,
  };
}

async function getBrowserCoordinates(): Promise<{
  latitude: number;
  longitude: number;
} | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) {
    return null;
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 }
    );
  });
}

export function HeroSearchBar(): JSX.Element {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{
    severity: "error" | "info" | "warn";
    text: string;
  } | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    const q = query.trim();
    const href = q
      ? `/catalog/all?q=${encodeURIComponent(q)}`
      : "/catalog";
    setFeedback(null);

    if (!q) {
      router.push(href);
      return;
    }

    setBusy(true);
    try {
      const coords = await getBrowserCoordinates();
      const res = await fetch("/api/service-suggest", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          query: q,
          ...(coords
            ? { latitude: coords.latitude, longitude: coords.longitude }
            : {}),
        }),
      });

      let bodyUnknown: unknown;
      try {
        bodyUnknown = await res.json();
      } catch {
        bodyUnknown = null;
      }

      if (res.status === 503) {
        const msg =
          typeof bodyUnknown === "object" &&
          bodyUnknown !== null &&
          "error" in bodyUnknown &&
          typeof (bodyUnknown as { error: unknown }).error === "string"
            ? (bodyUnknown as { error: string }).error
            : "AI search is not available (missing API key).";
        setFeedback({ severity: "warn", text: msg });
        return;
      }

      if (!res.ok) {
        const msg =
          typeof bodyUnknown === "object" &&
          bodyUnknown !== null &&
          "error" in bodyUnknown &&
          typeof (bodyUnknown as { error: unknown }).error === "string"
            ? (bodyUnknown as { error: string }).error
            : `Suggestion request failed (${res.status}).`;
        setFeedback({ severity: "error", text: msg });
        router.push(href);
        return;
      }

      const parsed = readSuggestResponse(bodyUnknown);
      if (!parsed) {
        setFeedback({
          severity: "error",
          text: "Unexpected response from AI search.",
        });
        router.push(href);
        return;
      }

      if (parsed.service) {
        try {
          sessionStorage.setItem(
            AI_SUGGESTION_STORAGE_KEY,
            JSON.stringify({
              serviceId: parsed.service.id,
              reason: parsed.reason,
            })
          );
        } catch {
          /* private mode or quota */
        }
        router.push(
          `${href}${href.includes("?") ? "&" : "?"}suggested=${encodeURIComponent(parsed.service.id)}`
        );
        return;
      }

      setFeedback({
        severity: "info",
        text:
          parsed.reason ||
          "No single best match was found — open the catalog to compare services.",
      });
      router.push(href);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section
      className="home-hero-search w-full px-4"
      aria-labelledby="home-hero-heading"
    >
      <h1 id="home-hero-heading" className="sr-only">
        Search AI services
      </h1>
      <form
        onSubmit={(ev) => {
          void onSubmit(ev);
        }}
        className="w-full flex justify-content-center"
        role="search"
      >
        <div
          className="home-hero-search__card surface-card border-round-2xl p-3 sm:p-4 shadow-4 w-full"
          style={{ maxWidth: "36rem" }}
        >
          {feedback ? (
            <Message
              severity={feedback.severity}
              text={feedback.text}
              className="mb-3 w-full border-round-lg"
            />
          ) : null}
          <IconField iconPosition="left" className="w-full flex">
            <InputIcon className="pi pi-search text-color-secondary" />
            <InputText
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search services…"
              className="w-full border-round-xl text-base md:text-lg py-3 pl-6"
              aria-label="Search catalog"
              autoComplete="off"
              name="q"
              disabled={busy}
            />
          </IconField>
          <p className="text-color-secondary text-sm m-0 mt-2 line-height-3">
            Search uses ChatGPT with your browser location (if you allow it)
            to recommend a highly rated nearby service when possible.
          </p>
          <div className="flex gap-2 mt-3 flex-wrap">
            <Button
              type="submit"
              label="Search catalog"
              icon="pi pi-arrow-right"
              iconPos="right"
              className="border-round-lg flex-auto sm:flex-grow-0"
              loading={busy}
              disabled={busy}
            />
            <Button
              type="button"
              label="Browse all"
              severity="secondary"
              outlined
              className="border-round-lg flex-auto sm:flex-grow-0"
              disabled={busy}
              onClick={() => router.push("/catalog")}
            />
          </div>
        </div>
      </form>
    </section>
  );
}
