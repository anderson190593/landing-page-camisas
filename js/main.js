// js/main.js
import { products } from './products.js';

// --- CONFIGURAÇÃO ---
const LOJA_WHATSAPP = "5537999347154"; 

// Estado da Aplicação
const state = {
    cart: JSON.parse(localStorage.getItem('alphaCart')) || [],
    filter: 'all',
    // Armazena temporariamente o tamanho selecionado de cada produto { idProduto: 'M' }
    selections: {} 
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
const checkoutBtn = document.querySelector('.checkout-btn');

// --- RENDERIZAÇÃO DE PRODUTOS ---
function renderProducts() {
    productGrid.innerHTML = '';
    
    const filteredProducts = state.filter === 'all' 
        ? products 
        : products.filter(p => p.category === state.filter);

    filteredProducts.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card fade-in';
        card.id = `card-${product.id}`; // Identificador único para o card
        
        // Botões de tamanho
        const sizes = ['P', 'M', 'G', 'GG'];
        const sizeButtonsHTML = sizes.map(size => 
            `<button class="size-btn" onclick="window.selectSize(${product.id}, '${size}')">${size}</button>`
        ).join('');

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
                
                <div class="size-selector" id="sizes-${product.id}">
                    ${sizeButtonsHTML}
                </div>

                <p class="price">R$ ${product.price.toFixed(2).replace('.', ',')}</p>
            </div>
        `;
        productGrid.appendChild(card);
    });
}

// --- LÓGICA DE SELEÇÃO DE TAMANHO ---
window.selectSize = (productId, size) => {
    // 1. Salva a seleção no estado
    state.selections[productId] = size;

    // 2. Atualiza visualmente os botões
    const container = document.getElementById(`sizes-${productId}`);
    const buttons = container.querySelectorAll('.size-btn');
    
    buttons.forEach(btn => {
        btn.classList.remove('selected', 'size-error'); // Remove erro e seleção anterior
        if (btn.innerText === size) {
            btn.classList.add('selected');
        }
    });
};

// --- FUNÇÕES DO CARRINHO ---

window.addToCart = (id) => {
    // Verifica se tem tamanho selecionado
    const selectedSize = state.selections[id];

    if (!selectedSize) {
        // Efeito visual de ERRO (tremer os botões)
        const container = document.getElementById(`sizes-${id}`);
        const buttons = container.querySelectorAll('.size-btn');
        buttons.forEach(btn => {
            btn.classList.remove('size-error');
            void btn.offsetWidth; // Trigger reflow para reiniciar animação
            btn.classList.add('size-error');
        });
        return; // Para a execução
    }

    const product = products.find(p => p.id === id);
    
    // Cria um ID único para o item no carrinho (ID do produto + Tamanho)
    // Ex: Se o ID do produto é 1 e tamanho M, o cartId será "1-M"
    const cartId = `${product.id}-${selectedSize}`;

    const existingItem = state.cart.find(item => item.cartId === cartId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        state.cart.push({ 
            ...product, 
            cartId: cartId, // Importante para diferenciar
            size: selectedSize, // Salva o tamanho para exibir
            quantity: 1 
        });
    }

    updateCartUI();
    saveCart();
    
    // Feedback visual
    const btnIcon = document.querySelector(`#card-${id} .btn-icon`);
    if(btnIcon) {
        btnIcon.classList.add('added');
        setTimeout(() => btnIcon.classList.remove('added'), 1000);
    }
};

window.buyNow = (id) => {
    // Tenta adicionar (se não tiver tamanho, a função addToCart já barra e mostra erro)
    const selectedSize = state.selections[id];
    if (selectedSize) {
        window.addToCart(id);
        openCart();
    } else {
        window.addToCart(id); // Chama só para disparar o efeito de erro
    }
};

window.removeFromCart = (cartId) => {
    // Agora removemos pelo cartId (ID + Tamanho)
    state.cart = state.cart.filter(item => item.cartId !== cartId);
    updateCartUI();
    saveCart();
};

window.changeQuantity = (cartId, change) => {
    const item = state.cart.find(item => item.cartId === cartId);
    if (item) {
        item.quantity += change;
        if (item.quantity <= 0) window.removeFromCart(cartId);
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
        // Adiciona o tamanho na mensagem
        message += `• ${item.quantity}x ${item.name} *(Tam: ${item.size})* - R$ ${(item.price * item.quantity).toFixed(2)}\n`;
    });

    const total = state.cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    message += `\n*Total: R$ ${total.toFixed(2).replace('.', ',')}*`;
    message += `\n\nAguardo instruções de pagamento.`;

    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${LOJA_WHATSAPP}?text=${encodedMessage}`;

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
        if(checkoutBtn) {
            checkoutBtn.style.opacity = '0.5';
            checkoutBtn.style.pointerEvents = 'none';
        }
        return;
    } else {
        if(checkoutBtn) {
            checkoutBtn.style.opacity = '1';
            checkoutBtn.style.pointerEvents = 'auto';
        }
    }

    state.cart.forEach(item => {
        const itemEl = document.createElement('div');
        itemEl.className = 'cart-item';
        
        // Passamos o 'cartId' (string) para as funções, por isso as aspas simples '${item.cartId}'
        itemEl.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <div class="cart-item-info">
                <h4>${item.name} <span style="color: #888; font-size: 0.8em;">(${item.size})</span></h4>
                <p>R$ ${item.price.toFixed(2).replace('.', ',')}</p>
                <div class="quantity-controls">
                    <button onclick="window.changeQuantity('${item.cartId}', -1)">-</button>
                    <span>${item.quantity}</span>
                    <button onclick="window.changeQuantity('${item.cartId}', 1)">+</button>
                </div>
            </div>
            <button class="remove-btn" onclick="window.removeFromCart('${item.cartId}')">
                <i class="fas fa-trash"></i>
            </button>
        `;
        cartItemsContainer.appendChild(itemEl);
    });
}

function saveCart() {
    localStorage.setItem('alphaCart', JSON.stringify(state.cart));
}

// --- EVENTOS UI ---
function openCart() {
    cartSidebar.classList.add('open');
    document.body.classList.add('cart-open');
    document.body.style.overflow = 'hidden';
}

function closeCart() {
    cartSidebar.classList.remove('open');
    document.body.classList.remove('cart-open');
    document.body.style.overflow = 'auto';
}

openCartBtn.addEventListener('click', openCart);
closeCartBtn.addEventListener('click', closeCart);

if (checkoutBtn) {
    checkoutBtn.addEventListener('click', finalizePurchase);
}

filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        filterBtns.forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        state.filter = e.target.dataset.filter;
        renderProducts();
        // Limpa seleções ao trocar filtro para evitar confusão visual
        state.selections = {}; 
    });
});

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // Limpa o carrinho antigo se ele não tiver a estrutura nova (com cartId)
    // Isso evita bugs para quem já acessou o site antes
    const savedCart = JSON.parse(localStorage.getItem('alphaCart'));
    if (savedCart && savedCart.length > 0 && !savedCart[0].cartId) {
        localStorage.removeItem('alphaCart');
        state.cart = [];
    }

    renderProducts();
    updateCartUI();
});