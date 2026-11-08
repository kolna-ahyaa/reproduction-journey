export async function onRequestPost(context) {
    const { request, env } = context;
    const kv = env.GAME_CODES; // اسم الـ KV Binding

    if (!kv) {
        return new Response(JSON.stringify({ valid: false, reason: "خطأ في إعداد الخادم (KV غير مربوط)" }), {
            status: 500,
            headers: { "Content-Type": "application/json" }
        });
    }

    try {
        const { code } = await request.json();
        if (!code) {
            return new Response(JSON.stringify({ valid: false, reason: "لم يتم إرسال كود" }), { status: 400 });
        }

        const upperCode = code.trim().toUpperCase();
        const kvKey = `code:${upperCode}`;

        // 1. البحث عن الكود في قاعدة البيانات
        const codeData = await kv.get(kvKey);

        if (!codeData) {
            return new Response(JSON.stringify({ valid: false, reason: "هذا الكود غير موجود أو تم استخدامه مسبقاً" }), { status: 200 });
        }

        const data = JSON.parse(codeData);

        // 2. التحقق من تاريخ الانتهاء (إذا كان مخزناً)
        if (data.expiresAt && Date.now() > data.expiresAt) {
            await kv.delete(kvKey); // حذف الكود المنتهي
            return new Response(JSON.stringify({ valid: false, reason: "انتهت صلاحية هذا الكود" }), { status: 200 });
        }

        // 3. الكود صالح! نقوم بحذفه (شطبه) حتى لا يستخدم مرة أخرى
        await kv.delete(kvKey);

        return new Response(JSON.stringify({ valid: true, message: "تم التفعيل بنجاح!" }), {
            status: 200,
            headers: { "Content-Type": "application/json" }
        });

    } catch (err) {
        return new Response(JSON.stringify({ valid: false, reason: err.message }), { status: 500 });
    }
            }
