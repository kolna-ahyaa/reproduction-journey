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
let confettiAnimationId = null;

// 3. جلب عناصر الـ DOM للتحكم بالواجهات والشاشات
const resumeScreen = document.getElementById('resume-screen');
const chaptersScreen = document.getElementById('chapters-screen');
const topicsScreen = document.getElementById('topics-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');

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

// 4. نظام الحفظ التلقائي في الـ LocalStorage
function saveProgress() {
    const sessionData = {
        index: currentQuestionIndex,
        correct: liveCorrectCount,
        wrong: liveWrongCount,
        streak: streakCount,
        topics: selectedTopics
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
    resumeScreen.classList.add('hidden');
    resultScreen.classList.add('hidden');
    quizScreen.classList.add('hidden');
    topicsScreen.classList.add('hidden');
    chaptersScreen.classList.remove('hidden');
    stopConfetti();
    setupChapterListeners();
}

function setupChapterListeners() {
    document.getElementById('chapter-reproduction').onclick = () => {
        playSystemSound('click');
        showTopicsScreen();
    };

    document.querySelectorAll('.chapter-card.locked').forEach(card => {
        card.onclick = () => {
            playSystemSound('wrong');
            modalMessageText.textContent = card.getAttribute('data-msg');
            activationModal.classList.remove('hidden');
        };
    });
}

// 6. شاشة تصفية المواضيع الدقيقة (Sub-Topics)
function showTopicsScreen() {
    chaptersScreen.classList.add('hidden');
    topicsScreen.classList.remove('hidden');
    
    const uniqueTopics = [...new Set(examsData.map(q => q.topic))];
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

// 7. تشغيل وبدء الامتحان بناءً على التصفية والحفظ
function startQuiz(isResuming = false) {
    if (isResuming) {
        const saved = JSON.parse(localStorage.getItem('kolona_ahya_save'));
        selectedTopics = saved.topics;
        currentQuestionIndex = saved.index;
        liveCorrectCount = saved.correct;
        liveWrongCount = saved.wrong;
        streakCount = saved.streak || 0;
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

    filteredQuestions = examsData.filter(q => selectedTopics.includes(q.topic));
    
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
