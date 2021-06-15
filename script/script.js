const dom = {
  difficulty: document.querySelector('#difficulty'),
  levelsContainer: document.querySelector('.container-levels'),
  categories: document.querySelector('#categories'),
  categoriesContainer: document.querySelector('.container-categories'),
  questions: document.querySelector('#questions'),
  questionsContainer: document.querySelector('.container-questions'),
  endGame: document.querySelector('#end-game'),
  endGameContainer: document.querySelector('.container-end-game'),
};

let game = {
  levels: ['Easy', 'Medium', 'Hard'],
  selectedLevel: null,
  categories: [],
  selectedCategory: null,
  questions: [],
  incorrectAnswer: [],
  correctAnswer: [],
  score: 0,
  iQuestion: 0,
  eQuestion: null,
};

initialize();

function initialize() {
  dom.categories.style.display = 'none';
  dom.questions.style.display = 'none';
  dom.endGame.style.display = 'none';

  loadCategories();
  fillLevelButton();
}

function fetchJSON(url) {
  return fetch(url).then((response) => {
    return response.json();
  });
}

async function fetchAPI(url) {
  let result = await Promise.all([fetchJSON(url)]);
  return result;
}

function createElement(element, textContent, className) {
  let el = document.createElement(element);
  el.textContent = textContent;
  if (className !== '') {
    el.classList.add(className);
  }
  return el;
}

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);

  return Math.floor(Math.random() * (max - min)) + min;
}

function shuffleQuestions() {
  return Math.round(Math.random()) - 0.5;
}

function decodeHtml(html) {
  var txt = document.createElement('textarea');
  txt.innerHTML = html;
  return txt.value;
}

function fillLevelButton() {
  game.levels.forEach(function (level) {
    let button = createElement('button', level, 'btn-level');
    button.addEventListener('click', onClickButtonLevel);
    dom.levelsContainer.appendChild(button);
  });
}

function onClickButtonLevel(event) {
  game.selectedLevel = event.target.textContent.toLowerCase();

  dom.difficulty.style.display = 'none';
  dom.categories.style.display = 'block';
}

async function loadCategories() {
  let result = await fetchAPI('https://opentdb.com/api_category.php');
  game.categories = result[0].trivia_categories;

  fillCategories(game.categories);
}

function fillCategories(categories) {
  createButtonCategory('Random', null);
  categories.forEach(function (category) {
    createButtonCategory(category.name, category);
  });
}

function createButtonCategory(categoryName, categoryObj) {
  let button = createElement('button', categoryName, 'btn-category');
  button.addEventListener('click', () => {
    onClickCategory(categoryObj);
  });
  dom.categoriesContainer.appendChild(button);
}

function onClickCategory(category) {
  if (category == null) {
    game.selectedCategory = getRandomInt(9, 32);
  } else {
    game.selectedCategory = category.id;
  }

  loadQuestions();
}

async function loadQuestions() {
  let result = await fetchAPI(
    `https://opentdb.com/api.php?amount=10&category=${game.selectedCategory}&difficulty=${game.selectedLevel}`
  );

  let results = result[0].results;
  if (results.length === 0) {
    alert('Category with no questions available on this difficulty!');
  } else {
    dom.categories.style.display = 'none';
    dom.questions.style.display = 'block';

    fillQuestions(results);
  }
}

function fillQuestions(results) {
  results.forEach(function (item, indice, array) {
    game.questions.push(item.question);
    game.correctAnswer.push(item.correct_answer);
    game.incorrectAnswer.push(item.incorrect_answers);
  });

  fillGame();
}

function fillGame() {
  var auxAnswer = [];
  auxAnswer.push(decodeHtml(game.correctAnswer[game.iQuestion]));
  game.incorrectAnswer[game.iQuestion].forEach(function (item) {
    auxAnswer.push(decodeHtml(item));
  });
  auxAnswer.sort(shuffleQuestions);

  let labelScore = document.createElement('h3');
  labelScore.textContent = `Score: ${game.score} \n`;
  dom.questionsContainer.appendChild(labelScore);

  let label = document.createElement('p');
  label.textContent = decodeHtml(game.questions[game.iQuestion]);
  dom.questionsContainer.appendChild(label);

  auxAnswer.forEach(function (answer) {
    let button = createElement('button', answer, 'btn-answer');
    button.addEventListener("click", () => {
      onClickAnswer(button);
    });
    dom.questionsContainer.appendChild(button);
  });
}

function onClickAnswer(button) {
  var currentBtnSelected =
    dom.questionsContainer.querySelector('.btn-selected');
  if (currentBtnSelected === null) {
    createButtonResponse();
  } else {
    currentBtnSelected.classList.remove('btn-selected');
  }
  button.classList.add('btn-selected');
}

function createButtonResponse() {
  let button = createElement('button', 'Answer', 'btn-response');
  button.addEventListener('click', () => {
    onClickResponse(button);
  });
  dom.questionsContainer.appendChild(button);
}

function onClickResponse(button) {
  dom.questionsContainer.removeChild(button);

  let btnCorrect = Array.from(document.querySelectorAll('button')).find(
    (el) => el.textContent === decodeHtml(game.correctAnswer[game.iQuestion])
  );
  btnCorrect.classList.add('btn-correct');
  dom.questions.style.pointerEvents = 'none';

  setTimeout(() => {
    var currentBtnSelected = dom.questionsContainer.querySelector('.btn-selected');
    checkScore(currentBtnSelected.textContent);
    dom.questions.style.pointerEvents = 'all';

  }, 1000);
}

function checkScore(textContent) {
  var lose = false;
  if (game.correctAnswer[game.iQuestion] == textContent) {
    updateScore(1);
    game.eQuestion = 0;
  } else {
    updateScore(-1);
    game.eQuestion += 1;

    if (game.eQuestion == 3) {
      lose = true;
    }
  }

  game.iQuestion += 1;
  if (game.iQuestion < 10 && !lose) {
    clearAnswer();
    fillGame();
  } else {
    dom.questions.style.display = 'none';
    dom.endGame.style.display = 'block';

    finishGame();
  }
}

function clearAnswer() {
  var elemento = document.getElementById('id-container');
  while (elemento.firstChild) {
    elemento.removeChild(elemento.firstChild);
  }
}

function updateScore(value) {
  if (game.selectedLevel === 'easy') {
    game.score += 5 * value;
  } else if (game.selectedLevel === 'medium') {
    game.score += 8 * value;
  } else {
    game.score += 10 * value;
  }
}

function finishGame() {
  var text = '';
  if (game.iQuestion !== 10) {
    text = 'You missed 3 in a row - ';
  }

  var step1 = `${text}Score: ${game.score}`;
  let label = createElement("h3", step1, "");
  dom.endGameContainer.appendChild(label);

  var strCategory;  
  game.categories.forEach(element => { 
    if(element.id === game.selectedCategory) {
      strCategory = element.name;
    }
  });

  var step2 = `Difficulty: ${game.selectedLevel} / Category: ${strCategory}`;
  label = createElement("h3", step2, "");
  dom.endGameContainer.appendChild(label);

  var step3 = `Nº of answered questions: ${game.iQuestion} of 10`;
  label = createElement("h3", step3, "");
  dom.endGameContainer.appendChild(label);
}
