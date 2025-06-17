document.addEventListener('DOMContentLoaded', () => {
    const display = document.getElementById('display');
    const startStopBtn = document.getElementById('startStop');
    const lapBtn = document.getElementById('lap');
    const resetBtn = document.getElementById('reset');
    const lapList = document.getElementById('lapList');

    let startTime;
    let elapsedTime = 0;
    let timerInterval;
    let isRunning = false;
    let lapCount = 0;

    // 時間をフォーマットする関数
    function formatTime(ms) {
        const date = new Date(ms);
        const minutes = date.getUTCMinutes().toString().padStart(2, '0');
        const seconds = date.getUTCSeconds().toString().padStart(2, '0');
        const milliseconds = date.getUTCMilliseconds().toString().padStart(3, '0');
        return `${minutes}:${seconds}.${milliseconds}`;
    }

    // 経過時間を表示する関数
    function updateDisplay() {
        const currentTime = Date.now();
        elapsedTime = currentTime - startTime;
        display.textContent = formatTime(elapsedTime);
    }

    // ストップウォッチを開始/停止する関数
    function toggleStartStop() {
        if (!isRunning) {
            // スタート
            startTime = Date.now() - (elapsedTime || 0);
            timerInterval = setInterval(updateDisplay, 10);
            startStopBtn.textContent = 'ストップ';
            startStopBtn.classList.add('running');
            lapBtn.disabled = false;
        } else {
            // ストップ
            clearInterval(timerInterval);
            startStopBtn.textContent = 'スタート';
            startStopBtn.classList.remove('running');
        }
        isRunning = !isRunning;
    }

    // ラップタイムを記録する関数
    function recordLap() {
        if (!isRunning) return;
        
        lapCount++;
        const lapTime = formatTime(elapsedTime);
        
        const lapItem = document.createElement('li');
        lapItem.innerHTML = `
            <span class="lap-number">ラップ ${lapCount}</span>
            <span class="lap-time">${lapTime}</span>
        `;
        
        // 最新のラップを一番上に表示
        if (lapList.firstChild) {
            lapList.insertBefore(lapItem, lapList.firstChild);
        } else {
            lapList.appendChild(lapItem);
        }
    }

    // リセットする関数
    function reset() {
        clearInterval(timerInterval);
        isRunning = false;
        elapsedTime = 0;
        lapCount = 0;
        display.textContent = '00:00:00.000';
        startStopBtn.textContent = 'スタート';
        startStopBtn.classList.remove('running');
        lapBtn.disabled = false;
        lapList.innerHTML = '';
    }

    // イベントリスナーを設定
    startStopBtn.addEventListener('click', toggleStartStop);
    lapBtn.addEventListener('click', recordLap);
    resetBtn.addEventListener('click', reset);

    // 初期状態ではラップボタンを無効化
    lapBtn.disabled = true;

    // キーボードショートカット
    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            toggleStartStop();
        } else if (e.code === 'KeyL') {
            e.preventDefault();
            recordLap();
        } else if (e.code === 'KeyR') {
            e.preventDefault();
            reset();
        }
    });
});
