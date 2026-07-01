// DentOn - Sistema de Gestão Odontológica
// js/app.js - Estado Global Mockado e Armazenamento

// Configurações e Credenciais de Acesso Simulado (Dentista)
const AUTH_CREDENTIALS = {
    email: 'dentista@denton.com',
    password: 'senha123',
    name: 'Dr. João Vitor Coelho',
    cro: 'CRO-RJ 12345'
};

// Procedimentos Padrão e Custos de Materiais Inclusos (Para Analytics)
const DEFAULT_PROCEDURES = [
    { id: 'proc_limpeza', name: 'Limpeza (Profilaxia)', price: 180, materialCost: 25 },
    { id: 'proc_restauracao', name: 'Restauração de Resina', price: 220, materialCost: 45 },
    { id: 'proc_canal', name: 'Tratamento de Canal', price: 850, materialCost: 160 },
    { id: 'proc_extracao', name: 'Extração Dentária', price: 300, materialCost: 50 },
    { id: 'proc_clareamento', name: 'Clareamento Dental', price: 700, materialCost: 120 },
    { id: 'proc_avaliacao', name: 'Avaliação Inicial', price: 0, materialCost: 10 }
];

// Inicialização dos dados fictícios (se não existirem)
function initDatabase() {
    const today = new Date();
    const formatDate = (daysOffset, hourStr) => {
        const d = new Date(today);
        d.setDate(today.getDate() + daysOffset);
        return `${d.toISOString().split('T')[0]}T${hourStr}`;
    };

    // 1. Mock de Pacientes
    if (!localStorage.getItem('denton_patients')) {
        const initialPatients = [
            {
                id: 'pat_1',
                name: 'João Silva Oliveira',
                birthDate: '1992-04-12',
                phone: '(21) 98765-4321',
                email: 'joao.silva@email.com',
                plan: 'Bradesco Saúde',
                notes: 'Paciente relata sensibilidade no dente 16 ao frio. Histórico de bruxismo.',
                odontograma: {
                    '16_center': 'caries',
                    '24_left': 'restored',
                    '36_all': 'missing',
                    '47_bottom': 'canal'
                },
                evolution: [
                    {
                        date: formatDate(-5, '10:00').split('T')[0],
                        title: 'Avaliação e Tratamento de Canal dente 47',
                        notes: 'Realizado tratamento de canal no dente 47. Paciente evolui sem queixas agudas.'
                    },
                    {
                        date: formatDate(-15, '14:30').split('T')[0],
                        title: 'Restauração no dente 24',
                        notes: 'Restauração em resina fotopolimerizável na face mesial do dente 24.'
                    }
                ]
            },
            {
                id: 'pat_2',
                name: 'Maria Clara Souza',
                birthDate: '1981-08-25',
                phone: '(21) 97654-3210',
                email: 'maria.souza@email.com',
                plan: 'Amil Dental',
                notes: 'Alérgica a Penicilina. Apresenta gengivite leve na arcada inferior.',
                odontograma: {
                    '11_center': 'restored',
                    '21_center': 'restored'
                },
                evolution: [
                    {
                        date: formatDate(-10, '16:00').split('T')[0],
                        title: 'Profilaxia e Aplicação de Flúor',
                        notes: 'Realizada raspagem supra e subgengival geral e aplicação tópica de flúor neutro.'
                    }
                ]
            },
            {
                id: 'pat_3',
                name: 'Carlos Henrique Rodrigues',
                birthDate: '1998-11-03',
                phone: '(21) 96543-2109',
                email: 'carlos.rodrigues@email.com',
                plan: 'Particular',
                notes: 'Deseja realizar clareamento dental. Dentes hígidos no momento.',
                odontograma: {},
                evolution: []
            },
            {
                id: 'pat_4',
                name: 'Ana Julia Santos',
                birthDate: '1974-02-18',
                phone: '(21) 95432-1098',
                email: 'ana.santos@email.com',
                plan: 'SulAmérica Odonto',
                notes: 'Paciente hipertensa controlada. Medicação: Losartana 50mg.',
                odontograma: {
                    '14_all': 'missing',
                    '15_all': 'missing',
                    '46_center': 'caries'
                },
                evolution: [
                    {
                        date: formatDate(-20, '09:00').split('T')[0],
                        title: 'Extração dentes 14 e 15',
                        notes: 'Extração cirúrgica devido a comprometimento periodontal severo.'
                    }
                ]
            },
            {
                id: 'pat_5',
                name: 'Pedro Henrique Costa',
                birthDate: '2007-06-30',
                phone: '(21) 94321-0987',
                email: 'pedro.costa@email.com',
                plan: 'Particular',
                notes: 'Uso de aparelho ortodôntico fixo. Boa higiene bucal.',
                odontograma: {
                    '18_all': 'missing',
                    '28_all': 'missing',
                    '38_all': 'missing',
                    '48_all': 'missing'
                },
                evolution: [
                    {
                        date: formatDate(-30, '11:00').split('T')[0],
                        title: 'Manutenção de Aparelho Ortodôntico',
                        notes: 'Troca de arco ortodôntico e ativação das ligaduras.'
                    }
                ]
            }
        ];
        localStorage.setItem('denton_patients', JSON.stringify(initialPatients));
    }

    // 2. Mock de Consultas / Agendamentos
    if (!localStorage.getItem('denton_appointments')) {
        const initialAppointments = [
            {
                id: 'app_1',
                patientId: 'pat_1',
                procedureId: 'proc_restauracao',
                dateTimeStart: formatDate(0, '09:00'),
                dateTimeEnd: formatDate(0, '09:45'),
                status: 'confirmed',
                notes: 'Tratar cárie detectada na oclusal do 16.'
            },
            {
                id: 'app_2',
                patientId: 'pat_2',
                procedureId: 'proc_limpeza',
                dateTimeStart: formatDate(0, '11:00'),
                dateTimeEnd: formatDate(0, '11:45'),
                status: 'completed',
                notes: 'Retorno semestral para profilaxia.'
            },
            {
                id: 'app_3',
                patientId: 'pat_3',
                procedureId: 'proc_clareamento',
                dateTimeStart: formatDate(0, '14:00'),
                dateTimeEnd: formatDate(0, '15:00'),
                status: 'confirmed',
                notes: 'Primeira sessão do clareamento de consultório.'
            },
            {
                id: 'app_4',
                patientId: 'pat_4',
                procedureId: 'proc_restauracao',
                dateTimeStart: formatDate(0, '16:00'),
                dateTimeEnd: formatDate(0, '16:45'),
                status: 'pending',
                notes: 'Restauração de cárie oclusal no 46.'
            },
            {
                id: 'app_5',
                patientId: 'pat_5',
                procedureId: 'proc_avaliacao',
                dateTimeStart: formatDate(1, '10:00'),
                dateTimeEnd: formatDate(1, '10:30'),
                status: 'confirmed',
                notes: 'Manutenção mensal do aparelho.'
            },
            {
                id: 'app_6',
                patientId: 'pat_1',
                procedureId: 'proc_limpeza',
                dateTimeStart: formatDate(2, '15:00'),
                dateTimeEnd: formatDate(2, '15:45'),
                status: 'confirmed',
                notes: 'Limpeza de rotina pós canal.'
            },
            {
                id: 'app_7',
                patientId: 'pat_2',
                procedureId: 'proc_avaliacao',
                dateTimeStart: formatDate(-1, '16:00'),
                dateTimeEnd: formatDate(-1, '16:30'),
                status: 'completed',
                notes: 'Avaliação de gengiva.'
            },
            {
                id: 'app_8',
                patientId: 'pat_3',
                procedureId: 'proc_avaliacao',
                dateTimeStart: formatDate(3, '09:00'),
                dateTimeEnd: formatDate(3, '09:30'),
                status: 'pending',
                notes: 'Nova avaliação.'
            }
        ];
        localStorage.setItem('denton_appointments', JSON.stringify(initialAppointments));
    }
}

