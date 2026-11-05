// app.js - نظام الامتحانات الاحترافي مع عناصر التحفيز (Gamification) لمنصة كلنا أحياء V2

// 1. نظام المؤثرات الصوتية برمجياً عبر الـ Web Audio API
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function playSystemSound(type) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'correct') {
        osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start(); osc.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'wrong') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(100, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
        osc.start(); osc.stop(audioCtx.currentTime + 0.25);
    } else if (type === 'click') {
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
        osc.start(); osc.stop(audioCtx.currentTime + 0.05);
    }
}

// 2. متغيرات الحالة العامة للتطبيق
let filteredQuestions = [];
let currentQuestionIndex = 0;
let liveCorrectCount = 0;
let liveWrongCount = 0;
let streakCount = 0; // عداد السلسلة المتتالية
let isAnswered = false;
let selectedTopics = [];
let currentChapterData = typeof examsData !== 'undefined' ? examsData : []; 
let currentChapterName = 'reproduction';
let isGeneticsUnlocked = localStorage.getItem('kolona_ahya_genetics_unlocked') === 'true';
let confettiAnimationId = null;
// متغيرات حالة الاشتراك (Subscription State)
let isSubscribed = localStorage.getItem('kolona_subscribed') === 'true';
let subscriptionExpiry = localStorage.getItem('kolona_subscription_expiry') || null;

