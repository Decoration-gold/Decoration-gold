/* =========================================================
   DECORATION GOLD INC
   FUNCIONAMIENTO DEL MÓDULO DE GASTOS
   ========================================================= */

const expenseForm = document.getElementById("expenseForm");

const expenseDate = document.getElementById("expenseDate");
const expenseDescription = document.getElementById("expenseDescription");
const expenseCategory = document.getElementById("expenseCategory");
const expenseType = document.getElementById("expenseType");
const expensePayment = document.getElementById("expensePayment");
const expenseAmount = document.getElementById("expenseAmount");
const expenseNotes = document.getElementById("expenseNotes");

const expensesTableBody = document.getElementById("expensesTableBody");

const todayExpenses = document.getElementById("todayExpenses");
const weekExpenses = document.getElementById("weekExpenses");
const monthExpenses = document.getElementById("monthExpenses");

const expenseSearch = document.getElementById("expenseSearch");
const categoryFilter = document.getElementById("categoryFilter");

const deleteAllButton = document.getElementById("deleteAllButton");
const notification = document.getElementById("notification");

const STORAGE_KEY = "decorationGoldExpenses";

let expenses = loadExpenses();

/* =========================================================
   INICIAR EL MÓDULO
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
    setTodayDate();
    renderExpenses();
    updateSummary();
});

/* =========================================================
   GUARDAR UN NUEVO GASTO
   ========================================================= */

expenseForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const descriptionValue = expenseDescription.value.trim();
    const amountValue = Number(expenseAmount.value);

    if (
        !expenseDate.value ||
        !descriptionValue ||
        !expenseCategory.value ||
        !expenseType.value ||
        !expensePayment.value ||
        !amountValue ||
        amountValue <= 0
    ) {
        showNotification(
            "Completa correctamente todos los campos obligatorios.",
            "error"
        );

        return;
    }

    const newExpense = {
        id: createExpenseId(),
        date: expenseDate.value,
        description: descriptionValue,
        category: expenseCategory.value,
        type: expenseType.value,
        payment: expensePayment.value,
        amount: amountValue,
        notes: expenseNotes.value.trim(),
        createdAt: new Date().toISOString()
    };

    expenses.unshift(newExpense);

    saveExpenses();
    renderExpenses();
    updateSummary();

    expenseForm.reset();
    setTodayDate();

    showNotification("Gasto guardado correctamente.");
});

/* =========================================================
   BUSCAR Y FILTRAR
   ========================================================= */

expenseSearch.addEventListener("input", function () {
    renderExpenses();
});

categoryFilter.addEventListener("change", function () {
    renderExpenses();
});

/* =========================================================
   BORRAR TODOS LOS GASTOS
   ========================================================= */

deleteAllButton.addEventListener("click", function () {
    if (expenses.length === 0) {
        showNotification("No hay gastos registrados.", "error");
        return;
    }

    const confirmation = window.confirm(
        "¿Seguro que quieres borrar todos los gastos registrados?"
    );

    if (!confirmation) {
        return;
    }

    expenses = [];

    saveExpenses();
    renderExpenses();
    updateSummary();

    showNotification("Todos los gastos fueron eliminados.");
});

/* =========================================================
   MOSTRAR LOS GASTOS EN LA TABLA
   ========================================================= */

