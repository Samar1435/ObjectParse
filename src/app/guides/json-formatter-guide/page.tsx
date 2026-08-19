import type { Metadata } from "next";
import { GuideShell } from "@/components/layout/guide-shell";
import { JsonLd } from "@/components/seo/json-ld";
import { SITE_URL } from "@/lib/site-config";

const TITLE = "JSON Formatter Guide: Syntax Rules, Common Errors & Fixes";
const DESCRIPTION =
  "Learn JSON syntax rules, the most common validation errors developers hit, and how to fix broken JSON fast.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["json syntax", "json errors", "invalid json", "json vs json5", "fix json"],
  alternates: { canonical: "/guides/json-formatter-guide" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/guides/json-formatter-guide", type: "article" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function JsonFormatterGuidePage() {
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: TITLE,
    description: DESCRIPTION,
    url: `${SITE_URL}/guides/json-formatter-guide`,
    author: { "@type": "Organization", name: "Objectparse" },
  };

  return (
    <GuideShell title={TITLE} description={DESCRIPTION} relatedToolSlug="json" relatedToolTitle="JSON">
      <JsonLd data={articleJsonLd} />
      <p>
        JSON (JavaScript Object Notation) is the format nearly every API, config file, and log line is written in
        today. Its rules are simple, but they&apos;re strict — a single misplaced comma is enough to make an entire
        payload unparseable. This guide covers the syntax rules, the errors developers hit most often, and how to
        recover from them.
      </p>

      <h2>The core syntax rules</h2>
      <p>Valid JSON is built from exactly six value types, nested inside two container types:</p>
      <ul>
        <li>
          <strong>Objects</strong> — <code>{"{ \"key\": value }"}</code>, with keys always wrapped in double quotes.
        </li>
        <li>
          <strong>Arrays</strong> — <code>[value, value]</code>, comma-separated, no trailing comma after the last
          item.
        </li>
        <li>
          <strong>Strings</strong> — always double-quoted, never single-quoted; special characters are escaped with{" "}
          <code>\</code>.
        </li>
        <li>Numbers, booleans (<code>true</code>/<code>false</code>), and <code>null</code>.</li>
      </ul>
      <p>
        Two things people expect JSON to support but that aren&apos;t part of the spec: comments (
        <code>{"//"}</code> or <code>{"/* */"}</code>) and trailing commas. Both will fail strict parsing in{" "}
        <code>JSON.parse</code>.
      </p>

      <h2>The most common JSON errors</h2>
      <ul>
        <li>
          <strong>Trailing comma</strong> — <code>{"[1, 2, 3,]"}</code> or a comma after the last property in an
          object.
        </li>
        <li>
          <strong>Single-quoted strings</strong> — <code>{"{'name': 'Ada'}"}</code> instead of double quotes.
        </li>
        <li>
          <strong>Unquoted keys</strong> — <code>{"{name: \"Ada\"}"}</code> instead of <code>{"{\"name\": \"Ada\"}"}</code>.
        </li>
        <li>
          <strong>Missing comma</strong> between two properties or array items.
        </li>
        <li>
          <strong>Unescaped quotes inside a string</strong> — a stray <code>&quot;</code> that terminates the string
          early.
        </li>
        <li>
          <strong>Non-JSON values</strong> — <code>undefined</code>, <code>NaN</code>, or functions are valid
          JavaScript object values but are not valid JSON.
        </li>
        <li>
          <strong>Duplicate keys</strong> — technically parseable (the last one usually wins), but a common source
          of silent bugs.
        </li>
      </ul>

      <h2>How to fix invalid JSON</h2>
      <p>
        A good JSON validator does two things: it tells you the exact line and column where parsing broke, and it
        can attempt to auto-repair the most common mistakes above — closing unbalanced brackets, stripping trailing
        commas, converting single quotes to double, and quoting bare keys. When repair isn&apos;t possible automatically,
        jumping straight to the reported line/column beats scanning the whole payload by eye.
      </p>

      <h2>JSON vs. JSON5, JSONC, and YAML</h2>
      <p>
        If you control both ends of a system, relaxed variants exist for a reason: <strong>JSONC</strong> (JSON with
        Comments, used by tools like VS Code&apos;s <code>settings.json</code>) and <strong>JSON5</strong> allow comments,
        trailing commas, and unquoted keys. <strong>YAML</strong> goes further with a whitespace-based syntax and no
        required quoting at all. None of these are interchangeable with strict JSON — always convert back to
        standard JSON before sending data to an API or storing it as a payload.
      </p>
    </GuideShell>
  );
}
