/* =========================================================
   DECORATION GOLD INC
   FUNCIONAMIENTO DEL MÓDULO DE COMPRAS
   ========================================================= */

const PURCHASES_STORAGE_KEY = "decorationGoldPurchases";

/* =========================================================
   ELEMENTOS PRINCIPALES
   ========================================================= */

const purchaseForm = document.getElementById("purchaseForm");

const purchaseDate = document.getElementById("purchaseDate");
const purchaseSupplier = document.getElementById("purchaseSupplier");
const purchaseInvoice = document.getElementById("purchaseInvoice");
const purchaseOrder = document.getElementById("purchaseOrder");
const purchaseStatus = document.getElementById("purchaseStatus");
const purchasePaymentStatus = document.getElementById(
    "purchasePaymentStatus"
);
const purchasePaymentMethod = document.getElementById(
    "purchasePaymentMethod"
);
const purchaseExpectedDate = document.getElementById(
    "purchaseExpectedDate"
);
const purchaseNotes = document.getElementById("purchaseNotes");

const purchaseShipping = document.getElementById("purchaseShipping");
const purchaseTaxes = document.getElementById("purchaseTaxes");
const purchaseOtherCosts = document.getElementById(
    "purchaseOtherCosts"
);
const purchaseDiscount = document.getElementById(
    "purchaseDiscount"
);

const purchaseItemsContainer = document.getElementById(
    "purchaseItemsContainer"
);
const purchaseItemTemplate = document.getElementById(
    "purchaseItemTemplate"
);
const addProductButton = document.getElementById("addProductButton");

const clearPurchaseButton = document.getElementById(
    "clearPurchaseButton"
);

const productsSubtotal = document.getElementById("productsSubtotal");
const shippingTotal = document.getElementById("shippingTotal");
const taxesTotal = document.getElementById("taxesTotal");
const otherCostsTotal = document.getElementById(
    "otherCostsTotal"
);
const discountTotal = document.getElementById("discountTotal");
const purchaseGrandTotal = document.getElementById(
    "purchaseGrandTotal"
);

const todayPurchases = document.getElementById("todayPurchases");
const weekPurchases = document.getElementById("weekPurchases");
const monthPurchases = document.getElementById("monthPurchases");
const pendingPurchases = document.getElementById("pendingPurchases");

const todayPurchasesStatus = document.getElementById(
    "todayPurchasesStatus"
);
const weekPurchasesStatus = document.getElementById(
    "weekPurchasesStatus"
);
const monthPurchasesStatus = document.getElementById(
    "monthPurchasesStatus"
);
const pendingPurchasesStatus = document.getElementById(
    "pendingPurchasesStatus"
);

const purchaseSearch = document.getElementById("purchaseSearch");
const purchaseStatusFilter = document.getElementById(
    "purchaseStatusFilter"
);
const purchasePaymentFilter = document.getElementById(
    "purchasePaymentFilter"
);
const purchasePeriodFilter = document.getElementById(
    "purchasePeriodFilter"
);

const purchasesTableBody = document.getElementById(
    "purchasesTableBody"
);
const deleteAllPurchasesButton = document.getElementById(
    "deleteAllPurchasesButton"
);

const purchaseDetailsModal = document.getElementById(
    "purchaseDetailsModal"
);
const purchaseModalBody = document.getElementById(
    "purchaseModalBody"
);
const closePurchaseModalButton = document.getElementById(
    "closePurchaseModalButton"
);

const purchaseNotification = document.getElementById(
    "purchaseNotification"
);

let purchases = loadPurchases();
let notificationTimer;

/* =========================================================
   INICIAR MÓDULO
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
    setTodayDate();
    prepareExistingProductCard();
    calculatePurchaseTotals();
    renderPurchases();
    updatePurchaseSummary();
});

/* =========================================================
   PREPARAR PRIMER PRODUCTO
   ========================================================= */

function prepareExistingProductCard() {
    const firstProductCard = purchaseItemsContainer.querySelector(
        ".purchase-item-card"
    );

    if (!firstProductCard) {
        return;
    }

    addProductCardEvents(firstProductCard);
    updateProductNumbers();
    updateRemoveButtons();
}

/* =========================================================
   AGREGAR PRODUCTOS
   ========================================================= */

