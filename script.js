let questions = [];
let cheatsheet = {};
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

// Load cheatsheet from JSON file
async function loadCheatsheet() {
    try {
        const response = await fetch('cheatsheet.json');
        cheatsheet = await response.json();
        console.log('Cheatsheet loaded:', cheatsheet);
    } catch (error) {
        console.error('Error loading cheatsheet:', error);
    }
}

// ==========================================================
// CALCULATOR POPUP FUNCTION
// ==========================================================

/**
 * Opens the TI-84 Calculator in a popup window.
 */
function openCalculatorPopup() {
    const url = 'https://ti84calc.com/ti84calc';
    const windowName = 'CalculatorPopup';
    const width = 400;
    const height = 600;
    const left = (window.screen.width / 2) - (width / 2);
    const top = (window.screen.height / 2) - (height / 2);
    const windowOptions = `width=${width},height=${height},top=${top},left=${left},resizable=yes,scrollbars=yes,menubar=no,toolbar=no,location=no,status=no`;

    const calculatorWindow = window.open(url, windowName, windowOptions);

    // Focus the popup window if it was successfully opened
    if (calculatorWindow) {
        calculatorWindow.focus();
    } else {
        // Fallback if popup was blocked
        alert('Popup blocked! Please allow popups for this site or open the calculator manually at: ' + url);
    }
}

// ==========================================================
// MARKDOWN + MATHJAX PROCESSING
// ==========================================================

function processTextContent(text) {
    if (!text) return '';

    // Step 1: Protect MathJax expressions with unique markers that won't conflict with Markdown
    const mathStore = [];
    let mathCounter = 0;

    // Protect display math ($$...$$) first
    let processedText = text.replace(/\$\$([\s\S]*?)\$\$/g, (match) => {
        const marker = `ΩMATHDISPLAYΩ${mathCounter}Ω`;
        mathStore[mathCounter] = match;
        mathCounter++;
        return marker;
    });

    // Protect inline math ($...$)
    processedText = processedText.replace(/\$([^$\n]+)\$/g, (match) => {
        const marker = `ΩMATHINLINEΩ${mathCounter}Ω`;
        mathStore[mathCounter] = match;
        mathCounter++;
        return marker;
    });

    // Step 2: Process Markdown safely
    let htmlContent;
    if (typeof marked !== 'undefined') {
        try {
            marked.setOptions({
                breaks: true,
                gfm: true,
                sanitize: false,
                smartLists: true,
                smartypants: false
            });
            htmlContent = marked.parse(processedText);
        } catch (error) {
            console.warn('Marked.js failed, using basic parsing:', error);
            htmlContent = basicMarkdownParse(processedText);
        }
    } else {
        htmlContent = basicMarkdownParse(processedText);
    }

    // Step 3: Restore MathJax expressions
    for (let i = 0; i < mathCounter; i++) {
        if (mathStore[i]) {
            htmlContent = htmlContent.replace(`ΩMATHDISPLAYΩ${i}Ω`, mathStore[i]);
            htmlContent = htmlContent.replace(`ΩMATHINLINEΩ${i}Ω`, mathStore[i]);
        }
    }

    // Clean up unnecessary paragraph tags for simple content
    if (!text.includes('\n') && htmlContent.startsWith('<p>') && htmlContent.endsWith('</p>')) {
        htmlContent = htmlContent.slice(3, -4);
    }

    return htmlContent;
}

