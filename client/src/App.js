// ChatBox.js
import React, { useState, useEffect } from 'react';
import './ChatBox.css';

const StockPrice = ({ ticker }) => {
  const [stockData, setStockData] = useState(null);
  const formatLargeNumber = (number) => {
    if (number >= 10 ** 12) {
      return (number / 10 ** 12).toFixed(2) + "T";
    } else if (number >= 10 ** 9) {
      return (number / (10 ** 9)).toFixed(2) + "B";
    } else if (number >= (10 ** 6)) {
      return (number / (10 ** 6)).toFixed(2) + "M";
    } else if (number >= (10 ** 3)) {
      return (number / (10 ** 3)).toFixed(2) + "K";
    }
    return number;

  }
  const fetchStockData = async (ticker) => {
    // Replace this with your actual function to fetch the stock data.
    const response = await fetch(`https://financialmodelingprep.com/api/v3/quote/${ticker}?apikey=${process.env.REACT_APP_FMP_API_KEY}`);
    const data = await response.json();
    if (typeof data[0] === "undefined") {
      return undefined;
    }
    return {
      ticker: ticker,
      companyName: data[0].name,
      price: data[0].price,
      marketCap: formatLargeNumber(data[0].marketCap)
    };
  };

  useEffect(() => {
    fetchStockData(ticker).then(setStockData);
  }, [ticker]);

  if (stockData === null) {
    return <div className="stock-price">Loading...</div>;
  }
  if (stockData === undefined) {
    <div className="stock-price">
      <h1 className="stock-price__ticker">Ticker not found.</h1>
    </div>
  } else {
    return (
      <div className="stock-price">
        <h1 className="stock-price__ticker">{stockData.ticker.toUpperCase()}</h1>
        <h2 className="stock-price__company">{stockData.companyName}</h2>
        <p className="stock-price__price">Current Price: ${stockData.price.toFixed(2)}</p>
        <p className="stock-price__price">Market Cap: ${stockData.marketCap}</p>
        <p className="stock-price__date">Date: {new Date().toLocaleDateString()}</p>
      </div>
    );
  }
  

};

const ChatBox = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [ticker, setTicker] = useState('');
  const [tickerSubmit, setTickerSubmit] = useState('');
  const [isBotTyping, setIsBotTyping] = useState(false);

  const makePos = (num) => {
    if (num < 0) return 0;
    return num;
  }
  const historyToString = () => {
    let string = "";
    for (let i = makePos(messages.length - 6) ; i < messages.length; i++){
      string += (messages[i].sender === "bot" ? "A: " : "Q: ") + messages[i].text + "\n";
    }
    return string;
  }
  const sendMessage = async (event) => {
    event.preventDefault();
    const newMessage = { text: input, sender: 'user' };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    setInput('');
    console.log(messages);
    setIsBotTyping(true);
    const response = await fetch(`http://localhost:9090/api/getMessage`, {
      method: "POST",
      body: JSON.stringify({ question: newMessage.text, history: historyToString(), train: false }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    setIsBotTyping(false);
    const answer = await response.text();
    console.log(answer);
    setMessages((prevMessages) => [...prevMessages, { text: answer, sender: 'bot' }]);
    // Here you would typically send the message to the chatbot and handle its response.
  }



  const handleTickerSubmit = async (event) => {
    event.preventDefault();
    setTickerSubmit(ticker);
    const response = await fetch(`http://localhost:9090/api/trainData/${ticker}`, {
      method: "POST",
      body: JSON.stringify({ question: "", train: true }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    const message = await response.text();
    if (message === "Ticker not recognized.") {
      alert("ticker not recognized.")
    }
  }

  return (
    <div className="all">
      <div className='chatbox'>
        <div className='chatbox__input'>
          <form>
          <input
            className='ticker__input'
            value={ticker}
            onChange={event => setTicker(event.target.value)}
            placeholder="Enter Ticker..."
          />
          <button type="submit"onClick={handleTickerSubmit}>Submit</button>
          </form>
          
        </div>
        <div className='chatbox__messages'>
        {messages.map((message, index) => (
            <p key={index} className={`chatbox__message ${message.sender}`}>{message.text}</p>
        ))}
        {isBotTyping && <div className="chatbox__message bot typing-indicator"><span>.</span><span>.</span><span>.</span></div>}
    </div>
        <form className='chatbox__input'>
          <input value={input} onChange={event => setInput(event.target.value)} placeholder="Type your message..." />
          <button type='submit' onClick={sendMessage}>Send</button>
        </form>
      </div>
      <StockPrice ticker={tickerSubmit}></StockPrice>
    </div>


  )
}

export default ChatBox;
