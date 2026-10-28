import type { ImageSourcePropType } from 'react-native';
import type { VideoSource } from 'expo-video';
import type { ClipName, PhotoName } from './posts';

// Clips: Mixkit free license (mixkit.co), cropped to 4:5, muted, ~6s loops.
export const clips: Record<ClipName, { video: VideoSource; poster: ImageSourcePropType }> = {
  penalty: {
    video: require('../../assets/video/penalty.mp4') as VideoSource,
    poster: require('../../assets/video/penalty.jpg') as ImageSourcePropType,
  },
  goal: {
    video: require('../../assets/video/goal.mp4') as VideoSource,
    poster: require('../../assets/video/goal.jpg') as ImageSourcePropType,
  },
  passing: {
    video: require('../../assets/video/passing.mp4') as VideoSource,
    poster: require('../../assets/video/passing.jpg') as ImageSourcePropType,
  },
  match: {
    video: require('../../assets/video/match.mp4') as VideoSource,
    poster: require('../../assets/video/match.jpg') as ImageSourcePropType,
  },
};

export const photos: Record<PhotoName, ImageSourcePropType> = {
  soccer: require('../../assets/images/hero-soccer.jpg') as ImageSourcePropType,
  ride: require('../../assets/images/hero-welcome.jpg') as ImageSourcePropType,
};
