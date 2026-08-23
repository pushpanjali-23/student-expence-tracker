// Student Expense & Budget Tracker
// Requires Chart.js to already be loaded in index.html.

const budgetInput = document.getElementById("budgetInput");
const saveBudgetBtn = document.getElementById("saveBudgetBtn");

const expenseForm = document.getElementById("expenseForm");
const expenseAmount = document.getElementById("expenseAmount");
const expenseCategory = document.getElementById("expenseCategory");
const expenseDescription = document.getElementById("expenseDescription");
const expenseDate = document.getElementById("expenseDate");

const totalBudget = document.getElementById("totalBudget");
const totalSpent = document.getElementById("totalSpent");
const remainingBudget = document.getElementById("remainingBudget");

const transactionList = document.getElementById("transactionList");
const emptyState = document.getElementById("emptyState");
const transactionCount = document.getElementById("transactionCount");

const chartCanvas = document.getElementById("spendingChart");

let budget = 0;
let expenses = [];
let spendingChart = null;


// Save budget and expenses to LocalStorage
function saveToLocalStorage() {
    localStorage.setItem("studentBudget", budget);
    localStorage.setItem("studentExpenses", JSON.stringify(expenses));
}


// Load budget and expenses from LocalStorage
function loadFromLocalStorage() {
    const savedBudget = localStorage.getItem("studentBudget");
    const savedExpenses = localStorage.getItem("studentExpenses");

    if (savedBudget !== null) {
        budget = Number(savedBudget);
        budgetInput.value = budget;
    }

    if (savedExpenses !== null) {
        try {
            expenses = JSON.parse(savedExpenses);

            if (!Array.isArray(expenses)) {
                expenses = [];
            }
        } catch (error) {
            expenses = [];
        }
    }
}


// Set the monthly budget
function setBudget() {
    const enteredBudget = Number(budgetInput.value);

    if (!Number.isFinite(enteredBudget) || enteredBudget < 0) {
        alert("Please enter a valid monthly budget.");
        return;
    }

    budget = enteredBudget;

    saveToLocalStorage();
    updateDashboard();
}


// Add a new expense
function addExpense(event) {
    event.preventDefault();

    const amount = Number(expenseAmount.value);
    const category = expenseCategory.value;
    const description = expenseDescription.value.trim();
    const date = expenseDate.value;

    // Validate expense details
    if (!Number.isFinite(amount) || amount <= 0) {
        alert("Please enter a valid expense amount.");
        return;
    }

    if (category === "") {
        alert("Please select an expense category.");
        return;
    }

    if (description === "") {
        alert("Please enter an expense description.");
        return;
    }

    if (date === "") {
        alert("Please select a date.");
        return;
    }

    const expense = {
        id: Date.now(),
        amount: amount,
        category: category,
        description: description,
        date: date
    };

    expenses.push(expense);

    saveToLocalStorage();
    renderExpenses();
    updateDashboard();
    updateChart();

    expenseForm.reset();
}


// Delete an expense
function deleteExpense(id) {
    expenses = expenses.filter(function (expense) {
        return expense.id !== id;
    });

    saveToLocalStorage();
    renderExpenses();
    updateDashboard();
    updateChart();
}


// Display all expenses
function renderExpenses() {
    transactionList.innerHTML = "";

    if (expenses.length === 0) {
        emptyState.classList.remove("hidden");
    } else {
        emptyState.classList.add("hidden");
    }

    if (transactionCount) {
        transactionCount.textContent =
            expenses.length === 1
                ? "1 expense recorded"
                : `${expenses.length} expenses recorded`;
    }

    // Show newest expense first
    const sortedExpenses = [...expenses].reverse();

    sortedExpenses.forEach(function (expense) {
        const transaction = document.createElement("div");
        transaction.className = "transaction";

        const info = document.createElement("div");
        info.className = "transaction-info";

        const description = document.createElement("h3");
        description.textContent = expense.description;

        const details = document.createElement("p");
        details.className = "transaction-meta";
        details.textContent =
            `${expense.category} • ${formatDate(expense.date)}`;

        info.appendChild(description);
        info.appendChild(details);

        const amount = document.createElement("div");
        amount.className = "transaction-amount";
        amount.textContent = formatCurrency(expense.amount);

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-btn";
        deleteButton.textContent = "Delete";

        deleteButton.addEventListener("click", function () {
            deleteExpense(expense.id);
        });

        transaction.appendChild(info);
        transaction.appendChild(amount);
        transaction.appendChild(deleteButton);

        transactionList.appendChild(transaction);
    });
}


// Update dashboard values
function updateDashboard() {
    const spent = expenses.reduce(function (total, expense) {
        return total + Number(expense.amount);
    }, 0);

    const remaining = budget - spent;

    totalBudget.textContent = formatCurrency(budget);
    totalSpent.textContent = formatCurrency(spent);
    remainingBudget.textContent = formatCurrency(remaining);

    // Keep the existing CSS class if it is present in style.css
    if (remaining < 0) {
        remainingBudget.classList.add("over-budget");
    } else {
        remainingBudget.classList.remove("over-budget");
    }
}


// Create/update category-wise Chart.js chart
function updateChart() {
    if (!chartCanvas) {
        return;
    }

    // Chart.js must already be included in index.html
    if (typeof Chart === "undefined") {
        console.warn(
            "Chart.js is not loaded. Add Chart.js to index.html before this script."
        );
        return;
    }

    const categoryTotals = {};

    expenses.forEach(function (expense) {
        if (!categoryTotals[expense.category]) {
            categoryTotals[expense.category] = 0;
        }

        categoryTotals[expense.category] += Number(expense.amount);
    });

    const categories = Object.keys(categoryTotals);
    const amounts = Object.values(categoryTotals);

    // Destroy the old chart before creating a new one
    if (spendingChart) {
        spendingChart.destroy();
    }

    spendingChart = new Chart(chartCanvas, {
        type: "bar",
        data: {
            labels: categories,
            datasets: [
                {
                    label: "Amount Spent",
                    data: amounts
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}


// Format amount as Indian currency
function formatCurrency(amount) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 2
    }).format(amount);
}


// Format transaction date
function formatDate(date) {
    const dateObject = new Date(`${date}T00:00:00`);

    if (Number.isNaN(dateObject.getTime())) {
        return date;
    }

    return dateObject.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}


// Save budget when the Save Budget button is clicked
saveBudgetBtn.addEventListener("click", setBudget);


// Add expense when the form is submitted
expenseForm.addEventListener("submit", addExpense);


// Load saved data when the page opens
loadFromLocalStorage();


// Display saved data
renderExpenses();
updateDashboard();
updateChart();