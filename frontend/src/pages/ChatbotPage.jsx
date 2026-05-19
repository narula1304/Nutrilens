import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import { askChatbot } from '../services/api.jsx'; // Import the API function

export default function ChatbotPage() {
  const { user, token } = useAuth(); // Need token for API call
  const [messages, setMessages] = useState([
    // Initial greeting message from the bot
    { sender: 'bot', text: 'Hello! How can I help you with your nutrition today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Ref for scrolling to the bottom of the chat
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Scroll to bottom whenever messages change or loading state changes
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);


  const handleSendMessage = async (e) => {
    e.preventDefault(); // Prevent form submission page reload
    const userMessage = input.trim();
    if (!userMessage) return; // Don't send empty messages

    // Add user message to chat immediately
    setMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setInput(''); // Clear input field
    setIsLoading(true); // Show loading indicator
    setError('');

    // --- API Call ---
    try {
      if (!token) throw new Error("Authentication token not found.");

      // Call the askChatbot function from api.js
      const response = await askChatbot(token, userMessage);

      // Get the reply from the API response
      const botResponse = response.data.reply;

      // Add bot response to chat
      setMessages(prev => [...prev, { sender: 'bot', text: botResponse }]);

    } catch (err) {
      console.error("Chatbot request failed:", err);
      const errorMsg = "Sorry, I couldn't get a response. Please try again.";
      setError(errorMsg);
      // Add error message to chat
      setMessages(prev => [...prev, { sender: 'bot', text: errorMsg }]);
    } finally {
      setIsLoading(false); // Hide loading indicator
    }
    // --- End API Call ---
  };

  return (
    // Adjust height calculation: vh - header height (h-16 = 4rem) - page y-padding (py-8 * 2 = 4rem)
    <div className="max-w-3xl mx-auto flex flex-col h-[calc(100vh-4rem-4rem)]">
      <h2 className="text-3xl font-bold tracking-tight text-foreground-light dark:text-foreground-dark mb-6 text-center">
        AI Nutrition Assistant
      </h2>

      {/* --- Chat Messages Area --- */}
      {/* Added max-h-[...] to ensure overflow works correctly with flex-grow */}
      <div className="grow overflow-y-auto mb-4 p-4 border border-border-light dark:border-border-dark rounded-lg bg-card-light dark:bg-card-dark space-y-4 max-h-[calc(100%-6rem)]"> {/* Max height approx = container height - input area height */}
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[75%] p-3 rounded-lg shadow-sm ${ // Added shadow
                msg.sender === 'user'
                  ? 'bg-primary text-white' // User messages (text-white for better contrast)
                  : 'bg-gray-100 dark:bg-gray-700 text-foreground-light dark:text-foreground-dark' // Bot messages
              }`}
            >
              {/* Basic markdown link support (example) */}
              {msg.text.split(/(\[.*?\]\(.*?\))/g).map((part, i) => {
                 const match = part.match(/\[(.*?)\]\((.*?)\)/);
                 if (match) {
                     return <a key={i} href={match[2]} target="_blank" rel="noopener noreferrer" className="text-blue-500 underline hover:text-blue-700">{match[1]}</a>;
                 }
                 return part;
              })}
            </div>
          </div>
        ))}
         {/* Loading indicator */}
        {isLoading && (
            <div className="flex justify-start">
                <div className="p-3 rounded-lg bg-gray-200 dark:bg-gray-700 text-muted-light dark:text-muted-dark animate-pulse">
                    Thinking...
                </div>
            </div>
        )}
        {/* Empty div to scroll to */}
        <div ref={messagesEndRef} />
      </div>

      {/* --- Input Area --- */}
      {/* Added mt-auto to push input to bottom */}
      <form onSubmit={handleSendMessage} className="flex items-center gap-2 border-t border-border-light dark:border-border-dark pt-4 mt-auto">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your meals, nutrition, or goals..."
          className="grow rounded-lg border-border-light bg-white dark:bg-card-dark dark:border-border-dark dark:text-white dark:placeholder-muted-dark focus:border-primary focus:ring-primary"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white transition-all hover:bg-primary-dark shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed" // Changed text-black to text-white
        >
          Send
        </button>
      </form>
       {error && <p className="text-red-500 text-sm mt-2 text-center">{error}</p>}
    </div>
  );
}