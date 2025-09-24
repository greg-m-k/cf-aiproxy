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

    // Always rewrite into full AI Gateway URL
    const gatewayUrl = `https://gateway.ai.cloudflare.com/v1/${env.AI_ACCOUNT_HASH}/${env.AI_GATEWAY_NAME}/openai${url.pathname}`;

    // Forward request
    const newRequest = new Request(gatewayUrl, request);
    newRequest.headers.set("Authorization", `Bearer ${env.AI_GATEWAY_KEY}`);

    let response;
    try {
      response = await fetch(newRequest);
    } catch (err) {
      return new Response(JSON.stringify({ error: "Fetch failed", details: err.message }), {
        status: 502,
        headers: { "Content-Type": "application/json" },
      });
    }

    // If upstream errors, surface them clearly
    if (!response.ok) {
      const text = await response.text();
      return new Response(JSON.stringify({ error: "Upstream error", status: response.status, body: text }), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Normal successful response
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
