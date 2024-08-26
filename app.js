// app.js
let users = [];
let products = [];
let cart = [];
let categories = [];
let orders = [];

// Cargar datos desde localStorage
function loadData() {
    const savedProducts = localStorage.getItem('products');
    const savedCategories = localStorage.getItem('categories');
    const savedOrders = localStorage.getItem('orders');
    if (savedProducts) products = JSON.parse(savedProducts);
    if (savedCategories) categories = JSON.parse(savedCategories);
    if (savedOrders) orders = JSON.parse(savedOrders);
}
function loadUsers() {
    const savedUsers = localStorage.getItem('users');
    if (savedUsers) users = JSON.parse(savedUsers);
}

// Guardar datos en localStorage
function saveData() {
    localStorage.setItem('products', JSON.stringify(products));
    localStorage.setItem('categories', JSON.stringify(categories));
    localStorage.setItem('orders', JSON.stringify(orders));
    localStorage.setItem('users', JSON.stringify(users));
}
function addUser(username, password, role, permissions) {
    const newUser = {
        id: Date.now(),
        username,
        password, 
        role,
        permissions
    };
    users.push(newUser);
    saveData();
    renderUserList();
}

function deleteUser(userId) {
    users = users.filter(user => user.id !== userId);
    saveData();
    renderUserList();
}

function renderUserList() {
    const userListElement = document.getElementById('user-list');
    if (userListElement) {
        userListElement.innerHTML = '';
        users.forEach(user => {
            const userElement = document.createElement('div');
            userElement.className = 'user-item';
            userElement.innerHTML = `
                <p><strong>${user.username}</strong> (${user.role})</p>
                <p>Permisos: ${Object.entries(user.permissions).filter(([, value]) => value).map(([key]) => key).join(', ')}</p>
                <button onclick="deleteUser(${user.id})">Eliminar</button>
            `;
            userListElement.appendChild(userElement);
        });
    }
}

function addProduct(newProduct) {
    newProduct.visible = true; // Por defecto, los nuevos productos son visibles
    products.push(newProduct);
    saveData();
}

// Menú agrupado por categorías
function renderMenu() {
    const menuContainer = document.getElementById('menu');
    if (menuContainer) {
        menuContainer.innerHTML = '';
        categories.forEach(category => {
            const categoryProducts = products.filter(product => product.category === category && product.visible);
            if (categoryProducts.length > 0) {
                const categorySection = document.createElement('div');
                categorySection.className = 'category-section';
                categorySection.innerHTML = `
                    <h2>${category}</h2>
                    <div class="product-grid"></div>
                `;
                const productGrid = categorySection.querySelector('.product-grid');

                categoryProducts.sort((a, b) => a.name.localeCompare(b.name));

                categoryProducts.forEach(product => {
                    const productElement = document.createElement('div');
                    productElement.className = 'menu-item';
                    productElement.innerHTML = `
                        <img src="${product.image}" alt="${product.name}">
                        <h3>${product.name}</h3>
                        <p>$${product.price.toFixed(2)}</p>
                        <div class="button-container">
                            <button class="add-to-cart-btn" onclick="addToCartWithOptions(${product.id})">Agregar al Carrito</button>
                        </div>
                    `;
                    productGrid.appendChild(productElement);
                });
                menuContainer.appendChild(categorySection);
            }
        });
    }
}
function addToCartWithOptions(productId) {
    const product = products.find(p => p.id === productId);
    if (product.ingredients && product.ingredients.length > 0) {
        showCustomizeModal(productId);
    } else {
        addToCart(productId);
    }
}
function showCustomizeModal(productId) {
    const product = products.find(p => p.id === productId);
    let customizedIngredients = [...product.ingredients];
    
    const customizeModal = document.createElement('div');
    customizeModal.className = 'customize-modal';
    customizeModal.innerHTML = `
        <h3>Personalizar ${product.name}</h3>
        <div id="ingredients-list"></div>
        <button onclick="addToCartCustomized(${productId})">Agregar al Carrito</button>
        <button onclick="closeCustomizeModal()">Cancelar</button>
    `;
    
    document.body.appendChild(customizeModal);
    
    const ingredientsList = customizeModal.querySelector('#ingredients-list');
    customizedIngredients.forEach((ingredient, index) => {
        const ingredientElement = document.createElement('div');
        ingredientElement.innerHTML = `
            <input type="checkbox" id="ingredient-${index}" ${ingredient.included ? 'checked' : ''}>
            <label for="ingredient-${index}">${ingredient.name}</label>
        `;
        ingredientsList.appendChild(ingredientElement);
    });
}
function closeCustomizeModal() {
    const modal = document.querySelector('.customize-modal');
    if (modal) {
        modal.remove();
    }
}

