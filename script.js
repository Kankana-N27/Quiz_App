const setupContainer = document.getElementById("setup-container");
const quizContainer = document.getElementById("quiz-container");
const startBtn = document.getElementById("start-quiz");
const questionCountInput = document.getElementById("question-count");

const questionEl = document.getElementById("question");
const optionsList = document.querySelector(".quiz-options");
const resultEl = document.getElementById("result");
const checkAnswerBtn = document.getElementById("check-answer");
const playAgainBtn = document.getElementById("play-again");

const correctScoreEl = document.getElementById("correct-score");
const totalQuestionEl = document.getElementById("total-question");

let currentQuestion = {};
let correctAnswer = "";
let score = 0;
let questionIndex = 0;
let questions = [];

startBtn.addEventListener("click", () => {
  const count = parseInt(questionCountInput.value);
  if (isNaN(count) || count < 1 || count > 50) {
    alert("Please enter a valid number between 1 and 50.");
    return;
  }

  fetchQuestions(count);
});

async function fetchQuestions(amount) {
  startBtn.textContent = "Loading...";
  startBtn.disabled = true; // Prevent multiple clicks

  try {
    // Category 18 is Computer Science
    const url = `https://opentdb.com/api.php?amount=${amount}&category=18&type=multiple`;
    const res = await fetch(url);
    const data = await res.json();

    // API specific error handling
    if (data.response_code !== 0) {
      let errorMsg = "Could not find enough questions. Try a smaller number or a different category.";
      if (data.response_code === 1) errorMsg = "No results found for that query.";
      throw new Error(errorMsg);
    }
    
    questions = data.results;
    score = 0;
    questionIndex = 0;
    correctScoreEl.textContent = score;
    totalQuestionEl.textContent = questions.length;

    setupContainer.style.display = "none";
    quizContainer.style.display = "block";

    showQuestion();
  } catch (error) {
    alert(`Failed to load questions: ${error.message}`);
    console.error(error);
  } finally {
    startBtn.textContent = "Start";
    startBtn.disabled = false; // Always re-enable button
  }
}

function showQuestion() {
  clearResult();
  checkAnswerBtn.disabled = false; // Re-enable for new question

  const current = questions[questionIndex];

  const questionText = decodeHTML(current.question);
  questionEl.innerHTML = `${questionText}`;
  correctAnswer = decodeHTML(current.correct_answer);

  const answers = [...current.incorrect_answers.map(decodeHTML), correctAnswer];
  shuffleArray(answers);

  optionsList.innerHTML = answers
    .map((answer) => `<li>${answer}</li>`)
    .join("");

  selectOption();
}

function selectOption() {
  const options = optionsList.querySelectorAll("li");
  options.forEach((option) => {
    option.addEventListener("click", () => {
      options.forEach((opt) => opt.classList.remove("selected"));
      option.classList.add("selected");
    });
  });
}

checkAnswerBtn.addEventListener("click", () => {
  const selected = document.querySelector(".quiz-options .selected");
  if (!selected) {
    alert("Please select an answer!");
    return;
  }

  const userAnswer = selected.textContent;
  // *** FIX: Define isCorrect here so it's accessible for the delay calculation ***
  const isCorrect = (userAnswer === correctAnswer); 
  
  // Disable options and check button immediately
  disableOptions();
  checkAnswerBtn.disabled = true; 

  if (isCorrect) {
    score++;
  } 
  
  showResult(isCorrect);

  correctScoreEl.textContent = score;

  questionIndex++;
  
  // Set delay: 1.5s if correct, 3.0s if incorrect
  const delay = isCorrect ? 1500 : 3000; 

  setTimeout(() => {
    if (questionIndex < questions.length) {
      showQuestion();
    } else {
      showFinalResult();
    }
  }, delay); 
});

function showResult(isCorrect) {
  const selected = document.querySelector(".quiz-options .selected");
  const options = optionsList.querySelectorAll("li");
  
  // Highlight the correct answer in green
  options.forEach((option) => {
    if (option.textContent === correctAnswer) {
      option.classList.add("correct-answer");
    }
  });

  // Highlight the user's choice in green or red
  if (selected) {
    selected.classList.add(isCorrect ? "correct" : "incorrect");
  }

  // Display text result
  resultEl.innerHTML = isCorrect
    ? `<i class="fas fa-check-circle"></i> Correct!`
    : `<i class="fas fa-times-circle"></i> Wrong! The correct answer was: **${correctAnswer}**`;
  resultEl.className = isCorrect ? "" : "wrong";
}

function clearResult() {
  resultEl.innerHTML = "";
  resultEl.className = "";
  const options = optionsList.querySelectorAll("li");
  options.forEach(option => {
    // Remove all result/selection classes and re-enable clicks
    option.classList.remove("selected", "correct", "incorrect", "correct-answer");
    option.style.pointerEvents = "auto"; 
  });
}

function disableOptions() {
  const options = optionsList.querySelectorAll("li");
  options.forEach((option) => {
    // Use inline style to disable pointer events
    option.style.pointerEvents = "none";
  });
}


playAgainBtn.addEventListener("click", () => {
  quizContainer.style.display = "none";
  setupContainer.style.display = "block";
  questionCountInput.value = "";
  checkAnswerBtn.style.display = "block";
  playAgainBtn.style.display = "none";
});

// Helper Functions
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function decodeHTML(text) {
  const txt = document.createElement("textarea");
  txt.innerHTML = text;
  return txt.value;
}

function showFinalResult() {
  questionEl.textContent = "Game Over!";
  optionsList.innerHTML = "";
  resultEl.innerHTML = `Your Score: ${score} out of ${questions.length} (${((score / questions.length) * 100).toFixed(0)}%)`;
  resultEl.className = score >= (questions.length / 2) ? "" : "wrong"; // Highlight score if less than 50%
  checkAnswerBtn.style.display = "none";
  playAgainBtn.style.display = "block";
}