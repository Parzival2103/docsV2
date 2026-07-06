export interface DocItem {
  id: string;
  title: string;
  isApiRef?: boolean;
}

export interface DocSection {
  title: string;
  items: DocItem[];
}

export interface DocContent {
  id: string;
  title: string;
  markdown: string;
}
