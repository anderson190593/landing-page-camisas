// js/main.js
import { products } from './products.js';

// --- CONFIGURAÇÃO ---
const LOJA_WHATSAPP = "5537999347154"; // Coloque seu número aqui (com 55 + DDD)

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
const checkoutBtn = document.querySelector('.checkout-btn'); // Seleciona o botão de checkout

// --- RENDERIZAÇÃO DE PRODUTOS ---
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
                
                <div class="product-actions">
                    <button class="btn-icon" onclick="window.addToCart(${product.id})" title="Adicionar ao Carrinho">
                        <i class="fas fa-cart-plus"></i>
                    </button>
                    <button class="btn-buy" onclick="window.buyNow(${product.id})" title="Comprar Agora">
                        Comprar
                    </button>
                </div>
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

// --- FUNÇÕES DO CARRINHO (Globais para acesso via HTML) ---

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
    
    // Feedback visual (opcional)
    const btn = event.currentTarget;
    if(btn) {
        btn.classList.add('added');
        setTimeout(() => btn.classList.remove('added'), 1000);
    }
};

window.buyNow = (id) => {
    window.addToCart(id);
    openCart();
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

// --- CHECKOUT VIA WHATSAPP ---
function finalizePurchase() {
    if (state.cart.length === 0) {
        alert("Seu carrinho está vazio!");
        return;
    }

    let message = "Olá! Gostaria de finalizar meu pedido na *Alpha Outfits*:\n\n";

    state.cart.forEach(item => {
        message += `• ${item.quantity}x ${item.name} - R$ ${(item.price * item.quantity).toFixed(2)}\n`;
    });

    const total = state.cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    message += `\n*Total: R$ ${total.toFixed(2).replace('.', ',')}*`;
    message += `\n\nAguardo instruções de pagamento.`;

    // Codifica a mensagem para URL
    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${LOJA_WHATSAPP}?text=${encodedMessage}`;

    // Abre o WhatsApp
    window.open(url, '_blank');
}

// --- ATUALIZAÇÃO DA UI ---
function updateCartUI() {
    const totalItems = state.cart.reduce((acc, item) => acc + item.quantity, 0);
    const totalPrice = state.cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    cartCount.innerText = totalItems;
    cartTotal.innerText = `R$ ${totalPrice.toFixed(2).replace('.', ',')}`;

    cartItemsContainer.innerHTML = '';
    
    if (state.cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart-msg">Seu carrinho está vazio.</p>';
        // Desabilita botão se vazio
        checkoutBtn.style.opacity = '0.5';
        checkoutBtn.style.pointerEvents = 'none';
        return;
    } else {
        checkoutBtn.style.opacity = '1';
        checkoutBtn.style.pointerEvents = 'auto';
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
                    <button onclick="window.changeQuantity(${item.id}, -1)">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="window.changeQuantity(${item.id}, 1)">+</button>
                </div>
            </div>
            <button class="remove-btn" onclick="window.removeFromCart(${item.id})">
                <i class="fas fa-trash"></i>
            </button>
        `;
        cartItemsContainer.appendChild(itemEl);
    });
}

function saveCart() {
    localStorage.setItem('alphaCart', JSON.stringify(state.cart));
}

// --- EVENTOS ---
function openCart() {
    cartSidebar.classList.add('open');
    document.body.classList.add('cart-open'); // NOVA LINHA: Marca que o carrinho abriu
    document.body.style.overflow = 'hidden';
}

function closeCart() {
    cartSidebar.classList.remove('open');
    document.body.classList.remove('cart-open'); // NOVA LINHA: Remove a marca
    document.body.style.overflow = 'auto';
}

openCartBtn.addEventListener('click', openCart);
closeCartBtn.addEventListener('click', closeCart);

// Adiciona evento ao botão de checkout (se ele existir)
if (checkoutBtn) {
    checkoutBtn.addEventListener('click', finalizePurchase);
}

filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        state.filter = e.target.dataset.filter;
        renderProducts();
    });
});

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    renderProducts();
    updateCartUI();
});