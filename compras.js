/* =========================================================
   DECORATION GOLD INC
   MÓDULO DE COMPRAS
   INVENTARIO + PAGOS + DEUDAS + SQUARE
   ========================================================= */
/* =========================================================
   CLAVES DE ALMACENAMIENTO
   ========================================================= */
const PURCHASES_STORAGE_KEY = "decorationGoldPurchases";
const PURCHASE_EXPENSES_STORAGE_KEY =
    "decorationGoldPurchaseExpenses";
const SQUARE_SYNC_QUEUE_KEY =
    "decorationGoldSquareSyncQueue";
const SKU_COUNTER_STORAGE_KEY =
    "decorationGoldSkuCounter";
/* =========================================================
   ELEMENTOS PRINCIPALES
   ========================================================= */
const purchaseForm =
    document.getElementById("purchaseForm");
const purchaseDate =
    document.getElementById("purchaseDate");
const purchaseSupplier =
    document.getElementById("purchaseSupplier");
const purchaseStatus =
    document.getElementById("purchaseStatus");
const purchasePaymentStatus =
    document.getElementById("purchasePaymentStatus");
const purchasePaymentMethod =
    document.getElementById("purchasePaymentMethod");
const purchaseAmountPaid =
    document.getElementById("purchaseAmountPaid");
const purchasePendingBalance =
    document.getElementById("purchasePendingBalance");
const purchaseNotes =
    document.getElementById("purchaseNotes");
/* =========================================================
   COSTOS
   ========================================================= */
const purchaseShipping =
    document.getElementById("purchaseShipping");
const purchaseOtherCosts =
    document.getElementById("purchaseOtherCosts");
/* =========================================================
   PRODUCTOS
   ========================================================= */
const purchaseItemsContainer =
    document.getElementById("purchaseItemsContainer");
const purchaseItemTemplate =
    document.getElementById("purchaseItemTemplate");
const addProductButton =
    document.getElementById("addProductButton");
const clearPurchaseButton =
    document.getElementById("clearPurchaseButton");
/* =========================================================
   TOTALES
   ========================================================= */
const productsSubtotal =
    document.getElementById("productsSubtotal");
const shippingTotal =
    document.getElementById("shippingTotal");
const otherCostsTotal =
    document.getElementById("otherCostsTotal");
const purchaseGrandTotal =
    document.getElementById("purchaseGrandTotal");
const amountPaidTotal =
    document.getElementById("amountPaidTotal");
const pendingBalanceTotal =
    document.getElementById("pendingBalanceTotal");
/* =========================================================
   FILTROS E HISTORIAL
   ========================================================= */
const purchaseSearch =
    document.getElementById("purchaseSearch");
const purchaseStatusFilter =
    document.getElementById("purchaseStatusFilter");
const purchasePaymentFilter =
    document.getElementById("purchasePaymentFilter");
const purchasePeriodFilter =
    document.getElementById("purchasePeriodFilter");
const purchasesTableBody =
    document.getElementById("purchasesTableBody");
const deleteAllPurchasesButton =
    document.getElementById(
        "deleteAllPurchasesButton"
    );
/* =========================================================
   MODAL
   ========================================================= */
const purchaseDetailsModal =
    document.getElementById("purchaseDetailsModal");
const purchaseModalBody =
    document.getElementById("purchaseModalBody");
const closePurchaseModalButton =
    document.getElementById(
        "closePurchaseModalButton"
    );
/* =========================================================
   NOTIFICACIÓN
   ========================================================= */
const purchaseNotification =
    document.getElementById(
        "purchaseNotification"
    );
/* =========================================================
   VARIABLES
   ========================================================= */
let purchases = loadPurchases();
let notificationTimer;
/* =========================================================
   INICIO DEL MÓDULO
   ========================================================= */
document.addEventListener(
    "DOMContentLoaded",
    function () {
        migrateOldPurchases();
        setTodayDate();
        prepareExistingProductCard();
        calculatePurchaseTotals();
        renderPurchases();
        synchronizePurchaseExpenses();
    }
);
/* =========================================================
   PREPARAR PRODUCTO INICIAL
   ========================================================= */
function prepareExistingProductCard() {
    const firstProductCard =
        purchaseItemsContainer.querySelector(
            ".purchase-item-card"
        );
    if (!firstProductCard) {
        return;
    }
    assignAutomaticSku(firstProductCard);
    addProductCardEvents(firstProductCard);
    updateProductNumbers();
    updateRemoveButtons();
}
/* =========================================================
   AGREGAR PRODUCTO
   ========================================================= */
addProductButton.addEventListener(
    "click",
    function () {
        const templateContent =
            purchaseItemTemplate.content.cloneNode(
                true
            );
        purchaseItemsContainer.appendChild(
            templateContent
        );
        const productCards =
            purchaseItemsContainer.querySelectorAll(
                ".purchase-item-card"
            );
        const newProductCard =
            productCards[
                productCards.length - 1
            ];
        assignAutomaticSku(newProductCard);
        addProductCardEvents(newProductCard);
        updateProductNumbers();
        updateRemoveButtons();
        const productNameInput =
            newProductCard.querySelector(
                ".item-name"
            );
        productNameInput?.focus();
        showPurchaseNotification(
            "Producto agregado con código interno automático."
        );
    }
);
/* =========================================================
   EVENTOS DE CADA PRODUCTO
   ========================================================= */
