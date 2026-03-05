// ===============================
// 1 — REGISTRAR O SW PRINCIPAL DO PWA (CORRETO PARA GITHUB PAGES)
// ===============================

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        // Registro do SW Principal do PWA
        navigator.serviceWorker.register("service-worker.js")
            .then(reg => {
                console.log("✅ SW PRINCIPAL registrado:", reg);

                // Registro do SW do Firebase na RAIZ
                // Removendo o 'scope' ele assume a raiz por padrão
                return navigator.serviceWorker.register("firebase-messaging-sw.js");
            })
            .then(reg2 => {
                console.log("✅ SW Firebase Messaging registrado na raiz:", reg2);
            })
            .catch(err => {
                console.error("❌ Erro ao registrar Service Workers:", err);
            });
    });
}

  /* código para instalar o aplicativo */
  let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const installButton = document.createElement('button');
    installButton.innerText = 'Instalar App';
    installButton.style.position = 'fixed';
    installButton.style.bottom = '10px';
    installButton.style.right = '10px';
    document.body.appendChild(installButton);
    installButton.addEventListener('click', () => {
        deferredPrompt.prompt();
   deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
   console.log('Usuário aceitou instalar o app');
            } else {
   console.log('Usuário rejeitou instalar o app');
            }
            deferredPrompt = null;
            installButton.remove();
        });
    });
});
setTimeout(() => {
    if (deferredPrompt && installButton) {
        installButton.remove();
        console.log('Botão de instalação removido por inatividade.');
    }
}, 15000);

(function(){
    function _0xuuid() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'['replace'](/[xy]/g, function(c) {
            const r = Math['floor'](Math['random']() * 16);
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v ;
        });
    }

    function _0xcheck() {
        const _0xU = ['31151281541-1411614-410112-1115514-78126419810973'];
        let _0xS = localStorage['getItem']('uuid');

        if (!_0xS) {
            _0xS = _0xuuid();
            localStorage['setItem']('uuid', _0xS);
        }

        const _0xA = _0xU['includes'](_0xS);

        if (!_0xA) {
            console['warn']("Acesso negado para UUID:", _0xS);
            alert("Acesso Negado. Você não tem permissão para acessar esta página.");
            window['location']['href'] = 'acessonegado.html';
        }
    }

    _0xcheck();
})();

window.onscroll = function() {
    const backToTopButton = document.getElementById('backToTop');
    if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
        backToTopButton.style.display = 'block';
    } else {
        backToTopButton.style.display = 'none';
    }
};
document.getElementById('backToTop').onclick = function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

function esvaziarLixeira() {
    if (confirm("Tem certeza de que deseja esvaziar a lixeira? Isso removerá permanentemente todos os clientes nela.")) {
        localStorage.removeItem('lixeira');
        carregarLixeiraPagina();
    }
}

function carregarLixeiraPagina() {
    const lixeira = carregarLixeira();
    const tbody = document.querySelector('#tabelaLixeira tbody');
    tbody.innerHTML = '';
    lixeira.forEach(cliente => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><input type="checkbox" class="checkboxCliente" data-nome="${cliente.nome}"></td>
            <td>${cliente.nome}</td>
            <td>
<button onclick="restaurarCliente('${cliente.nome}')">Restaurar</button>
                <button onclick="removerPermanentemente('${cliente.nome}')">Excluir</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    const esvaziarLixeiraButton = document.getElementById('esvaziarLixeira');
    esvaziarLixeiraButton.style.display = lixeira.length === 0 ? 'none' : 'block';
    const quantidadeClientes = contarClientesLixeira(); document.getElementById('quantidadeClientesLixeira').textContent = `Clientes na lixeira: ${quantidadeClientes}`;
}

function contarClientesLixeira() {
    const lixeira = carregarLixeira();
    return lixeira.length;
}

document.addEventListener("DOMContentLoaded", () => {
    // 1. Controle do Loader (Exibe apenas na primeira visita da sessão)
    const loading = document.getElementById("loading");
    const hasVisited = sessionStorage.getItem("hasVisited");

    const esconderLoader = () => {
        if (loading) {
            loading.classList.add("hidden");
            setTimeout(() => (loading.style.display = "none"), 500);
        }
    };

    if (!hasVisited) {
        sessionStorage.setItem("hasVisited", "true");
        setTimeout(esconderLoader, 3000);
    } else {
        esconderLoader();
    }

    // 2. Chamadas de Inicialização Únicas
    carregarLixeiraPagina();
    exibirClientesAlterados();
    exibirClientesRenovadosHoje();
    carregarDarkMode();
    verificarBackupDiario();
    verificarIdentificador();
    
    // Inicializa a página e define o intervalo de atualização automática
    if (typeof carregarPagina === "function") {
        carregarPagina();
        setInterval(carregarPagina, 30 * 1000); // Atualiza a cada 30 segundos
    }

    // 3. Lógica de Identificação e Botão de Recuperação (Firebase por Telefone)
    const clientesLocais = typeof carregarClientes === "function" ? carregarClientes() : []; 
    const btnSync = document.getElementById('syncFirebase');
    const idDonoSalvo = localStorage.getItem("id_dono_app");

    // CENÁRIO A: Navegador Limpo (Sem clientes e sem ID de dono)
    if (!clientesLocais || clientesLocais.length === 0) {
        if (btnSync) {
            btnSync.style.display = "block";
            btnSync.innerText = "Restaurar meus clientes (via Telefone) 🔄";
        }
    } 
    // CENÁRIO B: App em uso, mas sem ID de dono (Configuração inicial)
    else if (!idDonoSalvo) {
        // Se há clientes mas não há ID, solicita o telefone para vincular os dados ao Firebase
        setTimeout(() => {
            if (typeof obterIdDono === "function") obterIdDono();
        }, 1000);
        if (btnSync) btnSync.style.display = "none";
    }
    // CENÁRIO C: Tudo normal
    else {
        if (btnSync) btnSync.style.display = "none";
    }

    // 4. Listeners de Eventos (Inputs, Checkboxes e Scroll)
    
    // Selecionar todos os checkboxes da tabela
    const selectAll = document.getElementById('select-all');
    if (selectAll) {
        selectAll.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('.cliente-checkbox');
            checkboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
            });
        });
    }

    // Input de importação de arquivo JSON
    const importarInput = document.getElementById("importarClientes");
    if (importarInput) {
        importarInput.addEventListener("change", importarClientes);
    }

    // Ativa a lógica de scroll (ex: botão voltar ao topo)
    if (typeof window.onscroll === "function") {
        window.onscroll();
    }

    // Renderização inicial da lista de clientes
    if (typeof displayClients === "function") {
        displayClients();
    }
});

function removerPermanentemente(nome) {
    const lixeira = carregarLixeira();
    const clienteIndex = lixeira.findIndex(c => c.nome.toLowerCase() === nome.toLowerCase());

    if (clienteIndex !== -1) {
        lixeira.splice(clienteIndex, 1);
        salvarLixeira(lixeira);

        window.location.reload();
    }
}

function carregarLixeira() {
    return JSON.parse(localStorage.getItem('lixeira')) || [];
}

function salvarLixeira(lixeira) {
    localStorage.setItem('lixeira', JSON.stringify(lixeira));
}

window.addEventListener('load', carregarLixeiraPagina);

function restaurarCliente(nome) {
    const lixeira = carregarLixeira();
    const clientes = carregarClientes();
    
    // Busca o cliente na lixeira pelo nome
    const clienteIndex = lixeira.findIndex(c => c.nome.toLowerCase() === nome.toLowerCase());

    if (clienteIndex !== -1) {
        // 1. Remove da lixeira e guarda o objeto do cliente
        const clienteParaRestaurar = lixeira.splice(clienteIndex, 1)[0];

        // 2. Adiciona de volta à lista principal de clientes
        clientes.push(clienteParaRestaurar);
        
        // 3. Salva as alterações localmente
        salvarClientes(clientes);
        salvarLixeira(lixeira);

        // 4. SINCRONIZA COM O FIREBASE
        // Isso fará com que o cliente "reapareça" no banco de dados
        atualizarDataNoFirebase(clienteParaRestaurar)
            .then(() => {
                console.log("✅ Cliente restaurado com sucesso no Firebase!");
                
                // 5. Atualiza a interface
                carregarLixeiraPagina();
                atualizarInfoClientes();
                atualizarTabelaClientes();
                
                // Recarrega para garantir que tudo esteja atualizado
                window.location.reload();
            })
            .catch(err => {
                console.error("❌ Erro ao restaurar no Firebase:", err);
                // Mesmo com erro no Firebase, recarregamos para mostrar o local
                window.location.reload();
            });
    } else {
        alert("Cliente não encontrado na lixeira.");
    }
}

