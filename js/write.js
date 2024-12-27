document.addEventListener('DOMContentLoaded', function() {
    const writeForm = document.getElementById('writeForm');
    const displayContent = document.getElementById('displayContent');
    const resultContainer = document.querySelector('.result-container');
    const submitBtn = document.querySelector('.submit-btn');

    // 确保右侧展示区域始终显示，并显示初始状态
    resultContainer.style.display = 'block';
    displayContent.innerHTML = '<div class="empty-state">AI生成的内容将在这里显示</div>';

    // 处理 markdown 格式的图片和文本
    function formatContent(content) {
        // 分离文本和图片URL
        let formattedText = content;
        let imageHtml = '';
        
        // 匹配markdown格式的图片链接 ![](url)
        const markdownImagePattern = /!\[\]\((https:\/\/s\.coze\.cn\/t\/[^)]+)\)/g;
        const matches = content.match(markdownImagePattern) || [];
        
        if (matches.length > 0) {
            imageHtml = '<div class="image-gallery">';
            matches.forEach(match => {
                // 提取URL（去掉markdown语法）
                const url = match.match(/\((https:\/\/[^)]+)\)/)[1];
                imageHtml += `<img src="${url}" alt="生成的图片" loading="lazy" onclick="openImageModal(this.src)">`;
                // 从文本中移除整个markdown图片语法
                formattedText = formattedText.replace(match, '');
            });
            imageHtml += '</div>';
        }
        
        // 处理文本内容
        const paragraphs = formattedText.split('\n')
            .filter(p => p.trim())
            .map(p => `<p>${p.trim()}</p>`)
            .join('');
        
        return paragraphs + imageHtml;
    }

    // 添加图片查看功能
    window.openImageModal = function(imgSrc) {
        const modal = document.getElementById('imageModal');
        const modalImg = document.getElementById('modalImage');
        modal.style.display = 'block';
        modalImg.src = imgSrc;
    }

    // 关闭弹窗
    document.querySelector('.close-modal').onclick = function() {
        document.getElementById('imageModal').style.display = 'none';
    }

    // 点击弹窗外部关闭
    document.getElementById('imageModal').onclick = function(e) {
        if (e.target === this) {
            this.style.display = 'none';
        }
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

            // 最多重试3次
            let retryCount = 0;
            const maxRetries = 3;
            
            async function tryRequest() {
                const requestOptions = {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer pat_taUrJDxRQyj5AX0mn7DCpkO3pG2GKamXbEgMUQDlT5xaIg9LVWT7S8ORTmB8Ivb1`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        workflow_id: '7452901536713850934',
                        parameters: {
                            user_q: content
                        }
                    })
                };

                console.log('发送请求配置:', {
                    url: 'https://api.coze.cn/v1/workflow/stream_run',
                    method: requestOptions.method,
                    headers: requestOptions.headers,
                    body: JSON.parse(requestOptions.body)
                });

                try {
                    const response = await fetch('https://api.coze.cn/v1/workflow/stream_run', requestOptions);
                    console.log('响应状态:', response.status);
                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error('错误响应:', errorText);
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response;
                } catch (error) {
                    if (retryCount < maxRetries) {
                        retryCount++;
                        console.log(`重试第 ${retryCount} 次...`);
                        await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                        return tryRequest();
                    }
                    throw error;
                }
            }

            const response = await tryRequest();

            let fullContent = '';
            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const {done, value} = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value, {stream: true});
                console.log('收到数据块:', chunk);
                
                const events = chunk.split('\n\n');
                
                for (const event of events) {
                    if (!event.trim()) continue;

                    const lines = event.split('\n');
                    let eventType = '';
                    let data = '';

                    for (const line of lines) {
                        if (line.startsWith('event: ')) {
                            eventType = line.substring(7);
                        } else if (line.startsWith('data: ')) {
                            data = line.substring(6);
                        }
                    }

                    if (eventType === 'Message' && data) {
                        try {
                            const parsedData = JSON.parse(data);
                            console.log('解析的数据:', parsedData);
                            if (parsedData.content) {
                                fullContent += parsedData.content;
                                // 更新显示内容
                                displayContent.innerHTML = formatContent(fullContent);
                                displayContent.scrollTop = displayContent.scrollHeight;
                            }
                        } catch (e) {
                            console.error('解析消息失败:', e);
                        }
                    } else if (eventType === 'Done') {
                        console.log('生成完成');
                    }
                }
            }

        } catch (error) {
            console.error('生成失败:', error);
            displayContent.innerHTML = `<div class="error">生成失败: ${error.message}</div>`;
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = '生成古诗词情景';
        }
    });
}); 