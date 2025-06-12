/*
 * Chatbot by Ilhamz
 * Copyright (c) 2025 Yoredaze
 */

const chatBot = (options) => {
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

    container.innerHTML = `
        <div class="gemini-chat-container">
            <div class="gemini-chat-box" id="gemini-chat-box">
                </div>
            <div class="gemini-input-area">
                <input type="text" id="gemini-user-input" placeholder="Ketik pesan Anda...">
                <button id="gemini-send-btn">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                        <path fill="currentColor" d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                    </svg>
                </button>
            </div>
        </div>
    `;

    const chatBox = document.getElementById('gemini-chat-box');
    const userInput = document.getElementById('gemini-user-input');
    const sendBtn = document.getElementById('gemini-send-btn');

    const addMessage = (message, sender) => {
        const messageElement = document.createElement('div');
        messageElement.classList.add('gemini-chat-message', `${sender}-message`);

        const formattedMessage = message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>').replace(/\n/g, '<br>');
        
        messageElement.innerHTML = formattedMessage;
        chatBox.appendChild(messageElement);
        chatBox.scrollTop = chatBox.scrollHeight;
    };

    const handleUserInput = async () => {
        const userMessage = userInput.value.trim();
        if (userMessage === '') return;

        addMessage(userMessage, 'user');
        userInput.value = '';
        sendBtn.disabled = true;
        addMessage("<em>Sedang mengetik...</em>", 'bot-typing');

        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${config.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: userMessage
                        }]
                    }]
                }),
            });

            if (!response.ok) {
                throw new Error('Gagal mendapatkan respons dari API.');
            }

            const data = await response.json();
            const botMessage = data.candidates[0].content.parts[0].text;

            const typingIndicator = chatBox.querySelector('.bot-typing-message');
            if (typingIndicator) {
                chatBox.removeChild(typingIndicator);
            }
            
            addMessage(botMessage, 'bot');

        } catch (error) {
            const typingIndicator = chatBox.querySelector('.bot-typing-message');
            if (typingIndicator) {
                chatBox.removeChild(typingIndicator);
            }
            addMessage('Maaf, terjadi kesalahan. Silakan coba lagi.', 'bot');
            console.error('Error:', error);
        } finally {
            sendBtn.disabled = false;
        }
    };

    sendBtn.addEventListener('click', handleUserInput);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleUserInput();
        }
    });
};
