# Node.js Technical Assessment Project

This is a Node.js-based backend application that processes insurance policy data, manages users, and schedules messages using MongoDB. It includes worker threads for handling large data uploads and real-time CPU monitoring.

## Setup Instructions

1. **Clone the repository**
   ```sh
   git clone <repository-url>
   cd <project-folder>
   ```
2. **Install dependencies**
   ```sh
   npm install
   ```
3. **Start server**
   ```sh
   npm start
   ```

## API Endpoints
1. **Upload a CSV/XLSX file**
    
      POST /upload (Processes and stores data into MongoDB)

2. **Search users and policies by username or email**
   
     GET /search?username=<name>

     GET /search?email=<email>

3. **Aggregate policies grouped by users**
   
     GET /aggregatedPolicy

4. **Schedule a message to be inserted later**

     POST /post-message 

5. **Schedule a message to be inserted later**
   
     POST /post-message