addProductButton.addEventListener("click", function () {
    const templateContent =
        purchaseItemTemplate.content.cloneNode(true);

    purchaseItemsContainer.appendChild(templateContent);

    const productCards = purchaseItemsContainer.querySelectorAll(
        ".purchase-item-card"
    );

    const newProductCard =
        productCards[productCards.length - 1];

    addProductCardEvents(newProductCard);
    updateProductNumbers();
    updateRemoveButtons();

    const productNameInput =
        newProductCard.querySelector(".item-name");

    if (productNameInput) {
        productNameInput.focus();
    }

    showPurchaseNotification("Producto agregado.");
});

/* =========================================================
   EVENTOS DE CADA PRODUCTO
   ========================================================= */

function addProductCardEvents(productCard) {
    const quantityInput = productCard.querySelector(
        ".item-quantity"
    );

    const unitCostInput = productCard.querySelector(
        ".item-unit-cost"
    );

    const receivedQuantityInput = productCard.querySelector(
        ".item-received-quantity"
    );

    const removeButton = productCard.querySelector(
        ".remove-product-button"
    );

    if (quantityInput) {
        quantityInput.addEventListener("input", function () {
            validateReceivedQuantity(productCard);
            calculateProductTotal(productCard);
            calculatePurchaseTotals();
        });
    }

    if (unitCostInput) {
        unitCostInput.addEventListener("input", function () {
            calculateProductTotal(productCard);
            calculatePurchaseTotals();
        });
    }

    if (receivedQuantityInput) {
        receivedQuantityInput.addEventListener(
            "input",
            function () {
                validateReceivedQuantity(productCard);
            }
        );
    }

    if (removeButton) {
        removeButton.addEventListener("click", function () {
            removeProductCard(productCard);
        });
    }
}

/* =========================================================
   VALIDAR CANTIDAD RECIBIDA
   ========================================================= */

function validateReceivedQuantity(productCard) {
    const quantityInput = productCard.querySelector(
        ".item-quantity"
    );

    const receivedQuantityInput = productCard.querySelector(
        ".item-received-quantity"
    );

    if (!quantityInput || !receivedQuantityInput) {
        return;
    }

    const purchasedQuantity = Math.max(
        1,
        Number(quantityInput.value) || 1
    );

    let receivedQuantity = Math.max(
        0,
        Number(receivedQuantityInput.value) || 0
    );

    if (receivedQuantity > purchasedQuantity) {
        receivedQuantity = purchasedQuantity;
        receivedQuantityInput.value = purchasedQuantity;
    }
}

/* =========================================================
   ELIMINAR PRODUCTO
   ========================================================= */

function removeProductCard(productCard) {
    const productCards = purchaseItemsContainer.querySelectorAll(
        ".purchase-item-card"
    );

    if (productCards.length <= 1) {
        showPurchaseNotification(
            "La compra debe tener al menos un producto.",
            "error"
        );

        return;
    }

    productCard.remove();

    updateProductNumbers();
    updateRemoveButtons();
    calculatePurchaseTotals();

    showPurchaseNotification("Producto eliminado.");
}

/* =========================================================
   NUMERAR PRODUCTOS
   ========================================================= */

function updateProductNumbers() {
    const productCards = purchaseItemsContainer.querySelectorAll(
        ".purchase-item-card"
    );

    productCards.forEach(function (productCard, index) {
        productCard.dataset.itemIndex = index;

        const productNumber = productCard.querySelector(
            ".purchase-item-number"
        );

        if (productNumber) {
            productNumber.textContent = `Producto ${index + 1}`;
        }
    });
}

/* =========================================================
   ACTIVAR O DESACTIVAR BOTONES DE ELIMINAR
   ========================================================= */

function updateRemoveButtons() {
    const productCards = purchaseItemsContainer.querySelectorAll(
        ".purchase-item-card"
    );

    const removeButtons = purchaseItemsContainer.querySelectorAll(
        ".remove-product-button"
    );

    removeButtons.forEach(function (button) {
        button.disabled = productCards.length <= 1;
    });
}

/* =========================================================
   CALCULAR TOTAL DE CADA PRODUCTO
   ========================================================= */

