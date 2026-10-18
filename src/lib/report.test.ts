import { describe, expect, it } from "vitest";
import { parseDsn, pathOnly, sentryEnvelope } from "./report";

describe("parseDsn", () => {
  it("builds the envelope endpoint from a DSN", () => {
    expect(parseDsn("https://abc123@o42.ingest.sentry.io/7")).toEqual({
      endpoint: "https://o42.ingest.sentry.io/api/7/envelope/",
      key: "abc123",
      dsn: "https://abc123@o42.ingest.sentry.io/7",
    });
  });

  it("ignores missing or malformed DSNs", () => {
    expect(parseDsn(undefined)).toBeNull();
    expect(parseDsn("")).toBeNull();
    expect(parseDsn("not a url")).toBeNull();
    expect(parseDsn("https://o42.ingest.sentry.io/7")).toBeNull();
    expect(parseDsn("https://abc@o42.ingest.sentry.io/")).toBeNull();
  });
});

describe("pathOnly", () => {
  it("drops the origin and query string", () => {
    expect(pathOnly("https://mathbridge.app/tests?session_id=cs_123")).toBe("/tests");
    expect(pathOnly("/parents?x=1#y")).toBe("/parents");
    expect(pathOnly(undefined)).toBeUndefined();
  });
});

describe("sentryEnvelope", () => {
  it("holds a header, an item header and one error event", () => {
    const dsn = parseDsn("https://abc@o1.ingest.sentry.io/2")!;
    const lines = sentryEnvelope({ source: "browser", message: "boom", name: "TypeError", path: "/play", digest: "d1" }, dsn, new Date(0)).split("\n");
    expect(lines).toHaveLength(3);
    const head = JSON.parse(lines[0]), item = JSON.parse(lines[1]), event = JSON.parse(lines[2]);
    expect(head.dsn).toBe(dsn.dsn);
    expect(head.event_id).toBe(event.event_id);
    expect(event.event_id).toMatch(/^[0-9a-f]{32}$/);
    expect(item).toEqual({ type: "event" });
    expect(event.exception.values[0]).toEqual({ type: "TypeError", value: "boom" });
    expect(event.tags).toEqual({ source: "browser", digest: "d1" });
    expect(event.transaction).toBe("/play");
  });
});
