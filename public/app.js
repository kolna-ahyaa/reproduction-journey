// app.js - النظام المطور لإدارة مركز امتحانات منصة كلنا أحياء V2

// 1. إعداد نظام المؤثرات الصوتية (برمجياً عبر الـ Web Audio API دون ملفات خارجية)
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

// 2. تعريف متغيرات الحالة العامة للتطبيق
let filteredQuestions = [];
let currentQuestionIndex = 0;
let liveCorrectCount = 0;
let liveWrongCount = 0;
let isAnswered = false;
let selectedTopics = [];

// 3. جلب عناصر الـ DOM للتحكم بالشاشات والواجهات
const resumeScreen = document.getElementById('resume-screen');
const chaptersScreen = document.getElementById('chapters-screen');
const topicsScreen = document.getElementById('topics-screen');
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');

// عناصر الامتحان الداخلي
const examYear = document.getElementById('exam-year');
const questionCounter = document.getElementById('question-counter');
const progressFill = document.getElementById('progress-fill');
const questionText = document.getElementById('question-text');
const questionTopic = document.getElementById('question-topic');
const optionsContainer = document.getElementById('options-container');
const liveCorrect = document.getElementById('live-correct');
const liveWrong = document.getElementById('live-wrong');

// الأزرار والـ Modals
const nextBtn = document.getElementById('next-btn');
const skipBtn = document.getElementById('skip-btn');
const activationModal = document.getElementById('activation-modal');
const modalMessageText = document.getElementById('modal-message-text');

// 4. نظام الحفظ التلقائي في الـ LocalStorage
function saveProgress() {
    const sessionData = {
        index: currentQuestionIndex,
        correct: liveCorrectCount,
        wrong: liveWrongCount,
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
    
    setupChapterListeners();
}

// إعداد أحداث النقر للأبواب والأقفال
function setupChapterListeners() {
    document.getElementById('chapter-reproduction').onclick = () => {
        playSystemSound('click');
        showTopicsScreen();
    };

    // إدارة الأبواب المقفلة
    document.querySelectorAll('.chapter-card.locked').forEach(card => {
        card.onclick = () => {
            playSystemSound('wrong');
            modalMessageText.textContent = card.getAttribute('data-msg');
            activationModal.classList.remove('hidden');
        };
    });
}

// 6. شاشة تفريغ وتصفية المواضيع الدقيقة (Sub-Topics)
function showTopicsScreen() {
    chaptersScreen.classList.add('hidden');
    topicsScreen.classList.remove('hidden');
    
    // استخراج المواضيع الفرعية الفريدة من ملف البيانات تلقائياً
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

// 7. تشغيل وبدء الامتحان بناءً على الفلترة والتصفية
function startQuiz(isResuming = false) {
    if (isResuming) {
        const saved = JSON.parse(localStorage.getItem('kolona_ahya_save'));
        selectedTopics = saved.topics;
        currentQuestionIndex = saved.index;
        liveCorrectCount = saved.correct;
        liveWrongCount = saved.wrong;
    } else {
        // جمع المواضيع المختارة من الـ Checkboxes
        const checkboxes = document.querySelectorAll('.topic-checkbox');
        selectedTopics = Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);
        
        if (selectedTopics.length === 0) {
            alert('الرجاء اختيار موضوع واحد على الأقل للمذاكرة!');
            return;
        }
        currentQuestionIndex = 0;
        liveCorrectCount = 0;
        liveWrongCount = 0;
    }

    // فلترة المصفوفة الأساسية
    filteredQuestions = examsData.filter(q => selectedTopics.includes(q.topic));
    
    // تحديث لوحة النقاط المباشرة بالواجهة
    liveCorrect.textContent = liveCorrectCount;
    liveWrong.textContent = liveWrongCount;

    topicsScreen.classList.add('hidden');
    resumeScreen.classList.add('hidden');
    quizScreen.classList.remove('hidden');
    
    showQuestion();
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
    
    saveProgress(); // حفظ خطوة خطوة في المتصفح
}

function handleOptionSelection(card, selectedIndex, correctIndex) {
    if (isAnswered) return;
    isAnswered = true;

    const cards = optionsContainer.getElementsByClassName('option-card');
    if (selectedIndex === correctIndex) {
        playSystemSound('correct');
        card.classList.add('correct');
        liveCorrectCount++;
        liveCorrect.textContent = liveCorrectCount;
    } else {
        playSystemSound('wrong');
        card.classList.add('wrong');
        cards[correctIndex].classList.add('correct');
        liveWrongCount++;
        liveWrong.textContent = liveWrongCount;
    }

    nextBtn.classList.remove('disabled');
    nextBtn.disabled = false;
    saveProgress();
}

// تفعيل زر التخطي (لم ندرسه بعد) دون احتساب خطأ أو صواب
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

// 9. إنهاء الامتحان وعرض النتيجة وتصفير الحفظ
function showFinalResult() {
    quizScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');
    
    // احتساب الدرجة الإجمالية بناءً على ما حله الطالب فعلياً (الصحيح من إجمالي الفلترة)
    document.getElementById('final-score').textContent = `${liveCorrectCount} / ${filteredQuestions.length}`;
    localStorage.removeItem('kolona_ahya_save'); // حذف الحفظ التلقائي لاكتمال الامتحان بنجاح
}

// 10. ربط أحداث أزرار التحكم بالشاشات والـ Modals
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
// 11. تشغيل التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    checkSavedProgress();
});

// ربط زر (البدء من جديد) في شاشة الاستئناف
document.getElementById('clear-save-btn').onclick = () => {
    playSystemSound('click');
    localStorage.removeItem('kolona_ahya_save');
    initApp();
};

// ربط زر (العودة للقائمة الرئيسية) في شاشة النتيجة
document.getElementById('restart-btn').onclick = () => {
    playSystemSound('click');
    initApp();
};

// إغلاق نافذة التفعيل (Modal) عند الضغط على إلغاء
document.getElementById('activate-close-btn').onclick = () => {
    playSystemSound('click');
    activationModal.classList.add('hidden');
};
