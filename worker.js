let db;
// requisição para abrir o banco de dados
const request = indexedDB.open("pessoas", 2);
// flag para não executar um bloco de código caso o banco de dados tenha sido criado agora.
let databaseCreated = false;
// flag para garantir que não exista dois emails iguais no banco de dados, até porque 
// isso geraria um erro.
let emailDuplicado = false;

request.onupgradeneeded = (event) => {
    // atribui o banco de dados à variável
    db = event.target.result;
    console.log("Banco de dados criado:", db);
    const objectStore = db.createObjectStore("cadastrados", { keyPath: "email" });
    objectStore.createIndex("nome", "nome", { unique: false });
    objectStore.createIndex("email", "email", { unique: true });
    databaseCreated = true;
}
// se o banco de dados já tiver sido criado antes
(async function () {
    // checa quantas databases existem, se existir ao menos uma vai verificar se é a que foi criada por nós.
    if ((await indexedDB.databases()).length > 0 && !databaseCreated) {
        let databases = await indexedDB.databases();
        // percorre todas as databases procurando pela nossa
        for (let i = 0; i < databases.length; i++) {
            console.log(`Database ${i + 1} de ${databases.length}`);
            if (databases[i].name === "pessoas") {
                console.log("Banco de dados \'pessoas\' encontrado.");
                const request = indexedDB.open("pessoas");
                // atribui a database à variável
                request.onsuccess = (ev) => { db = ev.target.result };
                request.onerror = (err) => { console.log("Erro ao adquirir o database", err) };
                break;
            }
        }
    }
})()

/**
 * Cria um elemento com base nos parâmetros e retorna ele. 
 * 
 * @param {string} nome nome completo da pessoa
 * @param {string} dataDeNascimento data de nascimento como uma string formatada. Ex.: 25-07-2010
 * @param {string} sexo Masculino ou Feminino
 * @param {string} nacionalidade onde a pessoa nasceu
 * @param {string} email email da pessoa. Ex.: email@gmail.com
*/
function criarPessoa(nome, dataDeNascimento, sexo, nacionalidade, email) {
    const pessoa = document.createElement("li");
    const container = document.createElement("div");
    container.classList.add("pessoa");
    container.innerHTML = `<b>${nome}</b> <span class='data-de-nascimento'>${dataDeNascimento}</span><br>
                           <p>Sexo: ${sexo}</p>
                           <p>Nacionalidade: ${nacionalidade}</p>
                           <p>${email}</p>
                           <button>Excluir cadastro</button>`;
    pessoa.appendChild(container);
    return pessoa;
}

onmessage = (e) => {
    const data = e.data;
    // como este worker vai tratar de cadastrar, excluir (descadastrar?), mostrar cadastrados e pesquisar pessoas eu usaria um
    // switch case para verificar o tipo de trabalho que vai ser feito. Mas por causa do escopo que faz com 
    // que variáveis definidas em um case fossem acessíveis no outro, o que dava problema, optei por else ifs.
    if (data.tipo === "cadastrar") {
        const { nomeCompleto, dataDeNascimento, sexo, filiacao1, filiacao2, raca, nacionalidade, email } = data.form;
        const objectStore = db.transaction(["cadastrados"], "readwrite").objectStore("cadastrados");

        // percorre toda a database para verificar se não existe um email igual ao que vai ser cadastrado.
        emailDuplicado = false;
        objectStore.openCursor().onsuccess = (event) => {
            let cursor = event.target.result;
            if (cursor) {
                // caso exista ativa uma flag
                if (cursor.value.email === email.value) {
                    emailDuplicado = true;
                }
                cursor.continue();
            } else {
                if (emailDuplicado) {
                    postMessage({ tipo: "erro", mensagem: "Já existe um email igual a este cadastrado no sistema" });
                } else {
                    const request = objectStore.add({ nome: nomeCompleto, dataDeNascimento: dataDeNascimento, sexo: sexo, filiacao: [filiacao1, filiacao2], raca: raca, email: email, nacionalidade: nacionalidade, });
                    request.onsuccess = () => {
                        console.log("Pessoa cadastrada!");
                    }
                    request.onerror = (err) => { console.log(err) };
                    emailDuplicado = false;
                }
            }
        }
    }
    else if (data.tipo === "mostrar cadastrados") {
        let cadastrados = 0;
        let listaCadastrados = [];

        const objectStore = db.transaction(["cadastrados"]).objectStore("cadastrados");
        const index = objectStore.index("nome");
        // vai exibir as pessoas em ordem alfabética
        index.openCursor().onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                listaCadastrados.push(criarPessoa(cursor.value.nome, cursor.value.dataDeNascimento, cursor.value.sexo, cursor.value.nacionalidade, cursor.value.email));
                cadastrados++;
                cursor.continue();
            } else {
                if (cadastrados === 0) {
                    postMessage({tipo: "no person", mensagem: "Nehuma pessoa cadastrada"});
                }else{
                    postMessage({tipo: "sucesso", resultado: listaCadastrados})
                }
            }
        }
    }
    else if (data.tipo === "pesquisar") {
        let resultados = 0;
        let listaResultados = [];

        const value = data.query;
        const objectStore = db.transaction(["cadastrados"]).objectStore("cadastrados");
        const index = objectStore.index(data.index);
        data.pessoasCadastradasElement.innerHTML = "";
        data.pessoasCadastradasElement.style.display = "block";
        index.openCursor(IDBKeyRange.lowerBound(value)).onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                listaResultados.push(criarPessoa(cursor.value.nome, cursor.value.dataDeNascimento, cursor.value.sexo, cursor.value.nacionalidade, cursor.value.email));
                resultados++;
                cursor.continue();
            } else {
                if (resultados === 0) {
                    postMessage({tipo: "no person", mensagem: "Nenhum resultado para a pesquisa"});
                }else{
                    postMessage({tipo: "sucesso", resultado: listaResultados});
                }
            }
        }

    }
}
