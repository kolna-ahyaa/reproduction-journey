export async function onRequestPost(context) {
  const { env } = context;
  const kv = env.GAME_ANALYTICS;

  if (!kv) {
    return new Response(JSON.stringify({ 
      error: "KV not bound",
      hint: "GAME_ANALYTICS binding not found"
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const today = new Date().toISOString().split('T')[0];
    const totalStr = await kv.get('total_visits');
    const todayStr = await kv.get(`today_${today}`);
    
    let total = parseInt(totalStr || '0', 10);
    let todayCount = parseInt(todayStr || '0', 10);

    total += 1;
    todayCount += 1;

    await kv.put('total_visits', total.toString());
    await kv.put(`today_${today}`, todayCount.toString());

    return new Response(JSON.stringify({
      success: true,
      total: total,
      today: todayCount
    }), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });

  } catch (err) {
    return new Response(JSON.stringify({ 
      error: err.message 
    }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type"
    }
  });
                                       }
