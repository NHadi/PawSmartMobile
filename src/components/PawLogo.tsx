import React from 'react';
import Svg, { Path, Circle, G, Defs, LinearGradient, Stop, Ellipse } from 'react-native-svg';

interface PawLogoProps {
  size?: number;
  color?: string;
  gradient?: boolean;
}

export default function PawLogo({ size = 120, color = '#039BE5', gradient = true }: PawLogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        <LinearGradient id="pawGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#039BE5" />
          <Stop offset="100%" stopColor="#0277BD" />
        </LinearGradient>
        <LinearGradient id="pawGradientLight" x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor="#4FC3F7" />
          <Stop offset="100%" stopColor="#039BE5" />
        </LinearGradient>
      </Defs>
      
      <G transform="translate(100, 100)">
        {/* Cross/Plus shape background - mimicking the X pattern from logo */}
        <G opacity="0.15">
          <Path
            d="M -60 -20 L -20 -60 L 20 -60 L 60 -20 L 60 20 L 20 60 L -20 60 L -60 20 Z"
            fill={gradient ? "url(#pawGradientLight)" : color}
          />
        </G>
        
        {/* Main paw pad - larger and more prominent */}
        <Ellipse
          cx="0"
          cy="15"
          rx="28"
          ry="32"
          fill={gradient ? "url(#pawGradient)" : color}
        />
        
        {/* Top left toe pad - positioned for X pattern */}
        <G transform="rotate(-45 0 0)">
          <Ellipse
            cx="-40"
            cy="0"
            rx="15"
            ry="20"
            fill={gradient ? "url(#pawGradient)" : color}
          />
        </G>
        
        {/* Top right toe pad - positioned for X pattern */}
        <G transform="rotate(45 0 0)">
          <Ellipse
            cx="-40"
            cy="0"
            rx="15"
            ry="20"
            fill={gradient ? "url(#pawGradient)" : color}
          />
        </G>
        
        {/* Bottom left toe pad - positioned for X pattern */}
        <G transform="rotate(-135 0 0)">
          <Ellipse
            cx="-40"
            cy="0"
            rx="15"
            ry="20"
            fill={gradient ? "url(#pawGradient)" : color}
          />
        </G>
        
        {/* Bottom right toe pad - positioned for X pattern */}
        <G transform="rotate(135 0 0)">
          <Ellipse
            cx="-40"
            cy="0"
            rx="15"
            ry="20"
            fill={gradient ? "url(#pawGradient)" : color}
          />
        </G>
        
        {/* Center highlight for depth */}
        <Ellipse
          cx="0"
          cy="10"
          rx="12"
          ry="14"
          fill={gradient ? "url(#pawGradientLight)" : color}
          opacity="0.3"
        />
      </G>
    </Svg>
  );
}