
const bloggerGemini = (options) => {
    const { elementContainer, config } = options;

    if (!config || !config.apiKey) {
        console.error('Konfigurasi atau API key tidak ditemukan.');
        return;
    }

    const container = document.querySelector(elementContainer);
    if (!container) {
        console.error(`Elemen kontainer '${elementContainer}' tidak ditemukan.`);
        return;
    }


    const defaultConfig = {
        model: 'gemini-1.5-flash-latest',
        userPhotoUrl: null,
        botPhotoUrl: null,
        initialBotMessage: "Halo! Ada yang bisa saya bantu hari ini?",
        enableHistory: true,
        historyKey: `geminiChatHistory_${elementContainer}`,
        syntaxHighlighting: {
            enable: true,
            theme: 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/atom-one-dark.min.css' // Tema bisa diganti
        }
    };
    const finalConfig = { ...defaultConfig, ...config };

    // --- MANAJEMEN STATE DAN RIWAYAT ---
    let chatHistory = [];

    const saveHistory = () => {
        if (!finalConfig.enableHistory) return;
        try {
            localStorage.setItem(finalConfig.historyKey, JSON.stringify(chatHistory));
        } catch (e) {
            console.error('Gagal menyimpan riwayat obrolan:', e);
        }
    };

    const loadHistory = () => {
        if (!finalConfig.enableHistory) return;
        try {
            const savedHistory = localStorage.getItem(finalConfig.historyKey);
            if (savedHistory) {
                chatHistory = JSON.parse(savedHistory);
                chatHistory.forEach(item => addMessage(item.message, item.sender, item.type, false));
            }
        } catch (e) {
            console.error('Gagal memuat riwayat obrolan:', e);
            chatHistory = [];
        }
    };
    
    const clearHistory = () => {
        chatHistory = [];
        localStorage.removeItem(finalConfig.historyKey);
        chatBox.innerHTML = ''; 
        addMessage(finalConfig.initialBotMessage, 'bot'); 
    };

    const loadDependencies = () => {
        if (!finalConfig.syntaxHighlighting.enable || window.hljs) return;

        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = finalConfig.syntaxHighlighting.theme;
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js';
        script.onload = () => {
        };
        document.head.appendChild(script);
    };

    const injectCSS = () => {
        const style = document.createElement('style');
        style.textContent = `
            .gemini-chat-container { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; max-width: 700px; margin: 20px auto; border: 1px solid #e0e0e0; border-radius: 12px; display: flex; flex-direction: column; height: 80vh; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); }
            .gemini-chat-header { padding: 10px 20px; border-bottom: 1px solid #e0e0e0; background-color: #f7f7f7; display: flex; justify-content: space-between; align-items: center; }
            .gemini-chat-header h3 { margin: 0; font-size: 16px; color: #333; }
            #gemini-clear-btn { background: #e0e0e0; border: none; color: #555; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 12px; }
            #gemini-clear-btn:hover { background: #d1d1d1; }
            .gemini-chat-box { flex-grow: 1; padding: 20px; overflow-y: auto; background-color: #ffffff; display: flex; flex-direction: column; gap: 15px; }
            
            /* Wrapper & Avatar */
            .message-wrapper { display: flex; align-items: flex-start; gap: 10px; max-width: 95%; }
            .message-avatar { width: 36px; height: 36px; border-radius: 50%; object-fit: cover; margin-top: 5px; }

            /* Pesan (Umum) */
            .gemini-chat-message { padding: 10px 15px; border-radius: 18px; line-height: 1.6; word-wrap: break-word; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }

            /* Pesan Pengguna */
            .user-message-wrapper { align-self: flex-end; flex-direction: row-reverse; }
            .user-message .gemini-chat-message { background-color: #007bff; color: white; border-bottom-right-radius: 4px; }

            /* Pesan Bot */
            .bot-message-wrapper { align-self: flex-start; }
            .bot-message .gemini-chat-message, .bot-typing-message { background-color: #f0f0f0; color: #333; border-bottom-left-radius: 4px; }
            .bot-typing-message { color: #888; font-style: italic; }
            .error-message .gemini-chat-message { background-color: #ffebee; color: #c62828; }

            /* Area Input */
            .gemini-input-area { display: flex; padding: 15px; border-top: 1px solid #e0e0e0; background-color: #f7f7f7; }
            #gemini-user-input { flex-grow: 1; padding: 12px 18px; border: 1px solid #ddd; border-radius: 25px; margin-right: 10px; font-size: 16px; outline: none; resize: none; transition: border-color .2s; }
            #gemini-user-input:focus { border-color: #007bff; }
            #gemini-send-btn { background-color: #007bff; color: white; border: none; border-radius: 50%; width: 48px; height: 48px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: background-color .3s; flex-shrink: 0; }
            #gemini-send-btn:hover { background-color: #0056b3; }
            #gemini-send-btn:disabled { background-color: #a0a0a0; cursor: not-allowed; }
            #gemini-send-btn svg { margin-left: 2px; }

            /* Syntax Highlighting */
            pre { margin: 10px 0; border-radius: 8px; overflow: hidden; }
            pre code.hljs { padding: 1em; font-family: 'Fira Code', 'Courier New', monospace; font-size: 14px; }
        `;
        document.head.appendChild(style);
    };

    // --- PEMBUATAN STRUKTUR HTML ---
    const createHTML = () => {
        container.innerHTML = `
            <div class="gemini-chat-container">
                <div class="gemini-chat-header">
                    <h3>AI Chatbot</h3>
                    ${finalConfig.enableHistory ? '<button id="gemini-clear-btn" title="Hapus Riwayat">Clear</button>' : ''}
                </div>
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
    };

    let chatBox, userInput, sendBtn, clearBtn;
    const assignDOMElements = () => {
        chatBox = document.getElementById('gemini-chat-box');
        userInput = document.getElementById('gemini-user-input');
        sendBtn = document.getElementById('gemini-send-btn');
        if (finalConfig.enableHistory) {
            clearBtn = document.getElementById('gemini-clear-btn');
        }
    };

    const escapeHtml = (unsafe) => {
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }

    const formatMessage = (message) => {
        let formatted = message;

        formatted = formatted.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
            const language = lang || 'plaintext';
            const escapedCode = escapeHtml(code.trim());
            return `<pre><code class="language-${language}">${escapedCode}</code></pre>`;
        });

        formatted = formatted
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>');

        return formatted;
    };


    const addMessage = (message, sender, type = 'normal', save = true) => {
        const formattedMessage = formatMessage(message);

        const wrapper = document.createElement('div');
        wrapper.classList.add('message-wrapper', `${sender}-message-wrapper`);

        const messageContainer = document.createElement('div');
        messageContainer.classList.add(`${sender}-message`);
        if (type === 'error') messageContainer.classList.add('error-message');

        const messageElement = document.createElement('div');
        messageElement.classList.add('gemini-chat-message');
        messageElement.innerHTML = formattedMessage;
        
        messageContainer.appendChild(messageElement);

        const photoUrl = sender === 'user' ? finalConfig.userPhotoUrl : finalConfig.botPhotoUrl;
        if (photoUrl) {
            const avatarElement = document.createElement('img');
            avatarElement.src = photoUrl;
            avatarElement.alt = `${sender} avatar`;
            avatarElement.classList.add('message-avatar');
            wrapper.appendChild(avatarElement);
        }
        
        wrapper.appendChild(messageContainer);
        chatBox.appendChild(wrapper);

        if (finalConfig.syntaxHighlighting.enable && window.hljs) {
            wrapper.querySelectorAll('pre code').forEach((block) => {
                hljs.highlightElement(block);
            });
        }
        
        chatBox.scrollTop = chatBox.scrollHeight;

        if (save && finalConfig.enableHistory) {
            chatHistory.push({ sender, message, type });
            saveHistory();
        }
    };

    const handleUserInput = async () => {
        const userMessage = userInput.value.trim();
        if (userMessage === '') return;

        addMessage(userMessage, 'user');
        userInput.value = '';
        userInput.focus();
        sendBtn.disabled = true;

        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('bot-message-wrapper');
        typingIndicator.innerHTML = `<div class="gemini-chat-message bot-typing-message">Sedang mengetik...</div>`;
        chatBox.appendChild(typingIndicator);
        chatBox.scrollTop = chatBox.scrollHeight;

        try {
            const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${finalConfig.model}:generateContent?key=${finalConfig.apiKey}`;
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: userMessage }] }] })
            });

            chatBox.removeChild(typingIndicator);
            const data = await response.json();

            if (!response.ok) {
                const errorText = data?.error?.message || `Gagal mendapatkan respons dari API. Status: ${response.status}`;
                throw new Error(errorText);
            }
            
            if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts[0]) {
                const botMessage = data.candidates[0].content.parts[0].text;
                addMessage(botMessage, 'bot');
            } else {
                const finishReason = data.candidates?.[0]?.finishReason || 'UNKNOWN';
                addMessage(`Maaf, saya tidak dapat memberikan respons karena alasan: ${finishReason}.`, 'bot', 'error');
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

    const bindEvents = () => {
        sendBtn.addEventListener('click', handleUserInput);
        userInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleUserInput();
            }
        });
        if (clearBtn) {
            clearBtn.addEventListener('click', clearHistory);
        }
    };

    const init = () => {
        loadDependencies();
        injectCSS();
        createHTML();
        assignDOMElements();
        bindEvents();
        
        loadHistory();

        if (chatHistory.length === 0 && finalConfig.initialBotMessage) {
            addMessage(finalConfig.initialBotMessage, 'bot');
        }
    };

    init();
};
