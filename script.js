document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Element Cache ---
    const DOMElements = {
        saveButton: document.getElementById('save-button'),
        dreamDiaryText: document.getElementById('dream-diary-text'),
        pastEntriesList: document.getElementById('past-entries-list'),
        editButton: document.getElementById('edit-button'),
        dictionaryContainer: document.getElementById('dictionary-words-container'),
        alphabetNavContainer: document.getElementById('alphabet-nav-container'),
    };

    // --- Global Variable for Highlighted Word ---
    let highlightedWord = localStorage.getItem('highlightedWord');
    let isEditingMode = false;

    // --- Dream Diary Functionality ---
    loadEntriesFromLocalStorage();

    if (DOMElements.saveButton && DOMElements.dreamDiaryText) {
        DOMElements.saveButton.addEventListener('click', () => {
            const dreamContent = DOMElements.dreamDiaryText.value.trim();
            if (dreamContent) {
                saveDreamEntry(dreamContent);
                DOMElements.dreamDiaryText.value = '';
            }
        });
    }

    if (DOMElements.editButton) {
        DOMElements.editButton.addEventListener('click', () => {
            isEditingMode = !isEditingMode;
            document.body.classList.toggle('editing-mode', isEditingMode);
            DOMElements.editButton.textContent = isEditingMode ? 'Done' : 'Edit';

            const entries = DOMElements.pastEntriesList.querySelectorAll('li');
            entries.forEach(li => {
                li.setAttribute('contenteditable', isEditingMode);
                li.classList.toggle('editing-mode', isEditingMode);
            });
        });
    }

    function saveDreamEntry(content) {
        const entries = JSON.parse(localStorage.getItem('dreamEntries')) || [];
        const timestamp = new Date().toLocaleString();
        const newEntry = { content, timestamp };
        entries.push(newEntry);
        localStorage.setItem('dreamEntries', JSON.stringify(entries));
        renderEntry(newEntry);
    }

    function renderEntry(entry) {
        const li = document.createElement('li');
        li.dataset.timestamp = entry.timestamp;

        // Use a temporary div to handle innerHTML and prevent security issues
        const tempDiv = document.createElement('div');
        tempDiv.textContent = entry.content;
        let entryContent = tempDiv.innerHTML;

        // Check for the highlighted word and replace it with a styled span
        if (highlightedWord) {
            const wordRegex = new RegExp(`\\b${highlightedWord}\\b`, 'gi');
            entryContent = entryContent.replace(wordRegex, `<span class="highlighted-word">$&</span>`);
        }

        li.innerHTML = `<b>${entry.timestamp}</b><br>${entryContent}`;

        li.addEventListener('click', () => {
            if (!isEditingMode) {
                li.classList.toggle('expanded');
            }
        });

        li.addEventListener('blur', (event) => {
            if (isEditingMode) {
                const newContent = event.target.textContent.replace(entry.timestamp, '').trim();
                updateEntry(entry.timestamp, newContent);
            }
        });

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Delete';
        deleteButton.classList.add('delete-button');
        deleteButton.addEventListener('click', (event) => {
            event.stopPropagation();
            deleteEntry(entry);
        });
        li.appendChild(deleteButton);
        DOMElements.pastEntriesList.prepend(li);
    }

    function updateEntry(timestamp, newContent) {
        const entries = JSON.parse(localStorage.getItem('dreamEntries')) || [];
        const entryIndex = entries.findIndex(entry => entry.timestamp === timestamp);
        if (entryIndex !== -1) {
            entries[entryIndex].content = newContent;
            localStorage.setItem('dreamEntries', JSON.stringify(entries));
            loadEntriesFromLocalStorage();
        }
    }

    function deleteEntry(entryToDelete) {
        const entries = JSON.parse(localStorage.getItem('dreamEntries')) || [];
        const updatedEntries = entries.filter(entry => entry.timestamp !== entryToDelete.timestamp);
        localStorage.setItem('dreamEntries', JSON.stringify(updatedEntries));
        DOMElements.pastEntriesList.innerHTML = '';
        loadEntriesFromLocalStorage();
    }

    function loadEntriesFromLocalStorage() {
        if (!DOMElements.pastEntriesList) return;
        DOMElements.pastEntriesList.innerHTML = '';
        const entries = JSON.parse(localStorage.getItem('dreamEntries')) || [];
        entries.reverse().forEach(entry => renderEntry(entry));
    }

    // --- Dream Dictionary Functionality ---
    // Make sure 'dreamInterpretations' is available globally (from definitions.js)
    if (DOMElements.dictionaryContainer && typeof dreamInterpretations !== 'undefined') {
        createAlphabetLinks();
        renderDictionary();
    }

    function renderDictionary() {
        const container = DOMElements.dictionaryContainer;
        container.innerHTML = '';

        const letters = Object.keys(dreamInterpretations).sort();
        letters.forEach(letter => {
            // Create a heading for the letter as the anchor point for the nav
            const letterHeading = document.createElement('h3');
            letterHeading.id = letter;
            letterHeading.textContent = letter;
            container.appendChild(letterHeading);

            const letterWords = dreamInterpretations[letter];
            letterWords.forEach(wordObj => {
                const wordElement = document.createElement('div');
                wordElement.classList.add('dictionary-word');
                wordElement.dataset.word = wordObj.word;
                
                // Capitalize the word for display
                const displayWord = wordObj.word.charAt(0).toUpperCase() + wordObj.word.slice(1);
                
                // Use a different element for the definition to use CSS for hover
                wordElement.innerHTML = `
                    <div class="word-text">${displayWord}</div>
                    <div class="definition-text">${wordObj.definition}</div>
                `;

                if (highlightedWord && highlightedWord.toLowerCase() === wordObj.word.toLowerCase()) {
                    wordElement.classList.add('selected');
                }

                // Attach right-click event listener for context menu
                wordElement.addEventListener('contextmenu', (event) => {
                    event.preventDefault();
                    createContextMenu(event.clientX, event.clientY, wordObj.word);
                });

                container.appendChild(wordElement);
            });
        });
    }

    function createAlphabetLinks() {
        const navContainer = DOMElements.alphabetNavContainer;
        if (!navContainer) return;

        navContainer.innerHTML = '';
        const letters = Object.keys(dreamInterpretations).sort();

        letters.forEach(letter => {
            const a = document.createElement('a');
            a.href = `#${letter}`;
            a.textContent = letter;
            a.classList.add('alphabet-link');
            navContainer.appendChild(a);
        });
    }

    function createContextMenu(x, y, word) {
        document.querySelectorAll('.context-menu').forEach(menu => menu.remove());

        const menu = document.createElement('ul');
        menu.classList.add('context-menu');

        const highlightOption = document.createElement('li');
        highlightOption.textContent = 'Highlight Word';
        highlightOption.addEventListener('click', () => {
            highlightedWord = word;
            localStorage.setItem('highlightedWord', word);
            loadEntriesFromLocalStorage();
            renderDictionary(); // Rerender to show the 'selected' class
            menu.remove();
        });
        menu.appendChild(highlightOption);

        if (highlightedWord && highlightedWord.toLowerCase() === word.toLowerCase()) {
            const removeHighlightOption = document.createElement('li');
            removeHighlightOption.textContent = 'Remove Highlight';
            removeHighlightOption.addEventListener('click', () => {
                highlightedWord = null;
                localStorage.removeItem('highlightedWord');
                loadEntriesFromLocalStorage();
                renderDictionary(); // Rerender to remove the 'selected' class
                menu.remove();
            });
            menu.appendChild(removeHighlightOption);
        }

        document.body.appendChild(menu);
        menu.style.display = 'block';
        menu.style.top = `${y}px`;
        menu.style.left = `${x}px`;

        document.addEventListener('click', (e) => {
            if (!menu.contains(e.target)) {
                menu.remove();
            }
        }, { once: true }); // Use { once: true } for better performance
    }
});