const dotenv = require("dotenv")
dotenv.config()

const express = require("express")
const app = express()
const port = process.env.API_PORT
app.use(express.json())

const db = require("./db")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const cors = require("cors")
app.use(cors())

// ============================================================
// ROTAS DE CLIENTE E LOGIN
// ============================================================
app.post("/cliente", async (req, res) => {
    try {
        const cliente = req.body
        const senhaCript = bcrypt.hashSync(cliente.senha, 10)
        cliente.senha = senhaCript

        const resultado = await db.pool.query(
            `INSERT INTO cliente (nome, cpf, celular, email, senha) VALUES ( ?, ?, ?, ?, ? )`,
            [cliente.nome, cliente.cpf, cliente.celular, cliente.email, cliente.senha]
        )
        res.status(201).json({ msg: "Cliente cadastrado, ID = " + resultado[0].insertId })
    } catch (error) {
        res.status(500).json({erro: error.message})
    }
})

app.post("/login", async (req,res) => {
    try {
        const user = req.body
        const resultado = await db.pool.query(
            "SELECT id, nome, email, senha FROM cliente WHERE email = ?", [user.email]
        )
        const dados_bd = resultado[0][0]
        if(!dados_bd) return res.status(401).json({msg: "Email não cadastrado!"})

        const senha_valida = await bcrypt.compare(user.senha, dados_bd.senha)
        if(!senha_valida) return res.status(401).json({msg: "Credenciais inválidas!"})

        const payload = { id: dados_bd.id, email: dados_bd.email } 
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' }) // Aumentei para 1 dia para não expirar durante os testes
        return res.status(200).json({nome: dados_bd.nome, token: token})
    } catch (error) {
        res.status(500).json({erro: error.message})
    }
})

app.get("/cliente/perfil", autenticar, async (req, res)=>{
    try {
        const id = req.usuario.id
        const result = await db.pool.query("SELECT * FROM cliente WHERE id = ?", [id]);
        const perfil = result[0][0]
        delete perfil.senha
        res.status(200).json(perfil)
    } catch (err) {
        res.status(500).json({ erro: 'Erro interno' });
    }
})

// ============================================================
// ROTAS DE PRODUTO
// ============================================================
app.get("/produto", async (req, res) => {
    try {
        const { busca, ordenacao, categoria, preco_min, preco_max, pagina } = req.query
        const condicoes = []
        const params = []

        if (busca) {
            condicoes.push("nome LIKE ?")
            params.push(`%${busca}%`)
        }
        if (categoria) {
            condicoes.push("categoria = ?")
            params.push(categoria)
        }
        if (preco_min !== undefined && preco_min !== "") {
            condicoes.push("preco >= ?")
            params.push(Number(preco_min))
        }
        if (preco_max !== undefined && preco_max !== "") {
            condicoes.push("preco <= ?")
            params.push(Number(preco_max))
        }

        const where = condicoes.length ? " WHERE " + condicoes.join(" AND ") : ""
        let orderBy = ""
        if (ordenacao === "desc" || ordenacao === "maior preco") orderBy = " ORDER BY preco DESC"
        else if (ordenacao === "asc" || ordenacao === "menor preco") orderBy = " ORDER BY preco ASC"

        const LIMIT = 10
        const paginaAtual = Math.max(1, parseInt(pagina) || 1)
        const offset = (paginaAtual - 1) * LIMIT

        const sql = `SELECT * FROM produto${where}${orderBy} LIMIT ${LIMIT} OFFSET ${offset}`
        const resultado = await db.pool.query(sql, params)

        const sqlCount = `SELECT COUNT(*) AS total FROM produto${where}`
        const countResult = await db.pool.query(sqlCount, params)
        const total = countResult[0][0].total
        const totalPaginas = Math.ceil(total / LIMIT)

        res.status(200).json({
            produtos: resultado[0],
            pagina: paginaAtual,
            limite: LIMIT,
            total,
            total_paginas: totalPaginas
        })
    } catch (error) {
        res.status(500).json({ erro: error.message })
    }
})

app.get("/produto/:id", async (req, res) => {
    try {
        const resultado = await db.pool.query("SELECT * FROM produto WHERE id = ?", [req.params.id])
        res.status(200).json(resultado[0][0])
    } catch (error) {
        res.status(500).json({erro: error.message})
    }
})

// ============================================================
// ROTAS DE COMPRA (AV3)
// ============================================================

// Cadastrar compra
app.post("/compra", autenticar, async (req, res) => {
    const cliente_id = req.usuario.id;
    const { itens } = req.body;

    if (!itens || itens.length === 0) {
        return res.status(400).json({ erro: "O carrinho está vazio." });
    }

    const connection = await db.pool.getConnection();

    try {
        await connection.beginTransaction();

        // Calcula o total
        let valor_total = 0;
        for (const item of itens) {
            valor_total += Number(item.preco) * Number(item.quantidade);
        }

        // Insere a compra
        const sqlCompra = "INSERT INTO compra (cliente_id, valor_total) VALUES (?, ?)";
        const [resultCompra] = await connection.query(sqlCompra, [cliente_id, valor_total]);
        const compra_id = resultCompra.insertId;

        // Insere os itens
        for (const item of itens) {
            const sqlItem = "INSERT INTO item_compra (compra_id, produto_id, quantidade, preco_unitario) VALUES (?, ?, ?, ?)";
            await connection.query(sqlItem, [compra_id, item.id, item.quantidade, item.preco]);
            
            // Dá baixa no estoque
            await connection.query("UPDATE produto SET estoque = estoque - ? WHERE id = ?", [item.quantidade, item.id]);
        }

        await connection.commit();
        res.status(201).json({
            msg: "Compra registrada com sucesso!",
            compra_id: compra_id,
            valor_total: valor_total
        });

    } catch (error) {
        await connection.rollback();
        res.status(500).json({ erro: "Erro ao registrar compra: " + error.message });
    } finally {
        connection.release();
    }
});

// Consultar compras
app.get("/compras", autenticar, async (req, res) => {
    try {
        const cliente_id = req.usuario.id;

        const sqlCompras = "SELECT id, data_compra, valor_total FROM compra WHERE cliente_id = ? ORDER BY data_compra DESC";
        const [compras] = await db.pool.query(sqlCompras, [cliente_id]);

        for (let compra of compras) {
            const sqlItens = `
                SELECT ic.produto_id, p.nome, ic.quantidade, ic.preco_unitario 
                FROM item_compra ic
                JOIN produto p ON p.id = ic.produto_id
                WHERE ic.compra_id = ?
            `;
            const [itens] = await db.pool.query(sqlItens, [compra.id]);
            compra.itens = itens;
        }

        res.status(200).json(compras);
    } catch (error) {
        res.status(500).json({ erro: "Erro ao buscar compras: " + error.message });
    }
});

// ============================================================
// INICIALIZAÇÃO E MIDDLEWARE
// ============================================================
app.listen(port, () => {
    console.log("API rodando na porta " + port)
})

function autenticar(req, res, next){
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1]
    if (token == null){
        return res.status(401).json({erro: "Token não enviado, usar Authorization Bearer <token>"})
    }
    jwt.verify(token, process.env.JWT_SECRET, (err, usuario) => {
        if (err) return res.status(403).json({erro: "Token inválido"})
        req.usuario = usuario
        next()
    })   
}