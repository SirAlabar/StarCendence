export const neonBackgroundStyles = `
  .pong-selection-overlay {
    position: fixed;
    inset: 0;
    width: 100vw;
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 50;
  }

  .neon-background {
    background: linear-gradient(
      135deg, 
      #0a0a1a 0%, 
      #0d1326 25%, 
      #0b0f24 50%, 
      #141233 75%, 
      #1b1760 100%
    );
    position: relative;
    overflow: hidden;
    flex: 1;
  }

  .neon-background::before {
    content: '';
    position: absolute;
    inset: 0;
    background-image: var(--star-gradients), var(--star-gradients);
    background-repeat: repeat-x;
    background-size: 200vw 100vh, 200vw 100vh;
    background-position: 0% 0%, 200% 0%;
    animation: stars-scroll 25s linear infinite,
               stars-pulse 3s ease-in-out infinite alternate;
    z-index: -10;
  }

  @keyframes stars-scroll {
    0% { background-position: 0% 0%, 200% 0%; }
    100% { background-position: -200% 0%, 0% 0%; }
  }

  @keyframes stars-pulse {
    0% { opacity: 0.4; }
    100% { opacity: 0.8; }
  }
`;