// Basic Markdown parser fallback
function basicMarkdownParse(text) {
    return text
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\n/g, '<br>')
        .replace(/`([^`]+)`/g, '<code>$1</code>');
}

// ==========================================================
// QUIZ FUNCTIONS
// ==========================================================

function initializeQuiz() {
    currentQuestion = 0;
    userAnswers = [];
    score = 0;
    document.getElementById('quiz-container').style.display = 'block';
    document.getElementById('results-container').style.display = 'none';
    displayQuestion();
}

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

// ==========================================================
// CHEATSHEET FUNCTION
// ==========================================================

function showCheatsheet() {
    console.log('showCheatsheet called');
    const container = document.getElementById('cheatsheet-container');
    container.innerHTML = '';

    if (cheatsheet && cheatsheet.title) {
        // Create title
        const title = document.createElement('h2');
        title.className = 'cheatsheet-title';
        title.innerHTML = processTextContent(cheatsheet.title);
        container.appendChild(title);

        // Create sections
        cheatsheet.sections.forEach(section => {
            const sectionDiv = document.createElement('div');
            sectionDiv.className = 'cheatsheet-section';

            // Section heading
            if (section.heading) {
                const heading = document.createElement('h3');
                heading.innerHTML = processTextContent(section.heading);
                sectionDiv.appendChild(heading);
            }

            // Section content
            if (section.content) {
                const content = document.createElement('div');
                content.innerHTML = processTextContent(section.content);
                sectionDiv.appendChild(content);
            }

            // Section formula
            if (section.formula) {
                const formula = document.createElement('div');
                formula.className = 'cheatsheet-formula';
                formula.innerHTML = processTextContent(section.formula);
                sectionDiv.appendChild(formula);
            }

            // Section steps
            if (section.steps) {
                const stepsDiv = document.createElement('div');
                stepsDiv.innerHTML = processTextContent(section.steps);
                sectionDiv.appendChild(stepsDiv);
            }

            // Example section
            if (section.example) {
                const exampleDiv = document.createElement('div');
                exampleDiv.className = 'example-container';

                if (section.example.problem) {
                    const problemDiv = document.createElement('div');
                    problemDiv.className = 'example-problem';
                    problemDiv.innerHTML = processTextContent(section.example.problem);
                    exampleDiv.appendChild(problemDiv);
                }

                // Process all steps
                const stepsList = document.createElement('ol');
                for (let i = 1; i <= 20; i++) {
                    const stepKey = `step${i}`;
                    if (section.example[stepKey]) {
                        const li = document.createElement('li');
                        li.innerHTML = processTextContent(section.example[stepKey]);
                        stepsList.appendChild(li);
                    } else {
                        break;
                    }
                }
                if (stepsList.hasChildNodes()) {
                    exampleDiv.appendChild(stepsList);
                }

                // Handle special visual elements
                if (section.example.cross_multiplication_visual) {
                    const visualDiv = document.createElement('div');
                    visualDiv.className = 'cross-multiplication';
                    visualDiv.innerHTML = processTextContent(section.example.cross_multiplication_visual);
                    exampleDiv.appendChild(visualDiv);
                }

                if (section.example.final_answer) {
                    const answerDiv = document.createElement('div');
                    answerDiv.className = 'final-answer';
                    answerDiv.innerHTML = processTextContent(section.example.final_answer);
                    exampleDiv.appendChild(answerDiv);
                }

                sectionDiv.appendChild(exampleDiv);
            }

            container.appendChild(sectionDiv);
        });
    } else {
        container.innerHTML = '<p>Cheatsheet not available. Please check if cheatsheet.json is loaded correctly.</p>';
    }

    document.getElementById('cheatsheet-modal').style.display = 'block';

    // Critical: Process MathJax after content is fully in DOM
    setTimeout(() => {
        if (window.MathJax && MathJax.typesetPromise) {
            MathJax.typesetPromise([container]).then(() => {
                console.log('MathJax processing completed for cheatsheet');
            }).catch((err) => {
                console.error('MathJax typeset failed:', err);
            });
        }
    }, 100);
}

// Close cheatsheet modal
function closeCheatsheet() {
    document.getElementById('cheatsheet-modal').style.display = 'none';
}

// Close question modal
function closeModal() {
    document.getElementById('question-modal').style.display = 'none';
}

// Restart quiz
function restartQuiz() {
    initializeQuiz();
}

// Close modal when clicking outside
window.onclick = function(event) {
    const questionModal = document.getElementById('question-modal');
    const cheatsheetModal = document.getElementById('cheatsheet-modal');

    if (event.target === questionModal) {
        questionModal.style.display = 'none';
    }
    if (event.target === cheatsheetModal) {
        cheatsheetModal.style.display = 'none';
    }
}

// Load questions and cheatsheet when page loads
document.addEventListener('DOMContentLoaded', () => {
    loadQuestions();
    loadCheatsheet();
});