/* ============================================
   فاتورتي - نظام إدارة الطلبات والفواتير
   Qatar Home Business SaaS MVP - Script
   ============================================ */

// ===== DUMMY DATA =====
const DUMMY_ORDERS = [
    {
        id: 'ORD-1001',
        customerName: 'مريم الخاطر',
        customerPhone: '+97455123456',
        product: 'عباية كريب ملكي مطرزة بخيوط ذهبية',
        quantity: 1,
        unitPrice: 850,
        deliveryFee: 30,
        notes: 'المقاس: M، اللون: أسود كلاسيكي، تطريز ذهبي على الأكمام',
        paymentStatus: 'مدفوع بالكامل',
        status: 'تم التسليم',
        date: '2026-11-15'
    },
    {
        id: 'ORD-1002',
        customerName: 'نوف السليطي',
        customerPhone: '+97433987654',
        product: 'بوكس كوكيز فاخر - 30 قطعة',
        quantity: 2,
        unitPrice: 185,
        deliveryFee: 25,
        notes: 'بوكس هدية بتغليف فاخر، كتابة على البوكس: "مبروك التخرج يا حصة"',
        paymentStatus: 'عربون',
        status: 'قيد التحضير',
        date: '2026-11-17'
    },
    {
        id: 'ORD-1003',
        customerName: 'دانة المري',
        customerPhone: '+97450456789',
        product: 'كيكة مناسبات ثلاث طبقات',
        quantity: 1,
        unitPrice: 650,
        deliveryFee: 40,
        notes: 'تصميم ورود طبيعية، نكهة ريد فلفت، كتابة: "عقد قران سعيد"',
        paymentStatus: 'الدفع عند الاستلام',
        status: 'جاهز للتوصيل',
        date: '2026-11-18'
    },
    {
        id: 'ORD-1004',
        customerName: 'فاطمة الكواري',
        customerPhone: '+97477112233',
        product: 'تنسيق هدية رخام مع نقش بالذهب',
        quantity: 3,
        unitPrice: 220,
        deliveryFee: 35,
        notes: 'صينية رخام أبيض + نقش الاسم بالذهب لكل قطعة، الأسماء: سارة، هند، ريم',
        paymentStatus: 'مدفوع بالكامل',
        status: 'قيد التحضير',
        date: '2026-11-16'
    },
    {
        id: 'ORD-1005',
        customerName: 'العنود الهاجري',
        customerPhone: '+97466554433',
        product: 'بوكس عطور فاخر مع تغليف هدية',
        quantity: 1,
        unitPrice: 475,
        deliveryFee: 20,
        notes: 'بوكس VIP يحتوي على 3 عطور مصغرة، تغليف بشريطة ذهبية، بطاقة إهداء',
        paymentStatus: 'عربون',
        status: 'تم التسليم',
        date: '2026-11-14'
    }
];

// ===== APP STATE =====
class App {
    constructor() {
        window.app = this;
        this.orders = [];
        this.currentFilter = 'all';
        this.searchQuery = '';
        this.currentOrderId = null;
        this.orderCounter = 1005;

        this.init();
    }

    // ===== INITIALIZATION =====
    init() {
        this.loadOrders();
        this.bindEvents();
        this.renderRecentOrders();
        this.renderAllOrders();
        this.updateStats();
    }

    renderDashboard() {
        this.renderRecentOrders();
        this.updateStats();
    }

