import React, { Component, createRef } from "react";

import { v4 as uuidv4 } from "uuid";

import userImage from "../../assets/images/profile-pic.png";
import sendIcon from "../../assets/images/send.png";
import chatIcon from "../../assets/images/gen-ai-logo.svg";
import backarrow from "../../assets/images/back_arrow.svg";
import thumbsUpIcon from "../../assets/images/thumbs-up.svg";
import thumbsDownIcon from "../../assets/images/thumbs-down.svg";
import { externalChat, feedbackChat } from "../../server/server";

class Chatbot extends Component {
  constructor(props) {
    super(props);
    this.state = {
      messages: [],
      input: "",
      isTyping: false,
      isChatbotVisible: false,
      isAnimationActive: false,
      isHomeView: true,
      predefinedQuestions: [
        "How to save energy?",
        "How can I pay my bill?",
        "Do you accept check payment?",
      ],
      initialMessageAdded: false,
      showPredefinedQuestions: false,
      showSecondInitialMessage: false,
      inactivityTimer: null,
      reminderTimer: null,
      endChatTimer: null,
      isReminderSent: false,
      thumbsUp: false,
      thumbsDown: false,
      feedbackStatus: {},
      showMessage:''
    };
    this.latestUserMessageRef = createRef();
    this.messageRefs = [];
    this.messagesEndRef = createRef();
  }

  componentDidUpdate(prevProps, prevState) {
    if (this.state.isChatbotVisible && !this.state.initialMessageAdded) {
      if (
        prevState.isChatbotVisible !== this.state.isChatbotVisible ||
        prevState.initialMessageAdded !== this.state.initialMessageAdded
      ) {
        this.setState({ isTyping: true }, () => {
          setTimeout(() => {
            this.setState(
              (prevState) => ({
                messages: [
                  {
                    text: `Welcome, I'm POWERCONNECT. AI Assistant. How can I assist you today?`,
                    isUser: false,
                    time: new Date().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                  },
                  ...prevState.messages,
                ],
                initialMessageAdded: true,
                isTyping: false,
              }),
              () => {
                setTimeout(() => {
                  this.setState({ isTyping: true }, () => {
                    setTimeout(() => {
                      this.setState(
                        {
                          showPredefinedQuestions: true,
                          isTyping: false,
                        },
                        this.scrollToTop
                      );
                    }, 1000); // Delay before sending the second message
                  });
                }, 1000); // Delay before showing the second message
              }
            );
          }, 1000); // Delay before typing the first message
        });
      }
    }

    if (prevState.messages !== this.state.messages) {
      this.scrollToTop();
    }
  }

  componentDidMount() {
    localStorage.clear("sessionId", { path: "/" });
  }

  componentWillUnmount() {
    this.clearTimers();
  }

  resetInactivityTimers = () => {
    this.clearTimers();

    this.setState({
      inactivityTimer: setTimeout(() => {
        this.handleInactivityReminder();
      }, 3 * 60 * 1000),
    });
  };

  clearTimers = () => {
    const { inactivityTimer, reminderTimer, endChatTimer } = this.state;
    if (inactivityTimer) clearTimeout(inactivityTimer);
    if (reminderTimer) clearTimeout(reminderTimer);
    if (endChatTimer) clearTimeout(endChatTimer);
  };