function atualizarTabelaClientes() {
    const clientes = carregarClientes();
    const tabela = document.getElementById('corpoTabela');
    tabela.innerHTML = '';

    clientes.forEach(cliente => {
    adicionarLinhaTabela(cliente.nome, cliente.telefone, cliente.data, cliente.hora || "");
});
}

function carregarClientes() {
    return JSON.parse(localStorage.getItem('clientes')) || [];
}

function salvarClientes(clientes) {
    localStorage.setItem('clientes', JSON.stringify(clientes));
}

function alternarLixeira() {
const containerLixeira = document.getElementById('containerLixeira');
const toggleButton = document.getElementById('toggleLixeira');
if (containerLixeira.style.display === 'none') {
containerLixeira.style.display = 'block';
toggleButton.textContent = 'Fechar Lixeira';
} else {
containerLixeira.style.display = 'none';
toggleButton.textContent = 'Abrir Lixeira';
}
}

function excluirCliente(nome) {
    const clientes = carregarClientes();
    const clienteIndex = clientes.findIndex(c => c.nome.toLowerCase() === nome.toLowerCase());

    if (clienteIndex !== -1) {
        // 1. Som de exclusão (opcional)
        try {
            const somExclusao = new Audio('sounds/exclusao.mp3');
            somExclusao.play();
        } catch (e) { console.log("Som não encontrado"); }

        // 2. Remove do array principal e guarda o cliente removido
        const clienteRemovido = clientes.splice(clienteIndex, 1)[0];
        
        // 3. Salva a lista principal atualizada (sem o cliente) no LocalStorage
        salvarClientes(clientes);

        // 4. MOVE PARA A LIXEIRA
        const lixeira = carregarLixeira() || [];
        lixeira.push(clienteRemovido);
        salvarLixeira(lixeira);

        // 5. Limpezas adicionais (Renovados e Firebase)
        removerDeRenovadosHoje(nome);
        
        // Chamamos a função de remover do Firebase
        // IMPORTANTE: Use o nome correto da sua função (removerClienteDoFirebase ou excluirClienteDoFirebase)
        removerClienteDoFirebase(nome).then(() => {
            console.log("✅ Removido do Firebase e movido para lixeira");
            
            // 6. Efeito visual e recarregamento
            const linhaCliente = document.querySelector(`tr[data-nome="${nome.toLowerCase()}"]`);
            if (linhaCliente) {
                linhaCliente.classList.add('desintegrate');
                setTimeout(() => {
                    window.location.reload(); // Recarrega para atualizar tudo
                }, 500);
            } else {
                window.location.reload();
            }
        }).catch(err => {
            console.error("Erro ao excluir do Firebase:", err);
            window.location.reload();
        });
    }
}

function removerClienteDoFirebase(nomeCliente) {
    const idDono = obterIdDono(); // Pega o telefone (ex: 81982258462)
    const idCliente = gerarIdFirebase(nomeCliente);
    
    // Caminho exato na nova estrutura: usuarios -> TELEFONE -> clientes -> NOME
    const caminho = 'usuarios/' + idDono + '/clientes/' + idCliente;

    return firebase.database().ref(caminho).remove()
        .then(() => {
            console.log("✅ Removido do Firebase:", nomeCliente);
        })
        .catch((error) => {
            console.error("❌ Erro ao remover do Firebase:", error);
        });
}

function pesquisarClientesLixeira() {
    const input = document.getElementById('pesquisarLixeira');
    const filter = input.value.toLowerCase();
    const trs = document.querySelectorAll('#tabelaLixeira tbody tr');

    trs.forEach(tr => {
  const td = tr.querySelector('td:nth-child(2)');
        if (td) {
  const textValue = td.textContent || td.innerText;
  tr.style.display = textValue.toLowerCase().includes(filter) ? '' : 'none';
        }
    });
}

function toggleSelecionarTodos(source) {
    const checkboxes = document.querySelectorAll('.checkboxCliente');
    checkboxes.forEach(checkbox => {
        checkbox.checked = source.checked;
    });
}

async function restaurarSelecionados() {
    const checkboxes = document.querySelectorAll('.checkboxCliente:checked');
    const lixeira = carregarLixeira();
    let clientes = carregarClientes();
    
    let promessasFirebase = []; // Array para guardar as tarefas do Firebase
    let nomesRestaurados = [];

    checkboxes.forEach(checkbox => {
        const nome = checkbox.getAttribute('data-nome');
        const clienteIndex = lixeira.findIndex(c => c.nome.toLowerCase() === nome.toLowerCase());
        
        // Verifica se o cliente existe na lixeira e se NÃO existe um igual na lista ativa
        if (clienteIndex !== -1 && !clientes.some(c => c.nome.toLowerCase() === nome.toLowerCase())) {
            const cliente = lixeira.splice(clienteIndex, 1)[0];
            
            // Adiciona à lista local
            clientes.push(cliente);
            nomesRestaurados.push(cliente.nome);

            // Prepara a tarefa para o Firebase
            if (typeof atualizarDataNoFirebase === "function") {
                promessasFirebase.push(atualizarDataNoFirebase(cliente));
            }
        }
    });

    if (nomesRestaurados.length > 0) {
        // 1. Salva as listas atualizadas no LocalStorage
        salvarClientes(clientes);
        salvarLixeira(lixeira);

        try {
            // 2. Aguarda todos os clientes serem salvos no Firebase
            await Promise.all(promessasFirebase);
            
            exibirFeedback(`${nomesRestaurados.length} cliente(s) restaurado(s) com sucesso no Firebase! ✅`);
            
            // 3. Atualiza a interface
            carregarLixeiraPagina();
            atualizarInfoClientes();
            atualizarTabelaClientes();
            
            // Recarrega para limpar os checkboxes e atualizar tudo
            setTimeout(() => {
                window.location.reload();
            }, 1000);

        } catch (error) {
            console.error("Erro ao sincronizar restauração com Firebase:", error);
            exibirFeedback("Erro ao sincronizar com Firebase, mas os dados locais foram atualizados.");
            window.location.reload();
        }
    } else {
        exibirFeedback("Nenhum cliente restaurado. (Já existem na lista ou nenhum selecionado)");
    }
}

function exibirFeedback(mensagem) {
    let feedbackElement = document.getElementById('feedbackR');
    if (!feedbackElement) {
        feedbackElement = document.createElement('div');
        feedbackElement.id = 'feedbackR';
    document.body.appendChild(feedbackElement);
    }
    feedbackElement.innerText = mensagem;
    feedbackElement.style.display = "block";
    setTimeout(() => {
        feedbackElement.style.display = "none";
    }, 4000);
}

function adicionarCliente() {
    const nomeInput = document.getElementById('inputNome');
    const telefoneInput = document.getElementById('inputTelefone');
    const dataInput = document.getElementById('inputData');
    const horaInput = document.getElementById('inputHora'); 

    const nome = nomeInput.value.trim();
    const telefone = telefoneInput.value.trim();
    const data = dataInput.value;
    const hora = horaInput ? horaInput.value : ""; 

    // Log para conferência técnica
    console.log("Capturando dados para envio:", { nome, telefone, data, hora });

    let erro = false;
    erro |= !validarCampo(nomeInput, nome, "Nome do cliente não pode estar vazio.");
    erro |= !validarCampo(telefoneInput, telefone, "Telefone inválido (11 dígitos).", validarTelefone);
    erro |= !validarCampo(dataInput, data, "Data inválida. Escolha uma data de vencimento.", validarData);

    if (erro) return;

    const nomeNormalizado = nome.toLowerCase(); 
    const clientes = carregarClientes();

    // Verifica se já existe para evitar duplicados locais
    if (clientes.some(c => c.nome.toLowerCase() === nomeNormalizado)) {
        mostrarToast("Cliente com o mesmo nome já existe.", "error"); // Toast substituindo o alert
        return;
    }

    // Gerar a data de vencimento formatada (String)
    const dataVencimentoFormatada = calcularDataVencimento(new Date(data));

    // Criamos o objeto completo. 
    const novoCliente = {
        nome: nomeNormalizado,
        telefone: telefone,
        data: dataVencimentoFormatada, // Ex: "30/03/2026"
        hora: hora 
    };

    // 1. Salva localmente
    clientes.push(novoCliente);
    salvarClientes(clientes);

    // 2. Limpa a tabela visualmente
    const tabela = document.getElementById('corpoTabela');
    if (tabela) {
        tabela.innerHTML = ''; 
    }

    // 3. Sincroniza com o Firebase
    atualizarDataNoFirebase(novoCliente)
        .then(() => {
            mostrarToast("Cliente cadastrado com sucesso!", "success"); // Toast de sucesso
            
            // Aguarda 1.5s para o usuário ler o Toast antes de recarregar a página
            setTimeout(() => {
                window.location.reload(); 
            }, 1500);
        })
        .catch((err) => {
            console.error("❌ Falha na sincronização:", err);
            mostrarToast("Erro ao salvar no servidor: " + err.message, "error"); // Toast de erro
        });
}

