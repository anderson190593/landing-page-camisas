// Espera o documento HTML ser completamente carregado
document.addEventListener('DOMContentLoaded', () => {

    // Seleciona todos os botões com a classe 'btn-dark'
    const comprarBtns = document.querySelectorAll('.btn-dark');

    // Itera sobre cada botão para adicionar um evento de clique
    comprarBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Previne o comportamento padrão do link (ir para outra página)
            e.preventDefault();
            
            // Exibe um alerta de confirmação
            alert('Produto adicionado ao carrinho! Volte sempre.');
        });
    });

});