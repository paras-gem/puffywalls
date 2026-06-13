'use client'  
import {Sun, Moon} from "lucide-react"    
import {useTheme} from "next-themes"
import styles from "./DarkModeToggle.module.css";       



export default function DarkModeToggle() {
    const {setTheme,theme} = useTheme();
    return (
        <button className={styles.darkbutton} onClick={()=> setTheme(theme === 'dark' ? 'light' : 'dark')}>
             {theme === 'light' ?  <Sun />: <Moon />}     
        </button>   
    )
}