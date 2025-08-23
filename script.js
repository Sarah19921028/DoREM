document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Element Cache ---
    const DOMElements = {
        saveButton: document.getElementById('save-button'),
        dreamDiaryText: document.getElementById('dream-diary-text'),
        pastEntriesList: document.getElementById('past-entries-list'),
        editButton: document.getElementById('edit-button'),
        dictionaryContainer: document.getElementById('dictionary-words-container'),
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
            
            // Toggle contenteditable attribute on past entries
            const entries = DOMElements.pastEntriesList.querySelectorAll('li');
            entries.forEach(li => {
                li.setAttribute('contenteditable', isEditingMode);
                if (isEditingMode) {
                    li.classList.add('editing-mode');
                } else {
                    li.classList.remove('editing-mode');
                }
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
        li.dataset.timestamp = entry.timestamp; // Use a data attribute for easier lookup
        
        let entryContent = entry.content;
        
        if (highlightedWord) {
            const wordRegex = new RegExp(`\\b${highlightedWord}\\b`, 'gi');
            entryContent = entry.content.replace(wordRegex, `<span class="highlighted-word">$&</span>`);
        }
        
        li.innerHTML = `<b>${entry.timestamp}</b><br>${entryContent}`;
        
        li.addEventListener('click', () => {
            // Prevent expansion when in edit mode
            if (!isEditingMode) {
                li.classList.toggle('expanded');
            }
        });
        
        // Listen for changes when in contenteditable mode
        li.addEventListener('blur', (event) => {
            if (isEditingMode) {
                const newContent = event.target.textContent.replace(entry.timestamp, '').trim();
                updateEntry(entry.timestamp, newContent);
            }
        });

        // Delete button
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
            // Reload entries to apply potential new highlights
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
    if (DOMElements.dictionaryContainer && typeof dreamInterpretations !== 'undefined') {
        renderDictionary();
    }

    function renderDictionary() {
        const words = Object.keys(dreamInterpretations).sort();
        words.forEach(word => {
            const wordElement = document.createElement('div');
            wordElement.classList.add('dictionary-word');
            wordElement.textContent = word.charAt(0).toUpperCase() + word.slice(1);
            wordElement.dataset.word = word;

            if (highlightedWord && highlightedWord.toLowerCase() === word.toLowerCase()) {
                wordElement.classList.add('selected');
            }

            wordElement.addEventListener('contextmenu', (event) => {
                event.preventDefault();
                createContextMenu(event.clientX, event.clientY, word);
            });

            wordElement.addEventListener('click', () => {
                document.querySelectorAll('.definition-text').forEach(el => el.remove());
                const definition = dreamInterpretations[word];
                const definitionElement = document.createElement('p');
                definitionElement.classList.add('definition-text');
                definitionElement.textContent = definition;
                wordElement.appendChild(definitionElement);
            });

            DOMElements.dictionaryContainer.appendChild(wordElement);
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
        });
    }

});