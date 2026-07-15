import design1 from '../assets/Design/Design1.png'
import design2 from '../assets/Design/Design2.png'
import design3 from '../assets/Design/Design3.png'
import design4 from '../assets/Design/Design4.png'
import minicard1F from '../assets/Minicard/Minicard1F.png'
import minicard1B from '../assets/Minicard/Minicard1B.png'
import minicard2F from '../assets/Minicard/Minicard2F.png'
import minicard2B from '../assets/Minicard/Minicard2B.png'
import minicard3F from '../assets/Minicard/Minicard3F.png'
import minicard3B from '../assets/Minicard/Minicard3B.png'
import minicard4F from '../assets/Minicard/Minicard4F.png'
import minicard4B from '../assets/Minicard/Minicard4B.png'
import minicard5F from '../assets/Minicard/Minicard5F.png'
import minicard5B from '../assets/Minicard/Minicard5B.png'
import minicard6F from '../assets/Minicard/Minicard6F.png'
import minicard6B from '../assets/Minicard/Minicard6B.png'

export type TemplateCategory = 'minicards' | 'table'

export interface TableTemplate {
  id: string
  title: string
  image: string
  canvaUrl: string
}

export interface MiniCardTemplate {
  id: string
  title: string
  front: string
  back: string
  canvaUrl: string
}

export const tableTemplates: TableTemplate[] = [
  {
    id: 'design-1',
    title: 'Дизайн 1',
    image: design1,
    canvaUrl: 'https://canva.link/pcwhiwjh0czckb3',
  },
  {
    id: 'design-2',
    title: 'Дизайн 2',
    image: design2,
    canvaUrl: 'https://canva.link/allh77b3h7b3o5e',
  },
  {
    id: 'design-3',
    title: 'Дизайн 3',
    image: design3,
    canvaUrl: 'https://canva.link/1dv0gx5p8opfooe',
  },
  {
    id: 'design-4',
    title: 'Дизайн 4',
    image: design4,
    canvaUrl: 'https://canva.link/s1ttid7p0x0vdds',
  },
]

export const miniCardTemplates: MiniCardTemplate[] = [
  {
    id: 'minicard-1',
    title: 'Дизайн 1',
    front: minicard1F,
    back: minicard1B,
    canvaUrl: 'https://canva.link/zy35mxb7xr6pctq',
  },
  {
    id: 'minicard-2',
    title: 'Дизайн 2',
    front: minicard2F,
    back: minicard2B,
    canvaUrl: 'https://canva.link/t5lfq1fzbuw40v3',
  },
  {
    id: 'minicard-3',
    title: 'Дизайн 3',
    front: minicard3F,
    back: minicard3B,
    canvaUrl: 'https://canva.link/oeokwnuxjkj0lbh',
  },
  {
    id: 'minicard-4',
    title: 'Дизайн 4',
    front: minicard4F,
    back: minicard4B,
    canvaUrl: 'https://canva.link/9osfup7l68j17jd',
  },
  {
    id: 'minicard-5',
    title: 'Дизайн 5',
    front: minicard5F,
    back: minicard5B,
    canvaUrl: 'https://canva.link/rjfgzsxpuhwirtm',
  },
  {
    id: 'minicard-6',
    title: 'Дизайн 6',
    front: minicard6F,
    back: minicard6B,
    canvaUrl: 'https://canva.link/tll5b3xajfrfxnk',
  },
]