    // ===== DATA MANAGEMENT =====
    loadOrders() {
        try {
            const saved = localStorage.getItem('fawatirty_orders');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    this.orders = parsed;
                    // Find highest order number
                    this.orders.forEach(order => {
                        const num = parseInt((order.id || '').replace('ORD-', ''));
                        if (!isNaN(num) && num > this.orderCounter) this.orderCounter = num;
                    });
                    return;
                }
            }
        } catch (e) {
            console.error('Error loading orders from localStorage:', e);
        }
        this.orders = [...DUMMY_ORDERS];
        this.saveOrders();
    }

    saveOrders() {
        localStorage.setItem('fawatirty_orders', JSON.stringify(this.orders));
    }

    generateOrderId() {
        this.orderCounter++;
        return `ORD-${this.orderCounter}`;
    }

    getOrderTotal(order) {
        return (order.quantity * order.unitPrice) + order.deliveryFee;
    }

    // ===== EVENT BINDINGS =====
    bindEvents() {
        // Sidebar toggle
        const menuToggle = document.getElementById('menuToggle');
        const sidebar = document.getElementById('sidebar');
        const sidebarClose = document.getElementById('sidebarClose');
        const sidebarOverlay = document.getElementById('sidebarOverlay');

        menuToggle.addEventListener('click', () => {
            sidebar.classList.add('open');
            sidebarOverlay.classList.add('active');
        });

        sidebarClose.addEventListener('click', () => {
            sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('active');
        });

        sidebarOverlay.addEventListener('click', () => {
            sidebar.classList.remove('open');
            sidebarOverlay.classList.remove('active');
        });

        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                if (page === 'dashboard' || page === 'orders') {
                    this.navigateTo(page);
                    sidebar.classList.remove('open');
                    sidebarOverlay.classList.remove('active');
                }
            });
        });

        // Link buttons (like "عرض الكل")
        document.querySelectorAll('.link-btn[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateTo(link.dataset.page);
            });
        });

        // New Order button
        document.getElementById('btnNewOrder').addEventListener('click', () => {
            this.openOrderModal();
        });

        // Order form live calculation
        const quantityInput = document.getElementById('quantity');
        const unitPriceInput = document.getElementById('unitPrice');
        const deliveryFeeInput = document.getElementById('deliveryFee');

        const updatePreview = () => this.updateOrderPreview();
        quantityInput.addEventListener('input', updatePreview);
        unitPriceInput.addEventListener('input', updatePreview);
        deliveryFeeInput.addEventListener('input', updatePreview);

        // Save order
        document.getElementById('btnSaveOrder').addEventListener('click', () => {
            this.saveNewOrder();
        });

        // Search
        document.getElementById('searchInput').addEventListener('input', (e) => {
            this.searchQuery = e.target.value.trim();
            this.renderAllOrders();
        });

        // Filter tabs
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentFilter = tab.dataset.filter;
                this.renderAllOrders();
            });
        });

        // Modal close buttons
        document.querySelectorAll('[data-close]').forEach(btn => {
            btn.addEventListener('click', () => {
                const modalId = btn.dataset.close;
                this.closeModal(modalId);
            });
        });

        // Close modals on overlay click
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.classList.remove('active');
                }
            });
        });

        // Print button
        document.getElementById('btnPrint').addEventListener('click', () => {
            window.print();
        });

        // WhatsApp button
        document.getElementById('btnWhatsApp').addEventListener('click', () => {
            this.sendWhatsApp();
        });

        // Delete confirmation
        document.getElementById('btnConfirmDelete').addEventListener('click', () => {
            this.confirmDelete();
        });

        // Keyboard escape to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.modal-overlay.active').forEach(modal => {
                    modal.classList.remove('active');
                });
            }
        });
    }

    // ===== NAVIGATION =====
    navigateTo(page) {
        // Update nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        // Update pages
        document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

        const pageTitle = document.getElementById('pageTitle');
        const pageSubtitle = document.getElementById('pageSubtitle');

        if (page === 'dashboard') {
            document.getElementById('pageDashboard').classList.add('active');
            pageTitle.textContent = 'لوحة التحكم';
            pageSubtitle.textContent = 'مرحباً بك، نورة 👋 إليك ملخص أعمالك اليوم';
            this.renderRecentOrders();
        } else if (page === 'orders') {
            document.getElementById('pageOrders').classList.add('active');
            pageTitle.textContent = 'إدارة الطلبات';
            pageSubtitle.textContent = 'عرض وإدارة جميع الطلبات والفواتير';
            this.renderAllOrders();
        }

        this.updateStats();
    }

    // ===== STATS =====
    updateStats() {
        const totalSales = this.orders.reduce((sum, o) => sum + this.getOrderTotal(o), 0);
        const active = this.orders.filter(o => o.status === 'قيد التحضير').length;
        const ready = this.orders.filter(o => o.status === 'جاهز للتوصيل').length;
        const completed = this.orders.filter(o => o.status === 'تم التسليم').length;

        this.animateCounter('statTotalSales', totalSales);
        this.animateCounter('statActive', active);
        this.animateCounter('statReady', ready);
        this.animateCounter('statCompleted', completed);
    }

    animateCounter(elementId, target) {
        const el = document.getElementById(elementId);
        const current = parseFloat(el.textContent.replace(/,/g, '')) || 0;
        const diff = target - current;
        const steps = 20;
        const increment = diff / steps;
        let step = 0;

        const timer = setInterval(() => {
            step++;
            const value = current + (increment * step);
            if (elementId === 'statTotalSales') {
                el.textContent = Math.round(value).toLocaleString('ar-QA');
            } else {
                el.textContent = Math.round(value);
            }
            if (step >= steps) {
                clearInterval(timer);
                if (elementId === 'statTotalSales') {
                    el.textContent = target.toLocaleString('ar-QA');
                } else {
                    el.textContent = target;
                }
            }
        }, 30);
    }

    // ===== RENDER TABLES =====
    renderRecentOrders() {
        const tbody = document.getElementById('recentOrdersBody');
        const recent = [...this.orders].reverse().slice(0, 5);

        tbody.innerHTML = recent.map(order => `
            <tr>
                <td class="cell-order-id">${order.id}</td>
                <td class="cell-customer">${order.customerName}</td>
                <td class="cell-product">${order.product}</td>
                <td class="cell-total">${this.getOrderTotal(order).toLocaleString('ar-QA')} ر.ق</td>
                <td>${this.getStatusBadge(order.status)}</td>
                <td>
                    <div class="actions-cell">
                        <button type="button" class="btn-icon btn-view" data-action="view" data-id="${order.id}" onclick="window.app.viewInvoice('${order.id}')" title="عرض الفاتورة">
                            <i class="fas fa-file-invoice"></i>
                        </button>
                        <button type="button" class="btn-icon btn-status" data-action="status" data-id="${order.id}" onclick="window.app.openStatusModal('${order.id}')" title="تغيير الحالة">
                            <i class="fas fa-exchange-alt"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderAllOrders() {
        const tbody = document.getElementById('allOrdersBody');
        const emptyState = document.getElementById('emptyState');

        let filtered = [...this.orders];

        // Apply filter
        if (this.currentFilter !== 'all') {
            filtered = filtered.filter(o => o.status === this.currentFilter);
        }

        // Apply search
        if (this.searchQuery) {
            const q = this.searchQuery.toLowerCase();
            filtered = filtered.filter(o =>
                o.customerName.toLowerCase().includes(q) ||
                o.id.toLowerCase().includes(q) ||
                o.product.toLowerCase().includes(q)
            );
        }

        // Sort: newest first
        filtered.reverse();

        if (filtered.length === 0) {
            tbody.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';

        tbody.innerHTML = filtered.map(order => `
            <tr>
                <td class="cell-order-id">${order.id}</td>
                <td class="cell-customer">${order.customerName}</td>
                <td class="cell-phone">${order.customerPhone}</td>
                <td class="cell-product" title="${order.product}">${order.product}</td>
                <td>${order.quantity}</td>
                <td class="cell-total">${this.getOrderTotal(order).toLocaleString('ar-QA')} ر.ق</td>
                <td>${this.getPaymentBadge(order.paymentStatus)}</td>
                <td>${this.getStatusBadge(order.status)}</td>
                <td>
                    <div class="actions-cell">
                        <button type="button" class="btn-icon btn-view" data-action="view" data-id="${order.id}" onclick="window.app.viewInvoice('${order.id}')" title="عرض الفاتورة">
                            <i class="fas fa-file-invoice"></i>
                        </button>
                        <button type="button" class="btn-icon btn-status" data-action="status" data-id="${order.id}" onclick="window.app.openStatusModal('${order.id}')" title="تغيير الحالة">
                            <i class="fas fa-exchange-alt"></i>
                        </button>
                        <button type="button" class="btn-icon btn-delete" data-action="delete" data-id="${order.id}" onclick="window.app.openDeleteModal('${order.id}')" title="حذف الطلب">
                            <i class="fas fa-trash-alt"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    // ===== BADGES =====
    getStatusBadge(status) {
        const map = {
            'قيد التحضير': { cls: 'preparing', icon: 'fa-spinner' },
            'جاهز للتوصيل': { cls: 'ready', icon: 'fa-truck' },
            'تم التسليم': { cls: 'delivered', icon: 'fa-check-circle' }
        };
        const s = map[status] || map['قيد التحضير'];
        return `<span class="status-badge ${s.cls}"><i class="fas ${s.icon}"></i> ${status}</span>`;
    }

    getPaymentBadge(paymentStatus) {
        const map = {
            'مدفوع بالكامل': { cls: 'paid', icon: 'fa-check' },
            'عربون': { cls: 'deposit', icon: 'fa-clock' },
            'الدفع عند الاستلام': { cls: 'cod', icon: 'fa-hand-holding-usd' }
        };
        const p = map[paymentStatus] || map['الدفع عند الاستلام'];
        return `<span class="payment-badge ${p.cls}"><i class="fas ${p.icon}"></i> ${paymentStatus}</span>`;
    }

    // ===== ORDER MODAL =====
    openOrderModal() {
        document.getElementById('orderForm').reset();
        document.getElementById('quantity').value = 1;
        document.getElementById('deliveryFee').value = 0;
        this.updateOrderPreview();
        this.openModal('orderModal');
    }

    updateOrderPreview() {
        const qty = parseFloat(document.getElementById('quantity').value) || 0;
        const price = parseFloat(document.getElementById('unitPrice').value) || 0;
        const delivery = parseFloat(document.getElementById('deliveryFee').value) || 0;

        const subtotal = qty * price;
        const total = subtotal + delivery;

        document.getElementById('subtotalPreview').textContent = `${subtotal.toFixed(2)} ر.ق`;
        document.getElementById('deliveryPreview').textContent = `${delivery.toFixed(2)} ر.ق`;
        document.getElementById('grandTotalPreview').textContent = `${total.toFixed(2)} ر.ق`;
    }

    saveNewOrder() {
        const form = document.getElementById('orderForm');
        const customerName = document.getElementById('customerName').value.trim();
        const customerPhone = document.getElementById('customerPhone').value.trim();
        const product = document.getElementById('productName').value.trim();
        const quantity = parseInt(document.getElementById('quantity').value) || 0;
        const unitPrice = parseFloat(document.getElementById('unitPrice').value) || 0;
        const deliveryFee = parseFloat(document.getElementById('deliveryFee').value) || 0;
        const notes = document.getElementById('notes').value.trim();
        const paymentStatus = document.getElementById('paymentStatus').value;

        // Validation
        if (!customerName) {
            this.showToast('يرجى إدخال اسم العميل', 'error');
            document.getElementById('customerName').focus();
            return;
        }
        if (!customerPhone) {
            this.showToast('يرجى إدخال رقم الواتساب', 'error');
            document.getElementById('customerPhone').focus();
            return;
        }
        if (!product) {
            this.showToast('يرجى إدخال نوع المنتج', 'error');
            document.getElementById('productName').focus();
            return;
        }
        if (quantity < 1) {
            this.showToast('الكمية يجب أن تكون 1 على الأقل', 'error');
            return;
        }
        if (unitPrice <= 0) {
            this.showToast('يرجى إدخال سعر صحيح', 'error');
            return;
        }

        const newOrder = {
            id: this.generateOrderId(),
            customerName,
            customerPhone,
            product,
            quantity,
            unitPrice,
            deliveryFee,
            notes,
            paymentStatus,
            status: 'قيد التحضير',
            date: new Date().toISOString().split('T')[0]
        };

        this.orders.push(newOrder);
        this.saveOrders();
        this.renderRecentOrders();
        this.renderAllOrders();
        this.updateStats();
        this.closeModal('orderModal');
        this.showToast(`تم إنشاء الطلب ${newOrder.id} بنجاح`, 'success');
    }

    // ===== STATUS MODAL =====
    openStatusModal(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        this.currentOrderId = orderId;

        document.getElementById('statusOrderInfo').textContent =
            `الطلب ${order.id} - ${order.customerName}`;

        // Highlight current status
        document.querySelectorAll('.status-option').forEach(btn => {
            btn.classList.toggle('active-status', btn.dataset.status === order.status);
            btn.onclick = () => {
                this.changeStatus(orderId, btn.dataset.status);
            };
        });

        this.openModal('statusModal');
    }

    changeStatus(orderId, newStatus) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        order.status = newStatus;
        this.saveOrders();
        this.renderRecentOrders();
        this.renderAllOrders();
        this.updateStats();
        this.closeModal('statusModal');

        const statusLabels = {
            'قيد التحضير': '🔄 قيد التحضير',
            'جاهز للتوصيل': '🚚 جاهز للتوصيل',
            'تم التسليم': '✅ تم التسليم'
        };
        this.showToast(`تم تحديث الطلب ${orderId} إلى ${statusLabels[newStatus]}`, 'success');
    }

    // ===== DELETE =====
    openDeleteModal(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        this.currentOrderId = orderId;
        document.getElementById('deleteMessage').textContent =
            `هل أنت متأكد من حذف الطلب ${order.id} (${order.customerName})؟ لا يمكن التراجع عن هذا الإجراء.`;
        this.openModal('deleteModal');
    }

    confirmDelete() {
        if (!this.currentOrderId) return;

        this.orders = this.orders.filter(o => o.id !== this.currentOrderId);
        this.saveOrders();
        this.renderRecentOrders();
        this.renderAllOrders();
        this.updateStats();
        this.closeModal('deleteModal');
        this.showToast('تم حذف الطلب بنجاح', 'info');
        this.currentOrderId = null;
    }

    // ===== INVOICE =====
    viewInvoice(orderId) {
        const order = this.orders.find(o => o.id === orderId);
        if (!order) return;

        this.currentOrderId = orderId;
        const subtotal = order.quantity * order.unitPrice;
        const total = subtotal + order.deliveryFee;

        const invoiceHTML = `
            <div class="invoice" id="invoicePrint">
                <!-- Header -->
                <div class="invoice-header">
                    <div class="invoice-brand">
                        <div class="invoice-logo">
                            <i class="fas fa-receipt"></i>
                        </div>
                        <div>
                            <h2>فاتورتي</h2>
                            <p>نظام إدارة الطلبات والفواتير</p>
                        </div>
                    </div>
                    <div class="invoice-meta">
                        <p><strong>رقم الفاتورة:</strong> ${order.id}</p>
                        <p><strong>التاريخ:</strong> ${this.formatDate(order.date)}</p>
                        <p><strong>الحالة:</strong> ${order.status}</p>
                    </div>
                </div>

                <!-- Customer Info -->
                <div class="invoice-section">
                    <h4><i class="fas fa-user"></i> بيانات العميل</h4>
                    <div class="invoice-details-grid">
                        <div class="invoice-detail">
                            <span class="detail-label">اسم العميل</span>
                            <span class="detail-value">${order.customerName}</span>
                        </div>
                        <div class="invoice-detail">
                            <span class="detail-label">رقم الواتساب</span>
                            <span class="detail-value" dir="ltr">${order.customerPhone}</span>
                        </div>
                        <div class="invoice-detail">
                            <span class="detail-label">حالة الدفع</span>
                            <span class="detail-value">${order.paymentStatus}</span>
                        </div>
                        <div class="invoice-detail">
                            <span class="detail-label">تاريخ الطلب</span>
                            <span class="detail-value">${this.formatDate(order.date)}</span>
                        </div>
                    </div>
                </div>

                <!-- Order Details -->
                <div class="invoice-section">
                    <h4><i class="fas fa-box"></i> تفاصيل الطلب</h4>
                    <table class="invoice-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>المنتج / الخدمة</th>
                                <th>الكمية</th>
                                <th>سعر الوحدة</th>
                                <th>المجموع</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>1</td>
                                <td>${order.product}</td>
                                <td>${order.quantity}</td>
                                <td>${order.unitPrice.toFixed(2)} ر.ق</td>
                                <td><strong>${subtotal.toFixed(2)} ر.ق</strong></td>
                            </tr>
                        </tbody>
                    </table>

                    <div class="invoice-totals">
                        <div class="invoice-total-row">
                            <span>المبلغ الفرعي:</span>
                            <span>${subtotal.toFixed(2)} ر.ق</span>
                        </div>
                        <div class="invoice-total-row">
                            <span>رسوم التوصيل:</span>
                            <span>${order.deliveryFee.toFixed(2)} ر.ق</span>
                        </div>
                        <div class="invoice-total-row grand">
                            <span>الإجمالي:</span>
                            <span>${total.toFixed(2)} ر.ق</span>
                        </div>
                    </div>
                </div>

                ${order.notes ? `
                <div class="invoice-notes">
                    <p><strong><i class="fas fa-sticky-note"></i> ملاحظات:</strong> ${order.notes}</p>
                </div>
                ` : ''}

                <!-- Action Buttons inside invoice -->
                <div class="invoice-actions no-print">
                    <button class="btn btn-success btn-lg-action" onclick="window.app.sendWhatsApp()">
                        <i class="fab fa-whatsapp"></i> إرسال الفاتورة عبر واتساب
                    </button>
                    <button class="btn btn-primary btn-lg-action" onclick="window.print()">
                        <i class="fas fa-print"></i> طباعة / حفظ كـ PDF
                    </button>
                </div>

                <!-- Footer -->
                <div class="invoice-footer">
                    <p class="thank-you">✨ شكراً لثقتكم بنا ✨</p>
                    <p>فاتورتي - نظام إدارة الطلبات والفواتير للمشاريع المنزلية في قطر</p>
                </div>
            </div>
        `;

        document.getElementById('invoiceContent').innerHTML = invoiceHTML;
        this.openModal('invoiceModal');
    }

    sendWhatsApp() {
        const order = this.orders.find(o => o.id === this.currentOrderId);
        if (!order) return;

        const subtotal = order.quantity * order.unitPrice;
        const total = subtotal + order.deliveryFee;

        // Build a clean formatted message
        const message = `✨ *فاتورة من فاتورتي* ✨
━━━━━━━━━━━━━━━━━━
📋 *رقم الطلب:* ${order.id}
📅 *التاريخ:* ${this.formatDate(order.date)}
━━━━━━━━━━━━━━━━━━

👤 *العميل:* ${order.customerName}

📦 *تفاصيل الطلب:*
• المنتج: ${order.product}
• الكمية: ${order.quantity}
• سعر الوحدة: ${order.unitPrice.toFixed(2)} ر.ق

━━━━━━━━━━━━━━━━━━
💰 المبلغ الفرعي: ${subtotal.toFixed(2)} ر.ق
🚚 رسوم التوصيل: ${order.deliveryFee.toFixed(2)} ر.ق
✅ *الإجمالي: ${total.toFixed(2)} ر.ق*
━━━━━━━━━━━━━━━━━━
💳 حالة الدفع: ${order.paymentStatus}
${order.notes ? `\n📝 ملاحظات: ${order.notes}` : ''}

شكراً لثقتكم بنا! 🌟`;

        // Clean phone number
        let phone = order.customerPhone.replace(/\s+/g, '').replace('+', '');

        const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
        window.open(url, '_blank');
    }

    // ===== MODAL HELPERS =====
    openModal(modalId) {
        document.getElementById(modalId).classList.add('active');
    }

    closeModal(modalId) {
        document.getElementById(modalId).classList.remove('active');
    }

    // ===== TOAST NOTIFICATIONS =====
    showToast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            info: 'fa-info-circle'
        };

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <i class="fas ${icons[type]}"></i>
            <span>${message}</span>
        `;

        container.appendChild(toast);

        // Auto remove
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 3000);
    }

    // ===== UTILITY =====
    formatDate(dateStr) {
        const months = [
            'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
            'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
        ];
        const d = new Date(dateStr);
        return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    }
}

// ===== LAUNCH APP =====
let app;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        app = new App();
        window.app = app;
    });
} else {
    app = new App();
    window.app = app;
}
