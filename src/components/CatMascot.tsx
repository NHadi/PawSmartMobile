import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Ellipse, G } from 'react-native-svg';

interface CatMascotProps {
  type: 'success' | 'fail';
  size?: number;
}

export const CatMascot: React.FC<CatMascotProps> = ({ type, size = 140 }) => {
  const isSuccess = type === 'success';
  const primaryColor = isSuccess ? '#008236' : '#FF6B6B';
  const catColor = '#4FACFE';
  
  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} viewBox="0 0 200 200">
        {/* Cat Body */}
        <G>
          {/* Body background circles - representing the green parts in the success image */}
          {isSuccess && (
            <>
              <Circle cx="60" cy="140" r="35" fill={primaryColor} opacity="0.9" />
              <Circle cx="140" cy="140" r="35" fill={primaryColor} opacity="0.9" />
            </>
          )}
          
          {/* Main cat head */}
          <Ellipse cx="100" cy="90" rx="45" ry="40" fill={catColor} />
          
          {/* Cat ears */}
          <Path d="M 55 70 L 45 40 L 70 55 Z" fill={catColor} />
          <Path d="M 145 70 L 155 40 L 130 55 Z" fill={catColor} />
          
          {/* Inner ears */}
          <Path d="M 57 60 L 52 48 L 63 55 Z" fill="#89CFF0" />
          <Path d="M 143 60 L 148 48 L 137 55 Z" fill="#89CFF0" />
          
          {/* Eyes */}
          {isSuccess ? (
            <>
              {/* Happy eyes - curved lines */}
              <Path d="M 75 85 Q 80 90 85 85" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round" />
              <Path d="M 115 85 Q 120 90 125 85" stroke="#333" strokeWidth="3" fill="none" strokeLinecap="round" />
            </>
          ) : (
            <>
              {/* Sad eyes */}
              <Circle cx="80" cy="85" r="3" fill="#333" />
              <Circle cx="120" cy="85" r="3" fill="#333" />
              <Path d="M 75 80 Q 80 75 85 80" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round" />
              <Path d="M 115 80 Q 120 75 125 80" stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round" />
            </>
          )}
          
          {/* Nose */}
          <Path d="M 100 95 L 95 100 L 105 100 Z" fill="#FF69B4" />
          
          {/* Mouth */}
          {isSuccess ? (
            <Path d="M 100 100 Q 85 110 70 100 M 100 100 Q 115 110 130 100" 
                  stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round" />
          ) : (
            <Path d="M 100 105 Q 85 95 70 105 M 100 105 Q 115 95 130 105" 
                  stroke="#333" strokeWidth="2" fill="none" strokeLinecap="round" />
          )}
          
          {/* Whiskers */}
          <Path d="M 40 85 L 60 85 M 40 95 L 60 95" stroke="#333" strokeWidth="1.5" strokeLinecap="round" />
          <Path d="M 140 85 L 160 85 M 140 95 L 160 95" stroke="#333" strokeWidth="1.5" strokeLinecap="round" />
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CatMascot;