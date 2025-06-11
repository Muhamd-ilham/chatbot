// --- KODE INTI BLOGGER GEMINI (SUDAH DIPERBAIKI DAN DISEMPURNAKAN) ---
const bloggerGemini = (options) => {
    // --- DESTRUKTURISASI KONFIGURASI ---
    const {
        elementContainer,
        config
    } = options;

    // --- VALIDASI AWAL ---
    if (!config || !config.apiKey) {
        console.error('Konfigurasi atau API key tidak ditemukan.');
        return;
    }

    const container = document.querySelector(elementContainer);
    if (!container) {
        console.error(`Elemen kontainer '${elementContainer}' tidak ditemukan.`);
        return;
    }

    // --- PENGATURAN DEFAULT ---
    const defaultConfig = {
        model: 'gemini-1.5-flash-latest', // Model yang lebih baru dan efisien
        userPhotoUrl: null,
        botPhotoUrl: null, // Opsi untuk foto bot
        initialBotMessage: "Halo! Ada yang bisa saya bantu hari ini?"
    };
    // Gabungkan config pengguna dengan default
    const finalConfig = { ...defaultConfig, ...config };

    // --- INJEKSI CSS SECARA DINAMIS ---
    const style = document.createElement('style');
    style.textContent = `
        .gemini-chat-container { font-family: Arial, sans-serif; max-width: 600px; margin: 20px auto; border: 1px solid #ccc; border-radius: 8px; display: flex; flex-direction: column; height: 70vh; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .gemini-chat-box { flex-grow: 1; padding: 20px; overflow-y: auto; background-color: #f9f9f9; display: flex; flex-direction: column; gap: 15px; }
        
        /* Wrapper untuk semua jenis pesan */
        .message-wrapper { display: flex; align-items: flex-start; gap: 10px; max-width: 90%; }
        .gemini-chat-message { padding: 10px 15px; border-radius: 18px; line-height: 1.5; word-wrap: break-word; }
        .message-avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }

        /* Pesan Pengguna (User) */
        .user-message-wrapper { align-self: flex-end; flex-direction: row-reverse; }
        .user-message .gemini-chat-message { background-color: #007bff; color: white; border-bottom-right-radius: 4px; }

        /* Pesan Bot */
        .bot-message-wrapper { align-self: flex-start; }
        .bot-message .gemini-chat-message, .bot-typing-message { background-color: #e9e9eb; color: #333; border-bottom-left-radius: 4px; }
        .bot-typing-message { color: #888; }
        .error-message .gemini-chat-message { background-color: #ffebee; color: #c62828; }

        /* Area Input */
        .gemini-input-area { display: flex; padding: 10px; border-top: 1px solid #ccc; background-color: #fff; }
        #gemini-user-input { flex-grow: 1; padding: 10px; border: 1px solid #ddd; border-radius: 20px; margin-right: 10px; font-size: 16px; outline: none; resize: none; }
        #gemini-user-input:focus { border-color: #007bff; }
        #gemini-send-btn { background-color: #007bff; color: white; border: none; border-radius: 50%; width: 44px; height: 44px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background-color .3s; flex-shrink: 0; }
        #gemini-send-btn:hover { background-color: #0056b3; }
        #gemini-send-btn:disabled { background-color: #a0a0a0; cursor: not-allowed; }
        #gemini-send-btn svg { margin-left: 2px; }
    `;
    document.head.appendChild(style);

    // --- PEMBUATAN STRUKTUR HTML ---
    container.innerHTML = `
        <div class="gemini-chat-container">
            <div class="gemini-chat-box" id="gemini-chat-box"></div>
            <div class="gemini-input-area">
                <input type="text" id="gemini-user-input" placeholder="Ketik pesan Anda...">
                <button id="gemini-send-btn" title="Kirim Pesan">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                        <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                    </svg>
                </button>
            </div>
        </div>
    `;

    // --- REFERENSI ELEMEN DOM ---
    const chatBox = document.getElementById('gemini-chat-box');
    const userInput = document.getElementById('gemini-user-input');
    const sendBtn = document.getElementById('gemini-send-btn');

    // --- FUNGSI UTAMA ---
    const addMessage = (message, sender, type = 'normal') => {
        // Format pesan: bold, italic, dan ganti baris baru
        const formattedMessage = message
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');

        const wrapper = document.createElement('div');
        wrapper.classList.add('message-wrapper', `${sender}-message-wrapper`);

        const messageContainer = document.createElement('div');
        messageContainer.classList.add(`${sender}-message`);
        if (type === 'error') {
            messageContainer.classList.add('error-message');
        }

        const messageElement = document.createElement('div');
        messageElement.classList.add('gemini-chat-message');
        messageElement.innerHTML = formattedMessage;
        
        messageContainer.appendChild(messageElement);
        wrapper.appendChild(messageContainer);

        const photoUrl = sender === 'user' ? finalConfig.userPhotoUrl : finalConfig.botPhotoUrl;
        if (photoUrl) {
            const avatarElement = document.createElement('img');
            avatarElement.src = photoUrl;
            avatarElement.alt = `${sender} avatar`;
            avatarElement.classList.add('message-avatar');
            wrapper.appendChild(avatarElement);
        }
        
        chatBox.appendChild(wrapper);
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    const handleUserInput = async () => {
        const userMessage = userInput.value.trim();
        if (userMessage === '') return;

        addMessage(userMessage, 'user');
        userInput.value = '';
        userInput.focus();
        sendBtn.disabled = true;

        // Tampilkan indikator mengetik
        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('gemini-chat-message', 'bot-typing-message');
        typingIndicator.innerHTML = '<em>Sedang mengetik...</em>';
        chatBox.appendChild(typingIndicator);
        chatBox.scrollTop = chatBox.scrollHeight;

        try {
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${finalConfig.model}:generateContent?key=${finalConfig.apiKey}`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: userMessage }] }] })
            });

            const data = await response.json();
            chatBox.removeChild(typingIndicator); // Hapus indikator setelah respons diterima

            if (!response.ok) {
                 // Coba dapatkan pesan error dari API, jika tidak ada, tampilkan pesan default
                const errorText = data?.error?.message || `Gagal mendapatkan respons dari API. Status: ${response.status}`;
                throw new Error(errorText);
            }
            
            // Validasi respons dari Gemini
            if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
                const botMessage = data.candidates[0].content.parts[0].text;
                addMessage(botMessage, 'bot');
            } else {
                 // Menangani kasus ketika 'finishReason' adalah 'SAFETY' atau lainnya
                const finishReason = data.candidates?.[0]?.finishReason || 'UNKNOWN';
                addMessage(`Maaf, saya tidak dapat memberikan respons saat ini karena alasan: ${finishReason}. Silakan coba pertanyaan lain.`, 'bot', 'error');
            }

        } catch (error) {
            if (chatBox.contains(typingIndicator)) {
                chatBox.removeChild(typingIndicator);
            }
            addMessage(`Maaf, terjadi kesalahan: ${error.message}`, 'bot', 'error');
            console.error('Error:', error);
        } finally {
            sendBtn.disabled = false;
        }
    };

    // --- EVENT LISTENERS ---
    sendBtn.addEventListener('click', handleUserInput);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { // Kirim dengan Enter, baris baru dengan Shift+Enter
            e.preventDefault();
            handleUserInput();
        }
    });

    // --- INISIALISASI CHAT ---
    if (finalConfig.initialBotMessage) {
        addMessage(finalConfig.initialBotMessage, 'bot');
    }
};
