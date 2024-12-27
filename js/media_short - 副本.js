document.addEventListener('DOMContentLoaded', function() {
    const writeForm = document.getElementById('writeForm');
    const displayContent = document.getElementById('displayContent');
    const resultContainer = document.querySelector('.result-container');
    const submitBtn = document.querySelector('.submit-btn');

    let currentConversationId = null; // 存储当前会话ID

    // 确保右侧展示区域始终显示，并显示初始状态
    resultContainer.style.display = 'block';
    displayContent.innerHTML = '<div class="empty-state">AI生成的内容将在这里显示</div>';

    // 处理文本内容
    function formatContent(content) {
        return content.split('\n')
            .filter(paragraph => paragraph.trim() !== '')
            .map(paragraph => `<p>${paragraph}</p>`)
            .join('');
    }

    // 创建会话
    async function createConversation() {
        const response = await fetch('https://api.coze.cn/v1/conversation/create', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer pat_taUrJDxRQyj5AX0mn7DCpkO3pG2GKamXbEgMUQDlT5xaIg9LVWT7S8ORTmB8Ivb1',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                meta_data: {
                    uuid: "test_" + Date.now()
                }
            })
        });

        if (!response.ok) {
            throw new Error('创建会话失败');
        }

        const data = await response.json();
        return data.data.id;
    }

    // 发起对话
    async function startChat(content) {
        if (!currentConversationId) {
            currentConversationId = await createConversation();
            console.log('创建会话成功，ID:', currentConversationId);
        }

        const url = `https://api.coze.cn/v3/chat?conversation_id=${currentConversationId}`;
        console.log('发起对话...', { url, content });

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer pat_taUrJDxRQyj5AX0mn7DCpkO3pG2GKamXbEgMUQDlT5xaIg9LVWT7S8ORTmB8Ivb1',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                bot_id: "7441499021698891816", // 短视频文案机器人ID
                user_id: "test",
                stream: true,
                auto_save_history: true,
                additional_messages: [{
                    role: "user",
                    content: content,
                    content_type: "text"
                }]
            })
        });

        if (!response.ok) {
            throw new Error(`发起对话失败: ${response.status}`);
        }

        return response;
    }

    writeForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        try {
            const content = document.getElementById('content').value;
            if (!content) {
                displayContent.innerHTML = '<div class="error">请输入内容</div>';
                return;
            }

            // 显示加载状态
            submitBtn.disabled = true;
            submitBtn.textContent = '生成中...';
            displayContent.innerHTML = '<div class="loading">AI 正在生成内容...</div>';

            const response = await startChat(content);
            let fullContent = '';
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let buffer = '';

            while (true) {
                const {done, value} = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, {stream: true});
                let eventEnd = buffer.indexOf('\n\n');

                while (eventEnd !== -1) {
                    const eventData = buffer.slice(0, eventEnd);
                    buffer = buffer.slice(eventEnd + 2);

                    const lines = eventData.split('\n');
                    let eventId = '';
                    let eventType = '';
                    let eventContent = '';

                    for (const line of lines) {
                        if (line.startsWith('id: ')) {
                            eventId = line.slice(4);
                        } else if (line.startsWith('event: ')) {
                            eventType = line.slice(7);
                        } else if (line.startsWith('data: ')) {
                            eventContent = line.slice(6);
                        }
                    }

                    console.log('解析事件:', {
                        id: eventId,
                        event: eventType,
                        data: eventContent
                    });

                    if (eventType === 'conversation.message.delta' && eventContent) {
                        try {
                            const parsedData = JSON.parse(eventContent);
                            console.log('收到消息事件:', parsedData);

                            if (parsedData.content && parsedData.role === 'assistant') {
                                fullContent += parsedData.content;
                                displayContent.innerHTML = formatContent(fullContent);
                                displayContent.scrollTop = displayContent.scrollHeight;
                            }
                        } catch (e) {
                            console.error('解析消息失败:', e, eventContent);
                        }
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

        } catch (error) {
            console.error('API 调用失败:', error);
            displayContent.innerHTML = `<div class="error">生成失败: ${error.message}</div>`;
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = '开始生成';
        }
    });
}); 