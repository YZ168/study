document.addEventListener('DOMContentLoaded', function() {
    // 底部导航切换
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
        });
    });

    // 工具卡片点击事件
    const toolCards = document.querySelectorAll('.tool-card');
    toolCards.forEach(card => {
        card.addEventListener('click', function() {
            // 获取卡片的类型并跳转
            const type = this.querySelector('.tool-btn').textContent;
            if (type === '古诗词情景再现') {
                window.location.href = 'write.html';
            } else if (type === '知识问答游戏') {
                window.location.href = 'marketing.html';
            }
        });
    });

    // 添加功能导航区域的点击事件
    const featureItems = document.querySelectorAll('.feature-item');
    featureItems.forEach(item => {
        item.addEventListener('click', function() {
            const text = this.querySelector('span').textContent;
            if (text === '古诗词情景再现') {
                window.location.href = 'write.html';
            } else if (text === '知识问答游戏') {
                window.location.href = 'marketing.html';
            }
        });
    });

    // 处理工具卡片图片加载
    const toolCardImages = document.querySelectorAll('.tool-card img');
    toolCardImages.forEach(img => {
        img.addEventListener('load', function() {
            // 图片加载完成后，移除加载状态
            this.parentElement.classList.add('loaded');
        });
        
        img.addEventListener('error', function() {
            // 图片加载失败时，显示备用图片
            this.src = 'https://via.placeholder.com/400x300';
        });
    });
}); 