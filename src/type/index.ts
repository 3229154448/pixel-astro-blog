export interface NavItem { name: string; link: string; icon?: string; }
export interface PostFrontmatter {
  title: string; description: string; cover?: string; date: Date;
  updated?: Date; tags: string[]; categories: string[];
  draft: boolean; pin: boolean; toc: boolean; comment: boolean; reward: boolean; livePhoto: boolean;
}
export interface FriendItem { name: string; link: string; avatar: string; description: string; }
export interface TalkingItem { content: string; date: string; tags?: string[]; images?: string[]; }
export interface LinkItem { name: string; link: string; avatar: string; description: string; }
