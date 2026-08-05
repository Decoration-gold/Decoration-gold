/* =========================================================
   DECORATION GOLD INC
   MÓDULO DE COMPRAS PREPARADO PARA SQUARE
   ========================================================= */

const PURCHASES_STORAGE_KEY = "decorationGoldPurchases";
const SQUARE_SYNC_QUEUE_KEY = "decorationGoldSquareSyncQueue";

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
   INICIO
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
    setTodayDate();
    prepareExistingProductCard();
    calculatePurchaseTotals();
    renderPurchases();
    updatePurchaseSummary();
});

/* =========================================================
   PRODUCTOS
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

    quantityInput?.addEventListener("input", function () {
        validateReceivedQuantity(productCard);
        calculateProductTotal(productCard);
        calculatePurchaseTotals();
    });

    unitCostInput?.addEventListener("input", function () {
        calculateProductTotal(productCard);
        calculatePurchaseTotals();
    });

    receivedQuantityInput?.addEventListener(
        "input",
        function () {
            validateReceivedQuantity(productCard);
        }
    );

    removeButton?.addEventListener("click", function () {
        removeProductCard(productCard);
    });
}

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
        receivedQuantityInput.value = purchasedQuantity;
    }
}

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

function updateProductNumbers() {
    const productCards = purchaseItemsContainer.querySelectorAll(
        ".purchase-item-card"
    );

    productCards.forEach(function (productCard, index) {
        productCard.dataset.itemIndex = index;

        const number = productCard.querySelector(
            ".purchase-item-number"
        );

        if (number) {
            number.textContent = `Producto ${index + 1}`;
        }
    });
}

function updateRemoveButtons() {
    const cards = purchaseItemsContainer.querySelectorAll(
        ".purchase-item-card"
    );

    const buttons = purchaseItemsContainer.querySelectorAll(
        ".remove-product-button"
    );

    buttons.forEach(function (button) {
        button.disabled = cards.length <= 1;
    });
}

/* =========================================================
   CÁLCULOS
   ========================================================= */

