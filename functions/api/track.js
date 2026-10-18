export async function onRequestPost(context) {
  const { request, env } = context;
  const kv = env.GAME_ANALYTICS;
  if (!kv) return new Response(JSON.stringify({ error: "KV not bound" }), { status: 500 });

  try {
    const country = request.cf?.country || request.headers.get('CF-IPCountry') || 'XX';
    const ua = request.headers.get('User-Agent') || '';
    let device = 'desktop';
    if (/Mobi|Android|iPhone|iPad|iPod/i.test(ua)) {
      device = /iPad|Tablet/i.test(ua) ? 'tablet' : 'mobile';
    }

    const today = new Date().toISOString().split('T')[0];
    const keys = {
      total: 'total_visits',
      today: `today_${today}`,
      country: `country_${country}`,
      device: `device_${device}`
    };

    const [totalStr, todayStr, countryStr, deviceStr] = await Promise.all([
      kv.get(keys.total), kv.get(keys.today), kv.get(keys.country), kv.get(keys.device)
    ]);

    await Promise.all([
      kv.put(keys.total, (parseInt(totalStr || '0', 10) + 1).toString()),
      kv.put(keys.today, (parseInt(todayStr || '0', 10) + 1).toString()),
      kv.put(keys.country, (parseInt(countryStr || '0', 10) + 1).toString()),
      kv.put(keys.device, (parseInt(deviceStr || '0', 10) + 1).toString())
    ]);

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function onRequestOptions() {
  return new Response(null, { status: 200, headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" } });
      }
