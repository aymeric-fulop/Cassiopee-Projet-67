import './App.css';
import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

import { TestStore } from './utils/TestStore'; 

function App() {

  return (
    <div className="App">
      <TestStore/>
    </div>
  );
}

export default App;
