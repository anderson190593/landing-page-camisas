// js/main.js
import { products } from './products.js';

// Estado da Aplicação
const state = {
    cart: JSON.parse(localStorage.getItem('alphaCart')) || [],
    filter: 'all'
};

// Elementos do DOM
const productGrid = document.getElementById('product-grid');
const cartCount = document.getElementById('cart-count');
const cartTotal = document.getElementById('cart-total');
const cartItemsContainer = document.getElementById('cart-items');
const filterBtns = document.querySelectorAll('.filter-btn');
const cartSidebar = document.getElementById('cart-sidebar');
const openCartBtn = document.getElementById('open-cart');
const closeCartBtn = document.getElementById('close-cart');

// --- FUNÇÕES CORE ---

// 1. Renderizar Produtos
function renderProducts() {
    productGrid.innerHTML = '';
    
    const filteredProducts = state.filter === 'all' 
        ? products 
        : products.filter(p => p.category === state.filter);

    filteredProducts.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card fade-in';
        
        card.innerHTML = `
            <div class="product-image-wrapper">
                ${product.badge ? `<span class="badge">${product.badge}</span>` : ''}
                <img src="${product.image}" alt="${product.name}" loading="lazy">
                <button class="add-to-cart-btn" onclick="addToCart(${product.id})">
                    <i class="fas fa-shopping-bag"></i> Adicionar
                </button>
            </div>
            <div class="product-info">
                <span class="category">${product.category}</span>
                <h3>${product.name}</h3>
                <p class="price">R$ ${product.price.toFixed(2).replace('.', ',')}</p>
            </div>
        `;
        productGrid.appendChild(card);
    });
}

// 2. Gerenciamento do Carrinho
window.addToCart = (id) => {
    const product = products.find(p => p.id === id);
    const existingItem = state.cart.find(item => item.id === id);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        state.cart.push({ ...product, quantity: 1 });
    }

    updateCartUI();
    saveCart();
    openCart(); // Feedback imediato
};

window.removeFromCart = (id) => {
    state.cart = state.cart.filter(item => item.id !== id);
    updateCartUI();
    saveCart();
};

window.changeQuantity = (id, change) => {
    const item = state.cart.find(item => item.id === id);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) window.removeFromCart(id);
        else updateCartUI();
        saveCart();
    }
};

function updateCartUI() {
    // Atualiza contadores
    const totalItems = state.cart.reduce((acc, item) => acc + item.quantity, 0);
    const totalPrice = state.cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    cartCount.innerText = totalItems;
    cartTotal.innerText = `R$ ${totalPrice.toFixed(2).replace('.', ',')}`;

    // Renderiza Itens do Carrinho
    cartItemsContainer.innerHTML = '';
    
    if (state.cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart-msg">Seu carrinho está vazio.</p>';
        return;
    }

    state.cart.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'cart-item';
        itemEl.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p>R$ ${item.price.toFixed(2).replace('.', ',')}</p>
                <div class="quantity-controls">
                    <button onclick="changeQuantity(${item.id}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="changeQuantity(${item.id}, 1)">+</button>
                </div>
            </div>
            <button class="remove-btn" onclick="removeFromCart(${item.id})">
                <i class="fas fa-trash"></i>
            </button>
        `;
        cartItemsContainer.appendChild(itemEl);
    });
}

function saveCart() {
    localStorage.setItem('alphaCart', JSON.stringify(state.cart));
}

// 3. UI Interactions
function openCart() {
    cartSidebar.classList.add('open');
    document.body.style.overflow = 'hidden'; // Bloqueia scroll
}

function closeCart() {
    cartSidebar.classList.remove('open');
    document.body.style.overflow = 'auto';
}

// Event Listeners
openCartBtn.addEventListener('click', openCart);
closeCartBtn.addEventListener('click', closeCart);

filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Remove active class de todos
        filterBtns.forEach(b => b.classList.remove('active'));
        // Adiciona ao clicado
        e.target.classList.add('active');
        
        // Atualiza estado e renderiza
        state.filter = e.target.dataset.filter;
        renderProducts();
    });
});

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    updateCartUI();
});