// 3. جلب عناصر الـ DOM للتحكم بالواجهات والشاشات
const resumeScreen = document.getElementById('resume-screen');
const chaptersScreen = document.getElementById('chapters-screen');
const topicsScreen = document.getElementById('topics-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const paywallScreen = document.getElementById('paywall-screen');

// عناصر الامتحان والعدادات
const examYear = document.getElementById('exam-year');
const questionCounter = document.getElementById('question-counter');
const progressFill = document.getElementById('progress-fill');
const questionText = document.getElementById('question-text');
const questionTopic = document.getElementById('question-topic');
const optionsContainer = document.getElementById('options-container');
const liveCorrect = document.getElementById('live-correct');
const liveWrong = document.getElementById('live-wrong');
const streakCounter = document.getElementById('streak-counter');

// أزرار التحكم والـ Modals والعناصر التفاعلية
const nextBtn = document.getElementById('next-btn');
const skipBtn = document.getElementById('skip-btn');
const activationModal = document.getElementById('activation-modal');
const modalMessageText = document.getElementById('modal-message-text');
const toastMsg = document.getElementById('toast-msg');
const confettiCanvas = document.getElementById('canvas-confetti');

function saveProgress() {
    const sessionData = {
        index: currentQuestionIndex,
        correct: liveCorrectCount,
        wrong: liveWrongCount,
        streak: streakCount,
        topics: selectedTopics,
        chapterName: currentChapterName // حفظ اسم الباب للاستئناف الصحيح
    };
    localStorage.setItem('kolona_ahya_save', JSON.stringify(sessionData));
}

function checkSavedProgress() {
    const saved = localStorage.getItem('kolona_ahya_save');
    if (saved) {
        resumeScreen.classList.remove('hidden');
        chaptersScreen.classList.add('hidden');
    } else {
        initApp();
    }
}

// 5. تهيئة التطبيق الأساسي وعرض الأبواب
function initApp() {
// فحص تاريخ انتهاء الاشتراك
if (isSubscribed && subscriptionExpiry) {
    if (new Date() > new Date(subscriptionExpiry)) {
        localStorage.removeItem('kolona_subscribed');
        localStorage.removeItem('kolona_subscription_expiry');
        isSubscribed = false;
        alert("انتهت صلاحية اشتراكك. يرجى التجديد للاستمرار.");
    }
        }  
    
    resumeScreen.classList.add('hidden');
    resultScreen.classList.add('hidden');
    quizScreen.classList.add('hidden');
    topicsScreen.classList.add('hidden');
    paywallScreen.classList.add('hidden');
    chaptersScreen.classList.remove('hidden');
    stopConfetti();
    setupChapterListeners();
}

function setupChapterListeners() {
    // 1. عند الضغط على باب التكاثر
    document.getElementById('chapter-reproduction').onclick = () => {
        playSystemSound('click');
        currentChapterData = examsData;
        currentChapterName = 'reproduction';
        showTopicsScreen();
    };

    // 2. عند الضغط على باب الوراثة
    const geneticsCard = document.getElementById('chapter-genetics') || document.querySelector('.chapter-card.locked');
    if (geneticsCard) {
        geneticsCard.onclick = () => {
    if (isSubscribed) {
        // إذا كان مشتركاً، افتح الباب مباشرة
        playSystemSound('click');
        currentChapterData = geneticsData;
        currentChapterName = 'genetics';
        showTopicsScreen();
    } else {
        // إذا لم يكن مشتركاً، أظهر شاشة القفل (وليس التنبيه)
        playSystemSound('wrong');
        chaptersScreen.classList.add('hidden');
        document.getElementById('genetics-lock-screen').classList.remove('hidden');
    }
};
    }

    // 3. باب النظام البيئي (سنعدله في الخطوة الرابعة)
    document.querySelectorAll('.chapter-card.locked').forEach(card => {
        if (card !== geneticsCard) {
            card.onclick = () => {
                playSystemSound('wrong');
                alert("باب النظام البيئي قريباً! 🌿");
            };
        }
    });
}


// عرض المواضيع بناءً على الباب النشط حالياً
function showTopicsScreen() {
    chaptersScreen.classList.add('hidden');
    topicsScreen.classList.remove('hidden');
    
    // تعديل العنوان ديناميكياً حسب الباب الحالي
    const topicsTitle = document.querySelector('#topics-screen h2');
    if (topicsTitle) {
        topicsTitle.textContent = currentChapterName === 'reproduction' ? "مواضيع باب التكاثر 📑" : "مواضيع باب الوراثة 📑";
    }
    
    // استخراج المواضيع الفرعية الفريدة من الباب المختار حالياً
    const uniqueTopics = [...new Set(currentChapterData.map(q => q.topic))];
    const container = document.getElementById('topics-list-container');
    container.innerHTML = '';

    uniqueTopics.forEach(topic => {
        const item = document.createElement('label');
        item.classList.add('topic-item');
        item.innerHTML = `
            <input type="checkbox" value="${topic}" checked class="topic-checkbox">
            <span>${topic}</span>
        `;
        container.appendChild(item);
    });
}

// بدء الامتحان المفلتر من الباب النشط
function startQuiz(isResuming = false) {
    if (isResuming) {
        const saved = JSON.parse(localStorage.getItem('kolona_ahya_save'));
        selectedTopics = saved.topics;
        currentQuestionIndex = saved.index;
        liveCorrectCount = saved.correct;
        liveWrongCount = saved.wrong;
        streakCount = saved.streak || 0;
        currentChapterName = saved.chapterName || 'reproduction';
        currentChapterData = currentChapterName === 'reproduction' ? examsData : geneticsData;
    } else {
        const checkboxes = document.querySelectorAll('.topic-checkbox');
        selectedTopics = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);
        
        if (selectedTopics.length === 0) {
            alert('الرجاء اختيار موضوع واحد على الأقل للمذاكرة!');
            return;
        }
        currentQuestionIndex = 0;
        liveCorrectCount = 0;
        liveWrongCount = 0;
        streakCount = 0;
    }

    // الفلترة تتم الآن من currentChapterData المختار بدلاً من examsData الثابتة
    filteredQuestions = currentChapterData.filter(q => selectedTopics.includes(q.topic));
    
    liveCorrect.textContent = liveCorrectCount;
    liveWrong.textContent = liveWrongCount;
    updateStreakDisplay();

    topicsScreen.classList.add('hidden');
    resumeScreen.classList.add('hidden');
    quizScreen.classList.remove('hidden');
    
    showQuestion();
}


// تحديث مظهر عداد السلسلة وإشعاله إذا لزم الأمر
function updateStreakDisplay() {
    streakCounter.textContent = `🔥 × ${streakCount}`;
    if (streakCount >= 3) {
        streakCounter.classList.add('streak-active');
    } else {
        streakCounter.classList.remove('streak-active');
    }
}

// عرض رسالة الـ Toast المنبثقة (Duolingo Style)
function showToastMessage() {
    toastMsg.classList.add('show');
    setTimeout(() => {
        toastMsg.classList.remove('show');
    }, 2000);
}

