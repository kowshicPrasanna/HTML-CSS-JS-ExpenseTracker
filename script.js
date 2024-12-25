// Select DOM elements
const form = document.getElementById('entry-form');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const typeInput = document.getElementById('type');
const resetButton = document.getElementById('reset');
const entriesList = document.getElementById('entries-list');
const totalIncomeEl = document.getElementById('total-income');
const totalExpensesEl = document.getElementById('total-expenses');
const netBalanceEl = document.getElementById('net-balance');
const filterRadios = document.getElementsByName('filter');

const API_URL = 'https://676abe38863eaa5ac0df7bd3.mockapi.io/crud/users';

let entries = [];

// Fetch entries from API
async function fetchEntries() {
    try {
        const response = await fetch(API_URL);
        if (!response.ok) throw new Error('Failed to fetch entries');
        entries = await response.json();
        renderEntries();
    } catch (error) {
        console.error('Error fetching entries:', error);
    }
}

// Update summary totals
function updateTotals() {
    const income = entries.filter(e => e.type === 'income').reduce((sum, e) => sum + e.amount, 0);
    const expenses = entries.filter(e => e.type === 'expense').reduce((sum, e) => sum + e.amount, 0);
    totalIncomeEl.textContent = income.toFixed(2);
    totalExpensesEl.textContent = expenses.toFixed(2);
    netBalanceEl.textContent = (income - expenses).toFixed(2);
}

// Render entries list
function renderEntries(filter = 'all') {
    entriesList.innerHTML = '';
    const filteredEntries = filter === 'all' ? entries : entries.filter(e => e.type === filter);

    filteredEntries.forEach((entry, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span>${entry.description} - ${entry.amount.toFixed(2)} (${entry.type})</span>
            <div>
                <button onclick="editEntry(${index})">Edit</button>
                <button onclick="deleteEntry(${index})">Delete</button>
            </div>
        `;
        entriesList.appendChild(li);
    });

    updateTotals();
}

// Add or update entry
form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const description = descriptionInput.value.trim();
    const amount = parseFloat(amountInput.value);
    const type = typeInput.value;

    if (description && !isNaN(amount) && amount > 0) {
        const editingIndex = form.dataset.editIndex;
        try {   
            if (editingIndex !== undefined) {
                const updatedEntry = { description, amount, type };
                const response = await fetch(`${API_URL}/${entries[editingIndex].id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(updatedEntry)
                });
                if (!response.ok) throw new Error('Failed to update entry');
                entries[editingIndex] = await response.json();
                delete form.dataset.editIndex;
                form.querySelector('button[type="submit"]').textContent = 'Add';
            } else {
                const newEntry = { description, amount, type };
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newEntry)
                });
                if (!response.ok) throw new Error('Failed to add entry');
                const createdEntry = await response.json();
                entries.push(createdEntry);
            }

            form.reset();
            renderEntries(getSelectedFilter());
        } catch (error) {
            console.error('Error saving entry:', error);
        }
    }
});

// Delete entry
async function deleteEntry(index) {
    try {
        const response = await fetch(`${API_URL}/${entries[index].id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete entry');
        entries.splice(index, 1);
        renderEntries(getSelectedFilter());
    } catch (error) {
        console.error('Error deleting entry:', error);
    }
}

// Edit entry
function editEntry(index) {
    const entry = entries[index];
    descriptionInput.value = entry.description;
    amountInput.value = entry.amount;
    typeInput.value = entry.type;
    form.dataset.editIndex = index;
    form.querySelector('button[type="submit"]').textContent = 'Update';
}

// Reset form
resetButton.addEventListener('click', () => {
    form.reset();
    delete form.dataset.editIndex;
    form.querySelector('button[type="submit"]').textContent = 'Add';
});

// Filter entries
function getSelectedFilter() {
    return Array.from(filterRadios).find(radio => radio.checked).value;
}

filterRadios.forEach(radio => {
    radio.addEventListener('change', () => {
        renderEntries(getSelectedFilter());
    });
});

// Initial render
fetchEntries();
