import type { ImageSourcePropType } from 'react-native';
import type { Game, Place } from '../state/models';

// Every game gets a cover photo. Order: this place's photo, then a photo of another place where the same sport
// is played, then the bundled soccer photo, then any place photo. Never invented: they all come from licensed sources.
const soccerFallback = require('../../assets/images/hero-soccer.jpg') as ImageSourcePropType;

export function heroImageFor(game: Pick<Game, 'sport'>, place: Place, places: Place[]): ImageSourcePropType | null {
  const own = place.photos?.[0]?.uri;
  if (own) return { uri: own };
  if (game.sport === 'soccer') return soccerFallback;
  const sameSport = places.find((p) => p.sports.includes(game.sport) && p.photos?.length);
  if (sameSport?.photos?.[0]) return { uri: sameSport.photos[0].uri };
  const any = places.find((p) => p.photos?.length);
  return any?.photos?.[0] ? { uri: any.photos[0].uri } : soccerFallback;
}