function calculateProductTotal(productCard) {
    const quantityInput = productCard.querySelector(
        ".item-quantity"
    );

    const unitCostInput = productCard.querySelector(
        ".item-unit-cost"
    );

    const totalInput = productCard.querySelector(
        ".item-total"
    );

    const quantity = Math.max(
        0,
        Number(quantityInput?.value) || 0
    );

    const unitCost = Math.max(
        0,
        Number(unitCostInput?.value) || 0
    );

    const productTotal = quantity * unitCost;

    if (totalInput) {
        totalInput.value = productTotal.toFixed(2);
    }

    return productTotal;
}

/* =========================================================
   CALCULAR TOTAL GENERAL
   ========================================================= */

[
    purchaseShipping,
    purchaseTaxes,
    purchaseOtherCosts,
    purchaseDiscount
].forEach(function (input) {
    input.addEventListener("input", calculatePurchaseTotals);
});

function calculatePurchaseTotals() {
    const productCards = purchaseItemsContainer.querySelectorAll(
        ".purchase-item-card"
    );

    let subtotal = 0;

    productCards.forEach(function (productCard) {
        subtotal += calculateProductTotal(productCard);
    });

    const shipping = getPositiveNumber(purchaseShipping.value);
    const taxes = getPositiveNumber(purchaseTaxes.value);
    const otherCosts = getPositiveNumber(
        purchaseOtherCosts.value
    );
    const discount = getPositiveNumber(
        purchaseDiscount.value
    );

    const grandTotal = Math.max(
        0,
        subtotal + shipping + taxes + otherCosts - discount
    );

    productsSubtotal.textContent = formatMoney(subtotal);
    shippingTotal.textContent = formatMoney(shipping);
    taxesTotal.textContent = formatMoney(taxes);
    otherCostsTotal.textContent = formatMoney(otherCosts);
    discountTotal.textContent = `-${formatMoney(discount)}`;
    purchaseGrandTotal.textContent = formatMoney(grandTotal);

    return {
        subtotal,
        shipping,
        taxes,
        otherCosts,
        discount,
        grandTotal
    };
}

/* =========================================================
   GUARDAR COMPRA
   ========================================================= */

purchaseForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const items = collectPurchaseItems();

    if (!validatePurchaseForm(items)) {
        return;
    }

    const totals = calculatePurchaseTotals();

    const newPurchase = {
        id: createUniqueId(),
        date: purchaseDate.value,
        supplier: purchaseSupplier.value.trim(),
        invoice: purchaseInvoice.value.trim(),
        orderNumber: purchaseOrder.value.trim(),
        status: purchaseStatus.value,
        paymentStatus: purchasePaymentStatus.value,
        paymentMethod: purchasePaymentMethod.value,
        expectedDate: purchaseExpectedDate.value,
        notes: purchaseNotes.value.trim(),

        items,

        subtotal: totals.subtotal,
        shipping: totals.shipping,
        taxes: totals.taxes,
        otherCosts: totals.otherCosts,
        discount: totals.discount,
        total: totals.grandTotal,

        createdAt: new Date().toISOString()
    };

    purchases.unshift(newPurchase);

    savePurchases();
    renderPurchases();
    updatePurchaseSummary();
    resetPurchaseForm();

    showPurchaseNotification(
        "Compra guardada correctamente."
    );
});

/* =========================================================
   RECOGER PRODUCTOS DEL FORMULARIO
   ========================================================= */

function collectPurchaseItems() {
    const productCards = purchaseItemsContainer.querySelectorAll(
        ".purchase-item-card"
    );

    return Array.from(productCards).map(function (
        productCard,
        index
    ) {
        const quantity = Math.max(
            1,
            Number(
                productCard.querySelector(".item-quantity")
                    ?.value
            ) || 1
        );

        const receivedQuantity = Math.max(
            0,
            Number(
                productCard.querySelector(
                    ".item-received-quantity"
                )?.value
            ) || 0
        );

        const unitCost = getPositiveNumber(
            productCard.querySelector(".item-unit-cost")
                ?.value
        );

        return {
            id: createUniqueId(),
            position: index + 1,
            name:
                productCard
                    .querySelector(".item-name")
                    ?.value.trim() || "",
            sku:
                productCard
                    .querySelector(".item-sku")
                    ?.value.trim() || "",
            category:
                productCard.querySelector(".item-category")
                    ?.value || "",
            variant:
                productCard
                    .querySelector(".item-variant")
                    ?.value.trim() || "",
            quantity,
            receivedQuantity: Math.min(
                receivedQuantity,
                quantity
            ),
            unitCost,
            salePrice: getPositiveNumber(
                productCard.querySelector(".item-sale-price")
                    ?.value
            ),
            total: quantity * unitCost,
            location:
                productCard
                    .querySelector(".item-location")
                    ?.value.trim() || "",
            notes:
                productCard
                    .querySelector(".item-notes")
                    ?.value.trim() || ""
        };
    });
}

