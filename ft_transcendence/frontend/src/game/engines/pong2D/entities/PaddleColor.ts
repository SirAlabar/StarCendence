import {Color3} from "babylonjs"


export const PADDLE_COLORS: Record<string, Color3> = 
{
    default: Color3.FromHexString("#00bcd4"),       // cyan-blue
    neon: Color3.FromHexString("#ff00ff"),          // pink-purple glow
    fire: Color3.FromHexString("#ff4500"),          // orange-red
    ice: Color3.FromHexString("#00ffff"),           // icy cyan
    rainbow: Color3.FromHexString("#ffcc00"),       // bright yellow midtone
    matrix: Color3.FromHexString("#00ff00"),        // neon green
    gold: Color3.FromHexString("#ffd700"),          // shiny gold
    shadow: Color3.FromHexString("#333333"),        // dark gray
};

