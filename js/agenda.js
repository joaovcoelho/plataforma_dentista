// DentOn - Sistema de Gestão Odontológica
// js/agenda.js - Lógica da Agenda Interativa

let currentDate = new Date();
let currentView = 'month'; // 'month' | 'week' | 'day'
let activeSession = null;

// Nome dos meses e dias da semana
const MONTH_NAMES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];
const WEEKDAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

// Inicialização da Página de Agenda
document.addEventListener('DOMContentLoaded', () => {
    // 1. Verificar Autenticação
    activeSession = checkAuth();
    if (!activeSession) return; // Redirecionado pelo app.js se não logado
    
    // 2. Preencher dados do cabeçalho
    document.getElementById('sidebar-name').innerText = activeSession.name;
    document.getElementById('sidebar-cro').innerText = activeSession.cro;
    const initials = activeSession.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
    document.getElementById('sidebar-avatar').innerText = initials;

    // 3. Preencher listas de seleção no Modal (Pacientes e Procedimentos)
    populateModalSelects();

    // 4. Checar parâmetros na URL para abrir modal automaticamente (ex: ação rápida de Novo Agendamento)
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('new') === 'true') {
        openNewAppointmentModal();
    }

    // 5. Renderizar a visualização padrão
    renderCalendar();
});

// Preenche os selects do modal de agendamento com dados do localStorage e padrão
function populateModalSelects() {
    const patientSelect = document.getElementById('app-patient');
    const procedureSelect = document.getElementById('app-procedure');
    
    const patients = getPatients();
    const procedures = getProcedures();

    // Limpar e preencher pacientes
    patientSelect.innerHTML = '<option value="" disabled selected>Selecione um paciente...</option>';
    patients.forEach(pat => {
        patientSelect.insertAdjacentHTML('beforeend', `<option value="${pat.id}">${pat.name}</option>`);
    });

    // Limpar e preencher procedimentos
    procedureSelect.innerHTML = '<option value="" disabled selected>Selecione um procedimento...</option>';
    procedures.forEach(proc => {
        procedureSelect.insertAdjacentHTML('beforeend', `<option value="${proc.id}">${proc.name} (R$ ${proc.price.toLocaleString('pt-BR')})</option>`);
    });
}

// Controla a troca de abas da visualização da agenda (Mês, Semana, Dia)
function changeCalendarView(view) {
    currentView = view;
    
    // Atualizar classe do botão ativo
    document.querySelectorAll('.view-toggle-btn').forEach(btn => btn.classList.remove('active'));
    if (view === 'month') document.getElementById('btn-view-month').classList.add('active');
    if (view === 'week') document.getElementById('btn-view-week').classList.add('active');
    if (view === 'day') document.getElementById('btn-view-day').classList.add('active');

    renderCalendar();
}

// Navega pelos controles (Hoje, Anterior, Próximo)
function navigateToToday() {
    currentDate = new Date();
    renderCalendar();
}

function navigateOffset(dir) {
    if (currentView === 'month') {
        currentDate.setMonth(currentDate.getMonth() + dir);
    } else if (currentView === 'week') {
        currentDate.setDate(currentDate.getDate() + (dir * 7));
    } else if (currentView === 'day') {
        currentDate.setDate(currentDate.getDate() + dir);
    }
    renderCalendar();
}

// Orquestrador de Renderização do Calendário
function renderCalendar() {
    const container = document.getElementById('calendar-grid-container');
    container.innerHTML = '';

    if (currentView === 'month') {
        renderMonthView(container);
    } else if (currentView === 'week') {
        renderWeekView(container);
    } else if (currentView === 'day') {
        renderDayView(container);
    }
}

