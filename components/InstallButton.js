'use client';  // client-side rendering

import { useState, useEffect} from 'react';

export default function InstallButton() {

  // custom react hooks: always starts with use

  const [deferredPrompt, setDeferredPrompt] = useState(null); 
  const [isInstallable, setIsInstallable] = useState(false);

  // component state management

  // DeferredPrompt: stores the default installation raw object sent by chrome
  // isInstallable: shows the button when app is installable  

    // useEffect is used to register the event listener and maintain it's lifecycle

    useEffect(() => {

      // beforeinstallprompt is an event that is fired when the browser detects that the app is installable
      // preventDefault() stops the default browser installation prompt
      // setDeferredPrompt(e) stores the default installation raw object sent by chrome
      // setIsInstallable(true) shows the button when app is installable  
      
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();

      setDeferredPrompt(e);

      setIsInstallable(true);
      console.log("native install button is activated");

    };

    window.addEventListener("beforeinstallprompt",  handleBeforeInstallPrompt);

    return () => {window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt)}; 
      
  }, []); // empty  array so that it runs once  


  const handleInstallClick = async() => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    const {outcome} = await deferredPrompt.userChoice;
    if(outcome === 'accepted') {
      console.log("install button clicked"); // fired when the install button is clicked
    }

    setDeferredPrompt(null); // when the app is  being installed it will be reset 
    setIsInstallable(false);  // and the button will be hidden. 
  };

       
 
} 