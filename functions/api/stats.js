export async function onRequestGet(context) {
  const { env } = context;
  const kv = env.GAME_ANALYTICS;
  if (!kv) return new Response("KV not bound", { status: 500 });

  try {
    const today = new Date().toISOString().split('T')[0];
    
    const totalStr = await kv.get('total_visits');
    const todayStr = await kv.get(`today_${today}`);
    
    // جلب الأجهزة ديناميكياً
    const devices = {};
    const deviceList = await kv.list({ prefix: 'device_' });
    for (const key of deviceList.keys) {
      const type = key.name.replace('device_', '');
      const count = await kv.get(key.name);
      devices[type] = parseInt(count, 10);
    }

    // جلب الدول ديناميكياً (أي دولة في العالم)
    const countries = {};
    const countryList = await kv.list({ prefix: 'country_' });
    for (const key of countryList.keys) {
      const code = key.name.replace('country_', '');
      const count = await kv.get(key.name);
      countries[code] = parseInt(count, 10);
    }

    const result = {
      total_visits: parseInt(totalStr || '0', 10),
      today_visits: parseInt(todayStr || '0', 10),
      countries: countries,
      devices: devices,
      date: today
    };

    return new Response(JSON.stringify(result, null, 2), {
      status: 200, 
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" }
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
                                    }
