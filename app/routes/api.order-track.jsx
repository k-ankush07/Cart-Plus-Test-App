import { json } from "@remix-run/node";

export async function action({ request }) {
  try {
    const data = await request.json();

    console.log("🔥 Order Revenue Data:", data);


    return json({ success: true });
  } catch (err) {
    console.error(err);
    return json({ success: false }, { status: 500 });
  }
}