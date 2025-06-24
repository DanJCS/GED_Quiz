let questions = [];
let currentQuestion = 0;
let userAnswers = [];
let score = 0;

// Load questions from JSON file
async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        questions = await response.json();
        initializeQuiz();
    } catch (error) {
        console.error('Error loading questions:', error);
        document.getElementById('question-text').textContent = 'Error loading questions. Please refresh the page.';
    }
}

// Initialize the quiz
function initializeQuiz() {
    currentQuestion = 0;
    userAnswers = [];
    score = 0;
    document.getElementById('quiz-container').style.display = 'block';
    document.getElementById('results-container').style.display = 'none';
    displayQuestion();
}

// Display current question
function displayQuestion() {
    if (currentQuestion < questions.length) {
        const question = questions[currentQuestion];
        
        // Update progress
        document.getElementById('progress-text').textContent = `${currentQuestion + 1} / ${questions.length}`;
        
        // Display question
        document.getElementById('question-text').innerHTML = question.question;
        
        // Display options
        const optionsContainer = document.getElementById('options-container');
        optionsContainer.innerHTML = '';
        
        question.options.forEach((option, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'option';
            optionDiv.innerHTML = option;
            optionDiv.onclick = () => selectOption(index);
            optionsContainer.appendChild(optionDiv);
        });
        
        // Reset next button
        document.getElementById('next-btn').disabled = true;
        
        // Re-render MathJax
        if (window.MathJax) {
            MathJax.typesetPromise();
        }
    }
}

// Handle option selection
function selectOption(selectedIndex) {
    const options = document.querySelectorAll('.option');
    
    // Remove previous selections
    options.forEach(option => {
        option.classList.remove('selected');
    });
    
    // Mark selected option
    options[selectedIndex].classList.add('selected');
    
    // Store user answer
    userAnswers[currentQuestion] = selectedIndex;
    
    // Enable next button
    document.getElementById('next-btn').disabled = false;
}

// Move to next question
function nextQuestion() {
    // Show correct/incorrect feedback
    const question = questions[currentQuestion];
    const options = document.querySelectorAll('.option');
    
    options.forEach((option, index) => {
        if (index === question.answer) {
            option.classList.add('correct');
        } else if (index === userAnswers[currentQuestion]) {
            option.classList.add('incorrect');
        }
    });
    
    // Update score
    if (userAnswers[currentQuestion] === question.answer) {
        score++;
    }
    
    // Move to next question after a delay
    setTimeout(() => {
        currentQuestion++;
        if (currentQuestion < questions.length) {
            displayQuestion();
        } else {
            showResults();
        }
    }, 1500);
    
    // Disable next button
    document.getElementById('next-btn').disabled = true;
}

// Show final results
function showResults() {
    document.getElementById('quiz-container').style.display = 'none';
    document.getElementById('results-container').style.display = 'block';
    
    const percentage = Math.round((score / questions.length) * 100);
    
    // Update score display
    document.getElementById('score-text').textContent = `${score} correct out of ${questions.length}`;
    document.getElementById('percentage-text').textContent = `${percentage}%`;
    
    // Show star rating
    displayStarRating(percentage);
    
    // Show visual results
    displayVisualResults();
    
    // Re-render MathJax
    if (window.MathJax) {
        MathJax.typesetPromise();
    }
}

// Display star rating based on percentage
function displayStarRating(percentage) {
    const starContainer = document.getElementById('star-rating');
    starContainer.innerHTML = '';
    
    let stars = 1;
    if (percentage >= 90) stars = 5;
    else if (percentage >= 80) stars = 4;
    else if (percentage >= 70) stars = 3;
    else if (percentage >= 60) stars = 2;
    
    for (let i = 1; i <= 5; i++) {
        const star = document.createElement('span');
        star.className = i <= stars ? 'star filled' : 'star';
        star.innerHTML = '★';
        starContainer.appendChild(star);
    }
}

// Display visual results grid
function displayVisualResults() {
    const resultsGrid = document.getElementById('results-grid');
    resultsGrid.innerHTML = '';
    
    questions.forEach((question, index) => {
        const resultBox = document.createElement('div');
        resultBox.className = 'result-box';
        resultBox.classList.add(userAnswers[index] === question.answer ? 'correct' : 'incorrect');
        resultBox.textContent = index + 1;
        resultBox.onclick = () => showQuestionModal(index);
        resultsGrid.appendChild(resultBox);
    });
}

// Show question details in modal
function showQuestionModal(questionIndex) {
    const question = questions[questionIndex];
    const userAnswer = userAnswers[questionIndex];
    
    document.getElementById('modal-question').innerHTML = `<strong>Question ${questionIndex + 1}:</strong><br>${question.question}`;
    document.getElementById('modal-your-answer').innerHTML = `<strong>Your Answer:</strong><br>${question.options[userAnswer]}`;
    document.getElementById('modal-correct-answer').innerHTML = `<strong>Correct Answer:</strong><br>${question.options[question.answer]}`;
    
    document.getElementById('question-modal').style.display = 'block';
    
    // Re-render MathJax in modal
    if (window.MathJax) {
        MathJax.typesetPromise();
    }
}

// Close modal
function closeModal() {
    document.getElementById('question-modal').style.display = 'none';
}

// Restart quiz
function restartQuiz() {
    initializeQuiz();
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('question-modal');
    if (event.target === modal) {
        modal.style.display = 'none';
    }
}

// Load questions when page loads
document.addEventListener('DOMContentLoaded', loadQuestions);
