// =========================================================
// Config
// =========================================================
const API_URL = "http://localhost:3000";

// =========================================================
// Fallback (API offline) — mesmo formato do banco
// =========================================================
const PRODUTOS_FALLBACK = [
    { id: 1, nome: "Ração Premium para Gatos Adultos", categoria: "Alimentação", preco: 89.90, estoque: 50 },
    { id: 2, nome: "Sachê de Atum para Gatos", categoria: "Alimentação", preco: 4.50, estoque: 200 },
    { id: 3, nome: "Arranhador de Sisal em Torre", categoria: "Móveis", preco: 149.90, estoque: 15 },
    { id: 4, nome: "Areia Sanitária com Sílica", categoria: "Higiene", preco: 39.90, estoque: 80 },
    { id: 5, nome: "Caixa de Transporte Pequena", categoria: "Acessórios", preco: 79.90, estoque: 30 },
    { id: 6, nome: "Brinquedo Ratão de Pelúcia", categoria: "Brinquedos", preco: 19.90, estoque: 120 },
    { id: 7, nome: "Cama Redonda Acolchoada", categoria: "Conforto", preco: 99.90, estoque: 25 },
    { id: 8, nome: "Coleira com Guizo Reflectiva", categoria: "Acessórios", preco: 24.90, estoque: 60 },
    { id: 9, nome: "Escova Removedora de Pelos", categoria: "Higiene", preco: 34.90, estoque: 45 },
    { id: 10, nome: "Petiscos de Frango Crocante", categoria: "Alimentação", preco: 15.90, estoque: 150 }
];

// =========================================================
// Mapeamentos visuais
// =========================================================
const EMOJIS_PRODUTOS = {
    1: "🍖", 2: "🐟", 3: "🏰", 4: "🪣", 5: "📦",
    6: "🐭", 7: "🛏️", 8: "🔔", 9: "🧹", 10: "🍗"
};

const CORES_CATEGORIA = {
    "Alimentação": "#f59e0b",
    "Móveis": "#8b5cf6",
    "Higiene": "#06b6d4",
    "Acessórios": "#ec4899",
    "Brinquedos": "#10b981",
    "Conforto": "#6366f1"
};

// =========================================================
// Estado dos filtros
// =========================================================
const filtros = {
    busca: "",
    categoria: "",
    preco_min: "",
    preco_max: "",
    ordenacao: "",
    pagina: 1
};

