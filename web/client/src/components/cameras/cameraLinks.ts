// Outbound viewing options. There is no public camera/stream API, so these
// deep-link to official products. Broadcast rights rotate by season/series —
// update labels/urls here as packages change.

export interface CameraLink {
  label: string;
  description: string;
  url: string;
  kind: 'video' | 'audio' | 'timing';
}

export const CAMERA_LINKS: CameraLink[] = [
  {
    label: 'NASCAR.com Live',
    description: 'Official race hub — leaderboard, lap-by-lap and clips',
    url: 'https://www.nascar.com/live/',
    kind: 'timing',
  },
  {
    label: 'FOX Sports',
    description: 'Cup broadcasts (first half of season)',
    url: 'https://www.foxsports.com/live',
    kind: 'video',
  },
  {
    label: 'Prime Video',
    description: 'Cup mid-season package — includes onboard camera views',
    url: 'https://www.amazon.com/gp/video/sports',
    kind: 'video',
  },
  {
    label: 'TNT Sports / Max',
    description: 'Cup summer package streaming on Max',
    url: 'https://www.max.com',
    kind: 'video',
  },
  {
    label: 'NBC / Peacock',
    description: 'Cup playoffs and season finale',
    url: 'https://www.peacocktv.com/sports/nascar',
    kind: 'video',
  },
  {
    label: 'The CW',
    description: 'Xfinity Series broadcasts',
    url: 'https://www.cwtv.com/sports/',
    kind: 'video',
  },
  {
    label: 'MRN Radio',
    description: 'Motor Racing Network live race audio',
    url: 'https://www.mrn.com/listen-live/',
    kind: 'audio',
  },
  {
    label: 'PRN Radio',
    description: 'Performance Racing Network live race audio',
    url: 'https://www.goprn.com/listen',
    kind: 'audio',
  },
  {
    label: 'SiriusXM NASCAR Radio',
    description: 'Channel 90 — driver/team scanner and race audio',
    url: 'https://www.siriusxm.com/channels/nascar-radio',
    kind: 'audio',
  },
];
