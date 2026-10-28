// app.js - منطق التحكم وإدارة اختبار منصة كلنا أحياء

// 1. تعريف المتغيرات الأساسية لإدارة حالة الاختبار
let currentQuestionIndex = 0;
let score = 0;
let isAnswered = false; // لمنع المستخدم من اختيار أكثر من إجابة لنفس السؤال

// 2. جلب عناصر الـ DOM للتحكم بالواجهة
const quizScreen = document.getElementById('quiz-screen');
const resultScreen = document.getElementById('result-screen');
const examYear = document.getElementById('exam-year');
const questionCounter = document.getElementById('question-counter');
const progressFill = document.getElementById('progress-fill');
const questionText = document.getElementById('question-text');
const questionTopic = document.getElementById('question-topic');
const optionsContainer = document.getElementById('options-container');
const nextBtn = document.getElementById('next-btn');
const finalScore = document.getElementById('final-score');
const restartBtn = document.getElementById('restart-btn');

// 3. دالة بدء الاختبار (وتصفير العدادات)
function startQuiz() {
    currentQuestionIndex = 0;
    score = 0;
    resultScreen.classList.add('hidden');
    quizScreen.classList.remove('hidden');
    showQuestion();
}

// 4. دالة عرض السؤال الحالي والخيارات الخاصة به
function showQuestion() {
    resetState();
    
    // جلب بيانات السؤال الحالي من مصفوفة examsData (الموجودة في ملف exams.js)
    const currentQuestion = examsData[currentQuestionIndex];
    
    // تحديث النصوص العلوية وشريط التقدم
    examYear.textContent = currentQuestion.year;
    questionTopic.textContent = currentQuestion.topic;
    questionText.textContent = currentQuestion.text;
    questionCounter.textContent = `السؤال: ${currentQuestionIndex + 1} / ${examsData.length}`;
    
    const progressPercent = ((currentQuestionIndex + 1) / examsData.length) * 100;
    progressFill.style.width = `${progressPercent}%`;
    
    // توليد بطاقات خيارات الإجابة ديناميكياً
    currentQuestion.options.forEach((option, index) => {
        const button = document.createElement('div');
        button.textContent = option;
        button.classList.add('option-card');
        
        // ربط حدث الضغط على الخيار
        button.addEventListener('click', () => selectOption(button, index));
        optionsContainer.appendChild(button);
    });
}

// 5. دالة إعادة تهيئة أزرار التحكم قبل عرض السؤال الجديد
function resetState() {
    isAnswered = false;
    nextBtn.classList.add('disabled');
    nextBtn.disabled = true;
    nextBtn.textContent = (currentQuestionIndex === examsData.length - 1) ? "عرض النتيجة النهائية" : "السؤال التالي";
    
    // مسح الخيارات السابقة من الحاوية
    while (optionsContainer.firstChild) {
        optionsContainer.removeChild(optionsContainer.firstChild);
    }
}

// 6. دالة معالجة اختيار الإجابة وتلوينها (أخضر للصحيح / أحمر للخاطئ)
function selectOption(selectedCard, selectedIndex) {
    if (isAnswered) return; // يمنع الضغط المتكرر بعد اختيار الإجابة
    
    isAnswered = true;
    const currentQuestion = examsData[currentQuestionIndex];
    const correctIndex = currentQuestion.answer;
    const cards = optionsContainer.getElementsByClassName('option-card');
    
    // التحقق من صحة الإجابة وتحديث النتيجة
    if (selectedIndex === correctIndex) {
        selectedCard.classList.add('correct');
        score++;
    } else {
        selectedCard.classList.add('wrong');
        // إظهار الإجابة الصحيحة باللون الأخضر تلقائياً لمساعدة الطالب على التعلم
        cards[correctIndex].classList.add('correct');
    }
    
    // تفعيل زر الانتقال للسؤال التالي
    nextBtn.classList.remove('disabled');
    nextBtn.disabled = false;
}

// 7. دالة معالجة زر الانتقال (للسؤال التالي أو الانتقال لشاشة النهاية)
function handleNextButton() {
    currentQuestionIndex++;
    
    if (currentQuestionIndex < examsData.length) {
        showQuestion();
    } else {
        showResult();
    }
}

// 8. دالة عرض الشاشة الاحتفالية والنتيجة النهائية
function showResult() {
    quizScreen.classList.add('hidden');
    resultScreen.classList.remove('hidden');
    finalScore.textContent = `${score} / ${examsData.length}`;
}

// 9. ربط أزرار التحكم بالأحداث التفاعلية (Event Listeners)
nextBtn.addEventListener('click', handleNextButton);
restartBtn.addEventListener('click', startQuiz);

// 10. تشغيل التطبيق تلقائياً عند تحميل الصفحة لأول مرة
document.addEventListener('DOMContentLoaded', startQuiz);
