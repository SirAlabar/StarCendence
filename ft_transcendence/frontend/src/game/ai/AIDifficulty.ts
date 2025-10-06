export enum AIDifficultyLevel 
{
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard'
}

export interface AIDifficultyConfig 
{
  speedMultiplier: number;
  turnSkill: number;
  reactionTime: number;
}

export class AIDifficulty 
{
  private static readonly CONFIGS: Record<AIDifficultyLevel, AIDifficultyConfig> = 
  {
    [AIDifficultyLevel.EASY]: 
    {
      speedMultiplier: 0.80,
      turnSkill: 0.70,
      reactionTime: 0.3
    },
    
    [AIDifficultyLevel.MEDIUM]: 
    {
      speedMultiplier: 0.90,
      turnSkill: 0.85,
      reactionTime: 0.15
    },
    
    [AIDifficultyLevel.HARD]: 
    {
      speedMultiplier: 0.95,
      turnSkill: 0.95,
      reactionTime: 0.05
    }
  };
  
  public static getConfig(level: AIDifficultyLevel): AIDifficultyConfig 
  {
    return { ...this.CONFIGS[level] };
  }
}