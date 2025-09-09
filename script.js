// Простий Minesweeper: налаштування і логіка
const boardEl = document.getElementById('board');
const mineCounter = document.getElementById('mineCounter');
const timerEl = document.getElementById('timer');
const restartBtn = document.getElementById('restart');
const btnEasy = document.getElementById('btn-easy');
const btnMed = document.getElementById('btn-medium');
const btnHard = document.getElementById('btn-hard');
const btnNew = document.getElementById('btn-new');

let rows = 9, cols = 9, mines = 10;
let grid = [];
let started = false, timer = null, seconds = 0;
let flags = 0, opened = 0, totalCells = 0;

function setDifficulty(r,c,m){
  rows=r; cols=c; mines=m;
  newGame();
}

btnEasy.onclick = () => setDifficulty(9,9,10);
btnMed.onclick = () => setDifficulty(16,16,40);
btnHard.onclick = () => setDifficulty(16,30,99);
btnNew.onclick = () => newGame();
restartBtn.onclick = () => newGame();

function formatNum(n){
  return String(n).padStart(3,'0');
}

function newGame(){
  // reset
  started=false; clearInterval(timer); seconds=0;
  timerEl.textContent = formatNum(0);
  flags=0; opened=0;
  mineCounter.textContent = formatNum(mines);
  boardEl.innerHTML='';
  grid = [];
  totalCells = rows*cols;

  // grid and DOM
  boardEl.style.gridTemplateColumns = `repeat(${cols}, auto)`;
  for(let r=0;r<rows;r++){
    grid[r]=[];
    for(let c=0;c<cols;c++){
      const cell = {r,c, mine:false, num:0, opened:false, flagged:false, el:null};
      const el = document.createElement('div');
      el.className='tile closed';
      el.dataset.r=r; el.dataset.c=c;
      el.oncontextmenu = e => { e.preventDefault(); toggleFlag(cell); };
      el.addEventListener('click', e => handleOpen(cell));
      el.addEventListener('dblclick', e => handleChord(cell));
      cell.el = el;
      boardEl.appendChild(el);
      grid[r][c]=cell;
    }
  }
}

function placeMines(firstR, firstC){
  // ensure first clicked cell not a mine
  let placed=0;
  while(placed < mines){
    const r = Math.floor(Math.random()*rows);
    const c = Math.floor(Math.random()*cols);
    if(grid[r][c].mine) continue;
    if(r===firstR && c===firstC) continue;
    grid[r][c].mine = true; placed++;
  }
  // calculate numbers
  for(let r=0;r<rows;r++){
    for(let c=0;c<cols;c++){
      if(grid[r][c].mine) continue;
      let cnt=0;
      for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){
        const nr=r+dr, nc=c+dc;
        if(nr>=0 && nr<rows && nc>=0 && nc<cols && grid[nr][nc].mine) cnt++;
      }
      grid[r][c].num = cnt;
    }
  }
}

function startTimer(){
  timerEl.textContent = formatNum(0);
  seconds=0;
  timer = setInterval(()=>{
    seconds++;
    timerEl.textContent = formatNum(Math.min(seconds,999));
  },1000);
}

function handleOpen(cell){
  if(cell.opened || cell.flagged) return;
  if(!started){
    placeMines(cell.r, cell.c);
    started=true;
    startTimer();
  }
  openCell(cell);
  checkWin();
}

function openCell(cell){
  if(cell.opened || cell.flagged) return;
  cell.opened=true;
  opened++;
  const el = cell.el;
  el.classList.remove('closed');
  el.style.cursor='default';
  if(cell.mine){
    el.classList.add('bomb');
    el.textContent = '💣';
    gameOver(false);
    return;
  }
  if(cell.num>0){
    el.classList.add('num'+cell.num);
    el.textContent = cell.num;
  } else {
    el.textContent = '';
    // flood fill
    for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){
      const nr=cell.r+dr, nc=cell.c+dc;
      if(nr>=0 && nr<rows && nc>=0 && nc<cols) openCell(grid[nr][nc]);
    }
  }
}

function toggleFlag(cell){
  if(cell.opened) return;
  cell.flagged = !cell.flagged;
  const el = cell.el;
  if(cell.flagged){
    el.classList.add('flag');
    el.textContent = '🚩';
    flags++;
  } else {
    el.classList.remove('flag');
    el.textContent = '';
    flags--;
  }
  mineCounter.textContent = formatNum(Math.max(mines - flags, 0));
  checkWin();
}

function handleChord(cell){
  // if opened and has number, open neighbors if flags count equals number
  if(!cell.opened || cell.num===0) return;
  let flaggedNei=0;
  const neighbours=[];
  for(let dr=-1;dr<=1;dr++) for(let dc=-1;dc<=1;dc++){
    const nr=cell.r+dr, nc=cell.c+dc;
    if(nr>=0 && nr<rows && nc>=0 && nc<cols){
      neighbours.push(grid[nr][nc]);
      if(grid[nr][nc].flagged) flaggedNei++;
    }
  }
  if(flaggedNei === cell.num){
    neighbours.forEach(nc => {
      if(!nc.flagged && !nc.opened) openCell(nc);
    });
  }
}

function revealAllMines(){
  for(let r=0;r<rows;r++) for(let c=0;c<cols;c++){
    const cell = grid[r][c];
    if(cell.mine && !cell.opened){
      cell.el.classList.remove('closed');
      cell.el.classList.add('bomb');
      cell.el.textContent = '💣';
    }
  }
}

function gameOver(win){
  clearInterval(timer);
  started=false;
  if(!win){
    // show mines
    revealAllMines();
    restartBtn.textContent = '😵';
    setTimeout(()=> alert('Поразка! Спробуйте ще раз.'), 80);
  } else {
    restartBtn.textContent = '😎';
    setTimeout(()=> alert('Вітаю! Ви виграли.'), 80);
  }
}

function checkWin(){
  // win when opened == totalCells - mines
  if(opened === totalCells - mines){
    gameOver(true);
  }
}

// init default
newGame();
