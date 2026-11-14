import type { ImageSourcePropType } from 'react-native';
import type { Game, Place } from '../state/models';

// Images say what the thing is. A game or club shows its sport (the bundled soccer photo; other sports use the photo of the
// place it happens at, which is real). A place shows only its own photo: another park's picture is never passed off as it.
// Never invented: every photo comes from a licensed source. `null` means "no photo": the card shows its neutral backdrop.
const soccerPhoto = require('../../assets/images/hero-soccer.jpg') as ImageSourcePropType;

export function placeImageFor(place: Place): ImageSourcePropType | null {
  const own = place.photos?.[0]?.uri;
  return own ? { uri: own } : null;
}

export function heroImageFor(
  game: Pick<Game, 'sport'>,
  place: Place,
  club?: { photoUri?: string } | null,
): ImageSourcePropType | null {
  if (game.sport === 'soccer') return soccerPhoto;
  const placeImg = placeImageFor(place);
  if (placeImg) return placeImg;
  // Fall back to the club's photo (avatar) so pickleball/trails games always have an image in the feed.
  if (club?.photoUri) return { uri: club.photoUri };
  return null;
}
