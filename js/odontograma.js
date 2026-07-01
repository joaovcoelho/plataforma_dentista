// DentOn - Sistema de Gestão Odontológica
// js/odontograma.js - Lógica do Odontograma SVG e Gestão de Prontuários

let selectedPatientId = null;
let activeSession = null;
let activeTooth = null;
let activeFace = null;
let selectedPopoverState = 'healthy'; // Estado selecionado no popover temporário

// Constantes dos dentes segundo a notação FDI
const UPPER_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_TEETH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

// Dicionário de tradução das faces dos dentes
const FACE_TRANSLATIONS = {
    top: 'Vestibular (Superior)',
    bottom: 'Lingual / Palatina (Inferior)',
    left: 'Mesial (Esquerda)',
    right: 'Distal (Direita)',
    center: 'Oclusal / Incisal (Centro)'
};

document.addEventListener('DOMContentLoaded', () => {
    // 1. Verificar Autenticação
    activeSession = checkAuth();
    if (!activeSession) return; // Redirecionado se não logado
    
    // 2. Preencher cabeçalho
    document.getElementById('sidebar-name').innerText = activeSession.name;
    document.getElementById('sidebar-cro').innerText = activeSession.cro;
    const initials = activeSession.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    document.getElementById('sidebar-avatar').innerText = initials;

    // 3. Gerar dentes SVG dinamicamente no DOM
    generateOdontogramaSVGs();

    // 4. Carregar lista de pacientes na barra lateral
    loadPatientList();

    // 5. Analisar parâmetros da URL (?new=true ou ?id=pat_x)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('new') === 'true') {
        openNewPatientModal();
    } else {
        const idParam = urlParams.get('id');
        if (idParam) {
            selectPatient(idParam);
        }
    }

    // Fechar popover se clicar fora dele
    document.addEventListener('mousedown', (e) => {
        const popover = document.getElementById('diagnosis-popover');
        if (popover.style.display === 'block' && 
            !popover.contains(e.target) && 
            !e.target.classList.contains('tooth-face') &&
            !e.target.closest('.popover-option') &&
            !e.target.closest('input') &&
            !e.target.closest('textarea')) {
            closeDiagnosisPopover();
        }
    });
});

// GERAÇÃO DINÂMICA DOS SVGS DOS DENTES
function generateOdontogramaSVGs() {
    const arcadaSup = document.getElementById('arcada-superior');
    const arcadaInf = document.getElementById('arcada-inferior');
    
    arcadaSup.innerHTML = '';
    arcadaInf.innerHTML = '';

    // Renderizar arcada superior
    UPPER_TEETH.forEach(num => {
        arcadaSup.appendChild(createToothElement(num));
    });

    // Renderizar arcada inferior
    LOWER_TEETH.forEach(num => {
        arcadaInf.appendChild(createToothElement(num));
    });
}

function createToothElement(number) {
    const toothItem = document.createElement('div');
    toothItem.className = 'tooth-item';
    toothItem.setAttribute('data-tooth-number', number);
    toothItem.id = `tooth-item-${number}`;

    const toothNumSpan = document.createElement('span');
    toothNumSpan.className = 'tooth-number';
    toothNumSpan.innerText = number;
    toothItem.appendChild(toothNumSpan);

    const svgContainer = document.createElement('div');
    svgContainer.className = 'tooth-svg-container';

    // SVG com as 5 faces do dente (Superior/Top, Esquerda/Left, Direita/Right, Inferior/Bottom e Centro/Center)
    const svgCode = `
        <svg viewBox="0 0 40 40" class="tooth-svg" xmlns="http://www.w3.org/2000/svg">
            <polygon points="0,0 40,0 30,10 10,10" class="tooth-face" data-tooth="${number}" data-face="top"></polygon>
            <polygon points="40,0 40,40 30,30 30,10" class="tooth-face" data-tooth="${number}" data-face="right"></polygon>
            <polygon points="0,40 40,40 30,30 10,30" class="tooth-face" data-tooth="${number}" data-face="bottom"></polygon>
            <polygon points="0,0 0,40 10,30 10,10" class="tooth-face" data-tooth="${number}" data-face="left"></polygon>
            <polygon points="10,10 30,10 30,30 10,30" class="tooth-face" data-tooth="${number}" data-face="center"></polygon>
        </svg>
    `;
    svgContainer.innerHTML = svgCode;

    // Adicionar eventos às faces do dente gerado
    svgContainer.querySelectorAll('.tooth-face').forEach(face => {
        face.addEventListener('click', (e) => {
            e.stopPropagation();
            openDiagnosisPopover(face, number, face.getAttribute('data-face'));
        });
    });

    toothItem.appendChild(svgContainer);
    return toothItem;
}