function addToCartCustomized(productId) {
    const product = products.find(p => p.id === productId);
    const customizedProduct = {...product};
    customizedProduct.ingredients = [];
    
    const ingredientCheckboxes = document.querySelectorAll('.customize-modal input[type="checkbox"]');
    ingredientCheckboxes.forEach((checkbox, index) => {
        customizedProduct.ingredients.push({
            name: product.ingredients[index].name,
            included: checkbox.checked
        });
    });
    
    cart.push(customizedProduct);
    updateCart();
    closeCustomizeModal();
}

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    cart.push({...product});
    updateCart();
}

function updateCart() {
    const cartItemsElement = document.getElementById('cart-items');
    const cartTotalElement = document.getElementById('cart-total');
    if (cartItemsElement && cartTotalElement) {
        cartItemsElement.innerHTML = '';
        let total = 0;
        cart.forEach((product, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                ${product.name} - $${product.price.toFixed(2)}
                <button onclick="removeFromCart(${index})">Eliminar</button>
                <ul>
                    ${product.ingredients.map(ing => 
                        `<li>${ing.name}: ${ing.included ? 'Incluido' : 'Excluido'}</li>`
                    ).join('')}
                </ul>
            `;
            cartItemsElement.appendChild(li);
            total += product.price;
        });
        cartTotalElement.textContent = total.toFixed(2);
    }
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCart();
}let dailyOrderCount = 0;

function placeOrder() {
    if (cart.length === 0) {
        alert('El carrito está vacío.');
        return;
    }
    
    const now = new Date();
    if (localStorage.getItem('lastOrderDate') !== now.toDateString()) {
        dailyOrderCount = 0;
        localStorage.setItem('lastOrderDate', now.toDateString());
    }
    
    dailyOrderCount++;
    localStorage.setItem('dailyOrderCount', dailyOrderCount);
    
    const orderNumber = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${dailyOrderCount.toString().padStart(3, '0')}`;
    
    const order = {
        id: orderNumber,
        items: cart.map(item => ({
            ...item,
            excludedIngredients: item.ingredients.filter(ing => !ing.included).map(ing => ing.name)
        })),
        total: cart.reduce((sum, item) => sum + item.price, 0),
        date: now.toLocaleString()
    };
    
    orders.push(order);
    saveData();
    printOrder(order);
    alert('Pedido realizado con éxito!');
    cart = [];
    updateCart();
}
//función para imprimir el pedido
function printOrder(order) {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
            <head>
                <title>Pedido ${order.id}</title>
                <style>
                    body { font-family: Arial, sans-serif; }
                    table { width: 100%; border-collapse: collapse; }
                    th, td { border: 1px solid black; padding: 5px; text-align: left; }
                </style>
            </head>
            <body>
                <h1>Pedido ${order.id}</h1>
                <p>Fecha: ${order.date}</p>
                <table>
                    <tr>
                        <th>Producto</th>
                        <th>Precio</th>
                        <th>Ingredientes Excluidos</th>
                    </tr>
                    ${order.items.map(item => `
                        <tr>
                            <td>${item.name}</td>
                            <td>$${item.price.toFixed(2)}</td>
                            <td>${item.excludedIngredients.join(', ') || 'Ninguno'}</td>
                        </tr>
                    `).join('')}
                    <tr>
                        <th colspan="2">Total</th>
                        <td>$${order.total.toFixed(2)}</td>
                    </tr>
                </table>
            </body>
        </html>
    `);
    printWindow.document.close();
    //printWindow.print();
}
//función para renderizar la lista de pedidos
function renderOrders() {
    const ordersContainer = document.getElementById('orders-list');
    if (ordersContainer) {
        ordersContainer.innerHTML = '';
        orders.forEach(order => {
            const orderElement = document.createElement('div');
            orderElement.className = 'order-item';
            orderElement.innerHTML = `
                <h3>Pedido #${order.id}</h3>
                <p>Fecha: ${order.date}</p>
                <p>Total: $${order.total.toFixed(2)}</p>
                <button onclick="printOrder(${JSON.stringify(order)})">Imprimir</button>
            `;
            ordersContainer.appendChild(orderElement);
        });
    }
}
// Funciones para el panel de administración
function renderCategoryList() {
    const categoryListElement = document.getElementById('category-list');
    const productCategorySelect = document.getElementById('product-category');
    if (categoryListElement) {
        categoryListElement.innerHTML = '';
        categories.forEach(category => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span class="category-name">${category}</span>
                <button class="edit-btn" onclick="editCategory('${category}')">Editar</button>
                <button class="delete-btn" onclick="deleteCategory('${category}')">Eliminar</button>
            `;
            categoryListElement.appendChild(li);
        });
    }
    if (productCategorySelect) {
        productCategorySelect.innerHTML = '';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            productCategorySelect.appendChild(option);
        });
    }
}
function editCategory(oldName) {
    const newName = prompt(`Editar categoría "${oldName}":`, oldName);
    if (newName && newName !== oldName) {
        const index = categories.indexOf(oldName);
        if (index !== -1) {
            categories[index] = newName;
            products.forEach(product => {
                if (product.category === oldName) {
                    product.category = newName;
                }
            });
            saveData();
            renderCategoryList();
            renderProductList();
            alert(`Categoría "${oldName}" renombrada a "${newName}".`);
        }
    }
}
// Funcion para eliminar categoria
function deleteCategory(categoryName) {
    if (confirm(`¿Está seguro de que desea eliminar la categoría "${categoryName}"? Esta acción también eliminará todos los productos asociados a esta categoría.`)) {
        categories = categories.filter(category => category !== categoryName);
        products = products.filter(product => product.category !== categoryName);
        saveData();
        renderCategoryList();
        alert(`Categoría "${categoryName}" y sus productos asociados han sido eliminados.`);
    }
}
// Funcion para modificar productos
function renderProductList() {
    const productListElement = document.getElementById('product-list');
    if (productListElement) {
        productListElement.innerHTML = '';
        categories.forEach(category => {
            const categoryProducts = products.filter(product => product.category === category);
            if (categoryProducts.length > 0) {
                const categoryElement = document.createElement('div');
                categoryElement.className = 'product-category';
                categoryElement.innerHTML = `
                    <h3>${category}</h3>
                    <div class="product-grid"></div>
                `;
                const productGrid = categoryElement.querySelector('.product-grid');

                categoryProducts.slice(0, 2).forEach(product => {
                    const productElement = createProductElement(product);
                    productGrid.appendChild(productElement);
                });

                if (categoryProducts.length > 2) {
                    const viewMoreBtn = document.createElement('button');
                    viewMoreBtn.textContent = 'Ver más';
                    viewMoreBtn.className = 'view-more-btn';
                    viewMoreBtn.onclick = () => showAllProducts(category, categoryElement);
                    categoryElement.appendChild(viewMoreBtn);
                }

                productListElement.appendChild(categoryElement);
            }
        });
    }
}
function createProductElement(product) {
    const productElement = document.createElement('div');
    productElement.className = 'product-item';
    productElement.id = `product-${product.id}`;
    productElement.innerHTML = `
        <div class="product-details">
            <img src="${product.image}" alt="${product.name}">
            <div>
                <h4>${product.name}</h4>
                <p>Precio: $${product.price.toFixed(2)}</p>
                <label>
                    <input type="checkbox" ${product.visible ? 'checked' : ''} onchange="toggleProductVisibility(${product.id})">
                    Visible
                </label>
                <button onclick="showEditForm(${product.id})">Editar</button>
                <button onclick="deleteProduct(${product.id})">Eliminar</button>
            </div>
        </div>
        <form id="edit-form-${product.id}" class="edit-form">
            <select id="edit-category-${product.id}">
                ${categories.map(category => `<option value="${category}" ${category === product.category ? 'selected' : ''}>${category}</option>`).join('')}
            </select>
            <input type="text" id="edit-name-${product.id}" value="${product.name}" required>
            <input type="number" id="edit-price-${product.id}" value="${product.price}" step="0.01" required>
            <input type="text" id="edit-image-${product.id}" value="${product.image}" required>
            <textarea id="edit-ingredients-${product.id}" required>${product.ingredients.map(ing => ing.name).join(', ')}</textarea>
            <button type="button" onclick="updateProduct(${product.id})">Guardar Cambios</button>
            <button type="button" onclick="hideEditForm(${product.id})">Cancelar</button>
        </form>
    `;
    return productElement;
}
//función para ocultar el formulario de edición
function hideEditForm(productId) {
    const form = document.getElementById(`edit-form-${productId}`);
    form.style.display = 'none';
}