function addProductCardEvents(productCard) {
    const quantityInput =
        productCard.querySelector(
            ".item-quantity"
        );
    const unitCostInput =
        productCard.querySelector(
            ".item-unit-cost"
        );
    const receivedQuantityInput =
        productCard.querySelector(
            ".item-received-quantity"
        );
    const removeButton =
        productCard.querySelector(
            ".remove-product-button"
        );
    quantityInput?.addEventListener(
        "input",
        function () {
            validateReceivedQuantity(
                productCard
            );
            calculateProductTotal(
                productCard
            );
            calculatePurchaseTotals();
        }
    );
    unitCostInput?.addEventListener(
        "input",
        function () {
            calculateProductTotal(
                productCard
            );
            calculatePurchaseTotals();
        }
    );
    receivedQuantityInput?.addEventListener(
        "input",
        function () {
            validateReceivedQuantity(
                productCard
            );
        }
    );
    removeButton?.addEventListener(
        "click",
        function () {
            removeProductCard(
                productCard
            );
        }
    );
}
/* =========================================================
   CÓDIGO INTERNO AUTOMÁTICO
   ========================================================= */
function assignAutomaticSku(productCard) {
    const skuInput =
        productCard.querySelector(
            ".item-sku"
        );
    if (!skuInput) {
        return;
    }
    if (!skuInput.value.trim()) {
        skuInput.value =
            generateUniqueSku();
    }
}
function generateUniqueSku() {
    let counter = Number(
        localStorage.getItem(
            SKU_COUNTER_STORAGE_KEY
        )
    );
    if (
        !Number.isInteger(counter) ||
        counter < 1
    ) {
        counter =
            findHighestExistingSkuNumber() + 1;
    }
    let generatedSku;
    do {
        generatedSku =
            `DG-${String(counter).padStart(
                6,
                "0"
            )}`;
        counter += 1;
    } while (
        skuAlreadyExists(generatedSku)
    );
    localStorage.setItem(
        SKU_COUNTER_STORAGE_KEY,
        String(counter)
    );
    return generatedSku;
}
function findHighestExistingSkuNumber() {
    let highestNumber = 0;
    purchases.forEach(function (purchase) {
        const items = Array.isArray(
            purchase.items
        )
            ? purchase.items
            : [];
        items.forEach(function (item) {
            const match = String(
                item.sku || ""
            ).match(/^DG-(\d+)$/);
            if (match) {
                highestNumber = Math.max(
                    highestNumber,
                    Number(match[1]) || 0
                );
            }
        });
    });
    return highestNumber;
}
function skuAlreadyExists(sku) {
    const normalizedSku =
        String(sku).trim().toUpperCase();
    const existsInPurchases =
        purchases.some(function (purchase) {
            return (
                Array.isArray(purchase.items) &&
                purchase.items.some(
                    function (item) {
                        return (
                            String(
                                item.sku || ""
                            )
                                .trim()
                                .toUpperCase() ===
                            normalizedSku
                        );
                    }
                )
            );
        });
    if (existsInPurchases) {
        return true;
    }
    const currentSkuInputs =
        purchaseItemsContainer.querySelectorAll(
            ".item-sku"
        );
    return Array.from(
        currentSkuInputs
    ).some(function (input) {
        return (
            input.value
                .trim()
                .toUpperCase() ===
            normalizedSku
        );
    });
}
/* =========================================================
   VALIDAR CANTIDAD RECIBIDA
   ========================================================= */
function validateReceivedQuantity(
    productCard
) {
    const quantityInput =
        productCard.querySelector(
            ".item-quantity"
        );
    const receivedQuantityInput =
        productCard.querySelector(
            ".item-received-quantity"
        );
    if (
        !quantityInput ||
        !receivedQuantityInput
    ) {
        return;
    }
    const purchasedQuantity = Math.max(
        1,
        Number(quantityInput.value) || 1
    );
    const receivedQuantity = Math.max(
        0,
        Number(
            receivedQuantityInput.value
        ) || 0
    );
    if (
        receivedQuantity >
        purchasedQuantity
    ) {
        receivedQuantityInput.value =
            purchasedQuantity;
    }
}
/* =========================================================
   ELIMINAR TARJETA DE PRODUCTO
   ========================================================= */