function renderExpenses() {
    const searchValue = expenseSearch.value.trim().toLowerCase();
    const selectedCategory = categoryFilter.value;

    const filteredExpenses = expenses.filter(function (expense) {
        const matchesSearch =
            expense.description.toLowerCase().includes(searchValue) ||
            expense.category.toLowerCase().includes(searchValue) ||
            expense.type.toLowerCase().includes(searchValue) ||
            expense.payment.toLowerCase().includes(searchValue) ||
            (expense.notes || "").toLowerCase().includes(searchValue);

        const matchesCategory =
            selectedCategory === "Todas" ||
            expense.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    expensesTableBody.innerHTML = "";

    if (filteredExpenses.length === 0) {
        showEmptyState(searchValue, selectedCategory);
        return;
    }

    filteredExpenses.forEach(function (expense) {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${formatDate(expense.date)}</td>

            <td>
                <strong>${escapeHTML(expense.description)}</strong>

                ${
                    expense.notes
                        ? `<div class="expense-note">
                            ${escapeHTML(expense.notes)}
                           </div>`
                        : ""
                }
            </td>

            <td>
                <span class="category-badge">
                    ${escapeHTML(expense.category)}
                </span>
            </td>

            <td>
                <span class="type-badge">
                    ${escapeHTML(expense.type)}
                </span>
            </td>

            <td>
                ${escapeHTML(expense.payment)}
            </td>

            <td>
                <span class="amount-cell">
                    ${formatMoney(expense.amount)}
                </span>
            </td>

            <td>
                <button
                    type="button"
                    class="delete-expense-button"
                    data-id="${expense.id}"
                    aria-label="Eliminar gasto"
                    title="Eliminar gasto"
                >
                    ×
                </button>
            </td>
        `;

        expensesTableBody.appendChild(row);
    });

    addDeleteButtonEvents();
}

/* =========================================================
   ESTADO VACÍO
   ========================================================= */

function showEmptyState(searchValue, selectedCategory) {
    let title = "Todavía no hay gastos";
    let description = "Los gastos que registres aparecerán aquí.";

    if (expenses.length > 0) {
        title = "No se encontraron resultados";
        description = "Prueba con otra búsqueda o categoría.";
    }

    expensesTableBody.innerHTML = `
        <tr class="empty-row">
            <td colspan="7">

                <div class="empty-state">

                    <div class="empty-icon">
                        $
                    </div>

                    <strong>
                        ${title}
                    </strong>

                    <span>
                        ${description}
                    </span>

                </div>

            </td>
        </tr>
    `;
}

/* =========================================================
   ELIMINAR UN SOLO GASTO
   ========================================================= */

function addDeleteButtonEvents() {
    const deleteButtons = document.querySelectorAll(
        ".delete-expense-button"
    );

    deleteButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            const expenseId = button.dataset.id;

            deleteExpense(expenseId);
        });
    });
}

function deleteExpense(expenseId) {
    const selectedExpense = expenses.find(function (expense) {
        return expense.id === expenseId;
    });

    if (!selectedExpense) {
        showNotification("No se encontró el gasto.", "error");
        return;
    }

    const confirmation = window.confirm(
        `¿Quieres eliminar el gasto "${selectedExpense.description}"?`
    );

    if (!confirmation) {
        return;
    }

    expenses = expenses.filter(function (expense) {
        return expense.id !== expenseId;
    });

    saveExpenses();
    renderExpenses();
    updateSummary();

    showNotification("Gasto eliminado correctamente.");
}

/* =========================================================
   CALCULAR RESÚMENES
   ========================================================= */

function updateSummary() {
    const today = getLocalDateString(new Date());

    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    const startOfWeek = getStartOfWeek(currentDate);

    const startOfMonth = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
    );

    const totalToday = expenses
        .filter(function (expense) {
            return expense.date === today;
        })
        .reduce(function (total, expense) {
            return total + Number(expense.amount);
        }, 0);

    const totalWeek = expenses
        .filter(function (expense) {
            const expenseDateValue = createLocalDate(expense.date);

            return (
                expenseDateValue >= startOfWeek &&
                expenseDateValue <= currentDate
            );
        })
        .reduce(function (total, expense) {
            return total + Number(expense.amount);
        }, 0);

    const totalMonth = expenses
        .filter(function (expense) {
            const expenseDateValue = createLocalDate(expense.date);

            return (
                expenseDateValue >= startOfMonth &&
                expenseDateValue <= currentDate
            );
        })
        .reduce(function (total, expense) {
            return total + Number(expense.amount);
        }, 0);

    todayExpenses.textContent = formatMoney(totalToday);
    weekExpenses.textContent = formatMoney(totalWeek);
    monthExpenses.textContent = formatMoney(totalMonth);
}

/* =========================================================
   GUARDAR Y CARGAR DATOS
   ========================================================= */

function saveExpenses() {
    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(expenses)
        );
    } catch (error) {
        console.error("No se pudieron guardar los gastos:", error);

        showNotification(
            "No fue posible guardar la información.",
            "error"
        );
    }
}

function loadExpenses() {
    try {
        const savedExpenses = localStorage.getItem(STORAGE_KEY);

        if (!savedExpenses) {
            return [];
        }

        const parsedExpenses = JSON.parse(savedExpenses);

        if (!Array.isArray(parsedExpenses)) {
            return [];
        }

        return parsedExpenses;
    } catch (error) {
        console.error("No se pudieron cargar los gastos:", error);

        return [];
    }
}

/* =========================================================
   FECHA ACTUAL
   ========================================================= */

function setTodayDate() {
    expenseDate.value = getLocalDateString(new Date());
}

function getLocalDateString(date) {
    const year = date.getFullYear();

    const month = String(
        date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
        date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function createLocalDate(dateString) {
    const dateParts = dateString.split("-");

    const year = Number(dateParts[0]);
    const month = Number(dateParts[1]) - 1;
    const day = Number(dateParts[2]);

    const date = new Date(year, month, day);

    date.setHours(0, 0, 0, 0);

    return date;
}

function getStartOfWeek(date) {
    const startDate = new Date(date);

    const currentDay = startDate.getDay();

    const daysSinceMonday =
        currentDay === 0
            ? 6
            : currentDay - 1;

    startDate.setDate(
        startDate.getDate() - daysSinceMonday
    );

    startDate.setHours(0, 0, 0, 0);

    return startDate;
}

/* =========================================================
   FORMATO DE FECHA Y DINERO
   ========================================================= */

function formatDate(dateString) {
    const date = createLocalDate(dateString);

    return new Intl.DateTimeFormat(
        "es-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    ).format(date);
}

function formatMoney(amount) {
    return new Intl.NumberFormat(
        "en-US",
        {
            style: "currency",
            currency: "USD"
        }
    ).format(Number(amount) || 0);
}

/* =========================================================
   CREAR IDENTIFICADOR ÚNICO
   ========================================================= */

function createExpenseId() {
    if (
        typeof crypto !== "undefined" &&
        typeof crypto.randomUUID === "function"
    ) {
        return crypto.randomUUID();
    }

    return (
        Date.now().toString() +
        "-" +
        Math.random().toString(16).slice(2)
    );
}

/* =========================================================
   PROTEGER EL TEXTO INSERTADO EN LA TABLA
   ========================================================= */

function escapeHTML(value) {
    const text = String(value);

    return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

/* =========================================================
   NOTIFICACIONES
   ========================================================= */

let notificationTimer;

function showNotification(message, type = "success") {
    clearTimeout(notificationTimer);

    notification.textContent = message;

    if (type === "error") {
        notification.style.borderColor = "#a33b3b";
        notification.style.color = "#ffd4d4";
    } else {
        notification.style.borderColor = "#c79a36";
        notification.style.color = "#e5c979";
    }

    notification.classList.add("show");

    notificationTimer = setTimeout(function () {
        notification.classList.remove("show");
    }, 3000);
}