// 8. دورة عرض السؤال ومعالجة الإجابات والتخطي
function showQuestion() {
 // فخ الـ 60 سؤالاً (Paywall)
if (!isSubscribed && currentChapterName === 'reproduction' && currentQuestionIndex === 60) {
    quizScreen.classList.add('hidden');
    paywallScreen.classList.remove('hidden');
    return;
}
    isAnswered = false;
    nextBtn.classList.add('disabled');
    nextBtn.disabled = true;
    skipBtn.classList.remove('hidden');
    nextBtn.textContent = (currentQuestionIndex === filteredQuestions.length - 1) ? "عرض النتيجة" : "السؤال التالي";
    
    optionsContainer.innerHTML = '';

    if (currentQuestionIndex >= filteredQuestions.length) {
        showFinalResult();
        return;
    }

    const currentQuestion = filteredQuestions[currentQuestionIndex];
    examYear.textContent = currentQuestion.year;
    questionTopic.textContent = currentQuestion.topic;
    questionText.textContent = currentQuestion.text;
    questionCounter.textContent = `السؤال: ${currentQuestionIndex + 1} / ${filteredQuestions.length}`;
    
    const progressPercent = ((currentQuestionIndex + 1) / filteredQuestions.length) * 100;
    progressFill.style.width = `${progressPercent}%`;

    currentQuestion.options.forEach((option, index) => {
        const card = document.createElement('div');
        card.textContent = option;
        card.classList.add('option-card');
        card.onclick = () => handleOptionSelection(card, index, currentQuestion.answer);
        optionsContainer.appendChild(card);
    });
    
    saveProgress();
}

function handleOptionSelection(card, selectedIndex, correctIndex) {
    if (isAnswered) return;
    isAnswered = true;

    const cards = optionsContainer.getElementsByClassName('option-card');
    if (selectedIndex === correctIndex) {
        playSystemSound('correct');
        card.classList.add('correct', 'correct-pop');
        liveCorrectCount++;
        liveCorrect.textContent = liveCorrectCount;
        
        streakCount++;
        if (streakCount === 3 || streakCount === 6 || streakCount === 10) {
            showToastMessage();
        }
    } else {
        playSystemSound('wrong');
        card.classList.add('wrong');
        cards[correctIndex].classList.add('correct');
        liveWrongCount++;
        liveWrong.textContent = liveWrongCount;
        
        streakCount = 0; // انقطاع السلسلة عند الخطأ
    }

    updateStreakDisplay();
    nextBtn.classList.remove('disabled');
    nextBtn.disabled = false;
    saveProgress();
}

// تفعيل زر التخطي (لم ندرسه بعد) دون كسر السلسلة أو التأثير على النقاط
skipBtn.onclick = () => {
    playSystemSound('click');
    currentQuestionIndex++;
    if (currentQuestionIndex < filteredQuestions.length) {
        showQuestion();
    } else {
        showFinalResult();
    }
};

nextBtn.onclick = () => {
    playSystemSound('click');
    currentQuestionIndex++;
    if (currentQuestionIndex < filteredQuestions.length) {
        showQuestion();
    } else {
        showFinalResult();
    }
};

// 9. إنهاء الامتحان وعرض النتيجة والتقييم الذكي بالنجوم
function showFinalResult() {
    quizScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');
    
    const scorePercentage = (liveCorrectCount / filteredQuestions.length) * 100;
    // استكمال دالة عرض النتيجة وتوزيع النجوم
    const starsRating = document.getElementById('stars-rating');
    const performanceText = document.getElementById('performance-text');
    
    if (scorePercentage >= 90) {
        starsRating.textContent = "⭐⭐⭐";
        performanceText.textContent = "أسطورة! 🏆";
        performanceText.className = "performance-badge badge-legend";
        startConfetti(); // تشغيل الورق الملون
    } else if (scorePercentage >= 50) {
        starsRating.textContent = "⭐⭐";
        performanceText.textContent = "عمل جيد! 💪";
        performanceText.className = "performance-badge badge-good";
    } else {
        starsRating.textContent = "⭐";
        performanceText.textContent = "يحتاج مراجعة 📚";
        performanceText.className = "performance-badge badge-review";
    }
    
    document.getElementById('final-score').textContent = `${liveCorrectCount} / ${filteredQuestions.length}`;
    localStorage.removeItem('kolona_ahya_save'); // تصفير الحفظ بعد النتيجة
}

