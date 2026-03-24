const SUPABASE_URL = 'https://rwwcmgzfurktgtktncix.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3d2NtZ3pmdXJrdGd0a3RuY2l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTQ2MTIsImV4cCI6MjA4OTg3MDYxMn0.AjzquOt6-BoJ6Um3Uqh9qY0xfths1lg2jOK_eKWuYeE';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let filtroTipoAtivo = ""; // Guarda o tipo selecionado pelo usuário

// Função exclusiva para a tela de Estoque
async function mostrarEstoque() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = '<p>Carregando produtos...</p>';

    const { data: produtos, error } = await _supabase
        .from('produtos')
        .select('*');

    if (error) {
        mainContent.innerHTML = '<p>Erro ao carregar: ' + error.message + '</p>';
        return;
    }

    let html = `
        <h1>Estoque</h1>
        <div class="busca-container">
            <div class="busca-wrapper">
                <input type="text" id="inputBusca" placeholder="Pesquisar produto..." onkeyup="filtrarProdutos()">
                <img src="imagens/filtro.png" class="icone-filtro-busca" onclick="toggleMenuFiltro()">
                <div id="menuFiltro" class="menu-filtro"></div>
            </div>
        </div>
        <div class="grid-produtos" id="gridProdutos">
    `;

    produtos.forEach(item => {
        const dadosEstoque = item.cor || {}; 
        let estoqueGeral = 0;
        let listaCoresHtml = "";

        // Percorre Estoque C e Estoque E
        Object.entries(dadosEstoque).forEach(([nomeEstoque, cores]) => {
            // Título do Estoque
            listaCoresHtml += `<div style="font-weight: bold; margin-top: 10px; margin-bottom: 5px; color: var(--accent-color); border-bottom: 1px solid #eee; width: 100%; font-size: 0.85rem;">${nomeEstoque}</div>`;

            // Criamos uma mini-grid para as cores deste estoque específico
            listaCoresHtml += `<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; justify-items: center; width: 100%; margin-bottom: 10px;">`;

            Object.entries(cores).forEach(([cor, qtd]) => {
                const quantidade = Number(qtd) || 0;
                estoqueGeral += quantidade;

                const hexCorBolinha = obterHexDaCor(cor);

                listaCoresHtml += `
                    <div style="
                        display: flex; 
                        align-items: center; 
                        justify-content: center; 
                        background-color: #ebebeb; 
                        border-radius: 20px; 
                        padding: 4px 0;
                        border: 1px solid #e0e0e0;
                        width: 100%;
                        max-width: 60px;
                    ">
                        <span style="
                            width: 14px; 
                            height: 14px; 
                            background: ${hexCorBolinha};
                            border-radius: 50%; 
                            margin-right: 5px; 
                            display: inline-block;
                            flex-shrink: 0;
                            box-sizing: border-box; 
                        "></span>
                        <strong style="line-height: 1; font-size: 0.85rem; min-width: 15px; text-align: center;">${quantidade}</strong>
                    </div>
                `;
            });

            listaCoresHtml += `</div>`; // Fecha a mini-grid de cores
        });

        html += `
            <div class="card-container" data-tipo="${item.tipo || ''}" onclick="girarCarta(this)">
                <div class="card-body">
                    <div class="card-front">
                        <div class="foto-quadrada">
                            <img src="${item.imagem_url || 'imagens/placeholder.png'}" alt="${item.nome}">
                        </div>
                        <div class="info-produto">
                            <h3 class="nome-produto">${item.nome}</h3>
                            <div class="estoque-geral-container">
                                <img src="imagens/estoque.png" class="icone-estoque-p">
                                <span class="numero-estoque">${estoqueGeral}</span>
                            </div>
                        </div>
                    </div>
                    <div class="card-back" style="flex-direction: column; justify-content: flex-start; padding: 15px; overflow-y: auto;">
                        <h4 style="font-size: 0.9rem; margin-bottom: 5px; text-align: center; width: 100%;">Distribuição</h4>
                        ${listaCoresHtml || '<p style="color: #999;">Sem dados</p>'}
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    mainContent.innerHTML = html;
    carregarTiposFiltro(produtos);
}

// Função para girar a carta garantindo que apenas uma fique virada
function girarCarta(elemento) {
    // 1. Verifica se a carta clicada já está virada
    const jaEstaGirado = elemento.classList.contains('girado');

    // 2. Busca TODAS as cartas que estão viradas no momento
    const todasAsCartasGiradas = document.querySelectorAll('.card-container.girado');

    // 3. Remove a classe 'girado' de todas elas (desvira as outras)
    todasAsCartasGiradas.forEach(carta => {
        carta.classList.remove('girado');
    });

    // 4. Se a carta que cliquei NÃO estava virada, agora eu viro ela
    // Se ela já estava virada, ela apenas desvirou no passo anterior
    if (!jaEstaGirado) {
        elemento.classList.add('girado');
    }
}

function filtrarProdutos() {
    const termoBusca = document.getElementById('inputBusca').value.trim().toLowerCase();
    const cards = document.querySelectorAll('.card-container');

    cards.forEach(card => {
        const nomeProduto = card.querySelector('.nome-produto').innerText.toLowerCase();
        const tipoProduto = (card.getAttribute('data-tipo') || "").toLowerCase();
        
        // Regra 1: O nome do produto deve bater com o que foi digitado (início de palavras)
        const palavrasNome = nomeProduto.split(" ");
        const bateNome = termoBusca === "" || palavrasNome.some(p => p.startsWith(termoBusca));

        // Regra 2: O tipo do produto deve ser IGUAL ao filtro selecionado
        // Se filtroTipoAtivo estiver vazio, ele ignora essa regra (mostra todos)
        const bateTipo = filtroTipoAtivo === "" || tipoProduto === filtroTipoAtivo.toLowerCase();

        // Só mostra o card se ele passar nas DUAS regras ao mesmo tempo
        if (bateNome && bateTipo) {
            card.style.display = "block";
        } else {
            card.style.display = "none";
        }
    });
}

function toggleMenuFiltro() {
    const menu = document.getElementById('menuFiltro');
    if (menu) {
        menu.classList.toggle('ativo');
    }
}

function carregarTiposFiltro(produtos) {
    const menu = document.getElementById('menuFiltro');
    // Busca os tipos únicos
    const tiposUnicos = [...new Set(produtos.map(p => p.tipo).filter(t => t))];

    // Criamos o HTML começando pela opção "Todos"
    // Verificamos se 'Todos' deve estar em negrito (quando filtroTipoAtivo está vazio)
    let classeTodos = filtroTipoAtivo === "" ? "item-categoria ativo" : "item-categoria";
    let htmlCategorias = `<div class="${classeTodos}" onclick="filtrarPorTipo('', this)"><b>Todos</b></div>`;
    
    tiposUnicos.sort().forEach(tipo => {
        // Verifica se este tipo é o que está selecionado atualmente
        let classeAtiva = (tipo === filtroTipoAtivo) ? "item-categoria ativo" : "item-categoria";
        htmlCategorias += `<div class="${classeAtiva}" onclick="filtrarPorTipo('${tipo}', this)">${tipo}</div>`;
    });

    menu.innerHTML = htmlCategorias;
}

function filtrarPorTipo(tipoSelecionado, elemento) {
    // 1. Atualiza a variável global de controle
    filtroTipoAtivo = tipoSelecionado;
    
    // 2. Remove a classe 'ativo' de todos os itens e adiciona apenas no clicado
    const itens = document.querySelectorAll('.item-categoria');
    itens.forEach(item => item.classList.remove('ativo'));
    if (elemento) elemento.classList.add('ativo');

    // 3. Fecha o menu e filtra os produtos
    toggleMenuFiltro();
    filtrarProdutos();
}

// Evento para clicar no ícone de estoque (é o 3º item da sua sidebar)
document.addEventListener('DOMContentLoaded', () => {
    const itensMenu = document.querySelectorAll('.sidebar-item');
    if(itensMenu[2]) { // O ícone de estoque é o índice 2
        itensMenu[2].addEventListener('click', mostrarEstoque);
    }
});

// Fecha o menu se clicar em qualquer lugar da tela fora do menu ou no próprio campo de busca
document.addEventListener('click', (event) => {
    const menu = document.getElementById('menuFiltro');
    const iconeFiltro = document.querySelector('.icone-filtro-busca');
    const inputBusca = document.getElementById('inputBusca');
    
    // Se o menu não existir ou não estiver ativo, não faz nada
    if (!menu || !menu.classList.contains('ativo')) return;

    // Se o clique foi no input de busca OU fora do wrapper da busca
    // Mas ignoramos se o clique foi no ícone de filtro (pois ele já tem o toggleMenuFiltro)
    if (event.target === inputBusca || (!inputBusca.parentElement.contains(event.target))) {
        // Pequeno delay para não conflitar com o clique do ícone caso eles estejam muito próximos
        if (event.target !== iconeFiltro) {
            menu.classList.remove('ativo');
        }
    }
});

// Configuração centralizada de cores
const MAPA_CORES = {
    "preto": "#000000",
    "branco": "#ffffff",
    "azul": "#0047ab",
    "vermelho": "#ff0000",
    "verde": "#008000",
    "amarelo": "#ffdf00",
    "cinza": "#808080",
    "laranja": "#ffa500",
    "rosa": "#ffc0cb",
    "roxo": "#800080",
    "transparente": "repeating-conic-gradient(#ffffff 0% 25%, #bbbbbb 0% 50%) 50% / 6px 6px"
};

function obterHexDaCor(nomeCor) {
    const corNormalizada = nomeCor.trim().toLowerCase();
    return MAPA_CORES[corNormalizada] || "#cccccc";
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('ativo');
}

// Fecha o menu ao clicar em um item no celular
document.addEventListener('DOMContentLoaded', () => {
    const itensMenu = document.querySelectorAll('.sidebar-item');
    itensMenu.forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                toggleSidebar();
            }
        });
    });
});

// Função para a tela de Alterar/Adicionar
// Função para a tela inicial de escolha (Alterar ou Adicionar)
function mostrarOpcoesAlterar() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 70vh; gap: 40px; padding: 20px;">
            <h1 style="margin-bottom: 20px;">O que deseja fazer?</h1>
            <div style="display: flex; gap: 50px; flex-wrap: wrap; justify-content: center;">
                <div class="opcao-alterar" style="text-align: center; cursor: pointer;" onclick="console.log('Em breve: Alterar')">
                    <div style="width: 120px; height: 120px; background: #f4f4f4; border-radius: 20px; display: flex; align-items: center; justify-content: center; border: 2px solid var(--accent-color); transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                        <img src="imagens/alterar.png" style="width: 60px; height: 60px; object-fit: contain;">
                    </div>
                    <p style="margin-top: 15px; font-weight: bold; color: var(--text-color);">Alterar Produto</p>
                </div>

                <div class="opcao-alterar" style="text-align: center; cursor: pointer;" onclick="exibirFormularioAdicionar()">
                    <div style="width: 120px; height: 120px; background: #f4f4f4; border-radius: 20px; display: flex; align-items: center; justify-content: center; border: 2px solid var(--accent-color); transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                        <img src="imagens/adicionar.png" style="width: 60px; height: 60px; object-fit: contain;">
                    </div>
                    <p style="margin-top: 15px; font-weight: bold; color: var(--text-color);">Adicionar Novo</p>
                </div>
            </div>
        </div>
    `;
}

// Função que renderiza o formulário de cadastro
function exibirFormularioAdicionar() {
    const mainContent = document.getElementById('main-content');
    
    mainContent.innerHTML = `
        <div style="max-width: 1000px; margin: 0 auto; animation: fadeIn 0.3s ease;">
            <h1 style="margin-bottom: 30px; font-size: 1.8rem; border-bottom: 2px solid #f4f4f4; padding-bottom: 10px;">Cadastrar novo produto</h1>

            <form id="formAdicionar" style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 30px; align-items: start;">
                
                <div id="bloco-dados-produto">
                    <div style="background: white; padding: 25px; border-radius: 12px; border: 1px solid #eee; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                        <div style="margin-bottom: 15px;">
                            <label style="font-weight: bold; display: block; margin-bottom: 8px; font-size: 0.9rem;">Nome do produto</label>
                            <input type="text" id="addNome" placeholder="Ex: Smartwatch Ultra 9" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ddd; outline: none;">
                        </div>

                        <div style="margin-bottom: 15px;">
                            <label style="font-weight: bold; display: block; margin-bottom: 8px; font-size: 0.9rem;">Imagem do Produto</label>
                            <label for="addImagem" style="display: flex; align-items: center; justify-content: center; gap: 10px; padding: 12px; background: #f4f4f4; border: 2px dashed #ddd; border-radius: 8px; cursor: pointer; color: #666; font-size: 0.85rem;">
                                <img src="imagens/menu/menu-adicionar.png" style="width: 20px; opacity: 0.5;">
                                <span id="labelNomeArquivo">Clique para upload</span>
                                <input type="file" id="addImagem" accept="image/*" style="display: none;" onchange="document.getElementById('labelNomeArquivo').innerText = this.files[0].name">
                            </label>
                        </div>

                        <div>
                            <label style="font-weight: bold; display: block; margin-bottom: 8px; font-size: 0.9rem;">Categoria</label>
                            <select id="addTipo" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ddd; background: white; outline: none;">
                                <option value="" disabled selected>Selecione</option>
                                <option value="Carregador">Carregador</option>
                                <option value="Smartwatch">Smartwatch</option>
                                <option value="Fone de Ouvido">Fone de Ouvido</option>
                                <option value="Cabo">Cabo</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div id="bloco-estoques-cores" style="display: flex; flex-direction: column; gap: 20px;">
                    <div style="background: white; border: 1px solid #eee; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
                        <h3 style="font-size: 0.9rem; margin-bottom: 15px; color: var(--accent-color); font-weight: bold;">Estoque C</h3>
                        <div id="container-cores-C" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; margin-bottom: 15px;"></div>
                        <button type="button" onclick="abrirSeletorCores('C')" style="width: 100%; padding: 10px; border: 1px dashed var(--accent-color); background: #f0f7ff; color: var(--accent-color); border-radius: 8px; cursor: pointer; font-weight: bold;">+ Adicionar cor</button>
                    </div>

                    <div style="background: white; border: 1px solid #eee; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.02);">
                        <h3 style="font-size: 0.9rem; margin-bottom: 15px; color: var(--accent-color); font-weight: bold;">Estoque E</h3>
                        <div id="container-cores-E" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 10px; margin-bottom: 15px;"></div>
                        <button type="button" onclick="abrirSeletorCores('E')" style="width: 100%; padding: 10px; border: 1px dashed var(--accent-color); background: #f0f7ff; color: var(--accent-color); border-radius: 8px; cursor: pointer; font-weight: bold;">+ Adicionar cor</button>
                    </div>
                </div>

                <button type="button" id="btn-salvar-produto" onclick="salvarNovoProduto()" 
                    style="padding: 20px; background: var(--accent-color); color: white; border: none; border-radius: 12px; font-weight: bold; cursor: pointer; font-size: 1rem; box-shadow: 0 4px 15px rgba(0, 71, 171, 0.2);">
                    Salvar produto
                </button>
            </form>
        </div>

        <div id="modalSeletorCores" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 9999; align-items: center; justify-content: center;">
            <div style="background: white; padding: 25px; border-radius: 15px; max-width: 400px; width: 90%;">
                <h3 style="margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px;">Cor para Estoque <span id="labelEstoqueAlvo"></span></h3>
                <div id="lista-opcoes-cores" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; max-height: 300px; overflow-y: auto;"></div>
                <button type="button" onclick="document.getElementById('modalSeletorCores').style.display='none'" style="margin-top: 20px; width: 100%; padding: 10px; border: none; border-radius: 8px; background: #eee; cursor: pointer;">Cancelar</button>
            </div>
        </div>
    `;
}
let estoqueAlvoAtual = ''; 

function abrirSeletorCores(estoque) {
    estoqueAlvoAtual = estoque;
    document.getElementById('labelEstoqueAlvo').innerText = estoque;
    const modal = document.getElementById('modalSeletorCores');
    const lista = document.getElementById('lista-opcoes-cores');
    
    modal.style.display = 'flex';
    lista.innerHTML = Object.keys(MAPA_CORES).map(cor => `
        <div onclick="adicionarCorAoEstoque('${cor}')" style="cursor: pointer; text-align: center; padding: 10px; border: 1px solid #eee; border-radius: 8px; transition: all 0.2s;" onmouseover="this.style.borderColor='var(--accent-color)'; this.style.background='#f0f7ff'" onmouseout="this.style.borderColor='#eee'; this.style.background='white'">
            <div style="width: 25px; height: 25px; border-radius: 50%; background: ${obterHexDaCor(cor)}; margin: 0 auto 5px; border: 1px solid #ccc;"></div>
            <span style="font-size: 0.75rem; text-transform: capitalize; font-weight: 500;">${cor}</span>
        </div>
    `).join('');
}

function adicionarCorAoEstoque(cor) {
    const container = document.getElementById(`container-cores-${estoqueAlvoAtual}`);
    
    if (container.querySelector(`[data-cor="${cor}"]`)) {
        document.getElementById('modalSeletorCores').style.display = 'none';
        return;
    }

    const novoInput = document.createElement('div');
    novoInput.innerHTML = `
        <div style="
            display: flex; 
            align-items: center; 
            justify-content: space-between; /* Força o alinhamento nas extremidades */
            gap: 5px; 
            background: #f9f9f9; 
            padding: 6px 10px; 
            border-radius: 8px; 
            border: 1px solid #eee; 
            animation: scaleIn 0.2s ease;
            width: 100%; /* Garante que ocupe o espaço do grid */
            box-sizing: border-box;
        ">
            <div style="display: flex; align-items: center; gap: 6px; overflow: hidden;">
                <span style="width: 12px; height: 12px; border-radius: 50%; background: ${obterHexDaCor(cor)}; border: 1px solid #ccc; flex-shrink: 0;"></span>
                <span style="font-size: 0.7rem; text-transform: capitalize; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${cor}</span>
            </div>
            
            <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0;">
                <input type="number" value="0" min="0" data-estoque="Estoque ${estoqueAlvoAtual}" data-cor="${cor}" 
                    style="
                        width: 38px; 
                        border: 1px solid #ddd; 
                        border-radius: 4px; 
                        padding: 2px; 
                        text-align: center; 
                        font-size: 0.8rem; 
                        font-weight: normal; 
                        color: #000; 
                        accent-color: var(--accent-color);
                        outline: none;
                    ">

                <button type="button" 
                    onclick="this.parentElement.parentElement.remove()" 
                    onmouseover="this.style.color='#ff4d4d'" 
                    onmouseout="this.style.color='var(--accent-color)'"
                    style="
                        background: none; 
                        border: none; 
                        color: var(--accent-color); 
                        cursor: pointer; 
                        font-size: 1.1rem; 
                        padding: 0; 
                        margin-left: 2px;
                        line-height: 1; 
                        transition: color 0.2s;
                        font-family: Arial, sans-serif;
                    ">×</button>
            </div>
        </div>
    `;
    
    container.appendChild(novoInput.firstElementChild);
    document.getElementById('modalSeletorCores').style.display = 'none';
}
// Atualize o listener de carregamento do DOM para incluir o clique
document.addEventListener('DOMContentLoaded', () => {
    const itensMenu = document.querySelectorAll('.sidebar-item');
    
    // Ícone de estoque (índice 2)
    if(itensMenu[2]) {
        itensMenu[2].addEventListener('click', mostrarEstoque);
    }

    // Ícone de alterar (índice 3)
    if(itensMenu[3]) {
        itensMenu[3].addEventListener('click', mostrarOpcoesAlterar);
    }
});