/* =========================================================
   VALIDAR COMPRA
   ========================================================= */

function validatePurchaseForm(items) {
    if (!purchaseDate.value) {
        showPurchaseNotification(
            "Selecciona la fecha de compra.",
            "error"
        );

        purchaseDate.focus();
        return false;
    }

    if (!purchaseSupplier.value.trim()) {
        showPurchaseNotification(
            "Escribe el nombre del proveedor.",
            "error"
        );

        purchaseSupplier.focus();
        return false;
    }

    if (!purchaseStatus.value) {
        showPurchaseNotification(
            "Selecciona el estado de la compra.",
            "error"
        );

        purchaseStatus.focus();
        return false;
    }

    if (!purchasePaymentStatus.value) {
        showPurchaseNotification(
            "Selecciona el estado del pago.",
            "error"
        );

        purchasePaymentStatus.focus();
        return false;
    }

    if (!purchasePaymentMethod.value) {
        showPurchaseNotification(
            "Selecciona el método de pago.",
            "error"
        );

        purchasePaymentMethod.focus();
        return false;
    }

    for (let index = 0; index < items.length; index++) {
        const item = items[index];

        if (!item.name) {
            showPurchaseNotification(
                `Escribe el nombre del producto ${index + 1}.`,
                "error"
            );

            focusProductField(index, ".item-name");
            return false;
        }

        if (!item.category) {
            showPurchaseNotification(
                `Selecciona la categoría del producto ${index + 1}.`,
                "error"
            );

            focusProductField(index, ".item-category");
            return false;
        }

        if (item.quantity <= 0) {
            showPurchaseNotification(
                `La cantidad del producto ${index + 1} debe ser mayor que cero.`,
                "error"
            );

            focusProductField(index, ".item-quantity");
            return false;
        }

        if (item.unitCost <= 0) {
            showPurchaseNotification(
                `Escribe el costo del producto ${index + 1}.`,
                "error"
            );

            focusProductField(index, ".item-unit-cost");
            return false;
        }
    }

    return true;
}

function focusProductField(index, selector) {
    const productCards = purchaseItemsContainer.querySelectorAll(
        ".purchase-item-card"
    );

    const field = productCards[index]?.querySelector(selector);

    if (field) {
        field.focus();
        field.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }
}

/* =========================================================
   LIMPIAR FORMULARIO
   ========================================================= */

clearPurchaseButton.addEventListener("click", function () {
    setTimeout(function () {
        resetProductCards();
        setTodayDate();
        calculatePurchaseTotals();
    }, 0);
});

