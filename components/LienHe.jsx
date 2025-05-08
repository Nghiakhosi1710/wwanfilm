import React, { useState } from 'react';
import "../assets/scss/LienHe.css";

const LienHe = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = (event) => {
        event.preventDefault();
        console.log(name, email, message);
    };

    return (
        <div className="container">
            <div className='lien-he'>
            <h1> Liên hệ với chúng tôi</h1>
            <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng điền vào biểu mẫu dưới đây.</p>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="name">Tên:</label>
                    <input
                        type="text"
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="message">Tin nhắn:</label>
                    <textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="submit-button">Gửi</button>
            </form>
            </div>
           
        </div>
    );
};

export default LienHe;