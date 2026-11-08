export async function onRequestPost(context) {
    const { request, env } = context;
    const kv = env.GAME_CODES;

    if (!kv) {
        return new Response(JSON.stringify({ success: false, error: "KV not bound" }), { status: 500 });
    }

    try {
        const { code, expiryTimestamp, adminPassword } = await request.json();

        // التحقق من كلمة مرور الأدمن (يمكنك تغييرها هنا أو جلبها من متغيرات البيئة)
        if (adminPassword !== '0907840150') {
            return new Response(JSON.stringify({ success: false, error: "غير مصرح لك بتوليد الأكواد" }), { status: 401 });
        }

        if (!code || !expiryTimestamp) {
            return new Response(JSON.stringify({ success: false, error: "بيانات ناقصة" }), { status: 400 });
        }

        const kvKey = `code:${code.toUpperCase()}`;
        const kvValue = JSON.stringify({ expiresAt: expiryTimestamp });

        // حفظ الكود في قاعدة البيانات
        await kv.put(kvKey, kvValue);

        return new Response(JSON.stringify({ success: true, message: "تم حفظ الكود بنجاح" }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (err) {
        return new Response(JSON.stringify({ success: false, error: err.message }), { status: 500 });
    }
          }
