// js/main.js
import { products } from './products.js';

const LOJA_WHATSAPP = "5537999347154"; 

const state = {
    cart: JSON.parse(localStorage.getItem('alphaCart')) || [],
    filter: 'all',
    selections: {} 
};

const productGrid = document.getElementById('product-grid');
const cartCount = document.getElementById('cart-count');
const cartTotal = document.getElementById('cart-total');
const cartItemsContainer = document.getElementById('cart-items');
const filterBtns = document.querySelectorAll('.filter-btn');
const cartSidebar = document.getElementById('cart-sidebar');
const openCartBtn = document.getElementById('open-cart');
const closeCartBtn = document.getElementById('close-cart');
const checkoutBtn = document.querySelector('.checkout-btn');

// --- RENDERIZAÇÃO ---
function renderProducts() {
    productGrid.innerHTML = '';
    
    const filteredProducts = state.filter === 'all' 
        ? products 
        : products.filter(p => p.category === state.filter);

    filteredProducts.forEach(product => {
        const card = document.createElement('div');
        card.className = 'product-card fade-in';
        card.id = `card-${product.id}`;
        
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

// --- LÓGICA DE SELEÇÃO E VALIDAÇÃO ---

// Função auxiliar para verificar e abrir os tamanhos
function checkAndOpenSizes(id) {
    const selectedSize = state.selections[id];
    const sizeContainer = document.getElementById(`sizes-${id}`);

    // Se NÃO tiver tamanho selecionado
    if (!selectedSize) {
        // 1. Verifica se a gaveta já está aberta
        if (!sizeContainer.classList.contains('show')) {
            // Se fechada, ABRE ELA
            sizeContainer.classList.add('show');
        } else {
            // Se já estava aberta e o usuário clicou de novo sem escolher,
            // TREME os botões para chamar atenção (Erro)
            const buttons = sizeContainer.querySelectorAll('.size-btn');
            buttons.forEach(btn => {
                btn.classList.remove('size-error');
                void btn.offsetWidth; // Reinicia animação CSS
                btn.classList.add('size-error');
            });
        }
        return false; // Retorna falso para impedir a compra
    }
    
    return selectedSize; // Retorna o tamanho se estiver tudo ok
}

window.selectSize = (productId, size) => {
    state.selections[productId] = size;

    const container = document.getElementById(`sizes-${productId}`);
    const buttons = container.querySelectorAll('.size-btn');
    
    buttons.forEach(btn => {
        btn.classList.remove('selected', 'size-error');
        if (btn.innerText === size) {
            btn.classList.add('selected');
        }
    });
};

// --- FUNÇÕES DO CARRINHO ---

window.addToCart = (id) => {
    // Tenta validar e abrir tamanhos se necessário
    const selectedSize = checkAndOpenSizes(id);
    
    // Se retornou false, para aqui
    if (!selectedSize) return;

    // Se passou, executa a adição
    const product = products.find(p => p.id === id);
    const cartId = `${product.id}-${selectedSize}`;
    const existingItem = state.cart.find(item => item.cartId === cartId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        state.cart.push({ 
            ...product, 
            cartId: cartId, 
            size: selectedSize, 
            quantity: 1 
        });
    }

    updateCartUI();
    saveCart();
    
    const btnIcon = document.querySelector(`#card-${id} .btn-icon`);
    if(btnIcon) {
        btnIcon.classList.add('added');
        setTimeout(() => btnIcon.classList.remove('added'), 1000);
    }
};

window.buyNow = (id) => {
    const selectedSize = checkAndOpenSizes(id);
    
    if (!selectedSize) return;

    // Adiciona e abre o carrinho
    window.addToCart(id);
    openCart();
};

window.removeFromCart = (cartId) => {
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

function finalizePurchase() {
    if (state.cart.length === 0) {
        alert("Seu carrinho está vazio!");
        return;
    }

    let message = "Olá! Gostaria de finalizar meu pedido na *Alpha Outfits*:\n\n";

    state.cart.forEach(item => {
        message += `• ${item.quantity}x ${item.name} *(Tam: ${item.size})* - R$ ${(item.price * item.quantity).toFixed(2)}\n`;
    });

    const total = state.cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    message += `\n*Total: R$ ${total.toFixed(2).replace('.', ',')}*`;
    message += `\n\nAguardo instruções de pagamento.`;

    const encodedMessage = encodeURIComponent(message);
    const url = `https://wa.me/${LOJA_WHATSAPP}?text=${encodedMessage}`;

    window.open(url, '_blank');
}

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
        state.selections = {}; 
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const savedCart = JSON.parse(localStorage.getItem('alphaCart'));
    if (savedCart && savedCart.length > 0 && !savedCart[0].cartId) {
        localStorage.removeItem('alphaCart');
        state.cart = [];
    }

    renderProducts();
    updateCartUI();
});