const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// 连接 MongoDB
mongoose.connect('mongodb://localhost:27017/your_database_name', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

// 用户模型
const UserSchema = new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', UserSchema);

// 留言模型
const MessageSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    likes: { type: Number, default: 0 },
    comments: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
            content: { type: String }
        }
    ],
    visibleTo: { type: String, default: 'all' },
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});
const Message = mongoose.model('Message', MessageSchema);

// 用户注册
app.post('/register', async (req, res) => {
    try {
        const { username, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ username, password: hashedPassword });
        await newUser.save();
        res.status(201).json({ message: '注册成功' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// 用户登录
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: '用户不存在' });
        }
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: '密码错误' });
        }
        const token = jwt.sign({ userId: user._id }, 'your_secret_key', { expiresIn: '1h' });
        res.json({ token });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// 验证 JWT 中间件
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) {
        return res.status(401).json({ error: '未提供令牌' });
    }
    jwt.verify(token.replace('Bearer ', ''), 'your_secret_key', (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: '无效的令牌' });
        }
        req.userId = decoded.userId;
        next();
    });
};

// 获取所有留言
app.get('/messages', async (req, res) => {
    try {
        const messages = await Message.find().populate('user', 'username');
        res.json(messages);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 添加留言
app.post('/messages', verifyToken, async (req, res) => {
    try {
        const { content, visibleTo } = req.body;
        const newMessage = new Message({
            user: req.userId,
            content,
            visibleTo,
            creator: req.userId
        });
        await newMessage.save();
        res.status(201).json(newMessage);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// 点赞留言
app.put('/messages/:id/like', verifyToken, async (req, res) => {
    try {
        const message = await Message.findByIdAndUpdate(
            req.params.id,
            { $inc: { likes: 1 } },
            { new: true }
        );
        if (!message) {
            return res.status(404).json({ error: '留言未找到' });
        }
        res.json(message);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 添加评论
app.put('/messages/:id/comment', verifyToken, async (req, res) => {
    try {
        const { content } = req.body;
        const message = await Message.findByIdAndUpdate(
            req.params.id,
            { $push: { comments: { user: req.userId, content } } },
            { new: true }
        ).populate('comments.user', 'username');
        if (!message) {
            return res.status(404).json({ error: '留言未找到' });
        }
        res.json(message);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 删除留言
app.delete('/messages/:id', verifyToken, async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);
        if (!message) {
            return res.status(404).json({ error: '留言未找到' });
        }
        if (message.creator.toString() === req.userId || req.userId === 'your_admin_id') {
            await message.deleteOne();
            res.json({ message: '留言删除成功' });
        } else {
            res.status(403).json({ error: '无权限删除该留言' });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});