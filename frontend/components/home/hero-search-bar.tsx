"use client";

import Link from "next/link";
import { Message } from "primereact/message";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { readStoredUser } from "@/lib/auth-storage";
import type { UserPublicDTO } from "@/lib/auth-types";
import {
  categoryCatalogPath,
  inferServiceCategory,
  type ServiceCategoryId,
} from "@/lib/service-categories";
import type {
  AiServiceSuggestMatch,
  AiServiceSuggestResponse,
} from "@/lib/types";

const AI_SUGGESTION_STORAGE_KEY = "aiSearchSuggestion";

type QuickAction = {
  label: string;
  icon: string;
  href?: string;
  query?: string;
  categoryId?: ServiceCategoryId;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "Browse all categories",
    icon: "pi pi-th-large",
    href: "/catalog/all",
  },
  {
    label: "Renovation",
    icon: "pi pi-wrench",
    categoryId: "renovation",
  },
  {
    label: "Photography",
    icon: "pi pi-camera",
    categoryId: "photography",
  },
  {
    label: "Hire a chef",
    icon: "pi pi-user",
    query: "personal chef",
  },
];

function readSuggestResponse(data: unknown): AiServiceSuggestResponse | null {
  if (typeof data !== "object" || data === null) {
    return null;
  }
  const o = data as Record<string, unknown>;
  if (!("services" in o) || !Array.isArray(o.services)) {
    return null;
  }
  const services: AiServiceSuggestMatch[] = [];
  for (const entry of o.services) {
    if (typeof entry !== "object" || entry === null) {
      continue;
    }
    const item = entry as Record<string, unknown>;
    if (typeof item.reason !== "string") {
      continue;
    }
    const service = item.service;
    if (typeof service !== "object" || service === null) {
      continue;
    }
    const row = service as Record<string, unknown>;
    if (typeof row.id !== "string") {
      continue;
    }
    services.push({
      service: service as AiServiceSuggestMatch["service"],
      reason: item.reason,
    });
  }
  const reason =
    "reason" in o && typeof o.reason === "string" ? o.reason : undefined;
  return { services, reason };
}

function catalogPathForAiSuggestions(
  matches: AiServiceSuggestMatch[],
): string {
  const ids = matches.map((match) => match.service.id).join(",");
  const categories = new Set(
    matches
      .map((match) => inferServiceCategory(match.service))
      .filter((category): category is Exclude<ServiceCategoryId, "all"> =>
        Boolean(category),
      ),
  );
  const categoryId =
    categories.size === 1 ? [...categories][0]! : ("all" as const);
  return `${categoryCatalogPath(categoryId)}?suggested=${encodeURIComponent(ids)}`;
}

function firstNameFromUser(user: UserPublicDTO): string {
  const fromName = user.full_name?.trim().split(/\s+/)[0];
  if (fromName) {
    return fromName;
  }
  const local = user.email.split("@")[0]?.trim();
  return local && local.length > 0 ? local : "there";
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
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  });
}

export function HeroSearchBar(): JSX.Element {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [storedUser, setStoredUser] = useState<UserPublicDTO | null>(null);
  const [feedback, setFeedback] = useState<{
    severity: "error" | "info" | "warn";
    text: string;
  } | null>(null);

  useEffect(() => {
    setStoredUser(readStoredUser());
  }, []);

  const greetingName = storedUser ? firstNameFromUser(storedUser) : null;

  async function runSearch(searchQuery: string): Promise<void> {
    const q = searchQuery.trim();
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

      if (parsed.services.length > 0) {
        try {
          sessionStorage.setItem(
            AI_SUGGESTION_STORAGE_KEY,
            JSON.stringify({
              matchIds: parsed.services.map((match) => match.service.id),
              items: parsed.services.map((match) => ({
                serviceId: match.service.id,
                reason: match.reason,
              })),
            }),
          );
        } catch {
          /* private mode or quota */
        }
        router.push(catalogPathForAiSuggestions(parsed.services));
        return;
      }

      setFeedback({
        severity: "info",
        text:
          parsed.reason ||
          "No matching services were found — open the catalog to compare options.",
      });
      router.push(href);
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>): Promise<void> {
    e.preventDefault();
    await runSearch(query);
  }

  function onQuickAction(action: QuickAction): void {
    if (action.href) {
      router.push(action.href);
      return;
    }
    if (action.categoryId) {
      router.push(categoryCatalogPath(action.categoryId));
      return;
    }
    if (action.query) {
      setQuery(action.query);
      void runSearch(action.query);
    }
  }

  return (
    <section
      className="home-hero-search w-full px-4"
      aria-labelledby="home-hero-heading"
    >
      <div className="home-hero-search__content">
        <Link href="/" className="home-hero-brand no-underline" aria-label="TukAI home">
          <img
            src="/images/logo.png"
            alt=""
            width={48}
            height={45}
            className="home-hero-brand__logo"
            decoding="async"
          />
        </Link>

        <h1 id="home-hero-heading" className="home-hero-greeting">
          {greetingName
            ? `Hey, ${greetingName}. Ready to find a service?`
            : "What service are you looking for?"}
        </h1>
        <p className="home-hero-subtitle">
          Describe what you need — AI will match you with the right provider.
        </p>

        <form
          onSubmit={(ev) => {
            void onSubmit(ev);
          }}
          className="home-hero-form w-full"
          role="search"
        >
          <div className="home-hero-search-pill-wrap">
            <div
              className={`home-hero-search-pill${busy ? " home-hero-search-pill--busy" : ""}`}
            >
              <i className="pi pi-search home-hero-search-pill__icon" aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search services…"
                className="home-hero-search-pill__input"
                aria-label="Search catalog"
                autoComplete="off"
                name="q"
                disabled={busy}
              />
              <button
                type="submit"
                className="home-hero-search-pill__submit"
                disabled={busy}
                aria-label="Search"
              >
                <i
                  className={`pi ${busy ? "pi-spin pi-spinner" : "pi-arrow-right"}`}
                  aria-hidden
                />
              </button>
            </div>
          </div>

          {feedback ? (
            <Message
              severity={feedback.severity}
              text={feedback.text}
              className="home-hero-feedback w-full border-round-lg"
            />
          ) : null}

          <div className="home-hero-chips" role="list">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={action.label}
                type="button"
                className="home-hero-chip"
                disabled={busy}
                onClick={() => onQuickAction(action)}
                role="listitem"
              >
                <i className={action.icon} aria-hidden />
                <span>{action.label}</span>
              </button>
            ))}
          </div>
        </form>
      </div>
    </section>
  );
}