// 1. RENDERIZAÇÃO DA VISTA MENSAL
function renderMonthView(container) {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Atualiza label da data
    document.getElementById('calendar-date-label').innerText = `${MONTH_NAMES[month]} de ${year}`;

    // Criar estrutura da grade mensal
    const monthGrid = document.createElement('div');
    monthGrid.className = 'month-grid';
    
    // Cabeçalhos de dia da semana
    WEEKDAY_NAMES.forEach(day => {
        const header = document.createElement('div');
        header.className = 'month-weekday';
        header.innerText = day;
        monthGrid.appendChild(header);
    });

    // Calcular dias para exibir
    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalMonthDays = new Date(year, month + 1, 0).getDate();
    const totalPrevDays = new Date(year, month, 0).getDate();

    const appointments = getAppointments();
    const patients = getPatients();
    const procedures = getProcedures();

    // Renderizar dias do mês anterior para completar a semana inicial
    for (let i = firstDayIndex - 1; i >= 0; i--) {
        const dayNum = totalPrevDays - i;
        const prevMonthDate = new Date(year, month - 1, dayNum);
        const dayCell = createMonthDayCell(prevMonthDate, true, appointments, patients, procedures);
        monthGrid.appendChild(dayCell);
    }

    // Renderizar dias do mês corrente
    const today = new Date();
    for (let i = 1; i <= totalMonthDays; i++) {
        const thisMonthDate = new Date(year, month, i);
        const isToday = thisMonthDate.getDate() === today.getDate() && 
                        thisMonthDate.getMonth() === today.getMonth() && 
                        thisMonthDate.getFullYear() === today.getFullYear();
        const dayCell = createMonthDayCell(thisMonthDate, false, appointments, patients, procedures, isToday);
        monthGrid.appendChild(dayCell);
    }

    // Renderizar dias do próximo mês para fechar a última linha de 7 dias
    const totalRendered = firstDayIndex + totalMonthDays;
    const remainingDays = totalRendered % 7 === 0 ? 0 : 7 - (totalRendered % 7);
    for (let i = 1; i <= remainingDays; i++) {
        const nextMonthDate = new Date(year, month + 1, i);
        const dayCell = createMonthDayCell(nextMonthDate, true, appointments, patients, procedures);
        monthGrid.appendChild(dayCell);
    }

    container.appendChild(monthGrid);
}

// Cria célula individual de dia na vista mensal
function createMonthDayCell(date, isOtherMonth, appointments, patients, procedures, isToday = false) {
    const dayCell = document.createElement('div');
    dayCell.className = `month-day ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`;
    
    // Clicar em um dia vazio abre criação rápida pré-datada
    dayCell.addEventListener('click', (e) => {
        if (e.target === dayCell || e.target.classList.contains('month-day-number')) {
            const yyyy = date.getFullYear();
            const mm = String(date.getMonth() + 1).padStart(2, '0');
            const dd = String(date.getDate()).padStart(2, '0');
            openNewAppointmentModal(`${yyyy}-${mm}-${dd}`);
        }
    });

    const dayNumber = document.createElement('span');
    dayNumber.className = 'month-day-number';
    dayNumber.innerText = date.getDate();
    dayCell.appendChild(dayNumber);

    // Filtrar consultas do dia
    const dateStr = date.toISOString().split('T')[0];
    const dayApps = appointments.filter(app => app.dateTimeStart.startsWith(dateStr));
    
    // Ordenar consultas por hora
    dayApps.sort((a, b) => a.dateTimeStart.localeCompare(b.dateTimeStart));

    // Renderizar no máximo 3 consultas na célula para evitar quebrar o layout
    const maxVisibleApps = 3;
    dayApps.slice(0, maxVisibleApps).forEach(app => {
        const pat = patients.find(p => p.id === app.patientId);
        const proc = procedures.find(p => p.id === app.procedureId);
        if (!pat) return;

        const time = formatBrazilianTime(app.dateTimeStart);
        const badge = document.createElement('div');
        badge.className = `calendar-dot-event status-${app.status}`;
        badge.innerText = `${time} ${pat.name.split(' ')[0]}`;
        badge.title = `${time} • ${pat.name} • ${proc ? proc.name : 'Consulta'}`;
        
        badge.addEventListener('click', (e) => {
            e.stopPropagation();
            openEditAppointmentModal(app.id);
        });

        dayCell.appendChild(badge);
    });

    if (dayApps.length > maxVisibleApps) {
        const moreIndicator = document.createElement('div');
        moreIndicator.style.fontSize = '10px';
        moreIndicator.style.color = 'var(--text-muted)';
        moreIndicator.style.fontWeight = '600';
        moreIndicator.style.paddingLeft = '4px';
        moreIndicator.innerText = `+ ${dayApps.length - maxVisibleApps} consultas`;
        dayCell.appendChild(moreIndicator);
    }

    return dayCell;
}

