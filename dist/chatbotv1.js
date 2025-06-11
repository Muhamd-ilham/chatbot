// --- KODE INTI BLOGGER GEMINI (SUDAH DIMODIFIKASI) ---
const bloggerGemini = (options) => {
    const {
        elementContainer,
        config
    } = options;

    if (!config.apiKey) {
        console.error('API key is missing.');
        return;
    }

    const container = document.querySelector(elementContainer);
    if (!container) {
        console.error('Container element not found.');
        return;
    }
    
    // MODIFIKASI: Menambahkan CSS secara dinamis dari JavaScript
    const style = document.createElement('style');
    style.textContent = `
        .gemini-chat-container{font-family:Arial,sans-serif;max-width:600px;margin:20px auto;border:1px solid #ccc;border-radius:8px;display:flex;flex-direction:column;height:70vh;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,0.1)}.gemini-chat-box{flex-grow:1;padding:20px;overflow-y:auto;background-color:#f9f9f9;display:flex;flex-direction:column;gap:15px}.gemini-chat-message{padding:10px 15px;border-radius:18px;max-width:80%;line-height:1.5}.user-message{background-color:#007bff;color:white;border-bottom-right-radius:4px}.bot-message,.bot-typing-message{background-color:#e9e9eb;color:#333;align-self:flex-start;border-bottom-left-radius:4px}.bot-typing-message{color:#888}.gemini-input-area{display:flex;padding:10px;border-top:1px solid #ccc;background-color:#fff}#gemini-user-input{flex-grow:1;padding:10px;border:1px solid #ddd;border-radius:20px;margin-right:10px;font-size:16px;outline:none}#gemini-user-input:focus{border-color:#007bff}#gemini-send-btn{background-color:#007bff;color:white;border:none;border-radius:50%;width:44px;height:44px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background-color .3s}#gemini-send-btn:hover{background-color:#0056b3}#gemini-send-btn:disabled{background-color:#a0a0a0;cursor:not-allowed}#gemini-send-btn svg{margin-left:2px}
        /* CSS BARU UNTUK FOTO PENGGUNA */
        .user-message-wrapper { display: flex; flex-direction: row-reverse; align-items: flex-start; gap: 10px; align-self: flex-end; width:100%; justify-content: flex-start; }
        .user-avatar { width: 40px; height: 40px; border-radius: 50%; object-fit: cover; }
        .user-message-wrapper .gemini-chat-message { align-self: flex-end; }
    `;
    document.head.appendChild(style);

    container.innerHTML = `<div class="gemini-chat-container"><div class="gemini-chat-box" id="gemini-chat-box"></div><div class="gemini-input-area"><input type="text" id="gemini-user-input" placeholder="Ketik pesan Anda..."><button id="gemini-send-btn"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg></button></div></div>`;

    const chatBox = document.getElementById('gemini-chat-box');
    const userInput = document.getElementById('gemini-user-input');
    const sendBtn = document.getElementById('gemini-send-btn');

    const addMessage = (message, sender) => {
        const formattedMessage = message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/\n/g, '<br>');

        // MODIFIKASI: Logika untuk menambahkan foto jika ada
        if (sender === 'user' && config.userPhotoUrl) {
            const wrapper = document.createElement('div');
            wrapper.classList.add('user-message-wrapper');

            const messageElement = document.createElement('div');
            messageElement.classList.add('gemini-chat-message', 'user-message');
            messageElement.innerHTML = formattedMessage;

            const avatarElement = document.createElement('img');
            avatarElement.src = config.userPhotoUrl;
            avatarElement.classList.add('user-avatar');

            wrapper.appendChild(messageElement);
            wrapper.appendChild(avatarElement);
            chatBox.appendChild(wrapper);
        } else {
            // Logika asli jika bukan user atau tidak ada foto
            const messageElement = document.createElement('div');
            messageElement.classList.add('gemini-chat-message', `${sender}-message`);
            messageElement.innerHTML = formattedMessage;
            chatBox.appendChild(messageElement);
        }
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    addMessage("Halo! Ada yang bisa saya bantu?", 'bot');

    const handleUserInput = async () => {
        const userMessage = userInput.value.trim();
        if (userMessage === '') return;
        addMessage(userMessage, 'user');
        userInput.value = '';
        sendBtn.disabled = true;
        
        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('gemini-chat-message', 'bot-typing-message');
        typingIndicator.innerHTML = '<em>Sedang mengetik...</em>';
        chatBox.appendChild(typingIndicator);
        chatBox.scrollTop = chatBox.scrollHeight;

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-pro:generateContent?key=${config.apiKey}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{parts:[{text:userMessage}]}]})});
            if (!response.ok) throw new Error('Gagal mendapatkan respons dari API.');
            const data = await response.json();
            const botMessage = data.candidates[0].content.parts[0].text;
            chatBox.removeChild(typingIndicator);
            addMessage(botMessage, 'bot');
        } catch (error) {
            chatBox.removeChild(typingIndicator);
            addMessage('Maaf, terjadi kesalahan. Silakan coba lagi.', 'bot');
            console.error('Error:', error);
        } finally {
            sendBtn.disabled = false;
        }
    };
    sendBtn.addEventListener('click', handleUserInput);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleUserInput();
    });
};
