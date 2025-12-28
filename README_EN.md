[English](./README_EN.md) | [简体中文](./README.md)

# TypeMaster ⌨️

A minimalist, modern typing speed test application integrated with AI content generation.

🔗 **Live Demo**: [https://type-master-2726.vercel.app/](https://type-master-2726.vercel.app/)

## ✨ Features

*   **AI-Powered Content**: Generates coherent English text based on AI models, saying goodbye to boring random words.
*   **Multiple Modes**: Supports Countdown (Time) and Word Count (Words) modes.
*   **Privacy & Security**: Built with a backend proxy architecture (Serverless), ensuring your API Key is never exposed to the frontend.
*   **Analytics**: Real-time WPM, accuracy statistics, and chart analysis.
*   **Minimalist Design**: Serika Dark theme, focused purely on the typing experience.

## ☁️ Deployment Guide (Vercel)

This project is optimized for Vercel Serverless.

1.  **Fork/Clone** this repository to your GitHub.
2.  Import the project in **Vercel**.
3.  **Configure Environment Variables**:
    To enable AI functionality, add the following variables in your Vercel project settings:
    *   `AI_API_KEY`: Your AI API Key
    *   `AI_API_URL`: Your AI API Endpoint URL
4.  Save and Deploy.

## 🛠️ Local Development

1.  **Prerequisites**
    Ensure Node.js (v18+) is installed.

2.  **Clone the Project**
    ```bash
    git clone https://github.com/your-username/typemaster.git
    cd typemaster
    ```

3.  **Configure Credentials**
    Create a `config.js` file and fill in your Key:
    ```javascript
    // config.js
    module.exports = {
        AI_API_KEY: "your_key_here",
        AI_API_URL: "your_url_here"
    };
    ```

4.  **Start the Server**
    You must start it via the backend server (to proxy API requests):
    ```bash
    node server.js
    ```

5.  **Access**
    Open your browser and visit `http://localhost:8080`

## 📂 Project Structure

*   `/api`: Vercel Serverless Functions (Proxies AI requests)
*   `server.js`: Local development server (Serves static assets + API Proxy)
*   `app.js`: Core frontend logic
*   `config.js`: Local configuration file (Ignored in .gitignore)

---
Designed for Typing Enthusiasts.