function removeProductCard(productCard) {
    const productCards =
        purchaseItemsContainer.querySelectorAll(
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
    showPurchaseNotification(
        "Producto eliminado."
    );
}
/* =========================================================
   ACTUALIZAR NÚMEROS DE PRODUCTOS
   ========================================================= */
function updateProductNumbers() {
    const productCards =
        purchaseItemsContainer.querySelectorAll(
            ".purchase-item-card"
        );
    productCards.forEach(
        function (productCard, index) {
            productCard.dataset.itemIndex =
                index;
            const number =
                productCard.querySelector(
                    ".purchase-item-number"
                );
            if (number) {
                number.textContent =
                    `Producto ${index + 1}`;
            }
        }
    );
}
/* =========================================================
   BOTONES PARA ELIMINAR PRODUCTOS
   ========================================================= */
function updateRemoveButtons() {
    const cards =
        purchaseItemsContainer.querySelectorAll(
            ".purchase-item-card"
        );
    const buttons =
        purchaseItemsContainer.querySelectorAll(
            ".remove-product-button"
        );
    buttons.forEach(function (button) {
        button.disabled =
            cards.length <= 1;
    });
}
/* =========================================================
   CÁLCULO DEL TOTAL DE CADA PRODUCTO
   ========================================================= */
function calculateProductTotal(productCard) {
    const quantity = Math.max(
        0,
        Number(
            productCard.querySelector(
                ".item-quantity"
            )?.value
        ) || 0
    );
    const unitCost = Math.max(
        0,
        Number(
            productCard.querySelector(
                ".item-unit-cost"
            )?.value
        ) || 0
    );
    const total =
        quantity * unitCost;
    const totalInput =
        productCard.querySelector(
            ".item-total"
        );
    if (totalInput) {
        totalInput.value =
            total.toFixed(2);
    }
    return total;
}
/* =========================================================
   EVENTOS DE TOTALES
   ========================================================= */
[
    purchaseShipping,
    purchaseOtherCosts
].forEach(function (input) {
    input?.addEventListener(
        "input",
        calculatePurchaseTotals
    );
});
purchaseAmountPaid.addEventListener(
    "input",
    function () {
        updatePaymentCalculations();
    }
);
/* =========================================================
   CÁLCULO GENERAL DE LA COMPRA
   ========================================================= */
function calculatePurchaseTotals() {
    const productCards =
        purchaseItemsContainer.querySelectorAll(
            ".purchase-item-card"
        );
    let subtotal = 0;
    productCards.forEach(function (card) {
        subtotal +=
            calculateProductTotal(card);
    });
    const shipping =
        getPositiveNumber(
            purchaseShipping.value
        );
    const otherCosts =
        getPositiveNumber(
            purchaseOtherCosts.value
        );
    const grandTotal =
        subtotal +
        shipping +
        otherCosts;
    productsSubtotal.textContent =
        formatMoney(subtotal);
    shippingTotal.textContent =
        formatMoney(shipping);
    otherCostsTotal.textContent =
        formatMoney(otherCosts);
    purchaseGrandTotal.textContent =
        formatMoney(grandTotal);
    const paymentInformation =
        updatePaymentCalculations(
            grandTotal
        );
    return {
        subtotal,
        shipping,
        otherCosts,
        grandTotal,
        amountPaid:
            paymentInformation.amountPaid,
        pendingBalance:
            paymentInformation.pendingBalance,
        paymentStatus:
            paymentInformation.paymentStatus
    };
}
/* =========================================================
   MONTO PAGADO Y PENDIENTE
   ========================================================= */
function updatePaymentCalculations(
    suppliedGrandTotal
) {
    const grandTotal =
        Number.isFinite(
            suppliedGrandTotal
        )
            ? suppliedGrandTotal
            : getCurrentGrandTotal();
    let amountPaid =
        getPositiveNumber(
            purchaseAmountPaid.value
        );
    if (
        amountPaid >
        grandTotal &&
        grandTotal >= 0
    ) {
        amountPaid = grandTotal;
        purchaseAmountPaid.value =
            amountPaid.toFixed(2);
    }
    const pendingBalance = Math.max(
        0,
        grandTotal - amountPaid
    );
    const paymentStatus =
        determinePaymentStatus(
            grandTotal,
            amountPaid,
            pendingBalance
        );
    purchasePendingBalance.value =
        pendingBalance.toFixed(2);
    purchasePaymentStatus.value =
        paymentStatus;
    amountPaidTotal.textContent =
        formatMoney(amountPaid);
    pendingBalanceTotal.textContent =
        formatMoney(pendingBalance);
    return {
        amountPaid,
        pendingBalance,
        paymentStatus
    };
}
function getCurrentGrandTotal() {
    const productCards =
        purchaseItemsContainer.querySelectorAll(
            ".purchase-item-card"
        );
    let subtotal = 0;
    productCards.forEach(function (card) {
        subtotal +=
            calculateProductTotal(card);
    });
    return (
        subtotal +
        getPositiveNumber(
            purchaseShipping.value
        ) +
        getPositiveNumber(
            purchaseOtherCosts.value
        )
    );
}
function determinePaymentStatus(
    total,
    paid,
    pending
) {
    if (
        total > 0 &&
        pending <= 0 &&
        paid >= total
    ) {
        return "Pagada";
    }
    if (
        paid > 0 &&
        pending > 0
    ) {
        return "Pago parcial";
    }
    return "Pendiente";
}
/* =========================================================
   GUARDAR COMPRA
   ========================================================= */
purchaseForm.addEventListener(
    "submit",
    function (event) {
        event.preventDefault();
        const items =
            collectPurchaseItems();
        const totals =
            calculatePurchaseTotals();
        if (
            !validatePurchaseForm(
                items,
                totals
            )
        ) {
            return;
        }
        const purchaseId =
            createUniqueId();
        const now =
            new Date().toISOString();
        const newPurchase = {
            id: purchaseId,
            date:
                purchaseDate.value,
            supplier:
                purchaseSupplier.value.trim(),
            status:
                purchaseStatus.value,
            paymentStatus:
                totals.paymentStatus,
            paymentMethod:
                purchasePaymentMethod.value,
            amountPaid:
                totals.amountPaid,
            pendingBalance:
                totals.pendingBalance,
            notes:
                purchaseNotes.value.trim(),
            items,
            subtotal:
                totals.subtotal,
            shipping:
                totals.shipping,
            otherCosts:
                totals.otherCosts,
            total:
                totals.grandTotal,
            expenseAmount:
                totals.grandTotal,
            isBusinessExpense: true,
            squareSyncStatus:
                determinePurchaseSyncStatus(
                    items
                ),
            squareSyncError: "",
            squareLastSyncAt: null,
            createdAt: now,
            updatedAt: now
        };
        purchases.unshift(
            newPurchase
        );
        savePurchases();
        synchronizePurchaseExpenses();
        addPurchaseToSquareQueue(
            newPurchase
        );
        renderPurchases();
        resetPurchaseForm();
        showPurchaseNotification(
            "Compra guardada. El total se registró como gasto y el pendiente quedó guardado como deuda."
        );
    }
);
/* =========================================================
   RECOGER LOS PRODUCTOS
   ========================================================= */
function collectPurchaseItems() {
    const cards =
        purchaseItemsContainer.querySelectorAll(
            ".purchase-item-card"
        );
    return Array.from(cards).map(
        function (card, index) {
            assignAutomaticSku(card);
            const quantity = Math.max(
                1,
                Number(
                    card.querySelector(
                        ".item-quantity"
                    )?.value
                ) || 1
            );
            const receivedQuantity =
                Math.min(
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
            const unitCost =
                getPositiveNumber(
                    card.querySelector(
                        ".item-unit-cost"
                    )?.value
                );
            const syncEnabled =
                card.querySelector(
                    ".item-square-enabled"
                )?.value !== "false";
            const trackInventory =
                card.querySelector(
                    ".item-track-inventory"
                )?.value !== "false";
            return {
                id: createUniqueId(),
                position: index + 1,
                name:
                    card.querySelector(
                        ".item-name"
                    )?.value.trim() || "",
                sku:
                    card.querySelector(
                        ".item-sku"
                    )?.value.trim() || "",
                barcode:
                    card.querySelector(
                        ".item-barcode"
                    )?.value.trim() || "",
                category:
                    card.querySelector(
                        ".item-category"
                    )?.value || "",
                variant:
                    card.querySelector(
                        ".item-variant"
                    )?.value.trim() || "",
                variationName:
                    card.querySelector(
                        ".item-variation-name"
                    )?.value.trim() ||
                    "Regular",
                quantity,
                receivedQuantity,
                unitCost,
                salePrice:
                    getPositiveNumber(
                        card.querySelector(
                            ".item-sale-price"
                        )?.value
                    ),
                total:
                    quantity * unitCost,
                notes:
                    card.querySelector(
                        ".item-notes"
                    )?.value.trim() || "",
                square: {
                    enabled:
                        syncEnabled,
                    trackInventory,
                    itemId:
                        card.querySelector(
                            ".item-square-item-id"
                        )?.value || "",
                    variationId:
                        card.querySelector(
                            ".item-square-variation-id"
                        )?.value || "",
                    syncStatus:
                        syncEnabled
                            ? "pending"
                            : "disabled",
                    syncError: "",
                    inventorySyncedQuantity:
                        Number(
                            card.querySelector(
                                ".item-inventory-synced-quantity"
                            )?.value || 0
                        ),
                    catalogIdempotencyKey:
                        createUniqueId(),
                    inventoryIdempotencyKey:
                        createUniqueId(),
                    lastSyncAt: null
                }
            };
        }
    );
}
/* =========================================================
   ESTADO GENERAL DE SQUARE
   ========================================================= */
function determinePurchaseSyncStatus(items) {
    const squareItems =
        items.filter(function (item) {
            return item.square.enabled;
        });
    if (
        squareItems.length === 0
    ) {
        return "disabled";
    }
    return "pending";
}
/* =========================================================
   COLA PARA SQUARE
   ========================================================= */
function addPurchaseToSquareQueue(
    purchase
) {
    const queue =
        loadSquareQueue();
    const jobs =
        purchase.items
            .filter(function (item) {
                return (
                    item.square.enabled
                );
            })
            .map(function (item) {
                return {
                    id:
                        createUniqueId(),
                    type:
                        "UPSERT_CATALOG_AND_INVENTORY",
                    purchaseId:
                        purchase.id,
                    purchaseItemId:
                        item.id,
                    status:
                        "pending",
                    attempts: 0,
                    payload: {
                        name:
                            item.name,
                        sku:
                            item.sku,
                        barcode:
                            item.barcode,
                        category:
                            item.category,
                        variant:
                            item.variant,
                        variationName:
                            item.variationName ||
                            "Regular",
                        salePrice:
                            item.salePrice,
                        unitCost:
                            item.unitCost,
                        trackInventory:
                            item.square
                                .trackInventory,
                        quantityToAdd:
                            shouldIncreaseSquareInventory(
                                purchase
                            )
                                ? item.receivedQuantity
                                : 0,
                        supplier:
                            purchase.supplier,
                        purchaseDate:
                            purchase.date,
                        catalogIdempotencyKey:
                            item.square
                                .catalogIdempotencyKey,
                        inventoryIdempotencyKey:
                            item.square
                                .inventoryIdempotencyKey
                    },
                    createdAt:
                        new Date().toISOString(),
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
function shouldIncreaseSquareInventory(
    purchase
) {
    return (
        purchase.status ===
            "Recibida" ||
        purchase.status ===
            "Recibida parcialmente"
    );
}
function loadSquareQueue() {
    try {
        const saved =
            localStorage.getItem(
                SQUARE_SYNC_QUEUE_KEY
            );
        const parsed =
            saved
                ? JSON.parse(saved)
                : [];
        return Array.isArray(parsed)
            ? parsed
            : [];
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
function validatePurchaseForm(
    items,
    totals
) {
    if (!purchaseDate.value) {
        showPurchaseNotification(
            "Selecciona la fecha de compra.",
            "error"
        );
        purchaseDate.focus();
        return false;
    }
    if (
        !purchaseSupplier.value.trim()
    ) {
        showPurchaseNotification(
            "Escribe el nombre del proveedor.",
            "error"
        );
        purchaseSupplier.focus();
        return false;
    }
    if (!purchaseStatus.value) {
        showPurchaseNotification(
            "Selecciona el estado de la mercancía.",
            "error"
        );
        purchaseStatus.focus();
        return false;
    }
    if (
        !purchasePaymentMethod.value
    ) {
        showPurchaseNotification(
            "Selecciona el método de pago.",
            "error"
        );
        purchasePaymentMethod.focus();
        return false;
    }
    if (
        totals.grandTotal <= 0
    ) {
        showPurchaseNotification(
            "El total de la compra debe ser mayor que cero.",
            "error"
        );
        return false;
    }
    if (
        totals.amountPaid >
        totals.grandTotal
    ) {
        showPurchaseNotification(
            "El monto pagado no puede ser mayor que el total de la compra.",
            "error"
        );
        purchaseAmountPaid.focus();
        return false;
    }
    for (
        let index = 0;
        index < items.length;
        index++
    ) {
        const item =
            items[index];
        if (!item.name) {
            showPurchaseNotification(
                `Escribe el nombre del producto ${index + 1}.`,
                "error"
            );
            focusProductField(
                index,
                ".item-name"
            );
            return false;
        }
        if (!item.sku) {
            showPurchaseNotification(
                `No se pudo generar el código interno del producto ${index + 1}.`,
                "error"
            );
            return false;
        }
        if (!item.category) {
            showPurchaseNotification(
                `Selecciona la categoría del producto ${index + 1}.`,
                "error"
            );
            focusProductField(
                index,
                ".item-category"
            );
            return false;
        }
        if (
            item.unitCost <= 0
        ) {
            showPurchaseNotification(
                `Escribe el costo del producto ${index + 1}.`,
                "error"
            );
            focusProductField(
                index,
                ".item-unit-cost"
            );
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
            focusProductField(
                index,
                ".item-sale-price"
            );
            return false;
        }
    }
    return true;
}
function focusProductField(
    index,
    selector
) {
    const cards =
        purchaseItemsContainer.querySelectorAll(
            ".purchase-item-card"
        );
    const field =
        cards[index]?.querySelector(
            selector
        );
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
clearPurchaseButton.addEventListener(
    "click",
    function () {
        setTimeout(function () {
            resetProductCards();
            setTodayDate();
            purchaseAmountPaid.value =
                "0";
            calculatePurchaseTotals();
        }, 0);
    }
);
function resetPurchaseForm() {
    purchaseForm.reset();
    resetProductCards();
    setTodayDate();
    purchaseAmountPaid.value =
        "0";
    purchasePendingBalance.value =
        "0.00";
    purchasePaymentStatus.value =
        "Pendiente";
    calculatePurchaseTotals();
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}
function resetProductCards() {
    const cards =
        purchaseItemsContainer.querySelectorAll(
            ".purchase-item-card"
        );
    cards.forEach(
        function (card, index) {
            if (index > 0) {
                card.remove();
            }
        }
    );
    const firstCard =
        purchaseItemsContainer.querySelector(
            ".purchase-item-card"
        );
    if (firstCard) {
        const fields =
            firstCard.querySelectorAll(
                "input, select, textarea"
            );
        fields.forEach(function (field) {
            if (
                field.classList.contains(
                    "item-quantity"
                )
            ) {
                field.value = "1";
                return;
            }
            if (
                field.classList.contains(
                    "item-received-quantity"
                )
            ) {
                field.value = "0";
                return;
            }
            if (
                field.classList.contains(
                    "item-total"
                )
            ) {
                field.value = "0.00";
                return;
            }
            if (
                field.classList.contains(
                    "item-variation-name"
                )
            ) {
                field.value = "Regular";
                return;
            }
            if (
                field.classList.contains(
                    "item-square-enabled"
                ) ||
                field.classList.contains(
                    "item-track-inventory"
                )
            ) {
                field.value = "true";
                return;
            }
            if (
                field.classList.contains(
                    "item-sync-status"
                )
            ) {
                field.value =
                    "Pendiente de sincronizar";
                return;
            }
            if (
                field.classList.contains(
                    "item-inventory-synced-quantity"
                )
            ) {
                field.value = "0";
                return;
            }
            field.value = "";
        });
        assignAutomaticSku(
            firstCard
        );
    }
    updateProductNumbers();
    updateRemoveButtons();
}
/* =========================================================
   TABLA DE COMPRAS
   ========================================================= */
function renderPurchases() {
    const filteredPurchases =
        getFilteredPurchases();
    purchasesTableBody.innerHTML =
        "";
    if (
        filteredPurchases.length === 0
    ) {
        renderEmptyPurchasesState();
        return;
    }
    filteredPurchases.forEach(
        function (purchase) {
            const row =
                document.createElement(
                    "tr"
                );
            const items =
                Array.isArray(
                    purchase.items
                )
                    ? purchase.items
                    : [];
            const productCount =
                items.reduce(
                    function (
                        total,
                        item
                    ) {
                        return (
                            total +
                            Number(
                                item.quantity ||
                                    0
                            )
                        );
                    },
                    0
                );
            row.innerHTML = `
                <td>
                    ${formatDate(
                        purchase.date
                    )}
                </td>
                <td>
                    <strong>
                        ${escapeHTML(
                            purchase.supplier
                        )}
                    </strong>
                </td>
                <td>
                    <strong>
                        ${productCount}
                    </strong>
                    <small>
                        ${items.length}
                        ${
                            items.length === 1
                                ? "producto"
                                : "productos"
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
                        ${formatMoney(
                            purchase.total
                        )}
                    </span>
                </td>
                <td>
                    <span class="purchase-total-cell">
                        ${formatMoney(
                            purchase.amountPaid
                        )}
                    </span>
                </td>
                <td>
                    <span class="purchase-total-cell">
                        ${formatMoney(
                            purchase.pendingBalance
                        )}
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
            purchasesTableBody.appendChild(
                row
            );
        }
    );
    addPurchaseTableEvents();
}
/* =========================================================
   FILTROS
   ========================================================= */
purchaseSearch.addEventListener(
    "input",
    renderPurchases
);
purchaseStatusFilter.addEventListener(
    "change",
    renderPurchases
);
purchasePaymentFilter.addEventListener(
    "change",
    renderPurchases
);
purchasePeriodFilter.addEventListener(
    "change",
    renderPurchases
);
function getFilteredPurchases() {
    const searchValue =
        purchaseSearch.value
            .trim()
            .toLowerCase();
    return purchases.filter(
        function (purchase) {
            const items =
                Array.isArray(
                    purchase.items
                )
                    ? purchase.items
                    : [];
            const productText =
                items
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
                purchase.notes,
                purchase.paymentMethod,
                purchase.paymentStatus,
                productText
            ]
                .join(" ")
                .toLowerCase();
            return (
                searchText.includes(
                    searchValue
                ) &&
                (
                    purchaseStatusFilter.value ===
                        "Todos" ||
                    purchase.status ===
                        purchaseStatusFilter.value
                ) &&
                (
                    purchasePaymentFilter.value ===
                        "Todos" ||
                    purchase.paymentStatus ===
                        purchasePaymentFilter.value
                ) &&
                purchaseMatchesPeriod(
                    purchase.date,
                    purchasePeriodFilter.value
                )
            );
        }
    );
}
function purchaseMatchesPeriod(
    dateString,
    period
) {
    if (period === "Todos") {
        return true;
    }
    const today =
        new Date();
    today.setHours(
        0,
        0,
        0,
        0
    );
    const date =
        createLocalDate(
            dateString
        );
    if (period === "Hoy") {
        return (
            getLocalDateString(date) ===
            getLocalDateString(today)
        );
    }
    if (period === "Semana") {
        return (
            date >=
                getStartOfWeek(today) &&
            date <= today
        );
    }
    if (period === "Mes") {
        return (
            date.getFullYear() ===
                today.getFullYear() &&
            date.getMonth() ===
                today.getMonth()
        );
    }
    return true;
}
/* =========================================================
   TABLA VACÍA
   ========================================================= */
function renderEmptyPurchasesState() {
    purchasesTableBody.innerHTML = `
        <tr class="purchases-empty-row">
            <td colspan="9">
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
/* =========================================================
   EVENTOS DE LA TABLA
   ========================================================= */
function addPurchaseTableEvents() {
    document
        .querySelectorAll(
            ".view-purchase-button"
        )
        .forEach(function (button) {
            button.addEventListener(
                "click",
                function () {
                    openPurchaseDetails(
                        button.dataset
                            .purchaseId
                    );
                }
            );
        });
    document
        .querySelectorAll(
            ".delete-purchase-button"
        )
        .forEach(function (button) {
            button.addEventListener(
                "click",
                function () {
                    deletePurchase(
                        button.dataset
                            .purchaseId
                    );
                }
            );
        });
}
/* =========================================================
   DETALLES DE LA COMPRA
   ========================================================= */
function openPurchaseDetails(
    purchaseId
) {
    const purchase =
        purchases.find(
            function (item) {
                return (
                    item.id ===
                    purchaseId
                );
            }
        );
    if (!purchase) {
        return;
    }
    const items =
        Array.isArray(purchase.items)
            ? purchase.items
            : [];
    const productsHTML =
        items
            .map(function (item) {
                return `
                    <div class="purchase-detail-product">
                        <div>
                            <strong>
                                ${escapeHTML(
                                    item.name
                                )}
                            </strong>
                            <small>
                                Código:
                                ${escapeHTML(
                                    item.sku ||
                                        "Sin código"
                                )}
                                · Comprado:
                                ${Number(
                                    item.quantity ||
                                        0
                                )}
                                · Recibido:
                                ${Number(
                                    item.receivedQuantity ||
                                        0
                                )}
                                · Square:
                                ${escapeHTML(
                                    translateSyncStatus(
                                        item.square
                                            ?.syncStatus
                                    )
                                )}
                            </small>
                        </div>
                        <div class="purchase-detail-product-total">
                            ${formatMoney(
                                item.total
                            )}
                        </div>
                    </div>
                `;
            })
            .join("");
    purchaseModalBody.innerHTML = `
        <div class="purchase-detail-grid">
            ${createPurchaseDetail(
                "Fecha",
                formatDate(
                    purchase.date
                )
            )}
            ${createPurchaseDetail(
                "Proveedor",
                purchase.supplier
            )}
            ${createPurchaseDetail(
                "Estado de la mercancía",
                purchase.status
            )}
            ${createPurchaseDetail(
                "Estado del pago",
                purchase.paymentStatus
            )}
            ${createPurchaseDetail(
                "Método de pago",
                purchase.paymentMethod ||
                    "No especificado"
            )}
            ${createPurchaseDetail(
                "Sincronización Square",
                translateSyncStatus(
                    purchase.squareSyncStatus
                )
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
                "Subtotal de productos",
                formatMoney(
                    purchase.subtotal
                )
            )}
            ${createPurchaseDetail(
                "Envío",
                formatMoney(
                    purchase.shipping
                )
            )}
            ${createPurchaseDetail(
                "Otros costos",
                formatMoney(
                    purchase.otherCosts
                )
            )}
            ${createPurchaseDetail(
                "Total de la compra",
                formatMoney(
                    purchase.total
                )
            )}
            ${createPurchaseDetail(
                "Monto pagado",
                formatMoney(
                    purchase.amountPaid
                )
            )}
            ${createPurchaseDetail(
                "Pendiente por pagar",
                formatMoney(
                    purchase.pendingBalance
                )
            )}
        </div>
        ${
            purchase.notes
                ? `
                    <div class="purchase-detail-products">
                        <h4>
                            Notas generales
                        </h4>
                        <p>
                            ${escapeHTML(
                                purchase.notes
                            )}
                        </p>
                    </div>
                `
                : ""
        }
    `;
    purchaseDetailsModal.classList.add(
        "is-open"
    );
    purchaseDetailsModal.setAttribute(
        "aria-hidden",
        "false"
    );
    document.body.style.overflow =
        "hidden";
}
function createPurchaseDetail(
    label,
    value
) {
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
function translateSyncStatus(status) {
    const statuses = {
        pending:
            "Pendiente",
        processing:
            "Procesando",
        synced:
            "Sincronizado",
        error:
            "Error",
        disabled:
            "No enviar",
        partial:
            "Parcial"
    };
    return (
        statuses[status] ||
        "Pendiente"
    );
}
closePurchaseModalButton.addEventListener(
    "click",
    closePurchaseDetails
);
purchaseDetailsModal.addEventListener(
    "click",
    function (event) {
        if (
            event.target.dataset
                .closeModal === "true"
        ) {
            closePurchaseDetails();
        }
    }
);
function closePurchaseDetails() {
    purchaseDetailsModal.classList.remove(
        "is-open"
    );
    purchaseDetailsModal.setAttribute(
        "aria-hidden",
        "true"
    );
    document.body.style.overflow =
        "";
}
/* =========================================================
   ELIMINAR UNA COMPRA
   ========================================================= */
function deletePurchase(purchaseId) {
    const selected =
        purchases.find(
            function (purchase) {
                return (
                    purchase.id ===
                    purchaseId
                );
            }
        );
    if (!selected) {
        return;
    }
    const confirmation =
        window.confirm(
            `¿Eliminar la compra de "${selected.supplier}"?`
        );
    if (!confirmation) {
        return;
    }
    purchases =
        purchases.filter(
            function (purchase) {
                return (
                    purchase.id !==
                    purchaseId
                );
            }
        );
    removePurchaseFromSquareQueue(
        purchaseId
    );
    savePurchases();
    synchronizePurchaseExpenses();
    renderPurchases();
    showPurchaseNotification(
        "Compra eliminada."
    );
}
/* =========================================================
   BORRAR TODAS LAS COMPRAS
   ========================================================= */
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
        const confirmation =
            window.confirm(
                "¿Seguro que quieres borrar todas las compras?"
            );
        if (!confirmation) {
            return;
        }
        const purchaseIds =
            purchases.map(
                function (purchase) {
                    return purchase.id;
                }
            );
        purchases = [];
        removePurchasesFromSquareQueue(
            purchaseIds
        );
        savePurchases();
        synchronizePurchaseExpenses();
        renderPurchases();
        showPurchaseNotification(
            "Todas las compras fueron eliminadas."
        );
    }
);
/* =========================================================
   ELIMINAR TRABAJOS DE SQUARE
   ========================================================= */
function removePurchaseFromSquareQueue(
    purchaseId
) {
    removePurchasesFromSquareQueue([
        purchaseId
    ]);
}
function removePurchasesFromSquareQueue(
    purchaseIds
) {
    const idSet =
        new Set(purchaseIds);
    const queue =
        loadSquareQueue();
    const updatedQueue =
        queue.filter(
            function (job) {
                return !idSet.has(
                    job.purchaseId
                );
            }
        );
    localStorage.setItem(
        SQUARE_SYNC_QUEUE_KEY,
        JSON.stringify(
            updatedQueue
        )
    );
}
/* =========================================================
   ESTADOS VISUALES
   ========================================================= */
function createPurchaseStatusBadge(
    status
) {
    let className =
        "purchase-status-pending";
    if (
        status === "Recibida"
    ) {
        className =
            "purchase-status-received";
    }
    if (
        status ===
        "Recibida parcialmente"
    ) {
        className =
            "purchase-status-partial";
    }
    if (
        status === "Cancelada"
    ) {
        className =
            "purchase-status-cancelled";
    }
    return `
        <span class="purchase-status-badge ${className}">
            ${escapeHTML(status)}
        </span>
    `;
}
function createPaymentStatusBadge(
    status
) {
    let className =
        "purchase-payment-pending";
    if (
        status === "Pagada"
    ) {
        className =
            "purchase-payment-paid";
    }
    if (
        status === "Pago parcial"
    ) {
        className =
            "purchase-payment-partial";
    }
    return `
        <span class="purchase-payment-badge ${className}">
            ${escapeHTML(status)}
        </span>
    `;
}
/* =========================================================
   REGISTRO DE COMPRAS COMO GASTOS
   ========================================================= */
/*
   Cada compra se guarda también en una lista especial
   de gastos provenientes del módulo Compras.
   El Dashboard sumará después:
   gastos operativos + compras del día
*/
function synchronizePurchaseExpenses() {
    const purchaseExpenses =
        purchases
            .filter(function (purchase) {
                return (
                    purchase.status !==
                    "Cancelada"
                );
            })
            .map(function (purchase) {
                return {
                    id:
                        `purchase-expense-${purchase.id}`,
                    purchaseId:
                        purchase.id,
                    source:
                        "purchase",
                    type:
                        "Compra de mercancía",
                    category:
                        "Compras",
                    description:
                        `Compra a ${purchase.supplier}`,
                    date:
                        purchase.date,
                    amount:
                        Number(
                            purchase.total || 0
                        ),
                    amountPaid:
                        Number(
                            purchase.amountPaid ||
                                0
                        ),
                    pendingBalance:
                        Number(
                            purchase.pendingBalance ||
                                0
                        ),
                    paymentStatus:
                        purchase.paymentStatus,
                    supplier:
                        purchase.supplier,
                    createdAt:
                        purchase.createdAt,
                    updatedAt:
                        purchase.updatedAt
                };
            });
    localStorage.setItem(
        PURCHASE_EXPENSES_STORAGE_KEY,
        JSON.stringify(
            purchaseExpenses
        )
    );
}
/* =========================================================
   GUARDAR Y CARGAR COMPRAS
   ========================================================= */
function savePurchases() {
    localStorage.setItem(
        PURCHASES_STORAGE_KEY,
        JSON.stringify(purchases)
    );
}
function loadPurchases() {
    try {
        const saved =
            localStorage.getItem(
                PURCHASES_STORAGE_KEY
            );
        const parsed =
            saved
                ? JSON.parse(saved)
                : [];
        return Array.isArray(parsed)
            ? parsed
            : [];
    } catch (error) {
        console.error(
            "No se pudieron cargar las compras:",
            error
        );
        return [];
    }
}
/* =========================================================
   ACTUALIZAR COMPRAS ANTIGUAS
   ========================================================= */
function migrateOldPurchases() {
    let changesMade = false;
    purchases =
        purchases.map(
            function (purchase) {
                const total =
                    getPositiveNumber(
                        purchase.total
                    );
                let amountPaid;
                if (
                    purchase.amountPaid !==
                    undefined
                ) {
                    amountPaid =
                        Math.min(
                            total,
                            getPositiveNumber(
                                purchase.amountPaid
                            )
                        );
                } else if (
                    purchase.paymentStatus ===
                    "Pagada"
                ) {
                    amountPaid =
                        total;
                } else {
                    amountPaid = 0;
                }
                const pendingBalance =
                    Math.max(
                        0,
                        total - amountPaid
                    );
                const paymentStatus =
                    determinePaymentStatus(
                        total,
                        amountPaid,
                        pendingBalance
                    );
                const migratedItems =
                    Array.isArray(
                        purchase.items
                    )
                        ? purchase.items.map(
                              function (
                                  item
                              ) {
                                  if (
                                      item.sku
                                  ) {
                                      return item;
                                  }
                                  changesMade =
                                      true;
                                  return {
                                      ...item,
                                      sku:
                                          generateUniqueSku()
                                  };
                              }
                          )
                        : [];
                if (
                    purchase.amountPaid ===
                        undefined ||
                    purchase.pendingBalance ===
                        undefined ||
                    purchase.paymentStatus !==
                        paymentStatus ||
                    purchase.expenseAmount ===
                        undefined ||
                    !purchase.isBusinessExpense
                ) {
                    changesMade = true;
                }
                return {
                    ...purchase,
                    items:
                        migratedItems,
                    amountPaid,
                    pendingBalance,
                    paymentStatus,
                    shipping:
                        getPositiveNumber(
                            purchase.shipping
                        ),
                    otherCosts:
                        getPositiveNumber(
                            purchase.otherCosts
                        ),
                    expenseAmount:
                        total,
                    isBusinessExpense:
                        true,
                    updatedAt:
                        purchase.updatedAt ||
                        new Date().toISOString()
                };
            }
        );
    if (changesMade) {
        savePurchases();
    }
}
/* =========================================================
   FECHA ACTUAL
   ========================================================= */
function setTodayDate() {
    purchaseDate.value =
        getLocalDateString(
            new Date()
        );
}
function getLocalDateString(date) {
    const year =
        date.getFullYear();
    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");
    const day =
        String(
            date.getDate()
        ).padStart(2, "0");
    return `${year}-${month}-${day}`;
}
function createLocalDate(dateString) {
    const parts =
        String(dateString).split(
            "-"
        );
    const date =
        new Date(
            Number(parts[0]),
            Number(parts[1]) - 1,
            Number(parts[2])
        );
    date.setHours(
        0,
        0,
        0,
        0
    );
    return date;
}
function getStartOfWeek(date) {
    const start =
        new Date(date);
    const day =
        start.getDay();
    start.setDate(
        start.getDate() -
            (
                day === 0
                    ? 6
                    : day - 1
            )
    );
    start.setHours(
        0,
        0,
        0,
        0
    );
    return start;
}
/* =========================================================
   FORMATO DE FECHAS Y DINERO
   ========================================================= */
function formatDate(dateString) {
    if (!dateString) {
        return "Sin fecha";
    }
    return new Intl.DateTimeFormat(
        "es-US",
        {
            month: "short",
            day: "numeric",
            year: "numeric"
        }
    ).format(
        createLocalDate(
            dateString
        )
    );
}
function getPositiveNumber(value) {
    return Math.max(
        0,
        Number(value) || 0
    );
}
function formatMoney(value) {
    return new Intl.NumberFormat(
        "en-US",
        {
            style: "currency",
            currency: "USD"
        }
    ).format(
        Number(value) || 0
    );
}
/* =========================================================
   IDENTIFICADORES ÚNICOS
   ========================================================= */
function createUniqueId() {
    if (
        typeof crypto !==
            "undefined" &&
        typeof crypto.randomUUID ===
            "function"
    ) {
        return crypto.randomUUID();
    }
    return (
        Date.now().toString() +
        "-" +
        Math.random()
            .toString(16)
            .slice(2)
    );
}
/* =========================================================
   SEGURIDAD PARA TEXTO HTML
   ========================================================= */
function escapeHTML(value) {
    return String(value ?? "")
        .replaceAll(
            "&",
            "&amp;"
        )
        .replaceAll(
            "<",
            "&lt;"
        )
        .replaceAll(
            ">",
            "&gt;"
        )
        .replaceAll(
            '"',
            "&quot;"
        )
        .replaceAll(
            "'",
            "&#039;"
        );
}
/* =========================================================
   NOTIFICACIONES
   ========================================================= */
function showPurchaseNotification(
    message,
    type = "success"
) {
    clearTimeout(
        notificationTimer
    );
    purchaseNotification.textContent =
        message;
    purchaseNotification.style.borderColor =
        type === "error"
            ? "#a13d3d"
            : "#c99b36";
    purchaseNotification.style.color =
        type === "error"
            ? "#ffd4d4"
            : "#e7ca78";
    purchaseNotification.classList.add(
        "show"
    );
    notificationTimer =
        setTimeout(function () {
            purchaseNotification.classList.remove(
                "show"
            );
        }, 3000);
}