// 2. RENDERIZAÇÃO DA VISTA SEMANAL
function renderWeekView(container) {
    const startOfWeek = new Date(currentDate);
    // Ajustar para o domingo anterior (início da semana)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);

    // Atualiza label da data
    const label = `${startOfWeek.getDate()} ${MONTH_NAMES[startOfWeek.getMonth()].substring(0, 3)} - ${endOfWeek.getDate()} ${MONTH_NAMES[endOfWeek.getMonth()].substring(0, 3)} (${startOfWeek.getFullYear()})`;
    document.getElementById('calendar-date-label').innerText = label;

    // Criar layout de grade temporal
    const timeGridLayout = document.createElement('div');
    timeGridLayout.className = 'time-grid-layout';

    // 1. Eixo vertical do horário (08:00 às 18:00)
    const timeAxis = document.createElement('div');
    timeAxis.className = 'time-axis';
    
    const timeAxisHeader = document.createElement('div');
    timeAxisHeader.className = 'time-axis-header';
    timeAxis.appendChild(timeAxisHeader);

    for (let hour = 8; hour <= 18; hour++) {
        const slot = document.createElement('div');
        slot.className = 'time-axis-slot';
        slot.innerText = `${String(hour).padStart(2, '0')}:00`;
        timeAxis.appendChild(slot);
    }
    timeGridLayout.appendChild(timeAxis);

    // 2. Colunas dos dias da semana
    const columnsWrapper = document.createElement('div');
    columnsWrapper.className = 'columns-wrapper';

    const appointments = getAppointments();
    const patients = getPatients();
    const procedures = getProcedures();
    const today = new Date();

    for (let d = 0; d < 7; d++) {
        const dayDate = new Date(startOfWeek);
        dayDate.setDate(startOfWeek.getDate() + d);
        const isToday = dayDate.getDate() === today.getDate() && 
                        dayDate.getMonth() === today.getMonth() && 
                        dayDate.getFullYear() === today.getFullYear();

        const dayColumn = document.createElement('div');
        dayColumn.className = `day-column ${isToday ? 'today' : ''}`;

        // Header da coluna do dia
        const colHeader = document.createElement('div');
        colHeader.className = 'day-column-header';
        
        const dayName = document.createElement('span');
        dayName.className = 'day-name';
        dayName.innerText = WEEKDAY_NAMES[d];

        const dayNum = document.createElement('span');
        dayNum.className = 'day-date';
        dayNum.innerText = dayDate.getDate();

        colHeader.appendChild(dayName);
        colHeader.appendChild(dayNum);
        dayColumn.appendChild(colHeader);

        // Fundo das faixas horárias
        for (let hour = 8; hour <= 18; hour++) {
            const slotBg = document.createElement('div');
            slotBg.className = 'hour-slot-bg';
            
            // Duplo clique na hora cria consulta nessa hora
            slotBg.addEventListener('dblclick', () => {
                const yyyy = dayDate.getFullYear();
                const mm = String(dayDate.getMonth() + 1).padStart(2, '0');
                const dd = String(dayDate.getDate()).padStart(2, '0');
                const hourStr = String(hour).padStart(2, '0') + ':00';
                openNewAppointmentModal(`${yyyy}-${mm}-${dd}`, hourStr);
            });
            
            dayColumn.appendChild(slotBg);
        }

        // Renderizar consultas deste dia na coluna correspondente
        const dateStr = dayDate.toISOString().split('T')[0];
        const dayApps = appointments.filter(app => app.dateTimeStart.startsWith(dateStr));

        dayApps.forEach(app => {
            const pat = patients.find(p => p.id === app.patientId);
            const proc = procedures.find(p => p.id === app.procedureId);
            if (!pat) return;

            const timeStart = new Date(app.dateTimeStart);
            const timeEnd = new Date(app.dateTimeEnd);

            const startHour = timeStart.getHours();
            const startMin = timeStart.getMinutes();
            const endHour = timeEnd.getHours();
            const endMin = timeEnd.getMinutes();

            // Posição no grid (dia útil padrão das 08:00 às 19:00 = fim do slot das 18h)
            // Se a consulta começa antes das 08:00 ou termina após 19:00, ajustamos visualmente
            const activeStart = Math.max(8, startHour + startMin / 60);
            const activeEnd = Math.min(19, endHour + endMin / 60);

            if (activeEnd > activeStart) {
                // Eixo começa às 08h. Cada hora tem 60px. Header da coluna tem 50px
                const topOffset = 50 + (activeStart - 8) * 60;
                const cardHeight = (activeEnd - activeStart) * 60;

                const eventCard = document.createElement('div');
                eventCard.className = `calendar-event-card status-${app.status}`;
                eventCard.style.top = `${topOffset}px`;
                eventCard.style.height = `${cardHeight}px`;

                const patName = document.createElement('span');
                patName.className = 'event-patient-name';
                patName.innerText = pat.name;

                const procTime = document.createElement('span');
                procTime.className = 'event-proc-time';
                procTime.innerText = `${formatBrazilianTime(app.dateTimeStart)} • ${proc ? proc.name.split(' ')[0] : 'Consulta'}`;

                eventCard.appendChild(patName);
                eventCard.appendChild(procTime);

                eventCard.addEventListener('click', () => {
                    openEditAppointmentModal(app.id);
                });

                dayColumn.appendChild(eventCard);
            }
        });

        columnsWrapper.appendChild(dayColumn);
    }
    
    timeGridLayout.appendChild(columnsWrapper);
    container.appendChild(timeGridLayout);
}

