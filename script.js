const SUPABASE_URL = 'https://rwwcmgzfurktgtktncix.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ3d2NtZ3pmdXJrdGd0a3RuY2l4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQyOTQ2MTIsImV4cCI6MjA4OTg3MDYxMn0.AjzquOt6-BoJ6Um3Uqh9qY0xfths1lg2jOK_eKWuYeE';
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
let filtroTipoAtivo = ""; // Guarda o tipo selecionado pelo usuário

// Configuração centralizada de cores
const MAPA_CORES = {
    "preto": "#000000",
    "branco": "#ffffff",
    "rosa": "#ff69b4",
    "azul": "#0047ab",
    "ciano": "#00ffff",
    "vermelho": "#ff0000",
    "verde": "#039e03ff",
    "amarelo": "#ffdf00",
    "laranja": "#ff9100ff",
    "bege": "#f5f5dc",
    "cinza": "#808080",
    "roxo": "#800080",
    "colorido": "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)",
    "transparente": "repeating-conic-gradient(#ffffff 0% 25%, #bbbbbb 0% 50%) 50% / 6px 6px"
};

const Marcas = [
    "Baseus",
    "Ugreen",
    "Vention",
    "Essager",
    "Toocki",
    "Logitech",
    "Lenovo",
    "Elgin",
    "Multi",
    //"Fortrek",
];

function obterSeloMarca(nomeProduto, semEstoque = false) {
    if (!nomeProduto) return '';
    const marcaEncontrada = Marcas.find(marca => {
        const regex = new RegExp(`(^|\\s)${marca}(\\s|$)`, 'i');
        return regex.test(nomeProduto);
    });
    if (!marcaEncontrada) return '';
    const estiloCinza = semEstoque ? 'filter: grayscale(100%);' : '';
    return `
        <div style="position: absolute; top: 0; left: 8px; right: 0; z-index: 10; overflow: hidden;">
            <img src="imagens/marcas/${marcaEncontrada}.png" alt="${marcaEncontrada}" style="width: 40%; display: block; border-radius: 0 0 10px 10px; ${estiloCinza}">
        </div>
    `;
}

