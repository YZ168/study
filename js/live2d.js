class Live2DWidget {
    constructor() {
        console.log('Initializing Live2DWidget...');
        this.initElements();
        this.bindEvents();
        this.conversation_id = null;
        this.isFirstInteraction = true;
        this.chatHistory = this.loadChatHistory();
        console.log('Live2DWidget initialization completed');
    }

    initElements() {
        console.log('Creating Live2D elements...');
        // Create container
        this.container = document.createElement('div');
        this.container.className = 'waifu';
        console.log('Created container element');
        
        // Create tips element
        this.tips = document.createElement('div');
        this.tips.className = 'waifu-tips';
        console.log('Created tips element');
        
        // Create input element
        this.input = document.createElement('input');
        this.input.className = 'waifu-chat-input';
        this.input.placeholder = '和我聊天吧~';
        console.log('Created input element');
        
        // Create canvas for Live2D
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'live2d';
        this.canvas.width = 200;
        this.canvas.height = 400;
        console.log('Created canvas element');

        // Create history button
        this.historyBtn = document.createElement('div');
        this.historyBtn.className = 'waifu-history-btn';
        this.historyBtn.innerHTML = '💬';
        this.historyBtn.title = '查看聊天记录';
        console.log('Created history button');

        // Create history panel
        this.historyPanel = document.createElement('div');
        this.historyPanel.className = 'waifu-history-panel';
        this.historyPanel.innerHTML = `
            <div class="waifu-history-header">
                <div class="waifu-history-title-group">
                    <div class="waifu-history-title">聊天记录</div>
                    <div class="waifu-history-clear" title="清除记录">🗑️ 清除记录</div>
                </div>
                <div class="waifu-history-close">✕</div>
            </div>
            <div class="waifu-history-content"></div>
            <div class="waifu-history-input-area">
                <input type="text" class="waifu-history-input" placeholder="和我聊天吧~">
                <button class="waifu-history-send">➤</button>
            </div>
        `;

        // Create confirm dialog
        this.confirmDialog = document.createElement('div');
        this.confirmDialog.className = 'waifu-confirm-dialog';
        this.confirmDialog.innerHTML = `
            <div class="waifu-confirm-content">
                确定要清除所有聊天记录吗？
            </div>
            <div class="waifu-confirm-buttons">
                <button class="waifu-confirm-btn waifu-confirm-cancel">取消</button>
                <button class="waifu-confirm-btn waifu-confirm-ok">确定</button>
            </div>
        `;

        // Create overlay
        this.confirmOverlay = document.createElement('div');
        this.confirmOverlay.className = 'waifu-confirm-overlay';
        
        // Append elements
        this.container.appendChild(this.tips);
        this.container.appendChild(this.input);
        this.container.appendChild(this.canvas);
        document.body.appendChild(this.container);
        document.body.appendChild(this.historyBtn);
        document.body.appendChild(this.historyPanel);
        document.body.appendChild(this.confirmDialog);
        document.body.appendChild(this.confirmOverlay);
        
        // Store references to elements
        this.historyContent = this.historyPanel.querySelector('.waifu-history-content');
        this.historyClose = this.historyPanel.querySelector('.waifu-history-close');
        this.historyClear = this.historyPanel.querySelector('.waifu-history-clear');
        this.confirmCancel = this.confirmDialog.querySelector('.waifu-confirm-cancel');
        this.confirmOk = this.confirmDialog.querySelector('.waifu-confirm-ok');
        this.historyInput = this.historyPanel.querySelector('.waifu-history-input');
        this.historySend = this.historyPanel.querySelector('.waifu-history-send');
    }

    loadChatHistory() {
        try {
            const history = localStorage.getItem('waifu-chat-history');
            return history ? JSON.parse(history) : [];
        } catch (error) {
            console.error('Failed to load chat history:', error);
            return [];
        }
    }

    saveChatHistory() {
        try {
            // 只保留最近100条消息
            if (this.chatHistory.length > 100) {
                this.chatHistory = this.chatHistory.slice(-100);
            }
            localStorage.setItem('waifu-chat-history', JSON.stringify(this.chatHistory));
        } catch (error) {
            console.error('Failed to save chat history:', error);
        }
    }

    addMessageToHistory(message, isUser = false) {
        const messageObj = {
            content: message,
            timestamp: new Date().toISOString(),
            type: isUser ? 'user' : 'ai'
        };
        this.chatHistory.push(messageObj);
        this.saveChatHistory();
        this.updateHistoryPanel();
    }

    updateHistoryPanel() {
        if (!this.historyContent) return;
        
        this.historyContent.innerHTML = this.chatHistory.map(msg => `
            <div class="waifu-history-item ${msg.type}">
                <div class="waifu-history-message">${msg.content}</div>
                <div class="waifu-history-time">${new Date(msg.timestamp).toLocaleString()}</div>
            </div>
        `).join('');
        
        // 滚动到最新消息
        this.historyContent.scrollTop = this.historyContent.scrollHeight;
    }

    async createConversation() {
        console.log('Creating new conversation...');
        try {
            const response = await fetch('https://api.coze.cn/v1/conversation/create', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${COZE_CONFIG.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });

            if (!response.ok) {
                throw new Error(`创建会话失败: ${response.status}`);
            }

            const conversationData = await response.json();
            console.log('创建会话成功:', conversationData);

            if (conversationData.code !== 0) {
                throw new Error(`创建会话失败: ${conversationData.msg}`);
            }

            this.conversation_id = conversationData.data.id;
            console.log('获取到会话ID:', this.conversation_id);
            return this.conversation_id;
        } catch (error) {
            console.error('Failed to create conversation:', error);
            this.showMessage('抱歉,我现在有点累,待会再聊吧~');
            return null;
        }
    }

    async startChat(content) {
        console.log('开始发起对话...', {
            conversationId: this.conversation_id,
            content: content
        });

        const chatResponse = await fetch(`https://api.coze.cn/v3/chat?conversation_id=${this.conversation_id}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${COZE_CONFIG.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                bot_id: "7455497514339893274",
                user_id: "test",
                stream: true,
                additional_messages: [{
                    content: content,
                    content_type: "text",
                    role: "user"
                }]
            })
        });

        if (!chatResponse.ok) {
            throw new Error(`发起对话失败: ${chatResponse.status}`);
        }

        return chatResponse;
    }

    async sendMessage(content) {
        console.log('Sending message:', content);
        try {
            // 显示加载状态
            this.showMessage('<span class="loading-dots">思考中</span>');
            
            // 如果没有会话ID，先创建会话
            if (!this.conversation_id) {
                await this.createConversation();
            }

            // 发起对话
            const chatResponse = await this.startChat(content);
            
            let fullContent = '';
            let buffer = '';

            // 处理流式响应
            const reader = chatResponse.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const {done, value} = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, {stream: true});
                console.log('收到原始数据:', buffer);
                
                let eventEnd = buffer.indexOf('\n\n');
                while (eventEnd > -1) {
                    const eventData = buffer.substring(0, eventEnd);
                    buffer = buffer.substring(eventEnd + 2);

                    // 解析事件数据
                    const lines = eventData.split('\n');
                    let eventId = '';
                    let eventType = '';
                    let eventContent = '';

                    for (const line of lines) {
                        if (line.startsWith('id:')) {
                            eventId = line.substring(3).trim();
                        } else if (line.startsWith('event:')) {
                            eventType = line.substring(6).trim();
                        } else if (line.startsWith('data:')) {
                            eventContent = line.substring(5).trim();
                        }
                    }

                    console.log('解析事件:', {
                        id: eventId,
                        event: eventType,
                        data: eventContent
                    });

                    // 处理不同类型的事件
                    if (eventType === 'conversation.message.delta' && eventContent) {
                        try {
                            const parsedData = JSON.parse(eventContent);
                            console.log('收到消息事件:', parsedData);

                            if (parsedData.content && parsedData.role === 'assistant') {
                                fullContent += parsedData.content;
                                this.showMessage(fullContent);
                            }
                        } catch (e) {
                            console.error('解析消息失败:', e, eventContent);
                        }
                    } else if (eventType === 'conversation.message.completed') {
                        console.log('消息完成');
                    } else if (eventType === 'conversation.chat.created') {
                        console.log('对话创建');
                    } else if (eventType === 'conversation.chat.in_progress') {
                        console.log('对话进行中');
                    } else if (eventType === 'Error') {
                        try {
                            const parsedData = JSON.parse(eventContent);
                            console.error('收到错误:', parsedData);
                            throw new Error(parsedData.error_message || '对话失败');
                        } catch (e) {
                            console.error('解析错误失败:', e, eventContent);
                            throw e;
                        }
                    }

                    eventEnd = buffer.indexOf('\n\n');
                }
            }

            return fullContent;  // 返回完整的消息内容
        } catch (error) {
            console.error('Failed to send message:', error);
            const errorMessage = '抱歉,我现在有点累,待会再聊吧~';
            this.showMessage(errorMessage);
            return errorMessage;  // 返回错误消息
        }
    }

    bindEvents() {
        console.log('Binding events...');
        // Toggle input on canvas click
        this.canvas.addEventListener('click', () => {
            console.log('Canvas clicked');
            this.input.classList.toggle('active');
            if (this.input.classList.contains('active')) {
                this.input.focus();
                if (this.isFirstInteraction) {
                    this.showMessage('来和我聊天吧！');
                    this.isFirstInteraction = false;
                }
            }
        });

        // Handle input submission
        this.input.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                await this.handleMessageSend(this.input);
            }
        });

        // Hide input on blur
        this.input.addEventListener('blur', () => {
            console.log('Input lost focus');
            setTimeout(() => {
                this.input.classList.remove('active');
            }, 200);
        });

        // Toggle history panel
        this.historyBtn.addEventListener('click', () => {
            this.historyPanel.classList.toggle('active');
            this.updateHistoryPanel();
        });

        // Close history panel
        this.historyClose.addEventListener('click', () => {
            this.historyPanel.classList.remove('active');
        });

        // Close history panel when clicking outside
        document.addEventListener('click', (e) => {
            if (this.historyPanel.classList.contains('active') &&
                !this.historyPanel.contains(e.target) &&
                !this.historyBtn.contains(e.target)) {
                this.historyPanel.classList.remove('active');
            }
        });

        // Clear history button click
        this.historyClear.addEventListener('click', () => {
            this.showConfirmDialog();
        });

        // Confirm dialog buttons
        this.confirmCancel.addEventListener('click', () => {
            this.hideConfirmDialog();
        });

        this.confirmOk.addEventListener('click', () => {
            this.clearChatHistory();
        });

        // Close dialog when clicking overlay
        this.confirmOverlay.addEventListener('click', () => {
            this.hideConfirmDialog();
        });

        // Prevent dialog close when clicking dialog content
        this.confirmDialog.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // 处理历史记录面板的输入
        this.historyInput.addEventListener('keypress', async (e) => {
            if (e.key === 'Enter') {
                await this.handleMessageSend(this.historyInput);
            }
        });
        
        this.historySend.addEventListener('click', async () => {
            await this.handleMessageSend(this.historyInput);
        });

        console.log('All events bound successfully');
    }

    showMessage(text, timeout = 12000) {
        console.log('Showing message:', text);
        
        const isSystemMessage = text.includes('来和我聊天吧') || text.includes('思考中') || text.includes('抱歉');
        
        if (!isSystemMessage) {
            this.tips.style.transition = 'opacity 0.3s ease-in-out';
        }
        
        this.tips.innerHTML = text;
        this.tips.classList.add('active');
        this.tips.style.opacity = 1;
        
        const length = text.length;
        const minTimeout = 12000;
        const maxTimeout = 30000;
        const perCharTime = 400;
        
        let baseTimeout = minTimeout;
        if (text.includes('思考中')) {
            baseTimeout = 8000;
        } else if (text.includes('来和我聊天吧')) {
            baseTimeout = 10000;
        } else if (text.includes('抱歉')) {
            baseTimeout = 15000;
        }
        
        const calculatedTimeout = Math.min(
            Math.max(baseTimeout, length * perCharTime),
            maxTimeout
        );
        
        const punctuationCount = (text.match(/[。！？，、；：]/g) || []).length;
        const extraTime = punctuationCount * 1000;
        
        const finalTimeout = Math.min(calculatedTimeout + extraTime, maxTimeout);
        
        console.log('Message display time:', finalTimeout, 'ms');
        
        if (isSystemMessage) {
            setTimeout(() => {
                console.log('Hiding system message:', text);
                this.tips.classList.remove('active');
                this.tips.style.opacity = 0;
            }, finalTimeout);
        }
    }

    clearChatHistory() {
        this.chatHistory = [];
        localStorage.removeItem('waifu-chat-history');
        this.updateHistoryPanel();
        this.hideConfirmDialog();
    }

    showConfirmDialog() {
        this.confirmDialog.classList.add('active');
        this.confirmOverlay.classList.add('active');
    }

    hideConfirmDialog() {
        this.confirmDialog.classList.remove('active');
        this.confirmOverlay.classList.remove('active');
    }

    // 添加新的消息处理方法
    async handleMessageSend(inputElement) {
        const message = inputElement.value.trim();
        if (!message) return;
        
        // 禁用输入和发送按钮
        this.setInputState(false);
        
        try {
            // 清空输入框
            inputElement.value = '';
            
            // 添加用户消息到历史记录
            this.addMessageToHistory(message, true);
            
            // 发送消息并获取响应
            const response = await this.sendMessage(message);
            if (response) {
                this.addMessageToHistory(response);
            }
        } catch (error) {
            console.error('Failed to send message:', error);
            this.showMessage('抱歉,我现在有点累,待会再聊吧~');
        } finally {
            // 恢复输入和发送按钮
            this.setInputState(true);
        }
    }

    // 添加输入状态控制方法
    setInputState(enabled) {
        this.input.disabled = !enabled;
        this.historyInput.disabled = !enabled;
        this.historySend.disabled = !enabled;
    }
}

// Initialize when document is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded, creating Live2DWidget instance');
    window.live2dWidget = new Live2DWidget();
}); 