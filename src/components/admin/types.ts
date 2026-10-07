export type StudioCategory = { id: string; name: string };

export type StudioProject = {
  id: string;
  title: string;
  slug: string;
  description: string;
  youtubeUrl: string;
  client: string | null;
  role: string | null;
  thumbnail: string;
  year: number;
  categories: StudioCategory[];
};
