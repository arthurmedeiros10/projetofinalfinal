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
                (12,'Nicolas Galvão','123.456.789-00','(42)99966-4444','galvao@gmail.com','$2b$10$N8b2YuzXWdMJVAAd670qG.ScLlmdFsuTJ7C6/GWtMKWhj8O0pU6Pu'),
                (13,'Nicolas Galvão','123.456.789-02','(42)99966-4444','galvao2@gmail.com','$2b$10$rNwWgUx8kezhoZXXuVG7NeBXqPFAzpkc37Sg4P.ETVtiSaWWqBHxy'),
                (14,'Patrick','123.123.123-12','(42)999669966','patrick123@gmail.com','$2b$10$MZMnDj10f7JnV6ArP.5hm.TAHDZ5NwECYSw6i5kbNowwhPuqbC/W.'),
                (19,'Richard','148.211.069-57','(42) 99931-865','bellusci.richard@escola.pr.gov.br','$2b$10$v3aTKV7iVqrcBJozlOZwie8I7yO2CyQIfuVk4uxR2RSDPELZSeyxS'),
                (28,'Patrick','111.222.333-49','(42)99999-4444','patrick67@gmail.com','$2b$10$QRU70xwZs0JYccsQcf/BFe7IIGYaqlS0xb.TIkGsv7UKviM2A26pq'),
                (29,'Kauã silva de lima','152.915.999-79','(42)99999-4444','kaua.lima11@escola.pr.gov.br','$2b$10$Ax80a.N/1RUsBU48IO1hX.d4hyiNt/15aV8.8VJuPziVuzTwGe8ly'),
                (30,'Bruno','120.897.429-76','(42)99830-3607','derbli@gmail.com','$2b$10$t8fYQCnQRXxvbLczF6YJNu31UvNT1qWhZ1r9GiftnFLy1rABdFKfG'),
                (31,'Guilherme','111.333.444-78','(42)55555-9999','poisler456@gmail.com','$2b$10$r9QmvPFklIeeoCoHfISzGeJNnjScdYm4JZiNBmffsblVzk48uyHXa'),
                (32,'Rhuan','137.604.709-80','(42)99999-4444','rhuan@gmail.com','$2b$10$QA3mNPH90POZijUIri.hKO5pQQH223KGKyYOYycQA0GtPuKGhPrkS');
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

        console.log("Criando tabelas de 'compra'...");
        await connection.query(`
            DROP TABLE IF EXISTS item_compra;
            DROP TABLE IF EXISTS compra;

            CREATE TABLE compra (
                id int(11) NOT NULL AUTO_INCREMENT,
                cliente_id int(11) NOT NULL,
                data_compra timestamp NOT NULL DEFAULT current_timestamp(),
                valor_total decimal(10,2) NOT NULL,
                PRIMARY KEY (id),
                FOREIGN KEY (cliente_id) REFERENCES cliente(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

            CREATE TABLE item_compra (
                id int(11) NOT NULL AUTO_INCREMENT,
                compra_id int(11) NOT NULL,
                produto_id int(11) NOT NULL,
                quantidade int(11) NOT NULL,
                preco_unitario decimal(10,2) NOT NULL,
                PRIMARY KEY (id),
                FOREIGN KEY (compra_id) REFERENCES compra(id) ON DELETE CASCADE,
                FOREIGN KEY (produto_id) REFERENCES produto(id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
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