  handleInactivityReminder = () => {
    if (this.state.isReminderSent) return;

    this.setState({ isReminderSent: true }, () => {
      this.setState(
        (prevState) => ({
          messages: [
            ...prevState.messages,
            {
              text: "Hello, I'm still here. May I assist you?",
              isUser: false,
              time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            },
          ],
          reminderTimer: setTimeout(() => {
            this.setState(
              (prevState) => ({
                messages: [
                  ...prevState.messages,
                  {
                    text: "Thank you very much for contacting us. Have a great day!",
                    isUser: false,
                    time: new Date().toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    }),
                  },
                ],
              }),
              () => {
                this.endChatAfterThankYou();
              }
            );
          }, 1 * 60 * 1000),
        }),
        () => {
          this.resetInactivityTimers();
        }
      );
    });
  };

  endChatAfterThankYou = () => {
    this.setState({
      endChatTimer: setTimeout(() => {
        this.setState({
          isHomeView: true,
          messages: [],
          input: "",
          isTyping: false,
          initialMessageAdded: false,
          showPredefinedQuestions: false,
          isAnimationActive: false,
          reminderSent: false,
        });
      }, 3 * 1000),
    });
  };

  handleUserActivity = () => {
    this.resetInactivityTimers();
  };

  scrollToTop = () => {
    if (this.messagesEndRef.current) {
      this.messagesEndRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  toggleChatbot = () => {
    this.setState({ isChatbotVisible: true, isAnimationActive: true });
  };

  handleGetStarted = () => {
    let sessionId = localStorage.getItem("sessionId");
    if (!sessionId) {
      sessionId = uuidv4();
      localStorage.setItem("sessionId",sessionId);
    }
    this.setState({ isHomeView: false }, this.resetInactivityTimers);
  };

  handleSend = async (message = null) => {
    const input = message || this.state.input;
    if (typeof input === "string" && input.trim()) {
      this.latestUserMessageRef.current = input;
      const requestId = uuidv4();
      this.setState((prevState) => ({
        messages: [
          ...prevState.messages,
          {
            text: input,
            isUser: true,
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            requestId,
          },
        ],
        input: "",
        isTyping: true,
        showPredefinedQuestions: false,
      }));
      this.handleUserActivity();

      try {
        const sessionId = localStorage.getItem("sessionId");
        const response = await externalChat({
          prompt: input,
          sessionId,
          requestId,
        });
        let botResponse =
          response.content || "Sorry, I don't understand that question.";

        const source = response.source_url;
        function formatHeading(url) {
          const segment = url.substring(url.lastIndexOf("/") + 1);
          return segment
            .replace(/-/g, " ")
            .replace(/\b\w/g, (char) => char.toUpperCase());
        }
        const urls = response.source_url;
        const Heading = urls.map(formatHeading);

        this.setState((prevState) => ({
          messages: [
            ...prevState.messages,
            {
              text: botResponse,
              isUser: false,
              time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
              source: source || null,
              metadata: Heading.map((head) => ({ head })),
              requestId,
            },
          ],
          isTyping: false,
        }));
      } catch (error) {
        this.setState((prevState) => ({
          messages: [
            ...prevState.messages,
            {
              text: "Sorry, something went wrong.",
              isUser: false,
              time: new Date().toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              }),
            },
          ],
          isTyping: false,
        }));
      }
    }
  };

  handleInputChange = (e) => {
    const value = e.target.value;
    this.setState({ input: value });
  };

  handleHomeClick = () => {
    this.setState({ isHomeView: true });
  };

  handleClose = () => {
    this.clearTimers();
    this.setState({ isChatbotVisible: false });
    localStorage.clear();
    this.setState({
      messages: [],
      input: "",
      isTyping: false,
      isHomeView: true,
      initialMessageAdded: false,
      showPredefinedQuestions: false,
      showSecondInitialMessage: false,
    });
  };

  handleEndChat = () => {
    this.setState(
      (prevState) => ({
        messages: [
          ...prevState.messages,
          {
            text: "Thank you for connecting with us!",
            isUser: false,
            time: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ],
      }),
      () => {
        // Delay before moving to the home view
        setTimeout(() => {
          localStorage.clear();

          this.setState({
            isHomeView: true,
            messages: [],
            input: "",
            isTyping: false,
            initialMessageAdded: false,
            showPredefinedQuestions: false,
            isAnimationActive: false,
            reminderSent: false,
          });

          this.clearTimers();
        }, 2000); // 2-second delay before moving to the home view
      }
    );
  };

  handlePredefinedQuestionClick = (question) => {
    this.handleSend(question);
    this.setState({ showPredefinedQuestions: false });
  };

  handleFeedback = async (feedback, requestId, thumbsUpSign) => {
    try {
      const sessionId = localStorage.getItem("sessionId");
      await feedbackChat({ requestId, sessionId, feedback, thumbsUpSign });
    } catch (error) {
      console.error("Error sending feedback:", error);
    }
  };

  handleThumbsUp = (messageIndex) => {
    const { messages, feedbackStatus, thumbsUp } = this.state;
    const message = messages[messageIndex];
    const newStatus = { ...feedbackStatus };

    // Update feedback status for the specific message
    newStatus[message.requestId] = {
      thumbsUp: true,
      thumbsDown: false,
    };
    this.setState({showMessage: messageIndex})
    setTimeout(()=>{
      this.setState({showMessage:null})
    },2000)

    this.setState({ feedbackStatus: newStatus }, () =>
      this.handleFeedback("", message.requestId, !thumbsUp)
    );
  };

  handleThumbsDown = (messageIndex) => {
    const { messages, feedbackStatus, thumbsUp } = this.state;
    const message = messages[messageIndex];
    const newStatus = { ...feedbackStatus };

    // Update feedback status for the specific message
    newStatus[message.requestId] = {
      thumbsUp: false,
      thumbsDown: true,
    };
    this.setState({showMessage: messageIndex})
    setTimeout(()=>{
      this.setState({showMessage:null})
    },2000)

    this.setState({ feedbackStatus: newStatus }, () =>
      this.handleFeedback("", message.requestId, thumbsUp)
    );
  };

  render() {
    const {
      messages,
      input,
      isTyping,
      isChatbotVisible,
      isAnimationActive,
      isHomeView,
      predefinedQuestions,
      showPredefinedQuestions,
      feedbackStatus,
      showMessage,
    } = this.state;

    return (
      <>
        {this.state.isChatbotVisible ? (
          <button className="toggleCancel" onClick={this.handleClose}>
            &times;
          </button>
        ) : (
          <button className="toggleButton" onClick={this.toggleChatbot}>
            <img src={chatIcon} alt="Chatbot Icon" />
          </button>
        )}
        {isChatbotVisible && (
          <div
            className={`chatContainer ${
              isAnimationActive ? "animation-active" : ""
            }`}
          >
            {isHomeView ? (
              <>
                <div className="homeContent">
                  <div className="header_image">
                    <img
                      src={chatIcon}
                      alt="Chatbot Icon"
                      className="homeIcon"
                    />
                    <div className="chatName">POWERCONNECT. AI</div>
                  </div>
                  <div className="header_welcome">
                    <h3>
                      Hi there! <span className="wave">👋</span> <br /> How can
                      we help?
                    </h3>
                  </div>
                  <div className="getStart">
                    <div onClick={this.handleGetStarted}>
                      <div>Get Started</div>
                    </div>
                  </div>
                </div>
                <div className={`Chat_footer`}></div>
              </>
            ) : (
              <>
                <div className="chat_header">
                  <button className="backButton" onClick={this.handleHomeClick}>
                    <img src={backarrow} alt="arrow" />
                  </button>
                  <img src={chatIcon} alt="Chatbot Logo" className="logo" />
                  <div className="chatName">POWERCONNECT. AI</div>
                  <button
                    className="Chat_closeButton"
                    onClick={this.handleClose}
                  >
                    &times;
                  </button>
                </div>

                <div className="messageList">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      id={`message-${index}`}
                      ref={(el) => (this.messageRefs[index] = el)}
                      className={`messageContainer ${
                        message.isUser ? "user" : "bot"
                      }`}
                    >
                      <div>
                        <img
                          src={message.isUser ? userImage : chatIcon}
                          alt={message.isUser ? "User" : "Chatbot"}
                          className="messageImage"
                        />
                      </div>
                      <div className="messageContent">
                        <div
                          ref={this.messagesStartRef}
                          className={`messageBubble ${
                            message.isUser ? "user" : "bot"
                          }`}
                        >
                          {Array.isArray(message.text) ? (
                            <ul>
                              {message.text.map((item, idx) => (
                                <li key={idx}>{item}</li>
                              ))}
                            </ul>
                          ) : (
                            <p>{message.text}</p>
                          )}
                          {message.source && Array.isArray(message.source) && (
                            <div className="messageSource">
                              {message.metadata.length > 0 && (
                                <strong>Helpful links: </strong>
                              )}
                              {message.source.map((url, index) => (
                                <div key={index}>
                                  <>
                                    <div id="msgList" className="messageList">
                                      <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        {message.metadata &&
                                          message.metadata[index] &&
                                          message.metadata[index].head}
                                      </a>
                                    </div>
                                  </>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        {showMessage === index && (
                              <div className="thankYouMessage">
                                Thanks for Your Feedback!
                              </div>
                            )}
                        {!message.isUser && message.source && (
                          <div className="feedbackButtons">
                            <button
                              onClick={() => this.handleThumbsUp(index)}
                              className={`thumb-button ${
                                feedbackStatus[message.requestId]?.thumbsUp
                                  ? "active"
                                  : "disabled"
                              }`}
                            >
                              <img src={thumbsUpIcon} alt="Thumbs Up" />
                            </button>
                            <button
                              onClick={() => this.handleThumbsDown(index)}
                              className={`thumb-button thumbs-down ${
                                feedbackStatus[message.requestId]?.thumbsDown
                                  ? "active"
                                  : "disabled"
                              }`}
                            >
                              <img src={thumbsDownIcon} alt="Thumbs Down" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {showPredefinedQuestions && (
                    <div className="predefinedQuestions">
                      {predefinedQuestions.map((question, index) => (
                        <button
                          key={index}
                          className="predefinedButton"
                          onClick={() =>
                            this.handlePredefinedQuestionClick(question)
                          }
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  )}
                  <div ref={this.messagesEndRef} />
                  {isTyping && (
                    <div className="typingIndicator">
                      <div className="dot dot1"></div>
                      <div className="dot dot2"></div>
                      <div className="dot dot3"></div>
                    </div>
                  )}
                </div>
                <div className="inputContainer">
                  <div className="inputWrapper">
                    <div className="inputFieldWrapper">
                      <input
                        type="text"
                        className="inputField"
                        placeholder="Ask me anything about Hydro Ottawa..."
                        value={input}
                        onChange={this.handleInputChange}
                        onKeyPress={(e) => {
                          if (e.key === "Enter") {
                            this.handleSend();
                          }
                        }}
                      />
                      <button
                        className="sendButton"
                        onClick={() => this.handleSend()}
                      >
                        <img src={sendIcon} alt="Send" className="sendIcon" />
                      </button>
                    </div>
                  </div>
                  <a className="end_chat" onClick={this.handleEndChat}>
                    End Chat
                  </a>
                </div>
              </>
            )}
          </div>
        )}
      </>
    );
  }
}

export default Chatbot;
