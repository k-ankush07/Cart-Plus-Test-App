
export async function action({ request }) {
  try {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");

    const raw = await request.text();
    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      return Response.json({ success: false, error: "invalid json" }, { status: 400 });
    }

    if (!body.shop && shop) body.shop = shop;
    const apiUrl = process.env.PUBLIC_REACT_APP_API_URL?.trim();

    const expressRes = await fetch(`${apiUrl}/api/order-revenue`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const expressJson = await expressRes.json();
    console.log(" [proxy-order-track] express response:", JSON.stringify(expressJson));

    return Response.json({ success: true }, {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch (err) {
    console.error(" [proxy-order-track] error:", err);
    return Response.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function loader() {
  return Response.json({}, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
    },
  });
}
