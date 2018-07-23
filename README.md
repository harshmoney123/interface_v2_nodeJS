# interface_v2_nodeJS

- Need to install mongodb: 'https://docs.mongodb.com/manual/administration/install-community/'. MongoDB is a database tool.

- Open a terminal, run: 'mongod' (try 'sudo mongod' instead if you have an error). Then open another terminal, run 'mongo'. You can use some mongo cammand to manage the database. See 'https://docs.mongodb.com/manual/mongo/#start-the-mongo-shell' for more commands. Keep these two terminals running in the background.

- Change the credantials (Google) and access keys (Amazon) in SpeechToText.py

- run 'python3 SpeechToText.py speech.wav' first to make sure it works fine

- Open the third terminal run 'node server.js' (need to install NodeJS first)

- go to `http://localhost:3700` in the browser

- click "Log In" on the top right

- Enter your name， the name should be in the database. Click the button to go to the record page

- click the play button, say something and then click stop

- wait for a while

- you can see the content in the tabs