function validarCampo(input, valor, mensagemErro, validador = v => v.trim() !== "") {
    if (!validador(valor)) {
        exibirErro(input, mensagemErro);
        return false;
    }
    limparErro(input);
    return true;
}

function validarTelefone(telefone) {
    return /^\d{11}$/.test(telefone);
}

function validarData(data) {
    const d = new Date(data);
    return data && !isNaN(d.getTime());
}

// Lista reutilizável de DDDs válidos do Brasil
const DDD_VALIDOS_BR = [
    "11","12","13","14","15","16","17","18","19", // SP
    "21","22","24", // RJ
    "27","28", // ES
    "31","32","33","34","35","37","38", // MG
    "41","42","43","44","45","46", // PR
    "47","48","49", // SC
    "51","53","54","55", // RS
    "61", // DF
    "62","64", // GO
    "63", // TO
    "65","66", // MT
    "67", // MS
    "68","69", // AC e RO
    "71","73","74","75","77", // BA
    "79", // SE
    "81","82","83","84","85","86","87","88","89", // NE
    "91","92","93","94","95","96","97","98","99"  // Norte
];

// Formata o telefone no padrão internacional +55
function formatarTelefone(telefone) {
    const numeroLimpo = telefone.replace(/\D/g, '');
    return validarTelefone(numeroLimpo) ? `+55${numeroLimpo}` : "Número inválido";
}

// Formata o telefone no padrão brasileiro amigável: (11) 91234-5678
function formatarTelefoneAmigavel(telefone) {
    const numeroLimpo = telefone.replace(/\D/g, '');

    if (!validarTelefone(numeroLimpo)) return "Número inválido";

    const ddd = numeroLimpo.slice(0, 2);
    const parte1 = numeroLimpo.slice(2, 7);
    const parte2 = numeroLimpo.slice(7);

    return `(${ddd}) ${parte1}-${parte2}`;
}

// Exibe uma mensagem de erro visual ao lado do input
function exibirErro(input, mensagem) {
    let erroSpan = input.parentNode.querySelector(".erro-mensagem");

    if (!erroSpan) {
        erroSpan = document.createElement("span");
        erroSpan.className = "erro-mensagem";
        input.parentNode.appendChild(erroSpan);
    }

    erroSpan.textContent = mensagem;
    input.classList.add("input-erro");
}

// Função para limpar o erro do input
function limparErro(input) {
    const erroSpan = input.nextElementSibling;
    if (erroSpan && erroSpan.classList.contains("erro-mensagem")) {
        erroSpan.remove();
    }
    input.classList.remove("input-erro");
}

function calcularDataVencimento(data) {
    let dia = data.getDate() + 1;
    let mes = data.getMonth() + 1;
    let ano = data.getFullYear();
    if (mes > 11) {
        mes = 0;
        ano += 1;
    }
    let dataVencimento = new Date(ano, mes, dia);
    if (dataVencimento.getMonth() !== mes) {
        dataVencimento = new Date(ano, mes + 1, 0);
    }

    // RETORNE COMO STRING PARA O FIREBASE ACEITAR
    return dataVencimento.toLocaleDateString('pt-BR'); 
}

