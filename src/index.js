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

    // Rewrite request to Cloudflare AI Gateway
    const incomingPath = url.pathname; // e.g. /v1/chat/completions

    const gatewayUrl = new URL(request.url);
    gatewayUrl.hostname = "gateway.ai.cloudflare.com";
    gatewayUrl.protocol = "https:";

    // If client requests /v1/chat/completions → expand to full AI Gateway path
    if (incomingPath.startsWith("/v1/chat/completions")) {
      gatewayUrl.pathname = `/v1/${env.AI_ACCOUNT_HASH}/${env.AI_GATEWAY_NAME}/openai${incomingPath}`;
    }

    // Forward the request
    const newRequest = new Request(gatewayUrl.toString(), request);

    // Inject AI Gateway key (stored as a Worker secret)
    newRequest.headers.set("Authorization", `Bearer ${env.AI_GATEWAY_KEY}`);

    const response = await fetch(newRequest);

    // Clone + add CORS headers
    const modifiedResponse = new Response(response.body, response);
    corsHeaders(origin, env.ALLOWED_ORIGINS).forEach((value, key) => {
      modifiedResponse.headers.set(key, value);
    });

    return modifiedResponse;
  },
};

// CORS helper
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
