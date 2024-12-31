document.addEventListener('DOMContentLoaded', function() {
    const marketingForm = document.getElementById('writeForm');
    const displayContent = document.getElementById('displayContent');
    const resultContainer = document.querySelector('.result-container');
    const submitBtn = document.querySelector('.submit-btn');
    const quickBtn = document.querySelector('.quick-btn');

    let currentConversationId = null; // 存储当前会话ID
    // 确保右侧展示区域始终显示，并显示初始状态
    resultContainer.style.display = 'block';
    displayContent.innerHTML = '<div class="empty-state">AI生成的内容将在这里显示</div>';

    // 设置生成状态的函数
    function setGeneratingState(isGenerating) {
        submitBtn.disabled = isGenerating;
        quickBtn.disabled = isGenerating;
        if (isGenerating) {
            submitBtn.textContent = '生成中...';
            quickBtn.classList.add('disabled');
        } else {
            submitBtn.textContent = '开始对话';
            quickBtn.classList.remove('disabled');
        }
    }

    // 发起对话的函数
    async function startChat(content) {
        console.log('开始发起对话...', {
            conversationId: currentConversationId,
            content: content
        });

        const chatResponse = await fetch(`https://api.coze.cn/v3/chat?conversation_id=${currentConversationId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${COZE_CONFIG.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                bot_id: '7453115303963656242',
                user_id: "test",
                stream: true,
                additional_messages: [
                    {
                        content: content,
                        content_type: "text",
                        role: "user"
                    }
                ]
            })
        });

        if (!chatResponse.ok) {
            throw new Error(`发起对话失败: ${chatResponse.status}`);
        }

        return chatResponse;
    }

    marketingForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        try {
            const content = document.getElementById('content').value;

            if (!content) {
                displayContent.innerHTML = '<div class="error">请输入内容</div>';
                return;
            }

            // 显示加载状态
            setGeneratingState(true);
            displayContent.innerHTML = '<div class="loading">AI 正在生成内容...</div>';

            // 如果没有会话ID，先创建会话
            if (!currentConversationId) {
                console.log('首次提交，开始创建会话...');
                const createConversationResponse = await fetch('https://api.coze.cn/v1/conversation/create', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${COZE_CONFIG.token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({})
                });

                if (!createConversationResponse.ok) {
                    throw new Error(`创建会话失败: ${createConversationResponse.status}`);
                }

                const conversationData = await createConversationResponse.json();
                console.log('创建会话成功:', conversationData);

                if (conversationData.code !== 0) {
                    throw new Error(`创建会话失败: ${conversationData.msg}`);
                }

                currentConversationId = conversationData.data.id;
                console.log('获取到会话ID:', currentConversationId);
            } else {
                console.log('使用现有会话:', currentConversationId);
            }

            // 发起对话
            const chatResponse = await startChat(content);

            // 清空之前的内容
            displayContent.innerHTML = '';
            
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
                                displayContent.innerHTML = formatContent(fullContent);
                                displayContent.scrollTop = displayContent.scrollHeight;
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

            // 添加显示动画
            resultContainer.classList.remove('show');
            void resultContainer.offsetWidth;
            resultContainer.classList.add('show');

        } catch (error) {
            console.error('API 调用失败:', error);
            displayContent.innerHTML = `<div class="error">生成失败: ${error.message}</div>`;
        } finally {
            // 恢复按钮状态
            setGeneratingState(false);
        }
    });

    // 格式化内容，使用 Markdown 解析
    function formatContent(content) {
        // 配置 marked 选项
        marked.setOptions({
            breaks: true, // 支持 GitHub 风格的换行
            gfm: true,    // 启用 GitHub 风格的 Markdown
            sanitize: false, // 允许 HTML 标签
            mangle: false,
            headerIds: false
        });

        try {
            // 将 Markdown 转换为 HTML
            const htmlContent = marked.parse(content);
            return `<div class="markdown-content">${htmlContent}</div>`;
        } catch (error) {
            console.error('Markdown 解析错误:', error);
            return `<div class="error">内容解析失败</div>`;
        }
    }
}); 