function resetPurchaseForm() {
    purchaseForm.reset();

    resetProductCards();
    setTodayDate();
    calculatePurchaseTotals();

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

function resetProductCards() {
    const productCards = purchaseItemsContainer.querySelectorAll(
        ".purchase-item-card"
    );

    productCards.forEach(function (productCard, index) {
        if (index > 0) {
            productCard.remove();
        }
    });

    const firstProductCard = purchaseItemsContainer.querySelector(
        ".purchase-item-card"
    );

    if (firstProductCard) {
        const quantityInput = firstProductCard.querySelector(
            ".item-quantity"
        );

        const receivedQuantityInput =
            firstProductCard.querySelector(
                ".item-received-quantity"
            );

        const totalInput =
            firstProductCard.querySelector(".item-total");

        if (quantityInput) {
            quantityInput.value = 1;
        }

        if (receivedQuantityInput) {
            receivedQuantityInput.value = 0;
        }

        if (totalInput) {
            totalInput.value = "0.00";
        }
    }

    updateProductNumbers();
    updateRemoveButtons();
}

/* =========================================================
   MOSTRAR COMPRAS EN LA TABLA
   ========================================================= */

function renderPurchases() {
    const filteredPurchases = getFilteredPurchases();

    purchasesTableBody.innerHTML = "";

    if (filteredPurchases.length === 0) {
        renderEmptyPurchasesState();
        return;
    }

    filteredPurchases.forEach(function (purchase) {
        const row = document.createElement("tr");

        const productCount = purchase.items.reduce(
            function (total, item) {
                return total + Number(item.quantity || 0);
            },
            0
        );

        row.innerHTML = `
            <td>
                ${formatDate(purchase.date)}
            </td>

            <td>
                <strong>
                    ${escapeHTML(purchase.supplier)}
                </strong>

                ${
                    purchase.orderNumber
                        ? `<small>
                            Orden: ${escapeHTML(
                                purchase.orderNumber
                            )}
                           </small>`
                        : ""
                }
            </td>

            <td>
                ${
                    purchase.invoice
                        ? escapeHTML(purchase.invoice)
                        : "Sin factura"
                }
            </td>

            <td>
                <strong>
                    ${productCount}
                </strong>

                <small>
                    ${
                        purchase.items.length === 1
                            ? "1 tipo de producto"
                            : `${purchase.items.length} tipos de productos`
                    }
                </small>
            </td>

            <td>
                ${createPurchaseStatusBadge(
                    purchase.status
                )}
            </td>

            <td>
                ${createPaymentStatusBadge(
                    purchase.paymentStatus
                )}
            </td>

            <td>
                <span class="purchase-total-cell">
                    ${formatMoney(purchase.total)}
                </span>
            </td>

            <td>
                <div class="purchase-actions-cell">

                    <button
                        type="button"
                        class="view-purchase-button"
                        data-purchase-id="${purchase.id}"
                        aria-label="Ver compra"
                        title="Ver detalles"
                    >
                        ◉
                    </button>

                    <button
                        type="button"
                        class="delete-purchase-button"
                        data-purchase-id="${purchase.id}"
                        aria-label="Eliminar compra"
                        title="Eliminar compra"
                    >
                        ×
                    </button>

                </div>
            </td>
        `;

        purchasesTableBody.appendChild(row);
    });

    addPurchaseTableEvents();
}

/* =========================================================
   FILTROS Y BÚSQUEDA
   ========================================================= */

purchaseSearch.addEventListener("input", renderPurchases);
purchaseStatusFilter.addEventListener("change", renderPurchases);
purchasePaymentFilter.addEventListener("change", renderPurchases);
purchasePeriodFilter.addEventListener("change", renderPurchases);

function getFilteredPurchases() {
    const searchValue = purchaseSearch.value
        .trim()
        .toLowerCase();

    const statusValue = purchaseStatusFilter.value;
    const paymentValue = purchasePaymentFilter.value;
    const periodValue = purchasePeriodFilter.value;

    return purchases.filter(function (purchase) {
        const productSearchText = purchase.items
            .map(function (item) {
                return [
                    item.name,
                    item.sku,
                    item.category,
                    item.variant
                ].join(" ");
            })
            .join(" ")
            .toLowerCase();

        const generalSearchText = [
            purchase.supplier,
            purchase.invoice,
            purchase.orderNumber,
            purchase.paymentMethod,
            purchase.notes,
            productSearchText
        ]
            .join(" ")
            .toLowerCase();

        const matchesSearch =
            generalSearchText.includes(searchValue);

        const matchesStatus =
            statusValue === "Todos" ||
            purchase.status === statusValue;

        const matchesPayment =
            paymentValue === "Todos" ||
            purchase.paymentStatus === paymentValue;

        const matchesPeriod = purchaseMatchesPeriod(
            purchase.date,
            periodValue
        );

        return (
            matchesSearch &&
            matchesStatus &&
            matchesPayment &&
            matchesPeriod
        );
    });
}

function purchaseMatchesPeriod(dateString, period) {
    if (period === "Todos") {
        return true;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const purchaseDateValue = createLocalDate(dateString);

    if (period === "Hoy") {
        return (
            getLocalDateString(purchaseDateValue) ===
            getLocalDateString(today)
        );
    }

    if (period === "Semana") {
        const startOfWeek = getStartOfWeek(today);

        return (
            purchaseDateValue >= startOfWeek &&
            purchaseDateValue <= today
        );
    }

    if (period === "Mes") {
        return (
            purchaseDateValue.getFullYear() ===
                today.getFullYear() &&
            purchaseDateValue.getMonth() === today.getMonth()
        );
    }

    return true;
}

/* =========================================================
   ESTADO VACÍO
   ========================================================= */

function renderEmptyPurchasesState() {
    const hasPurchases = purchases.length > 0;

    purchasesTableBody.innerHTML = `
        <tr class="purchases-empty-row">

            <td colspan="8">

                <div class="purchases-empty-state">

                    <div class="purchases-empty-icon">
                        ◆
                    </div>

                    <strong>
                        ${
                            hasPurchases
                                ? "No se encontraron resultados"
                                : "Todavía no hay compras"
                        }
                    </strong>

                    <span>
                        ${
                            hasPurchases
                                ? "Prueba con otros filtros o términos de búsqueda."
                                : "Las compras que registres aparecerán aquí."
                        }
                    </span>

                </div>

            </td>

        </tr>
    `;
}

/* =========================================================
   EVENTOS DE LA TABLA
   ========================================================= */

function addPurchaseTableEvents() {
    const viewButtons = document.querySelectorAll(
        ".view-purchase-button"
    );

    const deleteButtons = document.querySelectorAll(
        ".delete-purchase-button"
    );

    viewButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            openPurchaseDetails(button.dataset.purchaseId);
        });
    });

    deleteButtons.forEach(function (button) {
        button.addEventListener("click", function () {
            deletePurchase(button.dataset.purchaseId);
        });
    });
}

