import axios, { type AxiosInstance } from "axios";
import { authHeaders, type TxLineCredentials } from "./auth";

/**
 * Thin REST wrapper. The exact paths below (fixtures/odds/scores) are
 * placeholders pending the API Reference — confirm each against
 * https://txline-docs.txodds.com/api-reference before relying on it.
 * Keeping them centralized here means a doc mismatch is a one-file fix.
 */
export class TxLineClient {
  private http: AxiosInstance;

  constructor(private creds: TxLineCredentials) {
    this.http = axios.create({
      baseURL: `${creds.apiOrigin}/api`,
      headers: authHeaders(creds),
    });
  }

  async getFixtures(params: { competition?: string; from?: string; to?: string } = {}) {
    // TODO confirm exact path/params against API Reference
    const { data } = await this.http.get("/fixtures", { params });
    return data;
  }

  async getFixtureOdds(fixtureId: string) {
    // TODO confirm exact path against API Reference
    const { data } = await this.http.get(`/fixtures/${fixtureId}/odds`);
    return data;
  }

  async getFixtureScore(fixtureId: string) {
    // TODO confirm exact path against API Reference
    const { data } = await this.http.get(`/fixtures/${fixtureId}/score`);
    return data;
  }

  /** Full URL + headers for the odds/score SSE stream — used by stream.ts */
  streamOptions(kind: "odds" | "scores") {
    return {
      // TODO confirm exact stream path against API Reference
      url: `${this.creds.apiOrigin}/api/stream/${kind}`,
      headers: authHeaders(this.creds),
    };
  }
}