// Chamar inicialização ao carregar o script
initDatabase();

// Funções de Armazenamento para Pacientes
function getPatients() {
    return JSON.parse(localStorage.getItem('denton_patients')) || [];
}

function savePatients(patients) {
    localStorage.setItem('denton_patients', JSON.stringify(patients));
}

function addPatient(patient) {
    const patients = getPatients();
    const newPatient = {
        id: 'pat_' + Date.now(),
        odontograma: {},
        evolution: [],
        ...patient
    };
    patients.push(newPatient);
    savePatients(patients);
    return newPatient;
}

function updatePatient(patientId, updatedFields) {
    const patients = getPatients();
    const index = patients.findIndex(p => p.id === patientId);
    if (index !== -1) {
        patients[index] = { ...patients[index], ...updatedFields };
        savePatients(patients);
        return patients[index];
    }
    return null;
}

// Funções de Armazenamento para Consultas / Agenda
function getAppointments() {
    return JSON.parse(localStorage.getItem('denton_appointments')) || [];
}

function saveAppointments(appointments) {
    localStorage.setItem('denton_appointments', JSON.stringify(appointments));
}

function addAppointment(app) {
    const appointments = getAppointments();
    const newApp = {
        id: 'app_' + Date.now(),
        ...app
    };
    appointments.push(newApp);
    saveAppointments(appointments);
    return newApp;
}

