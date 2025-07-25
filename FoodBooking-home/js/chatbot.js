class FoodBookingAI {
    constructor() {
        this.isOpen = false;
        this.apiKey = "AIzaSyCbGjhla6AP_2_wyfKQhsbjmL43Ud8OmX0"; 
        this.model = "gemini-1.5-flash-latest"; 
        this.apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
    }

    toggleChatbot() {
        this.isOpen = !this.isOpen;
        const container = document.getElementById('chatbot-container');
        if (this.isOpen) {
            container.classList.remove('chatbot-hidden');
            document.getElementById('user-input').focus();
        } else {
            container.classList.add('chatbot-hidden');
        }
    }

    async sendMessage() {
        const input = document.getElementById('user-input');
        const message = input.value.trim();
        if (message === '') return;

        this.addMessage(message, 'user');
        input.value = '';
        this.addMessage("⏳ Đang xử lý...", 'bot');

        const response = await this.callGemini(message);
        this.replaceLastBotMessage(response);
    }

    addMessage(content, sender) {
        const messagesContainer = document.getElementById('chatbot-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}-message`;
        messageDiv.innerHTML = `<div class="message-content">${content}</div>`;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    replaceLastBotMessage(content) {
        const messagesContainer = document.getElementById('chatbot-messages');
        const botMessages = messagesContainer.querySelectorAll('.bot-message');
        if (botMessages.length > 0) {
            const last = botMessages[botMessages.length - 1];
            last.querySelector('.message-content').innerHTML = content;
        }
    }

    async callGemini(promptText) {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: "user", parts: [{ text: promptText }] }]
                })
            });

            const data = await response.json();
            const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            return reply || "❌ Xin lỗi, tôi không hiểu. Bạn thử nói lại nhé!";
        } catch (error) {
            console.error("Gemini API Error:", error);
            return "❌ Có lỗi khi kết nối tới AI. Hãy kiểm tra API key hoặc thử lại sau.";
        }
    }
}

const chatbot = new FoodBookingAI();

function toggleChatbot() {
    chatbot.toggleChatbot();
}

function sendMessage() {
    chatbot.sendMessage();
}

function handleKeyPress(event) {
    if (event.key === 'Enter') {
        sendMessage();
    }
}
