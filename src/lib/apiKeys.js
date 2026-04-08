import crypto from "crypto";

export function generatePlainApiKey() {
    const body = crypto.randomBytes(24).toString("hex");
    return `skp_${body}`;
}

export function getApiKeyPrefix(key) {
    return key.slice(0, 12);
}

export function hashApiKey(key) {
    return crypto.createHash("sha256").update(key).digest("hex");
}