// 3. RENDERIZAÇÃO DA VISTA DIÁRIA
function renderDayView(container) {
    const dayLabel = `${currentDate.getDate()} de ${MONTH_NAMES[currentDate.getMonth()]} de ${currentDate.getFullYear()}`;
    document.getElementById('calendar-date-label').innerText = dayLabel;

    // A vista diária é estruturalmente idêntica à vista semanal, mas apenas com a coluna do dia selecionado
    const timeGridLayout = document.createElement('div');
    timeGridLayout.className = 'time-grid-layout';

    // 1. Eixo vertical do horário (08:00 às 18:00)
    const timeAxis = document.createElement('div');
    timeAxis.className = 'time-axis';
    
    const timeAxisHeader = document.createElement('div');
    timeAxisHeader.className = 'time-axis-header';
    timeAxis.appendChild(timeAxisHeader);

    for (let hour = 8; hour <= 18; hour++) {
        const slot = document.createElement('div');
        slot.className = 'time-axis-slot';
        slot.innerText = `${String(hour).padStart(2, '0')}:00`;
        timeAxis.appendChild(slot);
    }
    timeGridLayout.appendChild(timeAxis);

    // 2. Coluna única do dia
    const columnsWrapper = document.createElement('div');
    columnsWrapper.className = 'columns-wrapper';

    const appointments = getAppointments();
    const patients = getPatients();
    const procedures = getProcedures();
    const today = new Date();

    const isToday = currentDate.getDate() === today.getDate() && 
                    currentDate.getMonth() === today.getMonth() && 
                    currentDate.getFullYear() === today.getFullYear();

    const dayColumn = document.createElement('div');
    dayColumn.className = `day-column ${isToday ? 'today' : ''}`;
    dayColumn.style.minWidth = '300px'; // Coluna mais larga para caber os textos

    // Header da coluna
    const colHeader = document.createElement('div');
    colHeader.className = 'day-column-header';
    
    const dayName = document.createElement('span');
    dayName.className = 'day-name';
    dayName.innerText = WEEKDAY_NAMES[currentDate.getDay()];

    const dayNum = document.createElement('span');
    dayNum.className = 'day-date';
    dayNum.innerText = currentDate.getDate();

    colHeader.appendChild(dayName);
    colHeader.appendChild(dayNum);
    dayColumn.appendChild(colHeader);

    // Fundo das faixas
    for (let hour = 8; hour <= 18; hour++) {
        const slotBg = document.createElement('div');
        slotBg.className = 'hour-slot-bg';
        
        slotBg.addEventListener('dblclick', () => {
            const yyyy = currentDate.getFullYear();
            const mm = String(currentDate.getMonth() + 1).padStart(2, '0');
            const dd = String(currentDate.getDate()).padStart(2, '0');
            const hourStr = String(hour).padStart(2, '0') + ':00';
            openNewAppointmentModal(`${yyyy}-${mm}-${dd}`, hourStr);
        });

        dayColumn.appendChild(slotBg);
    }

    // Renderizar consultas
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayApps = appointments.filter(app => app.dateTimeStart.startsWith(dateStr));

    dayApps.forEach(app => {
        const pat = patients.find(p => p.id === app.patientId);
        const proc = procedures.find(p => p.id === app.procedureId);
        if (!pat) return;

        const timeStart = new Date(app.dateTimeStart);
        const timeEnd = new Date(app.dateTimeEnd);

        const startHour = timeStart.getHours();
        const startMin = timeStart.getMinutes();
        const endHour = timeEnd.getHours();
        const endMin = timeEnd.getMinutes();

        const activeStart = Math.max(8, startHour + startMin / 60);
        const activeEnd = Math.min(19, endHour + endMin / 60);

        if (activeEnd > activeStart) {
            const topOffset = 50 + (activeStart - 8) * 60;
            const cardHeight = (activeEnd - activeStart) * 60;

            const eventCard = document.createElement('div');
            eventCard.className = `calendar-event-card status-${app.status}`;
            eventCard.style.top = `${topOffset}px`;
            eventCard.style.height = `${cardHeight}px`;

            const patName = document.createElement('span');
            patName.className = 'event-patient-name';
            patName.style.fontSize = '12px';
            patName.innerText = pat.name;

            const procTime = document.createElement('span');
            procTime.className = 'event-proc-time';
            procTime.style.fontSize = '10px';
            procTime.innerText = `${formatBrazilianTime(app.dateTimeStart)} - ${formatBrazilianTime(app.dateTimeEnd)} • ${proc ? proc.name : 'Avaliação'} • Obs: ${app.notes || 'Sem observações'}`;

            eventCard.appendChild(patName);
            eventCard.appendChild(procTime);

            eventCard.addEventListener('click', () => {
                openEditAppointmentModal(app.id);
            });

            dayColumn.appendChild(eventCard);
        }
    });

    columnsWrapper.appendChild(dayColumn);
    timeGridLayout.appendChild(columnsWrapper);
    container.appendChild(timeGridLayout);
}

