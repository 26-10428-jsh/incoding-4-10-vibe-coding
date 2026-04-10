const COLUMNS = 17;
const ROWS = 10;
const TIME_LIMIT = 120; // 2 minutes

let gridData = [];
let cells = [];
let isDragging = false;
let startCell = null;
let currentCell = null;
let timer = TIME_LIMIT;
let timerInterval = null;
let score = 0;
let isPlaying = false;

const gridElement = document.getElementById('grid');
const timerDisplay = document.getElementById('timer');
const scoreDisplay = document.getElementById('score');
const overlay = document.getElementById('overlay');
const startBtn = document.getElementById('startBtn');
const modalTitle = document.getElementById('modalTitle');
const modalDesc = document.getElementById('modalDesc');
const gameContainer = document.getElementById('gameContainer');

function initGame() {
    gridElement.innerHTML = '';
    gridData = [];
    cells = [];
    score = 0;
    updateScore();
    timer = TIME_LIMIT;
    updateTimerDisplay();

    for (let r = 0; r < ROWS; r++) {
        for (let c = 0; c < COLUMNS; c++) {
            const val = Math.floor(Math.random() * 9) + 1;
            gridData.push({ row: r, col: c, val: val, empty: false });
            
            const cellPos = r * COLUMNS + c;
            const cell = document.createElement('div');
            cell.className = 'cell';
            cell.textContent = val;
            cell.dataset.index = cellPos;
            
            gridElement.appendChild(cell);
            cells.push(cell);
        }
    }
}

function getGridPos(x, y) {
    const gridRect = gridElement.getBoundingClientRect();
    const relativeX = x - gridRect.left;
    const relativeY = y - gridRect.top;
    
    // cell width 40 + gap 6 = 46
    const cellTotalWidth = 40 + 6;
    
    let col = Math.floor(relativeX / cellTotalWidth);
    let row = Math.floor(relativeY / cellTotalWidth);
    
    // Clamp to grid boundaries
    if (col < 0) col = 0;
    if (col >= COLUMNS) col = COLUMNS - 1;
    if (row < 0) row = 0;
    if (row >= ROWS) row = ROWS - 1;
    
    return { row, col };
}

function handlePointerDown(e) {
    if (!isPlaying) return;
    // ensure we are targeting a click within our container or valid targets
    if(e.button !== 0 && e.type.startsWith('mouse')) return; // ignore right clicks
    
    isDragging = true;
    startCell = getGridPos(e.clientX, e.clientY);
    currentCell = startCell;
    updateSelection();
}

function handlePointerMove(e) {
    if (!isDragging || !isPlaying) return;
    
    // Only update if mouse is within reasonable bounds of the screen
    currentCell = getGridPos(e.clientX, e.clientY);
    updateSelection();
}

function handlePointerUp(e) {
    if (!isDragging || !isPlaying) return;
    isDragging = false;
    evaluateSelection();
    clearSelection();
}

function getBoundingBox() {
    if (!startCell || !currentCell) return null;
    const minRow = Math.min(startCell.row, currentCell.row);
    const maxRow = Math.max(startCell.row, currentCell.row);
    const minCol = Math.min(startCell.col, currentCell.col);
    const maxCol = Math.max(startCell.col, currentCell.col);
    return { minRow, maxRow, minCol, maxCol };
}

function updateSelection() {
    const box = getBoundingBox();
    if (!box) return;

    cells.forEach((cell, index) => {
        const item = gridData[index];
        if (item.row >= box.minRow && item.row <= box.maxRow &&
            item.col >= box.minCol && item.col <= box.maxCol && !item.empty) {
            cell.classList.add('selected');
        } else {
            cell.classList.remove('selected');
        }
    });
}

function clearSelection() {
    cells.forEach(cell => cell.classList.remove('selected'));
    startCell = null;
    currentCell = null;
}

function evaluateSelection() {
    const box = getBoundingBox();
    if (!box) return;

    let sum = 0;
    let selectedIndices = [];

    for (let r = box.minRow; r <= box.maxRow; r++) {
        for (let c = box.minCol; c <= box.maxCol; c++) {
            const index = r * COLUMNS + c;
            if (!gridData[index].empty) {
                sum += gridData[index].val;
                selectedIndices.push(index);
            }
        }
    }

    if (sum === 10) {
        // Clear them
        selectedIndices.forEach(idx => {
            gridData[idx].empty = true;
            cells[idx].classList.add('empty');
        });
        
        // Add score based on number of blocks (more blocks = higher score multiplier)
        const addedScore = selectedIndices.length * 10;
        score += addedScore;
        updateScore();

        showCoinEffect(box, addedScore);
    }
}

function updateScore() {
    scoreDisplay.textContent = score;
}

function updateTimerDisplay() {
    const m = Math.floor(timer / 60).toString().padStart(2, '0');
    const s = (timer % 60).toString().padStart(2, '0');
    timerDisplay.textContent = `${m}:${s}`;
}

function startGame() {
    overlay.classList.add('hidden');
    initGame();
    isPlaying = true;
    
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timer--;
        updateTimerDisplay();
        if (timer <= 0) {
            endGame();
        }
    }, 1000);
}

function endGame() {
    isPlaying = false;
    clearInterval(timerInterval);
    modalTitle.textContent = "Time's Up!";
    modalDesc.textContent = `최종 점수: ${score}점`;
    startBtn.textContent = "다시 하기";
    overlay.classList.remove('hidden');
}

// Event Listeners for dragging (support mouse and touch seamlessly via pointer events)
gameContainer.addEventListener('pointerdown', handlePointerDown);
document.addEventListener('pointermove', handlePointerMove);
document.addEventListener('pointerup', handlePointerUp);
// Provide a fail-safe pointercancel just in case (e.g. system dialog appears)
document.addEventListener('pointercancel', handlePointerUp);

startBtn.addEventListener('click', startGame);

// Prevent default drag selection artifacts
document.addEventListener('dragstart', e => e.preventDefault());

function showCoinEffect(box, addedScore) {
    const effect = document.createElement('div');
    effect.className = 'coin-effect';
    effect.textContent = `🪙 +${addedScore}`;
    
    const centerCol = (box.minCol + box.maxCol) / 2;
    const centerRow = (box.minRow + box.maxRow) / 2;
    
    const x = centerCol * 46 + 20;
    const y = centerRow * 46 + 20;
    
    effect.style.left = `${x}px`;
    effect.style.top = `${y}px`;
    
    gridElement.appendChild(effect);
    
    setTimeout(() => {
        effect.remove();
    }, 800);
}
