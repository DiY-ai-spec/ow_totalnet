document.addEventListener('DOMContentLoaded', function() {
    // 为导航链接添加点击事件处理函数
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            // 移除所有链接的 active 类
            navLinks.forEach(link => link.classList.remove('active'));
            // 为当前点击的链接添加 active 类
            this.classList.add('active');
        });
    });
    document.getElementById('message-form').addEventListener('submit', function(event) {
        event.preventDefault();
        let message = document.getElementById('message-input').value;
        let messageDisplay = document.getElementById('message-display');
        let newMessage = document.createElement('p');
        newMessage.textContent = message;
        messageDisplay.appendChild(newMessage);
        document.getElementById('message-input').value = '';
    });
});
