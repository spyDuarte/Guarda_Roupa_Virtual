# Guarda-Roupa Virtual da Ritinha

Este projeto é uma Aplicação Web de Página Única (SPA) para gerenciamento de guarda-roupa pessoal, desenvolvida com HTML, JavaScript e Tailwind CSS.

## Funcionalidades

- **Dashboard**: Visão geral com estatísticas e previsão do tempo (simulada).
- **Meu Guarda-Roupa**: Galeria de peças organizadas por categoria (Parte de Cima, Parte de Baixo, Sapatos, Acessórios).
- **Looks**: Área dedicada para looks completos.
- **Adicionar Peças**: Interface para cadastro de novas peças com suporte a upload de imagem ou URL.
- **Detalhes**: Visualização de detalhes da peça (Marca, Tamanho, Notas).

## Como Executar Localmente

1. Clone o repositório.
2. Abra o arquivo `index.html` em seu navegador.
   - Ou, para uma melhor experiência, use um servidor local:
     ```bash
     python3 -m http.server 8000
     ```
     Acesse `http://localhost:8000` no navegador.

## Como Fazer Deploy no GitHub Pages

Para publicar este projeto na internet usando o GitHub Pages:

1. Faça o **Push** do código para o seu repositório no GitHub.
2. Vá até as **Settings** (Configurações) do repositório.
3. No menu lateral, clique em **Pages**.
4. Em **Build and deployment** > **Source**, selecione `Deploy from a branch`.
5. Em **Branch**, selecione a branch `main` (ou a branch onde seu código está) e a pasta `/` (root).
6. Clique em **Save**.
7. Aguarde alguns minutos e acesse o link fornecido pelo GitHub.

## Notas Técnicas

- **Estilização**: O projeto utiliza **Tailwind CSS via CDN**. Isso é ideal para prototipagem e projetos simples. Para produção em larga escala, recomenda-se configurar um processo de build (PostCSS).
- **Armazenamento**: Os dados são salvos no `localStorage` do navegador.
  - **Atenção**: O `localStorage` tem um limite de armazenamento (geralmente 5MB). Se você adicionar muitas imagens via upload (Base64), esse limite pode ser atingido rapidamente. Recomenda-se usar **URLs de imagens** para economizar espaço.
- **Segurança**: O projeto utiliza práticas seguras de manipulação do DOM (`textContent`) para prevenir ataques XSS.
