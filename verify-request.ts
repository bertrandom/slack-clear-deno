import { hmac } from "https://deno.land/x/god_crypto@v1.4.10/hmac.ts";
import secureCompare from "https://deno.land/x/secure_compare@1.0.0/mod.ts"

const signingSecret = Deno.env.get('SLACK_SIGNING_SECRET') ?? '';

export async function verify(request: Request): Promise<void> {

    const verifyErrorPrefix = "Failed to verify authenticity";

    // Find the relevant request headers
    const signature = request.headers.get('x-slack-signature') ?? '';
    const requestTimestampSec = Number(request.headers.get('x-slack-request-timestamp'));

    if (Number.isNaN(requestTimestampSec)) {
        throw new Error(
            `${verifyErrorPrefix}: header x-slack-request-timestamp did not have the expected type (${requestTimestampSec})`,
        )
    }

    // Calculate time-dependent values
    const nowMs = Date.now();
    const fiveMinutesAgoSec = Math.floor(nowMs / 1000) - 60 * 5;

    // Enforce verification rules

    // Rule 1: Check staleness
    if (requestTimestampSec < fiveMinutesAgoSec) {
       throw new Error(`${verifyErrorPrefix}: stale`)
    }

    // Rule 2: Check signature
    // Separate parts of signature
    const [signatureVersion, signatureHash] = signature.split("=")
    // Only handle known versions
    if (signatureVersion !== "v0") {
        throw new Error(`${verifyErrorPrefix}: unknown signature version`)
    }

    if (request.bodyUsed) {
        throw new Error(`${verifyErrorPrefix}: body already consumed`)
    }

    // Clone the request so we don't consume the body on the original request

    var clonedRequest = request.clone();

    const buffer = await clonedRequest.arrayBuffer();
    const decoder = new TextDecoder();

    const decoded = decoder.decode(buffer);

    const calculatedHmac = hmac(
        "sha256",
        signingSecret,
        `${signatureVersion}:${requestTimestampSec}:${decoded}`,
    )

    console.log(signatureHash);
    console.log(calculatedHmac.hex());

    if (!secureCompare(signatureHash, calculatedHmac.hex())) {
        throw new Error(`${verifyErrorPrefix}: signature mismatch`)
    }

    return;

}