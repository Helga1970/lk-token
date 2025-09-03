// functions/auth.js

// Хелпер: создание JWT
async function createJWT(payload, secret, expiresInSec = 120) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + expiresInSec };

  const encoder = new TextEncoder();
  const encodeBase64Url = (obj) =>
    btoa(JSON.stringify(obj))
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

  const headerEncoded = encodeBase64Url(header);
  const bodyEncoded = encodeBase64Url(body);
  const unsignedToken = `${headerEncoded}.${bodyEncoded}`;

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(unsignedToken)
  );

  const signatureEncoded = btoa(
    String.fromCharCode(...new Uint8Array(signature))
  )
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  return `${unsignedToken}.${signatureEncoded}`;
}

// Хелпер: проверка JWT
async function verifyJWT(token, secret) {
  const [headerB64, bodyB64, signatureB64] = token.split(".");
  if (!headerB64 || !bodyB64 || !signatureB64) return null;

  const encoder = new TextEncoder();
  const unsignedToken = `${headerB64}.${bodyB64}`;

  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const signature = Uint8Array.from(
    atob(signatureB64.replace(/-/g, "+").replace(/_/g, "/")),
    (c) => c.charCodeAt(0)
  );

  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    signature,
    encoder.encode(unsignedToken)
  );

  if (!valid) return null;

  const body = JSON.parse(
    atob(bodyB64.replace(/-/g, "+").replace(/_/g, "/"))
  );

  const now = Math.floor(Date.now() / 1000);
  if (body.exp && body.exp < now) return null;

  return body;
}

// Хелпер: извлечение cookies
function parseCookies(request) {
  const cookie = request.headers.get("Cookie") || "";
  return Object.fromEntries(
    cookie.split(";").map((c) => {
      const [k, v] = c.trim().split("=");
      return [k, v];
    })
  );
}

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // CORS заголовки
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers":
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
  };
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  // --- Login ---
  if (url.pathname === "/api/login" && request.method === "POST") {
    const { email, password } = await request.json();

    if (email === "admin@example.com" && password === "admin") {
      const token = await createJWT({ email, role: "admin" }, env.JWT_SECRET);

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Set-Cookie": `token=${token}; HttpOnly; Secure; SameSite=None; Path=/`,
        },
      });
    } else {
      return new Response(
        JSON.stringify({ message: "Неверный email или пароль" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  // --- Dashboard ---
  if (url.pathname === "/api/dashboard" && request.method === "GET") {
    const cookies = parseCookies(request);
    const token = cookies.token;
    if (!token) {
      return new Response(JSON.stringify({ message: "Токен не предоставлен" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const user = await verifyJWT(token, env.JWT_SECRET);
    if (!user) {
      return new Response(JSON.stringify({ message: "Доступ запрещен" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ message: `Привет, ${user.email}!` }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // --- Logout ---
  if (url.pathname === "/api/logout" && request.method === "POST") {
    return new Response(
      JSON.stringify({ success: true, message: "Вы успешно вышли из системы." }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Set-Cookie": `token=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0`,
        },
      }
    );
  }

  return new Response("Not found", { status: 404, headers: corsHeaders });
}
