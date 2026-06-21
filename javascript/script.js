// ===============================
// 1 — REGISTRAR O SW PRINCIPAL DO PWA
// ===============================

if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      
        navigator.serviceWorker.register("service-worker.js")
            .then(reg => {
                console.log("✅ SW PRINCIPAL registrado:", reg);

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

// ================================================================
// 1. FUNÇÃO DE SEGURANÇA (VERIFICAÇÃO DE EXISTÊNCIA)
// ================================================================
async function verificarExistenciaNoBanco() {
    const idDono = localStorage.getItem("id_dono_app");
    
    // Se não há ID ou é o padrão, permite carregar a tela inicial/login
    if (!idDono || idDono === "padrao") return true;

    try {
        // 1. Verificação imediata ao abrir o App
        const snapshot = await firebase.database().ref('usuarios/' + idDono).once('value');
        
        if (!snapshot.exists()) {
            console.warn("🚫 Conta não encontrada no servidor. Limpando dados locais...");
            
            // Limpa TUDO para o app não tentar fazer backup e recriar o nó no Firebase
            localStorage.clear(); 
            sessionStorage.clear(); 
            
            alert("⚠️ Sua conta foi excluída ou desativada pelo administrador.");
            window.location.reload(); 
            return false;
        }

        firebase.database().ref('usuarios/' + idDono).on('value', (snap) => {
            if (!snap.exists()) {
                console.warn("🚫 Conta excluída em tempo real.");
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
            }
        });

        // 3. Verificação de Status (Opcional: Se quiser bloquear sem excluir)
        const dados = snapshot.val();
        if (dados && dados.status === "bloqueado") {
            alert("⚠️ Seu acesso está temporariamente suspenso.");
            localStorage.clear();
            window.location.reload();
            return false;
        }

        return true;
    } catch (error) {
        console.error("Erro na verificação de segurança:", error);
        // Em caso de erro de conexão, permite o uso offline para não frustrar o usuário
        return true;
    }
}

// Função para o usuário trocar o Pix manualmente
function configurarMeuPix() {
    const pixAtual = localStorage.getItem("meu_pix") || "brunopeaceandlove60@gmail.com";
    const novoPix = prompt("Digite sua chave PIX para cobranças:", pixAtual);
    
    if (novoPix !== null && novoPix.trim() !== "") {
        const pixLimpo = novoPix.trim();
        localStorage.setItem("meu_pix", pixLimpo);
        
        const idDono = localStorage.getItem("id_dono_app");
        if (idDono && idDono !== "padrao") {
            firebase.database().ref('usuarios/' + idDono).update({
                chavePix: pixLimpo
            });
        }
        alert("✅ Chave PIX atualizada!");
        if (typeof carregarPagina === "function") carregarPagina();
    }
}

// ================================================================
// 2. INICIALIZAÇÃO DO DOM
// ================================================================

document.addEventListener("DOMContentLoaded", async () => {
    
    // --- TRAVA DE SEGURANÇA E CARREGAMENTO DE DADOS DO USUÁRIO ---
    const acessoPermitido = await verificarExistenciaNoBanco();
    if (!acessoPermitido) return; 

    // 1. Controle do Tema (Persistência do Modo Claro/Escuro)
    const carregarTemaInicial = () => {
        const savedDarkMode = localStorage.getItem('dark-mode');
        const userSet = localStorage.getItem('dark-mode-user-set');
        const body = document.body;

        if (userSet === 'true') {
            const isDark = savedDarkMode === 'true';
            body.classList.toggle('dark-mode', isDark);
            body.classList.toggle('light-mode', !isDark);

            const footer = document.querySelector('footer');
            if (footer) {
                footer.classList.toggle('dark-mode-footer', isDark);
            }
        }
        
        if (localStorage.getItem("id_dono_app")) {
            atualizarStatusOnline();
        }
        
        if (typeof verificarBloqueioMaster === "function") verificarBloqueioMaster();
    };
    
    carregarTemaInicial();

    // 2. Controle do Loader e Inicialização do Tema Sazonal
    const loading = document.getElementById("loading");
    const hasVisited = sessionStorage.getItem("hasVisited");

    const esconderLoader = () => {
        if (loading) {
            loading.classList.add("hidden");
            setTimeout(() => {
                loading.style.display = "none";
                if (typeof ThemeManager !== 'undefined') {
                    ThemeManager.init();
                }
            }, 500);
        }
    };

    if (!hasVisited) {
        sessionStorage.setItem("hasVisited", "true");
        setTimeout(esconderLoader, 3000);
    } else {
        esconderLoader();
    }

    // 3. Chamadas de Inicialização Únicas
    if (typeof carregarLixeiraPagina === "function") carregarLixeiraPagina();
    if (typeof exibirClientesAlterados === "function") exibirClientesAlterados();
    if (typeof exibirClientesRenovadosHoje === "function") exibirClientesRenovadosHoje();
    if (typeof carregarDarkMode === "function") carregarDarkMode(); 
    if (typeof verificarBackupDiario === "function") verificarBackupDiario();
    if (typeof verificarIdentificador === "function") verificarIdentificador();
    
    if (typeof carregarCreditos === "function") {
        carregarCreditos();
    }
    
    if (typeof carregarPagina === "function") {
        carregarPagina();
        // Atualiza a cada 30 segundos
        setInterval(carregarPagina, 30 * 1000); 
    }

    // 4. Lógica de Identificação e Botão de Recuperação
    const clientesLocais = typeof carregarClientes === "function" ? carregarClientes() : []; 
    const btnSync = document.getElementById('syncFirebase');
    const idDonoSalvo = localStorage.getItem("id_dono_app");

    if (!clientesLocais || clientesLocais.length === 0) {
        if (btnSync) {
            btnSync.style.display = "block";
            btnSync.innerText = "Restaurar meus clientes (via Telefone) 🔄";
        }
    } 
    else if (!idDonoSalvo) {
        setTimeout(() => {
            if (typeof obterIdDono === "function") obterIdDono();
        }, 1000);
        if (btnSync) btnSync.style.display = "none";
    }
    else {
        if (btnSync) btnSync.style.display = "none";
    }

    // 5. Listeners de Eventos (Inputs, Checkboxes e Scroll)
    const selectAll = document.getElementById('select-all');
    if (selectAll) {
        selectAll.addEventListener('change', function() {
            const checkboxes = document.querySelectorAll('.cliente-checkbox');
            checkboxes.forEach(checkbox => {
                checkbox.checked = this.checked;
            });
        });
    }

    const importarInput = document.getElementById("importarClientes");
    if (importarInput) {
        importarInput.addEventListener("change", importarClientes);
    }

    if (typeof window.onscroll === "function") {
        window.onscroll();
    }

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
    
    const clienteIndex = lixeira.findIndex(c => c.nome.toLowerCase() === nome.toLowerCase());

    if (clienteIndex !== -1) {

        const clienteParaRestaurar = lixeira.splice(clienteIndex, 1)[0];

        clientes.push(clienteParaRestaurar);
        
        salvarClientes(clientes);
        salvarLixeira(lixeira);

        atualizarDataNoFirebase(clienteParaRestaurar)
            .then(() => {
                console.log("✅ Cliente restaurado com sucesso no Firebase!");
                
                carregarLixeiraPagina();
                atualizarInfoClientes();
                atualizarTabelaClientes();
                
                window.location.reload();
            })
            .catch(err => {
                console.error("❌ Erro ao restaurar no Firebase:", err);
                
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

        const clienteRemovido = clientes.splice(clienteIndex, 1)[0];
        
        salvarClientes(clientes);

        // 4. MOVE PARA A LIXEIRA
        const lixeira = carregarLixeira() || [];
        lixeira.push(clienteRemovido);
        salvarLixeira(lixeira);

        removerDeRenovadosHoje(nome);
        
        removerClienteDoFirebase(nome).then(() => {
            console.log("✅ Removido do Firebase e movido para lixeira");
            
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
    const idDono = obterIdDono();
    const idCliente = gerarIdFirebase(nomeCliente);
    
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
    
    let promessasFirebase = [];
    let nomesRestaurados = [];

    checkboxes.forEach(checkbox => {
        const nome = checkbox.getAttribute('data-nome');
        const clienteIndex = lixeira.findIndex(c => c.nome.toLowerCase() === nome.toLowerCase());
        
        if (clienteIndex !== -1 && !clientes.some(c => c.nome.toLowerCase() === nome.toLowerCase())) {
            const cliente = lixeira.splice(clienteIndex, 1)[0];
            
            clientes.push(cliente);
            nomesRestaurados.push(cliente.nome);

            if (typeof atualizarDataNoFirebase === "function") {
                promessasFirebase.push(atualizarDataNoFirebase(cliente));
            }
        }
    });

    if (nomesRestaurados.length > 0) {

        salvarClientes(clientes);
        salvarLixeira(lixeira);

        try {
         
            await Promise.all(promessasFirebase);
            
            exibirFeedback(`${nomesRestaurados.length} cliente(s) restaurado(s) com sucesso no Firebase! ✅`);
            
            carregarLixeiraPagina();
            atualizarInfoClientes();
            atualizarTabelaClientes();
            
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

async function adicionarCliente() {
    const nomeInput = document.getElementById('inputNome');
    const telefoneInput = document.getElementById('inputTelefone');
    const dataInput = document.getElementById('inputData');
    const horaInput = document.getElementById('inputHora'); 

    const nome = nomeInput.value.trim();
    const telefone = telefoneInput.value.trim();
    const dataRaw = dataInput.value; 
    const hora = horaInput ? horaInput.value : ""; 

    if (!nome || !telefone || !dataRaw) {
        mostrarToast("⚠️ Preencha todos os campos!", "error");
        return;
    }

    const nomeNormalizado = nome.toLowerCase(); 
    const clientes = carregarClientes();

    if (clientes.some(c => c.nome.toLowerCase() === nomeNormalizado)) {
        mostrarToast("Cliente já existe.", "error"); 
        return;
    }

    const partes = dataRaw.split('-');
    const dataSelecionada = new Date(partes[0], partes[1] - 1, partes[2]); 
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    let diffMeses = (dataSelecionada.getFullYear() - hoje.getFullYear()) * 12;
    diffMeses += dataSelecionada.getMonth() - hoje.getMonth();

    let mesesParaCobrar = diffMeses + 1;
    if (mesesParaCobrar <= 0) mesesParaCobrar = 1;
    const dataVencimento = new Date(partes[0], partes[1] - 1, partes[2]);
    dataVencimento.setMonth(dataVencimento.getMonth() + 1);

    const dia = String(dataVencimento.getDate()).padStart(2, '0');
    const mes = String(dataVencimento.getMonth() + 1).padStart(2, '0');
    const ano = dataVencimento.getFullYear();
    const dataVencimentoFormatada = `${dia}/${mes}/${ano}`;

    const novoCliente = {
        nome: nomeNormalizado,
        telefone: telefone,
        data: dataVencimentoFormatada,
        hora: hora 
    };

    clientes.push(novoCliente);
    salvarClientes(clientes);

    atualizarDataNoFirebase(novoCliente)
        .then(async () => {
            if (typeof deduzirCredito === "function") {
                await deduzirCredito(mesesParaCobrar); 
            }
            
            mostrarToast(`Cadastrado: ${mesesParaCobrar} mês(es) cobrados! ✅`, "success");
            
            setTimeout(() => {
                window.location.reload(); 
            }, 1500);
        })
        .catch((err) => {
            console.error("❌ Erro:", err);
            mostrarToast("Erro ao salvar.", "error");
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

function formatarTelefoneAmigavel(telefone) {
    const numeroLimpo = telefone.replace(/\D/g, '');

    if (!validarTelefone(numeroLimpo)) return "Número inválido";

    const ddd = numeroLimpo.slice(0, 2);
    const parte1 = numeroLimpo.slice(2, 7);
    const parte2 = numeroLimpo.slice(7);

    return `(${ddd}) ${parte1}-${parte2}`;
}

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

    return dataVencimento.toLocaleDateString('pt-BR'); 
}

function gerarIdFirebase(nome) {
    return nome.toLowerCase()
        .replace(/\s+/g, '')
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[.#$/[\]]/g, '');
}

function atualizarCorCelulaData(celulaData, data, hora, telefone, todosClientes = []) {
    let dv;
    
    if (typeof data === 'string' && data.includes('/')) {
        const [dia, mes, ano] = data.split('/');
        dv = new Date(ano, mes - 1, dia);
    } else {
        dv = new Date(data);
    }

    
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
    celulaData.style.border = "none";
    celulaData.style.borderRadius = "0";

    if (telefone && todosClientes.length > 0) {

        const duplicados = todosClientes.filter(c => c.telefone === telefone);
        
        if (duplicados.length > 1 && diffDias === 2) {
            celulaData.style.border = "2px solid #00ff00";
            celulaData.style.borderRadius = "4px";
            celulaData.title = "Atenção: Este número está duplicado e vence em 2 dias!";
        }
    }

    if (agora > dv) {
        
        celulaData.classList.add('red');
    } 
    else if (diffDias === 0) {
        
        celulaData.classList.add('yellow');
    } 
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
        
        if (typeof cliente.data === 'string' && cliente.data.includes('/')) {
            const [d, m, a] = cliente.data.split('/');
            dv = new Date(a, m - 1, d);
        } else {
            dv = new Date(cliente.data);
        }
        
        if (cliente.hora && cliente.hora.includes(':')) {
            const [h, min] = cliente.hora.split(':');
            dv.setHours(parseInt(h), parseInt(min), 0, 0);
        } else {
            dv.setHours(23, 59, 59, 999);
        }

        const dvZerada = new Date(dv);
        dvZerada.setHours(0, 0, 0, 0);
        const diffDias = Math.round((dvZerada - hojeZerado) / (1000 * 60 * 60 * 24));

        if (agora > dv) return 5;
        if (diffDias === 2) return 1;
        if (diffDias === 0) return 2;
        return 3;
    };

    clientes.sort((a, b) => {
        const pA = obterPrioridade(a);
        const pB = obterPrioridade(b);

        if (pA !== pB) return pA - pB;

        const dA = new Date(a.data);
        const dB = new Date(b.data);
        if (dA.getTime() !== dB.getTime()) return dA - dB;
        
        return a.nome.localeCompare(b.nome);
    });

    tabela.innerHTML = "";

    clientes.forEach(c => {
        adicionarLinhaTabela(
            c.nome, 
            c.telefone, 
            c.data, 
            c.hora || "", 
            clientes
        );
    });
}

function carregarPagina() {
   
    atualizarTabelaOrdenada();

    if (typeof atualizarInfoClientes === "function") {
        atualizarInfoClientes();
    }

    if (typeof exibirClientesRenovadosHoje === "function") {
        exibirClientesRenovadosHoje();
    }

    if (typeof exibirClientesAlterados === "function") {
        exibirClientesAlterados();
    }
}

function adicionarLinhaTabela(nome, telefone, data, hora = "", listaCompleta = []) {
    const tabela = document.getElementById('corpoTabela');
    const novaLinha = document.createElement('tr');
    novaLinha.setAttribute('data-nome', nome.toLowerCase());

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
    
    // Tratamento seguro de exibição da data na tabela
    if (typeof data === 'string' && data.includes('/')) {
        celulaData.innerText = data;
    } else if (typeof data === 'string' && data.includes('T')) {
        // Se vier no formato ISO (2026-06-21T03:00:00.000Z), limpa e exibe em formato BR
        const apenasData = data.split('T')[0].split('-');
        celulaData.innerText = `${apenasData[2]}/${apenasData[1]}/${apenasData[0]}`;
    } else {
        celulaData.innerText = new Date(data).toLocaleDateString('pt-BR');
    }

    if (typeof atualizarCorCelulaData === "function") {
        atualizarCorCelulaData(celulaData, data, hora, telefone, listaCompleta);
    }

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

    // Botão WhatsApp
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

        // --- 🌟 FILTRAGEM DE USUÁRIOS CORRIGIDA (BLINDADA CONTRA FUSO HORÁRIO) ---
        let usuariosVencendoEmDoisDias = [];
        if (Array.isArray(listaCompleta) && listaCompleta.length > 0) {
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0); 

            usuariosVencendoEmDoisDias = listaCompleta.filter(c => {
                const telLimpo = c.telefone ? c.telefone.replace(/\D/g, '') : '';
                if (telLimpo !== telefoneCliente) return false;

                let ano, mes, dia;
                const valorData = c.data || c.vencimento || "";

                if (!valorData) return false;

                // 1. Trata se for formato ISO completo
                if (valorData.includes('T')) {
                    const apenasData = valorData.split('T')[0].split('-');
                    ano = parseInt(apenasData[0], 10);
                    mes = parseInt(apenasData[1], 10) - 1;
                    dia = parseInt(apenasData[2], 10);
                } 
                // 2. Trata se for formato BR tradicional
                else if (valorData.includes('/')) {
                    const partes = valorData.split('/');
                    dia = parseInt(partes[0], 10);
                    mes = parseInt(partes[1], 10) - 1;
                    ano = parseInt(partes[2], 10);
                }
                // 3. Trata se for input tipo date americano (AAAA-MM-DD)
                else if (valorData.includes('-')) {
                    const partes = valorData.split('-');
                    ano = parseInt(partes[0], 10);
                    mes = parseInt(partes[1], 10) - 1;
                    dia = parseInt(partes[2], 10);
                }

                if (!ano || isNaN(mes) || !dia) return false;

                // Cria o objeto de data local pura zerada
                const dataVenc = new Date(ano, mes, dia, 0, 0, 0, 0);
                
                // Calcula a diferença exata de dias arredondando com Math.round para evitar quebras por horas
                const diferencaTempo = dataVenc.getTime() - hoje.getTime();
                const diferencaDias = Math.round(diferencaTempo / (1000 * 60 * 60 * 24));

                return diferencaDias === 2;
            });
        }

        const mensagem = criarMensagemWhatsApp(saudacao, dataVencimento, usuariosVencendoEmDoisDias);
        abrirWhatsApp(telefoneCliente, mensagem); 
        
        marcarListaComoEnviada(usuariosVencendoEmDoisDias);
    };

    // Auxiliar Atualizado: Salva todos os usuários e atualiza os botões visíveis na tela
    function marcarListaComoEnviada(listaUsuarios) {
        const hojeLocal = new Date().toLocaleDateString('pt-BR');
        let mensagens = JSON.parse(localStorage.getItem('mensagensEnviadasHoje')) || { data: hojeLocal, nomes: [] };

        if (mensagens.data !== hojeLocal) {
            mensagens = { data: hojeLocal, nomes: [] }; 
        }

        listaUsuarios.forEach(user => {
            const nomeFormatado = user.nome.toLowerCase();
            if (!mensagens.nomes.includes(nomeFormatado)) {
                mensagens.nomes.push(nomeFormatado);
            }
        });

        localStorage.setItem('mensagensEnviadasHoje', JSON.stringify(mensagens));

        listaUsuarios.forEach(user => {
            const nomeProcurado = user.nome.toLowerCase();
            const linhaDaTabela = document.querySelector(`tr[data-nome="${nomeProcurado}"]`);
            if (linhaDaTabela) {
                const btnWhatsLinha = linhaDaTabela.querySelector('.WhatsApp');
                if (btnWhatsLinha) {
                    btnWhatsLinha.innerText = "✅ Enviado";
                    btnWhatsLinha.disabled = true;
                    btnWhatsLinha.style.opacity = "0.6";
                }
            }
        });
    }

    conteudoDropdown.appendChild(botaoWhatsApp);

    function obterSaudacao() {
        const horaAtual = new Date().getHours();
        if (horaAtual < 12) return "bom dia";
        if (horaAtual < 18) return "boa tarde";
        return "boa noite";
    }

    function criarMensagemWhatsApp(saudacao, dataVencimento, listaUsuarios = []) {
        const pixDoUsuario = localStorage.getItem("meu_pix") || "brunopeaceandlove60@gmail.com";

        let texto = `*Olá, ${saudacao}!* \n\n` +
            `Seu plano de canais está vencendo em *${dataVencimento}*.\n` +
            `Caso queira renovar após esta data, favor entrar em contato.\n\n`;

        texto += `*CHAVE PIX:* \n\n ${pixDoUsuario}\n\n`;

        if (listaUsuarios.length > 0) {
            listaUsuarios.forEach((user, index) => {
                texto += `\n\nUsuário ${index + 1}:  *${user.nome}*`;
            });
            texto += `\n`; 
        }

        return encodeURIComponent(texto);
    }

    function abrirWhatsApp(telefone, mensagem) {
        const url = `https://api.whatsapp.com/send?phone=55${telefone}&text=${mensagem}`;
        window.open(url, '_blank');
    }

    // Botão Telegram
    const botaoTelegram = document.createElement('button');
    botaoTelegram.innerText = 'Enviar para Telegram';
    botaoTelegram.classList.add('telegram');
    
    botaoTelegram.onclick = function () {
        const dataVencimentoDestacada = celulaData.innerText.trim();
        const saudacao = obterSaudacao();
        const telefoneCliente = telefone ? telefone.replace(/\D/g, '') : '';
        const pixDoUsuario = localStorage.getItem("meu_pix") || "brunopeaceandlove60@gmail.com";

        // --- 🌟 FILTRAGEM DE USUÁRIOS IGUALMENTE CORRIGIDA PARA O TELEGRAM ---
        let usuariosVencendoEmDoisDias = [];
        if (Array.isArray(listaCompleta) && listaCompleta.length > 0) {
            const hoje = new Date();
            hoje.setHours(0, 0, 0, 0);

            usuariosVencendoEmDoisDias = listaCompleta.filter(c => {
                const telLimpo = c.telefone ? c.telefone.replace(/\D/g, '') : '';
                if (telLimpo !== telefoneCliente) return false;

                let ano, mes, dia;
                const valorData = c.data || c.vencimento || "";

                if (!valorData) return false;

                if (valorData.includes('T')) {
                    const apenasData = valorData.split('T')[0].split('-');
                    ano = parseInt(apenasData[0], 10);
                    mes = parseInt(apenasData[1], 10) - 1;
                    dia = parseInt(apenasData[2], 10);
                } else if (valorData.includes('/')) {
                    const partes = valorData.split('/');
                    dia = parseInt(partes[0], 10);
                    mes = parseInt(partes[1], 10) - 1;
                    ano = parseInt(partes[2], 10);
                } else if (valorData.includes('-')) {
                    const partes = valorData.split('-');
                    ano = parseInt(partes[0], 10);
                    mes = parseInt(partes[1], 10) - 1;
                    dia = parseInt(partes[2], 10);
                }

                if (!ano || isNaN(mes) || !dia) return false;

                const dataVenc = new Date(ano, mes, dia, 0, 0, 0, 0);
                const diferencaTempo = dataVenc.getTime() - hoje.getTime();
                const diferencaDias = Math.round(diferencaTempo / (1000 * 60 * 60 * 24));

                return diferencaDias === 2;
            });
        }

        let textoTelegram = `Olá ${saudacao}, seu plano de canais está vencendo, com data de vencimento dia ${dataVencimentoDestacada}. ` +
            `Caso queira renovar após esta data, favor entrar em contato. \n\n`;

        if (usuariosVencendoEmDoisDias.length > 0) {
            textoTelegram += `*Usuários vencendo em 2 dias:*\n`;
            usuariosVencendoEmDoisDias.forEach((user, index) => {
                textoTelegram += `Usuário ${index + 1}: ${user.nome}\n`;
            });
            textoTelegram += `\n`;
        }

        textoTelegram += `*CHAVE PIX:* \n\n ${pixDoUsuario}`;

        const urlTelegramShare = `https://t.me/share/url?url=${encodeURIComponent(' ') }&text=${encodeURIComponent(textoTelegram)}`;
        window.open(urlTelegramShare, '_blank');
    };

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

    if (!registroHoje.nomes.some(c => c.nome === nome)) {
        registroHoje.nomes.push({ nome: nome });
        localStorage.setItem('clientesAlterados', JSON.stringify(clientesAlterados));
    }
}

function exibirClientesRenovadosHoje() {
    const hoje = new Date().toLocaleDateString('pt-BR');
    const campo = document.getElementById('infoClientes');
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

            atualizarDataNoFirebase(clienteExistente);

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

    infoDiv.innerHTML = `
        <div class="card-contagem card-vencidos">
            Clientes vencidos: ${totalVencidos}
        </div>
        <div class="card-contagem card-ativos">
            Clientes ativos: ${totalNaoVencidos}
        </div>
    `;
}

function contarClientesPorCondicao(condicaoCallback) {
    const agora = new Date();
    const clientes = carregarClientes();

    return clientes.reduce((total, cliente) => {
        let dataVencimento;

        if (typeof cliente.data === 'string' && cliente.data.includes('/')) {
            const [dia, mes, ano] = cliente.data.split('/');
            dataVencimento = new Date(ano, mes - 1, dia);
        } else {
            dataVencimento = new Date(cliente.data);
        }

        if (cliente.hora && cliente.hora.includes(':')) {
            const [h, m] = cliente.hora.split(":");
            dataVencimento.setHours(parseInt(h), parseInt(m), 0, 0);
        } else {
           
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
    
    document.body.classList.toggle('light-mode', !isDarkMode);

    const footer = document.querySelector('footer');
    if (footer) {
        footer.classList.toggle('dark-mode-footer', isDarkMode);
    }

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
       
        const horaAtual = new Date().getHours();
        isDarkMode = horaAtual >= 18 || horaAtual < 6;
        localStorage.setItem('dark-mode', isDarkMode);
        localStorage.setItem('dark-mode-user-set', 'false'); // automático
    } else {
        isDarkMode = isDarkMode === 'true';
    }

    aplicarDarkMode(isDarkMode);
}

// 📑 Função auxiliar para garantir que as datas salvas no backup fiquem no formato correto DD/MM/AAAA
function formatarParaBackupDiario(dataString) {
    if (!dataString) return "";

    // 1. Se contiver o "T" (Formato ISO: 2025-11-20T03:00:00.000Z)
    if (dataString.includes('T')) {
        const dataObj = new Date(dataString);
        if (!isNaN(dataObj.getTime())) {
            const dataLocal = new Date(dataObj.getTime() + dataObj.getTimezoneOffset() * 60000);
            const dia = String(dataLocal.getDate()).padStart(2, '0');
            const mes = String(dataLocal.getMonth() + 1).padStart(2, '0');
            const ano = dataLocal.getFullYear();
            return `${dia}/${mes}/${ano}`;
        }
    }
    
    // 2. Se for formato americano puro de input (AAAA-MM-DD)
    if (dataString.includes('-')) {
        const partes = dataString.split('-');
        if (partes.length === 3 && partes[0].length === 4) {
            return `${partes[2]}/${partes[1]}/${partes[0]}`;
        }
    }

    return dataString;
}

// 📦 FUNÇÃO DE BACKUP INTELIGENTE (Firebase com Fallback para LocalStorage se estiver sem internet)
async function verificarBackupDiario() {
    if (typeof Storage === "undefined" || typeof Blob === "undefined") {
        console.warn("⚠️ Navegador incompatível com backups!");
        return;
    }

    const hoje = new Date().toLocaleDateString();
    const ultimoBackup = localStorage.getItem('ultimoBackup');
    
    // Só executa se for a primeira vez abrindo o app no dia
    if (ultimoBackup !== hoje) {
        let clientesOriginais = [];
        let lixeiraOriginal = [];
        let origemDosDados = "Firebase";

        // Obtém o ID do dono para buscar o nó correto
        const idDono = localStorage.getItem("id_dono_app") || "nao_identificado";

        // 1. Tenta baixar os dados em tempo real do Firebase primeiro (Se houver internet)
        if (navigator.onLine && typeof db !== "undefined") {
            try {
                // Cria uma promessa com tempo limite (timeout) de 4 segundos para o Firebase não travar a página se a internet estiver oscilando
                const snapshot = await Promise.race([
                    db.ref('usuarios/' + idDono).once('value'),
                    new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 4000))
                ]);

                if (snapshot.exists()) {
                    const dadosUsuario = snapshot.val();
                    
                    // Converte o objeto de clientes do Firebase em uma Array padrão para o backup JSON
                    if (dadosUsuario.clientes) {
                        clientesOriginais = Object.keys(dadosUsuario.clientes).map(id => dadosUsuario.clientes[id]);
                    }
                    if (dadosUsuario.lixeira) {
                        lixeiraOriginal = Object.keys(dadosUsuario.lixeira).map(id => dadosUsuario.lixeira[id]);
                    }
                }
            } catch (error) {
                console.warn("Firebase inacessível ou lento demais. Mudando para o LocalStorage...", error);
                origemDosDados = "LocalStorage (Modo Offline)";
            }
        } else {
            origemDosDados = "LocalStorage (Dispositivo Offline)";
        }

        // 2. CASO SEJA OFFLINE OU O FIREBASE FALHE: Carrega os dados salvos localmente
        if (clientesOriginais.length === 0 && lixeiraOriginal.length === 0) {
            if (typeof carregarClientes === "function") {
                clientesOriginais = carregarClientes() || [];
            }
            if (typeof carregarLixeira === "function") {
                lixeiraOriginal = carregarLixeira() || [];
            }
        }

        // 3. Executa a limpeza e padronização das datas de segurança
        try {
            const clientesPadronizados = clientesOriginais.map(cliente => {
                return {
                    ...cliente,
                    data: formatarParaBackupDiario(cliente.data || cliente.vencimento)
                };
            });

            const lixeiraPadronizada = lixeiraOriginal.map(cliente => {
                return {
                    ...cliente,
                    data: formatarParaBackupDiario(cliente.data || cliente.vencimento)
                };
            });
            
            // Monta a estrutura final do arquivo JSON de Backup
            const backupData = {
                id_dono: idDono,
                data_backup: hoje,
                origem_dos_dados: origemDosDados,
                clientes: clientesPadronizados,
                lixeira: lixeiraPadronizada
            };

            const backupJson = JSON.stringify(backupData, null, 2);
            const blob = new Blob([backupJson], { type: "application/json" });
            const url = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `backup_diario_${hoje.replace(/\//g, '-')}.json`;
            a.click();

            URL.revokeObjectURL(url);

            // Salva a flag no LocalStorage para não disparar o download novamente no mesmo dia
            localStorage.setItem('ultimoBackup', hoje);

            if (typeof mostrarToast === "function") {
                mostrarToast(`📦 Backup diário (${origemDosDados}) salvo com sucesso! ✅`);
            }

        } catch (error) {
            console.error("Erro crítico ao gerar o backup diário:", error);
            if (typeof mostrarToast === "function") {
                mostrarToast("❌ Falha crítica no backup automático.", "#f44336");
            }
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

// Função auxiliar interna para garantir que o texto que vai pro JSON seja DD/MM/AAAA
function formatarParaExportacao(dataString) {
    if (!dataString) return "";

    // Se a data contiver o "T" (Formato ISO: 2026-04-11T03:00:00.000Z)
    if (dataString.includes('T')) {
        const dataObj = new Date(dataString);
        if (!isNaN(dataObj.getTime())) {
            // Corrige o fuso horário para pegar o dia correto local
            const dataLocal = new Date(dataObj.getTime() + dataObj.getTimezoneOffset() * 60000);
            const dia = String(dataLocal.getDate()).padStart(2, '0');
            const mes = String(dataLocal.getMonth() + 1).padStart(2, '0');
            const ano = dataLocal.getFullYear();
            return `${dia}/${mes}/${ano}`; // Retorna 11/04/2026
        }
    }
    
    // Se for o formato americano puro (AAAA-MM-DD) convertido por algum input do tipo date
    if (dataString.includes('-')) {
        const partes = dataString.split('-');
        if (partes.length === 3 && partes[0].length === 4) {
            return `${partes[2]}/${partes[1]}/${partes[0]}`; // Transforma em DD/MM/AAAA
        }
    }

    return dataString;
}

function exportarClientes() {
    // Carrega as listas originais
    const clientes = carregarClientes();
    const lixeira = carregarLixeira();

    // 🌟 PADRONIZAÇÃO NA EXPORTAÇÃO: Passa limpando a data de cada cliente da lista ativa
    const clientesPadronizados = clientes.map(cliente => {
        return {
            ...cliente,
            data: formatarParaExportacao(cliente.data)
        };
    });

    // 🌟 Passa limpando a data de cada cliente da lixeira também
    const lixeiraPadronizada = lixeira.map(cliente => {
        return {
            ...cliente,
            data: formatarParaExportacao(cliente.data)
        };
    });

    const idDono = localStorage.getItem("id_dono_app") || "nao_identificado";
    
    // Monta o objeto final usando as listas limpas e padronizadas
    const dadosParaExportar = {
        id_dono: idDono,
        data_exportacao: new Date().toISOString(),
        clientes: clientesPadronizados, // Lista corrigida
        lixeira: lixeiraPadronizada      // Lista corrigida
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


// 📑 Adicione essa mini função auxiliar para converter o formato ISO para DD/MM/AAAA caso necessário
function padronizarDataParaBr(dataString) {
    if (!dataString) return "";

    // Se a data contiver o "T" (Formato ISO: 2025-11-20T03:00:00.000Z)
    if (dataString.includes('T')) {
        const dataObj = new Date(dataString);
        if (!isNaN(dataObj.getTime())) {
            // Ajusta o fuso horário para não mudar o dia ao converter
            const dataLocal = new Date(dataObj.getTime() + dataObj.getTimezoneOffset() * 60000);
            const dia = String(dataLocal.getDate()).padStart(2, '0');
            const mes = String(dataLocal.getMonth() + 1).padStart(2, '0');
            const ano = dataLocal.getFullYear();
            return `${dia}/${mes}/${ano}`; // Retorna formatado lindamente: 20/11/2025
        }
    }
    
    // Se já estiver no formato correto ou outro texto, mantém como está
    return dataString;
}

function importarClientes(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = async function(e) {
            try {
                const res = JSON.parse(e.target.result);
                let clientesImportados = [];
                let lixeiraImportada = [];

                if (Array.isArray(res)) {
                    clientesImportados = res;
                } else {
                    clientesImportados = res.clientes || [];
                    lixeiraImportada = res.lixeira || [];
                }

                const idDonoAtual = obterIdDono();

                const clientesAtuais = carregarClientes();
                const lixeiraAtual = carregarLixeira();

                clientesImportados.forEach(novo => {
                    // 🌟 PADRONIZAÇÃO AQUI: Garante que a data que está entrando vira DD/MM/AAAA
                    novo.data = padronizarDataParaBr(novo.data);

                    const index = clientesAtuais.findIndex(c => c.nome.toLowerCase() === novo.nome.toLowerCase());
                    if (index !== -1) {
                        clientesAtuais[index].telefone = novo.telefone;
                        clientesAtuais[index].data = novo.data; // Agora salva limpa
                        clientesAtuais[index].hora = novo.hora || ""; 
                    } else {
                        clientesAtuais.push(novo);
                    }
                });

                lixeiraImportada.forEach(novo => {
                    // 🌟 PADRONIZAÇÃO NA LIXEIRA TAMBÉM
                    novo.data = padronizarDataParaBr(novo.data);

                    const index = lixeiraAtual.findIndex(c => c.nome.toLowerCase() === novo.nome.toLowerCase());
                    if (index !== -1) {
                        lixeiraAtual[index].telefone = novo.telefone;
                        lixeiraAtual[index].data = novo.data;
                    } else {
                        lixeiraAtual.push(novo);
                    }
                });

                salvarClientes(clientesAtuais);
                salvarLixeira(lixeiraAtual);

                alert("Importando e padronizando no Firebase... Aguarde.");
                
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

    if (!idDono || idDono === "padrao") {
        const modal = document.getElementById("modalIdDono");
        if (modal) {
            modal.style.display = "flex";

            document.getElementById("inputTelefoneDono").focus();
        } else {
            alert("Erro: Modal de identificação não encontrado no HTML.");
        }
        return; 
    }

    realizarBuscaNoFirebase(idDono);
}

async function realizarBuscaNoFirebase(idDono) {
    const btn = document.getElementById('syncFirebase');
    const textoOriginal = btn.innerText;

    try {
        btn.disabled = true;
        btn.innerText = "Verificando conta...";
        
        const snapshot = await firebase.database().ref('usuarios/' + idDono).once('value');
        const usuarioFull = snapshot.val();

        if (!usuarioFull) {
            alert("Nenhum backup encontrado para este número.");
            btn.innerText = textoOriginal;
            btn.disabled = false;
            return; 
        }

        const senhaSalva = usuarioFull.senhaSeguranca;
        
        if (senhaSalva) {
            const senhaDigitada = prompt("🔒 Conta Protegida!\n\nDigite sua SENHA DE SEGURANÇA para restaurar seus clientes:");

            if (senhaDigitada === null) {
                btn.innerText = textoOriginal;
                btn.disabled = false;
                return;
            }

            if (senhaDigitada !== senhaSalva) {
                alert("❌ Senha incorreta! Acesso negado.");
                btn.innerText = textoOriginal;
                btn.disabled = false;
                return;
            }
        }

        btn.innerText = "Restaurando clientes...";
        const dadosFirebase = usuarioFull.clientes;

        if (!dadosFirebase) {
            alert("Você possui um cadastro, mas sua lista de clientes está vazia.");
            localStorage.setItem("id_dono_app", idDono);
            if (usuarioFull.chavePix) localStorage.setItem("meu_pix", usuarioFull.chavePix);
            window.location.reload();
            return;
        }

        const novosClientes = [];
        Object.keys(dadosFirebase).forEach(nomeChave => {
            const clienteFb = dadosFirebase[nomeChave];
            let dataFinal;
            const dataRaw = clienteFb.vencimento || clienteFb.data;

            if (dataRaw && typeof dataRaw === 'string') {
                if (dataRaw.includes('T')) {
                    dataFinal = new Date(dataRaw);
                } else if (dataRaw.includes('/')) {
                    const partes = dataRaw.split('/');
                    dataFinal = new Date(partes[2], partes[1] - 1, partes[0]);
                } else {
                    dataFinal = new Date(dataRaw);
                }
            } else {
                dataFinal = new Date(); 
            }

            if (isNaN(dataFinal.getTime())) {
                dataFinal = new Date();
            }

            novosClientes.push({
                nome: nomeChave, 
                telefone: clienteFb.telefone || "",
                data: dataFinal.toISOString(), 
                hora: clienteFb.hora || "" 
            });
        });

        localStorage.setItem("id_dono_app", idDono);
        
        if (usuarioFull.chavePix) {
            localStorage.setItem("meu_pix", usuarioFull.chavePix);
        }
        
        salvarClientes(novosClientes);
        
        alert(`✅ Sucesso! ${novosClientes.length} clientes restaurados.`);
        
        const modal = document.getElementById("modalIdDono");
        if (modal) modal.style.display = "none";
        
        window.location.reload();

    } catch (error) {
        console.error("Erro na sincronização:", error);
        alert("Erro ao conectar com o banco de dados. Verifique sua conexão.");
        btn.innerText = textoOriginal;
        btn.disabled = false;
    }
}

async function excluirClientesSelecionados() {
    const checkboxes = document.querySelectorAll('.cliente-checkbox:checked');
    const clientes = carregarClientes();
    const lixeira = carregarLixeira();
    let promessasFirebase = [];
    let clientesExcluidosContagem = 0;

    checkboxes.forEach(checkbox => {
        const linha = checkbox.closest('tr');
        if (!linha) return;

        const nome = linha.getAttribute('data-nome');
        const clienteIndex = clientes.findIndex(c => c.nome.toLowerCase() === nome.toLowerCase());

        if (clienteIndex !== -1) {
            
            const cliente = clientes.splice(clienteIndex, 1)[0];
            
            lixeira.push(cliente);
            
            if (typeof removerClienteDoFirebase === "function") {
                promessasFirebase.push(removerClienteDoFirebase(nome));
            }
            
            clientesExcluidosContagem++;
            
            if (typeof removerDeRenovadosHoje === "function") {
                removerDeRenovadosHoje(nome);
            }
        }
    });

    if (clientesExcluidosContagem > 0) {
        
        try {
            const somExclusao = new Audio('sounds/exclusao.mp3');
            somExclusao.play();
        } catch (e) { console.log("Som não disponível"); }

        salvarClientes(clientes);
        salvarLixeira(lixeira);

        try {
          
            await Promise.all(promessasFirebase);
            
            carregarLixeiraPagina();
            atualizarTabelaClientes();
            atualizarInfoClientes();
            
            const feedbackElement = document.getElementById('feedback');
            if (feedbackElement) {
                feedbackElement.innerText = `${clientesExcluidosContagem} cliente(s) movido(s) para a lixeira e removido(s) da nuvem.`;
                feedbackElement.style.display = "block";
                setTimeout(() => { feedbackElement.style.display = "none"; }, 4000);
            }

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


// parte 1
function atualizarDataNoFirebase(cliente) {
    const idDono = obterIdDono(); 
    const idCliente = gerarIdFirebase(cliente.nome);
    const caminho = 'usuarios/' + idDono + '/clientes/' + idCliente;

    return firebase.database().ref(caminho).set({
        nome: cliente.nome,
        telefone: cliente.telefone,
        vencimento: cliente.data,
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

        const swFirebase = await navigator.serviceWorker.register("firebase-messaging-sw.js");

        console.log("✔ SW Firebase Messaging carregado:", swFirebase);

        const token = await messaging.getToken({
            vapidKey: "BLjysHYuYMCgWcARiaeByArVexcnPcBD5q57wcmqDuLx9fNgJAPfksen9mCE8Df7I_KCPhOPxD57SH6IHWof6qc",
            serviceWorkerRegistration: swFirebase
        });

        console.log("🔑 TOKEN GERADO:", token);

        if (!token) {
            console.warn("⚠️ Firebase não retornou token");
            return;
        }

        salvarTokenNoRealtime(token);

        if (typeof verificarVencimentosENotificar === "function") {
            verificarVencimentosENotificar();
        }

    } catch (e) {
        console.error("❌ Erro ao registrar token:", e);
    }
}

window.addEventListener("load", registrarToken);

function salvarTokenNoRealtime(token) {
    const idDono = obterIdDono();

    if (!idDono || idDono === "padrao") {
        console.warn("⚠️ Token não salvo: ID do dono não identificado.");
        return;
    }

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
    const clientes = carregarClientes();
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    clientes.forEach(cliente => {
        let dataVencimento;
        
        if (typeof cliente.data === 'string' && cliente.data.includes('/')) {
            const [dia, mes, ano] = cliente.data.split('/');
            dataVencimento = new Date(ano, mes - 1, dia);
        } else {
            dataVencimento = new Date(cliente.data);
        }
        dataVencimento.setHours(0, 0, 0, 0);

        const diffMs = dataVencimento - hoje;
        const diferencaDias = Math.round(diffMs / (1000 * 60 * 60 * 24));

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
                tag: `vencimento-${nomeCliente}`,
                renotify: true
            });
        });
    }
}

function abrirModalEditar(nome, telefone, data, hora) {
    document.getElementById("editNomeAntigo").value = nome;
    document.getElementById("editNome").value = nome;
    document.getElementById("editTelefone").value = telefone;
    
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
    const novaDataRaw = document.getElementById("editData").value;
    const novaHora = document.getElementById("editHora").value;

    const VALOR_POR_MES = 9.00;

    if (!novoNome || !novoTelefone || !novaDataRaw) {
        mostrarToast("⚠️ Preencha todos os campos!", "#ff9800");
        return;
    }

    const clientes = carregarClientes();
    const clienteIndex = clientes.findIndex(c => c.nome.toLowerCase() === nomeAntigo.toLowerCase());

    if (clienteIndex !== -1) {
        const clienteAnterior = clientes[clienteIndex];
        let mensagensFeedback = [];

        const partesNova = novaDataRaw.split('-'); 
        const dataNovaObj = new Date(partesNova[0], partesNova[1] - 1, partesNova[2]);
        const novaDataFormatadaStr = `${partesNova[2]}/${partesNova[1]}/${partesNova[0]}`;

        // Lógica de segurança para data "vencido"
        let dataAntigaObj;
        if (clienteAnterior.data === "vencido" || !clienteAnterior.data.includes('/')) {
            dataAntigaObj = new Date();
        } else {
            const partesAntiga = clienteAnterior.data.split('/');
            dataAntigaObj = new Date(partesAntiga[2], partesAntiga[1] - 1, partesAntiga[0]);
        }

        // 1. Verificação de Renovação
        if (clienteAnterior.data !== novaDataFormatadaStr) {
            let diffMeses = (dataNovaObj.getFullYear() - dataAntigaObj.getFullYear()) * 12;
            diffMeses += dataNovaObj.getMonth() - dataAntigaObj.getMonth();

            if (diffMeses > 0) {
                const valorTotal = diffMeses * VALOR_POR_MES;
                const confirmar = confirm(`Renovação: ${diffMeses} mês(es).\nDescontar ${diffMeses} crédito(s) e somar R$ ${valorTotal.toFixed(2)} ao financeiro?`);
                
                if (confirmar) {
                    if (typeof deduzirCredito === "function") deduzirCredito(diffMeses);
                    if (typeof adicionarValorAoFinanceiro === "function") adicionarValorAoFinanceiro(valorTotal);
                    if (typeof registrarClienteRenovadoHoje === "function") registrarClienteRenovadoHoje(novoNome);
                    
                    mensagensFeedback.push(`Renovado (${diffMeses}m): -${diffMeses} Créditos | +R$ ${valorTotal.toFixed(2)} ✅`);
                } else {
                    
                    mostrarToast("Renovação cancelada! Alterações não foram salvas.", "#f44336");
                    return;
                }
            }
        }

        if (nomeAntigo.toLowerCase() !== novoNome) {
            mensagensFeedback.push("Nome alterado ✅");
            if (typeof removerClienteDoFirebase === "function") removerClienteDoFirebase(nomeAntigo);
            if (typeof registrarClienteAlterado === "function") registrarClienteAlterado(novoNome);
        }

        if (clienteAnterior.telefone !== novoTelefone) {
            mensagensFeedback.push("Telefone alterado ✅");
        }

        const clienteAtualizado = {
            nome: novoNome,
            telefone: novoTelefone,
            data: novaDataFormatadaStr,
            hora: novaHora || "",
            renovado: (clienteAnterior.data !== novaDataFormatadaStr) 
        };

        clientes[clienteIndex] = clienteAtualizado;
        salvarClientes(clientes);

        atualizarDataNoFirebase(clienteAtualizado)
            .then(() => {
                if (mensagensFeedback.length > 0) {
                    mostrarToast(mensagensFeedback.join(' | '));
                } else {
                    mostrarToast("Cliente atualizado! ✅");
                }
                if (typeof atualizarTabelaOrdenada === "function") atualizarTabelaOrdenada();
                if (typeof exibirClientesRenovadosHoje === "function") exibirClientesRenovadosHoje();
                if (typeof fecharModalEditar === "function") fecharModalEditar();
            })
            .catch(err => {
                console.error("Erro ao sincronizar:", err);
                mostrarToast("Erro ao sincronizar ❌", "#f44336");
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
    toast.innerHTML = `<span>${mensagem}</span>`;
    
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = "toastFadeOut 0.4s forwards";
        setTimeout(() => toast.remove(), 400);
    }, 3000);
}

function obterIdDono() {
    return localStorage.getItem("id_dono_app") || "padrao";
}

function verificarIdentificador() {
    const idExistente = localStorage.getItem("id_dono_app");
    
    if (!idExistente) {
        document.getElementById("modalIdDono").style.display = "flex";
    }
}

const TELEFONE_MASTER = "81982258462";
const SENHA_MASTER = "9436631200";

function confirmarIdDono() {
    const input = document.getElementById("inputTelefoneDono");
    
    let telefone = input.value.replace(/\D/g, ''); 
    
    const TELEFONE_MASTER = "81982258462";

    if (telefone.length < 8) {
        alert("⚠️ Por favor, digite um número de telefone válido com DDD (apenas números).");
        return;
    }

    if (telefone === TELEFONE_MASTER) {
        console.log("👑 Acesso Master detectado. Solicitando senha de administrador...");
        const modalAdm = document.getElementById("modalSenhaAdm");
        if (modalAdm) {
            modalAdm.style.display = "flex";
        } else {
            alert("Erro: Modal de administração não encontrado no HTML.");
        }
        return; 
    }

    console.log("🔍 Iniciando busca de backup para o ID: " + telefone);
    
    if (typeof realizarBuscaNoFirebase === "function") {
        realizarBuscaNoFirebase(telefone);
    } else {
        console.error("Erro: A função realizarBuscaNoFirebase não foi carregada corretamente.");
        alert("Ocorreu um erro técnico. Por favor, recarregue a página.");
    }
}

async function entrarComoNovo() {
    const input = document.getElementById("inputTelefoneDono");
    let telefone = input.value.replace(/\D/g, '');

    if (telefone.length < 8) {
        alert("Por favor, digite um número de telefone válido com DDD.");
        return;
    }

    const userRef = firebase.database().ref('usuarios/' + telefone);

    try {
        const snapshot = await userRef.once('value');

        if (snapshot.exists()) {
            alert("⚠️ Já existe um usuário cadastrado com este número. Se você já tem cadastro, use a opção de restaurar.");
            return;
        }

        let pixInserido = "";
        while (true) {
            pixInserido = prompt("🚀 BEM-VINDO!\n\nInsira sua chave PIX.\nEla será enviada junto com a mensagem personalizada para seus clientes.");

            if (pixInserido === null) {
                alert("Cadastro cancelado. O PIX é obrigatório.");
                return;
            }

            if (pixInserido.trim() !== "") {
                pixInserido = pixInserido.trim();
                break;
            }
            alert("⚠️ Erro: A chave PIX não pode estar em branco.");
        }

        let senhaSeguranca = "";
        while (true) {
            senhaSeguranca = prompt("🔐 CRIE UMA SENHA DE SEGURANÇA:\n\nDigite uma senha (mínimo 4 dígitos) para proteger seus dados e permitir restaurações futuras.");

            if (senhaSeguranca === null) {
                alert("Cadastro cancelado. A senha é obrigatória.");
                return;
            }

            if (senhaSeguranca.trim().length >= 4) {
                senhaSeguranca = senhaSeguranca.trim();
                break;
            }
            alert("⚠️ Erro: A senha deve ter no mínimo 4 dígitos.");
        }

        await userRef.set({
            status: "ativo",
            lastSeen: Date.now(),
            dataExpiracao: "", 
            chavePix: pixInserido,
            senhaSeguranca: senhaSeguranca,
            clientes: {}
        });

        localStorage.setItem("id_dono_app", telefone);
        localStorage.setItem("meu_pix", pixInserido);
        
        document.getElementById("modalIdDono").style.display = "none";
        
        alert("✅ Cadastro realizado com sucesso!\n\nSuas mensagens já estão configuradas com seu PIX e seus dados estão protegidos por senha.");
        
        setTimeout(() => {
            window.location.reload();
        }, 500);

    } catch (error) {
        console.error("Erro ao cadastrar:", error);
        alert("Erro ao conectar com o servidor. Verifique sua conexão.");
    }
}


function validarSenhaAdm() {
    const senhaDigitada = document.getElementById("inputSenhaAdm").value;

    if (senhaDigitada === SENHA_MASTER) {
        // Fecha o modal de senha e o modal de ID
        document.getElementById("modalSenhaAdm").style.display = "none";
        document.getElementById("modalIdDono").style.display = "none";
        
        prosseguirSincronizacao(TELEFONE_MASTER);
    } else {
        alert("Senha incorreta. Acesso negado.");
        
        document.getElementById("inputSenhaAdm").value = "";
    }
}

function fecharModalSenha() {
    const modal = document.getElementById('modalSenhaAdm');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('inputSenhaAdm').value = '';
    }
}

function prosseguirSincronizacao(telefone) {
    localStorage.setItem("id_dono_app", telefone);
    document.getElementById("modalIdDono").style.display = "none";
    realizarBuscaNoFirebase(telefone);
}

function atualizarStatusOnline() {
    const idDono = obterIdDono();
    if (idDono === "padrao") return;

    const userRef = firebase.database().ref('usuarios/' + idDono);
    
    const reportar = () => {
        userRef.update({
            lastSeen: firebase.database.ServerValue.TIMESTAMP,
            online: true
        });
    };

    reportar();
   
    setInterval(reportar, 30000);

    userRef.onDisconnect().update({
        online: false,
        lastSeen: firebase.database.ServerValue.TIMESTAMP
    });
}

function verificarBloqueioMaster() {
    const idDono = localStorage.getItem("id_dono_app");
    if (!idDono || idDono === "padrao") return;

    firebase.database().ref('usuarios/' + idDono).on('value', (snapshot) => {
        const dados = snapshot.val();
        if (!dados || !dados.dataExpiracao) return;

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        
        const dataExp = new Date(dados.dataExpiracao + "T00:00:00");

        if (hoje > dataExp) {
            
            document.body.innerHTML = `
                <div style="height:100vh; background:#121212; color:white; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; font-family:sans-serif; padding:20px;">
                    <h1 style="color:#ff4b4b; font-size: 50px;">🔒 ACESSO BLOQUEADO</h1>
                    <p style="font-size:1.2rem;">Sua licença expirou em <b>${dados.dataExpiracao.split('-').reverse().join('/')}</b>.</p>
                    <p>Entre em contato com o administrador para renovar.</p>
                    <br>
                    <a href="https://wa.me/5581982258462" style="background:#25d366; color:black; padding:15px 30px; border-radius:30px; text-decoration:none; font-weight:bold;">RENOVAR AGORA</a>
                </div>
            `;
            document.body.style.overflow = "hidden";
        }
    });
}

function obterPrecoMensal() {
    const valorSalvo = localStorage.getItem("valor_mensalidade_personalizado");
    return valorSalvo ? parseFloat(valorSalvo) : 9.00;
}

function atualizarDisplayCreditos(quantidade, valorTotal) {
    const displayQuantidade = document.getElementById("displayQuantidade");
    const displayReais = document.getElementById("displayReais");

    if (displayQuantidade) displayQuantidade.innerText = quantidade;
    if (displayReais) {
        displayReais.innerText = `R$ ${valorTotal.toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })}`;
    }
}

function carregarCreditos() {
    let creditos = localStorage.getItem("meus_creditos");
    let valorAcumulado = localStorage.getItem("valor_acumulado");
    
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

function deduzirCredito(meses = 1) {
    
    const PRECO_CONFIGURADO = parseFloat(localStorage.getItem("valor_mensalidade_personalizado")) || 9.00;

    let creditos = parseInt(localStorage.getItem("meus_creditos")) || 0;
    let valorAcumulado = parseFloat(localStorage.getItem("valor_acumulado")) || 0.00;
    
    const totalDesconto = meses;
    const totalGanho = meses * PRECO_CONFIGURADO;

    if (creditos >= totalDesconto) {
        
        creditos -= totalDesconto;
        valorAcumulado += totalGanho;
        
        localStorage.setItem("meus_creditos", creditos);
        localStorage.setItem("valor_acumulado", valorAcumulado.toFixed(2));
        
        if (typeof atualizarDisplayCreditos === "function") {
            atualizarDisplayCreditos(creditos, valorAcumulado);
        }
        
        const msg = meses > 1 
            ? `✅ Renovação de ${meses} meses: -${totalDesconto} créditos e +R$ ${totalGanho.toFixed(2)}` 
            : `✅ Cliente renovado! +R$ ${PRECO_CONFIGURADO.toFixed(2)}`;
            
        mostrarToast(msg, "success");
    } else {
        
        mostrarToast(`❌ Saldo insuficiente! Você precisa de ${totalDesconto} créditos.`, "error");
    }
}

function editarCreditos() {
    
    const credAtuais = localStorage.getItem("meus_creditos") || 1500;
    const valorAcumuladoAtual = localStorage.getItem("valor_acumulado") || "0.00";
    const precoUnitarioAtual = localStorage.getItem("valor_mensalidade_personalizado") || "9.00";

    const novoCredito = prompt("💎 QUANTIDADE DE CRÉDITOS:\nDigite o saldo de créditos atual:", credAtuais);
    if (novoCredito === null) return;

    const novoValorAcumulado = prompt("💰 VALOR ACUMULADO (R$):\nDigite o total já ganho (ex: 150.00):", valorAcumuladoAtual);
    if (novoValorAcumulado === null) return;

    const novoPrecoUnitario = prompt("🏷️ VALOR DA MENSALIDADE (R$):\nQuanto você cobra por mês de cada crédito?", precoUnitarioAtual);
    if (novoPrecoUnitario === null) return;

    const valorLimpo = novoValorAcumulado.replace(',', '.');
    const precoLimpo = novoPrecoUnitario.replace(',', '.');

    if (!isNaN(novoCredito) && !isNaN(valorLimpo) && !isNaN(precoLimpo)) {
        localStorage.setItem("meus_creditos", parseInt(novoCredito));
        localStorage.setItem("valor_acumulado", parseFloat(valorLimpo).toFixed(2));
        localStorage.setItem("valor_mensalidade_personalizado", parseFloat(precoLimpo).toFixed(2));
        
        if (typeof carregarCreditos === "function") {
            carregarCreditos();
        } else {
            
            atualizarDisplayCreditos(parseInt(novoCredito), parseFloat(valorLimpo));
        }
        
        alert(`✅ Configurações atualizadas!\nAgora cada renovação somará R$ ${parseFloat(precoLimpo).toFixed(2)}`);
    } else {
        alert("❌ Por favor, insira apenas números válidos.");
    }
}

function configurarValorMensalidade() {
    
    const valorAtual = localStorage.getItem("valor_mensalidade_personalizado") || "9.00";
    
    const novoValor = prompt("Defina o valor que você cobra por mês de cada Credito (ex: 25.00):", valorAtual);
    
    if (novoValor === null) return;

    const valorLimpo = novoValor.replace(',', '.');

    if (!isNaN(valorLimpo) && parseFloat(valorLimpo) > 0) {
        localStorage.setItem("valor_mensalidade_personalizado", parseFloat(valorLimpo).toFixed(2));
        mostrarToast(`Preço atualizado para R$ ${parseFloat(valorLimpo).toFixed(2)}`, "success");
    } else {
        alert("Por favor, insira um valor numérico válido.");
    }
}