// CARGA DA LISTA DE PACIENTES
function loadPatientList() {
    const container = document.getElementById('patient-list-container');
    container.innerHTML = '';
    const patients = getPatients();

    if (patients.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 20px; font-size: 13px; color: var(--text-muted);">Nenhum paciente cadastrado.</p>';
        return;
    }

    patients.forEach(pat => {
        const initials = pat.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
        const activeClass = selectedPatientId === pat.id ? 'active' : '';

        const itemHtml = `
            <div class="patient-sidebar-item ${activeClass}" id="patient-item-${pat.id}" onclick="selectPatient('${pat.id}')">
                <div class="patient-initials">${initials}</div>
                <div class="patient-sidebar-item-info">
                    <h4>${pat.name}</h4>
                    <p>${pat.plan} • ${getAge(pat.birthDate)} anos</p>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', itemHtml);
    });
}

function handlePatientSearch() {
    const query = document.getElementById('patient-search').value.toLowerCase().trim();
    const items = document.querySelectorAll('.patient-sidebar-item');
    const patients = getPatients();

    patients.forEach(pat => {
        const itemEl = document.getElementById(`patient-item-${pat.id}`);
        if (!itemEl) return;
        
        if (pat.name.toLowerCase().includes(query) || pat.plan.toLowerCase().includes(query)) {
            itemEl.style.display = 'flex';
        } else {
            itemEl.style.display = 'none';
        }
    });
}

// SELEÇÃO DE PACIENTE ATIVO
function selectPatient(patientId) {
    selectedPatientId = patientId;

    // Fechar popover se estiver aberto
    closeDiagnosisPopover();

    // Atualizar classe ativa na barra lateral
    document.querySelectorAll('.patient-sidebar-item').forEach(item => item.classList.remove('active'));
    const activeItem = document.getElementById(`patient-item-${patientId}`);
    if (activeItem) activeItem.classList.add('active');

    const patients = getPatients();
    const patient = patients.find(p => p.id === patientId);

    if (patient) {
        // Exibir painel e ocultar placeholder
        document.getElementById('no-patient-selected').style.display = 'none';
        document.getElementById('patient-details-content').classList.remove('d-none');

        // Preencher Ficha Cadastral
        document.getElementById('view-patient-name').innerText = patient.name;
        document.getElementById('view-patient-age').innerText = `${getAge(patient.birthDate)} anos (${formatBrazilianDate(patient.birthDate)})`;
        document.getElementById('view-patient-phone').innerText = patient.phone;
        document.getElementById('view-patient-email').innerText = patient.email;
        document.getElementById('view-patient-plan').innerText = patient.plan;
        document.getElementById('view-patient-notes').innerText = patient.notes || 'Sem alertas importantes para este paciente.';

        // Renderizar o estado do Odontograma do paciente
        renderPatientOdontograma(patient.odontograma);

        // Renderizar a evolução/histórico clínico
        renderPatientEvolution(patient.evolution);
    }
}

// RENDERIZA CORES E ESTADOS DO ODONTOGRAMA
function renderPatientOdontograma(odontogramaData = {}) {
    // 1. Limpar todas as classes diagnósticas de todos os dentes e remover marcas de ausente
    document.querySelectorAll('.tooth-face').forEach(face => {
        face.className.baseVal = 'tooth-face'; // Limpa classes antigas de SVG
    });
    document.querySelectorAll('.tooth-item').forEach(item => {
        item.classList.remove('missing');
    });

    // 2. Aplicar diagnósticos gravados
    for (const key in odontogramaData) {
        const value = odontogramaData[key];
        
        if (key.endsWith('_all') && value === 'missing') {
            // Dente inteiro ausente
            const toothNum = key.split('_')[0];
            const toothItem = document.getElementById(`tooth-item-${toothNum}`);
            if (toothItem) toothItem.classList.add('missing');
        } else {
            // Face individual
            const [toothNum, faceName] = key.split('_');
            const faceEl = document.querySelector(`.tooth-face[data-tooth="${toothNum}"][data-face="${faceName}"]`);
            if (faceEl) {
                faceEl.className.baseVal = `tooth-face ${value}`;
            }
        }
    }
}

// RENDERIZA TIMELINE DE EVOLUÇÃO
function renderPatientEvolution(evolutionList = []) {
    const timeline = document.getElementById('patient-evolution-timeline');
    timeline.innerHTML = '';

    if (evolutionList.length === 0) {
        timeline.innerHTML = '<p style="text-align: center; padding: 24px; font-size: 13px; color: var(--text-muted); font-style: italic;">Nenhuma evolução clínica registrada ainda.</p>';
        return;
    }

    // Ordenar do mais recente para o mais antigo
    const sortedEvo = [...evolutionList].sort((a, b) => b.date.localeCompare(a.date));

    sortedEvo.forEach(evo => {
        const evoHtml = `
            <div class="evolution-card">
                <div class="evolution-meta">
                    <span class="evolution-title">${evo.title}</span>
                    <span>${formatBrazilianDate(evo.date)}</span>
                </div>
                <p class="evolution-notes">${evo.notes}</p>
            </div>
        `;
        timeline.insertAdjacentHTML('beforeend', evoHtml);
    });
}

// ----------------------------------------------------
// POPOVER FLUTUANTE DE CONFIGURAÇÃO DE DIAGNÓSTICO
// ----------------------------------------------------

function openDiagnosisPopover(faceElement, toothNum, faceName) {
    if (!selectedPatientId) return;

    // Verificar se o dente está marcado como ausente
    const toothItem = document.getElementById(`tooth-item-${toothNum}`);
    const isMissing = toothItem && toothItem.classList.contains('missing');

    activeTooth = toothNum;
    activeFace = faceName;

    const popover = document.getElementById('diagnosis-popover');
    
    // Atualizar cabeçalho do popover
    document.getElementById('popover-tooth-num').innerText = toothNum;
    document.getElementById('popover-face-name').innerText = FACE_TRANSLATIONS[faceName] || faceName;
    document.getElementById('popover-tooth-missing').checked = isMissing;
    document.getElementById('popover-obs').value = '';

    // Ler estado atual no prontuário do paciente ativo
    const patients = getPatients();
    const patient = patients.find(p => p.id === selectedPatientId);
    
    // Obter estado atual da face se houver
    const stateKey = `${toothNum}_${faceName}`;
    const currentState = (patient.odontograma && patient.odontograma[stateKey]) || 'healthy';
    
    // Definir estado inicial ativo no popover
    selectPopoverState(currentState);

    // Posicionar popover próximo ao dente
    popover.style.display = 'block';
    
    const rect = faceElement.getBoundingClientRect();
    const popoverWidth = popover.offsetWidth;
    const popoverHeight = popover.offsetHeight;
    
    // Calcular posição central do dente no scroll global
    let top = rect.top + window.scrollY - popoverHeight - 12;
    let left = rect.left + window.scrollX + (rect.width / 2) - (popoverWidth / 2);
    
    // Ajustar se passar do topo da janela
    popover.className = 'diagnosis-popover place-top';
    if (top < window.scrollY + 10) {
        top = rect.bottom + window.scrollY + 12;
        popover.className = 'diagnosis-popover place-bottom';
    }

    popover.style.top = `${top}px`;
    popover.style.left = `${left}px`;
}

function selectPopoverState(state) {
    selectedPopoverState = state;
    
    // Atualizar bordas visuais no popover
    document.querySelectorAll('.popover-option').forEach(opt => {
        opt.style.border = '1px solid transparent';
        opt.style.backgroundColor = 'transparent';
    });

    const optEl = document.querySelector(`.popover-option[onclick="selectDiagnosisState('${state}')"]`);
    if (optEl) {
        optEl.style.border = '1px solid var(--primary)';
        optEl.style.backgroundColor = 'var(--primary-light)';
    }
}

// Esta função é chamada ao clicar nas opções do popover
function selectDiagnosisState(state) {
    selectPopoverState(state);
}

function toggleToothMissingState(isChecked) {
    // Se marcou dente ausente, desativa opções de face
    const options = document.querySelectorAll('.popover-option');
    if (isChecked) {
        options.forEach(opt => opt.style.opacity = '0.5');
    } else {
        options.forEach(opt => opt.style.opacity = '1');
    }
}

function closeDiagnosisPopover() {
    document.getElementById('diagnosis-popover').style.display = 'none';
    activeTooth = null;
    activeFace = null;
}

function saveDiagnosisState() {
    if (!selectedPatientId || !activeTooth || !activeFace) return;

    const isMissing = document.getElementById('popover-tooth-missing').checked;
    const obs = document.getElementById('popover-obs').value.trim();
    
    const patients = getPatients();
    const patient = patients.find(p => p.id === selectedPatientId);
    
    if (!patient) return;
    if (!patient.odontograma) patient.odontograma = {};
    if (!patient.evolution) patient.evolution = [];

    const dateToday = new Date().toISOString().split('T')[0];
    let logsTitle = '';
    let logsDesc = '';

    if (isMissing) {
        // Marcar dente inteiro como ausente
        const keyAll = `${activeTooth}_all`;
        
        // Remove quaisquer outros estados individuais daquele dente
        for (const key in patient.odontograma) {
            if (key.startsWith(`${activeTooth}_`)) {
                delete patient.odontograma[key];
            }
        }
        
        patient.odontograma[keyAll] = 'missing';
        logsTitle = `Dente ${activeTooth} extraído/ausente`;
        logsDesc = `Paciente teve o dente ${activeTooth} marcado como ausente no odontograma. ${obs ? `Obs: ${obs}` : ''}`;
    } else {
        // Tratar apenas a face específica
        const keyFace = `${activeTooth}_${activeFace}`;
        const keyAll = `${activeTooth}_all`;
        
        // Remove marcação de ausente se houver
        delete patient.odontograma[keyAll];
        
        if (selectedPopoverState === 'healthy') {
            delete patient.odontograma[keyFace];
            logsTitle = `Dente ${activeTooth} - Face ${FACE_TRANSLATIONS[activeFace].split(' ')[0]} hígida`;
            logsDesc = `A face ${FACE_TRANSLATIONS[activeFace]} do dente ${activeTooth} foi marcada como saudável/limpa no odontograma.`;
        } else {
            patient.odontograma[keyFace] = selectedPopoverState;
            const stateText = selectedPopoverState === 'caries' ? 'Cárie' : 
                              selectedPopoverState === 'restored' ? 'Restauração' : 'Canal';
            
            logsTitle = `Dente ${activeTooth} - Face ${FACE_TRANSLATIONS[activeFace].split(' ')[0]}: ${stateText}`;
            logsDesc = `Constatado estado de ${stateText} na face ${FACE_TRANSLATIONS[activeFace]} do dente ${activeTooth}. ${obs ? `Obs: ${obs}` : ''}`;
        }
    }

    // Registrar evolução automática
    patient.evolution.push({
        date: dateToday,
        title: logsTitle,
        notes: logsDesc
    });

    // Salvar paciente no LocalStorage
    updatePatient(selectedPatientId, {
        odontograma: patient.odontograma,
        evolution: patient.evolution
    });

    // Fechar e recarregar painel
    closeDiagnosisPopover();
    selectPatient(selectedPatientId);
}

// ----------------------------------------------------
// OPERAÇÕES DO MODAL DE CADASTRO/EDIÇÃO DE PACIENTE
// ----------------------------------------------------

function openNewPatientModal() {
    document.getElementById('patient-form').reset();
    document.getElementById('patient-id').value = '';
    document.getElementById('patient-modal-title').innerText = 'Cadastrar Novo Paciente';
    
    // Setar data de nascimento padrão (ex: 30 anos atrás para ficar realista)
    const d = new Date();
    d.setFullYear(d.getFullYear() - 30);
    document.getElementById('patient-birthdate').value = d.toISOString().split('T')[0];

    document.getElementById('patient-modal').style.display = 'flex';
}

function openEditPatientModal() {
    if (!selectedPatientId) return;
    
    const patients = getPatients();
    const patient = patients.find(p => p.id === selectedPatientId);
    if (!patient) return;

    document.getElementById('patient-modal-title').innerText = 'Editar Cadastro';
    document.getElementById('patient-id').value = patient.id;
    document.getElementById('patient-name').value = patient.name;
    document.getElementById('patient-birthdate').value = patient.birthDate;
    document.getElementById('patient-phone').value = patient.phone;
    document.getElementById('patient-email').value = patient.email;
    document.getElementById('patient-plan').value = patient.plan;
    document.getElementById('patient-notes').value = patient.notes || '';

    document.getElementById('patient-modal').style.display = 'flex';
}

function closePatientModal() {
    document.getElementById('patient-modal').style.display = 'none';
}

function handlePatientSubmit(e) {
    e.preventDefault();

    const patientId = document.getElementById('patient-id').value;
    const name = document.getElementById('patient-name').value.trim();
    const birthDate = document.getElementById('patient-birthdate').value;
    const phone = document.getElementById('patient-phone').value.trim();
    const email = document.getElementById('patient-email').value.trim();
    const plan = document.getElementById('patient-plan').value.trim();
    const notes = document.getElementById('patient-notes').value.trim();

    const patientData = { name, birthDate, phone, email, plan, notes };

    let savedPatient;
    if (patientId) {
        savedPatient = updatePatient(patientId, patientData);
    } else {
        savedPatient = addPatient(patientData);
    }

    closePatientModal();
    loadPatientList();
    
    // Selecionar paciente recém cadastrado/editado
    selectPatient(savedPatient.id);
}

// ----------------------------------------------------
// REGISTRO DE NOTAS DE EVOLUÇÃO MANUAL
// ----------------------------------------------------

function openAddEvolutionModal() {
    if (!selectedPatientId) return;
    document.getElementById('evolution-form').reset();
    document.getElementById('evolution-modal').style.display = 'flex';
}

function closeEvolutionModal() {
    document.getElementById('evolution-modal').style.display = 'none';
}

function handleEvolutionSubmit(e) {
    e.preventDefault();

    if (!selectedPatientId) return;

    const title = document.getElementById('evo-title').value.trim();
    const notes = document.getElementById('evo-notes').value.trim();
    const dateToday = new Date().toISOString().split('T')[0];

    const patients = getPatients();
    const patient = patients.find(p => p.id === selectedPatientId);
    if (!patient) return;

    if (!patient.evolution) patient.evolution = [];
    patient.evolution.push({
        date: dateToday,
        title,
        notes
    });

    updatePatient(selectedPatientId, { evolution: patient.evolution });

    closeEvolutionModal();
    selectPatient(selectedPatientId);
}