// Nueva función para cambiar la visibilidad de un producto
function toggleProductVisibility(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        product.visible = !product.visible;
        saveData();
        renderProductList();
    }
}

function showAllProducts(category, categoryElement) {
    const productGrid = categoryElement.querySelector('.product-grid');
    productGrid.innerHTML = '';
    const categoryProducts = products.filter(product => product.category === category);
    categoryProducts.forEach(product => {
        const productElement = createProductElement(product);
        productGrid.appendChild(productElement);
    });
    const viewMoreBtn = categoryElement.querySelector('.view-more-btn');
    viewMoreBtn.textContent = 'Cerrar';
    viewMoreBtn.onclick = () => hideExtraProducts(category, categoryElement);
}

function hideExtraProducts(category, categoryElement) {
    const productGrid = categoryElement.querySelector('.product-grid');
    productGrid.innerHTML = '';
    const categoryProducts = products.filter(product => product.category === category);
    categoryProducts.slice(0, 2).forEach(product => {
        const productElement = createProductElement(product);
        productGrid.appendChild(productElement);
    });
    const viewMoreBtn = categoryElement.querySelector('.view-more-btn');
    viewMoreBtn.textContent = 'Ver más';
    viewMoreBtn.onclick = () => showAllProducts(category, categoryElement);
}
function showEditForm(productId) {
    const form = document.getElementById(`edit-form-${productId}`);
    form.style.display = 'block';
}
function updateProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) {
        console.error(`Producto con id ${productId} no encontrado`);
        return;
    }

    const newCategory = document.getElementById(`edit-category-${productId}`).value;
    const newName = document.getElementById(`edit-name-${productId}`).value;
    const newPrice = parseFloat(document.getElementById(`edit-price-${productId}`).value);
    const newImage = document.getElementById(`edit-image-${productId}`).value;
    const newIngredients = document.getElementById(`edit-ingredients-${productId}`).value
        .split(',')
        .map(ing => ({ name: ing.trim(), included: true }));

    // Actualizar el producto
    product.category = newCategory;
    product.name = newName;
    product.price = newPrice;
    product.image = newImage;
    product.ingredients = newIngredients;

    // Guardar los cambios
    saveData();

    // Actualizar la UI
    const productElement = document.getElementById(`product-${productId}`);
    if (productElement) {
        productElement.querySelector('h4').textContent = newName;
        productElement.querySelector('p').textContent = `Precio: $${newPrice.toFixed(2)}`;
        productElement.querySelector('img').src = newImage;
        productElement.querySelector('select').value = newCategory;
    }

    // Ocultar el formulario de edición
    hideEditForm(productId);

    // Volver a renderizar la lista de productos para reflejar los cambios
    renderProductList();

    alert('Producto actualizado con éxito!');
}

