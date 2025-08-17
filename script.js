document.addEventListener('DOMContentLoaded', () => {
    // Referensi ke elemen DOM
    const memberContainer = document.getElementById('member-container');
    const scheduleContainer = document.getElementById('schedule-container');
    const lineupContainer = document.getElementById('lineup-container');
    const faqContainer = document.getElementById('faq-container');
    const paymentNotesContainer = document.getElementById('payment-notes-container');
    const checkoutForm = document.getElementById('checkout-form');

    // State Aplikasi
    let cart = [];
    let allData = {};

    // Fungsi untuk mengambil data dari JSON
    async function fetchData() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            allData = await response.json();
            initializeApp();
        } catch (error) {
            console.error("Tidak dapat memuat data.json:", error);
        }
    }

    // Fungsi untuk menginisialisasi semua komponen setelah data dimuat
    function initializeApp() {
        renderConfig();
        renderMembers();
        renderSchedule();
        renderLineup();
        renderFaqs();
        updateCart();
        initializeStaticEventListeners();
    }

    // --- FUNGSI RENDER ---

    function renderConfig() {
        const { config } = allData;
        const priceMember = config.hargaChekiPerMember;
        const priceGroup = config.hargaChekiGrup;
        const payment = config.paymentInfo;
        
        paymentNotesContainer.innerHTML = `
            <p>Harga 1x Cheki per member: <strong id="display-price-member">Rp. ${priceMember.toLocaleString('id-ID')}</strong></p>
            <p>Harga 1x Cheki All Member: <strong id="display-price-group">Rp. ${priceGroup.toLocaleString('id-ID')}</strong></p>
            <p class="font-semibold pt-2">Pembayaran via transfer ke:</p>
            <p><strong>${payment.bank}: ${payment.rekening} (A.N. ${payment.atasNama})</strong></p>
            <p class="font-semibold pt-2">NB:</p>
            <ul class="list-disc list-inside">
                <li>Jika sudah PO tetapi tidak bisa datang, silahkan konfirmasi ulang via DM Instagram Refresh Breeze.</li>
                <li>Bukti pembayaran wajib menampakan jam dan tanggal transfer.</li>
            </ul>
        `;
    }

    function renderMembers() {
        memberContainer.innerHTML = '';
        allData.members.forEach(member => {
            const isGroup = member.id === 'group';
            const price = isGroup ? allData.config.hargaChekiGrup : allData.config.hargaChekiPerMember;
            
            // ==========================================================
            // || PERBAIKAN 1: Mengambil dua kata pertama dari nama      ||
            // ==========================================================
            const chekiName = isGroup 
                ? `Cheki All Member` 
                : `Cheki ${member.namaPanggung.split(' ').slice(0, 2).join(' ')}`;

            const memberCard = `
                <div class="bg-gray-50 rounded-lg shadow-md overflow-hidden transition-transform transform hover:-translate-y-2 border border-gray-200">
                    <img src="${member.image}" alt="${member.namaPanggung}" class="aspect-square w-full object-cover">
                    <div class="p-3">
                        <h3 class="text-base font-semibold mb-1">${member.namaPanggung}</h3>
                        <p class="text-xs text-gray-600 mb-3">${member.tagline}</p>
                        <div class="flex gap-2">
                            <button class="btn-profile w-full text-xs bg-transparent border border-custom-green text-custom-green py-2 rounded-md font-medium hover:bg-custom-green hover:text-white transition-colors" data-id="${member.id}">Profile</button>
                            <button class="btn-cart w-full text-xs bg-custom-green text-white py-2 rounded-md font-medium hover:bg-green-700 transition-colors" data-id="${member.id}" data-name="${chekiName}" data-price="${price}">Add</button>
                        </div>
                    </div>
                </div>`;
            memberContainer.innerHTML += memberCard;
        });
        initializeDynamicEventListeners();
    }

    function renderSchedule() {
        scheduleContainer.innerHTML = '';
        allData.events.forEach(event => {
            const eventHTML = `
                <div class="flex flex-col sm:flex-row items-center border-b pb-4 last:border-b-0">
                    <div class="text-center sm:text-left sm:w-1/4 mb-4 sm:mb-0">
                        <p class="text-xl sm:text-2xl font-bold text-custom-green">${event.tanggal} ${event.bulan}</p>
                        <p class="text-gray-600">${event.tahun}</p>
                    </div>
                    <div class="sm:w-3/4 text-center sm:text-left">
                        <h3 class="text-lg sm:text-xl font-semibold">${event.nama}</h3>
                        <p class="text-gray-500 text-sm sm:text-base"><i class="fas fa-map-marker-alt mr-2"></i>${event.lokasi}</p>
                    </div>
                </div>`;
            scheduleContainer.innerHTML += eventHTML;
        });
    }

    function renderLineup() {
        if (!lineupContainer) return;
        lineupContainer.innerHTML = '';
        allData.members.forEach(member => {
            if (member.id === 'group') return;
            const isHadir = member.hadir;
            const statusClass = isHadir ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
            const iconClass = isHadir ? 'fas fa-check-circle' : 'fas fa-times-circle';
            const lineupHTML = `<div class="p-3 rounded-lg ${statusClass} flex items-center justify-center gap-2"><i class="${iconClass}"></i><span class="font-semibold">${member.namaPanggung}</span></div>`;
            lineupContainer.innerHTML += lineupHTML;
        });
    }
    
    function renderFaqs() {
        faqContainer.innerHTML = '';
        allData.faqs.forEach(faq => {
            const faqHTML = `
                <div>
                    <h3 class="font-bold text-lg text-custom-green">${faq.tanya}</h3>
                    <p class="text-gray-700 mt-1">${faq.jawab}</p>
                </div>`;
            faqContainer.innerHTML += faqHTML;
        });
    }

    // --- FUNGSI KERANJANG (CART) ---

    function updateCart() {
        const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
        document.getElementById('cart-count').textContent = totalItems;
        const totalPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const formattedTotal = `Rp. ${totalPrice.toLocaleString('id-ID')}`;

        document.getElementById('modal-cart-total-price').textContent = formattedTotal;
        document.getElementById('static-cart-total-price').textContent = formattedTotal;
        
        renderCartItems();
    }

    function renderCartItems() {
        const modalCartContainer = document.getElementById('modal-cart-container');
        const staticCartContainer = document.getElementById('static-cart-container');
        let generatedHTML = '';

        if (cart.length === 0) {
            generatedHTML = `<div class="text-center py-8 text-gray-400"><i class="fas fa-shopping-cart fa-3x mb-4"></i><p class="font-medium">Keranjang Anda kosong</p></div>`;
        } else {
            cart.forEach((item, index) => {
                generatedHTML += `
                    <div class="flex justify-between items-center border-b pb-2">
                        <div>
                            <p class="font-semibold">${item.name}</p>
                            <p class="text-sm text-gray-600">Rp. ${item.price.toLocaleString('id-ID')}</p>
                        </div>
                        <div class="flex items-center gap-2">
                           <button class="cart-quantity-btn w-6 h-6 bg-gray-200 rounded-full font-bold hover:bg-gray-300 transition-colors" data-index="${index}" data-action="decrease">-</button>
                           <span class="font-medium w-4 text-center">${item.quantity}</span>
                           <button class="cart-quantity-btn w-6 h-6 bg-gray-200 rounded-full font-bold hover:bg-gray-300 transition-colors" data-index="${index}" data-action="increase">+</button>
                           <button class="remove-from-cart text-red-500 hover:text-red-700 ml-2 font-bold text-xl transition-colors" data-index="${index}">×</button>
                        </div>
                    </div>
                `;
            });
        }
        modalCartContainer.innerHTML = generatedHTML;
        staticCartContainer.innerHTML = generatedHTML;
        initializeCartActionListeners();
    }
    
    function addToCart(id, name, price) {
        const existingItem = cart.find(item => item.id === id);
        if (existingItem) {
            existingItem.quantity++;
        } else {
            cart.push({ id, name, price, quantity: 1 });
        }
        Swal.fire({
            toast: true, position: 'top-end', icon: 'success', title: `${name} ditambahkan!`,
            showConfirmButton: false, timer: 2000, timerProgressBar: true,
        });
        updateCart();
    }

    function adjustCartQuantity(index, action) {
        if (action === 'increase') {
            cart[index].quantity++;
        } else if (action === 'decrease') {
            if (cart[index].quantity > 1) {
                cart[index].quantity--;
            } else {
                cart.splice(index, 1);
            }
        }
        updateCart();
    }

    // --- FUNGSI MODAL ---
    function openProfileModal(memberId) {
        const profile = allData.members.find(m => m.id === memberId);
        if (!profile) return;

        const profileModal = document.getElementById('profileModal');
        document.getElementById('modal-img').src = profile.image;
        document.getElementById('modal-name').textContent = profile.namaPanggung;
        document.getElementById('modal-description').textContent = profile.jiko;
        
        const modalDetails = document.getElementById('modal-details');
        modalDetails.innerHTML = '';
        for (const [key, value] of Object.entries(profile.details)) {
          modalDetails.innerHTML += `<p><strong class="text-custom-green">${key}:</strong> ${value}</p>`;
        }

        const modalGallery = document.getElementById('modal-gallery');
        modalGallery.innerHTML = '';
        if (profile.gallery && profile.gallery.length > 0) { 
            profile.gallery.forEach(imgSrc => {
                const thumb = document.createElement('img');
                thumb.src = imgSrc;
                thumb.className = 'w-16 h-16 rounded-md object-cover cursor-pointer border-2 border-transparent hover:border-custom-green';
                thumb.onclick = () => { document.getElementById('modal-img').src = imgSrc; };
                modalGallery.appendChild(thumb);
            });
        }
        profileModal.classList.remove('hidden');
    }

    // --- EVENT LISTENERS ---
    
    function initializeStaticEventListeners() {
        document.getElementById('mobile-menu-button').addEventListener('click', () => {
            document.getElementById('mobile-menu').classList.toggle('hidden');
        });

        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                const targetId = e.currentTarget.getAttribute('href');
                if (targetId.startsWith('#')) {
                    e.preventDefault();
                    document.querySelector(targetId).scrollIntoView({ behavior: 'smooth' });
                    document.getElementById('mobile-menu').classList.add('hidden');
                }
            });
        });

        document.getElementById('cart-icon-container').addEventListener('click', () => document.getElementById('cartModal').classList.remove('hidden'));
        document.getElementById('closeCartModal').addEventListener('click', () => document.getElementById('cartModal').classList.add('hidden'));
        document.getElementById('closeProfileModal').addEventListener('click', () => document.getElementById('profileModal').classList.add('hidden'));
        document.getElementById('checkout-button').addEventListener('click', () => {
            document.getElementById('cartModal').classList.add('hidden');
            document.getElementById('checkout-section').scrollIntoView({ behavior: 'smooth' });
        });
        
        checkoutForm.addEventListener('submit', handleFormSubmit);
    }
    
    function initializeDynamicEventListeners() {
        document.querySelectorAll('.btn-cart').forEach(button => {
            button.addEventListener('click', (e) => {
                const { id, name, price } = e.currentTarget.dataset;
                addToCart(id, name, parseInt(price));
            });
        });

        document.querySelectorAll('.btn-profile').forEach(button => {
            button.addEventListener('click', (e) => {
                openProfileModal(e.currentTarget.dataset.id);
            });
        });
    }
    
    function initializeCartActionListeners() {
        document.querySelectorAll('.remove-from-cart').forEach(button => {
            button.addEventListener('click', e => {
                cart.splice(parseInt(e.currentTarget.dataset.index), 1);
                updateCart();
            });
        });

        document.querySelectorAll('.cart-quantity-btn').forEach(button => {
            button.addEventListener('click', e => {
                const { index, action } = e.currentTarget.dataset;
                adjustCartQuantity(parseInt(index), action);
            });
        });
    }

    // --- LOGIKA FORM ---
    function handleFormSubmit(e) {
        e.preventDefault();
        
        // =======================================================================
        // || PERBAIKAN 2: URL Google Script dihapus dari sini demi keamanan    ||
        // =======================================================================
        // const scriptURL = allData.config.googleScriptURL; // Baris ini tidak lagi diperlukan

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const paymentProofFile = document.getElementById('payment-proof').files[0];

        if (cart.length === 0) {
            return Swal.fire({ icon: 'error', title: 'Oops...', text: 'Keranjang Anda kosong!', confirmButtonColor: '#079108' });
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return Swal.fire({ icon: 'error', title: 'Format Email Salah', text: 'Mohon masukkan alamat email yang valid.', confirmButtonColor: '#079108' });
        }
        if (!paymentProofFile) {
            return Swal.fire({ icon: 'warning', title: 'Data Belum Lengkap', text: 'Harap upload bukti pembayaran Anda.', confirmButtonColor: '#079108' });
        }

        const submitBtn = document.getElementById('submit-button');
        const btnText = document.getElementById('submit-button-text');
        const spinner = document.getElementById('submit-spinner');
        submitBtn.disabled = true;
        btnText.classList.add('hidden');
        spinner.classList.remove('hidden');

        const reader = new FileReader();
        reader.readAsDataURL(paymentProofFile);
        reader.onloadend = () => {
            const fileBase64 = reader.result.split(',')[1];
            const itemsSummary = cart.map(item => `${item.name} (x${item.quantity})`).join('\n');
            const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
            
            const payload = {
                nama: name, 
                whatsapp: document.getElementById('whatsapp').value,
                email: email,
                instagram: document.getElementById('instagram').value,
                items: itemsSummary,
                total: total,
                fileBase64: fileBase64,
                fileType: paymentProofFile.type,
            };

            // =======================================================================
            // || PERBAIKAN 2: Mengirim data ke Serverless Function di Vercel       ||
            // =======================================================================
            fetch('/api/submit-form', { 
                method: 'POST', 
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload) 
            })
            .then(res => res.json())
            .then(data => {
                submitBtn.disabled = false;
                btnText.classList.remove('hidden');
                spinner.classList.add('hidden');
                 
                if (data.result === 'success') {
                    Swal.fire({
                        icon: 'success', title: 'Pesanan Terkirim!',
                        text: `Terima kasih, ${name}! Konfirmasi pesanan telah dikirim ke email Anda.`,
                        confirmButtonText: 'Selesai', confirmButtonColor: '#079108'
                    }).then(() => {
                        checkoutForm.reset();
                        cart = [];
                        updateCart();
                    });
                } else {
                    throw new Error(data.message || 'Terjadi kesalahan yang tidak diketahui.');
                }
            })
            .catch(error => {
                submitBtn.disabled = false;
                btnText.classList.remove('hidden');
                spinner.classList.add('hidden');
                Swal.fire({
                    icon: 'error', title: 'Gagal Mengirim',
                    text: 'Terjadi masalah saat mengirim pesanan Anda. Error: ' + error.message,
                    confirmButtonColor: '#079108'
                });
            });
        };
    }

    // Mulai aplikasi
    fetchData();

    // =================================================================
    // || FITUR TOMBOL RAHASIA UNTUK ADMIN                            ||
    // =================================================================
    const adminTrigger = document.getElementById('admin-trigger');
    let clickCount = 0;
    let resetTimer;

    if (adminTrigger) {
        adminTrigger.addEventListener('click', () => {
            clearTimeout(resetTimer);
            clickCount++;
            if (clickCount === 5) {
                window.location.href = 'admin.html'; 
            }
            resetTimer = setTimeout(() => {
                clickCount = 0;
            }, 2000);
        });
    }
});