/* =========================================================
   MODAL DE DETALLES
   ========================================================= */

function openPurchaseDetails(purchaseId) {
    const purchase = purchases.find(function (item) {
        return item.id === purchaseId;
    });

    if (!purchase) {
        showPurchaseNotification(
            "No se encontró la compra.",
            "error"
        );

        return;
    }

    const productsHTML = purchase.items
        .map(function (item) {
            return `
                <div class="purchase-detail-product">

                    <div>

                        <strong>
                            ${escapeHTML(item.name)}
                        </strong>

                        <small>
                            Cantidad: ${item.quantity}
                            · Recibida: ${item.receivedQuantity}
                            · Costo: ${formatMoney(item.unitCost)}
                            ${
                                item.sku
                                    ? ` · SKU: ${escapeHTML(
                                          item.sku
                                      )}`
                                    : ""
                            }
                        </small>

                    </div>

                    <div class="purchase-detail-product-total">
                        ${formatMoney(item.total)}
                    </div>

                </div>
            `;
        })
        .join("");

    purchaseModalBody.innerHTML = `
        <div class="purchase-detail-grid">

            ${createPurchaseDetail(
                "Fecha",
                formatDate(purchase.date)
            )}

            ${createPurchaseDetail(
                "Proveedor",
                purchase.supplier
            )}

            ${createPurchaseDetail(
                "Factura",
                purchase.invoice || "Sin factura"
            )}

            ${createPurchaseDetail(
                "Número de orden",
                purchase.orderNumber || "Sin número"
            )}

            ${createPurchaseDetail(
                "Estado",
                purchase.status
            )}

            ${createPurchaseDetail(
                "Estado del pago",
                purchase.paymentStatus
            )}

            ${createPurchaseDetail(
                "Método de pago",
                purchase.paymentMethod
            )}

            ${createPurchaseDetail(
                "Entrega esperada",
                purchase.expectedDate
                    ? formatDate(purchase.expectedDate)
                    : "No especificada"
            )}

        </div>

        <div class="purchase-detail-products">

            <h4>
                Productos comprados
            </h4>

            ${productsHTML}

        </div>

        <div class="purchase-detail-grid">

            ${createPurchaseDetail(
                "Subtotal",
                formatMoney(purchase.subtotal)
            )}

            ${createPurchaseDetail(
                "Envío",
                formatMoney(purchase.shipping)
            )}

            ${createPurchaseDetail(
                "Impuestos",
                formatMoney(purchase.taxes)
            )}

            ${createPurchaseDetail(
                "Otros costos",
                formatMoney(purchase.otherCosts)
            )}

            ${createPurchaseDetail(
                "Descuento",
                `-${formatMoney(purchase.discount)}`
            )}

            ${createPurchaseDetail(
                "Total",
                formatMoney(purchase.total)
            )}

        </div>

        ${
            purchase.notes
                ? `
                    <div class="purchase-detail-products">

                        <h4>
                            Notas
                        </h4>

                        <p>
                            ${escapeHTML(purchase.notes)}
                        </p>

                    </div>
                  `
                : ""
        }
    `;

    purchaseDetailsModal.classList.add("is-open");
    purchaseDetailsModal.setAttribute("aria-hidden", "false");

    document.body.style.overflow = "hidden";
}

