export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin");

    // Handle preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(origin, env.ALLOWED_ORIGINS),
      });
    }

    // Forward to AI Gateway
    const gatewayUrl = new URL(request.url);
    gatewayUrl.hostname = "gateway.ai.cloudflare.com";
    gatewayUrl.protocol = "https:";

    const newRequest = new Request(gatewayUrl.toString(), request);

    // Securely inject key
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