// =========================================================
// Helpers
// =========================================================
function formatarPreco(valor) {
    return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function escaparNome(nome) {
    return String(nome).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

// =========================================================
// Card
// =========================================================
function criarCard(produto) {
    const categoria = produto.categoria || "Geral";
    const corCategoria = CORES_CATEGORIA[categoria] || "#6366f1";
    const emoji = EMOJIS_PRODUTOS[produto.id] || "🐾";
    const estoqueBaixo = produto.estoque < 20;
    const semEstoque = produto.estoque <= 0;

    return `
        <div class="card" data-categoria="${categoria}">
            <div class="card-img-wrapper" style="position:relative; text-align:center; padding:10px 0;">
                <span style="font-size:4.5rem; line-height:1;">${emoji}</span>
                <span class="badge-categoria" style="
                    position:absolute; top:0; right:0;
                    background:${corCategoria}; color:white;
                    padding:4px 10px; border-radius:20px;
                    font-size:0.7rem; font-weight:600;
                ">${categoria}</span>
            </div>
            <h3 class="nome-produto">${produto.nome}</h3>
            <div class="info">
                <span class="descricao" style="color:${semEstoque || estoqueBaixo ? '#dc2626' : 'var(--text-muted)'}; font-size:0.85rem;">
                    ${semEstoque ? '❌ Sem estoque' : (estoqueBaixo ? '⚠️ Últimas unidades' : '✅ Em estoque')} (${produto.estoque} un.)
                </span>
                <span class="preco">${formatarPreco(produto.preco)}</span>
            </div>
            <button class="btn_enviar btn-adicionar"
                ${semEstoque ? "disabled" : ""}
                onclick="adicionarCarrinho(${produto.id}, '${escaparNome(produto.nome)}', ${Number(produto.preco)})"
                style="margin-top:auto;">
                🛒 Adicionar ao Carrinho
            </button>
        </div>
    `;
}

// =========================================================
// Renderização
// =========================================================
function renderizarProdutos(produtos) {
    const grid = document.getElementById("grid-produtos");
    const contador = document.getElementById("contador-produtos");
    const loading = document.getElementById("loading");

    if (loading) loading.style.display = "none";
    if (contador) contador.textContent = `${produtos.length} itens`;
    if (!grid) return;

    if (produtos.length === 0) {
        grid.innerHTML = `<p class="text-center" style="grid-column:1 / -1; color:var(--text-muted);">Nenhum produto encontrado com esses filtros.</p>`;
        return;
    }
    grid.innerHTML = produtos.map(criarCard).join("");
}

function renderizarPaginacao(dados) {
    if (!dados || Array.isArray(dados)) return;

    const paginaAtual = dados.pagina || 1;
    const totalPaginas = dados.total_paginas || 1;

    let container = document.getElementById("paginacao");
    if (!container) {
        container = document.createElement("div");
        container.id = "paginacao";
        container.style.cssText = "text-align:center; margin:24px auto; display:flex; justify-content:center; align-items:center; gap:12px; flex-wrap:wrap;";
        document.getElementById("grid-produtos").after(container);
    }

    container.innerHTML = `
        <button class="btn_enviar" style="width:auto; padding:10px 20px; margin:0;"
            onclick="irParaPagina(${paginaAtual - 1})"
            ${paginaAtual <= 1 ? "disabled" : ""}>← Anterior</button>
        <span style="font-weight:600; color:var(--text-muted);">Página ${paginaAtual} de ${totalPaginas}</span>
        <button class="btn_enviar" style="width:auto; padding:10px 20px; margin:0;"
            onclick="irParaPagina(${paginaAtual + 1})"
            ${paginaAtual >= totalPaginas ? "disabled" : ""}>Próxima →</button>
    `;
}

// =========================================================
// Query string + fetch
// =========================================================
function montarQueryString() {
    const params = new URLSearchParams();
    if (filtros.busca)      params.append("busca", filtros.busca);
    if (filtros.categoria)  params.append("categoria", filtros.categoria);
    if (filtros.preco_min !== "") params.append("preco_min", filtros.preco_min);
    if (filtros.preco_max !== "") params.append("preco_max", filtros.preco_max);
    if (filtros.ordenacao)  params.append("ordenacao", filtros.ordenacao);
    params.append("pagina", filtros.pagina);
    return params.toString();
}

async function carregarProdutos() {
    const loading = document.getElementById("loading");
    const grid = document.getElementById("grid-produtos");
    if (loading) loading.style.display = "block";
    if (grid) grid.innerHTML = "";

    try {
        const url = `${API_URL}/produto?${montarQueryString()}`;
        const resposta = await fetch(url);
        if (!resposta.ok) throw new Error("API indisponível");
        const dados = await resposta.json();

        const lista = Array.isArray(dados) ? dados : (dados.produtos || []);
        const produtos = lista.map(p => {
            const fb = PRODUTOS_FALLBACK.find(f => f.id === p.id);
            return {
                id: p.id,
                nome: p.nome,
                categoria: p.categoria || (fb ? fb.categoria : "Geral"),
                preco: Number(p.preco),
                estoque: p.estoque ?? (fb ? fb.estoque : 0)
            };
        });

        renderizarProdutos(produtos);
        renderizarPaginacao(dados);

        const erroApi = document.getElementById("erro-api");
        if (erroApi) erroApi.style.display = "none";
    } catch (error) {
        console.warn("Erro ao buscar produtos da API:", error);
        const erroApi = document.getElementById("erro-api");
        if (erroApi) erroApi.style.display = "block";

        renderizarProdutos(aplicarFiltrosLocais(PRODUTOS_FALLBACK));
        const pag = document.getElementById("paginacao");
        if (pag) pag.remove();
    }
}

function aplicarFiltrosLocais(lista) {
    let out = [...lista];
    if (filtros.busca) {
        const b = filtros.busca.toLowerCase();
        out = out.filter(p => p.nome.toLowerCase().includes(b));
    }
    if (filtros.categoria) out = out.filter(p => p.categoria === filtros.categoria);
    if (filtros.preco_min !== "") out = out.filter(p => p.preco >= Number(filtros.preco_min));
    if (filtros.preco_max !== "") out = out.filter(p => p.preco <= Number(filtros.preco_max));
    if (filtros.ordenacao === "asc") out.sort((a, b) => a.preco - b.preco);
    else if (filtros.ordenacao === "desc") out.sort((a, b) => b.preco - a.preco);
    return out;
}

// =========================================================
// Paginação
// =========================================================
function irParaPagina(n) {
    if (n < 1) return;
    filtros.pagina = n;
    carregarProdutos();
    window.scrollTo({ top: 0, behavior: "smooth" });
}

// =========================================================
// Filtros
// =========================================================
function lerFormulario() {
    const busca     = document.getElementById("filtro-busca");
    const categoria = document.getElementById("filtro-categoria");
    const pmin      = document.getElementById("filtro-preco-min");
    const pmax      = document.getElementById("filtro-preco-max");
    const ord       = document.getElementById("filtro-ordenacao");

    filtros.busca     = busca     ? busca.value.trim() : "";
    filtros.categoria = categoria ? categoria.value    : "";
    filtros.preco_min = pmin      ? pmin.value         : "";
    filtros.preco_max = pmax      ? pmax.value         : "";
    filtros.ordenacao = ord       ? ord.value          : "";
    filtros.pagina    = 1;
}

function limparFiltros() {
    ["filtro-busca","filtro-categoria","filtro-preco-min","filtro-preco-max","filtro-ordenacao"]
        .forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
    filtros.busca = filtros.categoria = filtros.preco_min = filtros.preco_max = filtros.ordenacao = "";
    filtros.pagina = 1;
    carregarProdutos();
}

// =========================================================
// Carrinho
// =========================================================
function adicionarCarrinho(id, nome, preco) {
    try {
        let carrinho = JSON.parse(localStorage.getItem("carrinho") || "[]");
        const item = carrinho.find(i => i.id === id);
        if (item) {
            item.quantidade += 1;
        } else {
            carrinho.push({ id, nome, preco: Number(preco) || 0, quantidade: 1 });
        }
        localStorage.setItem("carrinho", JSON.stringify(carrinho));

        if (typeof mostrarToast === "function") {
            mostrarToast(`✅ "${nome}" adicionado ao carrinho!`, "bg-success");
        } else {
            alert(`"${nome}" adicionado ao carrinho!`);
        }
    } catch (e) {
        console.error("Erro ao adicionar ao carrinho:", e);
    }
}

// =========================================================
// Expõe funções usadas em onclick inline
// =========================================================
window.adicionarCarrinho = adicionarCarrinho;
window.irParaPagina = irParaPagina;
window.limparFiltros = limparFiltros;

// =========================================================
// Inicialização
// =========================================================
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("form-filtros");
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            lerFormulario();
            carregarProdutos();
        });
    }

    const btnLimpar = document.getElementById("btn-limpar");
    if (btnLimpar) btnLimpar.addEventListener("click", limparFiltros);

    const inputBusca = document.getElementById("filtro-busca");
    if (inputBusca) {
        let t;
        inputBusca.addEventListener("input", () => {
            clearTimeout(t);
            t = setTimeout(() => { lerFormulario(); carregarProdutos(); }, 400);
        });
    }

    carregarProdutos();
});