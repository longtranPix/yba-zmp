import React, { useState, useEffect, useRef } from 'react';
import APIService from '../services/api-service';

// ✅ DRAGGABLE CHATBOT WIDGET COMPONENT - YBA Assistant Integration
const ChatbotWidget = ({ className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isHovering, setIsHovering] = useState(false);

  // ✅ DRAGGING STATE
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState(() => {
    // Initialize position in bottom right corner
    const widgetSize = 56; // 14 * 4 (w-14 h-14)
    return {
      x: Math.max(0, window.innerWidth - widgetSize - 20),
      y: Math.max(0, window.innerHeight - widgetSize - 100) // Account for mobile navigation
    };
  });

  // ✅ CLOSE CIRCLE STATE
  const [isOverCloseCircle, setIsOverCloseCircle] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const widgetRef = useRef(null);

  // ✅ INITIAL WELCOME MESSAGE
  const initialMessage = `**Xin chào! Mình là trợ lý ảo YBA – người bạn đồng hành trực tuyến của bạn tại Hội Doanh nhân Trẻ TP.HCM. Mình có thể hỗ trợ bạn các thông tin sau:**

- Giới thiệu về lịch sử, sứ mệnh, tầm nhìn, mục tiêu, giá trị cốt lõi và phương hướng hoạt động của Hội
- Một số thông tin chung về hội như thông tin liên hệ, tên gọi, trụ sở, …
- Thông tin về ban lãnh đạo và cơ cấu tổ chức YBA Nhiệm kì 12
- Hướng dẫn đăng ký hội viên, thông tin về tiêu chí, hội phí, quyền lợi hội viên
- Thông tin về các chi hội, câu lạc bộ
- Các hoạt động, sự kiện và chương trình tiêu biểu trong năm của YBA
- Thông tin về các điều lệ của hội`;

  // ✅ INITIALIZE SESSION ID
  useEffect(() => {
    const initializeSession = async () => {
      const sessionResult = await APIService.getChatSessionId();
      if (sessionResult.error === 0) {
        setSessionId(sessionResult.data.sessionId);
      }
    };

    initializeSession();
  }, []);

  // ✅ HANDLE WINDOW RESIZE - Keep widget in bounds
  useEffect(() => {
    const handleResize = () => {
      const widgetSize = 56;
      const maxX = window.innerWidth - widgetSize;
      const maxY = window.innerHeight - widgetSize;

      setPosition(prev => ({
        x: Math.max(0, Math.min(prev.x, maxX)),
        y: Math.max(0, Math.min(prev.y, maxY))
      }));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ✅ RESTORE SAVED POSITION
  useEffect(() => {
    const savedPosition = localStorage.getItem('yba_chatbot_position');
    if (savedPosition) {
      try {
        const pos = JSON.parse(savedPosition);
        setPosition(pos);
        console.log('ChatbotWidget: Restored saved position:', pos);
      } catch (error) {
        console.log('ChatbotWidget: Could not restore chatbot position:', error);
      }
    }
  }, []);

  // ✅ SAVE POSITION WHEN CHANGED
  useEffect(() => {
    localStorage.setItem('yba_chatbot_position', JSON.stringify(position));
  }, [position]);

  // ✅ ENHANCED DRAGGING FUNCTIONALITY - Support for both mouse and touch
  const handleMouseDown = (e) => {
    if (e.target.closest('.chat-window')) return; // Don't drag when clicking on chat window
    if (isOpen) return; // Don't drag when chat is open

    setIsDragging(true);
    const rect = widgetRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    setDragOffset({
      x: clientX - rect.left,
      y: clientY - rect.top
    });
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const newX = clientX - dragOffset.x;
    const newY = clientY - dragOffset.y;

    // Keep widget within screen bounds with better calculations
    const widgetSize = 56; // 14 * 4 (w-14 h-14)
    const maxX = window.innerWidth - widgetSize;
    const maxY = window.innerHeight - widgetSize;

    const boundedPosition = {
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    };

    setPosition(boundedPosition);

    // ✅ CHECK IF DRAGGING OVER CLOSE CIRCLE (Fixed position above navbar)
    const closeCircleSize = 80; // 20 * 4 (w-20 h-20)
    const navbarHeight = 100; // Navbar height from CSS (padding-bottom: 100px)
    const closeCircleMargin = 20; // Margin above navbar
    const closeCircleX = (window.innerWidth - closeCircleSize) / 2;
    const closeCircleY = window.innerHeight - navbarHeight - closeCircleSize - closeCircleMargin;

    const chatbotCenterX = boundedPosition.x + widgetSize / 2;
    const chatbotCenterY = boundedPosition.y + widgetSize / 2;

    const distance = Math.sqrt(
      Math.pow(chatbotCenterX - (closeCircleX + closeCircleSize / 2), 2) +
      Math.pow(chatbotCenterY - (closeCircleY + closeCircleSize / 2), 2)
    );

    setIsOverCloseCircle(distance < closeCircleSize / 2);
  };

  const handleMouseUp = () => {
    // ✅ CLOSE CHATBOT IF DROPPED ON CLOSE CIRCLE
    if (isDragging && isOverCloseCircle) {
      closeChatbot();
    }

    setIsDragging(false);
    setIsOverCloseCircle(false);
  };

  // ✅ TOUCH SUPPORT FOR MOBILE DRAGGING
  const handleTouchStart = (e) => {
    handleMouseDown(e);
  };

  const handleTouchMove = (e) => {
    handleMouseMove(e);
  };

  const handleTouchEnd = () => {
    handleMouseUp();
  };

  // ✅ DRAGGING EVENT LISTENERS
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

  // ✅ CLOSE CHATBOT COMPLETELY
  const closeChatbot = () => {
    setIsVisible(false);
    setIsOpen(false);
    setIsStarted(false);
  };

  // ✅ SCROLL TO BOTTOM
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  // ✅ TOGGLE CHAT WINDOW
  const toggleChat = () => {
    setIsOpen(!isOpen);
    
    if (!isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  };

  // ✅ START CHAT
  const startChat = () => {
    setIsStarted(true);
    
    // Add welcome message
    setTimeout(() => {
      addBotMessage(initialMessage);
    }, 500);
    
    // Focus input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 800);
  };

  // ✅ ADD USER MESSAGE
  const addUserMessage = (message) => {
    const newMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, newMessage]);
  };

  // ✅ ADD BOT MESSAGE
  const addBotMessage = (message) => {
    const newMessage = {
      id: Date.now(),
      type: 'bot',
      content: message,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, newMessage]);
  };

  // ✅ SEND MESSAGE
  const sendMessage = async () => {
    const message = inputValue.trim();
    if (!message || isLoading) return;

    // Add user message
    addUserMessage(message);
    setInputValue('');
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Send to chatbot API
      const response = await APIService.sendChatMessage(message, sessionId);
      
      // Hide typing indicator
      setIsTyping(false);
      
      // Add bot response
      if (response.error === 0) {
        addBotMessage(response.data.botResponse);
      } else {
        addBotMessage("Xin lỗi, có lỗi xảy ra khi kết nối. Vui lòng thử lại sau.");
      }
      
    } catch (error) {
      console.error('Error sending message:', error);
      setIsTyping(false);
      addBotMessage("Xin lỗi, có lỗi xảy ra khi kết nối. Vui lòng thử lại sau.");
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ HANDLE KEY PRESS
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ✅ FORMAT MESSAGE (Enhanced markdown with image support)
  const formatMessage = (content) => {
    console.log('ChatbotWidget: Formatting message content:', content);
    let formatted = content;

    // ✅ NEW: Image support - ![alt text](image_url)
    formatted = formatted.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => {
      // Validate image URL
      const isValidImageUrl = /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(src) ||
                             src.startsWith('data:image/') ||
                             src.includes('image') ||
                             src.includes('photo') ||
                             src.includes('picture');

      if (isValidImageUrl) {
        return `<img src="${src}" alt="${alt || 'Image'}" class="max-w-full h-auto rounded-lg shadow-md my-2 cursor-pointer" style="max-height: 300px; object-fit: contain;" onclick="window.open('${src}', '_blank')" />`;
      }

      // If not a valid image URL, return as regular link
      return `<a href="${src}" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">${alt || src}</a>`;
    });

    // ✅ NEW: Direct image URLs (auto-detect and convert to images)
    formatted = formatted.replace(/(https?:\/\/[^\s<]+\.(jpg|jpeg|png|gif|webp|svg)(\?[^\s<]*)?)/gi, (match, url) => {
      console.log('ChatbotWidget: Converting image URL to img tag:', url);
      return `<img src="${url}" alt="Image" class="chatbot-image" style="max-width: 100%; height: auto; max-height: 300px; object-fit: contain; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin: 8px 0; cursor: pointer; display: block;" onclick="window.open('${url}', '_blank')" />`;
    });

    // ✅ NEW: Also detect image URLs that might contain common image hosting patterns
    formatted = formatted.replace(/(https?:\/\/[^\s<]*(?:image|img|photo|picture|pic)[^\s<]*)/gi, (match, url) => {
      // Additional check for common image hosting services
      if (url.includes('imgur.com') || url.includes('cloudinary.com') || url.includes('amazonaws.com') ||
          url.includes('googleusercontent.com') || url.includes('unsplash.com') || url.includes('pexels.com') ||
          url.includes('pixabay.com') || url.includes('shutterstock.com')) {
        console.log('ChatbotWidget: Converting image hosting URL to img tag:', url);
        return `<img src="${url}" alt="Image" class="chatbot-image" style="max-width: 100%; height: auto; max-height: 300px; object-fit: contain; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin: 8px 0; cursor: pointer; display: block;" onclick="window.open('${url}', '_blank')" />`;
      }
      return match; // Return unchanged if not an image hosting service
    });

    // ✅ NEW: Links - [text](url)
    formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">$1</a>');

    // Bold text
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // ✅ NEW: Italic text
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // ✅ NEW: Code blocks
    formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre class="bg-gray-100 p-3 rounded-md my-2 overflow-x-auto"><code>$1</code></pre>');

    // ✅ NEW: Inline code
    formatted = formatted.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm">$1</code>');

    // Line breaks
    formatted = formatted.replace(/\n/g, '<br>');

    // Bullet points
    formatted = formatted.replace(/^- (.+)$/gm, '<li class="ml-4">$1</li>');

    // ✅ NEW: Numbered lists
    formatted = formatted.replace(/^\d+\. (.+)$/gm, '<li class="ml-4">$1</li>');

    // Wrap lists
    if (formatted.includes('<li>')) {
      formatted = formatted.replace(/(<li[^>]*>.*<\/li>)/gs, '<ul class="list-disc list-inside my-2">$1</ul>');
    }

    console.log('ChatbotWidget: Formatted message result:', formatted);
    return formatted;
  };

  // Don't render if not visible
  if (!isVisible) return null;

  return (
    <>
      {/* ✅ CLOSE CIRCLE - Fixed position above navbar with Slate Background and Red X */}
      {isDragging && (
        <div
          className="fixed z-[9998] pointer-events-none"
          style={{
            left: '50%',
            bottom: '120px', // Fixed position: 100px navbar + 20px margin
            transform: 'translateX(-50%)'
          }}
        >
          <div
            className={`w-20 h-20 rounded-full border-2 border-dashed flex items-center justify-center transition-all duration-300 ${
              isOverCloseCircle
                ? 'border-slate-300 border-opacity-80 bg-slate-200 bg-opacity-90 scale-110 shadow-lg'
                : 'border-slate-400 border-opacity-50 bg-slate-200 bg-opacity-70'
            }`}
          >
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                isOverCloseCircle
                  ? 'bg-slate-200 text-red-600 scale-110 shadow-md'
                  : 'bg-slate-200 text-red-500'
              }`}
            >
              <span className="text-2xl font-bold">×</span>
            </div>
          </div>
          <div className="text-center mt-3">
            <span className={`text-sm font-medium transition-all duration-300 ${
              isOverCloseCircle
                ? 'text-slate-700 opacity-90'
                : 'text-slate-600 opacity-70'
            }`}>
              {isOverCloseCircle ? 'Thả để đóng' : 'Kéo vào đây để đóng'}
            </span>
          </div>
        </div>
      )}

      <div
        ref={widgetRef}
        className={`fixed z-[9999] ${className}`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          cursor: isDragging ? 'grabbing' : (isOpen ? 'default' : 'grab')
        }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
      {/* Close Button - Shows on hover with Slate Background and Red X */}
      {isHovering && !isDragging && (
        <button
          onClick={closeChatbot}
          className="absolute -top-2 -right-2 w-8 h-8 bg-slate-200 text-red-600 rounded-full flex items-center justify-center text-sm font-bold hover:bg-slate-300 hover:text-red-700 transition-all duration-200 z-[10000] shadow-lg border border-slate-300"
          style={{ cursor: 'pointer' }}
          onMouseDown={(e) => e.stopPropagation()} // Prevent dragging when clicking close
        >
          <span>×</span>
        </button>
      )}

      {/* ✅ FULL SCREEN Chat Window */}
      {isOpen && (
        <div className="chat-window fixed inset-0 bg-white flex flex-col overflow-hidden transform transition-all duration-300 ease-out z-[9998]">
          {/* ✅ INLINE STYLES for message content - Using regular style tag */}
          <style dangerouslySetInnerHTML={{
            __html: `
              .chat-window .message-content img {
                max-width: 100% !important;
                height: auto !important;
                border-radius: 8px !important;
                box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
                margin: 8px 0 !important;
                cursor: pointer !important;
                transition: transform 0.2s ease !important;
                display: block !important;
              }
              .chat-window .message-content img:hover {
                transform: scale(1.02) !important;
              }
              .chat-window .message-content a {
                color: #2563eb !important;
                text-decoration: underline !important;
              }
              .chat-window .message-content a:hover {
                color: #1d4ed8 !important;
              }
              .chat-window .message-content pre {
                background-color: #f3f4f6 !important;
                padding: 12px !important;
                border-radius: 6px !important;
                margin: 8px 0 !important;
                overflow-x: auto !important;
              }
              .chat-window .message-content code {
                background-color: #f3f4f6 !important;
                padding: 2px 4px !important;
                border-radius: 3px !important;
                font-size: 0.875rem !important;
              }
              .chat-window .message-content ul {
                list-style-type: disc !important;
                list-style-position: inside !important;
                margin: 8px 0 !important;
              }
              .chat-window .message-content li {
                margin-left: 16px !important;
              }
            `
          }} />
          {/* ✅ FULL SCREEN Header with Close Button */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 flex items-center justify-between shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                <img
                  src="https://ybahcm.vn/wp-content/uploads/2025/03/Logo-YBA-2-5001555.png"
                  alt="YBA"
                  className="w-8 h-8 object-contain"
                />
              </div>
              <div>
                <h3 className="font-semibold text-lg">YBA Assistant</h3>
                <p className="text-sm opacity-90">Trợ lý ảo Hội Doanh nhân Trẻ TP.HCM</p>
              </div>
            </div>
            <button
              onClick={toggleChat}
              className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 transition-colors text-white hover:text-gray-200"
              onMouseDown={(e) => e.stopPropagation()} // Prevent dragging when clicking close
            >
              <span className="text-lg font-bold">✕</span>
            </button>
          </div>

          {/* ✅ FULL SCREEN Welcome Screen */}
          {!isStarted ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-b from-blue-50 to-white text-center">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
                <img
                  src="https://ybahcm.vn/wp-content/uploads/2025/03/Logo-YBA-2-5001555.png"
                  alt="YBA"
                  className="w-16 h-16 object-contain"
                />
              </div>
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Chào mừng đến với YBA Assistant!</h2>
              <p className="text-gray-600 mb-8 max-w-md text-lg leading-relaxed">
                Tôi là trợ lý ảo của Hội Doanh nhân Trẻ TP.HCM. Hãy hỏi tôi bất cứ điều gì bạn muốn biết về hoạt động, sự kiện, và dịch vụ của hội!
              </p>
              <button
                onClick={startChat}
                className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-full font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 shadow-lg text-lg"
              >
                Bắt đầu trò chuyện
              </button>
            </div>
          ) : (
            <>
              {/* ✅ FULL SCREEN Messages Area */}
              <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-white space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-2xl px-4 py-3 rounded-2xl text-base ${
                      message.type === 'user'
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-br-sm shadow-lg'
                        : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm shadow-md'
                    }`}>
                      <div
                        className="message-content"
                        dangerouslySetInnerHTML={{
                          __html: formatMessage(message.content)
                        }}
                        style={{
                          // ✅ Ensure images and content display properly
                          wordBreak: 'break-word',
                          lineHeight: '1.5'
                        }}
                      />
                    </div>
                  </div>
                ))}
                
                {/* Typing Indicator */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>

              {/* ✅ FULL SCREEN Input Area */}
              <div className="p-6 border-t border-gray-200 bg-white shadow-lg">
                <div className="flex items-center space-x-3 bg-gray-100 rounded-full px-6 py-4">
                  <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Nhập câu hỏi của bạn..."
                    disabled={isLoading}
                    className="flex-1 bg-transparent border-none outline-none text-base text-gray-800 placeholder-gray-500"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={isLoading || !inputValue.trim()}
                    className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full flex items-center justify-center hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-105"
                  >
                    <span className="text-lg">➤</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Chat Bubble */}
        {/* Chat Bubble */}
        <button
          onClick={toggleChat}
          onMouseDown={(e) => e.stopPropagation()} // Prevent dragging when clicking chat bubble
          className={`w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center transform hover:scale-110 ${
            isOpen ? 'rotate-180' : ''
          } ${isDragging ? 'cursor-grabbing scale-110 shadow-2xl' : 'cursor-pointer'} ${
            isOverCloseCircle ? 'animate-pulse' : ''
          }`}
          style={{ cursor: isDragging ? 'grabbing' : 'pointer' }}
        >
          <span className="text-2xl">💬</span>
        </button>
      </div>
    </>
  );
};

export default ChatbotWidget;
