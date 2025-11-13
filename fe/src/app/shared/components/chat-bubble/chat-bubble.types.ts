type position = 'left' | 'right';

export interface ChatBubbleConfig {
  position: position;
  text: string;
  urlFile:string[]
}