function createPurchaseDetail(label, value) {
    return `
        <div class="purchase-detail-item">

            <span>
                ${escapeHTML(label)}
            </span>

            <strong>
                ${escapeHTML(value)}
            </strong>

        </div>
    `;
}

closePurchaseModalButton.addEventListener(
    "click",
    closePurchaseDetails
);

purchaseDetailsModal.addEventListener(
    "click",
    function (event) {
        if (
            event.target.dataset.closeModal === "true"
        ) {
            closePurchaseDetails();
        }
    }
);

document.addEventListener("keydown", function (event) {
    if (
        event.key === "Escape" &&
        purchaseDetailsModal.classList.contains("is-open")
    ) {
        closePurchaseDetails();
    }
});

function closePurchaseDetails() {
    purchaseDetailsModal.classList.remove("is-open");
    purchaseDetailsModal.setAttribute("aria-hidden", "true");

    document.body.style.overflow = "";
}

/* =========================================================
   ELIMINAR UNA COMPRA
   ========================================================= */

function deletePurchase(purchaseId) {
    const selectedPurchase = purchases.find(function (
        purchase
    ) {
        return purchase.id === purchaseId;
    });

    if (!selectedPurchase) {
        showPurchaseNotification(
            "No se encontró la compra.",
            "error"
        );

        return;
    }

    const confirmation = window.confirm(
        `¿Seguro que quieres eliminar la compra de "${selectedPurchase.supplier}" por ${formatMoney(
            selectedPurchase.total
        )}?`
    );

    if (!confirmation) {
        return;
    }

    purchases = purchases.filter(function (purchase) {
        return purchase.id !== purchaseId;
    });

    savePurchases();
    renderPurchases();
    updatePurchaseSummary();

    showPurchaseNotification(
        "Compra eliminada correctamente."
    );
}

/* =========================================================
   BORRAR TODAS LAS COMPRAS
   ========================================================= */

deleteAllPurchasesButton.addEventListener(
    "click",
    function () {
        if (purchases.length === 0) {
            showPurchaseNotification(
                "No hay compras registradas.",
                "error"
            );

            return;
        }

        const confirmation = window.confirm(
            "¿Seguro que quieres borrar todas las compras registradas?"
        );

        if (!confirmation) {
            return;
        }

        purchases = [];

        savePurchases();
        renderPurchases();
        updatePurchaseSummary();

        showPurchaseNotification(
            "Todas las compras fueron eliminadas."
        );
    }
);

/* =========================================================
   RESUMEN DE COMPRAS
   ========================================================= */

function updatePurchaseSummary() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayString = getLocalDateString(today);
    const startOfWeek = getStartOfWeek(today);

    const startOfMonth = new Date(
        today.getFullYear(),
        today.getMonth(),
        1
    );

    const purchasesToday = purchases.filter(function (
        purchase
    ) {
        return purchase.date === todayString;
    });

    const purchasesThisWeek = purchases.filter(function (
        purchase
    ) {
        const date = createLocalDate(purchase.date);

        return date >= startOfWeek && date <= today;
    });

    const purchasesThisMonth = purchases.filter(function (
        purchase
    ) {
        const date = createLocalDate(purchase.date);

        return date >= startOfMonth && date <= today;
    });

    const pendingCount = purchases.filter(function (
        purchase
    ) {
        return (
            purchase.status === "Pendiente" ||
            purchase.status === "Recibida parcialmente"
        );
    }).length;

    const totalToday = sumPurchaseTotals(purchasesToday);
    const totalWeek = sumPurchaseTotals(purchasesThisWeek);
    const totalMonth = sumPurchaseTotals(purchasesThisMonth);

    todayPurchases.textContent = formatMoney(totalToday);
    weekPurchases.textContent = formatMoney(totalWeek);
    monthPurchases.textContent = formatMoney(totalMonth);
    pendingPurchases.textContent = pendingCount;

    todayPurchasesStatus.textContent =
        purchasesToday.length === 0
            ? "Sin compras registradas"
            : purchasesToday.length === 1
              ? "1 compra registrada"
              : `${purchasesToday.length} compras registradas`;

    weekPurchasesStatus.textContent =
        purchasesThisWeek.length === 1
            ? "1 compra esta semana"
            : `${purchasesThisWeek.length} compras esta semana`;

    monthPurchasesStatus.textContent =
        purchasesThisMonth.length === 1
            ? "1 compra este mes"
            : `${purchasesThisMonth.length} compras este mes`;

    pendingPurchasesStatus.textContent =
        pendingCount === 1
            ? "1 compra pendiente"
            : `${pendingCount} compras pendientes`;
}

