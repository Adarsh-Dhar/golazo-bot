import EventSource from "eventsource";
import { TxLineClient } from "./client";

export interface StreamHandlers {
  onEvent: (kind: "odds" | "scores", payload: unknown) => void;
  onError?: (kind: "odds" | "scores", err: unknown) => void;
}

/**
 * Opens a long-lived SSE connection per stream kind, with basic
 * reconnect-on-error. TxLINE (like most SSE sports feeds) expects the
 * client to stay connected and handle heartbeats/pings — see the API
 * Reference for the exact event names it emits (likely something like
 * `odds`, `score`, `ping`) and adjust the `es.onmessage` / `es.addEventListener`
 * wiring below once confirmed.
 */
export function openTxLineStream(
  client: TxLineClient,
  kind: "odds" | "scores",
  handlers: StreamHandlers
): EventSource {
  const { url, headers } = client.streamOptions(kind);

  const es = new EventSource(url, { headers });

  es.onmessage = (event) => {
    try {
      const payload = JSON.parse(event.data);
      handlers.onEvent(kind, payload);
    } catch (err) {
      handlers.onError?.(kind, err);
    }
  };

  es.onerror = (err) => {
    handlers.onError?.(kind, err);
    // The `eventsource` package auto-reconnects by default; log and continue.
  };

  return es;
}
