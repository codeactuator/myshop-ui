import React, { createContext, useState, useContext } from 'react';
import './MessageContext.css';

const MessageContext = createContext();

export const useMessage = () => useContext(MessageContext);

export const MessageProvider = ({ children }) => {
  const [messageConfig, setMessageConfig] = useState({
    isVisible: false,
    title: '',
    message: '',
    onConfirm: null
  });

  const showMessage = (title, message, onConfirm = null) => {
    setMessageConfig({ isVisible: true, title, message, onConfirm });
  };

  const hideMessage = () => {
    if (messageConfig.onConfirm) messageConfig.onConfirm();
    setMessageConfig({ ...messageConfig, isVisible: false, onConfirm: null });
  };

  return (
    <MessageContext.Provider value={{ showMessage }}>
      {children}
      {messageConfig.isVisible && (
        <div className="message-modal-overlay">
          <div className="message-modal-content">
            <h3 className="message-modal-title">{messageConfig.title}</h3>
            <p className="message-modal-text">{messageConfig.message}</p>
            <button className="message-modal-button" onClick={hideMessage}>
              OK
            </button>
          </div>
        </div>
      )}
    </MessageContext.Provider>
  );
};