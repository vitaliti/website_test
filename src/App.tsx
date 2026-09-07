// import { useState } from 'react'
// import reactLogo from './assets/react.svg'
// import viteLogo from './assets/vite.svg'
// import heroImg from './assets/hero.png'
import './App.css'
import Header from './components/Header'
import Main from './components/Main'
import { ProfileProvider } from "./components/sub_components/ProfileContext";

function App() {
  return (
    <ProfileProvider>
      <Header/>
      <Main/>
    </ProfileProvider>
  )
}

export default App
