import AsyncStorage from "@react-native-async-storage/async-storage";
import { GPTOKEN_KEY } from "./constants";

// Read the session claim without Buffer/atob, which are not available on every
// React Native runtime. This only namespaces local storage; the API verifies JWTs.
function readSession(token) {
  try {
    const encoded = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let bits = 0;
    let value = 0;
    let decoded = "";
    for (const character of encoded.replace(/=+$/, "")) {
      const digit = alphabet.indexOf(character);
      if (digit < 0) return null;
      value = (value << 6) | digit;
      bits += 6;
      if (bits >= 8) {
        bits -= 8;
        decoded += String.fromCharCode((value >> bits) & 255);
      }
    }
    return JSON.parse(decoded);
  } catch (_error) {
    return null;
  }
}

// The existing 401 handler may renew the session while a create is in flight.
// Use the session in the server's canonical ID, keeping the request's project.
export function getCanonicalImpressionStorageKey(storageKey, impressionId) {
  const prefix = "content-impressions-v1:";
  const [project, , content] = JSON.parse(storageKey.slice(prefix.length));
  const suffix = `:${content}`;
  if (!impressionId.endsWith(suffix)) return storageKey;
  const sessionId = impressionId.slice(0, -suffix.length);
  return `${prefix}${JSON.stringify([project, sessionId, content])}`;
}

export async function getContentImpressionStorageKey(contentKey) {
  const token = await AsyncStorage.getItem(GPTOKEN_KEY);
  const session = readSession(token);
  if (!session || !session.project || !session.sessionId) {
    throw new Error("Initialize the SDK before tracking content impressions");
  }
  return `content-impressions-v1:${JSON.stringify([
    session.project,
    session.sessionId,
    contentKey,
  ])}`;
}
