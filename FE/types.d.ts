// SVG 타입 선언
declare module "*.svg" {
  import React from 'react';
  import { SvgProps } from "react-native-svg";
  const content: React.FC<SvgProps>;
  export default content;
}

// 이미지 타입 선언
declare module "*.png" {
  const value: any;
  export default value;
}

declare module "*.jpg" {
  const value: any;
  export default value;
}

declare module "*.jpeg" {
  const value: any;
  export default value;
}

declare module "*.gif" {
  const value: any;
  export default value;
}

declare module "*.webp" {
  const value: any;
  export default value;
}

// expo-status-bar 타입 선언
declare module 'expo-status-bar' {
  import { Component } from 'react';
  
  export type StatusBarStyle = 'auto' | 'inverted' | 'light' | 'dark';
  
  export interface StatusBarProps {
    style?: StatusBarStyle;
    translucent?: boolean;
    hidden?: boolean;
    backgroundColor?: string;
    networkActivityIndicatorVisible?: boolean;
  }
  
  export class StatusBar extends Component<StatusBarProps> {}
  
  export default StatusBar;
}

