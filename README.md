## DMM Mindmap Maker

![showcase-screenshot](/showcase-assets/dev-sheet-screenshot-3Oct26.png)

# Pitch

Maybe you take a lot of digital notes and you find at the moment that your thoughts are too unorganized to type them neatly into paragraphs? Or maybe the notes you do take just need to be spatially spread out to show the logical relations between concepts? Well, you already know the answer, you need a mind map. Just grab a pen and paper and sketch away!

Except when you want to do that digitally, the tools are often paid or behind plugins that are difficult to setup or they let you have only a few documents for free. That was the problem I always faced and hence I created this local-first Mind Map Maker called DMM (short for DMM Mindmap Maker!).

# Usage
[Click here](https://debmalya99.github.io/app-mindmap/) and start using it already. Or if you prefer to install and play around with the code see the below section for installation. A sample mind map is also included in the `showcase-assets/` folder.
# Features
- **Local First**: Save your mindmaps into JSON files (.dmm.json) and load them from disk.
- Intuitive Hotkeys: To speed up your workflow. Here's a short guide:
	- Ctrl/Cmd+A: Add a Node
	- Ctrl/Cmd+D: Duplicate a Node
	- Ctrl/Cmd+S: Save the mindmap
	- Ctrl/Cmd+O: Open a mindmap from disk.
	- D: Change connector direction
	- S: Toggle connector direction
	- Esc: Deselect the current node
	- T: Toggle the left side bar
	- Right click: Show the edge or node options
- Lock/Unlock the position of a node.

## Limitations
- For the saving and loading it uses the `File System Access API` which are only supported by Chromium based browsers like Google Chrome, Chromium, Microsoft Edge, Brave among others.
- Firefox, Safari will cause trouble as of now, and I plan to have an alternative in the future.

# Installation
First clone the repository to your local machine, then once in your cloned directory

~~~bash

npm install #installs all the dependencies

npm run dev #starts a development server, likely at the port 3000

npm run build #builds the app into the dist/ folder.

~~~

# Acknowledgement
This project uses Vue JS and VueFlow component. It was largely with a large amount of **AI Assistance** as that problem of creating mind maps easily was something I faced everyday but did not have the proper web development know-how to pull that off on my own. I used **OpenCode** and Big Pickle or Gemini Free Models to largely develop it. Later on when the major features were set in stone, I moved more and more towards manual development. If you are interested to improve the general development, I would encourage you to take a look at the AGENTS.md and improve it.