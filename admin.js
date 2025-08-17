document.addEventListener('DOMContentLoaded', function () {
    // =================================================================
    // || KONFIGURASI ADMIN (SESUAIKAN DENGAN MILIK ANDA)             ||
    // =================================================================
    const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxy8zZxX4s7AlvQ9NfBv4D_imH-z4BtIRUhYUbTLioJZMqjKPeSwpHkxRwVJQaPHaAF/exec";
    const ADMIN_USER = "adminbreeze";
    const ADMIN_PASS = "segarsejuk";
    const API_KEY = "RefreshBreezeSecretKey";

    // =================================================================
    // || Elemen DOM                                                  ||
    // =================================================================
    const loginSection = document.getElementById('login-section');
    const adminDashboard = document.getElementById('admin-dashboard');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const logoutButton = document.getElementById('logout-button');
    const refreshButton = document.getElementById('refresh-button');
    const loader = document.getElementById('loader');
    const ordersTable = document.getElementById('orders-table');
    const ordersTbody = document.getElementById('orders-tbody');
    const totalRevenueEl = document.getElementById('total-revenue');
    const memberSummaryEl = document.getElementById('member-summary');
    const togglePasswordButton = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password');
    const toggleIcon = document.getElementById('toggle-icon');
    document.getElementById('google-sheet-link').href = "https://docs.google.com/spreadsheets/d/1g_gE-8j2p5x3hI_G5qk4HAbzaOFdO4s8c-1K8gQ2-v0/edit#gid=0";

    // =================================================================
    // || FUNGSI UTAMA (LOGIN, FETCH, DLL)                            ||
    // =================================================================

    if (togglePasswordButton) {
        togglePasswordButton.addEventListener('click', function () {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            toggleIcon.classList.toggle('fa-eye');
            toggleIcon.classList.toggle('fa-eye-slash');
        });
    }

    if (sessionStorage.getItem('isRbAdminAuthenticated') === 'true') {
        showDashboard();
    }

    loginForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        if (username === ADMIN_USER && password === ADMIN_PASS) {
            sessionStorage.setItem('isRbAdminAuthenticated', 'true');
            showDashboard();
        } else {
            loginError.textContent = 'Username atau password salah.';
            setTimeout(() => { loginError.textContent = ''; }, 3000);
        }
    });

    logoutButton.addEventListener('click', () => {
        sessionStorage.removeItem('isRbAdminAuthenticated');
        showLogin();
    });

    refreshButton.addEventListener('click', fetchData);

    function showDashboard() {
        loginSection.classList.add('hidden');
        adminDashboard.classList.remove('hidden');
        fetchData();
    }

    function showLogin() {
        loginSection.classList.remove('hidden');
        adminDashboard.classList.add('hidden');
    }

    function fetchData() {
        loader.style.display = 'block';
        ordersTable.classList.add('hidden');
        loader.innerHTML = '<p class="text-lg">Memuat data, mohon tunggu...</p>';

        const callbackName = 'jsonp_callback_rb_' + Math.round(100000 * Math.random());
        window[callbackName] = function (data) {
            handleDataResponse(data);
            delete window[callbackName];
            const scriptElement = document.getElementById(callbackName);
            if (scriptElement) {
                document.body.removeChild(scriptElement);
            }
        };

        const script = document.createElement('script');
        script.id = callbackName;
        script.src = `${SCRIPT_URL}?action=getOrders&apiKey=${API_KEY}&callback=${callbackName}`;

        script.onerror = function () {
            loader.innerHTML = `<p class="text-red-500">Gagal memuat data. Periksa URL script dan koneksi Anda.</p>`;
            ordersTable.classList.add('hidden');
            delete window[callbackName];
            const scriptElement = document.getElementById(callbackName);
            if (scriptElement) {
                document.body.removeChild(scriptElement);
            }
        };
        document.body.appendChild(script);
    }

    function handleDataResponse(data) {
        loader.style.display = 'none';

        if (data.error) {
            loader.style.display = 'block';
            loader.innerHTML = `<p class="text-red-500">Error dari server: ${data.error}</p>`;
            return;
        }

        ordersTable.classList.remove('hidden');
        renderTable(data);
        calculateSummary(data);
    }

    // =================================================================
    // || FUNGSI RENDER TABEL & RINGKASAN                             ||
    // =================================================================

    function renderTable(data) {
        ordersTbody.innerHTML = '';
        if (!data || data.length === 0) {
            ordersTbody.innerHTML = '<tr><td colspan="7" class="text-center py-8 text-gray-500">Belum ada pesanan.</td></tr>';
            return;
        }

        const parseDate = (dateString) => {
            if (!dateString) return null;
            const parts = dateString.match(/(\d{1,2})\/(\d{1,2})\/(\d{4}) (\d{1,2}):(\d{1,2}):(\d{1,2})/);
            if (parts) {
                return new Date(parts[3], parts[2] - 1, parts[1], parts[4], parts[5], parts[6]);
            }
            const date = new Date(dateString);
            return !isNaN(date) ? date : null;
        };

        const sortedData = data.sort((a, b) => {
            const dateA = parseDate(a.Timestamp);
            const dateB = parseDate(b.Timestamp);
            if (dateA && dateB) {
                return dateB - dateA;
            }
            return 0;
        });

        sortedData.forEach((row) => {
            const tr = document.createElement('tr');
            const displayDate = parseDate(row.Timestamp);

            tr.innerHTML = `
                <td class="px-4 py-2 text-sm">${displayDate ? displayDate.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : 'Tanggal tidak valid'}</td>
                <td class="px-4 py-2 text-sm">${row.Nama || ''}</td>
                <td class="px-4 py-2 text-sm">${row.Email || ''}</td>
                <td class="px-4 py-2 text-sm">${row.Whatsapp || ''}</td>
                <td class="px-4 py-2 text-sm whitespace-pre-wrap">${row.Items || ''}</td>
                <td class="px-4 py-2 text-sm">${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(row.Total || 0)}</td>
                <td class="px-4 py-2 text-sm"><a href="${row.Buktibayar || '#'}" target="_blank" class="text-blue-600 hover:underline">Lihat Bukti</a></td>
            `;
            ordersTbody.appendChild(tr);
        });
    }

    function calculateSummary(data) {
        const totalRevenue = data.reduce((sum, row) => sum + parseFloat(row.Total || 0), 0);
        totalRevenueEl.textContent = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(totalRevenue);

        const memberCounts = {
            'Yan Yee': 0, 'Sinta': 0, 'Cissi': 0, 'Channie': 0, 'Acaa': 0, 'Ayaya': 0, 'All Member': 0
        };
        const memberNames = Object.keys(memberCounts);

        // =============================================================
        // || PERBAIKAN FINAL DI SINI                                 ||
        // || Mengganti ' ' (spasi biasa) dengan '\\s*' (semua jenis spasi) ||
        // =============================================================
        const chekiRegex = new RegExp(`Cheki (${memberNames.join('|')})\\s*\\(x(\\d+)\\)`, 'g');

        data.forEach(row => {
            const pesanan = row.Items || '';
            const matches = pesanan.matchAll(chekiRegex);
            for (const match of matches) {
                const memberName = match[1];
                const quantity = parseInt(match[2], 10);
                if (memberCounts.hasOwnProperty(memberName)) {
                    memberCounts[memberName] += quantity;
                }
            }
        });

        memberSummaryEl.innerHTML = '';
        for (const member in memberCounts) {
            memberSummaryEl.innerHTML += `
                <div class="text-center p-2 bg-white rounded-lg border">
                    <p class="font-semibold text-gray-700">${member}</p>
                    <p class="text-xl font-bold text-green-700">${memberCounts[member]}</p>
                </div>
            `;
        }
    }
});