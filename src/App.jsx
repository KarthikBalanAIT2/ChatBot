import React, { Suspense } from 'react';

import {Routes, Route} from 'react-router-dom';
import './styles/chatbot.css'
import './styles/bootstrap.min.css'

const Chatbot = React.lazy(() => import('./components/Chatbot/index'));

function App() {
  return (
    <div className="App">

           <Chatbot />

    </div>
  );
}

export default App;
