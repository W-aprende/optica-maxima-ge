// Sistema de Gestión Óptica - Optica Maxima G.E
// Base de datos y lógica principal

class OpticManager {
    constructor() {
        this.db = {
            patients: JSON.parse(localStorage.getItem('patients') || '[]'),
            orders: JSON.parse(localStorage.getItem('orders') || '[]'),
            invoices: JSON.parse(localStorage.getItem('invoices') || '[]'),
            appointments: JSON.parse(localStorage.getItem('appointments') || '[]'),
            messages: JSON.parse(localStorage.getItem('messages') || '[]')
        };
        this.currentSection = 'Inicio';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateInicio();
        this.populateSelects();
        this.showSection('Inicio'); // Mostrar Inicio al inicio
        this.initializeTypedText();
        this.animateStatsCards();
    }

    // Guardar datos en localStorage
    saveData() {
        localStorage.setItem('patients', JSON.stringify(this.db.patients));
        localStorage.setItem('orders', JSON.stringify(this.db.orders));
        localStorage.setItem('invoices', JSON.stringify(this.db.invoices));
        localStorage.setItem('appointments', JSON.stringify(this.db.appointments));
        localStorage.setItem('messages', JSON.stringify(this.db.messages));
    }

    // Configurar event listeners
    setupEventListeners() {
        // Formularios
        document.getElementById('patientForm')?.addEventListener('submit', (e) => this.handlePatientSubmit(e));
        document.getElementById('orderForm')?.addEventListener('submit', (e) => this.handleOrderSubmit(e));
        document.getElementById('invoiceForm')?.addEventListener('submit', (e) => this.handleInvoiceSubmit(e));
        document.getElementById('appointmentForm')?.addEventListener('submit', (e) => this.handleAppointmentSubmit(e));
        document.getElementById('whatsappForm')?.addEventListener('submit', (e) => this.handleWhatsAppSubmit(e));
    }

