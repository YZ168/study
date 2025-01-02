# AI萌宠陪伴教育平台

## 作品简介
AI萌宠陪伴教育平台是一个面向儿童和青少年的智能学习平台，通过AI技术提供个性化的学习体验。平台集成了多个教育功能模块，包括学习陪伴、知识问答游戏、单词闯关、成语卡片学习和古诗词情景再现等特色功能。

### 创新性
1. **智能学习陪伴**：采用AI技术，为学生提供个性化的学习指导和答疑解惑。
2. **游戏化学习**：将知识学习融入游戏环境，提高学习兴趣和参与度。
3. **多模态交互**：结合文字、图像等多种形式，增强学习效果。
4. **实时反馈机制**：通过AI实时评估学习效果，及时调整学习策略。

### 业务完整性
平台提供五大核心功能模块：
1. **学习陪伴**：AI助手提供一对一学习辅导，解答疑问。
2. **知识问答游戏**：通过趣味问答形式，巩固知识点。
3. **单词闯关**：分级的单词学习系统，包含挑战和训练两种模式。
4. **成语卡片学习**：生动展示成语含义，提供测试练习功能。
5. **古诗词情景再现**：通过AI解析古诗词，生成情景描述。

### 应用效果
- 提供沉浸式学习体验
- 激发学习兴趣和主动性
- 实现知识的立体化呈现
- 提高学习效率和记忆效果

### 商业价值
1. **市场需求**：满足K12教育市场对智能化学习工具的需求
2. **用户粘性**：游戏化学习提高用户留存率
3. **拓展空间**：可扩展更多学科和知识领域
4. **数据价值**：积累教育数据，优化学习算法

## 技术架构

### 前端技术栈
- HTML5 + CSS3：构建响应式用户界面
- JavaScript：实现交互功能
- Marked.js：Markdown 内容渲染
- 自定义 CSS 动画：优化用户体验

### 后端服务
- Coze API：提供AI对话能力
- RESTful API：实现前后端通信
- 流式响应：支持实时内容生成

### 核心功能实现
1. **对话系统**
```javascript
async function startChat(content) {
    const chatResponse = await fetch(`https://api.coze.cn/v3/chat?conversation_id=${currentConversationId}`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${COZE_CONFIG.token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            bot_id: COZE_CONFIG.bot_id,
            user_id: "test",
            stream: true,
            additional_messages: [{
                content: content,
                content_type: "text",
                role: "user"
            }]
        })
    });
    return chatResponse;
}
```

2. **内容渲染**
```javascript
function formatContent(content) {
    marked.setOptions({
        breaks: true,
        gfm: true,
        sanitize: false,
        mangle: false,
        headerIds: false
    });
    const htmlContent = marked.parse(content);
    return `<div class="markdown-content">${htmlContent}</div>`;
}
```

## 使用方法

### 部署要求
1. Web服务器（支持静态文件托管）
2. 现代浏览器（支持ES6+）
3. Coze API Token

### 安装步骤
1. 克隆代码仓库
```bash
git clone https://github.com/YZ168/study.git
```

2. 配置API Token
在 `js/config.js` 中设置 Coze API Token：
```javascript
const COZE_CONFIG = {
    token: 'your_token_here',
    workflow_id: 'your_workflow_id',
    bot_id: 'your_bot_id'
};
```

3. 部署到Web服务器
将项目文件部署到Web服务器的根目录或子目录。

### 功能使用说明

#### 学习陪伴
- 进入学习陪伴页面
- 在输入框中输入学习问题
- 点击"开始对话"获取AI回答

#### 知识问答游戏
- 选择"知识问答游戏"功能
- 输入"知识问答游戏"开始游戏
- 根据提示回答问题

#### 单词闯关
- 选择"单词挑战"或"单词训练"模式
- 点击"开始挑战/训练"按钮
- 按照提示完成单词学习任务

#### 成语卡片学习
- 输入想要学习的成语
- 获取成语详细解释和用法
- 使用"测试练习"功能检验学习效果

#### 古诗词情景再现
- 输入古诗词名称或诗句
- 获取AI生成的情景描述
- 理解诗词含义和意境

## 项目结构
```
project/
├── css/
│   ├── style.css      # 全局样式
│   ├── write.css      # 写作页面样式
│   └── media.css      # 媒体页面样式
├── js/
│   ├── config.js      # 配置文件
│   ├── main.js        # 主要逻辑
│   ├── essay.js       # 学习陪伴功能
│   ├── marketing.js   # 知识问答功能
│   ├── media_short.js # 单词挑战功能
│   ├── media_article.js # 单词训练功能
│   ├── idiom.js       # 成语学习功能
│   └── write.js       # 古诗词功能
├── index.html         # 主页
├── essay.html         # 学习陪伴页面
├── marketing.html     # 知识问答页面
├── media.html         # 单词闯关页面
├── media_short.html   # 单词挑战页面
├── media_article.html # 单词训练页面
├── idiom.html         # 成语学习页面
└── write.html         # 古诗词页面
```

## 开发团队
- 组长：余钊
  - 负责：项目架构设计、AI接口对接、功能开发

## 未来展望
1. 添加更多学科的学习模块
2. 引入语音交互功能
3. 开发移动端应用
4. 增加社交学习功能
5. 优化AI模型，提供更精准的学习建议

## 许可证
MIT License