// 10. نظام الاحتفال (Confetti) برمجياً
function startConfetti() {
    confettiCanvas.classList.remove('hidden');
    const ctx = confettiCanvas.getContext('2d');
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
    let particles = [];
    
    for(let i = 0; i < 100; i++) {
        particles.push({
            x: Math.random() * confettiCanvas.width,
            y: Math.random() * confettiCanvas.height - confettiCanvas.height,
            w: Math.random() * 10 + 5,
            h: Math.random() * 10 + 5,
            c: ['#eab308', '#3b82f6', '#22c55e', '#ef4444', '#ec4899'][Math.floor(Math.random() * 5)],
            vx: Math.random() * 4 - 2,
            vy: Math.random() * 5 + 2
        });
    }
    
    function update() {
        ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            ctx.fillStyle = p.c;
            ctx.fillRect(p.x, p.y, p.w, p.h);
            if (p.y > confettiCanvas.height) p.y = -10;
        });
        confettiAnimationId = requestAnimationFrame(update);
    }
    update();
}

function stopConfetti() {
    if (confettiAnimationId) {
        cancelAnimationFrame(confettiAnimationId);
        confettiAnimationId = null;
    }
    confettiCanvas.classList.add('hidden');
    const ctx = confettiCanvas.getContext('2d');
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
}

// 11. ربط أزرار التحكم المتبقية وتشغيل التطبيق
document.getElementById('back-to-chapters').onclick = () => {
    playSystemSound('click');
    initApp();
};

document.getElementById('select-all-topics').onclick = () => {
    playSystemSound('click');
    const checkboxes = document.querySelectorAll('.topic-checkbox');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    checkboxes.forEach(cb => cb.checked = !allChecked);
};

document.getElementById('start-filtered-quiz').onclick = () => {
    playSystemSound('click');
    startQuiz(false);
};

document.getElementById('resume-btn').onclick = () => {
    playSystemSound('click');
    startQuiz(true);
};

document.getElementById('clear-save-btn').onclick = () => {
    playSystemSound('click');
    localStorage.removeItem('kolona_ahya_save');
    initApp();
};

document.getElementById('restart-btn').onclick = () => {
    playSystemSound('click');
    initApp();
};

document.getElementById('activate-close-btn').onclick = () => {
    playSystemSound('click');
    activationModal.classList.add('hidden');
};

// تشغيل التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    checkSavedProgress();
});    
// زر العودة من شاشة الدفع
const backToMenuBtn = document.getElementById('back-to-menu-btn');
if (backToMenuBtn) {
    backToMenuBtn.onclick = () => {
        playSystemSound('click');
        localStorage.removeItem('kolona_ahya_save');
        initApp();
    };
}
// دالة تفعيل الاشتراك (تُستدعى عند إدخال كود صحيح)
function activateSubscription(expiryDate) {
    isSubscribed = true;
    subscriptionExpiry = expiryDate;
    localStorage.setItem('kolona_subscribed', 'true');
    localStorage.setItem('kolona_subscription_expiry', expiryDate);
    alert("🎉 تم تفعيل الاشتراك بنجاح! استمتع بجميع الأبواب.");
    initApp(); // العودة للقائمة الرئيسية
    }
// ==========================================
// 12. نظام لوحة الأدمن وتوليد الأكواد
// ==========================================

// متغيرات لوحة الأدمن
let adminClickCount = 0;
let adminClickTimer = null;
const ADMIN_PASSWORD = "0907840150";

// 1. فتح لوحة الأدمن بالضغط 5 مرات على العنوان
const mainTitle = document.querySelector('#chapters-screen h1');
if (mainTitle) {
    mainTitle.addEventListener('click', () => {
        adminClickCount++;
        if (adminClickCount === 1) {
            adminClickTimer = setTimeout(() => { adminClickCount = 0; }, 2000); // تصفير العداد بعد ثانيتين
        }
        if (adminClickCount >= 5) {
            clearTimeout(adminClickTimer);
            adminClickCount = 0;
            document.getElementById('admin-auth-modal').classList.remove('hidden');
        }
    });
}