function sumPurchaseTotals(purchaseList) {
    return purchaseList.reduce(function (total, purchase) {
        return total + Number(purchase.total || 0);
    }, 0);
}

/* =========================================================
   ETIQUETAS DE ESTADO
   ========================================================= */

function createPurchaseStatusBadge(status) {
    let className = "purchase-status-pending";

    if (status === "Recibida") {
        className = "purchase-status-received";
    }

    if (status === "Recibida parcialmente") {
        className = "purchase-status-partial";
    }

    if (status === "Cancelada") {
        className = "purchase-status-cancelled";
    }

    return `
        <span class="purchase-status-badge ${className}">
            ${escapeHTML(status)}
        </span>
    `;
}

function createPaymentStatusBadge(status) {
    let className = "purchase-payment-pending";

    if (status === "Pagada") {
        className = "purchase-payment-paid";
    }

    if (status === "Pago parcial") {
        className = "purchase-payment-partial";
    }

    return `
        <span class="purchase-payment-badge ${className}">
            ${escapeHTML(status)}
        </span>
    `;
}

/* =========================================================
   GUARDAR Y CARGAR
   ========================================================= */

function savePurchases() {
    try {
        localStorage.setItem(
            PURCHASES_STORAGE_KEY,
            JSON.stringify(purchases)
        );
    } catch (error) {
        console.error(
            "No se pudieron guardar las compras:",
            error
        );

        showPurchaseNotification(
            "No fue posible guardar la información.",
            "error"
        );
    }
}

function loadPurchases() {
    try {
        const storedPurchases = localStorage.getItem(
            PURCHASES_STORAGE_KEY
        );

        if (!storedPurchases) {
            return [];
        }

        const parsedPurchases = JSON.parse(storedPurchases);

        if (!Array.isArray(parsedPurchases)) {
            return [];
        }

        return parsedPurchases;
    } catch (error) {
        console.error(
            "No se pudieron cargar las compras:",
            error
        );

        return [];
    }
}

/* =========================================================
   FECHAS
   ========================================================= */

function setTodayDate() {
    purchaseDate.value = getLocalDateString(new Date());
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
    const parts = String(dateString).split("-");

    const year = Number(parts[0]);
    const month = Number(parts[1]) - 1;
    const day = Number(parts[2]);

    const date = new Date(year, month, day);

    date.setHours(0, 0, 0, 0);

    return date;
}

function getStartOfWeek(date) {
    const startDate = new Date(date);

    const day = startDate.getDay();

    const daysFromMonday =
        day === 0
            ? 6
            : day - 1;

    startDate.setDate(
        startDate.getDate() - daysFromMonday
    );

    startDate.setHours(0, 0, 0, 0);

    return startDate;
}

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

/* =========================================================
   DINERO
   ========================================================= */

function getPositiveNumber(value) {
    return Math.max(0, Number(value) || 0);
}

function formatMoney(value) {
    return new Intl.NumberFormat(
        "en-US",
        {
            style: "currency",
            currency: "USD"
        }
    ).format(Number(value) || 0);
}

/* =========================================================
   IDENTIFICADOR ÚNICO
   ========================================================= */

function createUniqueId() {
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
   PROTEGER TEXTO
   ========================================================= */

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

/* =========================================================
   NOTIFICACIONES
   ========================================================= */

function showPurchaseNotification(
    message,
    type = "success"
) {
    clearTimeout(notificationTimer);

    purchaseNotification.textContent = message;

    if (type === "error") {
        purchaseNotification.style.borderColor = "#a13d3d";
        purchaseNotification.style.color = "#ffd4d4";
    } else {
        purchaseNotification.style.borderColor = "#c99b36";
        purchaseNotification.style.color = "#e7ca78";
    }

    purchaseNotification.classList.add("show");

    notificationTimer = setTimeout(function () {
        purchaseNotification.classList.remove("show");
    }, 3000);
}
