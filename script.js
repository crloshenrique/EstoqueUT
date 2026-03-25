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
        .select('*')
        .order('updated_at', { ascending: false });

    if (error) {
        mainContent.innerHTML = '<p>Erro ao carregar: ' + error.message + '</p>';
        return;
    }

    let html = `
            <h1 style="text-align: center; width: 100%; margin-bottom: 30px;">Estoque</h1>
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
        ["Estoque C", "Estoque E"].forEach((nomeEstoque) => {
            const cores = dadosEstoque[nomeEstoque] || {};
            
            // Título do Estoque
            listaCoresHtml += `<div style="font-weight: bold; margin-top: 10px; margin-bottom: 5px; color: var(--accent-color); border-bottom: 1px solid #eee; width: 100%; font-size: 0.85rem;">${nomeEstoque}</div>`;

            // Criamos uma mini-grid para as cores deste estoque específico
            listaCoresHtml += `<div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; justify-items: center; width: 100%; margin-bottom: 10px;">`;

            // --- LÓGICA PARA MANTER A ORDEM ---
            const chaveOrdem = nomeEstoque === "Estoque C" ? "ordemC" : "ordemE";
            const ordemParaUsar = dadosEstoque[chaveOrdem] || Object.keys(cores);

            ordemParaUsar.forEach((cor) => {
                const qtd = cores[cor];
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

const preco = item.valor 
    ? Number(item.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace(/\s/g, '') 
    : 'R$0,00';

html += `
    <div class="card-container" data-tipo="${item.tipo || ''}" onclick="girarCarta(this)">
        <div class="card-body">
            <div class="card-front">
                <div class="foto-quadrada">
                    <img src="${item.imagem_url || 'imagens/placeholder.png'}" alt="${item.nome}">
                </div>
                <div class="info-produto" style="padding: 15px; display: flex; flex-direction: column;">
                    
                    <h3 class="nome-produto" style="margin: 0; font-size: 1rem; color: #0047ab; line-height: 1.2rem; height: 2.4rem; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                        ${item.nome}
                    </h3>

                    <div style="width: 100%; height: 1px; background-color: #eee; margin: 8px 0;"></div>
                

<div style="display: flex; align-items: center; gap: 22px;">
    
    <div style="display: flex; align-items: center; gap: 4px;">
        <img src="imagens/estoque.png" class="icone-estoque-p">
        <span class="numero-estoque">${estoqueGeral}</span>
    </div>
    
    <div style="display: flex; align-items: center; gap: 4px;">
        <img src="imagens/dinheiro.png" class="icone-estoque-p">
        <span class="numero-estoque">${preco}</span>
    </div>
    
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
                <div class="opcao-alterar" style="text-align: center; cursor: pointer;" onclick="exibirFormularioAdicionar()">
                    <div style="width: 120px; height: 120px; background: #f4f4f4; border-radius: 20px; display: flex; align-items: center; justify-content: center; border: 2px solid var(--accent-color); transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                        <img src="imagens/adicionar.png" style="width: 60px; height: 60px; object-fit: contain;">
                    </div>
                    <p style="margin-top: 15px; font-weight: bold; color: var(--text-color);">Adicionar</p>
                </div>

                <div class="opcao-alterar" style="text-align: center; cursor: pointer;" onclick="exibirBuscaAlterar()">
                    <div style="width: 120px; height: 120px; background: #f4f4f4; border-radius: 20px; display: flex; align-items: center; justify-content: center; border: 2px solid var(--accent-color); transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                        <img src="imagens/alterar.png" style="width: 60px; height: 60px; object-fit: contain;">
                    </div>
                    <p style="margin-top: 15px; font-weight: bold; color: var(--text-color);">Alterar</p>
                </div>
            </div>
        </div>
    `;
}

function exibirFormularioAdicionar(produto = null) {
    const mainContent = document.getElementById('main-content');
    const modoEdicao = produto !== null; // Se recebeu um produto, é modo edição

    mainContent.innerHTML = `
        <div style="max-width: 1000px; margin: 0 auto; animation: fadeIn 0.3s ease;">
            <h1 style="text-align: center; margin-bottom: 30px; font-size: 1.8rem; border-bottom: 2px solid #f4f4f4; padding-bottom: 10px; width: 100%;">
                ${modoEdicao ? 'Alterar produto' : 'Cadastrar novo produto'}
            </h1>

            <form id="formAdicionar" data-id-edicao="${modoEdicao ? produto.id : ''}" style="display: grid; grid-template-columns: 1fr 1.2fr; gap: 30px; align-items: start;">
                
                <div id="bloco-dados-produto">
                    <div style="background: white; padding: 25px; border-radius: 12px; border: 1px solid #eee; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                        <div style="margin-bottom: 15px;">
                            <label style="font-weight: bold; display: block; margin-bottom: 8px; font-size: 0.9rem;">Nome</label>
                            <input type="text" id="addNome" value="${modoEdicao ? produto.nome : ''}" placeholder="Ex: Smartwatch Ultra 9" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ddd; outline: none;">
                        </div>

                        <div style="margin-bottom: 15px;">
                            <label style="font-weight: bold; display: block; margin-bottom: 8px; font-size: 0.9rem;">Imagem ${modoEdicao ? '(Opcional)' : ''}</label>
                            <label for="addImagem" style="display: flex; align-items: center; justify-content: center; gap: 10px; padding: 12px; background: #f4f4f4; border: 2px dashed #ddd; border-radius: 8px; cursor: pointer; color: #666; font-size: 0.85rem;">
                                <img src="imagens/menu/menu-adicionar.png" style="width: 20px; opacity: 0.5;">
                                <span id="labelNomeArquivo">${modoEdicao ? 'Trocar imagem...' : 'Clique para fazer upload'}</span>
                                <input type="file" id="addImagem" accept="image/*" style="display: none;" onchange="document.getElementById('labelNomeArquivo').innerText = this.files[0].name">
                            </label>
                        </div>

                        <div style="margin-bottom: 15px;">
                            <label style="font-weight: bold; display: block; margin-bottom: 8px; font-size: 0.9rem;">Valor</label>
                            <div style="
                                display: flex; 
                                align-items: center; 
                                border: 1px solid #ddd; 
                                border-radius: 8px; 
                                background: white; 
                                height: 45px; 
                                padding: 0 12px;
                                overflow: hidden;
                            ">
                                <span style="
                                    font-weight: bold; 
                                    color: #333; 
                                    font-size: 0.9rem;
                                    margin-right: 4px;
                                    display: inline-block;
                                    line-height: 1; 
                                ">R$</span>
                                <input type="number" id="addValor" step="0.01" value="${modoEdicao ? produto.valor : ''}" placeholder="0,00" 
                                    style="
                                        flex: 1;
                                        border: none;
                                        outline: none;
                                        background: transparent;
                                        font-size: 0.9rem;
                                        height: 100%;
                                        margin: 0;
                                        padding: 0;
                                        appearance: textfield;
                                        -webkit-appearance: none;
                                        line-height: 1;
                                    ">
                            </div>
                        </div>

                        <div>
                            <label style="font-weight: bold; display: block; margin-bottom: 8px; font-size: 0.9rem;">Categoria</label>
                            <select id="addTipo" style="
                                    width: 100%; 
                                    padding: 12px; 
                                    padding-right: 35px;
                                    border-radius: 8px; 
                                    border: 1px solid #ddd; 
                                    background: white; 
                                    outline: none;
                                    appearance: none;
                                    -webkit-appearance: none;
                                    background-image: url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E');
                                    background-repeat: no-repeat;
                                    background-position: right 12px top 50%;
                                    background-size: 12px auto;
                                ">
                                <option value="" disabled ${!modoEdicao ? 'selected' : ''}>Selecione</option>
                                <option value="Carregador" ${modoEdicao && produto.tipo === 'Carregador' ? 'selected' : ''}>Carregador</option>
                                <option value="Smartwatch" ${modoEdicao && produto.tipo === 'Smartwatch' ? 'selected' : ''}>Smartwatch</option>
                                <option value="Fone de Ouvido" ${modoEdicao && produto.tipo === 'Fone de Ouvido' ? 'selected' : ''}>Fone de Ouvido</option>
                                <option value="Cabo" ${modoEdicao && produto.tipo === 'Cabo' ? 'selected' : ''}>Cabo</option>
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
                    ${modoEdicao ? 'Alterar produto' : 'Salvar produto'}
                </button>
            </form>
        </div>

        <div id="modalSeletorCores" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.6); z-index: 9999; align-items: center; justify-content: center;">
            <div style="background: white; padding: 25px; border-radius: 15px; max-width: 400px; width: 90%; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
                <h3 style="margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px;">Cor para Estoque <span id="labelEstoqueAlvo"></span></h3>
                <div id="lista-opcoes-cores" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; max-height: 300px; overflow-y: auto;"></div>
                <button type="button" onclick="document.getElementById('modalSeletorCores').style.display='none'" style="margin-top: 20px; width: 100%; padding: 10px; border: none; border-radius: 8px; background: #eee; cursor: pointer;">Cancelar</button>
            </div>
        </div>
    `;

    // Lógica para preencher as cores existentes em caso de edição
    if (modoEdicao && produto.cor) {
        if (produto.cor["Estoque C"]) {
            estoqueAlvoAtual = 'C';
            Object.entries(produto.cor["Estoque C"]).forEach(([cor, qtd]) => {
                adicionarCorAoEstoque(cor, qtd);
            });
        }
        if (produto.cor["Estoque E"]) {
            estoqueAlvoAtual = 'E';
            Object.entries(produto.cor["Estoque E"]).forEach(([cor, qtd]) => {
                adicionarCorAoEstoque(cor, qtd);
            });
        }
    }
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

function adicionarCorAoEstoque(cor, quantidade = 0) {
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
            justify-content: space-between; 
            gap: 5px; 
            background: #f9f9f9; 
            padding: 6px 10px; 
            border-radius: 8px; 
            border: 1px solid #eee; 
            animation: scaleIn 0.2s ease;
            width: 100%; 
            box-sizing: border-box;
        ">
            <div style="display: flex; align-items: center; gap: 6px; overflow: hidden;">
                <span style="width: 12px; height: 12px; border-radius: 50%; background: ${obterHexDaCor(cor)}; border: 1px solid #ccc; flex-shrink: 0;"></span>
                <span style="font-size: 0.7rem; text-transform: capitalize; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${cor}</span>
            </div>
            
            <div style="display: flex; align-items: center; gap: 4px; flex-shrink: 0;">
                <input type="number" value="${quantidade}" min="0" data-estoque="Estoque ${estoqueAlvoAtual}" data-cor="${cor}" 
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

async function salvarNovoProduto() {
    const btn = document.getElementById('btn-salvar-produto');
    const form = document.getElementById('formAdicionar');
    const idEdicao = form.getAttribute('data-id-edicao');
    const modoEdicao = idEdicao !== ""; 

    const nome = document.getElementById('addNome').value.trim();
    const valorRaw = document.getElementById('addValor').value;
    const valor = parseFloat(valorRaw);
    const tipo = document.getElementById('addTipo').value;
    const imagemFile = document.getElementById('addImagem').files[0];

    // --- VALIDAÇÕES EM ORDEM (CIMA PARA BAIXO) ---
    
    // 1. Nome
    if (!nome) {
        mostrarAlerta("Digite um nome para o produto!", "erro");
        return;
    }

    // 2. Imagem (Obrigatória apenas no cadastro)
    if (!modoEdicao && !imagemFile) {
        mostrarAlerta("Selecione uma imagem do produto!", "erro");
        return;
    }

    // 3. Valor
    if (!valorRaw || isNaN(valor) || valor <= 0) {
        mostrarAlerta("Digite o valor do produto!", "erro");
        return;
    }

    // 4. Categoria
    if (!tipo) {
        mostrarAlerta("Escolha a categoria do produto!", "erro");
        return;
    }

    // --- FIM DAS VALIDAÇÕES ---

    btn.disabled = true;
    btn.innerText = "Salvando...";

    try {
        let urlImagem = "";
        
        // Upload da imagem para a pasta 'fotos-produtos'
        if (imagemFile) {
            const nomeArquivo = `${Date.now()}_${imagemFile.name}`;
            const { data: uploadData, error: uploadError } = await _supabase.storage
                .from('fotos-produtos') // Nome da pasta atualizado
                .upload(nomeArquivo, imagemFile);

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = _supabase.storage
                .from('fotos-produtos')
                .getPublicUrl(nomeArquivo);
            
            urlImagem = publicUrlData.publicUrl;
        }

        const coresC = {};
        const ordemC = []; // <-- ADICIONADO PARA ORDEM
        document.querySelectorAll('#container-cores-C input').forEach(input => {
            const cor = input.dataset.cor;
            coresC[cor] = parseInt(input.value) || 0;
            ordemC.push(cor); // <-- ADICIONADO PARA ORDEM
        });

        const coresE = {};
        const ordemE = []; // <-- ADICIONADO PARA ORDEM
        document.querySelectorAll('#container-cores-E input').forEach(input => {
            const cor = input.dataset.cor;
            coresE[cor] = parseInt(input.value) || 0;
            ordemE.push(cor); // <-- ADICIONADO PARA ORDEM
        });

        const dadosProduto = {
            nome,
            valor,
            tipo,
            cor: {
                "Estoque C": coresC,
                "Estoque E": coresE,
                "ordemC": ordemC, // <-- SALVANDO A ORDEM
                "ordemE": ordemE  // <-- SALVANDO A ORDEM
            }
        };

        if (urlImagem) {
            dadosProduto.imagem_url = urlImagem;
        }

        if (modoEdicao) {
            const { error } = await _supabase
                .from('produtos')
                .update(dadosProduto)
                .eq('id', idEdicao);
            
            if (error) throw error;
            
            mostrarAlerta("Produto alterado com sucesso!", "sucesso");
        } else {
            if (!urlImagem) dadosProduto.imagem_url = ""; 
            
            const { error } = await _supabase
                .from('produtos')
                .insert([dadosProduto]);
            
            if (error) throw error;

            mostrarAlerta("Produto cadastrado com sucesso!", "sucesso");
        }

        setTimeout(() => {
            mostrarEstoque();
        }, 1500);

    } catch (error) {
        console.error("Erro ao salvar:", error);
        mostrarAlerta("Erro ao salvar produto: " + error.message, "erro");
    } finally {
        btn.disabled = false;
        btn.innerText = modoEdicao ? "Alterar produto" : "Salvar produto";
    }
}

function mostrarAlerta(mensagem, tipo = 'sucesso') {
    const toast = document.createElement('div');
    // Usa toast-sucesso ou toast-erro conforme o que passarmos
    toast.className = `toast-${tipo} toast-hidden`;
    toast.innerHTML = `<span>${mensagem}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => toast.classList.remove('toast-hidden'), 10);

    setTimeout(() => {
        toast.classList.add('toast-hidden');
        setTimeout(() => toast.remove(), 500);
    }, 3000);
}

async function exibirBuscaAlterar() {
    const mainContent = document.getElementById('main-content');
    
    mainContent.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; width: 100%; animation: fadeIn 0.3s ease;">
            <div style="text-align: center; width: 100%; max-width: 600px;">
                <h1 style="margin-bottom: 10px;">Alterar produto</h1>
                <p style="margin-bottom: 30px; color: #666;">Selecione o produto abaixo para prosseguir</p>
                
                <div class="container-busca-alterar">
                    <div class="wrapper-input-select">
                        <input type="text" id="inputBuscaAlterar" 
                               placeholder="Pesquise..." 
                               autocomplete="off" 
                               oninput="filtrarSugestoesAlterar()"
                               onclick="mostrarTodasSugestoes()"
                        >
                        <img src="data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E" 
                             class="seta-busca-alterar" 
                             onclick="toggleListaAlterar(event)">
                        
                        <div id="listaSugestoes"></div>
                    </div>
                    <button id="btnProsseguirAlterar" class="btn-prosseguir" disabled onclick="prosseguirParaEdicao()">Prosseguir</button>
                </div>
            </div>
        </div>
    `;

    // Busca produtos por ordem de inserção (id crescente no Supabase geralmente reflete isso)
    const { data: produtos } = await _supabase
        .from('produtos')
        .select('nome, id')
        .order('updated_at', { ascending: false });
        
    window.listaProdutosCache = produtos || [];
}

function filtrarSugestoesAlterar() {
    const input = document.getElementById('inputBuscaAlterar');
    const lista = document.getElementById('listaSugestoes');
    const btn = document.getElementById('btnProsseguirAlterar');
    const termo = input.value.toLowerCase().trim();
    
    // Reseta o botão sempre que digitar
    btn.disabled = true;

    if (termo === "") {
        lista.style.display = "none";
        return;
    }

    // Lógica: Alguma palavra do nome deve COMEÇAR com o termo
    const filtrados = window.listaProdutosCache.filter(p => {
        const palavras = p.nome.toLowerCase().split(" ");
        return palavras.some(palavra => palavra.startsWith(termo));
    });

    if (filtrados.length > 0) {
        lista.innerHTML = filtrados.map(p => `
            <div class="sugestao-item" onclick="selecionarProdutoAlterar('${p.nome}', '${p.id}')">
                ${p.nome}
            </div>
        `).join('');
        lista.style.display = "block";
    } else {
        lista.style.display = "none";
    }
}

function selecionarProdutoAlterar(nome, id) {
    const input = document.getElementById('inputBuscaAlterar');
    const lista = document.getElementById('listaSugestoes');
    const btn = document.getElementById('btnProsseguirAlterar');
    
    input.value = nome;
    input.dataset.idSelecionado = id; // Guarda o ID para o próximo passo
    lista.style.display = "none";
    btn.disabled = false; // Libera o botão
}

function prosseguirParaEdicao() {
    const id = document.getElementById('inputBuscaAlterar').dataset.idSelecionado;
    alert("Iniciando edição do produto ID: " + id);
    // Aqui no futuro chamaremos a função de montar o formulário com dados preenchidos
}

function mostrarTodasSugestoes() {
    const lista = document.getElementById('listaSugestoes');
    if (window.listaProdutosCache && window.listaProdutosCache.length > 0) {
        renderizarListaFiltrada(window.listaProdutosCache);
        lista.style.display = "block";
    }
}

function toggleListaAlterar(event) {
    event.stopPropagation(); // Impede fechar imediatamente
    const lista = document.getElementById('listaSugestoes');
    if (lista.style.display === "block") {
        lista.style.display = "none";
    } else {
        mostrarTodasSugestoes();
    }
}

function filtrarSugestoesAlterar() {
    const input = document.getElementById('inputBuscaAlterar');
    const lista = document.getElementById('listaSugestoes');
    const btn = document.getElementById('btnProsseguirAlterar');
    const termo = input.value.toLowerCase().trim();
    
    btn.disabled = true;

    if (termo === "") {
        renderizarListaFiltrada(window.listaProdutosCache);
        return;
    }

    const filtrados = window.listaProdutosCache.filter(p => {
        const palavras = p.nome.toLowerCase().split(" ");
        return palavras.some(palavra => palavra.startsWith(termo));
    });

    if (filtrados.length > 0) {
        renderizarListaFiltrada(filtrados);
        lista.style.display = "block";
    } else {
        lista.style.display = "none";
    }
}

// Função auxiliar para renderizar o HTML da lista
function renderizarListaFiltrada(dados) {
    const lista = document.getElementById('listaSugestoes');
    lista.innerHTML = dados.map(p => `
        <div class="sugestao-item" onclick="selecionarProdutoAlterar('${p.nome}', '${p.id}')">
            ${p.nome}
        </div>
    `).join('');
}

// Fecha a lista se clicar fora do campo de busca
document.addEventListener('click', (e) => {
    const container = document.querySelector('.wrapper-input-select');
    const lista = document.getElementById('listaSugestoes');
    if (lista && !container.contains(e.target)) {
        lista.style.display = 'none';
    }
});

async function prosseguirParaEdicao() {
    const id = document.getElementById('inputBuscaAlterar').dataset.idSelecionado;
    if (!id) return;

    const btn = document.getElementById('btnProsseguirAlterar');
    btn.disabled = true;
    btn.innerText = "Carregando...";

    try {
        const { data: produto, error } = await _supabase
            .from('produtos')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        // Aqui chamamos a sua função original, mas passando os dados do banco
        exibirFormularioAdicionar(produto);
    } catch (error) {
        console.error("Erro ao buscar produto:", error);
        mostrarAlerta("Erro ao carregar dados do produto", "erro");
    } finally {
        btn.disabled = false;
        btn.innerText = "Prosseguir";
    }
}