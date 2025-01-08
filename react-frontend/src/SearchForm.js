import React, { useState, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { darcula } from "react-syntax-highlighter/dist/esm/styles/prism";
import "./styles.css";
// import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { solarizedlight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { dracula } from "react-syntax-highlighter/dist/esm/styles/hljs";
const SearchForm = () => {
    const [query, setQuery] = useState("");
    const [tag, setTag] = useState("");
    const [results, setResults] = useState([]);
    const [answers, setAnswers] = useState([]);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [history, setHistory] = useState([]);
    const [activeTab, setActiveTab] = useState("search");
    const [chatbotInput, setChatbotInput] = useState(""); // State for chatbot input
    const [chatbotResponse, setChatbotResponse] = useState(""); // State for chatbot response

    // Fetch history when switching to history tab
    useEffect(() => {
        const fetchHistory = async () => {
            if (activeTab === "history") {
                try {
                    const response = await axios.get("https://clarifai.onrender.com/history");
                    setHistory(response.data.history);
                } catch (error) {
                    console.error("Error fetching history:", error);
                    setError("Failed to fetch history.");
                }
            }
        };
        fetchHistory();
    }, [activeTab]);

    // Handle form submission for searching and Q&A functionality
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!query || query.length < 5) {
            setError("Query must be at least 5 characters long.");
            return;
        }

        setError("");
        setLoading(true);
        setResults([]);
        setAnswers([]);

        try {
            const response = await axios.post(
                "https://clarifai.onrender.com/",
                { query, tag },
                { headers: { "Content-Type": "application/json" } }
            );

            setResults(response.data.results); // Search results
            setAnswers(response.data.answers_list); // Answers from Q&A model
        } catch (error) {
            console.error(error);
            setError("An error occurred while fetching data.");
        } finally {
            setLoading(false);
        }
    };

    // Handle form submission for chatbot
    const handleChatbotSubmit = async (event) => {
        event.preventDefault();
        setError(""); // Reset error
        setChatbotResponse(""); // Reset response

        try {
            const res = await axios.post(
                "https://clarifai.onrender.com/qa",
                { query: chatbotInput },
                {
                    headers: {
                        "Content-Type": "application/json",
                    },
                }
            );

            if (res.status === 200) {
                console.log(res.data.response);
                setChatbotResponse(res.data.response);
                 // Update with server's response
            } else {
                setError(res.data.error || "An unknown error occurred.");
            }
        } catch (err) {
            setError("Failed to fetch response from server.");
        }
    };

    return (
        <div className="search-form-container">
            <div className="menu-section">
                <h2 className="menu-title">Menu</h2>
                <button
                    onClick={() => setActiveTab("search")}
                    className={`menu-button ${activeTab === "search" ? "active-tab" : ""}`}
                >
                    Search
                </button>
                <button
                    onClick={() => setActiveTab("history")}
                    className={`menu-button ${activeTab === "history" ? "active-tab" : ""}`}
                >
                    History
                </button>
            </div>

            <div className="content-section">
                {activeTab === "search" && (
                    <div className="search-tab">
                        <h1 className="title">ClarifAI</h1>
                        <form onSubmit={handleSubmit} className="search-form">
                            <div className="form-group">
                                <label htmlFor="query">Query: </label>
                                <input
                                    id="query"
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    className="input-field"
                                    placeholder="Enter your query"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="tag">Tag: </label>
                                <input
                                    id="tag"
                                    type="text"
                                    value={tag}
                                    onChange={(e) => setTag(e.target.value)}
                                    className="input-field"
                                    placeholder="Enter a tag"
                                />
                            </div>
                            <button type="submit" disabled={loading} className="search-button">
                                {loading ? "Searching..." : <strong>Search</strong>}
                            </button>
                        </form>
                        <br />
                        <br />

                        {error && <p className="error-message">{error}</p>}

                        {answers.length > 0 && (
                            <div className="answers">
                                <ul>
                                    {answers.map((answer, index) => (
                                        <li key={index} className="answer-box">
                                            <br></br>
                                            <h2>LLM Response:</h2>
                                            <div className="samba-response-box">
                                            <ReactMarkdown
                                                components={{
                                                    h3({ children, ...props }) {
                                                        return (
                                                            <>
                                                                <h3 {...props}>{children}</h3>
                                                                <p style={{ margin: "0" }}>&nbsp;</p>
                                                            </>
                                                        );
                                                    },
                                                    p({ children, ...props }) {
                                                        return (
                                                            <p
                                                                style={{ marginBottom: "16px", paddingLeft: "20px" }}
                                                                {...props}
                                                            >
                                                                {children}
                                                            </p>
                                                        );
                                                    },
                                                    ul({ children, ...props }) {
                                                        return (
                                                            <ul
                                                                style={{ paddingLeft: "20px", marginBottom: "16px" }}
                                                                {...props}
                                                            >
                                                                {children}
                                                            </ul>
                                                        );
                                                    },
                                                    ol({ children, ...props }) {
                                                        return (
                                                            <ol
                                                                style={{
                                                                    paddingLeft: "20px",
                                                                    marginBottom: "8px",
                                                                    listStylePosition: "inside",
                                                                }}
                                                                {...props}
                                                            >
                                                                {children}
                                                            </ol>
                                                        );
                                                    },
                                                    li({ children, ...props }) {
                                                        return (
                                                            <li
                                                                style={{
                                                                    paddingLeft: "20px",
                                                                    paddingTop: "10px",
                                                                    paddingBottom: "10px",
                                                                    marginBottom: "8px",
                                                                }}
                                                                {...props}
                                                            >
                                                                {children}
                                                            </li>
                                                        );
                                                    },
                                                    code({ node, inline, className, children, ...props }) {
                                                        const match = /language-(\w+)/.exec(className || "");
                                                        return !inline && match ? (
                                                            <SyntaxHighlighter style={darcula} language={match[1]} PreTag="div" {...props}>
                                                                {String(children).replace(/\n$/, "")}
                                                            </SyntaxHighlighter>
                                                        ) : (
                                                            <code className={className} {...props}>
                                                                {children}
                                                            </code>
                                                        );
                                                    },
                                                }}
                                            >
                                                {answer.samba_response.replace(/\t/g, '')}
                                            </ReactMarkdown>

                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {results.length > 0 && (
                            <div className="results">
                                <h2>Search Results:</h2> <br />
                                <ul>
                                    {results.map((result, index) => (
                                        <li key={index}>
                                            <a href={result.link} target="_blank" rel="noopener noreferrer">
                                                {result.link}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <br />
                        <div className="chatbot-section">
                            <h1>Chat with the Bot</h1>
                            <form onSubmit={handleChatbotSubmit}>
                                <input
                                    type="text"
                                    value={chatbotInput}
                                    onChange={(e) => setChatbotInput(e.target.value)}
                                    placeholder="Ask me anything..."
                                    className="chatbot-input"
                                />
                                <button type="submit" className="search-button">
                                    Ask
                                </button>
                            </form>

                            {/* import ReactMarkdown from 'react-markdown'; */}


{/* // Inside the component: */}
   
                            {chatbotResponse && (
                            <div className="samba-response-box">
                                <h3>Bot's Answer:</h3>
                                <br />
                                {typeof chatbotResponse === "string" ? (
                                <ReactMarkdown 
                                    children={chatbotResponse} 
                                    components={{
                                        h3({ children, ...props }) {
                                            return (
                                                <>
                                                    <h3 {...props}>{children}</h3>
                                                    <p style={{ margin: "0" }}>&nbsp;</p>
                                                </>
                                            );
                                        },
                                        p({ children, ...props }) {
                                            return (
                                                <p
                                                    style={{ marginBottom: "16px", paddingLeft: "20px" }}
                                                    {...props}
                                                >
                                                    {children}
                                                </p>
                                            );
                                        },
                                        ul({ children, ...props }) {
                                            return (
                                                <ul
                                                    style={{ paddingLeft: "20px", marginBottom: "16px" }}
                                                    {...props}
                                                >
                                                    {children}
                                                </ul>
                                            );
                                        },
                                        ol({ children, ...props }) {
                                            return (
                                                <ol
                                                    style={{
                                                        paddingLeft: "20px",
                                                        marginBottom: "8px",
                                                        listStylePosition: "inside",
                                                    }}
                                                    {...props}
                                                >
                                                    {children}
                                                </ol>
                                            );
                                        },
                                        li({ children, ...props }) {
                                            return (
                                                <li
                                                    style={{
                                                        paddingLeft: "20px",
                                                        paddingTop: "10px",
                                                        paddingBottom: "10px",
                                                        marginBottom: "8px",
                                                    }}
                                                    {...props}
                                                >
                                                    {children}
                                                </li>
                                            );
                                        },
                                    code({ node, inline, className, children, ...props }) {
                                        const match = /language-(\w+)/.exec(className || "");
                                        return !inline ? (
                                        match ? (
                                            <SyntaxHighlighter style={dracula} language={match[1]} PreTag="div" {...props}>
                                            {String(children).replace(/\n$/, '')}
                                            </SyntaxHighlighter>
                                        ) : (
                                            <code className={className} {...props}>
                                            {children}
                                            </code>
                                            
                                        )
                                        ) : (
                                        <code className={className} {...props}>
                                            {children}
                                        </code>
                                        
                                        );

                                    }
                                    
                                    }}
                                    
                                />
                                ) : (
                                <ReactMarkdown 
                                    children={chatbotResponse.response} 
                                    components={{
                                    code({ node, inline, className, children, ...props }) {
                                        return !inline ? (
                                        <SyntaxHighlighter style={solarizedlight} language={className?.replace('language-', '')} {...props}>
                                            {String(children).replace(/\n$/, '')}
                                        </SyntaxHighlighter>
                                        ) : (
                                        <code className={className} {...props}>
                                            {children}
                                        </code>
                                        );
                                    }
                                    }}
                                />
                                )}
                            </div>
                            )}


                        </div>
                    </div>
                )}

                {activeTab === "history" && (
                    <div className="history-tab">
                        <h2>Search History</h2>
                        {history.length > 0 ? (
                            <ul className="history-list">
                                {history.map((entry, index) => (
                                    <li key={index}>
                                        <br />
                                        <strong>Error Message:</strong> {entry.error_message} <br />
                                        <br />
                                        <strong>LLM Explanation:</strong><br /><br /> <ReactMarkdown
                                            components={{
                                                h3({ children, ...props }) {
                                                    return (
                                                        <>
                                                            <h3 {...props}>{children}</h3>
                                                            <p style={{ margin: "0" }}>&nbsp;</p>
                                                        </>
                                                    );
                                                },
                                                p({ children, ...props }) {
                                                    return (
                                                        <p
                                                            style={{ marginBottom: "16px", paddingLeft: "20px" }}
                                                            {...props}
                                                        >
                                                            {children}
                                                        </p>
                                                    );
                                                },
                                                ul({ children, ...props }) {
                                                    return (
                                                        <ul
                                                            style={{ paddingLeft: "20px", marginBottom: "16px" }}
                                                            {...props}
                                                        >
                                                            {children}
                                                        </ul>
                                                    );
                                                },
                                                ol({ children, ...props }) {
                                                    return (
                                                        <ol
                                                            style={{
                                                                paddingLeft: "20px",
                                                                marginBottom: "8px",
                                                                listStylePosition: "inside",
                                                            }}
                                                            {...props}
                                                        >
                                                            {children}
                                                        </ol>
                                                    );
                                                },
                                                li({ children, ...props }) {
                                                    return (
                                                        <li
                                                            style={{
                                                                paddingLeft: "20px",
                                                                paddingTop: "10px",
                                                                paddingBottom: "10px",
                                                                marginBottom: "8px",
                                                            }}
                                                            {...props}
                                                        >
                                                            {children}
                                                        </li>
                                                    );
                                                },
                                                code({ node, inline, className, children, ...props }) {
                                                    const match = /language-(\w+)/.exec(className || "");
                                                    return !inline && match ? (
                                                        <SyntaxHighlighter style={darcula} language={match[1]} PreTag="div" {...props}>
                                                            {String(children).replace(/\n$/, "")}
                                                        </SyntaxHighlighter>
                                                    ) : (
                                                        <code className={className} {...props}>
                                                            {children}
                                                        </code>
                                                    );
                                                },
                                            }}
                                        >
                                            {entry.llm_explanation}
                                        </ReactMarkdown> <br />
                                        <br />
                                        <strong>Links:</strong>
                                        <br />
                                        <br />
                                        <ul>
                                            {Array.isArray(entry.links) ? (
                                                entry.links.map((link, linkIndex) => (
                                                    <li key={linkIndex}>
                                                        <a href={link.link} target="_blank" rel="noopener noreferrer">
                                                            {link.title || link.link}
                                                        </a>
                                                    </li>
                                                ))
                                            ) : (
                                                <p>No links available.</p>
                                            )}
                                        </ul>
                                        <br />
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No history available.</p>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchForm;