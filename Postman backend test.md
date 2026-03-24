This is the perfect time to consolidate everything you’ve built. Moving to Postman will give you a much clearer interface for testing than Thunder Client. 

Here is your master plan to test the backend, verify the database, and connect your improved React frontend.

### Phase 1: The Pre-Flight Check (Terminal Setup)
Before opening Postman or your browser, we must ensure all three core engines are running on your Linux Mint machine.

1.  **Start the Database:** Open a terminal and run `sudo systemctl start mongod`.
2.  **Start the AI:** Open a second terminal and run `ollama run llama3.2:1b`.
3.  **Start the Backend:** Open a third terminal, navigate to your backend folder, and run `node server.js`.
    * *Success Indicator:* You should see `🚀 Backend running on http://localhost:5000` and `✅ Connected to MongoDB successfully!`.

---

### Phase 2: Testing the Backend with Postman
Now we simulate a frontend request using your new Postman extension to ensure the Node.js server and Llama are communicating perfectly.

1.  **Create a New Request:** Open Postman, click **New**, and select **HTTP Request**.
2.  **Set the URL:** Change the method from GET to **POST** and enter: `http://localhost:5000/api/analyze-data`.
3.  **Configure the Body (Form-Data):**
    * Click the **Body** tab.
    * Select the **form-data** radio button.
4.  **Add the PDF (`document`):**
    * Under the **Key** column, type `document`.
    * *Crucial Step:* Hover your mouse exactly over the word `document` you just typed. A tiny dropdown that says "Text" will appear. Click it and change it to **File**.
    * Under the **Value** column, click **Select Files** and choose your test PDF.
5.  **Add the JSON (`survey`):**
    * On the next row, type `survey` in the **Key** column (leave the type as Text).
    * In the **Value** column, paste your test JSON: `{"name": "Test Student", "major": "Information Science"}`
6.  **Send & Wait:** Click the blue **Send** button. Watch your backend terminal; you should see the `🤖 Sending data to Llama 3.2 1B...` log.

---

### Phase 3: Confirming the MongoDB Connection
Once Postman returns the AI-generated JSON, let's verify that your backend successfully saved it to the database.

1.  **Open MongoDB Compass:** Launch the Compass GUI from your Mint menu.
2.  **Connect:** Click **Connect** (leaving the URI as `mongodb://localhost:27017`).
3.  **Locate the Data:** Look at the left sidebar for the `tuk-mapping` database. Click on the `profiles` collection.
4.  **Verify:** You should see a document representing the test you just ran in Postman. Expand the `generatedProfile` field to ensure the AI's "skills" and "services" were saved correctly.

---

### Phase 4: Improving and Testing the Frontend
Now that the backend and database are proven to work, we apply the fixes to React so real users can use the system in a browser.

1.  **Apply the UI Fix:** Open your `App.js` file. Ensure you have updated the data mapping in the Dashboard UI section to match Llama's exact output keys:
    * Change `profile.skills` to `profile.acquired_skills`
    * Change `profile.services` to `profile.marketable_services`
    * Change `service.serviceName` to `service.service_name`
2.  **Start the React App:** Open a fourth terminal, navigate to your frontend folder, and run your start command (e.g., `npm run dev` if using Vite).
3.  **The Browser Test:**
    * Open `http://localhost:5173` (or whatever port Vite gives you) in your web browser.
    * Click "Choose File", select a PDF, and click **Generate Profile Dashboard**.
    * *Success Indicator:* The UI should load cleanly, displaying the student's name, the "Extracted Skills" list, and the "Marketable Services" grid cards.

---

**Would you like me to guide you through building the actual "Survey Input Forms" (text boxes for Name, Major, and Career Goal) in your React app so we can replace that hardcoded `dummySurvey` data?**