function deleteProduct(productId) {
    if (confirm('¿Está seguro de que desea eliminar este producto?')) {
        products = products.filter(product => product.id !== productId);
        saveData();
        renderProductList();
        alert('Producto eliminado con éxito!');
    }
}
// Función para verificar permisos (usar en las páginas correspondientes)
function checkPermission(permission) {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) return false;
    return currentUser.permissions[permission];
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    renderMenu();
    updateCart();
    renderCategoryList();
    renderProductList();

    const addCategoryForm = document.getElementById('add-category-form');
    if (addCategoryForm) {
        addCategoryForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const categoryName = document.getElementById('category-name').value;
            if (!categories.includes(categoryName)) {
                categories.push(categoryName);
                saveData();
                renderCategoryList();
                alert(`Categoría "${categoryName}" agregada con éxito!`);
            } else {
                alert('Esta categoría ya existe.');
            }
            this.reset();
        });
    }

    const addProductForm = document.getElementById('add-product-form');
    if (addProductForm) {
        addProductForm.addEventListener('submit', function (e) {
            e.preventDefault();
            const newProduct = {
                id: Date.now(),
                category: document.getElementById('product-category').value,
                name: document.getElementById('product-name').value,
                price: parseFloat(document.getElementById('product-price').value),
                image: document.getElementById('product-image').value,
                ingredients: document.getElementById('product-ingredients').value
                    .split(',')
                    .map(ing => ({ name: ing.trim(), included: true }))
            };
            products.push(newProduct);
            saveData();
            renderProductList();
            this.reset();
            alert('Producto agregado con éxito!');
        });
    }
    renderOrders();
    const lastOrderDate = localStorage.getItem('lastOrderDate');
    if (lastOrderDate !== new Date().toDateString()) {
        dailyOrderCount = 0;
    } else {
        dailyOrderCount = parseInt(localStorage.getItem('dailyOrderCount') || '0');
    }

    //Nuevo

    loadUsers();
renderUserList();

const addUserForm = document.getElementById('add-user-form');
if (addUserForm) {
    addUserForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        const role = document.getElementById('user-role').value;
        const permissions = {
            canEditProducts: document.getElementById('can-edit-products').checked,
            canViewHome: document.getElementById('can-view-home').checked,
            canViewOrders: document.getElementById('can-view-orders').checked
        };
        addUser(username, password, role, permissions);
        this.reset();
        alert('Usuario agregado con éxito!');
    });
}
});