function calculateProductTotal(productCard) {
    const quantity = Math.max(
        0,
        Number(
            productCard.querySelector(".item-quantity")?.value
        ) || 0
    );

    const unitCost = Math.max(
        0,
        Number(
            productCard.querySelector(".item-unit-cost")?.value
        ) || 0
    );

    const total = quantity * unitCost;

    const totalInput =
        productCard.querySelector(".item-total");

    if (totalInput) {
        totalInput.value = total.toFixed(2);
    }

    return total;
}

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

    productCards.forEach(function (card) {
        subtotal += calculateProductTotal(card);
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

    const purchaseId = createUniqueId();

    const newPurchase = {
        id: purchaseId,

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

        squareSyncStatus: determinePurchaseSyncStatus(items),
        squareSyncError: "",
        squareLastSyncAt: null,

        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    purchases.unshift(newPurchase);

    savePurchases();
    addPurchaseToSquareQueue(newPurchase);

    renderPurchases();
    updatePurchaseSummary();
    resetPurchaseForm();

    showPurchaseNotification(
        "Compra guardada y preparada para Square."
    );
});

/* =========================================================
   RECOGER PRODUCTOS
   ========================================================= */

function collectPurchaseItems() {
    const cards = purchaseItemsContainer.querySelectorAll(
        ".purchase-item-card"
    );

    return Array.from(cards).map(function (card, index) {
        const quantity = Math.max(
            1,
            Number(
                card.querySelector(".item-quantity")?.value
            ) || 1
        );

        const receivedQuantity = Math.min(
            quantity,
            Math.max(
                0,
                Number(
                    card.querySelector(
                        ".item-received-quantity"
                    )?.value
                ) || 0
            )
        );

        const unitCost = getPositiveNumber(
            card.querySelector(".item-unit-cost")?.value
        );

        const syncEnabled =
            card.querySelector(".item-square-enabled")?.value !==
            "false";

        const trackInventory =
            card.querySelector(".item-track-inventory")?.value !==
            "false";

        return {
            id: createUniqueId(),
            position: index + 1,

            name:
                card.querySelector(".item-name")
                    ?.value.trim() || "",

            sku:
                card.querySelector(".item-sku")
                    ?.value.trim() || "",

            barcode:
                card.querySelector(".item-barcode")
                    ?.value.trim() || "",

            category:
                card.querySelector(".item-category")
                    ?.value || "",

            variant:
                card.querySelector(".item-variant")
                    ?.value.trim() || "",

            variationName:
                card.querySelector(".item-variation-name")
                    ?.value.trim() || "Regular",

            quantity,
            receivedQuantity,
            unitCost,

            salePrice: getPositiveNumber(
                card.querySelector(".item-sale-price")?.value
            ),

            total: quantity * unitCost,

            location:
                card.querySelector(".item-location")
                    ?.value.trim() || "",

            notes:
                card.querySelector(".item-notes")
                    ?.value.trim() || "",

            square: {
                enabled: syncEnabled,
                trackInventory,
                itemId:
                    card.querySelector(".item-square-item-id")
                        ?.value || "",
                variationId:
                    card.querySelector(
                        ".item-square-variation-id"
                    )?.value || "",
                syncStatus: syncEnabled
                    ? "pending"
                    : "disabled",
                syncError: "",
                inventorySyncedQuantity: Number(
                    card.querySelector(
                        ".item-inventory-synced-quantity"
                    )?.value || 0
                ),
                catalogIdempotencyKey: createUniqueId(),
                inventoryIdempotencyKey: createUniqueId(),
                lastSyncAt: null
            }
        };
    });
}

function determinePurchaseSyncStatus(items) {
    const squareItems = items.filter(function (item) {
        return item.square.enabled;
    });

    if (squareItems.length === 0) {
        return "disabled";
    }

    return "pending";
}

/* =========================================================
   COLA PARA SQUARE
   ========================================================= */

function addPurchaseToSquareQueue(purchase) {
    const queue = loadSquareQueue();

    const jobs = purchase.items
        .filter(function (item) {
            return item.square.enabled;
        })
        .map(function (item) {
            return {
                id: createUniqueId(),

                type: "UPSERT_CATALOG_AND_INVENTORY",

                purchaseId: purchase.id,
                purchaseItemId: item.id,

                status: "pending",
                attempts: 0,

                payload: {
                    name: item.name,
                    sku: item.sku,
                    barcode: item.barcode,
                    category: item.category,
                    variationName:
                        item.variationName || "Regular",
                    salePrice: item.salePrice,
                    trackInventory:
                        item.square.trackInventory,

                    quantityToAdd:
                        shouldIncreaseSquareInventory(purchase)
                            ? item.receivedQuantity
                            : 0,

                    supplier: purchase.supplier,
                    purchaseDate: purchase.date,
                    invoice: purchase.invoice,

                    catalogIdempotencyKey:
                        item.square.catalogIdempotencyKey,

                    inventoryIdempotencyKey:
                        item.square.inventoryIdempotencyKey
                },

                createdAt: new Date().toISOString(),
                processedAt: null,
                error: ""
            };
        });

    queue.push(...jobs);

    localStorage.setItem(
        SQUARE_SYNC_QUEUE_KEY,
        JSON.stringify(queue)
    );
}

function shouldIncreaseSquareInventory(purchase) {
    return (
        purchase.status === "Recibida" ||
        purchase.status === "Recibida parcialmente"
    );
}

function loadSquareQueue() {
    try {
        const saved = localStorage.getItem(
            SQUARE_SYNC_QUEUE_KEY
        );

        const parsed = saved ? JSON.parse(saved) : [];

        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error(
            "No se pudo cargar la cola de Square:",
            error
        );

        return [];
    }
}

/* =========================================================
   VALIDACIONES
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

        if (item.unitCost <= 0) {
            showPurchaseNotification(
                `Escribe el costo del producto ${index + 1}.`,
                "error"
            );

            focusProductField(index, ".item-unit-cost");
            return false;
        }

        if (
            item.square.enabled &&
            item.salePrice <= 0
        ) {
            showPurchaseNotification(
                `Escribe el precio de venta del producto ${index + 1} para enviarlo a Square.`,
                "error"
            );

            focusProductField(index, ".item-sale-price");
            return false;
        }

        if (
            item.square.enabled &&
            !item.sku &&
            !item.barcode
        ) {
            showPurchaseNotification(
                `Escribe un SKU o código de barras para el producto ${index + 1}.`,
                "error"
            );

            focusProductField(index, ".item-sku");
            return false;
        }
    }

    return true;
}

function focusProductField(index, selector) {
    const cards = purchaseItemsContainer.querySelectorAll(
        ".purchase-item-card"
    );

    const field = cards[index]?.querySelector(selector);

    if (field) {
        field.focus();

        field.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }
}

/* =========================================================
   LIMPIAR
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
    const cards = purchaseItemsContainer.querySelectorAll(
        ".purchase-item-card"
    );

    cards.forEach(function (card, index) {
        if (index > 0) {
            card.remove();
        }
    });

    const firstCard = purchaseItemsContainer.querySelector(
        ".purchase-item-card"
    );

    if (firstCard) {
        firstCard.querySelector(".item-quantity").value = 1;

        firstCard.querySelector(
            ".item-received-quantity"
        ).value = 0;

        firstCard.querySelector(".item-total").value = "0.00";

        const variationName = firstCard.querySelector(
            ".item-variation-name"
        );

        if (variationName) {
            variationName.value = "Regular";
        }

        const syncStatus = firstCard.querySelector(
            ".item-sync-status"
        );

        if (syncStatus) {
            syncStatus.value = "Pendiente de sincronizar";
        }
    }

    updateProductNumbers();
    updateRemoveButtons();
}

/* =========================================================
   TABLA
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
            <td>${formatDate(purchase.date)}</td>

            <td>
                <strong>${escapeHTML(purchase.supplier)}</strong>
            </td>

            <td>
                ${
                    purchase.invoice
                        ? escapeHTML(purchase.invoice)
                        : "Sin factura"
                }
            </td>

            <td>
                <strong>${productCount}</strong>
                <small>
                    ${purchase.items.length}
                    ${
                        purchase.items.length === 1
                            ? "producto"
                            : "productos"
                    }
                </small>
            </td>

            <td>
                ${createPurchaseStatusBadge(purchase.status)}
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
                        title="Ver detalles"
                    >
                        ◉
                    </button>

                    <button
                        type="button"
                        class="delete-purchase-button"
                        data-purchase-id="${purchase.id}"
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
   FILTROS
   ========================================================= */

purchaseSearch.addEventListener("input", renderPurchases);
purchaseStatusFilter.addEventListener("change", renderPurchases);
purchasePaymentFilter.addEventListener("change", renderPurchases);
purchasePeriodFilter.addEventListener("change", renderPurchases);

function getFilteredPurchases() {
    const searchValue = purchaseSearch.value
        .trim()
        .toLowerCase();

    return purchases.filter(function (purchase) {
        const productText = purchase.items
            .map(function (item) {
                return [
                    item.name,
                    item.sku,
                    item.barcode,
                    item.category,
                    item.variant,
                    item.variationName
                ].join(" ");
            })
            .join(" ")
            .toLowerCase();

        const searchText = [
            purchase.supplier,
            purchase.invoice,
            purchase.orderNumber,
            purchase.notes,
            productText
        ]
            .join(" ")
            .toLowerCase();

        return (
            searchText.includes(searchValue) &&
            (
                purchaseStatusFilter.value === "Todos" ||
                purchase.status === purchaseStatusFilter.value
            ) &&
            (
                purchasePaymentFilter.value === "Todos" ||
                purchase.paymentStatus ===
                    purchasePaymentFilter.value
            ) &&
            purchaseMatchesPeriod(
                purchase.date,
                purchasePeriodFilter.value
            )
        );
    });
}

function purchaseMatchesPeriod(dateString, period) {
    if (period === "Todos") {
        return true;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const date = createLocalDate(dateString);

    if (period === "Hoy") {
        return (
            getLocalDateString(date) ===
            getLocalDateString(today)
        );
    }

    if (period === "Semana") {
        return date >= getStartOfWeek(today) && date <= today;
    }

    if (period === "Mes") {
        return (
            date.getFullYear() === today.getFullYear() &&
            date.getMonth() === today.getMonth()
        );
    }

    return true;
}

function renderEmptyPurchasesState() {
    purchasesTableBody.innerHTML = `
        <tr class="purchases-empty-row">

            <td colspan="8">

                <div class="purchases-empty-state">

                    <div class="purchases-empty-icon">
                        ◆
                    </div>

                    <strong>
                        ${
                            purchases.length
                                ? "No se encontraron resultados"
                                : "Todavía no hay compras"
                        }
                    </strong>

                    <span>
                        ${
                            purchases.length
                                ? "Prueba con otros filtros."
                                : "Las compras registradas aparecerán aquí."
                        }
                    </span>

                </div>

            </td>

        </tr>
    `;
}

function addPurchaseTableEvents() {
    document
        .querySelectorAll(".view-purchase-button")
        .forEach(function (button) {
            button.addEventListener("click", function () {
                openPurchaseDetails(
                    button.dataset.purchaseId
                );
            });
        });

    document
        .querySelectorAll(".delete-purchase-button")
        .forEach(function (button) {
            button.addEventListener("click", function () {
                deletePurchase(button.dataset.purchaseId);
            });
        });
}

/* =========================================================
   DETALLES
   ========================================================= */

function openPurchaseDetails(purchaseId) {
    const purchase = purchases.find(function (item) {
        return item.id === purchaseId;
    });

    if (!purchase) {
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
                            SKU: ${escapeHTML(item.sku || "Sin SKU")}
                            · Recibido: ${item.receivedQuantity}
                            · Square:
                            ${escapeHTML(
                                translateSyncStatus(
                                    item.square?.syncStatus
                                )
                            )}
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
                "Estado",
                purchase.status
            )}

            ${createPurchaseDetail(
                "Pago",
                purchase.paymentStatus
            )}

            ${createPurchaseDetail(
                "Sincronización Square",
                translateSyncStatus(
                    purchase.squareSyncStatus
                )
            )}

        </div>

        <div class="purchase-detail-products">

            <h4>Productos comprados</h4>

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
                "Descuento",
                `-${formatMoney(purchase.discount)}`
            )}

            ${createPurchaseDetail(
                "Total",
                formatMoney(purchase.total)
            )}

        </div>
    `;

    purchaseDetailsModal.classList.add("is-open");
    purchaseDetailsModal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
}

function createPurchaseDetail(label, value) {
    return `
        <div class="purchase-detail-item">

            <span>${escapeHTML(label)}</span>

            <strong>${escapeHTML(value)}</strong>

        </div>
    `;
}

function translateSyncStatus(status) {
    const statuses = {
        pending: "Pendiente",
        processing: "Procesando",
        synced: "Sincronizado",
        error: "Error",
        disabled: "No enviar",
        partial: "Parcial"
    };

    return statuses[status] || "Pendiente";
}

closePurchaseModalButton.addEventListener(
    "click",
    closePurchaseDetails
);

purchaseDetailsModal.addEventListener(
    "click",
    function (event) {
        if (event.target.dataset.closeModal === "true") {
            closePurchaseDetails();
        }
    }
);

function closePurchaseDetails() {
    purchaseDetailsModal.classList.remove("is-open");
    purchaseDetailsModal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
}

/* =========================================================
   ELIMINAR
   ========================================================= */

function deletePurchase(purchaseId) {
    const selected = purchases.find(function (purchase) {
        return purchase.id === purchaseId;
    });

    if (!selected) {
        return;
    }

    const confirmation = window.confirm(
        `¿Eliminar la compra de "${selected.supplier}"?`
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

    showPurchaseNotification("Compra eliminada.");
}

deleteAllPurchasesButton.addEventListener(
    "click",
    function () {
        if (!purchases.length) {
            showPurchaseNotification(
                "No hay compras registradas.",
                "error"
            );

            return;
        }

        if (
            !window.confirm(
                "¿Seguro que quieres borrar todas las compras?"
            )
        ) {
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
   RESÚMENES
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

    const todayList = purchases.filter(function (purchase) {
        return purchase.date === todayString;
    });

    const weekList = purchases.filter(function (purchase) {
        const date = createLocalDate(purchase.date);

        return date >= startOfWeek && date <= today;
    });

    const monthList = purchases.filter(function (purchase) {
        const date = createLocalDate(purchase.date);

        return date >= startOfMonth && date <= today;
    });

    const pendingCount = purchases.filter(function (purchase) {
        return (
            purchase.status === "Pendiente" ||
            purchase.status === "Recibida parcialmente"
        );
    }).length;

    todayPurchases.textContent = formatMoney(
        sumPurchaseTotals(todayList)
    );

    weekPurchases.textContent = formatMoney(
        sumPurchaseTotals(weekList)
    );

    monthPurchases.textContent = formatMoney(
        sumPurchaseTotals(monthList)
    );

    pendingPurchases.textContent = pendingCount;

    todayPurchasesStatus.textContent =
        `${todayList.length} compras registradas`;

    weekPurchasesStatus.textContent =
        `${weekList.length} compras esta semana`;

    monthPurchasesStatus.textContent =
        `${monthList.length} compras este mes`;

    pendingPurchasesStatus.textContent =
        `${pendingCount} compras pendientes`;
}

function sumPurchaseTotals(list) {
    return list.reduce(function (total, purchase) {
        return total + Number(purchase.total || 0);
    }, 0);
}

/* =========================================================
   ESTADOS
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
   ALMACENAMIENTO
   ========================================================= */

function savePurchases() {
    localStorage.setItem(
        PURCHASES_STORAGE_KEY,
        JSON.stringify(purchases)
    );
}

function loadPurchases() {
    try {
        const saved = localStorage.getItem(
            PURCHASES_STORAGE_KEY
        );

        const parsed = saved ? JSON.parse(saved) : [];

        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        return [];
    }
}

/* =========================================================
   UTILIDADES
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

    const date = new Date(
        Number(parts[0]),
        Number(parts[1]) - 1,
        Number(parts[2])
    );

    date.setHours(0, 0, 0, 0);

    return date;
}

function getStartOfWeek(date) {
    const start = new Date(date);

    const day = start.getDay();

    start.setDate(
        start.getDate() - (day === 0 ? 6 : day - 1)
    );

    start.setHours(0, 0, 0, 0);

    return start;
}

function formatDate(dateString) {
    return new Intl.DateTimeFormat(
        "es-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    ).format(createLocalDate(dateString));
}

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

function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function showPurchaseNotification(
    message,
    type = "success"
) {
    clearTimeout(notificationTimer);

    purchaseNotification.textContent = message;

    purchaseNotification.style.borderColor =
        type === "error" ? "#a13d3d" : "#c99b36";

    purchaseNotification.style.color =
        type === "error" ? "#ffd4d4" : "#e7ca78";

    purchaseNotification.classList.add("show");

    notificationTimer = setTimeout(function () {
        purchaseNotification.classList.remove("show");
    }, 3000);
}
