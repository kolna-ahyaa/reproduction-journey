export async function onRequestGet(context) {
  const { env } = context;
  const kv = env.GAME_ANALYTICS;
  if (!kv) return new Response(JSON.stringify({ error: "KV not bound" }), { status: 500 });

  try {
    const today = new Date().toISOString().split('T')[0];
    const totalStr = await kv.get('total_visits');
    const todayStr = await kv.get(`today_${today}`);

    const countryCodes = ['SD', 'SA', 'EG', 'AE', 'US', 'GB', 'XX']; 
    const countries = {};
    for (const code of countryCodes) {
      const count = await kv.get(`country_${code}`);
      if (count) countries[code] = parseInt(count, 10);
    }

    const devices = {};
    for (const type of ['mobile', 'desktop', 'tablet']) {
      const count = await kv.get(`device_${type}`);
      if (count) devices[type] = parseInt(count, 10);
    }

    return new Response(JSON.stringify({
      total_visits: parseInt(totalStr || '0', 10),
      today_visits: parseInt(todayStr || '0', 10),
      countries: countries,
      devices: devices,
      date: today
    }, null, 2), {
      status: 200, headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
      }
