"use client";

import { useEffect, useRef, useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthInspectorSiteCard } from "@/components/tools/auth-inspector/site-card";
import {
  DEFAULT_AUTH_INSPECTOR_CONFIG,
  createDefaultSite,
  resolveToken,
  scanAllStorage,
  type AuthInspectorConfig,
  type AuthInspectorField,
  type AuthInspectorSite,
} from "@/lib/auth-inspector";

const STORAGE_KEY = "dt_auth_inspector_sites";
const LEGACY_STORAGE_KEY = "dt_auth_inspector_settings";
// Set right before navigating this tab away to a site's login page, so that when the tab lands
// back on this tool's URL we know which site to check the page's storage/URL against.
const PENDING_KEY = "dt_auth_inspector_pending";

// Static (no crypto.randomUUID) so server and first client render match; replaced by loadSites()
// once mounted.
const INITIAL_SITE: AuthInspectorSite = {
  id: "default",
  name: "My site",
  config: DEFAULT_AUTH_INSPECTOR_CONFIG,
  fields: [],
  capturedToken: null,
  lastScanEntries: [],
  lastCheckedAt: null,
};

function loadSites(): AuthInspectorSite[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AuthInspectorSite>[];
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((site) => ({
          id: site.id ?? crypto.randomUUID(),
          name: site.name ?? "Untitled site",
          config: { ...DEFAULT_AUTH_INSPECTOR_CONFIG, ...site.config },
          fields: site.fields ?? [],
          capturedToken: site.capturedToken ?? null,
          lastScanEntries: site.lastScanEntries ?? [],
          lastCheckedAt: site.lastCheckedAt ?? null,
        }));
      }
    }

    // One-time migration from the previous single-site settings shape.
    const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (legacyRaw) {
      const legacy = JSON.parse(legacyRaw) as { config?: Partial<AuthInspectorConfig>; fields?: AuthInspectorField[] };
      if (legacy.config?.url) {
        return [
          {
            ...createDefaultSite("My site"),
            config: { ...DEFAULT_AUTH_INSPECTOR_CONFIG, ...legacy.config },
            fields: legacy.fields ?? [],
          },
        ];
      }
    }
  } catch {
    // fall through to a fresh default below
  }
  return [createDefaultSite("My site")];
}

function persistSites(sites: AuthInspectorSite[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sites));
  } catch {
    // Storage full or unavailable (e.g. private browsing) — settings just won't survive a reload.
  }
}

// If this tab was navigated away for a login and has now landed back here, check this page's own
// storage/URL for a token and attribute it to whichever site sent us off.
function resolvePendingCapture(sites: AuthInspectorSite[]): AuthInspectorSite[] {
  const pendingRaw = localStorage.getItem(PENDING_KEY);
  if (!pendingRaw) return sites;
  localStorage.removeItem(PENDING_KEY);

  let pending: { siteId: string } | null = null;
  try {
    pending = JSON.parse(pendingRaw);
  } catch {
    return sites;
  }
  if (!pending) return sites;

  const entries = scanAllStorage(window);
  if (window.location.search || window.location.hash) {
    window.history.replaceState(null, "", window.location.pathname);
  }

  return sites.map((site) => {
    if (site.id !== pending.siteId) return site;
    const token = resolveToken(entries, site.config.tokenKey);
    return {
      ...site,
      capturedToken: token ?? site.capturedToken,
      lastScanEntries: entries,
      lastCheckedAt: Date.now(),
    };
  });
}

function navigateTo(url: string): void {
  window.location.href = url;
}

export function AuthInspectorTool() {
  const [hydrated, setHydrated] = useState(false);
  const [sites, setSites] = useState<AuthInspectorSite[]>([INITIAL_SITE]);
  // resolvePendingCapture consumes a one-time localStorage marker (deleting it as it goes), so it
  // must run exactly once — React's dev-mode Strict Mode double-invokes mount effects, and a
  // second pass finding the marker already gone would overwrite the just-captured token with
  // stale data.
  const didInitRef = useRef(false);

  // One-time hydration from localStorage, after mount, so server and initial client render match.
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from localStorage
    setSites(resolvePendingCapture(loadSites()));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    persistSites(sites);
  }, [hydrated, sites]);

  function updateSite(id: string, patch: Partial<AuthInspectorSite>) {
    setSites((prev) => prev.map((site) => (site.id === id ? { ...site, ...patch } : site)));
  }

  function removeSite(id: string) {
    setSites((prev) => prev.filter((site) => site.id !== id));
  }

  function addSite() {
    setSites((prev) => [...prev, createDefaultSite(`Site ${prev.length + 1}`)]);
  }

  function loginToSite(site: AuthInspectorSite) {
    const url = site.config.url.trim();
    if (!url) return;
    persistSites(sites);
    localStorage.setItem(PENDING_KEY, JSON.stringify({ siteId: site.id }));
    navigateTo(url);
  }

  return (
    <div className="flex flex-col gap-4">
      {sites.map((site) => (
        <AuthInspectorSiteCard
          key={site.id}
          site={site}
          onChange={(patch) => updateSite(site.id, patch)}
          onLogin={() => loginToSite(site)}
          onRemove={sites.length > 1 ? () => removeSite(site.id) : undefined}
        />
      ))}
      <Button variant="outline" size="sm" className="self-start" onClick={addSite}>
        <Plus />
        Add website
      </Button>
    </div>
  );
}
