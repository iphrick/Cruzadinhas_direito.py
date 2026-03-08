document.addEventListener('DOMContentLoaded', () => {
    const generateBtn = document.getElementById('generate-btn');
    const subjectSelect = document.getElementById('subject');
    const gridContainer = document.getElementById('grid-container');
    const acrossCluesList = document.getElementById('across-clues-list');
    const downCluesList = document.getElementById('down-clues-list');
    const loadingDiv = document.getElementById('loading');

    generateBtn.addEventListener('click', async () => {
        const subject = subjectSelect.value;
        
        // Clear previous crossword
        gridContainer.innerHTML = '';
        acrossCluesList.innerHTML = '';
        downCluesList.innerHTML = '';

        // Show loading indicator
        loadingDiv.classList.remove('hidden');

        try {
            const response = await fetch('/api/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ subject }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Erro ao gerar cruzadinha.');
            }

            const data = await response.json();
            generateCrossword(data.crossword);

        } catch (error) {
            alert(error.message);
        } finally {
            // Hide loading indicator
            loadingDiv.classList.add('hidden');
        }
    });

    function generateCrossword(crosswordData) {
        const gridSize = 20;
        gridContainer.style.gridTemplateColumns = `repeat(${gridSize}, 30px)`;

        // Create the grid
        for (let i = 0; i < gridSize * gridSize; i++) {
            const cell = document.createElement('div');
            cell.classList.add('cell', 'empty');
            gridContainer.appendChild(cell);
        }

        const placedWords = [];

        crosswordData.forEach((word, index) => {
            const answer = word.answer.toUpperCase();
            const question = word.question;
            let placed = false;
            let attempts = 0;

            while (!placed && attempts < 100) {
                const direction = Math.random() > 0.5 ? 'across' : 'down';
                const startX = Math.floor(Math.random() * gridSize);
                const startY = Math.floor(Math.random() * gridSize);

                if (canPlaceWord(answer, startX, startY, direction, placedWords)) {
                    placeWord(answer, question, startX, startY, direction, index + 1, placedWords);
                    placed = true;
                }
                attempts++;
            }

            if (!placed) {
                console.warn(`Could not place word: ${answer}`);
            }
        });

        // Add input listeners
        const inputs = gridContainer.querySelectorAll('input');
        inputs.forEach(input => {
            input.addEventListener('input', (e) => {
                if (e.target.value.toUpperCase() === e.target.dataset.correct) {
                    e.target.style.backgroundColor = '#90ee90'; // Light green
                } else {
                    e.target.style.backgroundColor = '#ffcccb'; // Light red
                }
            });
        });
    }

    function canPlaceWord(word, startX, startY, direction, placedWords) {
        const gridSize = 20;
        if (direction === 'across') {
            if (startX + word.length > gridSize) return false;
            for (let i = 0; i < word.length; i++) {
                if (isOccupied(startX + i, startY, placedWords) && gridContainer.children[startY * gridSize + startX + i].querySelector('input').dataset.correct !== word[i]) {
                    return false;
                }
            }
        } else { // down
            if (startY + word.length > gridSize) return false;
            for (let i = 0; i < word.length; i++) {
                if (isOccupied(startX, startY + i, placedWords) && gridContainer.children[(startY + i) * gridSize + startX].querySelector('input').dataset.correct !== word[i]) {
                    return false;
                }
            }
        }
        return true;
    }

    function isOccupied(x, y, placedWords) {
        return placedWords.some(w => {
            if (w.direction === 'across') {
                return y === w.y && x >= w.x && x < w.x + w.word.length;
            } else { // down
                return x === w.x && y >= w.y && y < w.y + w.word.length;
            }
        });
    }

    function placeWord(word, clue, startX, startY, direction, number, placedWords) {
        const gridSize = 20;
        placedWords.push({ word, x: startX, y: startY, direction, number });

        for (let i = 0; i < word.length; i++) {
            let x = startX;
            let y = startY;
            if (direction === 'across') {
                x += i;
            } else {
                y += i;
            }
            const cellIndex = y * gridSize + x;
            const cell = gridContainer.children[cellIndex];
            cell.classList.remove('empty');

            if (!cell.querySelector('input')) {
                const input = document.createElement('input');
                input.type = 'text';
                input.maxLength = 1;
                input.dataset.correct = word[i];
                cell.appendChild(input);
            }

            if (i === 0) {
                const numberDiv = document.createElement('div');
                numberDiv.classList.add('number');
                numberDiv.textContent = number;
                cell.insertBefore(numberDiv, cell.firstChild);
            }
        }

        const clueItem = document.createElement('li');
        clueItem.textContent = `${number}. ${clue}`;
        if (direction === 'across') {
            acrossCluesList.appendChild(clueItem);
        } else {
            downCluesList.appendChild(clueItem);
        }
    }
});