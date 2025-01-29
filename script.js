document.addEventListener('DOMContentLoaded', function () {
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function () {
            navLinks.forEach(link => link.classList.remove('active'));
            this.classList.add('active');
        });
    });

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const messageForm = document.getElementById('message-form');
    const messageDisplay = document.getElementById('message-display');
    const messageFormContainer = document.getElementById('message-form-container');
    const loginRegister = document.getElementById('login-register');
    let token = localStorage.getItem('token');

    if (token) {
        messageFormContainer.style.display = 'block';
        loginRegister.style.display = 'none';
        fetchMessages();
    }

    // 注册
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;
        try {
            const response = await axios.post('/register', { username, password });
            alert(response.data.message);
        } catch (error) {
            alert(error.response.data.error);
        }
    });

    // 登录
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        try {
            const response = await axios.post('/login', { username, password });
            token = response.data.token;
            localStorage.setItem('token', token);
            messageFormContainer.style.display = 'block';
            loginRegister.style.display = 'none';
            fetchMessages();
        } catch (error) {
            alert(error.response.data.error);
        }
    });

    // 获取留言
    async function fetchMessages() {
        try {
            const response = await axios.get('/messages', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            messageDisplay.innerHTML = '';
            response.data.forEach(message => {
                const div = document.createElement('div');
                div.innerHTML = `
                    <p><strong>${message.user.username}</strong>: ${message.content}</p>
                    <p>点赞数: ${message.likes}</p>
                    <button onclick="likeMessage('${message._id}')">点赞</button>
                    <div>
                        <h4>评论:</h4>
                        ${message.comments.map(comment => `<p><strong>${comment.user.username}</strong>: ${comment.content}</p>`).join('')}
                    </div>
                    <input type="text" placeholder="添加评论">
                    <button onclick="addComment('${message._id}')">添加评论</button>
                `;
                if (message.creator.toString() === getUserId() || getUserId() === 'your_admin_id') {
                    div.innerHTML += `<button onclick="deleteMessage('${message._id}')">删除</button>`;
                }
                messageDisplay.appendChild(div);
            });
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    }

    // 获取用户 ID
    function getUserId() {
        const decoded = jwt_decode(token);
        return decoded.userId;
    }

    // 点赞留言
    window.likeMessage = async (id) => {
        try {
            await axios.put(`/messages/${id}/like`, {}, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            fetchMessages();
        } catch (error) {
            console.error('Error liking message:', error);
        }
    };

    // 添加评论
    window.addComment = async (id) => {
        const commentInput = document.querySelector(`[onclick="addComment('${id}')"]`).previousElementSibling;
        const comment = commentInput.value;
        if (comment) {
            try {
                await axios.put(`/messages/${id}/comment`, { content: comment }, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                commentInput.value = '';
                fetchMessages();
            } catch (error) {
                console.error('Error adding comment:', error);
            }
        }
    };

    // 删除留言
    window.deleteMessage = async (id) => {
        if (confirm('确定要删除这条留言吗？')) {
            try {
                await axios.delete(`/messages/${id}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                fetchMessages();
            } catch (error) {
                console.error('Error deleting message:', error);
            }
        }
    };

    // 提交留言
    messageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const message = document.getElementById('message-input').value;
        const visibleTo = document.getElementById('visible-to').value;
        try {
            await axios.post('/messages', { content: message, visibleTo }, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
            document.getElementById('message-input').value = '';
            fetchMessages();
        } catch (error) {
            console.error('Error adding message:', error);
        }
    });
});
