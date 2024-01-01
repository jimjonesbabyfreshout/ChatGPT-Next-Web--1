import { NextRequest, NextResponse } from "next/server";
import { getServerSideConfig } from "../config/server";
import { GEMINI_BASE_URL } from "../constant";

const serverConfig = getServerSideConfig();

export async function requestOpenai(req: NextRequest) {
  const controller = new AbortController();

  var authValue = req.headers.get("Authorization") ?? "";
  const authHeaderName = "Authorization";

  let path = `${req.nextUrl.pathname}${req.nextUrl.search}`.replaceAll(
    "/api/openai/",
    "",
  );

  let baseUrl =
  serverConfig.baseUrl || GEMINI_BASE_URL;

  if (!baseUrl.startsWith("http")) {
    baseUrl = `https://${baseUrl}`;
  }

  if (baseUrl.endsWith("/")) {
    baseUrl = baseUrl.slice(0, -1);
  }

  console.log("[Proxy] ", path);
  console.log("[Base Url]", baseUrl);

  const timeoutId = setTimeout(
    () => {
      controller.abort();
    },
    10 * 60 * 1000,
  );

  const fetchUrl = `${baseUrl}/${path}`;
  const fetchOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      [authHeaderName]: authValue,
    },
    method: req.method,
    body: req.body,
    redirect: "manual",
    signal: controller.signal,
  };

  try {
    const res = await fetch(fetchUrl, fetchOptions);

    const newHeaders = new Headers(res.headers);
    newHeaders.delete("www-authenticate");
    newHeaders.set("X-Accel-Buffering", "no");

    newHeaders.delete("content-encoding");

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: newHeaders,
    });
  } finally {
    clearTimeout(timeoutId);
  }
}
