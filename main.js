const worker = new Worker("worker.js");

const nomeCompleto = document.querySelector("#nome-completo");
const dataDeNascimento = document.querySelector("#nascimento");
const sexo = document.querySelector("#sexo");
const filiacao1 = document.querySelector("#filiacao1");
const filiacao2 = document.querySelector("#filiacao2");
const raca = document.querySelector("#cor-raca");
const nacionalidade = document.querySelector("#nacionalidade");
const email = document.querySelector("#email");
const avisoDeErro = document.querySelector("#aviso-erro");

const pessoasCadastradas = document.querySelector("#pessoas-cadastradas ul");

const cadastrarBtn = document.querySelector("#cadastro-form button");
const pesquisarBtn = document.querySelector("#pesquisa-form button");
const mostrarCadastradosBtn = document.querySelector("button#mostrar");

worker.onmessage = (message) => {
    if (message.data.tipo === "erro") {
        avisoDeErro.textContent = message.data.mensagem;
    } else if (message.data.tipo === "no person") {
        const aviso = document.createElement("li");
        aviso.textContent = message.data.mensagem;
        // limpa a lista de pessoas para não exibir duplicatas
        pessoasCadastradas.innerHTML = "";
        pessoasCadastradas.style.display = "block";
        pessoasCadastradas.appendChild(aviso);
    } else if (message.data.tipo === "sucesso" && message.data.resultado) {
        pessoasCadastradas.innerHTML = "";
        pessoasCadastradas.style.display = "block";
        for (let i = 0; i < message.data.resultado.length; i++) {
            const pessoa = document.createElement("li");
            const container = document.createElement("div");
            container.classList.add("pessoa");
            container.innerHTML = `<b>${message.data.resultado[i].nome}</b> <span class='data-de-nascimento'>${message.data.resultado[i].dataDeNascimento}</span><br>
                                   <p>Sexo: ${message.data.resultado[i].sexo}</p>
                                   <p>Nacionalidade: ${message.data.resultado[i].nacionalidade}</p>
                                   <p>${message.data.resultado[i].email}</p>`;
            pessoa.appendChild(container);
            pessoasCadastradas.appendChild(pessoa);
        }
    } else if (!(message.data.tipo === "sucesso" || message.data.tipo === "no person" || message.data.tipo === "erro")) {
        console.log("Tipo de mensagem inválida.");
    }
}

// adiciona uma pessoa ao banco de dados
cadastrarBtn.addEventListener('click', function (event) {
    event.preventDefault();
    worker.postMessage({
        tipo: "cadastrar",
        form: {
            nomeCompleto: nomeCompleto.value,
            dataDeNascimento: dataDeNascimento.value.split("-").reverse().join("-"),
            sexo: sexo.value,
            filiacao1: filiacao1.value,
            filiacao2: filiacao2.value,
            raca: raca.value,
            nacionalidade: nacionalidade.value,
            email: email.value
        },
    })
})
mostrarCadastradosBtn.addEventListener('click', function () {
    worker.postMessage({ tipo: "mostrar cadastrados" });
})
pesquisarBtn.addEventListener('click', function (event) {
    event.preventDefault();
    const index = document.querySelector("#pesquisa-form select").value.toLowerCase();
    const query = document.querySelector("#pesquisa-form input").value;
    worker.postMessage({ tipo: "pesquisar", query: query, index: index });
})
// item 'Pesquisar' da lista no header
document.querySelectorAll("header li")[0].addEventListener('click', function () {
    pessoasCadastradas.style.display = "none";
    document.querySelector("#cadastro-form").style.display = "none";
    document.querySelector("#pesquisa-form").style.display = "block";
})

// item 'Cadastrar' da lista no header
document.querySelectorAll("header li")[1].addEventListener('click', function () {
    pessoasCadastradas.style.display = "block";
    document.querySelector("#cadastro-form").style.display = "block";
    document.querySelector("#pesquisa-form").style.display = "none";
})