function gerarIdFirebase(nome) {
    return nome.toLowerCase()
        .replace(/\s+/g, '') // remove espaços
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // remove acentos
        .replace(/[.#$/[\]]/g, ''); // remove caracteres inválidos para o Firebase
}

function atualizarCorCelulaData(celulaData, data, hora) {
    let dv;
    if (typeof data === 'string' && data.includes('/')) {
        const [dia, mes, ano] = data.split('/');
        dv = new Date(ano, mes - 1, dia);
    } else {
        dv = new Date(data);
    }

    // Configura a hora exata para o cálculo de "Vencido"
    if (hora && hora.includes(':')) {
        const [h, m] = hora.split(":");
        dv.setHours(parseInt(h), parseInt(m), 0, 0);
    } else {
        dv.setHours(23, 59, 59, 999);
    }

    const agora = new Date();
    const hojeZerado = new Date();
    hojeZerado.setHours(0, 0, 0, 0);

    const dvZerada = new Date(dv);
    dvZerada.setHours(0, 0, 0, 0);
    const diffDias = Math.round((dvZerada - hojeZerado) / (1000 * 60 * 60 * 24));

    celulaData.classList.remove('red', 'yellow', 'orange');

    // REGRA: Se a hora passou, é Vermelho (mesmo sendo hoje)
    if (agora > dv) {
        celulaData.classList.add('red');
    } 
    // Se ainda não passou da hora e é hoje, é Amarelo
    else if (diffDias === 0) {
        celulaData.classList.add('yellow');
    } 
    // Se faltam exatamente 2 dias, é Laranja
    else if (diffDias === 2) {
        celulaData.classList.add('orange');
    }
}

function atualizarTabelaOrdenada() {
    const tabela = document.getElementById('corpoTabela');
    if (!tabela) return;

    let clientes = JSON.parse(localStorage.getItem('clientes')) || [];
    const agora = new Date();
    const hojeZerado = new Date();
    hojeZerado.setHours(0, 0, 0, 0);

    const obterPrioridade = (cliente) => {
        let dv;
        // Tratamento de data string BR (DD/MM/AAAA)
        if (typeof cliente.data === 'string' && cliente.data.includes('/')) {
            const [d, m, a] = cliente.data.split('/');
            dv = new Date(a, m - 1, d);
        } else {
            dv = new Date(cliente.data);
        }
        
        // Ajuste exato da hora para saber se "já passou"
        if (cliente.hora && cliente.hora.includes(':')) {
            const [h, min] = cliente.hora.split(':');
            dv.setHours(parseInt(h), parseInt(min), 0, 0);
        } else {
            dv.setHours(23, 59, 59, 999);
        }

        const dvZerada = new Date(dv);
        dvZerada.setHours(0, 0, 0, 0);
        const diffDias = Math.round((dvZerada - hojeZerado) / (1000 * 60 * 60 * 24));

        // --- DEFINIÇÃO DE PESOS ---
        // 1. Já passou do horário? (Vermelho) -> Peso 5 (FIM)
        if (agora > dv) return 5;

        // 2. Faltam exatamente 2 dias? (Laranja) -> Peso 1 (TOPO)
        if (diffDias === 2) return 1;

        // 3. É hoje e ainda não passou o horário? (Amarelo) -> Peso 2
        if (diffDias === 0) return 2;

        // 4. Clientes renovados/futuros -> Peso 3
        return 3;
    };

    clientes.sort((a, b) => {
        const pA = obterPrioridade(a);
        const pB = obterPrioridade(b);

        if (pA !== pB) return pA - pB;

        // Desempate por data cronológica para renovados
        const dA = new Date(a.data);
        const dB = new Date(b.data);
        if (dA.getTime() !== dB.getTime()) return dA - dB;
        
        return a.nome.localeCompare(b.nome);
    });

    tabela.innerHTML = "";
    clientes.forEach(c => {
        // Usa a função auxiliar para criar as linhas com as cores certas
        adicionarLinhaTabela(c.nome, c.telefone, c.data, c.hora || "");
    });
}

function carregarPagina() {
    // 1. Organiza a tabela principal
    atualizarTabelaOrdenada();

    // 2. Atualiza as estatísticas (Total, Vencidos, etc)
    if (typeof atualizarInfoClientes === "function") {
        atualizarInfoClientes();
    }

    // 3. Atualiza a lista de RENOVADOS (no campo infoClientes)
    if (typeof exibirClientesRenovadosHoje === "function") {
        exibirClientesRenovadosHoje();
    }

    // 4. Atualiza a lista de ALTERADOS (no campo infoClientes2)
    if (typeof exibirClientesAlterados === "function") {
        exibirClientesAlterados();
    }
}

function adicionarLinhaTabela(nome, telefone, data, hora = "") {
    const tabela = document.getElementById('corpoTabela');
    const novaLinha = document.createElement('tr');
    novaLinha.setAttribute('data-nome', nome.toLowerCase()); // garante minúsculo

    const celulaSelecionar = novaLinha.insertCell(0);
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.classList.add('cliente-checkbox');
    celulaSelecionar.appendChild(checkbox);

    const celulaNome = novaLinha.insertCell(1);
    celulaNome.innerText = nome;

    const celulaTelefone = novaLinha.insertCell(2);
    celulaTelefone.innerText = telefone;

    const celulaData = novaLinha.insertCell(3);
    
    // --- CORREÇÃO PARA EVITAR "INVALID DATE" ---
    // Se a data já for uma string formatada (ex: "28/03/2026"), usamos direto.
    // Caso contrário (objeto Date), formatamos agora.
    if (typeof data === 'string' && data.includes('/')) {
        celulaData.innerText = data;
    } else {
        celulaData.innerText = new Date(data).toLocaleDateString('pt-BR');
    }

    // Atualiza cor da célula com data + hora
    // Certifique-se que sua função atualizarCorCelulaData também foi atualizada para ler strings
    atualizarCorCelulaData(celulaData, data, hora);

    const celulaHora = novaLinha.insertCell(4);
    celulaHora.innerText = hora || "";

    const celulaAcoes = novaLinha.insertCell(5);

    // 🔧 Botão de editar cliente
    celulaAcoes.appendChild(criarBotao("Editar", function () {
        const nomeAtual = nome; 
        const telefoneAtual = telefone;
        const dataFormatada = celulaData.innerText; 
        const horaAtual = celulaHora.innerText;
        abrirModalEditar(nomeAtual, telefoneAtual, dataFormatada, horaAtual);
    }));

    // 🗑️ Botão de excluir
    celulaAcoes.appendChild(criarBotao("Excluir", function () {
        const nomeCliente = novaLinha.getAttribute('data-nome');
        if (confirm("Tem certeza de que deseja excluir este cliente?")) {
            excluirCliente(nomeCliente);
        }
    }));

    // 📱 Dropdown de envio (WhatsApp / Telegram)
    const dropdownDiv = document.createElement('div');
    dropdownDiv.classList.add('dropdown');
    const botaoDropdown = document.createElement('button');
    botaoDropdown.innerText = 'WhatsApp';
    botaoDropdown.classList.add('dropbtn');
    const conteudoDropdown = document.createElement('div');
    conteudoDropdown.classList.add('dropdown-content');

    // WhatsApp
    const botaoWhatsApp = document.createElement('button');
    botaoWhatsApp.innerText = 'Enviar para WhatsApp';
    botaoWhatsApp.classList.add('WhatsApp');
  
    botaoWhatsApp.onclick = function () {
        const nomeCliente = nome.toLowerCase();
        const dataVencimento = celulaData.innerText.trim();
        const saudacao = obterSaudacao();
        const telefoneCliente = telefone ? telefone.replace(/\D/g, '') : '';

        if (!telefoneCliente) {
            alert('Número de telefone inválido.');
            return;
        }

        const mensagem = criarMensagemWhatsApp(saudacao, dataVencimento);
        abrirWhatsApp(telefoneCliente, mensagem);
        marcarMensagemEnviada(nomeCliente, botaoWhatsApp);
    };

    function marcarMensagemEnviada(nomeCliente, botao) {
        const hojeLocal = new Date().toLocaleDateString('pt-BR');
        let mensagens = JSON.parse(localStorage.getItem('mensagensEnviadasHoje')) || { data: hojeLocal, nomes: [] };

        if (mensagens.data !== hojeLocal) {
            mensagens = { data: hojeLocal, nomes: [] }; 
        }

        if (!mensagens.nomes.includes(nomeCliente)) {
            mensagens.nomes.push(nomeCliente);
            localStorage.setItem('mensagensEnviadasHoje', JSON.stringify(mensagens));
        }

        botao.innerText = "✅ Enviado";
        botao.disabled = true;
        botao.style.opacity = "0.6";
    }

    conteudoDropdown.appendChild(botaoWhatsApp);

    function obterSaudacao() {
        const horaAtual = new Date().getHours();
        if (horaAtual < 12) return "bom dia";
        if (horaAtual < 18) return "boa tarde";
        return "boa noite";
    }

    function criarMensagemWhatsApp(saudacao, dataVencimento) {
        return encodeURIComponent(
            `*Olá, ${saudacao}!* \n\n` +
            `Seu plano de canais está vencendo em *${dataVencimento}*.\n` +
            `Caso queira renovar após esta data, favor entrar em contato.\n\n` +
            `*PIX EMAIL:* \n\n brunopeaceandlove60@gmail.com`
        );
    }

    function abrirWhatsApp(telefone, mensagem) {
        const url = `https://api.whatsapp.com/send?phone=55${telefone}&text=${mensagem}`;
        window.open(url, '_blank');
    }

    // Telegram
    const botaoTelegram = document.createElement('button');
    botaoTelegram.innerText = 'Enviar para Telegram';
    botaoTelegram.classList.add('telegram');
    botaoTelegram.onclick = function () {
        const dataVencimentoDestacada = celulaData.innerText;
        const saudacao = obterSaudacao();
        const mensagem = encodeURIComponent(
            `Olá ${saudacao}, seu plano de canais está vencendo, com data de vencimento dia ${dataVencimentoDestacada}. Caso queira renovar após esta data, favor entrar em contato. \n\n PIX EMAIL \n\n brunopeaceandlove60@gmail.com`
        );
        const numeroTelefone = telefone.replace(/\D/g, '');
        const urlTelegramShare = `https://t.me/share/url?url=tel:+${numeroTelefone}&text=${mensagem}`;
        window.open(urlTelegramShare, '_blank');
    };
    
    // Verifica se o cliente já recebeu mensagem hoje para manter o botão desativado ao carregar
    const mensagensEnviadas = JSON.parse(localStorage.getItem('mensagensEnviadasHoje')) || { data: "", nomes: [] };
    const hojeCheck = new Date().toLocaleDateString('pt-BR');
    if (mensagensEnviadas.data === hojeCheck && mensagensEnviadas.nomes.includes(nome.toLowerCase())) {
        botaoWhatsApp.innerText = "✅ Enviado";
        botaoWhatsApp.disabled = true;
        botaoWhatsApp.style.opacity = "0.6";
    }
    
    conteudoDropdown.appendChild(botaoTelegram);
    dropdownDiv.appendChild(botaoDropdown);
    dropdownDiv.appendChild(conteudoDropdown);
    celulaAcoes.appendChild(dropdownDiv);

    tabela.appendChild(novaLinha);
}

function criarBotao(texto, acao) {
    const botao = document.createElement('button');
    botao.innerText = texto;
    botao.addEventListener('click', acao);
    return botao;
}

function renovarCliente(nome) {
    const hoje = new Date().toLocaleDateString('pt-BR');
    let clientesHoje = JSON.parse(localStorage.getItem('clientesRenovadosHoje')) || { data: hoje, nomes: [] };
    if (clientesHoje.data !== hoje) {
        clientesHoje = { data: hoje, nomes: [] };
    }
    if (!clientesHoje.nomes.includes(nome)) {
        clientesHoje.nomes.push(nome);
        localStorage.setItem('clientesRenovadosHoje', JSON.stringify(clientesHoje));
        exibirClientesRenovadosHoje();
        
    }
}

function registrarClienteRenovadoHoje(nome) {
    const hoje = new Date().toLocaleDateString('pt-BR');
    let dados = JSON.parse(localStorage.getItem('clientesRenovadosHoje')) || { data: hoje, nomes: [] };

    // Se mudou o dia, reseta a lista
    if (dados.data !== hoje) {
        dados = { data: hoje, nomes: [] };
    }

    // Garante que salvamos apenas o nome (string) e sem duplicatas
    if (!dados.nomes.includes(nome)) {
        dados.nomes.push(nome);
        localStorage.setItem('clientesRenovadosHoje', JSON.stringify(dados));
    }
}

function registrarClienteAlterado(nome) {
    const hoje = new Date().toLocaleDateString('pt-BR');
    
    // 1. Verifica se já está nos RENOVADOS para não duplicar
    let dadosRenovados = JSON.parse(localStorage.getItem('clientesRenovadosHoje')) || { data: hoje, nomes: [] };
    if (dadosRenovados.nomes.includes(nome)) return;

    // 2. Registra nos ALTERADOS
    let clientesAlterados = JSON.parse(localStorage.getItem('clientesAlterados')) || [];
    let registroHoje = clientesAlterados.find(c => c.data === hoje);

    if (!registroHoje) {
        registroHoje = { data: hoje, nomes: [] };
        clientesAlterados.push(registroHoje);
    }

    // Salva como objeto {nome: nome} para manter seu padrão antigo
    if (!registroHoje.nomes.some(c => c.nome === nome)) {
        registroHoje.nomes.push({ nome: nome });
        localStorage.setItem('clientesAlterados', JSON.stringify(clientesAlterados));
    }
}

function exibirClientesRenovadosHoje() {
    const hoje = new Date().toLocaleDateString('pt-BR');
    const campo = document.getElementById('infoClientes'); // <--- ID CORRETO
    if (!campo) return;

    let dados = JSON.parse(localStorage.getItem('clientesRenovadosHoje'));

    if (dados && dados.data === hoje && dados.nomes.length > 0) {
        const lista = dados.nomes
            .map(nome => `<li class="cliente-scroll" data-nome="${nome.toLowerCase()}">${nome}</li>`)
            .join('');

        campo.innerHTML = `<span class="titulo-clientes-renovados">Clientes renovados hoje:</span><ul>${lista}</ul>`;
        if (typeof adicionarEventoScrollClientes === "function") adicionarEventoScrollClientes();
    } else {
        campo.innerHTML = '<span class="nenhum-cliente-renovado">Nenhum cliente renovado hoje</span>';
    }
}

function removerDeRenovadosHoje(nomeCliente) {
    const hoje = new Date().toLocaleDateString('pt-BR');
    let clientesHoje = JSON.parse(localStorage.getItem('clientesRenovadosHoje')) || { data: hoje, nomes: [] };

    // Remove o cliente da lista
    clientesHoje.nomes = clientesHoje.nomes.filter(n => n.toLowerCase() !== nomeCliente.toLowerCase());

    localStorage.setItem('clientesRenovadosHoje', JSON.stringify(clientesHoje));

    // Atualiza a exibição
    exibirClientesRenovadosHoje();
}

function atualizarClientesAlterados(nome, dataAnterior, novaData) {
const hoje = new Date().toLocaleDateString('pt-BR');
let clientesAlterados = JSON.parse(localStorage.getItem('clientesAlterados')) || [];
let clientesHoje = clientesAlterados.find(c => c.data === hoje);

if (!clientesHoje) {
clientesHoje = { data: hoje, nomes: [] };
clientesAlterados.push(clientesHoje);
}

clientesHoje.nomes.push({ nome: nome, dataAnterior: dataAnterior, novaData: novaData });
localStorage.setItem('clientesAlterados', JSON.stringify(clientesAlterados));
exibirClientesAlterados();
}

function exibirClientesAlterados() {
    const hoje = new Date().toLocaleDateString('pt-BR');
    const campo = document.getElementById('infoClientes2'); // <--- ID DIFERENTE
    if (!campo) return;

    let alterados = JSON.parse(localStorage.getItem('clientesAlterados')) || [];
    let registroHoje = alterados.find(c => c.data === hoje);

    if (registroHoje && registroHoje.nomes.length > 0) {
        const lista = registroHoje.nomes
            .map(obj => `<li class="cliente-scroll" data-nome="${obj.nome.toLowerCase()}">${obj.nome}</li>`)
            .join('');

        campo.innerHTML = `<span class="titulo-clientes-alterados">Outras alterações hoje:</span><ul>${lista}</ul>`;
        if (typeof adicionarEventoScrollClientes === "function") adicionarEventoScrollClientes();
    } 
}

function adicionarEventoScrollClientes() {
    document.querySelectorAll('.cliente-scroll').forEach(li => {
        li.addEventListener('click', function () {
            const nome = this.getAttribute('data-nome');
            const linhaCliente = document.querySelector(`tr[data-nome="${nome}"]`);
            if (linhaCliente) {
                linhaCliente.scrollIntoView({ behavior: 'smooth', block: 'center' });

                // Adiciona a classe a cada célula da linha
                linhaCliente.querySelectorAll('td').forEach(td => td.classList.add('destaque-scroll'));

                setTimeout(() => {
                    linhaCliente.querySelectorAll('td').forEach(td => td.classList.remove('destaque-scroll'));
                }, 2000);
            }
        });
    });
}

function atualizarDataVencimento(nomeCliente, novaData) {
    let clientes = JSON.parse(localStorage.getItem('clientes')) || [];
    let clienteExistente = clientes.find(c => c.nome === nomeCliente);

    if (clienteExistente) {
        let dataAnterior = new Date(clienteExistente.data).toLocaleDateString('pt-BR');
        let novaDataFormatada = new Date(novaData).toLocaleDateString('pt-BR');

        if (dataAnterior !== novaDataFormatada) {
            clienteExistente.data = novaData;
            localStorage.setItem('clientes', JSON.stringify(clientes));

            // ✅ Atualiza no Firebase
            atualizarDataNoFirebase(clienteExistente);

            // Atualiza o histórico
            atualizarClientesAlterados(nomeCliente, dataAnterior, novaDataFormatada);
        }
    }
}

function pesquisarCliente() {
    const termoPesquisa = document.getElementById('inputPesquisar').value.toLowerCase();
    const linhas = document.getElementById('corpoTabela').getElementsByTagName('tr');

    for (let i = 0; i < linhas.length; i++) {
        const nome = linhas[i].getElementsByTagName('td')[1].innerText.toLowerCase();
        const telefone = linhas[i].getElementsByTagName('td')[2].innerText.toLowerCase();

        if (nome.includes(termoPesquisa) || telefone.includes(termoPesquisa)) {
            linhas[i].style.display = '';
        } else {
            linhas[i].style.display = 'none';
        }
    }
}

function atualizarInfoClientes() {
    const totalVencidos = calcularTotalClientesVencidos();
    const totalNaoVencidos = calcularTotalClientesNaoVencidos();
    
    const infoDiv = document.getElementById('painelContagem');
    if (!infoDiv) return;

    // Monta os dois cards exatamente como na foto
    infoDiv.innerHTML = `
        <div class="card-contagem card-vencidos">
            Clientes vencidos: ${totalVencidos}
        </div>
        <div class="card-contagem card-ativos">
            Clientes ativos: ${totalNaoVencidos}
        </div>
    `;
}

// 🔹 Função corrigida para contar clientes tratando a String de data
function contarClientesPorCondicao(condicaoCallback) {
    const agora = new Date();
    const clientes = carregarClientes();

    return clientes.reduce((total, cliente) => {
        let dataVencimento;

        // --- CONVERSÃO DA STRING (DD/MM/AAAA) PARA OBJETO DATE ---
        if (typeof cliente.data === 'string' && cliente.data.includes('/')) {
            const [dia, mes, ano] = cliente.data.split('/');
            dataVencimento = new Date(ano, mes - 1, dia);
        } else {
            dataVencimento = new Date(cliente.data);
        }

        // Se cliente tem hora definida, aplica para precisão
        if (cliente.hora && cliente.hora.includes(':')) {
            const [h, m] = cliente.hora.split(":");
            dataVencimento.setHours(parseInt(h), parseInt(m), 0, 0);
        } else {
            // Se não tiver hora, considera o final do dia
            dataVencimento.setHours(23, 59, 59, 999);
        }

        return condicaoCallback(dataVencimento, agora) ? total + 1 : total;
    }, 0);
}

// 🔴 Clientes vencidos
function calcularTotalClientesVencidos() {
    return contarClientesPorCondicao((vencimento, agora) => agora > vencimento);
}

// 🟢 Clientes ainda ativos
function calcularTotalClientesNaoVencidos() {
    return contarClientesPorCondicao((vencimento, agora) => agora <= vencimento);
}

function toggleDarkMode() {
    const isDarkMode = document.body.classList.toggle('dark-mode');

    const footer = document.querySelector('footer');
    if (footer) {
        footer.classList.toggle('dark-mode-footer', isDarkMode);
    }

    // Define que o tema foi escolhido manualmente
    localStorage.setItem('dark-mode', isDarkMode);
    localStorage.setItem('dark-mode-user-set', 'true');
}

function aplicarDarkMode(isDarkMode) {
    document.body.classList.toggle('dark-mode', isDarkMode);

    const footer = document.querySelector('footer');
    if (footer) {
        footer.classList.toggle('dark-mode-footer', isDarkMode);
    }
}

function carregarDarkMode() {
    const userSet = localStorage.getItem('dark-mode-user-set') === 'true';
    let isDarkMode = localStorage.getItem('dark-mode');

    if (isDarkMode === null || isDarkMode === undefined) {
        // Nenhum tema escolhido ainda
        const horaAtual = new Date().getHours();
        isDarkMode = horaAtual >= 18 || horaAtual < 6;
        localStorage.setItem('dark-mode', isDarkMode);
        localStorage.setItem('dark-mode-user-set', 'false'); // automático
    } else {
        isDarkMode = isDarkMode === 'true';
    }

    aplicarDarkMode(isDarkMode);
}

function verificarBackupDiario() {
    // Verificar compatibilidade com localStorage e Blob
    if (typeof Storage === "undefined" || typeof Blob === "undefined") {
        alert("Seu navegador não suporta os recursos necessários para realizar o backup.");
        return;
    }

    const hoje = new Date().toLocaleDateString();
    const ultimoBackup = localStorage.getItem('ultimoBackup');
    
    if (ultimoBackup !== hoje) {
        try {
            // Carregar clientes e lixeira
            const clientes = carregarClientes();
            const lixeira = carregarLixeira();
            
            // Preparar os dados para backup
            const backupData = {
                data: hoje,
                clientes: clientes || [],
                lixeira: lixeira || []
            };

            // Gerar o arquivo de backup
            const backupJson = JSON.stringify(backupData, null, 2);
            const blob = new Blob([backupJson], { type: "application/json" });
            const url = URL.createObjectURL(blob);

            // Criar um link para download
            const a = document.createElement('a');
            a.href = url;
            a.download = `backup-${hoje}.json`;

            // Simular o clique para download automático
            a.click();

            // Limpar o URL do blob
            URL.revokeObjectURL(url);

            // Salvar a data do último backup
            localStorage.setItem('ultimoBackup', hoje);

            // Feedback de sucesso (se desejar)
            mostrarMensagemSucesso("Backup realizado com sucesso!");

        } catch (error) {
            console.error("Erro ao gerar o backup diário:", error);
            alert("Houve um erro ao gerar o backup diário. Tente novamente.");
        }
    }
}

// Função para exibir uma mensagem de sucesso
function mostrarMensagemSucesso(mensagem) {
    const mensagemElemento = document.createElement('div');
    mensagemElemento.textContent = mensagem;
    mensagemElemento.style.position = 'fixed';
    mensagemElemento.style.top = '10px';
    mensagemElemento.style.right = '10px';
    mensagemElemento.style.backgroundColor = '#28a745';
    mensagemElemento.style.color = '#fff';
    mensagemElemento.style.padding = '10px';
    mensagemElemento.style.borderRadius = '5px';
    mensagemElemento.style.zIndex = '1000';
    document.body.appendChild(mensagemElemento);

    // Remover a mensagem após 5 segundos
    setTimeout(() => {
        mensagemElemento.remove();
    }, 5000);
}

// --- EXPORTAR CLIENTES ---
function exportarClientes() {
    const clientes = carregarClientes();
    const lixeira = carregarLixeira();
    // Adicionamos o ID do dono no backup para saber de quem é esse arquivo
    const idDono = localStorage.getItem("id_dono_app") || "nao_identificado";
    
    const dadosParaExportar = {
        id_dono: idDono,
        data_exportacao: new Date().toISOString(),
        clientes: clientes,
        lixeira: lixeira
    };

    const jsonClientes = JSON.stringify(dadosParaExportar, null, 2);
    const blob = new Blob([jsonClientes], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_clientes_${idDono}.json`;
    a.click();

    URL.revokeObjectURL(url);
}

// --- IMPORTAR CLIENTES ---
function importarClientes(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async function(e) {
            try {
                const res = JSON.parse(e.target.result);
                let clientesImportados = [];
                let lixeiraImportada = [];

                // Lógica de detecção do formato do JSON
                if (Array.isArray(res)) {
                    clientesImportados = res;
                } else {
                    clientesImportados = res.clientes || [];
                    lixeiraImportada = res.lixeira || [];
                }

                // 1. Antes de tudo, garante que temos um ID de dono definido no navegador
                // Se não tiver, a função obterIdDono() vai perguntar agora
                const idDonoAtual = obterIdDono();

                const clientesAtuais = carregarClientes();
                const lixeiraAtual = carregarLixeira();

                // 2. Processar Clientes Ativos
                clientesImportados.forEach(novo => {
                    const index = clientesAtuais.findIndex(c => c.nome.toLowerCase() === novo.nome.toLowerCase());
                    if (index !== -1) {
                        clientesAtuais[index].telefone = novo.telefone;
                        clientesAtuais[index].data = novo.data;
                        clientesAtuais[index].hora = novo.hora || ""; // Garante a hora
                    } else {
                        clientesAtuais.push(novo);
                    }
                });

                // 3. Processar Lixeira
                lixeiraImportada.forEach(novo => {
                    const index = lixeiraAtual.findIndex(c => c.nome.toLowerCase() === novo.nome.toLowerCase());
                    if (index !== -1) {
                        lixeiraAtual[index].telefone = novo.telefone;
                        lixeiraAtual[index].data = novo.data;
                    } else {
                        lixeiraAtual.push(novo);
                    }
                });

                // 4. Salvar localmente
                salvarClientes(clientesAtuais);
                salvarLixeira(lixeiraAtual);

                // 5. Enviar para o Firebase (Na pasta do ID do dono atual)
                alert("Importando para o Firebase... Aguarde.");
                
                // Usamos um loop simples para garantir que cada um seja enviado
                for (const cliente of clientesAtuais) {
                    await atualizarDataNoFirebase(cliente);
                }

                alert("Importação e Sincronização realizadas com sucesso!");
                window.location.reload();
            } catch (error) {
                console.error(error);
                alert("Erro ao importar o arquivo: " + error.message);
            }
        };
        reader.readAsText(file);
    }
}

window.addEventListener('load', verificarBackupDiario);
setInterval(verificarBackupDiario, 60 * 60 * 1000);

document.getElementById('select-all').addEventListener('change', function() {
    const checkboxes = document.querySelectorAll('.cliente-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = this.checked;
    });
});

// --- FUNÇÃO DE SINCRONIZAÇÃO COMPLETA ---
async function sincronizarDoFirebase() {
    const btn = document.getElementById('syncFirebase');
    let idDono = localStorage.getItem("id_dono_app");

    // Se não tem ID salvo, abre o modal para o usuário digitar
    if (!idDono || idDono === "padrao") {
        const modal = document.getElementById("modalIdDono");
        if (modal) {
            modal.style.display = "flex";
            // Focamos no input para facilitar a digitação
            document.getElementById("inputTelefoneDono").focus();
        } else {
            alert("Erro: Modal de identificação não encontrado no HTML.");
        }
        return; 
    }

    // Se já tem o ID, prossegue com a busca automática
    realizarBuscaNoFirebase(idDono);
}

async function realizarBuscaNoFirebase(idDono) {
    const btn = document.getElementById('syncFirebase');
    const textoOriginal = btn.innerText;

    try {
        btn.disabled = true;
        btn.innerText = "Buscando dados...";
        
        const snapshot = await firebase.database().ref('usuarios/' + idDono + '/clientes').once('value');
        const dadosFirebase = snapshot.val();

        if (!dadosFirebase) {
            alert("Nenhum backup encontrado para este número.");
            btn.innerText = textoOriginal;
            btn.disabled = false;
            return;
        }

        const novosClientes = [];
        
        Object.keys(dadosFirebase).forEach(nomeChave => {
            const clienteFb = dadosFirebase[nomeChave];
            let dataFinal;
            
            // LÓGICA DE TRATAMENTO DE DATA (Suporta ISO e Brasileiro)
            const dataRaw = clienteFb.vencimento || clienteFb.data;

            if (dataRaw && typeof dataRaw === 'string') {
                if (dataRaw.includes('T')) {
                    // Se for formato ISO (2026-05-01T03:00:00.000Z)
                    dataFinal = new Date(dataRaw);
                } else if (dataRaw.includes('/')) {
                    // Se for formato Brasileiro (02/04/2026)
                    const partes = dataRaw.split('/');
                    dataFinal = new Date(partes[2], partes[1] - 1, partes[0]);
                } else {
                    dataFinal = new Date(dataRaw);
                }
            } else {
                dataFinal = new Date(); // Fallback
            }

            // Se a data resultou em "Invalid Date", coloca a data de hoje para não quebrar
            if (isNaN(dataFinal.getTime())) {
                dataFinal = new Date();
            }

            novosClientes.push({
                nome: nomeChave, 
                telefone: clienteFb.telefone || "",
                data: dataFinal.toISOString(), // Salvamos como string para padronizar
                hora: clienteFb.hora || "" 
            });
        });

        localStorage.setItem("id_dono_app", idDono);
        salvarClientes(novosClientes);
        
        alert(`Sucesso! ${novosClientes.length} clientes restaurados.`);
        window.location.reload();

    } catch (error) {
        console.error("Erro na sincronização:", error);
        alert("Erro ao conectar com o banco de dados.");
        btn.innerText = textoOriginal;
        btn.disabled = false;
    }
}

async function excluirClientesSelecionados() {
    const checkboxes = document.querySelectorAll('.cliente-checkbox:checked');
    const clientes = carregarClientes();
    const lixeira = carregarLixeira();
    let promessasFirebase = []; // Para armazenar as exclusões do Firebase
    let clientesExcluidosContagem = 0;

    checkboxes.forEach(checkbox => {
        const linha = checkbox.closest('tr');
        if (!linha) return;

        const nome = linha.getAttribute('data-nome');
        const clienteIndex = clientes.findIndex(c => c.nome.toLowerCase() === nome.toLowerCase());

        if (clienteIndex !== -1) {
            // 1. Remove do array principal e guarda o objeto
            const cliente = clientes.splice(clienteIndex, 1)[0];
            
            // 2. Adiciona à lixeira local
            lixeira.push(cliente);
            
            // 3. Prepara a exclusão no Firebase
            // Certifique-se de que o nome da função seja removerClienteDoFirebase ou excluirClienteDoFirebase
            if (typeof removerClienteDoFirebase === "function") {
                promessasFirebase.push(removerClienteDoFirebase(nome));
            }
            
            clientesExcluidosContagem++;
            
            // 4. (Opcional) Remove da lista de renovados hoje se estiver lá
            if (typeof removerDeRenovadosHoje === "function") {
                removerDeRenovadosHoje(nome);
            }
        }
    });

    if (clientesExcluidosContagem > 0) {
        // Tocar som de exclusão
        try {
            const somExclusao = new Audio('sounds/exclusao.mp3');
            somExclusao.play();
        } catch (e) { console.log("Som não disponível"); }

        // Salva as alterações locais
        salvarClientes(clientes);
        salvarLixeira(lixeira);

        try {
            // Espera o Firebase confirmar a exclusão de todos os selecionados
            await Promise.all(promessasFirebase);
            
            // Atualiza a interface
            carregarLixeiraPagina();
            atualizarTabelaClientes();
            atualizarInfoClientes();
            
            const feedbackElement = document.getElementById('feedback');
            if (feedbackElement) {
                feedbackElement.innerText = `${clientesExcluidosContagem} cliente(s) movido(s) para a lixeira e removido(s) da nuvem.`;
                feedbackElement.style.display = "block";
                setTimeout(() => { feedbackElement.style.display = "none"; }, 4000);
            }

            // Recarrega para limpar a seleção e atualizar tudo
            setTimeout(() => {
                window.location.reload();
            }, 500);

        } catch (error) {
            console.error("Erro ao excluir do Firebase:", error);
            alert("Erro ao excluir alguns clientes da nuvem, mas foram movidos para a lixeira local.");
            window.location.reload();
        }
    } else {
        alert("Nenhum cliente selecionado para excluir.");
    }
}

function atualizarDataNoFirebase(cliente) {
    const idDono = obterIdDono(); 
    const idCliente = gerarIdFirebase(cliente.nome);
    const caminho = 'usuarios/' + idDono + '/clientes/' + idCliente;

    return firebase.database().ref(caminho).set({
        nome: cliente.nome,
        telefone: cliente.telefone,
        vencimento: cliente.data, // Aqui agora chegará a string "30/03/2026"
        hora: cliente.hora || ""   
    }).then(() => {
        console.log("✅ Sincronizado com sucesso!");
    }).catch((error) => {
        console.error("❌ Erro ao salvar:", error);
    });
}

function abrirModalCadastro() {
    document.getElementById("modalCadastro").style.display = "block";
}

function fecharModalCadastro() {
    document.getElementById("modalCadastro").style.display = "none";
}

// Fecha o modal ao clicar fora dele
window.onclick = function(event) {
    const modal = document.getElementById("modalCadastro");
    if (event.target === modal) {
        modal.style.display = "none";
    }
}

const messaging = firebase.messaging();

async function registrarToken() {
    console.log("🔥 registrarToken() foi chamado!");

    try {
        const status = await Notification.requestPermission();

        if (status !== "granted") {
            console.warn("❌ Permissão negada");
            return;
        }

        // ⚠️ REGISTRA O SW NA RAIZ (Essencial para GitHub Pages e para o Push funcionar)
        // Removi a pasta /firebase-messaging/ pois o SW deve estar na raiz para ter escopo total
        const swFirebase = await navigator.serviceWorker.register("firebase-messaging-sw.js");

        console.log("✔ SW Firebase Messaging carregado:", swFirebase);

        // GERA O TOKEN USANDO O REGISTRO DO SW ACIMA
        const token = await messaging.getToken({
            vapidKey: "BLjysHYuYMCgWcARiaeByArVexcnPcBD5q57wcmqDuLx9fNgJAPfksen9mCE8Df7I_KCPhOPxD57SH6IHWof6qc",
            serviceWorkerRegistration: swFirebase
        });

        console.log("🔑 TOKEN GERADO:", token);

        if (!token) {
            console.warn("⚠️ Firebase não retornou token");
            return;
        }

        // 1. Salva o token no seu banco de dados (na pasta do usuário)
        salvarTokenNoRealtime(token);

        // 2. EXECUTA A VERIFICAÇÃO DE VENCIMENTOS (Nova alteração)
        // Assim que o app abre e registra o token, ele já avisa se alguém vence em 2 dias
        if (typeof verificarVencimentosENotificar === "function") {
            verificarVencimentosENotificar();
        }

    } catch (e) {
        console.error("❌ Erro ao registrar token:", e);
    }
}

// Garante que o registro aconteça ao carregar a página
window.addEventListener("load", registrarToken);

// Salvar token no Realtime Database
function salvarTokenNoRealtime(token) {
    const idDono = obterIdDono(); // Pega o id do dono (seu telefone)

    if (!idDono || idDono === "padrao") {
        console.warn("⚠️ Token não salvo: ID do dono não identificado.");
        return;
    }

    // Salva APENAS nas configurações do seu usuário
    firebase.database().ref(`usuarios/${idDono}/config/fcm_token`).set({
        token: token,
        criadoEm: new Date().toISOString()
    })
    .then(() => {
        console.log("✔ Token vinculado exclusivamente ao seu usuário no Firebase");
    })
    .catch((error) => {
        console.error("❌ Erro ao salvar token no usuário:", error);
    });
}

function verificarVencimentosENotificar() {
    const clientes = carregarClientes(); // Sua função que busca do LocalStorage
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    clientes.forEach(cliente => {
        let dataVencimento;
        
        // Converte "DD/MM/AAAA" para objeto Date
        if (typeof cliente.data === 'string' && cliente.data.includes('/')) {
            const [dia, mes, ano] = cliente.data.split('/');
            dataVencimento = new Date(ano, mes - 1, dia);
        } else {
            dataVencimento = new Date(cliente.data);
        }
        dataVencimento.setHours(0, 0, 0, 0);

        // Calcula a diferença
        const diffMs = dataVencimento - hoje;
        const diferencaDias = Math.round(diffMs / (1000 * 60 * 60 * 24));

        // Se faltarem exatamente 2 dias
        if (diferencaDias === 2) {
            enviarNotificacaoLocal(cliente.nome);
        }
    });
}

function enviarNotificacaoLocal(nomeCliente) {
    if (Notification.permission === "granted") {
        navigator.serviceWorker.ready.then(registration => {
            registration.showNotification("Vencimento em 2 dias! ⏳", {
                body: `O cliente ${nomeCliente} está próximo do vencimento.`,
                icon: "/img/icon192.png",
                tag: `vencimento-${nomeCliente}`, // Evita repetir a mesma notificação
                renotify: true
            });
        });
    }
}

function abrirModalEditar(nome, telefone, data, hora) {
    document.getElementById("editNomeAntigo").value = nome;
    document.getElementById("editNome").value = nome;
    document.getElementById("editTelefone").value = telefone;
    
    // Converte data de PT-BR (DD/MM/AAAA) para o formato do input date (AAAA-MM-DD)
    const partes = data.split('/');
    if(partes.length === 3) {
        const dataFormatada = `${partes[2]}-${partes[1].padStart(2, '0')}-${partes[0].padStart(2, '0')}`;
        document.getElementById("editData").value = dataFormatada;
    }
    
    document.getElementById("editHora").value = hora || "";
    document.getElementById("modalEditar").style.display = "block";
}

function fecharModalEditar() {
    document.getElementById("modalEditar").style.display = "none";
}

function salvarEdicaoCliente() {
    const nomeAntigo = document.getElementById("editNomeAntigo").value;
    const novoNome = document.getElementById("editNome").value.trim().toLowerCase();
    const novoTelefone = document.getElementById("editTelefone").value.trim();
    const novaDataRaw = document.getElementById("editData").value; // Formato AAAA-MM-DD
    const novaHora = document.getElementById("editHora").value;

    if (!novoNome || !novoTelefone || !novaDataRaw) {
        mostrarToast("⚠️ Preencha todos os campos!", "#ff9800");
        return;
    }

    const clientes = carregarClientes();
    const clienteIndex = clientes.findIndex(c => c.nome.toLowerCase() === nomeAntigo.toLowerCase());

    if (clienteIndex !== -1) {
        const clienteAnterior = clientes[clienteIndex];
        let mensagensFeedback = [];

        // 1. Tratamento da Data
        const partesData = novaDataRaw.split('-');
        const novaDataFormatadaStr = `${partesData[2]}/${partesData[1]}/${partesData[0]}`;

        // Lógica de Renovação
        if (clienteAnterior.data !== novaDataFormatadaStr) {
            mensagensFeedback.push("Cliente renovado ✅");
            if (typeof registrarClienteRenovadoHoje === "function") {
                registrarClienteRenovadoHoje(novoNome);
                deduzirCredito();
            }
        }

        // 2. Mudança de Nome
        if (nomeAntigo.toLowerCase() !== novoNome) {
            mensagensFeedback.push("Nome alterado ✅");
            if (typeof removerClienteDoFirebase === "function") {
                removerClienteDoFirebase(nomeAntigo);
            }
            if (typeof registrarClienteAlterado === "function") {
                registrarClienteAlterado(novoNome);
            }
        }

        // 3. Mudança de Telefone
        if (clienteAnterior.telefone !== novoTelefone) {
            if (nomeAntigo.toLowerCase() === novoNome) {
                mensagensFeedback.push("Telefone alterado ✅");
            }
        }

        const clienteAtualizado = {
            nome: novoNome,
            telefone: novoTelefone,
            data: novaDataFormatadaStr,
            hora: novaHora || ""
        };

        clientes[clienteIndex] = clienteAtualizado;
        salvarClientes(clientes);

        // 4. Sincroniza com o Firebase
        atualizarDataNoFirebase(clienteAtualizado)
            .then(() => {
                // FEEDBACK BONITO (TOAST)
                if (mensagensFeedback.length > 0) {
                    mostrarToast(mensagensFeedback.join(' | '));
                } else {
                    mostrarToast("Alterações salvas! ✅");
                }

                // ATUALIZAÇÃO DA INTERFACE
                if (typeof atualizarTabelaOrdenada === "function") {
                    atualizarTabelaOrdenada();
                }

                if (typeof exibirClientesRenovadosHoje === "function") {
                    exibirClientesRenovadosHoje();
                }

                if (typeof fecharModalEditar === "function") {
                    fecharModalEditar();
                }
            })
            .catch(err => {
                console.error("Erro ao sincronizar:", err);
                mostrarToast("Erro ao sincronizar ❌", "#f44336");
                setTimeout(() => window.location.reload(), 2000);
            });
    }
}

function mostrarToast(mensagem) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast-card';
    // Removi a linha toast.style.backgroundColor para usar a do CSS
    toast.innerHTML = `<span>${mensagem}</span>`;
    
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = "toastFadeOut 0.4s forwards";
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

// 1. Função que apenas retorna o ID se ele já existir
function obterIdDono() {
    return localStorage.getItem("id_dono_app") || "padrao";
}

// 2. Função que verifica se precisa abrir o modal ao carregar o app
function verificarIdentificador() {
    const idExistente = localStorage.getItem("id_dono_app");
    
    if (!idExistente) {
        document.getElementById("modalIdDono").style.display = "flex";
    }
}

// 3. Função chamada pelo botão do Modal
function confirmarIdDono() {
    const input = document.getElementById("inputTelefoneDono");
    let telefone = input.value.replace(/\D/g, ''); // Limpa caracteres especiais

    if (telefone.length >= 8) {
        // Salva o ID
        localStorage.setItem("id_dono_app", telefone);
        
        // Esconde o modal
        document.getElementById("modalIdDono").style.display = "none";
        
        // Chama a função de busca que definimos acima
        realizarBuscaNoFirebase(telefone);
    } else {
        alert("Por favor, digite um número de telefone válido com DDD.");
    }
}

// Valor fixo de cada crédito
const VALOR_POR_RENOVACAO = 9.00;

// 1. Atualiza os dois displays na tela
function atualizarDisplayCreditos(quantidade, valorTotal) {
    document.getElementById("displayQuantidade").innerText = quantidade;
    
    // Formata o valor acumulado em Reais (R$ 0,00)
    document.getElementById("displayReais").innerText = `R$ ${valorTotal.toLocaleString('pt-BR', {minimumFractionDigits: 2})}`;
}

// 2. Carrega ao abrir o sistema
function carregarCreditos() {
    let creditos = localStorage.getItem("meus_creditos");
    let valorAcumulado = localStorage.getItem("valor_acumulado");
    
    // Se for a primeira vez, inicia com 1500 créditos e R$ 0,00
    if (creditos === null) {
        creditos = 1500;
        localStorage.setItem("meus_creditos", creditos);
    }
    if (valorAcumulado === null) {
        valorAcumulado = 0.00;
        localStorage.setItem("valor_acumulado", valorAcumulado);
    }
    
    atualizarDisplayCreditos(parseInt(creditos), parseFloat(valorAcumulado));
}

// 3. Função para ser chamada na Renovação (Deduz 1 crédito e SOMA R$ 9,00)
function deduzirCredito() {
    let creditos = parseInt(localStorage.getItem("meus_creditos")) || 1500;
    let valorAcumulado = parseFloat(localStorage.getItem("valor_acumulado")) || 0.00;
    
    if (creditos > 0) {
        creditos -= 1;           // Diminui o crédito
        valorAcumulado += VALOR_POR_RENOVACAO; // Soma o valor ganho
        
        // Salva os novos valores
        localStorage.setItem("meus_creditos", creditos);
        localStorage.setItem("valor_acumulado", valorAcumulado);
        
        // Atualiza a tela
        atualizarDisplayCreditos(creditos, valorAcumulado);
        
        mostrarToast("Cliente renovado! +R$ 9,00", "success");
    } else {
        mostrarToast("Créditos esgotados!", "error");
    }
}

// --- FUNÇÃO PARA EDITAR CRÉDITOS E VALORES ---
function editarCreditos() {
    const creditosAtuais = localStorage.getItem("meus_creditos") || 1500;
    const valorAtual = localStorage.getItem("valor_acumulado") || 0;

    // Pede a nova quantidade de créditos
    const novoCredito = prompt("Digite a nova quantidade de créditos:", creditosAtuais);
    if (novoCredito === null) return; // Usuário cancelou

    // Pede o novo valor em reais
    const novoValor = prompt("Digite o valor acumulado em R$:", valorAtual);
    if (novoValor === null) return; // Usuário cancelou

    // Validação
    if (!isNaN(novoCredito) && !isNaN(novoValor)) {
        localStorage.setItem("meus_creditos", novoCredito);
        localStorage.setItem("valor_acumulado", novoValor);
        
        // Atualiza a tela imediatamente
        atualizarDisplayCreditos(parseInt(novoCredito), parseFloat(novoValor));
        mostrarToast("Saldo atualizado manualmente!", "success");
    } else {
        mostrarToast("Erro: Valores inválidos!", "error");
    }
}

// Inicia ao carregar a página
document.addEventListener("DOMContentLoaded", carregarCreditos);