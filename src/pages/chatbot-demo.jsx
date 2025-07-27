import React from 'react';
import { Page } from 'zmp-ui';

// ✅ CHATBOT DEMO PAGE - Shows global draggable chatbot widget
const ChatbotDemoPage = () => {
  return (
    <Page className="bg-white page safe-page-content">
      <div className="p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-4">
            YBA Chatbot Demo
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed">
            Chào mừng bạn đến với trang demo chatbot YBA Assistant. 
            Chatbot có thể di chuyển được và có nút đóng khi hover.
          </p>
        </div>

        {/* Demo Content */}
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-blue-800 mb-3">
              🤖 Tính năng Chatbot
            </h2>
            <ul className="space-y-2 text-blue-700">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                <strong>Di chuyển được:</strong> Kéo thả chatbot đến bất kỳ vị trí nào trên màn hình
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                <strong>Nút đóng:</strong> Hover vào chatbot để hiện nút đóng (×) màu đỏ
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                <strong>Trò chuyện:</strong> Click vào chatbot để mở cửa sổ chat
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                <strong>YBA Assistant:</strong> Kết nối với AI chatbot của YBA
              </li>
            </ul>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-green-800 mb-3">
              📱 Hướng dẫn sử dụng
            </h2>
            <div className="space-y-3 text-green-700">
              <div className="flex items-start">
                <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">1</span>
                <div>
                  <strong>Di chuyển chatbot:</strong> Nhấn và giữ vào chatbot, sau đó kéo đến vị trí mong muốn
                </div>
              </div>
              <div className="flex items-start">
                <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">2</span>
                <div>
                  <strong>Đóng chatbot:</strong> Di chuột vào chatbot và click nút × màu đỏ ở góc trên bên phải
                </div>
              </div>
              <div className="flex items-start">
                <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">3</span>
                <div>
                  <strong>Mở chat:</strong> Click vào biểu tượng 💬 để mở cửa sổ trò chuyện
                </div>
              </div>
              <div className="flex items-start">
                <span className="bg-green-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold mr-3 mt-0.5">4</span>
                <div>
                  <strong>Trò chuyện:</strong> Nhập câu hỏi và nhấn Enter hoặc click nút gửi
                </div>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-yellow-800 mb-3">
              💡 Thông tin YBA Assistant
            </h2>
            <div className="text-yellow-700 space-y-2">
              <p>
                <strong>YBA Assistant</strong> là trợ lý ảo thông minh của Hội Doanh nhân Trẻ TP.HCM, 
                có thể hỗ trợ bạn các thông tin về:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Lịch sử, sứ mệnh, tầm nhìn của YBA</li>
                <li>Thông tin liên hệ và trụ sở</li>
                <li>Ban lãnh đạo và cơ cấu tổ chức</li>
                <li>Hướng dẫn đăng ký hội viên</li>
                <li>Thông tin về các chi hội, câu lạc bộ</li>
                <li>Các hoạt động và sự kiện của YBA</li>
                <li>Điều lệ và quy định của hội</li>
              </ul>
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-purple-800 mb-3">
              🔧 Tính năng kỹ thuật
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-purple-700">
              <div>
                <h3 className="font-semibold mb-2">Frontend:</h3>
                <ul className="space-y-1 text-sm">
                  <li>• React Hooks</li>
                  <li>• Draggable UI</li>
                  <li>• Responsive Design</li>
                  <li>• Tailwind CSS</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Backend:</h3>
                <ul className="space-y-1 text-sm">
                  <li>• YBA Chatbot API</li>
                  <li>• Session Management</li>
                  <li>• Error Handling</li>
                  <li>• Message Formatting</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Demo Instructions */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              🎯 Thử ngay!
            </h2>
            <p className="text-gray-600 mb-4">
              Chatbot YBA Assistant đang hiển thị trên tất cả các màn hình của ứng dụng.
              Hãy thử di chuyển và trò chuyện với chatbot!
            </p>
            <div className="flex justify-center space-x-4">
              <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
                💬 Click để chat
              </div>
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
                🖱️ Kéo để di chuyển
              </div>
              <div className="bg-red-100 text-red-800 px-4 py-2 rounded-full text-sm font-medium">
                × Hover để đóng
              </div>
            </div>

            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
              <p className="text-yellow-800 text-sm font-medium">
                💡 <strong>Lưu ý:</strong> Chatbot hiện đã được tích hợp toàn cục và sẽ xuất hiện trên tất cả các trang của ứng dụng!
              </p>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
};

export default ChatbotDemoPage;