    // Mostrar sección específica
    showSection(sectionName) {
        console.log('Mostrando sección:', sectionName);
        
        // Ocultar todas las secciones
        document.querySelectorAll('.section').forEach(section => {
            section.classList.add('hidden');
        });

        // Mostrar la sección seleccionada
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.remove('hidden');
            this.currentSection = sectionName;
            
            // Actualizar navegación activa
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.remove('bg-navy', 'text-white');
                btn.classList.add('text-gray-700');
            });
            
            // Marcar el botón activo
            const sectionNames = {
                'Inicio': 'Inicio',
                'patients': 'Pacientes',
                'orders': 'Pedidos',
                'invoices': 'Facturas',
                'appointments': 'Citas',
                'notifications': 'WhatsApp'
            };
            
            const activeText = sectionNames[sectionName];
            const activeBtn = Array.from(document.querySelectorAll('.nav-btn'))
                .find(btn => btn.textContent.trim() === activeText);
            
            if (activeBtn) {
                activeBtn.classList.remove('text-gray-700');
                activeBtn.classList.add('bg-navy', 'text-white');
            }

            // Actualizar contenido de la sección
            this.updateSection(sectionName);
        } else {
            console.error('Sección no encontrada:', sectionName);
        }
    }

    // Actualizar sección específica
    updateSection(sectionName) {
        console.log('Actualizando sección:', sectionName);
        switch(sectionName) {
            case 'Inicio':
                this.updateInicio();
                break;
            case 'patients':
                this.updatePatientsTable();
                break;
            case 'orders':
                this.updateOrdersTable();
                break;
            case 'invoices':
                this.updateInvoicesTable();
                break;
            case 'appointments':
                this.updateAppointmentsTable();
                break;
            case 'notifications':
                this.updateMessageHistory();
                break;
        }
    }

    // Actualizar Inicio
    updateInicio() {
        // Estadísticas
        document.getElementById('totalPatients').textContent = this.db.patients.length;
        document.getElementById('activeOrders').textContent = this.db.orders.filter(order => order.status === 'active').length;
        document.getElementById('todayAppointments').textContent = this.getTodayAppointments().length;
        document.getElementById('monthlyRevenue').textContent = this.getMonthlyRevenue();

        // Últimos pedidos
        this.updateRecentOrders();
        
        // Próximas citas
        this.updateUpcomingAppointments();
    }

    // Obtener citas de hoy
    getTodayAppointments() {
        const today = new Date().toISOString().split('T')[0];
        return this.db.appointments.filter(apt => apt.date === today);
    }

    // Obtener ingresos del mes
    getMonthlyRevenue() {
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyInvoices = this.db.invoices.filter(invoice => {
            const invoiceDate = new Date(invoice.date);
            return invoiceDate.getMonth() === currentMonth && invoiceDate.getFullYear() === currentYear;
        });
        
        const total = monthlyInvoices.reduce((sum, invoice) => sum + parseFloat(invoice.amount), 0);
        return `$${total.toFixed(2)}`;
    }

    // Actualizar pedidos recientes
    updateRecentOrders() {
        const container = document.getElementById('recentOrders');
        const recentOrders = this.db.orders.slice(-5).reverse();
        
        container.innerHTML = recentOrders.map(order => {
            const patient = this.db.patients.find(p => p.id === order.patientId);
            return `
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                        <p class="font-medium text-gray-800">${patient ? patient.name : 'Paciente no encontrado'}</p>
                        <p class="text-sm text-gray-600">${order.lensType} - ${order.material || 'Sin especificar'}</p>
                    </div>
                    <div class="text-right">
                        <p class="font-medium text-navy">$${order.price}</p>
                        <p class="text-sm ${order.status === 'active' ? 'text-green-600' : 'text-gray-600'}">${order.status === 'active' ? 'Activo' : 'Completado'}</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Actualizar próximas citas
    updateUpcomingAppointments() {
        const container = document.getElementById('upcomingAppointments');
        const upcomingAppointments = this.db.appointments
            .filter(apt => new Date(apt.date + ' ' + apt.time) >= new Date())
            .sort((a, b) => new Date(a.date + ' ' + a.time) - new Date(b.date + ' ' + b.time))
            .slice(0, 5);
        
        container.innerHTML = upcomingAppointments.map(apt => {
            const patient = this.db.patients.find(p => p.id === apt.patientId);
            return `
                <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                        <p class="font-medium text-gray-800">${patient ? patient.name : 'Paciente no encontrado'}</p>
                        <p class="text-sm text-gray-600">${apt.type} - ${apt.date} ${apt.time}</p>
                    </div>
                    <div class="text-right">
                        <p class="text-sm ${apt.status === 'confirmed' ? 'text-green-600' : 'text-yellow-600'}">${apt.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Manejar envío de formulario de paciente
    handlePatientSubmit(e) {
        e.preventDefault();
        
        const patientData = {
            id: Date.now().toString(),
            name: document.getElementById('patientName').value,
            phone: document.getElementById('patientPhone').value,
            email: document.getElementById('patientEmail').value,
            birthDate: document.getElementById('patientBirthDate').value,
            address: document.getElementById('patientAddress').value,
            createdAt: new Date().toISOString()
        };

        this.db.patients.push(patientData);
        this.saveData();
        this.updateInicio();
        this.updatePatientsTable();
        this.populateSelects();
        
        // Limpiar formulario
        e.target.reset();
        this.togglePatientForm();
        
        this.showNotification('Paciente registrado exitosamente', 'success');
    }

    // Manejar envío de formulario de pedido
    handleOrderSubmit(e) {
        e.preventDefault();
        
        const orderData = {
            id: Date.now().toString(),
            patientId: document.getElementById('orderPatient').value,
            lensType: document.getElementById('lensType').value,
            material: document.getElementById('lensMaterial').value,
            price: parseFloat(document.getElementById('orderPrice').value),
            notes: document.getElementById('orderNotes').value,
            status: 'active',
            createdAt: new Date().toISOString()
        };

        this.db.orders.push(orderData);
        this.saveData();
        this.updateInicio();
        this.updateOrdersTable();
        
        // Limpiar formulario
        e.target.reset();
        
        this.showNotification('Pedido registrado exitosamente', 'success');
    }

    // Manejar envío de formulario de factura
    handleInvoiceSubmit(e) {
        e.preventDefault();
        
        const invoiceData = {
            id: Date.now().toString(),
            number: this.generateInvoiceNumber(),
            patientId: document.getElementById('invoicePatient').value,
            concept: document.getElementById('invoiceConcept').value,
            amount: parseFloat(document.getElementById('invoiceAmount').value),
            paymentMethod: document.getElementById('invoicePaymentMethod').value,
            date: new Date().toISOString().split('T')[0],
            status: 'paid'
        };

        this.db.invoices.push(invoiceData);
        this.saveData();
        this.updateInicio();
        this.updateInvoicesTable();
        
        // Limpiar formulario
        e.target.reset();
        
        this.showNotification('Factura generada exitosamente', 'success');
    }

    // Manejar envío de formulario de cita
    handleAppointmentSubmit(e) {
        e.preventDefault();
        
        const appointmentData = {
            id: Date.now().toString(),
            patientId: document.getElementById('appointmentPatient').value,
            date: document.getElementById('appointmentDate').value,
            time: document.getElementById('appointmentTime').value,
            type: document.getElementById('appointmentType').value,
            notes: document.getElementById('appointmentNotes').value,
            status: 'confirmed',
            createdAt: new Date().toISOString()
        };

        this.db.appointments.push(appointmentData);
        this.saveData();
        this.updateInicio();
        this.updateAppointmentsTable();
        
        // Limpiar formulario
        e.target.reset();
        
        this.showNotification('Cita agendada exitosamente', 'success');
    }

    // Manejar envío de formulario de WhatsApp
    handleWhatsAppSubmit(e) {
        e.preventDefault();
        
        const patientId = document.getElementById('whatsappPatient').value;
        const message = document.getElementById('whatsappMessage').value;
        const patient = this.db.patients.find(p => p.id === patientId);
        
        if (patient && patient.phone) {
            // Simular envío de WhatsApp
            const messageData = {
                id: Date.now().toString(),
                patientId: patientId,
                patientName: patient.name,
                phone: patient.phone,
                message: message,
                type: document.getElementById('messageType').value,
                sentAt: new Date().toISOString(),
                status: 'sent'
            };

            this.db.messages.push(messageData);
            this.saveData();
            this.updateMessageHistory();
            
            // Limpiar formulario
            e.target.reset();
            
            this.showNotification('Mensaje enviado exitosamente', 'success');
            
            // Abrir WhatsApp Web (simulado)
            const whatsappUrl = `https://wa.me/${patient.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        } else {
            this.showNotification('No se pudo enviar el mensaje. Verifica el teléfono del paciente.', 'error');
        }
    }

    // Generar número de factura
    generateInvoiceNumber() {
        const year = new Date().getFullYear();
        const count = this.db.invoices.length + 1;
        return `${year}-${count.toString().padStart(4, '0')}`;
    }

    // Actualizar tabla de pacientes
    updatePatientsTable() {
        const tbody = document.getElementById('patientsTable');
        if (!tbody) return;
        
        tbody.innerHTML = this.db.patients.map(patient => `
            <tr class="border-b border-gray-100 hover:bg-gray-50">
                <td class="py-3 px-4">${patient.name}</td>
                <td class="py-3 px-4">${patient.phone}</td>
                <td class="py-3 px-4">${patient.email || '-'}</td>
                <td class="py-3 px-4">
                    <button onclick="opticManager.editPatient('${patient.id}')" class="text-blue-600 hover:text-blue-800 mr-2">Editar</button>
                    <button onclick="opticManager.deletePatient('${patient.id}')" class="text-red-600 hover:text-red-800">Eliminar</button>
                </td>
            </tr>
        `).join('');
    }

    // Actualizar tabla de pedidos
    updateOrdersTable() {
        const tbody = document.getElementById('ordersTable');
        if (!tbody) return;
        
        tbody.innerHTML = this.db.orders.map(order => {
            const patient = this.db.patients.find(p => p.id === order.patientId);
            return `
                <tr class="border-b border-gray-100 hover:bg-gray-50">
                    <td class="py-3 px-4">${patient ? patient.name : 'Paciente no encontrado'}</td>
                    <td class="py-3 px-4">${order.lensType}</td>
                    <td class="py-3 px-4">${order.material || '-'}</td>
                    <td class="py-3 px-4">$${order.price}</td>
                    <td class="py-3 px-4">
                        <span class="px-2 py-1 rounded-full text-xs ${order.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                            ${order.status === 'active' ? 'Activo' : 'Completado'}
                        </span>
                    </td>
                    <td class="py-3 px-4">
                        <button onclick="opticManager.completeOrder('${order.id}')" class="text-green-600 hover:text-green-800 mr-2">${order.status === 'active' ? 'Completar' : 'Reactivar'}</button>
                        <button onclick="opticManager.deleteOrder('${order.id}')" class="text-red-600 hover:text-red-800">Eliminar</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Actualizar tabla de facturas
    updateInvoicesTable() {
        const tbody = document.getElementById('invoicesTable');
        if (!tbody) return;
        
        tbody.innerHTML = this.db.invoices.map(invoice => {
            const patient = this.db.patients.find(p => p.id === invoice.patientId);
            return `
                <tr class="border-b border-gray-100 hover:bg-gray-50">
                    <td class="py-3 px-4">${invoice.number}</td>
                    <td class="py-3 px-4">${patient ? patient.name : 'Paciente no encontrado'}</td>
                    <td class="py-3 px-4">${invoice.concept}</td>
                    <td class="py-3 px-4">$${invoice.amount}</td>
                    <td class="py-3 px-4">${new Date(invoice.date).toLocaleDateString()}</td>
                    <td class="py-3 px-4">${invoice.paymentMethod}</td>
                    <td class="py-3 px-4">
                        <button onclick="opticManager.printInvoice('${invoice.id}')" class="text-blue-600 hover:text-blue-800 mr-2">Imprimir</button>
                        <button onclick="opticManager.deleteInvoice('${invoice.id}')" class="text-red-600 hover:text-red-800">Eliminar</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Actualizar tabla de citas
    updateAppointmentsTable() {
        const tbody = document.getElementById('appointmentsTable');
        if (!tbody) return;
        
        tbody.innerHTML = this.db.appointments.map(apt => {
            const patient = this.db.patients.find(p => p.id === apt.patientId);
            return `
                <tr class="border-b border-gray-100 hover:bg-gray-50">
                    <td class="py-3 px-4">${patient ? patient.name : 'Paciente no encontrado'}</td>
                    <td class="py-3 px-4">${apt.date}</td>
                    <td class="py-3 px-4">${apt.time}</td>
                    <td class="py-3 px-4">${apt.type}</td>
                    <td class="py-3 px-4">
                        <span class="px-2 py-1 rounded-full text-xs ${apt.status === 'confirmed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                            ${apt.status === 'confirmed' ? 'Confirmada' : 'Pendiente'}
                        </span>
                    </td>
                    <td class="py-3 px-4">
                        <button onclick="opticManager.sendAppointmentReminder('${apt.id}')" class="text-green-600 hover:text-green-800 mr-2">Recordar</button>
                        <button onclick="opticManager.deleteAppointment('${apt.id}')" class="text-red-600 hover:text-red-800">Eliminar</button>
                    </td>
                </tr>
            `;
        }).join('');
    }

    // Actualizar historial de mensajes
    updateMessageHistory() {
        const tbody = document.getElementById('messageHistory');
        if (!tbody) return;
        
        tbody.innerHTML = this.db.messages.slice(-10).reverse().map(msg => `
            <tr class="border-b border-gray-100 hover:bg-gray-50">
                <td class="py-3 px-4">${msg.patientName}</td>
                <td class="py-3 px-4">${msg.type}</td>
                <td class="py-3 px-4 max-w-xs truncate">${msg.message}</td>
                <td class="py-3 px-4">${new Date(msg.sentAt).toLocaleDateString()}</td>
                <td class="py-3 px-4">
                    <span class="px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                        Enviado
                    </span>
                </td>
            </tr>
        `).join('');
    }

    // Llenar selects con datos de pacientes
    populateSelects() {
        const selects = ['orderPatient', 'invoicePatient', 'appointmentPatient', 'whatsappPatient'];
        
        selects.forEach(selectId => {
            const select = document.getElementById(selectId);
            if (select) {
                select.innerHTML = '<option value="">Seleccionar paciente...</option>';
                this.db.patients.forEach(patient => {
                    const option = document.createElement('option');
                    option.value = patient.id;
                    option.textContent = patient.name;
                    select.appendChild(option);
                });
            }
        });
    }

    // Generar reporte
    generateReport(type) {
        let filteredInvoices = [];
        const now = new Date();
        
        switch(type) {
            case 'daily':
                const today = now.toISOString().split('T')[0];
                filteredInvoices = this.db.invoices.filter(inv => inv.date === today);
                break;
            case 'weekly':
                const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                filteredInvoices = this.db.invoices.filter(inv => new Date(inv.date) >= weekAgo);
                break;
            case 'monthly':
                const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
                filteredInvoices = this.db.invoices.filter(inv => new Date(inv.date) >= monthAgo);
                break;
        }
        
        const total = filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0);
        const count = filteredInvoices.length;
        
        const container = document.getElementById('reportSummary');
        if (!container) return;
        
        container.innerHTML = `
            <div class="bg-blue-50 p-4 rounded-lg">
                <h4 class="font-semibold text-navy">Facturas (${type})</h4>
                <p class="text-2xl font-bold text-navy">${count}</p>
            </div>
            <div class="bg-green-50 p-4 rounded-lg">
                <h4 class="font-semibold text-navy">Total Ingresos</h4>
                <p class="text-2xl font-bold text-navy">$${total.toFixed(2)}</p>
            </div>
            <div class="bg-purple-50 p-4 rounded-lg">
                <h4 class="font-semibold text-navy">Promedio</h4>
                <p class="text-2xl font-bold text-navy">$${count > 0 ? (total / count).toFixed(2) : '0.00'}</p>
            </div>
        `;
    }

    // Mostrar/ocultar formulario de paciente
    togglePatientForm() {
        const form = document.getElementById('patientForm');
        if (form) {
            form.classList.toggle('hidden');
        }
    }

    // Inicializar texto animado
    initializeTypedText() {
        if (typeof Typed !== 'undefined') {
            new Typed('#typed-text', {
                strings: ['Bienvenido a Optica Maxima G.E', 'Sistema de Gestión Óptica', 'Administra tu consultorio'],
                typeSpeed: 50,
                backSpeed: 30,
                backDelay: 2000,
                loop: true
            });
        }
    }

    // Animar tarjetas de estadísticas
    animateStatsCards() {
        if (typeof anime !== 'undefined') {
            anime({
                targets: '.hover-lift',
                translateY: [20, 0],
                opacity: [0, 1],
                delay: anime.stagger(100),
                duration: 800,
                easing: 'easeOutExpo'
            });
        }
    }

    // Mostrar notificación
    showNotification(message, type = 'info') {
        // Crear elemento de notificación
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            type === 'success' ? 'bg-green-500 text-white' :
            type === 'error' ? 'bg-red-500 text-white' :
            'bg-blue-500 text-white'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animar entrada
        if (typeof anime !== 'undefined') {
            anime({
                targets: notification,
                translateX: [300, 0],
                opacity: [0, 1],
                duration: 300,
                easing: 'easeOutExpo'
            });
        }
        
        // Remover después de 3 segundos
        setTimeout(() => {
            if (typeof anime !== 'undefined') {
                anime({
                    targets: notification,
                    translateX: [0, 300],
                    opacity: [1, 0],
                    duration: 300,
                    easing: 'easeInExpo',
                    complete: () => notification.remove()
                });
            } else {
                notification.remove();
            }
        }, 3000);
    }

    // Funciones auxiliares
    completeOrder(orderId) {
        const order = this.db.orders.find(o => o.id === orderId);
        if (order) {
            order.status = order.status === 'active' ? 'completed' : 'active';
            this.saveData();
            this.updateOrdersTable();
            this.updateInicio();
            this.showNotification('Estado del pedido actualizado', 'success');
        }
    }

    deletePatient(patientId) {
        if (confirm('¿Estás seguro de eliminar este paciente?')) {
            this.db.patients = this.db.patients.filter(p => p.id !== patientId);
            this.saveData();
            this.updateInicio();
            this.updatePatientsTable();
            this.populateSelects();
            this.showNotification('Paciente eliminado', 'success');
        }
    }

    deleteOrder(orderId) {
        if (confirm('¿Estás seguro de eliminar este pedido?')) {
            this.db.orders = this.db.orders.filter(o => o.id !== orderId);
            this.saveData();
            this.updateOrdersTable();
            this.updateInicio();
            this.showNotification('Pedido eliminado', 'success');
        }
    }

    deleteInvoice(invoiceId) {
        if (confirm('¿Estás seguro de eliminar esta factura?')) {
            this.db.invoices = this.db.invoices.filter(i => i.id !== invoiceId);
            this.saveData();
            this.updateInvoicesTable();
            this.updateInicio();
            this.showNotification('Factura eliminada', 'success');
        }
    }

    deleteAppointment(appointmentId) {
        if (confirm('¿Estás seguro de eliminar esta cita?')) {
            this.db.appointments = this.db.appointments.filter(a => a.id !== appointmentId);
            this.saveData();
            this.updateAppointmentsTable();
            this.updateInicio();
            this.showNotification('Cita eliminada', 'success');
        }
    }

    printInvoice(invoiceId) {
        const invoice = this.db.invoices.find(i => i.id === invoiceId);
        const patient = this.db.patients.find(p => p.id === invoice.patientId);
        
        if (invoice && patient) {
            const printContent = `
                <div style="font-family: Arial, sans-serif; padding: 20px;">
                    <h2 style="text-align: center; color: #1e3a8a;">FACTURA</h2>
                    <p><strong>Número:</strong> ${invoice.number}</p>
                    <p><strong>Fecha:</strong> ${invoice.date}</p>
                    <p><strong>Paciente:</strong> ${patient.name}</p>
                    <p><strong>Teléfono:</strong> ${patient.phone}</p>
                    <hr style="margin: 20px 0;">
                    <p><strong>Concepto:</strong> ${invoice.concept}</p>
                    <p><strong>Monto:</strong> $${invoice.amount}</p>
                    <p><strong>Método de Pago:</strong> ${invoice.paymentMethod}</p>
                    <hr style="margin: 20px 0;">
                    <p style="text-align: center; font-size: 12px; color: #666;">
                        Gracias por su confianza en Optica Maxima G.E
                    </p>
                </div>
            `;
            
            const printWindow = window.open('', '_blank');
            printWindow.document.write(printContent);
            printWindow.document.close();
            printWindow.print();
        }
    }

    sendAppointmentReminder(appointmentId) {
        const appointment = this.db.appointments.find(a => a.id === appointmentId);
        const patient = this.db.patients.find(p => p.id === appointment.patientId);
        
        if (appointment && patient) {
            const message = `Hola ${patient.name}, te recordamos que tienes una cita programada para el ${appointment.date} a las ${appointment.time}. Tipo: ${appointment.type}. Esperamos verte pronto.`;
            
            // Abrir WhatsApp con el mensaje
            const whatsappUrl = `https://wa.me/${patient.phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
            
            this.showNotification('Recordatorio enviado por WhatsApp', 'success');
        }
    }
}

// Funciones globales para los botones
function showSection(sectionName) {
    console.log('Función global showSection llamada con:', sectionName);
    if (opticManager) {
        opticManager.showSection(sectionName);
    } else {
        console.error('opticManager no está definido');
    }
}

function togglePatientForm() {
    if (opticManager) {
        opticManager.togglePatientForm();
    }
}

function generateReport(type) {
    if (opticManager) {
        opticManager.generateReport(type);
    }
}

function useTemplate(templateType) {
    const messageField = document.getElementById('whatsappMessage');
    const templates = {
        followup: 'Hola [Nombre], queremos informarte que tu pedido de lentes está en proceso. Te avisaremos cuando esté listo. Gracias por tu paciencia.',
        ready: '¡Hola [Nombre]! Tu pedido de lentes ya está listo para recoger. Puedes pasar en cualquier momento durante nuestro horario de atención.',
        appointment: 'Hola [Nombre], te recordamos que tienes una cita programada para el [fecha] a las [hora]. Esperamos verte pronto.'
    };
    
    if (templates[templateType]) {
        messageField.value = templates[templateType];
    }
}

// Inicializar la aplicación
let opticManager;
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM cargado, inicializando OpticManager...');
    opticManager = new OpticManager();
});