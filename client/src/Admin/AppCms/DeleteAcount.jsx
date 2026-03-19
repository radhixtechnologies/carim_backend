import React, { useState } from 'react';

const DeleteAccount = () => {
    const [showPopup, setShowPopup] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        reason: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [requestStatus, setRequestStatus] = useState({ show: false, message: '' });

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [id]: value
        }));
    };

    const handleDeleteClick = () => {
        setShowPopup(true);
    };

    const handleClosePopup = () => {
        setShowPopup(false);
        setRequestStatus({ show: false, message: '' });
        setFormData({ username: '', email: '', reason: '' });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setRequestStatus({ show: false, message: '' });

        try {
            // Simulated response with dummy data
            const response = {
                json: async () => ({
                    status: 'ok',
                    code: 200,
                    data: {
                        message: 'Dummy response',
                        items: [
                            { id: 1, name: 'Item One' },
                            { id: 2, name: 'Item Two' }
                        ]
                    }
                })
            };

            const result = await response.json();

            setIsLoading(false);

            if (result.status === 'ok') {
                setRequestStatus({
                    show: true,
                    message: 'Request sent successfully. Admin will contact you soon.'
                });
            } else {
                setRequestStatus({
                    show: true,
                    message: 'Failed to send request: ' + (result.message || 'Unknown error')
                });
            }

            // Close the popup after 3 seconds
            setTimeout(() => {
                handleClosePopup();
            }, 3000);

        } catch (error) {
            setIsLoading(false);
            setRequestStatus({
                show: true,
                message: 'An error occurred. Please try again later.'
            });

            setTimeout(() => {
                handleClosePopup();
            }, 3000);
        }
    };

    const styles = {
        header: {
            background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
            color: 'white',
            padding: '30px 20px',
            textAlign: 'center',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(46, 204, 113, 0.3)'
        },
        logo: {
            height: '60px',
            width: 'auto',
            position: 'absolute',
            left: '30px',
            top: '50%',
            transform: 'translateY(-50%)',
            borderRadius: '10px',
            boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
        },
        title: {
            margin: 0,
            fontSize: '2.2rem',
            fontWeight: '600',
            textShadow: '2px 2px 4px rgba(0,0,0,0.2)'
        },
        container: {
            maxWidth: '600px',
            margin: '50px auto',
            padding: '40px',
            backgroundColor: 'white',
            borderRadius: '20px',
            boxShadow: '0 10px 40px rgba(46, 204, 113, 0.15)',
            minHeight: '350px',
            textAlign: 'center',
            animation: 'slideIn 0.5s ease'
        },
        description: {
            marginBottom: '30px',
            color: '#2c3e50',
            lineHeight: '1.8',
            fontSize: '1.1rem'
        },
        deleteButton: {
            background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
            color: 'white',
            border: 'none',
            padding: '15px 40px',
            borderRadius: '50px',
            cursor: 'pointer',
            fontSize: '1.1rem',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            boxShadow: '0 4px 15px rgba(46, 204, 113, 0.4)',
            outline: 'none'
        },
        popup: {
            display: 'none',
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(46, 204, 113, 0.2)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 999,
            backdropFilter: 'blur(5px)',
            animation: 'fadeIn 0.3s ease'
        },
        popupContent: {
            backgroundColor: '#fff',
            padding: '40px',
            borderRadius: '20px',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(46, 204, 113, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            maxWidth: '90%',
            width: '500px',
            animation: 'scaleIn 0.3s ease',
            border: '2px solid #2ecc71'
        },
        popupTitle: {
            fontSize: '28px',
            marginBottom: '30px',
            background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: '700'
        },
        form: {
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            alignItems: 'center',
            width: '100%'
        },
        input: {
            padding: '14px 20px',
            border: '2px solid #d5f5e3',
            borderRadius: '12px',
            width: '100%',
            fontSize: '1rem',
            transition: 'all 0.3s ease',
            outline: 'none',
            backgroundColor: '#f0fff4'
        },
        textarea: {
            padding: '14px 20px',
            border: '2px solid #d5f5e3',
            borderRadius: '12px',
            width: '100%',
            fontSize: '1rem',
            transition: 'all 0.3s ease',
            outline: 'none',
            backgroundColor: '#f0fff4',
            resize: 'vertical',
            minHeight: '120px',
            fontFamily: 'inherit'
        },
        submitButton: {
            background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
            color: '#fff',
            border: 'none',
            padding: '14px 40px',
            borderRadius: '50px',
            cursor: 'pointer',
            fontSize: '1.1rem',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            width: 'auto',
            minWidth: '150px',
            boxShadow: '0 4px 15px rgba(46, 204, 113, 0.4)',
            marginTop: '10px'
        },
        loading: {
            marginTop: '20px',
            fontWeight: '600',
            padding: '12px 20px',
            borderRadius: '10px',
            width: '100%',
            color: '#27ae60',
            backgroundColor: '#e8f8f5',
            border: '2px dashed #2ecc71',
            animation: 'pulse 1.5s infinite'
        },
        requestSent: {
            marginTop: '20px',
            fontWeight: '600',
            padding: '12px 20px',
            borderRadius: '10px',
            width: '100%',
            color: '#27ae60',
            backgroundColor: '#e8f8f5',
            border: '2px solid #2ecc71',
            boxShadow: '0 2px 10px rgba(46, 204, 113, 0.2)'
        },
        footer: {
            background: 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)',
            color: 'white',
            textAlign: 'center',
            padding: '20px 0',
            marginTop: '50px',
            position: 'fixed',
            bottom: 0,
            width: '100%',
            boxShadow: '0 -4px 20px rgba(46, 204, 113, 0.3)'
        }
    };

    return (
        <>
            <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes pulse {
          0% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
          100% {
            opacity: 1;
          }
        }

        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          background: linear-gradient(135deg, #f0fff4 0%, #d5f5e3 100%);
          min-height: 100vh;
        }

        .popup button[type="submit"]:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(46, 204, 113, 0.5);
        }

        .popup button[type="submit"]:disabled {
          background: linear-gradient(135deg, #a0aec0 0%, #718096 100%);
          cursor: not-allowed;
          opacity: 0.7;
          transform: none;
        }

        .popup button[type="submit"].loading {
          background: linear-gradient(135deg, #a0aec0 0%, #718096 100%);
          cursor: not-allowed;
          pointer-events: none;
        }

        #deleteButton:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 25px rgba(46, 204, 113, 0.5);
        }

        #deleteButton:active {
          transform: translateY(1px);
        }

        .popup input[type="text"]:focus,
        .popup input[type="email"]:focus,
        .popup textarea:focus {
          border-color: #2ecc71 !important;
          box-shadow: 0 0 0 3px rgba(46, 204, 113, 0.1) !important;
          background-color: white !important;
        }

        @media (max-width: 768px) {
          header {
            padding: 20px !important;
          }
          
          header h1 {
            font-size: 1.5rem !important;
            margin-left: 50px !important;
          }

          header img {
            height: 40px !important;
            left: 15px !important;
          }

          .container {
            margin: 20px !important;
            padding: 25px !important;
          }
        }

        @media (max-width: 480px) {
          header {
            flex-direction: column;
            padding: 15px !important;
          }

          header img {
            position: static !important;
            transform: none !important;
            margin-bottom: 10px !important;
          }

          header h1 {
            margin-left: 0 !important;
            font-size: 1.2rem !important;
          }

          .popup-content {
            padding: 25px !important;
          }

          .popup h2 {
            font-size: 22px !important;
          }

          footer {
            position: relative;
            margin-top: 30px;
          }
        }
      `}</style>

            <header style={styles.header}>
                <img
                    src="/assets/images/carim1.png"
                    alt="App Logo"
                    style={styles.logo}
                />
                <h1 style={styles.title}>
                    Data Deletion Request
                </h1>
            </header>

            <div className="container" style={styles.container}>
                <p style={styles.description}>
                    If you wish to delete your account and associated data, please fill out the form below:
                </p>
                <button
                    id="deleteButton"
                    style={styles.deleteButton}
                    onClick={handleDeleteClick}
                >
                    Delete My Data
                </button>

                {showPopup && (
                    <div
                        className="popup"
                        style={{ ...styles.popup, display: 'flex' }}
                        onClick={handleClosePopup}
                    >
                        <div className="popup-content" style={styles.popupContent} onClick={e => e.stopPropagation()}>
                            <h2 style={styles.popupTitle}>Request Data Deletion</h2>
                            <form style={styles.form} onSubmit={handleSubmit}>
                                <input
                                    type="text"
                                    id="username"
                                    placeholder="Username"
                                    value={formData.username}
                                    onChange={handleInputChange}
                                    required
                                    disabled={isLoading}
                                    style={styles.input}
                                />
                                <input
                                    type="email"
                                    id="email"
                                    placeholder="Email Address"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                    disabled={isLoading}
                                    style={styles.input}
                                />
                                <textarea
                                    id="reason"
                                    placeholder="Reason for Account Deletion"
                                    value={formData.reason}
                                    onChange={handleInputChange}
                                    required
                                    disabled={isLoading}
                                    rows="4"
                                    style={styles.textarea}
                                />
                                <button
                                    type="submit"
                                    style={styles.submitButton}
                                    className={isLoading ? 'loading' : ''}
                                    disabled={isLoading}
                                >
                                    {isLoading ? 'Submitting...' : 'Submit'}
                                </button>
                            </form>
                            {isLoading && (
                                <div style={styles.loading}>
                                    Sending Request...
                                </div>
                            )}
                            {requestStatus.show && (
                                <div style={styles.requestSent}>
                                    {requestStatus.message}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <footer style={styles.footer}>
                <p style={{ margin: 0, fontSize: '0.95rem', opacity: 0.95 }}>
                    Copyright &copy; 2025 Carim, All rights reserved.
                </p>
            </footer>
        </>
    );
};

export default DeleteAccount;