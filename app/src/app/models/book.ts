export interface BookCard {
  _id: string;
  title: string;
  coverArt?: string;
  authors?: { _id: string; name: string }[];
  authorName?: string;
}