// ----------------------------------------------------
// OPERAÇÕES DO MODAL DE CONSULTAS
// ----------------------------------------------------

function openNewAppointmentModal(prefilledDate = null, prefilledTime = null) {
    const modal = document.getElementById('appointment-modal');
    document.getElementById('appointment-form').reset();
    document.getElementById('app-id').value = '';
    document.getElementById('modal-title').innerText = 'Novo Agendamento';
    document.getElementById('btn-delete-app').style.display = 'none';

    // Setar valores pré-definidos ou atuais
    const dateInput = document.getElementById('app-date');
    const startInput = document.getElementById('app-time-start');
    const endInput = document.getElementById('app-time-end');
    const statusInput = document.getElementById('app-status');

    if (prefilledDate) {
        dateInput.value = prefilledDate;
    } else {
        dateInput.value = new Date().toISOString().split('T')[0];
    }

    if (prefilledTime) {
        startInput.value = prefilledTime;
        // Calcular fim automaticamente para 45 minutos depois
        const [h, m] = prefilledTime.split(':').map(Number);
        const endD = new Date();
        endD.setHours(h);
        endD.setMinutes(m + 45);
        endInput.value = `${String(endD.getHours()).padStart(2, '0')}:${String(endD.getMinutes()).padStart(2, '0')}`;
    } else {
        startInput.value = '09:00';
        endInput.value = '09:45';
    }

    statusInput.value = 'pending';

    modal.style.display = 'flex';
}

function openEditAppointmentModal(appId) {
    const appointments = getAppointments();
    const app = appointments.find(a => a.id === appId);
    if (!app) return;

    const modal = document.getElementById('appointment-modal');
    document.getElementById('modal-title').innerText = 'Editar Agendamento';
    document.getElementById('app-id').value = app.id;
    document.getElementById('btn-delete-app').style.display = 'block';

    document.getElementById('app-patient').value = app.patientId;
    document.getElementById('app-procedure').value = app.procedureId;
    
    // Separar data e hora do formato ISO
    const datePart = app.dateTimeStart.split('T')[0];
    const startHour = app.dateTimeStart.split('T')[1].substring(0, 5);
    const endHour = app.dateTimeEnd.split('T')[1].substring(0, 5);

    document.getElementById('app-date').value = datePart;
    document.getElementById('app-time-start').value = startHour;
    document.getElementById('app-time-end').value = endHour;
    document.getElementById('app-status').value = app.status;
    document.getElementById('app-notes').value = app.notes || '';

    modal.style.display = 'flex';
}

function closeAppointmentModal() {
    document.getElementById('appointment-modal').style.display = 'none';
}

function handleAppointmentSubmit(e) {
    e.preventDefault();

    const appId = document.getElementById('app-id').value;
    const patientId = document.getElementById('app-patient').value;
    const procedureId = document.getElementById('app-procedure').value;
    const date = document.getElementById('app-date').value;
    const timeStart = document.getElementById('app-time-start').value;
    const timeEnd = document.getElementById('app-time-end').value;
    const status = document.getElementById('app-status').value;
    const notes = document.getElementById('app-notes').value.trim();

    // Validações básicas de horários
    if (timeStart >= timeEnd) {
        alert('A hora de início da consulta deve ser anterior à hora de término.');
        return;
    }

    const dateTimeStart = `${date}T${timeStart}`;
    const dateTimeEnd = `${date}T${timeEnd}`;

    const appData = {
        patientId,
        procedureId,
        dateTimeStart,
        dateTimeEnd,
        status,
        notes
    };

    if (appId) {
        // Editando consulta existente
        updateAppointment(appId, appData);
    } else {
        // Criando consulta nova
        addAppointment(appData);
    }

    closeAppointmentModal();
    renderCalendar();
}

function handleDeleteAppointment() {
    const appId = document.getElementById('app-id').value;
    if (!appId) return;

    if (confirm('Tem certeza de que deseja remover este agendamento?')) {
        deleteAppointment(appId);
        closeAppointmentModal();
        renderCalendar();
    }
}
