const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};
function buildTwiML(content) {
  // Flat XML, no whitespace/newlines
  const xml = `<?xml version="1.0" encoding="UTF-8"?><Response>${content}</Response>`;
  return new Response(xml, {
    status: 200,
    headers: {
      ...corsHeaders,
      // Use text/xml for maximum Twilio compatibility
      "Content-Type": "text/xml",
      "Cache-Control": "no-store",
    },
  });
}
async function parseParams(req) {
  const url = new URL(req.url);
  const contentType = req.headers.get("content-type") || "";
  let to = null,
    from = null,
    digits = null;
  if (
    contentType.includes("application/x-www-form-urlencoded") ||
    contentType.includes("multipart/form-data")
  ) {
    const form = await req.formData();
    to = form.get("To")?.toString() || url.searchParams.get("To");
    from = form.get("From")?.toString() || url.searchParams.get("From");
    digits = (form.get("Digits") || url.searchParams.get("Digits") || "")
      .toString()
      .trim();
  } else if (contentType.includes("application/json")) {
    const body = await req.json().catch(() => ({}));
    to = body?.To ?? url.searchParams.get("To");
    from = body?.From ?? url.searchParams.get("From");
    digits = (body?.Digits ?? url.searchParams.get("Digits") ?? "")
      .toString()
      .trim();
  } else {
    to = url.searchParams.get("To");
    from = url.searchParams.get("From");
    digits = (url.searchParams.get("Digits") || "").toString().trim();
  }
  return {
    to,
    from,
    digits,
    flowId: url.searchParams.get("flow"),
    nodeId: url.searchParams.get("node"),
    attempt: parseInt(url.searchParams.get("attempt") || "0", 10) || 0,
    baseOrigin: url.origin,
  };
}
async function getSupabase() {
  const { createClient } = await import(
    "https://esm.sh/@supabase/supabase-js@2"
  );
  const url =
    Deno.env.get("SUPABASE_URL") || Deno.env.get("NEXT_PUBLIC_SUPABASE_URL");
  // Prefer service role for server-side function access; fall back to anon if missing
  const key =
    Deno.env.get("SUPABASE_SERVICE_KEY") ||
    Deno.env.get("SERVICE_KEY") ||
    Deno.env.get("SUPABASE_ANON_KEY");
  if (!url || !key) throw new Error("Supabase URL or key not set");
  return createClient(url, key);
}
async function loadFlowByPhone(phone) {
  const supabase = await getSupabase();

  // Find the phone number record first
  const { data: phoneRec, error: phoneErr } = await supabase
    .from("phone_numbers")
    .select("id")
    .eq("phone_number", phone)
    .maybeSingle();
  if (phoneErr) throw phoneErr;
  if (!phoneRec) return null;

  // Load the active call flow associated to this phone number
  const { data: flow, error: flowErr } = await supabase
    .from("call_flows")
    .select(
      "id, flow_json, flow_data, recording_enabled, recording_disclaimer",
    )
    .eq("phone_number_id", phoneRec.id)
    .maybeSingle();
  if (flowErr) throw flowErr;
  if (!flow) return null;

  // Normalize flow structure to flow_json object
  let flowJson = flow.flow_json ?? flow.flow_data ?? null;
  if (typeof flowJson === "string") {
    try {
      flowJson = JSON.parse(flowJson);
    } catch (_) {
      flowJson = null;
    }
  }
  return {
    id: flow.id,
    flow_json: flowJson,
    recording_enabled: !!flow.recording_enabled,
    recording_disclaimer: flow.recording_disclaimer || null,
  };
}
function escapeXml(unsafe) {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}
function renderSay(message) {
  return `<Say voice="alice">${escapeXml(message)}</Say>`;
}
function redirectTag(url) {
  // Escape URL so & becomes &amp; and is valid XML
  return `<Redirect method="POST">${escapeXml(url)}</Redirect>`;
}
function buildActionUrl(baseOrigin, params, path = "voice-twiml") {
  const q = new URLSearchParams(params);
  const origin = baseOrigin.replace(/^http:/, "https:");
  return `${origin}/functions/v1/${path}?${q.toString()}`;
}
function renderMenu(flowId, nodeId, prompt, baseOrigin, attempt, path) {
  const action = buildActionUrl(baseOrigin, {
    flow: flowId,
    node: nodeId,
    attempt: attempt + 1,
  }, path);
  // Escape action URL inside attribute
  const actionAttr = escapeXml(action);
  return `<Gather input="dtmf" numDigits="1" action="${actionAttr}" method="POST"><Say voice="alice">${escapeXml(prompt)}</Say></Gather>`;
}
function renderForward(to, record) {
  const recAttr = record ? ' record="record-from-answer"' : "";
  return `<Dial${recAttr}><Number>${escapeXml(to)}</Number></Dial>`;
}
function renderVoicemail() {
  return `<Say voice="alice">Please leave a message after the tone.</Say><Record maxLength="120" playBeep="true"/><Hangup/>`;
}
Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", {
      headers: corsHeaders,
    });
  try {
    const { to, digits, flowId, nodeId, attempt, baseOrigin } =
      await parseParams(req);
    const pathname = new URL(req.url).pathname;
    const fnPath = pathname.includes("supabase-functions-voice-twiml")
      ? "supabase-functions-voice-twiml"
      : "voice-twiml";
    if (!to)
      return buildTwiML(
        renderSay("Welcome to NumSphere. Please set up your call flow."),
      );
    const flow = flowId
      ? await (async () => {
          const supabase = await getSupabase();
          const { data, error } = await supabase
            .from("call_flows")
            .select("id, flow_json, recording_enabled, recording_disclaimer")
            .eq("id", flowId)
            .maybeSingle();
          if (error) throw error;
          if (data && typeof data.flow_json === "string")
            data.flow_json = JSON.parse(data.flow_json);
          return data;
        })()
      : await loadFlowByPhone(to);
    if (!flow || !flow.flow_json)
      return buildTwiML(renderSay("No flow is configured yet."));
    const nodes = flow.flow_json.nodes || {};
    const startId = nodeId || flow.flow_json.start;
    if (!startId || !nodes[startId])
      return buildTwiML(renderSay("Your call flow is misconfigured."));
    let content = "";
    if (!flowId && flow.recording_enabled) {
      content += renderSay(
        flow.recording_disclaimer || "This call is being recorded.",
      );
    }
    const activeNode = nodes[startId];
    const ensure = (v, d) => v ?? d;
    switch (activeNode.type) {
      case "say": {
        content += renderSay(
          ensure(activeNode.message, "Thank you for calling."),
        );
        content +=
          activeNode.next && nodes[activeNode.next]
            ? redirectTag(
                buildActionUrl(baseOrigin, {
                  flow: flow.id,
                  node: activeNode.next,
                }, fnPath),
              )
            : "<Hangup/>";
        return buildTwiML(content);
      }
      case "menu": {
        const maxAttempts = Number(activeNode.max_attempts ?? 3);
        if (digits) {
          const next = activeNode.options?.[digits];
          if (next && nodes[next]) {
            return buildTwiML(
              content +
                redirectTag(
                  buildActionUrl(baseOrigin, {
                    flow: flow.id,
                    node: next,
                  }, fnPath),
                ),
            );
          }
          if (attempt >= maxAttempts - 1) {
            const failNext = activeNode.on_fail;
            if (failNext && nodes[failNext]) {
              return buildTwiML(
                content +
                  redirectTag(
                    buildActionUrl(baseOrigin, {
                      flow: flow.id,
                      node: failNext,
                    }, fnPath),
                  ),
              );
            }
            return buildTwiML(content + renderVoicemail());
          }
        }
        content += renderMenu(
          flow.id,
          startId,
          ensure(activeNode.prompt, "Please make a selection."),
          baseOrigin,
          attempt,
          fnPath,
        );
        return buildTwiML(content);
      }
      case "forward": {
        const target = activeNode.to;
        if (!target)
          return buildTwiML(
            content + renderSay("Destination not configured.") + "<Hangup/>",
          );
        content += renderForward(target, !!flow.recording_enabled);
        return buildTwiML(content);
      }
      case "voicemail":
        return buildTwiML(content + renderVoicemail());
      case "hangup":
        return buildTwiML(content + "<Hangup/>");
      default:
        return buildTwiML(
          content +
            renderSay("We could not process your request.") +
            "<Hangup/>",
        );
    }
  } catch (err) {
    console.error(err);
    return buildTwiML(
      "<Say>We are experiencing difficulties. Please try again later.</Say>",
    );
  }
});