const db = require("./db")

async function criar_tabelas() {
    const connection = await db.pool.getConnection();
    try {
        await connection.beginTransaction();

        console.log("Criando tabela 'cliente'...");
        await connection.query(`
            DROP TABLE IF EXISTS cliente;
            CREATE TABLE cliente (
                id int(11) NOT NULL AUTO_INCREMENT,
                nome varchar(100) NOT NULL,
                cpf char(14) NOT NULL,
                celular char(14) NOT NULL,
                email varchar(100) NOT NULL,
                senha varchar(512) NOT NULL,
                PRIMARY KEY (id),
                UNIQUE KEY cpf (cpf),
                UNIQUE KEY email (email)
            ) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
            
            INSERT INTO cliente VALUES 
                (39,'dada','123123123','123123123','dada@gmail.com','$2b$10$kD3gVfcJe/enULNbB7/u1.P7kWT.NIj2E74NmYxFOqlsEGOWJjNUW');
        `);

        console.log("Criando tabela 'produto'...");
        await connection.query(`
            DROP TABLE IF EXISTS produto;
            CREATE TABLE produto (
                id int(11) NOT NULL AUTO_INCREMENT,
                nome varchar(150) NOT NULL,
                categoria varchar(50) NOT NULL,
                preco decimal(10,2) NOT NULL,
                estoque int(11) NOT NULL DEFAULT 0,
                PRIMARY KEY (id)
            ) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

            INSERT INTO produto (id, nome, categoria, preco, estoque) VALUES
                (1, 'Ração Premium para Gatos Adultos', 'Alimentação', 89.90, 50),
                (2, 'Sachê de Atum para Gatos', 'Alimentação', 4.50, 200),
                (3, 'Arranhador de Sisal em Torre', 'Móveis', 149.90, 15),
                (4, 'Areia Sanitária com Sílica', 'Higiene', 39.90, 80),
                (5, 'Caixa de Transporte Pequena', 'Acessórios', 79.90, 30),
                (6, 'Brinquedo Ratão de Pelúcia', 'Brinquedos', 19.90, 120),
                (7, 'Cama Redonda Acolchoada', 'Conforto', 99.90, 25),
                (8, 'Coleira com Guizo Reflectiva', 'Acessórios', 24.90, 60),
                (9, 'Escova Removedora de Pelos', 'Higiene', 34.90, 45),
                (10, 'Petiscos de Frango Crocante', 'Alimentação', 15.90, 150);
        `);

        await connection.commit();
        console.log("Estrutura e dados criados com sucesso!");
        process.exit(0);
    } catch (error) {
        await connection.rollback();
        console.log("Erro na migration:", error);
        process.exit(1);
    } finally {
        connection.release();
    }
}
criar_tabelas()