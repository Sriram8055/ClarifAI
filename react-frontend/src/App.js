// src/App.js
import React from "react";
import './styles.css';  // Import the styles.css file
import SearchForm from './SearchForm';

function App() {
    return (
        <div className="App">
            {/* <h1>Developer Error Solution Finder</h1> */}
            <SearchForm />
        </div>
    );
}

export default App;