function updateAppointment(appId, updatedFields) {
    const appointments = getAppointments();
    const index = appointments.findIndex(a => a.id === appId);
    if (index !== -1) {
        appointments[index] = { ...appointments[index], ...updatedFields };
        saveAppointments(appointments);
        return appointments[index];
    }
    return null;
}

function deleteAppointment(appId) {
    const appointments = getAppointments();
    const filtered = appointments.filter(a => a.id !== appId);
    saveAppointments(filtered);
}

// Get Procedures list
function getProcedures() {
    return DEFAULT_PROCEDURES;
}

// Autenticação de Sessão Simples
function checkAuth() {
    const session = JSON.parse(localStorage.getItem('denton_session'));
    const currentPage = window.location.pathname.split('/').pop();
    
    // Lista de páginas restritas ao dentista
    const restrictedPages = ['dashboard.html', 'agenda.html', 'prontuario.html', 'analytics.html'];
    
    if (!session) {
        // Redireciona para o login.html se estiver em alguma página restrita
        if (restrictedPages.includes(currentPage)) {
            window.location.href = 'login.html';
        }
        return null;
    } else {
        return session;
    }
}

function login(email, password) {
    if (email === AUTH_CREDENTIALS.email && password === AUTH_CREDENTIALS.password) {
        const session = {
            name: AUTH_CREDENTIALS.name,
            cro: AUTH_CREDENTIALS.cro,
            email: AUTH_CREDENTIALS.email,
            loginTime: new Date().toISOString()
        };
        localStorage.setItem('denton_session', JSON.stringify(session));
        return { success: true, session };
    }
    return { success: false, message: 'E-mail ou senha incorretos!' };
}

function logout() {
    localStorage.removeItem('denton_session');
    window.location.href = 'login.html';
}

// Helpers Utilitários de Data e Formatação
function formatBrazilianDate(dateString) {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return new Date(dateString).toLocaleDateString('pt-BR');
}

function formatBrazilianTime(dateTimeString) {
    if (!dateTimeString) return '';
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function getAge(birthDateString) {
    if (!birthDateString) return '';
    const today = new Date();
    const birthDate = new Date(birthDateString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

// Helper para Toasts de Notificação
function showToast(message) {
    // Remover se já houver algum na tela
    const oldToast = document.querySelector('.toast-notification');
    if (oldToast) oldToast.remove();

    const toast = document.createElement('div');
    toast.className = 'toast-notification';
    toast.innerHTML = `
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span>${message}</span>
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
