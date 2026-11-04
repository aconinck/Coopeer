import type { ImageSourcePropType } from 'react-native';
import type { PlaceKind, SportId } from '../state/models';

/** Full-scene illustration for each place kind (map pin + detail hero). */
export const placeKindIllustration: Record<PlaceKind, ImageSourcePropType> = {
  park:   require('../../assets/illustrations/park-picnic.webp') as ImageSourcePropType,
  field:  require('../../assets/illustrations/field-soccer.webp') as ImageSourcePropType,
  courts: require('../../assets/illustrations/courts-tennis.webp') as ImageSourcePropType,
  trail:  require('../../assets/illustrations/trail-fork.webp') as ImageSourcePropType,
  center: require('../../assets/illustrations/park-fountain.webp') as ImageSourcePropType,
};

/** Sport sticker image shown in the place detail's "Sports here" horizontal scroll. */
export const sportSticker: Partial<Record<SportId, ImageSourcePropType>> = {
  soccer:     require('../../assets/illustrations/sticker-soccer.webp') as ImageSourcePropType,
  pickleball: require('../../assets/illustrations/sticker-pickleball.webp') as ImageSourcePropType,
  trails:     require('../../assets/illustrations/sticker-trails.webp') as ImageSourcePropType,
};