// 2. التحقق من كلمة المرور
const adminLoginBtn = document.getElementById('admin-login-btn');
if (adminLoginBtn) {
    adminLoginBtn.onclick = () => {
        const pass = document.getElementById('admin-pass-input').value;
        if (pass === ADMIN_PASSWORD) {
            document.getElementById('admin-auth-modal').classList.add('hidden');
            document.getElementById('admin-pass-input').value = '';
            document.getElementById('admin-panel').classList.remove('hidden');
            // تعيين تاريخ افتراضي (15 مايو 2027)
            document.getElementById('admin-expiry-date').value = "2027-05-15";
        } else {
            alert("كلمة المرور خاطئة!");
        }
    };
}

// 3. توليد الكود
const generateCodeBtn = document.getElementById('generate-code-btn');
if (generateCodeBtn) {
    generateCodeBtn.onclick = () => {
        const dateVal = document.getElementById('admin-expiry-date').value; // YYYY-MM-DD
        if (!dateVal) return alert("اختر تاريخ الانتهاء أولاً");

        // تحويل التاريخ إلى صيغة YYMMDD
        const dateObj = new Date(dateVal);
        const yy = String(dateObj.getFullYear()).slice(-2);
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        const dateStr = `${yy}${mm}${dd}`;

        // توليد رقم تحقق عشوائي (حرفين)
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        const checksum = chars.charAt(Math.floor(Math.random() * 26)) + chars.charAt(Math.floor(Math.random() * 26));
        
        const code = `V2-${dateStr}-${checksum}`;

        document.getElementById('generated-code-text').textContent = code;
        document.getElementById('generated-code-box').classList.remove('hidden');
    };
}

// 4. نسخ الكود
const copyCodeBtn = document.getElementById('copy-code-btn');
if (copyCodeBtn) {
    copyCodeBtn.onclick = () => {
        const codeText = document.getElementById('generated-code-text').textContent;
        navigator.clipboard.writeText(codeText).then(() => {
            alert("📋 تم نسخ الكود!");
        });
    };
}

// إغلاق اللوحة
document.getElementById('admin-cancel-btn').onclick = () => document.getElementById('admin-auth-modal').classList.add('hidden');
document.getElementById('admin-close-panel-btn').onclick = () => document.getElementById('admin-panel').classList.add('hidden');


// 5. شاشة إدخال الكود للطالب
// ربط الزر الذي يفتح شاشة إدخال الكود (سنستخدم زر الواتساب في شاشة القفل ونضيف بجانبه زر إدخال الكود)
const studentSubmitBtn = document.getElementById('student-submit-code-btn');
if (studentSubmitBtn) {
    studentSubmitBtn.onclick = () => {
        const code = document.getElementById('student-code-input').value.trim().toUpperCase();
        const errorDiv = document.getElementById('student-code-error');
        
        // التحقق من الصيغة: V2-YYMMDD-XX
        const regex = /^V2-(\d{2})(\d{2})(\d{2})-[A-Z]{2}$/;
        const match = code.match(regex);

        if (!match) {
            errorDiv.textContent = "صيغة الكود غير صحيحة.";
            return;
        }

        const yy = match[1];
        const mm = match[2];
        const dd = match[3];
        const expiryDate = `20${yy}-${mm}-${dd}`; // YYYY-MM-DD

        // التحقق من التاريخ
        const today = new Date();
        const expiry = new Date(expiryDate);

        if (isNaN(expiry.getTime())) {
            errorDiv.textContent = "تاريخ الكود غير صالح.";
            return;
        }

        if (today > expiry) {
            errorDiv.textContent = "عذراً، هذا الكود انتهت صلاحيته.";
            return;
        }

        // إذا كان كل شيء صحيحاً
        document.getElementById('student-code-modal').classList.add('hidden');
        document.getElementById('student-code-input').value = '';
        errorDiv.textContent = '';
        
        // تفعيل الاشتراك
        activateSubscription(expiryDate);
    };
}

if (document.getElementById('student-cancel-code-btn')) {
    document.getElementById('student-cancel-code-btn').onclick = () => {
        document.getElementById('student-code-modal').classList.add('hidden');
    };
        }
const geneticsLockBackBtn = document.getElementById('genetics-lock-back-btn');
if (geneticsLockBackBtn) {
    geneticsLockBackBtn.onclick = () => {
        playSystemSound('click');
        initApp();
    };
}
