export async function onRequestGet(context) {
  const { env } = context;
  const kv = env.GAME_ANALYTICS;
  if (!kv) return new Response(JSON.stringify({ error: "KV not bound" }), { status: 500, headers: { "Content-Type": "application/json" } });
  try {
    const today = new Date().toISOString().split('T')[0];
    const totalStr = await kv.get('total_visits');
    const todayStr = await kv.get(`today_${today}`);
    return new Response(JSON.stringify({ total_visits: parseInt(totalStr || '0', 10), today_visits: parseInt(todayStr || '0', 10), date: today }), { status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
  }
                                                                 }