async function mostrarEstoque() {
    resetarFiltrosEstoque();
    const mainContent = document.getElementById('main-content');

    mainContent.innerHTML = `
        <div class="loader-container">
            <div class="loader"></div>
        </div>
    `;

    const { data: produtos, error } = await _supabase
        .from('produtos')
        .select('*')
        .order('updated_at', { ascending: false });

    if (error) {
        mainContent.innerHTML = '<p>Erro ao carregar: ' + error.message + '</p>';
        return;
    }

    produtos.sort((a, b) => {
    const totalA = a.variacoes?.variacoes ? a.variacoes.variacoes.reduce((s, v) => s + (parseInt(v.quantidade) || 0), 0) : 0;
    const totalB = b.variacoes?.variacoes ? b.variacoes.variacoes.reduce((s, v) => s + (parseInt(v.quantidade) || 0), 0) : 0;
    if (totalA === 0 && totalB > 0) return 1;
    if (totalA > 0 && totalB === 0) return -1;
    return 0;
    });

let html = `
    <h1 style="text-align: center; width: 100%; margin-bottom: 30px;">Estoque</h1>
    <div class="busca-container">
        <div class="busca-wrapper">
            <input type="text" id="inputBusca" placeholder="Pesquisar produto..." onkeyup="filtrarProdutos()">
            
            <div style="
                position: absolute; 
                right: 15px; 
                top: 50%; 
                transform: translateY(-50%); 
                display: flex; 
                gap: 12px; 
                align-items: center;
                border-left: 1px solid #e0e0e0;
                padding-left: 12px;
                height: 25px;
            ">
                <img src="imagens/categoria.png" title="Categorias" style="width: 20px; cursor: pointer;" onclick="toggleMenuFiltro()">
                <img src="imagens/filtro.png" title="Filtros de Estoque" style="width: 20px; cursor: pointer;" onclick="toggleMenuEstoque()">
            </div>

            <div id="menuFiltro" class="menu-filtro"></div>
            <div id="menuEstoque" class="menu-filtro"></div>
        </div>
    </div>
    <div class="grid-produtos" id="gridProdutos">
`;
let divisorInserido = false;

    produtos.forEach(item => {
        const precoFormatado = item.valor 
            ? Number(item.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }).replace(/\s/g, '') 
            : 'R$0,00';

const preco = precoFormatado.replace('R$', '<span style="font-size: 0.7em; margin-right: 2px;">R$</span>');

        const variacoesJson = item.variacoes 
            ? encodeURIComponent(JSON.stringify(item.variacoes)) 
            : '';

const estoqueTotal = item.variacoes?.variacoes
    ? item.variacoes.variacoes.reduce((soma, v) => soma + (parseInt(v.quantidade) || 0), 0)
    : 0;

        const seloMarcaHtml = obterSeloMarca(item.nome, estoqueTotal === 0);

if (estoqueTotal === 0 && !divisorInserido) {
    html += `
        <div id="divisorSemEstoque" style="display: contents;">
            <h3 style="grid-column: 1 / -1; color: #999; font-size: 0.95rem; font-weight: 600; margin: 10px 0 -20px 0;">Sem estoque</h3>
            <div style="grid-column: 1 / -1; height: 1px; background-color: #eee; margin: 10px 0;"></div>
        </div>
    `;
    divisorInserido = true;
}

        html += `
            <div class="card-container ${estoqueTotal === 0 ? 'sem-estoque' : ''}" data-tipo="${item.tipo || ''}" data-estoque-total="${estoqueTotal}"
                data-variacoes="${variacoesJson.replace(/"/g, '&quot;')}"
data-nome="${item.nome.replace(/"/g, '&quot;')}"
onclick="abrirModalVariacoes(this.dataset.variacoes, this.dataset.nome)"
onmouseenter="this.style.transform='translateY(-4px)'; this.style.boxShadow='0 8px 24px rgba(0,71,171,0.15)'"
                onmouseleave="this.style.transform='translateY(0)'; this.style.boxShadow=''"
                style="
                    cursor: pointer;
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                    perspective: none;
                    border-radius: 16px;
                ">
                <div class="card-body" style="
                    transform: none;
                    transform-style: flat;
                    transition: none;
                    border-radius: 16px;
                ">
                    <div class="card-front" style="position: relative; backface-visibility: visible; border-radius: 16px; overflow: hidden;">
                        ${seloMarcaHtml}
                        <div class="foto-quadrada">
                            <img src="${item.imagem_url || 'imagens/placeholder.png'}" alt="${item.nome}">
                        </div>
                        <div class="info-produto" style="padding: 15px; display: flex; flex-direction: column;">
                            
<h3 class="nome-produto" style="font-size: 0.9rem; color: ${estoqueTotal === 0 ? '#999' : '#0047ab'}; line-height: 1.2rem; height: 2.4rem; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;">
                                ${item.nome}
                            </h3>

                            <div style="width: 100%; height: 1px; background-color: #eee; margin: -2px 0 8px 0;"></div>
                        
                            <div style="display: flex; align-items: center; justify-content: flex-start; gap: 4px;">
<img src="imagens/dinheiro.png" class="icone-estoque-p" style="${estoqueTotal === 0 ? 'filter: grayscale(100%); opacity: 0.5;' : ''}">
                                <span class="numero-estoque" style="margin-left: 4px;">${preco}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });

    html += '</div>';
    mainContent.innerHTML = html;
    carregarTiposFiltro(produtos);
}

function abrirModalVariacoes(variacoesEncoded, nomeProduto) {
    const dados = variacoesEncoded ? JSON.parse(decodeURIComponent(variacoesEncoded)) : null;

    if (!document.getElementById('_modalAnim')) {
        const style = document.createElement('style');
        style.id = '_modalAnim';
        style.textContent = `
            @keyframes modalEntrada {
                from { opacity: 0; transform: scale(0.88) translateY(12px); }
                to   { opacity: 1; transform: scale(1)    translateY(0); }
            }
            @keyframes overlayEntrada {
                from { background: rgba(0,0,0,0); }
                to   { background: rgba(0,0,0,0.5); }
            }
        `;
        document.head.appendChild(style);
    }

    const modal = document.createElement('div');
    modal.id = 'modalVariacoesEstoque';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.5); z-index: 9999;
        display: flex; align-items: center; justify-content: center;
        padding: 20px; box-sizing: border-box;
        animation: overlayEntrada 0.2s ease both;
    `;

    let conteudo = '';

    if (!dados || !dados.eixos || !dados.variacoes || dados.variacoes.length === 0) {
        conteudo = `<p style="color: #999; text-align: center; padding: 20px;">Sem variações cadastradas.</p>`;
    } else {
        const { eixos, variacoes } = dados;

        const slots = [...eixos];
        while (slots.length < 3) slots.push(null);

        const linhas = variacoes.map((v, i) => {
            const celulas = slots.map(eixo => {
                if (!eixo) {
                    return `<div style="flex: 1;"></div>`;
                }

                const icone = `imagens/variacoes/${eixo}.png`;
                let valor = '';

                if (eixo === 'cor') {
                    if (v.cor) {
                        const hex = obterHexDaCor(v.cor);
                        valor = `<span style="
                            width: 16px; height: 16px; border-radius: 50%;
                            background: ${hex}; display: inline-block;
                            border: 1px solid #ccc; flex-shrink: 0;
                        "></span>`;
                    }
                } else {
                    valor = `<span style="font-size: 0.85rem; color: #333;">${v[eixo] ?? 0}</span>`;
                }

                return `
                    <div style="display: flex; align-items: center; gap: 6px; flex: 1;">
                        <img src="${icone}" style="width: 18px; height: 18px; object-fit: contain; flex-shrink: 0;">
                        ${valor}
                    </div>
                `;
            });

            const idLinha = `linha-var-${i}`;
            const qtd = v.quantidade ?? 0;

            return `
                <div id="${idLinha}" style="
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    padding: 10px 14px;
                    background: #f9f9f9;
                    border-radius: 8px;
                    border: 1px solid #eee;
                    cursor: pointer;
                    transition: border-color 0.2s ease;
                " onclick="toggleEstoqueLinha('${idLinha}', ${qtd})"
                   onmouseenter="if(this.dataset.aberta !== 'true') this.style.borderColor='#0047ab'"
                   onmouseleave="if(this.dataset.aberta !== 'true') this.style.borderColor='#eee'">
                    ${celulas.join('')}
                    <div style="display: flex; gap: 4px; align-items: center; flex-shrink: 0;">
                        <span style="width: 7px; height: 7px; border-radius: 50%; background: #0047ab;"></span>
                        <span style="width: 7px; height: 7px; border-radius: 50%; background: #ccc;"></span>
                    </div>
                </div>
            `;
        });

        conteudo = `
            <div style="display: flex; flex-direction: column; gap: 8px;">
                ${linhas.join('')}
            </div>
        `;
    }

    modal.innerHTML = `
        <div style="
            background: white;
            border-radius: 16px;
            max-width: 560px;
            width: 100%;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            animation: modalEntrada 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        ">
            <div style="
                padding: 18px 20px;
                border-bottom: 1px solid #eee;
                display: flex; align-items: center; justify-content: space-between;
                gap: 12px;
            ">
                <div style="flex: 1; min-width: 0; overflow: hidden;">
                    <h3 style="
                        margin: 0;
                        font-size: 1rem;
                        color: var(--accent-color);
                        white-space: nowrap;
                        overflow: hidden;
                        text-overflow: ellipsis;
                    ">${nomeProduto}</h3>
                </div>
                <button onclick="document.getElementById('modalVariacoesEstoque').remove()" style="
                    background: none; border: none; font-size: 1.3rem;
                    cursor: pointer; color: #999; line-height: 1;
                    flex-shrink: 0;
                ">&times;</button>
            </div>
            <div style="padding: 16px 20px; max-height: 65vh; overflow-y: auto;">
                ${conteudo}
            </div>
        </div>
    `;

    modal.addEventListener('click', e => {
        if (e.target === modal) modal.remove();
    });

    document.body.appendChild(modal);
}

function toggleEstoqueLinha(idLinha, quantidade) {
    const linha = document.getElementById(idLinha);
    if (!linha) return;

    const jaAberta = linha.dataset.aberta === 'true';

    const indicadorFrente = `
        <div style="display: flex; gap: 4px; align-items: center; flex-shrink: 0;">
            <span style="width: 7px; height: 7px; border-radius: 50%; background: #0047ab;"></span>
            <span style="width: 7px; height: 7px; border-radius: 50%; background: #ccc;"></span>
        </div>
    `;

    const indicadorVerso = `
        <div style="display: flex; gap: 4px; align-items: center; flex-shrink: 0;">
            <span style="width: 7px; height: 7px; border-radius: 50%; background: #ccc;"></span>
            <span style="width: 7px; height: 7px; border-radius: 50%; background: #0047ab;"></span>
        </div>
    `;

    // Fecha qualquer outra linha que esteja virada
    document.querySelectorAll('[id^="linha-var-"]').forEach(outraLinha => {
        if (outraLinha.id !== idLinha && outraLinha.dataset.aberta === 'true') {
            outraLinha.style.opacity = '0';
            outraLinha.style.transform = 'scaleY(0.85)';
            setTimeout(() => {
                outraLinha.innerHTML = outraLinha.dataset.conteudoOriginal + indicadorFrente;
                outraLinha.style.borderColor = outraLinha.matches(':hover') ? '#0047ab' : '#eee';
                outraLinha.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
                outraLinha.style.opacity = '1';
                outraLinha.style.transform = 'scaleY(1)';
                outraLinha.dataset.aberta = 'false';
            }, 150);
        }
    });

    if (jaAberta) {
        linha.style.opacity = '0';
        linha.style.transform = 'scaleY(0.85)';
        setTimeout(() => {
            linha.innerHTML = linha.dataset.conteudoOriginal + indicadorFrente;
            linha.style.borderColor = linha.matches(':hover') ? '#0047ab' : '#eee';
            linha.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
            linha.style.opacity = '1';
            linha.style.transform = 'scaleY(1)';
            linha.dataset.aberta = 'false';
        }, 150);
    } else {
        const clone = linha.cloneNode(true);
        const indicadorAtual = clone.querySelector('div:last-child');
        if (indicadorAtual) indicadorAtual.remove();
        linha.dataset.conteudoOriginal = clone.innerHTML;

        linha.style.transition = 'opacity 0.15s ease, transform 0.15s ease';
        linha.style.opacity = '0';
        linha.style.transform = 'scaleY(0.85)';
        setTimeout(() => {
            linha.dataset.aberta = 'true';
linha.innerHTML = `
    <div style="position: relative; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;">
        <img src="imagens/variacoes/quantidade.png" style="width: 18px; height: 18px; object-fit: contain; ${quantidade === 0 ? 'filter: brightness(0) saturate(100%) invert(15%) sepia(95%) saturate(6932%) hue-rotate(358deg) brightness(95%) contrast(112%);' : ''}">
        <span style="font-size: 0.85rem; color: #333;">${quantidade}</span>
        <div style="position: absolute; right: 0; display: flex; gap: 4px; align-items: center;">
            <span style="width: 7px; height: 7px; border-radius: 50%; background: #ccc;"></span>
            <span style="width: 7px; height: 7px; border-radius: 50%; background: #0047ab;"></span>
        </div>
    </div>
`;
            linha.style.borderColor = '#0047ab';
            linha.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
            linha.style.opacity = '1';
            linha.style.transform = 'scaleY(1)';
        }, 150);
    }
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

document.addEventListener('click', function(event) {
    if (event.target.closest('.card-container')) return;
    document.querySelectorAll('.card-container.girado').forEach(carta => {
        carta.classList.remove('girado');
    });
});

function filtrarProdutos() {
    const termoBusca = document.getElementById('inputBusca').value.toLowerCase();
    const grid = document.getElementById('gridProdutos');
    const cards = Array.from(document.querySelectorAll('.card-container'));
    
    // 1. Termos que o usuário digitou
    const termosBusca = termoBusca.split(" ").filter(t => t.trim() !== "");
    
    let encontrouAlgum = false;
    let temSemEstoqueVisivel = false;

    cards.forEach(card => {
        const nomeProduto = card.querySelector('.nome-produto').innerText.toLowerCase();
        const tipoProduto = (card.getAttribute('data-tipo') || "").toLowerCase();
        const qtdEstoque = parseInt(card.getAttribute('data-estoque-total')) || 0;

        // --- LÓGICA ANTI-REPETIÇÃO ---
        const palavrasNome = nomeProduto.split(" ").filter(p => p.trim() !== "");
        
        // Criamos uma cópia das palavras do nome para podermos "riscar" as que já foram usadas
        let palavrasDisponiveis = [...palavrasNome];

        const bateNome = termosBusca.every(termo => {
            // Procuramos o índice de uma palavra que comece com o termo
            const index = palavrasDisponiveis.findIndex(p => p.startsWith(termo));
            
            if (index !== -1) {
                // Se achou, removemos essa palavra da lista de disponíveis para ela não ser usada de novo
                palavrasDisponiveis.splice(index, 1);
                return true;
            }
            return false;
        });

        // 2. Filtro de Categoria
        const bateTipo = filtroTipoAtivo === "" || tipoProduto === filtroTipoAtivo.toLowerCase();

        // 3. Filtro de Status de Estoque
        let bateEstoque = true;
        if (filtroEstoqueAtivo === "Sem estoque") {
            bateEstoque = (qtdEstoque === 0);
        } else if (filtroEstoqueAtivo === "Acabando") {
            bateEstoque = (qtdEstoque > 0 && qtdEstoque <= 3);
        }

        if (bateNome && bateTipo && bateEstoque) {
                    card.style.display = "block";
                    encontrouAlgum = true;
                    if (qtdEstoque === 0) {
                        temSemEstoqueVisivel = true;
                    }
                } else {
                    card.style.display = "none";
                }
            });

    // Lógica de "Sem resultados"
    const mensagemAntiga = document.getElementById('msg-sem-resultado');
    if (mensagemAntiga) mensagemAntiga.remove();

    if (!encontrouAlgum) {
        const msg = document.createElement('div');
        msg.id = 'msg-sem-resultado';
        msg.innerHTML = "Sem resultados";
        msg.style.cssText = "grid-column: 1 / -1; text-align: center; padding: 50px; color: #666; font-size: 1.1rem;";
        grid.appendChild(msg);
    }


const divisor = document.getElementById('divisorSemEstoque');
    if (divisor) {
        const filtroEstoqueOk = (filtroEstoqueAtivo === "" || filtroEstoqueAtivo === "Todos");
        divisor.style.display = (filtroEstoqueOk && temSemEstoqueVisivel) ? "contents" : "none";
    }

    // Ordenação Especial para "Acabando"
    if (filtroEstoqueAtivo === "Acabando") {
        const cardsOrdenados = [...cards].sort((a, b) => {
            const qtdA = parseInt(a.getAttribute('data-estoque-total')) || 0;
            const qtdB = parseInt(b.getAttribute('data-estoque-total')) || 0;
            return qtdA - qtdB;
        });
        cardsOrdenados.forEach((card, index) => {
            card.style.order = index;
        });
    } else {
        cards.forEach(card => {
            card.style.order = "";
        });
    }
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
            <h1 style="margin-bottom: 5px; font-size: clamp(1.6rem, 6vw, 2rem); text-align: center; width: 100%;">O que deseja fazer?</h1>
            
            <div style="
                display: flex; 
                /* No PC o gap é 50px, no Mobile ele diminui gradualmente para até 10px */
                gap: clamp(10px, 4vw, 50px); 
                flex-wrap: nowrap; 
                justify-content: center;
                width: 100%;
                max-width: 600px;
            ">
                <div class="opcao-alterar" style="text-align: center; cursor: pointer; flex: 1; max-width: 120px;" onclick="solicitarSenha('adicionar')">
                    <div style="aspect-ratio: 1/1; background: #f4f4f4; border-radius: 20px; display: flex; align-items: center; justify-content: center; border: 2px solid var(--accent-color); transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                        <img src="imagens/adicionar.png" style="width: 50%; height: 50%; object-fit: contain;">
                    </div>
                    <p style="margin-top: 15px; font-weight: bold; color: var(--text-color); font-size: clamp(0.8rem, 3vw, 1rem);">Adicionar</p>
                </div>

                <div class="opcao-alterar" style="text-align: center; cursor: pointer; flex: 1; max-width: 120px;" onclick="solicitarSenha('alterar')">
                    <div style="aspect-ratio: 1/1; background: #f4f4f4; border-radius: 20px; display: flex; align-items: center; justify-content: center; border: 2px solid var(--accent-color); transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                        <img src="imagens/alterar.png" style="width: 50%; height: 50%; object-fit: contain;">
                    </div>
                    <p style="margin-top: 15px; font-weight: bold; color: var(--text-color); font-size: clamp(0.8rem, 3vw, 1rem);">Alterar</p>
                </div>

                <div class="opcao-alterar" style="text-align: center; cursor: pointer; flex: 1; max-width: 120px;" onclick="solicitarSenha('apagar')">
                    <div style="aspect-ratio: 1/1; background: #f4f4f4; border-radius: 20px; display: flex; align-items: center; justify-content: center; border: 2px solid var(--accent-color); transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                        <img src="imagens/apagar.png" style="width: 50%; height: 50%; object-fit: contain;">
                    </div>
                    <p style="margin-top: 15px; font-weight: bold; color: var(--text-color); font-size: clamp(0.8rem, 3vw, 1rem);">Apagar</p>
                </div>

            </div>
        </div>
    `;
}










function exibirFormularioAdicionar(produto = null) {
    const mainContent = document.getElementById('main-content');
    const modoEdicao = produto !== null;
    const nomeSeguro = modoEdicao 
    ? produto.nome.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;")
    : '';

    mainContent.innerHTML = `
        <div style="max-width: 1000px; margin: 0 auto; animation: fadeIn 0.3s ease;">
            <h1 style="text-align: center; margin-bottom: 30px; font-size: 1.8rem; border-bottom: 2px solid #f4f4f4; padding-bottom: 10px; width: 100%;">
                ${modoEdicao ? 'Alterar produto' : 'Cadastrar produto'}
            </h1>

            <form id="formAdicionar" data-id-edicao="${modoEdicao ? produto.id : ''}" style="display: grid; grid-template-columns: 1fr 1.6fr; gap: 30px; align-items: start;">
                
                <div id="bloco-dados-produto">
                    <div style="background: white; padding: 25px; border-radius: 12px; border: 1px solid #eee; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
                        <div style="margin-bottom: 15px;">
                            <label style="font-weight: bold; display: block; margin-bottom: 8px; font-size: 0.9rem;">Nome</label>
                            <input type="text" id="addNome" value="${nomeSeguro}" placeholder="Ex: Smartwatch Ultra 9" style="width: 100%; padding: 12px; border-radius: 8px; border: 1px solid #ddd; outline: none;">
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
                                <option value="Smartwatches" ${modoEdicao && produto.tipo === 'Smartwatches' ? 'selected' : ''}>Smartwatches</option>
                                <option value="Fones" ${modoEdicao && produto.tipo === 'Fones' ? 'selected' : ''}>Fones</option>
                                <option value="Carregadores" ${modoEdicao && produto.tipo === 'Carregadores' ? 'selected' : ''}>Carregadores</option>
                                <option value="Cabos" ${modoEdicao && produto.tipo === 'Cabos' ? 'selected' : ''}>Cabos</option>
                                <option value="Adaptadores" ${modoEdicao && produto.tipo === 'Adaptadores' ? 'selected' : ''}>Adaptadores</option>
                                <option value="Suportes" ${modoEdicao && produto.tipo === 'Suportes' ? 'selected' : ''}>Suportes</option>
                                <option value="Mouses" ${modoEdicao && produto.tipo === 'Mouses' ? 'selected' : ''}>Mouses</option>
                                <option value="Teclados" ${modoEdicao && produto.tipo === 'Teclados' ? 'selected' : ''}>Teclados</option>
                                <option value="Setup" ${modoEdicao && produto.tipo === 'Setup' ? 'selected' : ''}>Setup</option>
                                <option value="Hardware" ${modoEdicao && produto.tipo === 'Hardware' ? 'selected' : ''}>Hardware</option>
                                <option value="Acessórios" ${modoEdicao && produto.tipo === 'Acessórios' ? 'selected' : ''}>Acessórios</option>
                                <option value="Eletroportáteis" ${modoEdicao && produto.tipo === 'Eletroportáteis' ? 'selected' : ''}>Eletroportáteis</option>
                                <option value="Casa" ${modoEdicao && produto.tipo === 'Casa' ? 'selected' : ''}>Casa</option>
                            </select>
                        </div>
                    </div>
                </div>

<div id="bloco-estoques-cores" style="display: flex; flex-direction: column; gap: 20px; min-width: 0;">
    <div style="background: white; border: 1px solid #eee; padding: 20px; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.02); width: 100%; box-sizing: border-box; min-width: 0;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px;">
    <h3 style="font-size: 0.9rem; color: var(--accent-color); font-weight: bold; margin: 0;">Estoque</h3>
    <img src="imagens/variacoes.png" onclick="abrirSeletorVariacao()" title="Variações" style="width: 22px; cursor: pointer;">
</div>
        <div id="container-variacoes" style="display: flex; flex-direction: column; gap: 6px; margin-bottom: 15px; overflow-x: auto; min-width: 0;"></div>
    </div>
</div>
                <button type="button" id="btn-salvar-produto" onclick="salvarNovoProduto()" 
                    style="padding: 20px; background: var(--accent-color); color: white; border: none; border-radius: 12px; font-weight: bold; cursor: pointer; font-size: 1rem; box-shadow: 0 4px 15px rgba(0, 71, 171, 0.2);">
                    ${modoEdicao ? 'Alterar produto' : 'Salvar produto'}
                </button>
            </form>
        </div>
    `;

    // Se for edição e o produto tiver variações salvas, pré-carrega elas
    if (modoEdicao && produto.variacoes && produto.variacoes.eixos && produto.variacoes.variacoes) {
        eixosSelecionados = [...produto.variacoes.eixos];
        renderizarBlocoVariacoes();
        preencherVariacoesEdicao(produto.variacoes.variacoes);
    }  else {
        // Cadastro de produto novo: garante que não sobrou seleção de uma sessão anterior
        eixosSelecionados = [];
    }
}

function preencherVariacoesEdicao(variacoes) {
    const linhas = document.querySelectorAll('.linha-combinacao');

    variacoes.forEach((v, i) => {
        // A primeira linha já é criada pelo renderizarBlocoVariacoes
        // As demais precisam ser adicionadas
        if (i > 0) adicionarLinhaCombinacao();

        const linhasAtuais = document.querySelectorAll('.linha-combinacao');
        const linha = linhasAtuais[i];
        if (!linha) return;

        eixosSelecionados.forEach(eixo => {
            if (eixo === 'cor') {
                const btn = linha.querySelector('[data-cor-selecionada]');
                if (btn && v.cor) {
                    const hex = obterHexDaCor(v.cor);
                    btn.dataset.corSelecionada = v.cor;
                    btn.innerHTML = `
                        <span style="
                            width: 18px; height: 18px; border-radius: 50%;
                            background: ${hex}; display: inline-block;
                            border: 1px solid #ccc;
                        "></span>
                    `;
                }
            } else {
                const input = linha.querySelector(`[data-eixo="${eixo}"]`);
                if (input && v[eixo]) input.value = v[eixo];
            }
        });

        const inputQtd = linha.querySelector('[data-eixo="quantidade"]');
        if (inputQtd) inputQtd.value = v.quantidade ?? 0;
    });
}

// ============================================================
// VARIÁVEIS GLOBAIS
// ============================================================
let eixosSelecionados = []; // ex: ["tipo", "cor", "tamanho"]

// ============================================================
// MODAL: ESCOLHER EIXOS DE VARIAÇÃO
// ============================================================
function abrirSeletorVariacao() {
    const eixosDisponiveis = ["tipo", "cor", "tamanho"];

    const naoSelecionados = eixosDisponiveis.filter(eixo => !eixosSelecionados.includes(eixo));
    const eixosOrdenados = [...eixosSelecionados, ...naoSelecionados];

    const modal = document.createElement('div');
    modal.id = 'modalSeletorVariacao';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.6); z-index: 9999;
        display: flex; align-items: center; justify-content: center;
    `;

    modal.innerHTML = `
        <div style="
            background: white; padding: 28px; border-radius: 16px;
            max-width: 420px; width: 90%; box-shadow: 0 10px 40px rgba(0,0,0,0.2);
        ">
            <h3 style="margin-bottom: 8px; font-size: 1.1rem; color: var(--accent-color);">Variações</h3>
            <p style="font-size: 0.85rem; color: #999; margin-bottom: 20px;">
                Selecione e arraste para definir a ordem
            </p>

                <div id="lista-eixos-drag" style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 24px;">
                ${eixosOrdenados.map(eixo => `
                    <div 
                        class="eixo-item"
                        data-eixo="${eixo}"
                        draggable="true"
                        onclick="toggleEixo(this)"
                        style="
                            display: flex; align-items: center; gap: 12px;
                            padding: 12px 16px; border-radius: 10px;
                            background: #f4f4f4; color: #999;
                            cursor: grab; user-select: none;
                            transition: all 0.2s; border: 2px solid transparent;
                            font-weight: 600; font-size: 0.95rem; text-transform: capitalize;
                        "
                    >
                        <span style="font-size: 1rem; opacity: 0.4;">⠿</span>
                        ${eixo}
                    </div>
                `).join('')}
            </div>

            <button onclick="concluirSeletorVariacao()" style="
                width: 100%; padding: 13px; background: var(--accent-color);
                color: white; border: none; border-radius: 10px;
                font-weight: bold; font-size: 1rem; cursor: pointer;
                transition: filter 0.2s;
            " onmouseover="this.style.filter='brightness(1.1)'" onmouseout="this.style.filter=''">
                Concluir
            </button>
        </div>
    `;

    document.body.appendChild(modal);

    // Marca os eixos já selecionados anteriormente
    eixosSelecionados.forEach(eixo => {
        const el = modal.querySelector(`[data-eixo="${eixo}"]`);
        if (el) ativarEixoVisual(el);
    });

    iniciarDragEixos();
}

function toggleEixo(el) {
    const eixo = el.dataset.eixo;
    if (el.classList.contains('eixo-ativo')) {
        desativarEixoVisual(el);
    } else {
        ativarEixoVisual(el);
    }
}

function ativarEixoVisual(el) {
    el.classList.add('eixo-ativo');
    el.style.background = '#f0f7ff';
    el.style.color = 'var(--accent-color)';
    el.style.borderColor = 'var(--accent-color)';
}

function desativarEixoVisual(el) {
    el.classList.remove('eixo-ativo');
    el.style.background = '#f4f4f4';
    el.style.color = '#999';
    el.style.borderColor = 'transparent';
}

function concluirSeletorVariacao() {
    const itens = document.querySelectorAll('#lista-eixos-drag .eixo-item');
    eixosSelecionados = [];
    itens.forEach(item => {
        if (item.classList.contains('eixo-ativo')) {
            eixosSelecionados.push(item.dataset.eixo);
        }
    });

    document.getElementById('modalSeletorVariacao').remove();
    renderizarBlocoVariacoes();
}

// ============================================================
// DRAG AND DROP DOS EIXOS
// ============================================================
function iniciarDragEixos() {
    const lista = document.getElementById('lista-eixos-drag');
    let dragging = null;

    lista.querySelectorAll('.eixo-item').forEach(item => {
        item.addEventListener('dragstart', () => {
            dragging = item;
            setTimeout(() => item.style.opacity = '0.4', 0);
        });
        item.addEventListener('dragend', () => {
            item.style.opacity = '1';
            dragging = null;
        });
        item.addEventListener('dragover', e => {
            e.preventDefault();
            if (dragging && dragging !== item) {
                const rect = item.getBoundingClientRect();
                const meio = rect.top + rect.height / 2;
                if (e.clientY < meio) {
                    lista.insertBefore(dragging, item);
                } else {
                    lista.insertBefore(dragging, item.nextSibling);
                }
            }
        });
    });
}

// ============================================================
// CAPTURAR DADOS DAS LINHAS EXISTENTES (antes de re-renderizar)
// ============================================================
function coletarDadosLinhasAtuais() {
    const linhas = document.querySelectorAll('.linha-combinacao');
    const dados = [];
    linhas.forEach(linha => {
        const entrada = {};
        linha.querySelectorAll('input[data-eixo]').forEach(input => {
            entrada[input.dataset.eixo] = input.value;
        });
        const btnCor = linha.querySelector('[data-cor-selecionada]');
        if (btnCor) {
            entrada._cor = btnCor.dataset.corSelecionada;
            entrada._corHtml = btnCor.innerHTML;
        }
        dados.push(entrada);
    });
    return dados;
}

// ============================================================
// RENDERIZAR BLOCO DE VARIAÇÕES NA TELA DO FORMULÁRIO
// ============================================================
function renderizarBlocoVariacoes() {
    const container = document.getElementById('container-variacoes');

    const dadosAnteriores = coletarDadosLinhasAtuais();

    container.innerHTML = '';

    if (eixosSelecionados.length === 0) return;

    const todosEixos = [...eixosSelecionados, 'quantidade'];
    const cabecalho = document.createElement('div');
    cabecalho.style.cssText = `display: flex; gap: 8px; align-items: center; width: 100%; margin-bottom: 4px;`;

    todosEixos.forEach(eixo => {
        const titulo = document.createElement('span');
        let flexVal = '';
        if (eixo === 'cor')             flexVal = 'flex: 0 0 42px;';
        else if (eixo === 'tamanho')    flexVal = 'flex: 0 0 120px;';
        else if (eixo === 'quantidade') flexVal = 'flex: 0 0 40px;';
        else                            flexVal = 'flex: 0 0 160px;';

        titulo.style.cssText = `
            font-size: 0.78rem; font-weight: bold; color: #555;
            text-transform: capitalize; min-width: 0; ${flexVal}
        `;
        titulo.innerText = eixo;
        cabecalho.appendChild(titulo);
    });

    container.appendChild(cabecalho);

    const btnAdicionar = document.createElement('button');
    btnAdicionar.type = 'button';
    btnAdicionar.id = 'btn-adicionar-combinacao';
    btnAdicionar.innerText = '+';
    btnAdicionar.style.cssText = `
        padding: 10px;
        border: 1px dashed var(--accent-color);
        background: #f0f7ff; color: var(--accent-color);
        border-radius: 8px; cursor: pointer;
        font-weight: normal; font-size: 1rem;
        margin-top: 6px;
    `;
    btnAdicionar.onclick = adicionarLinhaCombinacao;
    container.appendChild(btnAdicionar);

    if (dadosAnteriores.length > 0) {
        dadosAnteriores.forEach(dados => {
            adicionarLinhaCombinacao();
            const linhas = container.querySelectorAll('.linha-combinacao');
            const linha = linhas[linhas.length - 1];
            if (!linha) return;

            linha.querySelectorAll('input[data-eixo]').forEach(input => {
                if (dados[input.dataset.eixo] !== undefined) {
                    input.value = dados[input.dataset.eixo];
                }
            });

            const btnCor = linha.querySelector('[data-cor-selecionada]');
            if (btnCor && dados._cor) {
                btnCor.dataset.corSelecionada = dados._cor;
                btnCor.innerHTML = dados._corHtml;
            }
        });
    } else {
        adicionarLinhaCombinacao();
    }

    requestAnimationFrame(() => {
        const primeiraLinha = container.querySelector('.linha-combinacao');
        if (primeiraLinha) {
            btnAdicionar.style.width = primeiraLinha.scrollWidth + 'px';
        }
    });
}

// ============================================================
// LINHA DE COMBINAÇÃO
// ============================================================
function adicionarLinhaCombinacao() {
    const container = document.getElementById('container-variacoes');
    const btn = document.getElementById('btn-adicionar-combinacao');
    const linha = document.createElement('div');
    linha.className = 'linha-combinacao';
    linha.style.cssText = `display: flex; gap: 8px; align-items: center; width: 100%; margin-bottom: 6px;`;
    eixosSelecionados.forEach(eixo => {
        if (eixo === 'cor') {
            // Botão de cor (abre modal de cores)
            const btnCor = document.createElement('button');
            btnCor.type = 'button';
            btnCor.dataset.corSelecionada = '';
            btnCor.style.cssText = `
                flex: 0 0 42px; height: 36px;
                border: 1px dashed var(--accent-color);
                background: #f0f7ff; border-radius: 8px;
                cursor: pointer; display: flex;
                align-items: center; justify-content: center;
            `;
            btnCor.innerHTML = `<span style="font-size: 1rem; color: var(--accent-color);">+</span>`;
            btnCor.onclick = () => abrirModalCores(btnCor);
            linha.appendChild(btnCor);
        } else {
            // Input de texto (tipo ou tamanho)
            const input = document.createElement('input');
            input.type = 'text';
            input.dataset.eixo = eixo;
            input.placeholder = eixo === 'tipo' ? 'Ex: V8' : 'Ex: 2m';
            
            // Refletindo o aumento dramático para 120px
            input.style.cssText = `
                flex: ${eixo === 'tamanho' ? '0 0 120px' : '0 0 160px'}; height: 36px; min-width: 0;
                padding: 0 10px; border-radius: 8px;
                border: 1px solid #ddd; outline: none;
                font-size: 0.85rem;
            `;
            input.onfocus = () => input.style.borderColor = 'var(--accent-color)';
            input.onblur = () => input.style.borderColor = '#ddd';
            linha.appendChild(input);
        }
    });
    // Campo quantidade
    const inputQtd = document.createElement('input');
    inputQtd.type = 'number';
    inputQtd.min = '0';
    inputQtd.value = '0';
    inputQtd.dataset.eixo = 'quantidade';
    
    // Ajuste agressivo na largura e redução no padding para caber o número sem cortar
    inputQtd.style.cssText = `
        flex: 0 0 40px; height: 36px;
        padding: 0 4px; border-radius: 8px;
        border: 1px solid #ddd; outline: none;
        font-size: 0.85rem; text-align: center;
    `;
    inputQtd.onfocus = () => inputQtd.style.borderColor = 'var(--accent-color)';
    inputQtd.onblur = () => inputQtd.style.borderColor = '#ddd';
    linha.appendChild(inputQtd);

    // Ícone de lixeira para remover a linha
    const btnRemover = document.createElement('img');
    btnRemover.src = 'imagens/apagar.png';
    btnRemover.title = 'Remover variação';
    btnRemover.style.cssText = `
        flex: 0 0 22px; width: 22px; height: 22px;
        cursor: pointer;
        transition: filter 0.2s ease;
    `;
    btnRemover.onmouseover = () => {
        btnRemover.style.filter = 'brightness(0) saturate(100%) invert(15%) sepia(95%) saturate(6932%) hue-rotate(358deg) brightness(95%) contrast(112%)';
    };
    btnRemover.onmouseout = () => {
        btnRemover.style.filter = '';
    };
    btnRemover.onclick = () => linha.remove();
    linha.appendChild(btnRemover);

    // Insere a linha antes do botão "Adicionar combinação"
    container.insertBefore(linha, btn);
}

// ============================================================
// MODAL DE CORES
// ============================================================
function abrirModalCores(btnAlvo) {
    const modal = document.createElement('div');
    modal.id = 'modalCores';
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.6); z-index: 9999;
        display: flex; align-items: center; justify-content: center;
    `;

    modal.innerHTML = `
        <div style="background: white; padding: 25px; border-radius: 15px; max-width: 360px; width: 90%; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
            <h3 style="margin-bottom: 16px; border-bottom: 1px solid #eee; padding-bottom: 10px; color: var(--accent-color);">Escolha a cor</h3>
            
            <div style="
                display: grid; 
                grid-template-columns: repeat(3, 1fr); 
                gap: 10px; 
                max-height: 260px; 
                overflow-y: auto; 
                padding-right: 15px;
            ">
                ${Object.keys(MAPA_CORES).map(cor => `
                    <div onclick="selecionarCorNaLinha('${cor}', this)" style="
                        cursor: pointer; text-align: center;
                        padding: 10px 6px; border: 1px solid #eee;
                        border-radius: 8px; transition: all 0.2s;
                    " onmouseover="this.style.borderColor='var(--accent-color)'; this.style.background='#f0f7ff'"
                       onmouseout="this.style.borderColor='#eee'; this.style.background='white'">
                        <div style="
                            width: 22px; height: 22px; border-radius: 50%;
                            background: ${obterHexDaCor(cor)};
                            margin: 0 auto 5px; border: 1px solid #ccc;
                        "></div>
                        <span style="font-size: 0.7rem; text-transform: capitalize;">${cor}</span>
                    </div>
                `).join('')}
            </div>

            <button onclick="document.getElementById('modalCores').remove()" style="
                margin-top: 16px; width: 100%; padding: 10px;
                border: none; border-radius: 8px; background: #eee;
                cursor: pointer; font-weight: bold;
            ">Cancelar</button>
        </div>
    `;

    // Guarda referência ao botão que abriu o modal
    modal._btnAlvo = btnAlvo;
    document.body.appendChild(modal);
}

function selecionarCorNaLinha(cor, _el) {
    const modal = document.getElementById('modalCores');
    const btnAlvo = modal._btnAlvo;
    const hex = obterHexDaCor(cor);

    btnAlvo.dataset.corSelecionada = cor;
    btnAlvo.innerHTML = `
        <span style="
            width: 18px; height: 18px; border-radius: 50%;
            background: ${hex}; display: inline-block;
            border: 1px solid #ccc;
        "></span>
    `;

    modal.remove();
}

// ============================================================
// COLETAR DADOS DAS VARIAÇÕES (usado no salvarNovoProduto)
// ============================================================
function coletarVariacoes() {
    const linhas = document.querySelectorAll('.linha-combinacao');
    const combinacoes = [];

    linhas.forEach(linha => {
        const combinacao = {};

        eixosSelecionados.forEach(eixo => {
            if (eixo === 'cor') {
                const btn = linha.querySelector('[data-cor-selecionada]');
                combinacao.cor = btn ? btn.dataset.corSelecionada : '';
            } else {
                const input = linha.querySelector(`[data-eixo="${eixo}"]`);
                combinacao[eixo] = input ? input.value.trim() : '';
            }
        });

        const inputQtd = linha.querySelector('[data-eixo="quantidade"]');
        combinacao.qtd = inputQtd ? parseInt(inputQtd.value) || 0 : 0;
        combinacoes.push(combinacao);
    });

    return {
        eixos: [...eixosSelecionados],
        combinacoes
    };
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
        
        if (imagemFile) {
            const nomeArquivo = `${Date.now()}_${imagemFile.name}`;
            const { data: uploadData, error: uploadError } = await _supabase.storage
                .from('fotos-produtos') 
                .upload(nomeArquivo, imagemFile);

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = _supabase.storage
                .from('fotos-produtos')
                .getPublicUrl(nomeArquivo);
            
            urlImagem = publicUrlData.publicUrl;
        }

        // Coleta as variações do novo sistema
        const variacoes = [];
        document.querySelectorAll('.linha-combinacao').forEach(linha => {
            const variacao = {};

            eixosSelecionados.forEach(eixo => {
                if (eixo === 'cor') {
                    const btn = linha.querySelector('[data-cor-selecionada]');
                    variacao.cor = btn ? btn.dataset.corSelecionada : '';
                } else {
                    const input = linha.querySelector(`[data-eixo="${eixo}"]`);
                    variacao[eixo] = input ? input.value.trim() : '';
                }
            });

            const inputQtd = linha.querySelector('[data-eixo="quantidade"]');
            variacao.quantidade = inputQtd ? parseInt(inputQtd.value) || 0 : 0;
            variacoes.push(variacao);
        });

        const dadosProduto = {
            nome,
            valor,
            tipo,
            variacoes: {
                variacoes,
                eixos: [...eixosSelecionados]
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

        // --- REGISTRO DE ATIVIDADE ---
        await _supabase.from('registros').insert([{ nome_produto: nome }]);

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
                        <img src="data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%230047ab' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E" 
                             style="position: absolute; right: 18px; top: 50%; transform: translateY(-50%); width: 16px; cursor: pointer;" 
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
    
    // 1. Pegamos o valor bruto (sem o .trim() que impede a busca de 2 palavras)
    const valorBusca = input.value.toLowerCase();
    
    btn.disabled = true;

    // 2. Criamos os termos da busca (ex: ["carregador", "v8"])
    const termosBusca = valorBusca.split(" ").filter(t => t.trim() !== "");

    if (termosBusca.length === 0) {
        lista.style.display = "none";
        return;
    }

    // 3. A Lógica que funcionou no Estoque (Rigorosa)
    const filtrados = window.listaProdutosCache.filter(p => {
        const palavrasDoNome = p.nome.toLowerCase().split(" ").filter(pal => pal.trim() !== "");
        let palavrasDisponiveis = [...palavrasDoNome];

        // "Para cada termo digitado, existe uma palavra no nome começando com ele?"
        return termosBusca.every(termo => {
            const index = palavrasDisponiveis.findIndex(pNome => pNome.startsWith(termo));
            if (index !== -1) {
                palavrasDisponiveis.splice(index, 1); // "Rifa" a palavra para não repetir
                return true;
            }
            return false;
        });
    });

    // 4. Renderização (AJUSTADA PARA ACEITAR ASPAS)
    if (filtrados.length > 0) {
        lista.innerHTML = filtrados.map(p => {
            // Escapa aspas simples para o JS e aspas duplas para o atributo HTML
            const nomeSeguro = p.nome.replace(/'/g, "\\'").replace(/"/g, "&quot;");
            
            return `
                <div class="sugestao-item" onclick="selecionarProdutoAlterar('${nomeSeguro}', '${p.id}')">
                    ${p.nome}
                </div>
            `;
        }).join('');
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

// Função auxiliar para renderizar o HTML da lista
function renderizarListaFiltrada(dados) {
    const lista = document.getElementById('listaSugestoes');
    lista.innerHTML = dados.map(p => {
        const nomeEscapado = p.nome.replace(/'/g, "\\'").replace(/"/g, "&quot;");
        
        return `
            <div class="sugestao-item" onclick="selecionarProdutoAlterar('${nomeEscapado}', '${p.id}')">
                ${p.nome}
            </div>
        `;
    }).join('');
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

function mostrarSecao(idSecao) {
    const main = document.getElementById('main-content');
    
    // Verificamos se o botão "Limpar" existe. Se não existir, reiniciamos o HTML da seção.
    if (!document.querySelector('.btn-limpar-registros')) {
        main.innerHTML = `
            <section id="secao-inicio">
                <h1>UnterTech</h1>
                <p>Bem-vindo ao sistema de gestão. Selecione uma opção no menu lateral.</p>
            </section>
            <section id="secao-registros" style="display:none;">
                <h1>Registros de atividade</h1>
                <div class="container-lista-registros">
                    <div class="header-registros">
                        <span>Histórico</span>
                    </div>
                    <div id="lista-registros-corpo"></div>
                    
                    <div class="container-botoes-registros">
                        <button class="btn-limpar-registros" onclick="limparTodosRegistros()">Limpar histórico</button>
                    </div>
                </div>
            </section>
        `;
    }

    // Esconde todas e mostra a selecionada
    document.querySelectorAll('main section').forEach(s => s.style.display = 'none');
    const alvo = document.getElementById(idSecao);
    if (alvo) alvo.style.display = 'block';

    if (idSecao === 'secao-registros') {
        carregarRegistros();
    }
}

async function carregarRegistros() {
    const corpo = document.getElementById('lista-registros-corpo');
    if (!corpo) return; // Segurança caso a seção tenha sido apagada

    corpo.innerHTML = '<p style="padding:20px;">Carregando registros...</p>';

    const { data, error } = await _supabase // Usando a variável correta com _
        .from('registros')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error(error);
        corpo.innerHTML = '<p style="padding:20px; color:red;">Erro ao carregar do banco.</p>';
        return;
    }

    if (data.length === 0) {
        corpo.innerHTML = '<p style="padding:20px;">Nenhum registro encontrado.</p>';
        return;
    }

    corpo.innerHTML = '';
    data.forEach(reg => {
        const dataFormatada = new Date(reg.created_at).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        const div = document.createElement('div');
        div.className = 'item-registro';
        div.innerHTML = `
            <span class="registro-nome">${reg.nome_produto}</span>
            <span class="registro-data">${dataFormatada}</span>
        `;
    
        corpo.appendChild(div);
    });
}

async function limparTodosRegistros() {
    try {
        // Deleta todos os registros onde o ID for maior que 0
        const { error } = await _supabase
            .from('registros')
            .delete()
            .gt('id', 0); 

        if (error) throw error;

        // Alerta personalizado com o mesmo estilo do cadastro de produtos
        mostrarAlerta("Histórico limpo com sucesso!", "sucesso");
        
        // Atualiza a lista na tela
        carregarRegistros();

    } catch (error) {
        console.error("Erro ao limpar:", error);
        mostrarAlerta("Erro ao limpar registros: " + error.message, "erro");
    }
}

async function exibirBuscaApagar() {
    const mainContent = document.getElementById('main-content');
    
    // ESTILO IDÊNTICO AO SEU "ALTERAR" (Fino e arredondado)
    const estiloFinoArredondado = `
        width: 100%;
        height: 45px;
        padding: 0 45px 0 20px;
        font-size: 15px;
        border: 1px solid #e0e0e0;
        border-radius: 25px;
        outline: none;
        background-color: #fff;
        box-sizing: border-box;
        transition: all 0.2s ease;
    `;

    mainContent.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 60vh; width: 100%; animation: fadeIn 0.3s ease;">
            <div style="text-align: center; width: 100%; max-width: 600px;">
                <h1 style="margin-bottom: 10px; color: #0047ab;">Apagar produto</h1>
                <p style="margin-bottom: 30px; color: #666;">Selecione o produto abaixo para remover</p>
                
                <div class="container-busca-alterar">
                    <div class="wrapper-input-select">
                        <input type="text" id="inputBuscaAlterar" 
                               placeholder="Pesquise..." 
                               autocomplete="off" 
                               oninput="filtrarSugestoesApagar()"
                               onclick="mostrarTodasSugestoesApagar()"
                        >
                        
                        <img src="data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%230047ab' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E" 
                             style="position: absolute; right: 18px; top: 50%; transform: translateY(-50%); width: 16px; cursor: pointer;"
                             onclick="toggleListaApagar(event)">
                        
                        <div id="listaSugestoesApagar" class="lista-sugestoes"></div>
                    </div>
                    <button id="btnProsseguirApagar" class="btn-prosseguir" disabled onclick="confirmarExclusao()" 
                            style="height: 45px; border-radius: 25px; padding: 0 25px; margin: 0; background-color: #0047ab; color: white; border: none;">
                        Apagar
                    </button>
                </div>
            </div>
        </div>
    `;

    // Carrega o cache para a busca funcionar
    const { data: produtos } = await _supabase
        .from('produtos')
        .select('nome, id')
        .order('updated_at', { ascending: false });
        
    window.listaProdutosCacheApagar = produtos || [];
}

// 1. Filtra os produtos conforme você digita no campo
function filtrarSugestoesApagar() {
    const input = document.getElementById('inputBuscaAlterar'); 
    const lista = document.getElementById('listaSugestoesApagar');
    const btn = document.getElementById('btnProsseguirApagar');
    
    // 1. Pegamos o valor bruto
    const valorBusca = input.value.toLowerCase();
    
    btn.disabled = true;

    // 2. Criamos os termos da busca
    const termosBusca = valorBusca.split(" ").filter(t => t.trim() !== "");

    if (termosBusca.length === 0) {
        lista.style.display = "none";
        return;
    }

    // 3. A Lógica que funcionou no Estoque (Rigorosa)
    const filtrados = window.listaProdutosCacheApagar.filter(p => {
        const palavrasDoNome = p.nome.toLowerCase().split(" ").filter(pal => pal.trim() !== "");
        let palavrasDisponiveis = [...palavrasDoNome];

        return termosBusca.every(termo => {
            const index = palavrasDisponiveis.findIndex(pNome => pNome.startsWith(termo));
            if (index !== -1) {
                palavrasDisponiveis.splice(index, 1);
                return true;
            }
            return false;
        });
    });

    // 4. Renderização (Igual ao Alterar, mas com text-align: left para não centralizar)
    if (filtrados.length > 0) {
        lista.innerHTML = filtrados.map(p => {
            const nomeSeguro = p.nome.replace(/'/g, "\\'").replace(/"/g, "&quot;");
            
            return `
                <div class="sugestao-item" 
                     style="text-align: left;" 
                     onclick="selecionarProdutoApagar('${nomeSeguro}', '${p.id}')">
                    ${p.nome}
                </div>
            `;
        }).join('');
        lista.style.display = "block";
    } else {
        lista.innerHTML = "";
        lista.style.display = "none";
    }
}

// 2. Mostra todas as opções ao clicar no campo ou na seta
function mostrarTodasSugestoesApagar() {
    const lista = document.getElementById('listaSugestoesApagar');
    if (window.listaProdutosCacheApagar && window.listaProdutosCacheApagar.length > 0) {
        renderizarListaFiltradaApagar(window.listaProdutosCacheApagar);
        lista.style.display = "block";
    }
}

// 3. Abre e fecha a lista ao clicar no ícone da seta
function toggleListaApagar(event) {
    event.stopPropagation(); // Impede que o clique feche a lista imediatamente
    const lista = document.getElementById('listaSugestoesApagar');
    if (lista.style.display === "block") {
        lista.style.display = "none";
    } else {
        mostrarTodasSugestoesApagar();
    }
}

// 4. Renderiza os itens dentro da lista (idêntico ao menu alterar)
function renderizarListaFiltradaApagar(dados) {
    const lista = document.getElementById('listaSugestoesApagar');
    
    // Aplicando estilo via JS para garantir que ela flutue sobre o botão
    lista.style.position = "absolute";
    lista.style.width = "100%";
    lista.style.zIndex = "1000";
    lista.style.backgroundColor = "#fff";
    lista.style.border = "1px solid #e0e0e0";
    lista.style.borderRadius = "15px";
    lista.style.marginTop = "5px";
    lista.style.maxHeight = "200px";
    lista.style.overflowY = "auto";
    lista.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";

    lista.innerHTML = dados.map(p => {
    const nomeSeguro = p.nome.replace(/'/g, "\\'").replace(/"/g, "&quot;");
    return `
        <div class="sugestao-item" 
             style="padding: 12px 20px; cursor: pointer; border-bottom: 1px solid #f5f5f5; text-align: left;"
             onclick="selecionarProdutoApagar('${nomeSeguro}', '${p.id}')">
            ${p.nome}
        </div>
    `;
}).join('');
}

// 5. Quando o usuário clica em um produto da lista
function selecionarProdutoApagar(nome, id) {
    const input = document.getElementById('inputBuscaAlterar');
    const lista = document.getElementById('listaSugestoesApagar');
    const btn = document.getElementById('btnProsseguirApagar');
    
    input.value = nome.replace(/&quot;/g, '"');
    input.dataset.idSelecionado = id; // Guarda o ID para o delete
    lista.style.display = "none";     // Esconde a lista
    btn.disabled = false;             // Libera o botão "Apagar"
    btn.classList.remove('confirmando');
    btn.style.backgroundColor = "#0047ab";
    btn.innerText = "Apagar";
}

async function confirmarExclusao() {
    const btn = document.getElementById('btnProsseguirApagar');
    const input = document.getElementById('inputBuscaAlterar');
    const id = input.dataset.idSelecionado;

    if (!id) return;

    // Se o botão AINDA NÃO está no estado de "confirmar" (vermelho)
    if (!btn.classList.contains('confirmando')) {
        // 1. Muda a cor e o texto
        btn.style.backgroundColor = "#D00000"; // Vermelho
        btn.innerText = "Apagar";
        
        // 2. Adiciona uma classe de controle
        btn.classList.add('confirmando');

        // 3. Opcional: Se o usuário não clicar de novo em 3 segundos, o botão volta ao normal
        setTimeout(() => {
            if (btn.classList.contains('confirmando')) {
                btn.classList.remove('confirmando');
                btn.style.backgroundColor = "#0047ab"; // Volta ao azul original
            }
        }, 3000);

        return; // Para aqui, esperando o segundo clique
    }

    // --- SEGUNDO CLIQUE: Executa a exclusão real ---
    btn.disabled = true;

    try {
        const { error } = await _supabase
            .from('produtos')
            .delete()
            .eq('id', id);

        if (error) throw error;

        mostrarAlerta("Produto removido com sucesso!", "sucesso");
        exibirBuscaApagar(); // Recarrega a tela para limpar tudo

    } catch (error) {
        console.error("Erro ao deletar:", error);
        mostrarAlerta("Erro ao remover produto", "erro");
        
        // Reseta o botão em caso de erro
        btn.disabled = false;
        btn.classList.remove('confirmando');
        btn.style.backgroundColor = "#0047ab";
        btn.innerText = "Apagar";
    }
}
// Fecha a lista de apagar se clicar fora do campo ou da lista
document.addEventListener('click', (e) => {
    const container = document.querySelector('.container-busca-alterar');
    const listaApagar = document.getElementById('listaSugestoesApagar');
    
    // Se a lista existir e o clique NÃO for dentro do container da busca
    if (listaApagar && container && !container.contains(e.target)) {
        listaApagar.style.display = 'none';
    }
});

let filtroEstoqueAtivo = "Todos"; // Controla o filtro de estoque

function toggleMenuEstoque() {
    const menu = document.getElementById('menuEstoque');
    // Fecha o outro menu se estiver aberto
    document.getElementById('menuFiltro').classList.remove('ativo');
    menu.classList.toggle('ativo');
    
    renderizarMenuEstoque();
}

function renderizarMenuEstoque() {
    const menu = document.getElementById('menuEstoque');
    const opcoes = ["Todos", "Sem estoque", "Acabando"];
    
    let html = "";
    opcoes.forEach(opcao => {
        const isAtivo = filtroEstoqueAtivo === opcao;
        // "Todos" fica sempre em negrito ou conforme a seleção
        const style = isAtivo ? "font-weight: bold; color: var(--accent-color);" : "";
        const bTag = (opcao === "Todos") ? "<b>Todos</b>" : opcao;
        
        html += `<div class="item-categoria ${isAtivo ? 'ativo' : ''}" 
                     style="${style}" 
                     onclick="setFiltroEstoque('${opcao}')">${bTag}</div>`;
    });
    
    menu.innerHTML = html;
}

function setFiltroEstoque(opcao) {
    filtroEstoqueAtivo = opcao;
    document.getElementById('menuEstoque').classList.remove('ativo');
    filtrarProdutos(); // Chama a função que já existe, vamos atualizá-la abaixo
}

// Fecha os menus ao clicar fora deles
document.addEventListener('click', function(event) {
    const menuFiltro = document.getElementById('menuFiltro');
    const menuEstoque = document.getElementById('menuEstoque');
    
    // Pegamos os ícones para evitar que o menu feche no exato momento em que você clica para abrir
    const isClickInsideFiltro = menuFiltro && menuFiltro.contains(event.target);
    const isClickInsideEstoque = menuEstoque && menuEstoque.contains(event.target);
    
    // Selecionamos as imagens dos ícones (ajuste os seletores se necessário)
    const icones = document.querySelectorAll('.busca-wrapper img');
    let clicouEmIcone = false;
    icones.forEach(img => {
        if (img.contains(event.target)) clicouEmIcone = true;
    });

    if (!isClickInsideFiltro && !isClickInsideEstoque && !clicouEmIcone) {
        if (menuFiltro) menuFiltro.classList.remove('ativo');
        if (menuEstoque) menuEstoque.classList.remove('ativo');
    }
});

function toggleMenuFiltro() {
    const menu = document.getElementById('menuFiltro');
    const menuEstoque = document.getElementById('menuEstoque');
    
    // Fecha o de estoque se estiver aberto
    if (menuEstoque) menuEstoque.classList.remove('ativo');
    
    const estaAtivo = menu.classList.toggle('ativo');
    
    // Se abriu o menu, renderiza as categorias baseadas no cache atual
    if (estaAtivo) {
        renderizarMenuCategorias();
    }
}

function renderizarMenuCategorias() {
    const menu = document.getElementById('menuFiltro');
    
    // Escreva as categorias na ordem exata que você deseja que apareçam no site
    const categorias = [
        "Smartwatches", "Fones", "Carregadores", "Cabos", 
        "Adaptadores", "Suportes", "Mouses", "Teclados", 
        "Setup", "Hardware", "Acessórios", "Eletroportáteis", "Casa"
    ];

    let htmlCategorias = `<div class="item-categoria ${filtroTipoAtivo === "" ? "ativo" : ""}" 
                               onclick="filtrarPorTipo('', this)"><b>Todos</b></div>`;
    
    // Aqui ele apenas percorre a sua lista acima, sem dar "sort" (alfabética)
    categorias.forEach(tipo => {
        let classeAtiva = (tipo === filtroTipoAtivo) ? "item-categoria ativo" : "item-categoria";
        htmlCategorias += `<div class="${classeAtiva}" onclick="filtrarPorTipo('${tipo}', this)">${tipo}</div>`;
    });

    menu.innerHTML = htmlCategorias;
}

function toggleMenuEstoque() {
    const menu = document.getElementById('menuEstoque');
    // Fecha o de categorias se estiver aberto
    const menuFiltro = document.getElementById('menuFiltro');
    if (menuFiltro) menuFiltro.classList.remove('ativo');
    
    menu.classList.toggle('ativo');
    renderizarMenuEstoque();
}

function resetarFiltrosEstoque() {
    // 1. Volta as variáveis globais ao estado inicial
    filtroTipoAtivo = ""; 
    filtroEstoqueAtivo = "Todos";

    // 2. Fecha os menus flutuantes caso estejam abertos
    const menuFiltro = document.getElementById('menuFiltro');
    const menuEstoque = document.getElementById('menuEstoque');
    
    if (menuFiltro) menuFiltro.classList.remove('ativo');
    if (menuEstoque) menuEstoque.classList.remove('ativo');

    // 3. Remove o destaque visual (classe 'ativo') de todos os itens dos menus
    document.querySelectorAll('.item-categoria').forEach(item => {
        item.classList.remove('ativo');
    });
}

function mostrarInicio() {
    const mainContent = document.getElementById('main-content');
    
    // Define o conteúdo da tela inicial
    mainContent.innerHTML = `
        <section id="secao-inicio">
            <h1>Unter Tech</h1>
            <p>Bem-vindo ao sistema de gestão. Selecione uma opção no menu lateral.</p>
        </section>
    `;
}

// Variável para saber para onde ir após o login
let acaoPendente = "";

function solicitarSenha(acao) {
    acaoPendente = acao;
    const mainContent = document.getElementById('main-content');
    
    mainContent.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 70vh; padding: 20px; animation: fadeIn 0.3s ease;">
            
<div style="text-align: center;">
    <h1 style="margin-bottom: 10px;">Validação de acesso</h1>
    <p style="margin-bottom: 30px; color: #666;">Digite a sua senha para prosseguir</p>
</div>

            <div style="display: flex; gap: 5px; align-items: center; background: white; padding: 25px; border-radius: 15px; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #eee;">
                <input type="password" id="campoSenhaUT" placeholder="Senha" 
                    style="padding: 10px 20px; border-radius: 25px; border: 2px solid #eee; outline: none; font-size: 1rem; width: 200px; transition: border-color 0.3s;"
                    onfocus="this.style.borderColor='var(--accent-color)'"
                    onblur="this.style.borderColor='#eee'"
                    onkeypress="if(event.key === 'Enter') confirmarSenhaUT()">
                
                <button onclick="confirmarSenhaUT()" 
                    style="padding: 12px 25px; background-color: var(--accent-color); color: white; border: none; border-radius: 25px; font-weight: bold; cursor: pointer; transition: transform 0.2s;"
                    onmouseover="this.style.transform='scale(1.05)'"
                    onmouseout="this.style.transform='scale(1)'">
                    Confirmar
                </button>
            </div>
            
            <div id="erroSenha" style="display: none;"></div>
        </div>
    `;
    
    setTimeout(() => document.getElementById('campoSenhaUT').focus(), 100);
}

function confirmarSenhaUT() {
    const senhaDigitada = document.getElementById('campoSenhaUT').value;
    const senhaCorreta = "ut";
    const erroMsg = document.getElementById('erroSenha');

    if (senhaDigitada === senhaCorreta) {
        // Redireciona conforme a opção escolhida anteriormente
        if (acaoPendente === 'adicionar') exibirFormularioAdicionar();
        else if (acaoPendente === 'alterar') exibirBuscaAlterar();
        else if (acaoPendente === 'apagar') exibirBuscaApagar();
    } else {
        erroMsg.style.display = "block";
        document.getElementById('campoSenhaUT').value = "";
        document.getElementById('campoSenhaUT').style.borderColor = "#dc3545";
        // Balanço de erro visual
        document.getElementById('campoSenhaUT').animate([
            { transform: 'translateX(0)' },
            { transform: 'translateX(-5px)' },
            { transform: 'translateX(5px)' },
            { transform: 'translateX(0)' }
        ], { duration: 200 });
    }
}