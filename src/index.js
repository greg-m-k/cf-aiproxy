export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin, env.ALLOWED_ORIGINS),
      });
    }

    // Incoming path (what client sent to proxy)
    const incomingPath = url.pathname; // e.g. /v1/chat/completions

    // Build the gateway URL explicitly
    let gatewayPath;
    if (incomingPath.startsWith("/v1/chat/completions")) {
      gatewayPath = `/v1/${env.AI_ACCOUNT_HASH}/${env.AI_GATEWAY_NAME}/openai${incomingPath}`;
    } else {
      // passthrough for other endpoints if needed
      gatewayPath = `/v1/${env.AI_ACCOUNT_HASH}/${env.AI_GATEWAY_NAME}/openai${incomingPath}`;
    }

    const gatewayUrl = `https://gateway.ai.cloudflare.com${gatewayPath}`;

    // Debug log (viewable in Cloudflare dashboard → Worker logs)
    console.log("Proxying request:", incomingPath, "→", gatewayUrl);

    // Forward request
    const newRequest = new Request(gatewayUrl, request);

    // Inject key
    newRequest.headers.set("Authorization", `Bearer ${env.AI_GATEWAY_KEY}`);

    const response = await fetch(newRequest);

    // Clone and add CORS
    const modifiedResponse = new Response(response.body, response);
    corsHeaders(origin, env.ALLOWED_ORIGINS).forEach((value, key) => {
      modifiedResponse.headers.set(key, value);
    });

    return modifiedResponse;
  },
};

function corsHeaders(origin, allowedList) {
  if (!allowedList) return new Headers({});
  const allowedOrigins = allowedList.split(",").map(o => o.trim());
  const isAllowed = origin && allowedOrigins.includes(origin);

  return new Headers({
    "Access-Control-Allow-Origin": isAllowed ? origin : "null",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Vary": "Origin",
  });
}
