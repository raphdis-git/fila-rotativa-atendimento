CREATE DATABASE fila_atendimento;

USE fila_atendimento;

CREATE TABLE atendentes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    ativo TINYINT(1) DEFAULT 1,
    ordem_fila INT NOT NULL
);

INSERT INTO atendentes (nome, ordem_fila) VALUES
('João', 1),
('Maria', 2),
('Carlos', 3),
('Ana', 4);

CREATE TABLE controle (
    id INT PRIMARY KEY,
    indice_atual INT,
    inicio_atendimento DATETIME
);

INSERT INTO controle (id, indice_atual, inicio_atendimento)
VALUES (1, 1, NOW());

CREATE TABLE historico (
    id INT AUTO_INCREMENT PRIMARY KEY,
    atendente VARCHAR(100),
    data_hora DATETIME,
    duracao INT
);
