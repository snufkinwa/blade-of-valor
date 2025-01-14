<p align="center">
<img src="https://imgur.com/TvrHNQV.png" width="500">
<img src="https://imgur.com/QmmwTev.png" width="500">

</p>

<p align="center"><em>Where a struggle between humanity and its creations quietly persists, can you possess free will, or are you part of a greater design?</em></p>

**Blade of Valor** is a 2D game that combines the power of Phaser 3, Next.js, and a FastAPI backend to deliver a unique gameplay experience. The game explores themes of free will and the consequences of actions through a storyline inspired by Grimes' 'Player of Games' and aspects of Legend(1985). The protagonist, Elara, navigates a world filled with ghouls, using her skills in sword combat.

## Introduction

Blade of Valor is a 2D action-adventure game built using Phaser 3 for the game engine and Next.js for the front-end framework. The game leverages a FastAPI backend integrated with Stockfish to provide AI-driven gameplay mechanics.

## Stack

This project includes:

- [Phaser 3](https://github.com/phaserjs/phaser)
- [Next.js ](https://github.com/vercel/next.js)
- [TypeScript](https://github.com/microsoft/TypeScript)
- [FastAPI](https://fastapi.tiangolo.com/)
- [Stockfish]()
- [WebSockets]()

<img src="https://imgur.com/kNBYeB5.png">

## Requirements

- [Node.js](https://nodejs.org)
- [Python 3](https://www.python.org/)
- FastAPI and other Python dependencies (specified in `requirements.txt`)

## Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/blade-of-valor.git
cd blade-of-valor
```

2. Install Node.js dependencies:

```bash
npm install
```

3. Install Python dependencies:

```bash
pip install -r requirements.txt
```

4. Start the FastAPi backend:

```bash
cd api

```

The FastAPI server will run on `http://localhost:5328` by default.

5. Start the Next.js development server:

```bash
npm run dev
```

The development server runs on `http://localhost:8080` by default.

## Project Structure

- `src/` - Contains the Next.js source code.
- `public/` - Static assets for the game.
- `api/` - FastAPI backend code.
- `game/` - Phaser game code.

## React Bridge

The `PhaserGame.tsx` component serves as the bridge between React and Phaser. It initializes the Phaser game and manages events between the two.

## Backend API

The backend API is built with FastAPI and Stockfish. It provides AI-driven features for the game, enhancing the overall gameplay experience. The API endpoints are defined in `main.py`.

## Screenshots

Coming soon

<p align="center">
<img src="https://imgur.com/tqJdAB3.png" width="500">
</p>

## Credits

Sound Effect by <a href="https://pixabay.com/users/freesound_community-46691455/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=105441">freesound_community</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=105441">Pixabay</a>

Music by <a href="https://pixabay.com/users/deuslower-45666444/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=248215">Vlad Bakutov</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=248215">Pixabay</a>

Sound Effect by <a href="https://pixabay.com/users/freesound_community-46691455/?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=102219">freesound_community</a> from <a href="https://pixabay.com//?utm_source=link-attribution&utm_medium=referral&utm_campaign=music&utm_content=102219">Pixabay</a>

UI by <a href = "https://finnmercury.itch.io/"> Finnmercury</a>
